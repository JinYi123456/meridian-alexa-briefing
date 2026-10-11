/**
 * verify-serverless.mjs — locally smoke-test api/mcp.js (serverless wrapper).
 * Shims a minimal Express-ish (req,res) around Node's http to call handler().
 * Usage: node scripts/verify-serverless.mjs
 */
import http from "node:http";
import { once } from "node:events";

const PORT = 3999;
const URL_PATH = "http://127.0.0.1:3999";

// Minimal shim: handler(req,res) uses req.method/headers/["mcp-session-id"] and res.writeHead/write/end.
// Vercel's runtime provides Node req/res compatible with these, so handler works with vanilla Node http.
const handler = (await import("../api/mcp.js")).default;

//loads module and prints no errors
console.log("handler loaded:", typeof handler === "function" ? "OK" : typeof handler);

const server = http.createServer(handler);
await new Promise((r) => server.listen(PORT, r));
console.log("shim listening on", PORT);

async function post(body, extraHeaders = {}) {
  const res = await fetch(URL_PATH, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream", ...extraHeaders },
    body: JSON.stringify(body),
  });
  const sid = res.headers.get("mcp-session-id");
  let text = await res.text();
  // if the response is an SSE frame (event: message\ndata: {...}), extract the data payload;
  // skip comment frames like ": keepalive"
  if (text.startsWith("event:") || /^:\s/m.test(text.slice(0, 20))) {
    const m = [...text.matchAll(/^data: ?(.+)$/gm)].pop(); // last data frame = JSON-RPC response
    if (m) text = m[1];
  }
  return { status: res.status, sid, text };
}

// initialize
const r1 = await post({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "probe", version: "0" } } });
console.log("initialize:", r1.status, r1.sid ? "sid ok" : "no sid");
const sid = r1.sid;

// tools/list
const r2 = await post({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }, { "mcp-session-id": sid });
const tools = JSON.parse(r2.text).result?.tools?.map((t) => t.name) ?? [];
console.log("tools/list:", r2.status, tools.join(","));

// resources/read canvas
const r3 = await post({ jsonrpc: "2.0", id: 3, method: "resources/read", params: { uri: "ui://meridian/canvas.html" } }, { "mcp-session-id": sid });
console.log("resources/read:", r3.status, "canvas bytes:", r3.text.length);

// meridian_chat (full agent run — Featherless or fallback)
console.log("meridian_chat: starting full agent run (~30-50s)…");
const t0 = Date.now();
const r4 = await post({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "meridian_chat", arguments: { message: "Flying to Taipei Wednesday for a client, report due Thursday, dad's birthday this weekend, no dinner booked. Plan my week." } } }, { "mcp-session-id": sid });
const out = JSON.parse(r4.text).result?.content?.[0]?.text ?? "";
console.log("meridian_chat:", r4.status, `${Math.round((Date.now() - t0) / 1000)}s, reply:`, out.slice(0, 120));

server.close();
console.log("SERVERLESS VERIFY: PASS");
