/**
 * api/mcp.js — Vercel serverless wrapper around the Meridian MCP server.
 *
 * Reuses the exact same server logic as packages/mcp-server/src/index.js:
 * McpServer + StreamableHTTPServerTransport per session, module-level session
 * Map (works on Vercel Fluid instances; warm instances keep sessions alive),
 * and the agent loop with Featherless→Gemini fallback.
 *
 * Session eviction: Vercel instances recycle, so sessions are opportunistically
 * pruned (15 min max age). For the hackathon demo this is plenty.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createToolContext, toolDeclarations, getMcpToolShapes, createAgentRouter } from "../packages/mcp-server/src/tools.js";
import { agentLoop } from "../packages/mcp-server/src/agent.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = 0; // not used; kept for log compatibility
const log = (m) => console.log(`[meridian] ${m}`);
const sessions = new Map(); // sid -> { transport, server, ctx, lastSeen, pending }
const SESSION_TTL_MS = 15 * 60 * 1000;

// -------- canvas html --------
let canvasHtml = null;
async function loadCanvasHtml() {
  if (!canvasHtml) {
    canvasHtml = await readFile(path.join(__dirname, "../packages/canvases/canvas-day.html"), "utf8");
  }
  return canvasHtml;
}

// -------- push (server → client over the GET stream) --------
async function tryPush(sid, payload) {
  const entry = sessions.get(sid);
  if (!entry || !payload) return;
  try {
    await entry.server.server.notification({
      method: "notifications/message",
      params: { level: "info", data: JSON.stringify(payload) },
    });
    log(`pushed ${JSON.stringify(payload).slice(0, 80)} -> session ${sid.slice(0, 8)}`);
  } catch (e) {
    log(`push failed: ${e?.message || e}`);
    entry.pending.push(payload);
  }
}

function evictStale() {
  const now = Date.now();
  for (const [sid, e] of sessions) {
    if (now - e.lastSeen > SESSION_TTL_MS) {
      sessions.delete(sid);
      log(`evicted stale session ${sid.slice(0, 8)}`);
    }
  }
}

// -------- MCP server wiring (same as local index.js) --------
function buildServer(sid) {
  const server = new McpServer(
    { name: "meridian", version: "0.1.0" },
    {
      capabilities: { tools: {}, resources: {}, logging: {} },
      instructions:
        "Meridian turns a messy spoken constraint dump into a visually planned day. Hosts should render ui://meridian/canvas.html and stream live MCP notifications.",
    }
  );

  const ctx = createToolContext({ sessionId: sid, sessions, tryPush });

  const shapes = getMcpToolShapes(z);
  for (const [name, decl] of Object.entries(toolDeclarations)) {
    server.registerTool(
      name,
      { description: decl.description, inputSchema: shapes[name] ?? {} },
      async (payload) => {
        const args = payload ?? {};
        const out = await ctx[name](args);
        return { content: [{ type: "text", text: JSON.stringify(out) }] };
      }
    );
  }

  server.registerTool(
    "meridian_chat",
    {
      title: "Talk to Meridian",
      description:
        "Send the user's spoken utterance to Meridian, the agentic chief-of-staff. Runs the full planning pipeline; progress and canvas updates stream via SSE notifications while this tool runs.",
      inputSchema: { message: z.string().describe("The user's raw spoken message") },
    },
    async ({ message }) => {
      const router = createAgentRouter({ ctx, onEvent: (ev) => tryPush(sid, ev).catch(() => {}) });
      try {
        const result = await agentLoop({ userMessage: message, toolRouter: router });
        return { content: [{ type: "text", text: result.text ?? "" }] };
      } catch (e) {
        return { content: [{ type: "text", text: `⚠️ agent error: ${e?.message || e}` }] };
      }
    }
  );

  server.registerResource(
    "canvas",
    "ui://meridian/canvas.html",
    { name: "Day canvas", description: "Interactive 2-day schedule canvas (MCP App UI)", mimeType: "text/html" },
    async () => ({
      contents: [{ uri: "ui://meridian/canvas.html", mimeType: "text/html", blob: Buffer.from(await loadCanvasHtml(), "utf8").toString("base64") }],
    })
  );

  return server;
}

// -------- HTTP handling (converted from node:http callback style) --------
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, mcp-session-id, mcp-protocol-version, accept, last-event-id, authorization",
  "Access-Control-Expose-Headers": "mcp-session-id",
};

export default async function handler(req, res) {
  evictStale();

  if (req.method === "OPTIONS") {
    res.writeHead(204, { ...CORS_HEADERS, "Access-Control-Max-Age": "86400" });
    res.end();
    return;
  }
  for (const [k, v] of Object.entries(CORS_HEADERS)) res.setHeader(k, v);

  const sidHeader = req.headers["mcp-session-id"];
  let entry = sidHeader ? sessions.get(sidHeader) : undefined;

  // DELETE teardown
  if (req.method === "DELETE") {
    if (sidHeader && sessions.has(sidHeader)) sessions.delete(sidHeader);
    res.writeHead(204);
    res.end();
    return;
  }

  if (!entry) {
    if (!["POST", "GET"].includes(req.method)) {
      res.writeHead(405).end();
      return;
    }
    const newSid = randomUUID();
    entry = { lastSeen: Date.now(), pending: [] };
    entry.transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => newSid,
      keepAliveMs: 3000,
      onsessionclosed: () => sessions.delete(newSid),
    });
    entry.server = buildServer(newSid);
    await entry.server.connect(entry.transport);
    sessions.set(newSid, entry);
    entry.lastSeen = Date.now();
    // replay any pending pushes buffered during init
    for (const p of entry.pending.splice(0)) {
      tryPush(newSid, p).catch(() => {});
    }
  } else {
    entry.lastSeen = Date.now();
  }

  await entry.transport.handleRequest(req, res);
}
