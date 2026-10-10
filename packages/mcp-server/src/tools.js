/**
 * tools.js - single source of truth for Meridian's tools.
 * Used two ways:
 *  1. Registered as MCP tools by the server (index.js)
 *  2. Routed to the Gemini agent loop via agentRouter (below)
 */
import { randomUUID } from "node:crypto";

export function createToolContext({ sessionId, sessions, tryPush }) {
  const ctx = {
    async current_time() {
      const now = new Date();
      return {
        iso: now.toISOString(),
        day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][now.getDay()],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    },

    async push_progress({ step, kind = "plan" }) {
      sessions.get(sessionId)?.pending?.push({ step, kind });
      await tryPush(sessionId, { type: "progress", step, kind, at: Date.now() });
      return { streamed: step };
    },

    async write_canvas({ blocks }) {
      const entry = sessions.get(sessionId);
      if (!entry) return { error: "no session" };
      entry.canvas.blocks = blocks;
      await tryPush(sessionId, { type: "canvas", blocks });
      return { ok: true, count: blocks.length };
    },

    async read_canvas() {
      const entry = sessions.get(sessionId);
      return { blocks: entry?.canvas.blocks ?? [] };
    },

    async reprioritize({ draggedId, newDay, newStart }) {
      const entry = sessions.get(sessionId);
      if (!entry) return { error: "no session" };
      entry.canvas.blocks = entry.canvas.blocks.map((b) =>
        b.id === draggedId ? { ...b, day: newDay, start: newStart } : b
      );
      await tryPush(sessionId, { type: "canvas", blocks: entry.canvas.blocks });
      await tryPush(sessionId, { type: "progress", step: "re-balanced schedule after your move", kind: "compute" });
      return { ok: true, count: entry.canvas.blocks.length };
    },

    async notify_later({ message, deliverAtEpochMs }) {
      const delay = deliverAtEpochMs ? Math.max(0, deliverAtEpochMs - Date.now()) : 15_000;
      setTimeout(() => {
        tryPush(sessionId, { type: "proactive", message }).catch(() => {});
      }, delay);
      return { queued: message, deliverAtEpochMs: deliverAtEpochMs || Date.now() + delay };
    },

    async search_web({ query }) {
      const key = process.env.TAVILY_API_KEY;
      if (!key) return { note: "TAVILY_API_KEY not set; web search disabled" };
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        body: JSON.stringify({ query, max_results: 3 }),
      });
      if (!res.ok) return { error: `tavily ${res.status}` };
      const data = await res.json();
      return {
        results: (data.results || []).map((r) => ({ title: r.title, url: r.url, snippet: r.content?.slice(0, 300) })),
      };
    },
  };

  return ctx;
}

export const toolDeclarations = {
  current_time: {
    description: "Returns the user's current local time, day of week and timezone.",
    parameters: { type: "object", properties: {} },
  },
  push_progress: {
    description: "Stream an orchestration step into the user's live canvas UI as you work.",
    parameters: {
      type: "object",
      properties: {
        step: { type: "string" },
        kind: { type: "string", enum: ["plan", "lookup", "compute", "commit"] },
      },
      required: ["step"],
    },
  },
  write_canvas: {
    description: "Commit the structured schedule blocks onto the 2-day canvas.",
    parameters: {
      type: "object",
      properties: {
        blocks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              day: { type: "string", enum: ["today", "tomorrow"] },
              start: { type: "string" },
              dur: { type: "number" },
              title: { type: "string" },
              tag: { type: "string", enum: ["travel", "work", "family", "health", "deposit"] },
              note: { type: "string" },
            },
            required: ["id", "day", "start", "dur", "title"],
          },
        },
      },
      required: ["blocks"],
    },
  },
  read_canvas: {
    description: "Read current canvas blocks for re-planning.",
    parameters: { type: "object", properties: {} },
  },
  reprioritize: {
    description: "The user dragged a canvas block; recompute conflicts and confirm the new arrangement.",
    parameters: {
      type: "object",
      properties: {
        draggedId: { type: "string" },
        newDay: { type: "string", enum: ["today", "tomorrow"] },
        newStart: { type: "string" },
      },
      required: ["draggedId", "newDay", "newStart"],
    },
  },
  notify_later: {
    description: "Register a reminder the server will proactively push over the GET stream.",
    parameters: {
      type: "object",
      properties: {
        message: { type: "string" },
        deliverAtEpochMs: { type: "number" },
      },
      required: ["message"],
    },
  },
  search_web: {
    description: "Search the web for up-to-date facts relevant to the plan.",
    parameters: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
};

/**
 * agentRouter - bridges Gemini's function-calling loop to the shared tool ctx.
 */
export function createAgentRouter({ ctx, onEvent }) {
  return {
    declarations() {
      return Object.entries(toolDeclarations).map(([name, decl]) => ({
        name,
        description: decl.description,
        parameters: decl.parameters,
      }));
    },
    onText(text) {
      onEvent?.({ type: "assistant_text", text });
    },
    async call(name, args) {
      const fn = ctx[name];
      if (!fn) return { error: `unknown tool ${name}` };
      try {
        const started = Date.now();
        const out = await fn(args || {});
        onEvent?.({ type: "tool_done", tool: name, ms: Date.now() - started });
        return out;
      } catch (e) {
        return { error: String(e?.message || e) };
      }
    },
  };
}

/**
 * mcpToolShapes - Zod raw shapes for MCP registerTool (SDK rejects JSON Schema).
 * Mirrors toolDeclarations above; kept alongside so the two never drift apart.
 */
export function getMcpToolShapes(z) {
  return {
    current_time: {},
    push_progress: {
      step: z.string().describe("Short orchestration step label"),
      kind: z.enum(["plan", "lookup", "compute", "commit"]).optional(),
    },
    write_canvas: {
      blocks: z.array(
        z.object({
          id: z.string(),
          day: z.enum(["today", "tomorrow"]),
          start: z.string(),
          dur: z.number(),
          title: z.string(),
          tag: z.enum(["travel", "work", "family", "health", "deposit"]).optional(),
          note: z.string().optional(),
        })
      ),
    },
    read_canvas: {},
    reprioritize: {
      draggedId: z.string(),
      newDay: z.enum(["today", "tomorrow"]),
      newStart: z.string(),
    },
    notify_later: {
      message: z.string(),
      deliverAtEpochMs: z.number().optional(),
    },
    search_web: {
      query: z.string(),
    },
  };
}
