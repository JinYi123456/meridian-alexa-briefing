/**
 * Meridian MCP Server - spec 2025-11-25, Streamable HTTP.
 *
 * POP /mcp: JSON-RPC (initialize -> session, tools/call, resources/read)
 * GET /mcp: SSE stream for server->client push (progress, canvas updates, proactive reminders)
 *
 * The simulated Alexa+ host calls `meridian_chat` with the user utterance;
 * the server runs a Gemini tool-calling loop; every step is streamed to the
 * canvas UI live. Canvas is exposed as an `ui://` resource (MCP Apps pattern)
 * that the host renders in a sandboxed iframe and drives via postMessage.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createToolContext, toolDeclarations, getMcpToolShapes, createAgentRouter } from "./tools.js";
import { agentLoop } from "./agent.js";
import { log } from "./util.js";

// Load .env from the workspace root (no dotenv dep: minimal key=value parsing).
import { readFileSync } from "node:fs";
for (const envPath of [new URL("../../../.env", import.meta.url), new URL("../.env", import.meta.url)]) {
  try {
    for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^\"|\"$/g, "");
      }
    }
    break; // first .env found wins
  } catch {}
}

const PORT = Number(process.env.PORT) || 3001;
const sessions = new Map();
let canvasHtml = null; // loaded once, served as ui:// resource

const httpServer = createServer(async (req, res) => {
  const origin = req.headers.origin;
  // DNS rebinding protection per spec - allow our simulator origin & localhost.
  const originOk = !origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

  if (req.method === "OPTIONS") {
    if (!originOk) {
      res.writeHead(403).end();
      return;
    }
    res.writeHead(204, {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "content-type, mcp-session-id, mcp-protocol-version, accept, last-event-id, authorization",
      "Access-Control-Expose-Headers": "mcp-session-id",
      "Access-Control-Max-Age": "86400",
    }).end();
    return;
  }

  if (!originOk) {
    res.writeHead(403).end(JSON.stringify({ error: "forbidden origin" }));
    return;
  }

  // CORS response headers for the actual request
  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  res.setHeader("Access-Control-Expose-Headers", "mcp-session-id");
  if (req.url === "/mcp") {
    try {
      if (req.method === "POST") await handlePost(req, res);
      else if (req.method === "GET") await handleGet(req, res);
      else if (req.method === "DELETE") {
        const sid = req.headers["mcp-session-id"];
        if (sid && sessions.has(sid)) sessions.delete(sid);
        res.writeHead(204).end();
      } else res.writeHead(405).end();
    } catch (e) {
      log(`request error: ${e?.stack || e?.message || e}`);
      if (!res.headersSent) res.writeHead(500).end(JSON.stringify({ error: "internal" }));
    }
    return;
  }
  res.writeHead(404).end();
});

async function handlePost(req, res) {
  // Notifications carry no body; an empty-body POST must not be JSON-parsed.
  const rawBody = await new Promise((resolve) => {
    let d = "";
    req.on("data", (c) => (d += c));
    req.on("end", () => resolve(d));
    req.on("error", () => resolve(""));
  });
  let body;
  try {
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    res.writeHead(400).end(JSON.stringify({ error: "bad JSON body" }));
    return;
  }
  const sidHeader = req.headers["mcp-session-id"];
  let entry = sidHeader ? sessions.get(sidHeader) : undefined;

  if (!entry) {
    if (body?.method !== "initialize") {
      res.writeHead(400).end(JSON.stringify({ error: "no session; send initialize first" }));
      return;
    }
    const newSid = randomUUID();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => newSid,
      enableJsonResponse: true,
      keepAliveMs: 3000,
      onsessionclosed: () => sessions.delete(newSid),
    });
    const server = buildServer(newSid);
    await server.connect(transport);
    entry = { transport, server, sid: newSid, canvas: { blocks: [], progress: [] }, pending: [] };
    sessions.set(newSid, entry);
  } else if (body?.method === "initialize") {
    res.writeHead(400).end(JSON.stringify({ error: "session already initialized" }));
    return;
  }

  await entry.transport.handleRequest(req, res, body);
}

async function handleGet(req, res) {
  const sid = req.headers["mcp-session-id"];
  const entry = sid ? sessions.get(sid) : undefined;
  if (!entry) {
    res.writeHead(400).end();
    return;
  }
  // Single handleRequest path serves both POST (JSON-RPC) and GET (SSE push)
  await entry.transport.handleRequest(req, res);
}

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

  // Register every tool from the single source of truth, MCP-shaped.
  const shapes = getMcpToolShapes(z);
  for (const [name, decl] of Object.entries(toolDeclarations)) {
    server.registerTool(
      name,
      { description: decl.description, inputSchema: shapes[name] ?? {} },
      async (payload) => {
        // SDK passes (toolArgs, extra); toolArgs is the parsed Zod output
        const args = payload ?? {};
        const out = await ctx[name](args);
        return { content: [{ type: "text", text: JSON.stringify(out) }] };
      }
    );
  }

  // The entry point the simulated Alexa+ host calls.
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
        const msg = e?.message || String(e);
        if (msg.includes("GEMINI_API_KEY")) {
          return { content: [{ type: "text", text: "Set GEMINI_API_KEY in .env to enable the agent brain - the deterministic tools (current_time, canvas, reprioritize) still work." }] };
        }
        throw e;
      }
    }
  );

  // MCP Apps pattern: the canvas UI is a resource the host renders in an iframe.
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

async function loadCanvasHtml() {
  if (!canvasHtml) canvasHtml = await readFile(new URL("../../canvases/canvas-day.html", import.meta.url), "utf8");
  return canvasHtml;
}

async function tryPush(sid, payload) {
  const entry = sessions.get(sid);
  if (!entry || !payload) return;
  try {
    // entry.server = McpServer wrapper; entry.server.server = underlying Protocol/Server
    await entry.server.server.notification({
      method: "notifications/message",
      params: { level: "info", data: JSON.stringify(payload) },
    });
    log(`pushed ${JSON.stringify(payload).slice(0, 80)} -> session ${sid.slice(0, 8)}`);
  } catch (e) {
    log(`push failed: ${e?.message || e}`);
    entry.pending.push(payload); // buffer until the client's GET stream opens
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

httpServer.listen(PORT, () => {
  log(`Meridian MCP server ready on :${PORT} (spec 2025-11-25, Streamable HTTP)`);
  if (!process.env.GEMINI_API_KEY) log("WARN: GEMINI_API_KEY not set - agent brain disabled, deterministic tools still work");
});
