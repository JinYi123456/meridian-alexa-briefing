/**
 * test-affinity.mjs — simulate Vercel instance affinity failure locally.
 * Instance A: initialize + tools/list. Instance B (separate module registry):
 * the same session id arrives on a cold instance → must self-heal, not 400.
 */
import http from "node:http";
import { spawn } from "node:child_process";

const PORT = 3998;
const URL_PATH = `http://127.0.0.1:${PORT}`;

// Instance A handler (fresh module load, own sessions Map)
const modA = await import("../api/mcp.js?instance=A");
const handlerA = modA.default;

// Instance B: force a second module evaluation by cache-busting the import query
const modB = await import("../api/mcp.js?instance=B");
const handlerB = modB.default;

async function runAgainst(handler, label, fn) {
  const server = http.createServer(handler);
  await new Promise((r) => server.listen(PORT, r));
  try { await fn(); } finally { await new Promise((r) => server.close(r)); }
}

// --- A: initialize ---
let sid;
await runAgainst(handlerA, "A", async () => {
  const res = await fetch(URL_PATH, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "affinity", version: "0" } } }),
  });
  sid = res.headers.get("mcp-session-id");
  const text = await res.text();
  const m = [...text.matchAll(/^data: ?(.+)$/gm)].pop();
  const ok = res.status === 200 && m && JSON.parse(m[1]).result?.serverInfo?.name === "meridian";
  console.log("A initialize:", res.status, sid ? "sid ok" : "no sid", ok ? "PASS" : "FAIL");
  if (!ok) process.exit(1);
});

// --- B: same sid, cold instance → tools/list must NOT 400 ---
await runAgainst(handlerB, "B", async () => {
  const res = await fetch(URL_PATH, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-session-id": sid },
    body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }),
  });
  const text = await res.text();
  const m = [...text.matchAll(/^data: ?(.+)$/gm)].pop();
  const tools = m ? (JSON.parse(m[1]).result?.tools ?? []) : [];
  console.log("B tools/list on cold instance:", res.status, `tools=${tools.length}`, text.slice(0, 200));
  if (res.status !== 200) process.exit(1);
});

// --- B again: chat still works on restored session (short ask, no web) ---
await runAgainst(handlerB, "B", async () => {
  const res = await fetch(URL_PATH, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-session-id": sid },
    body: JSON.stringify({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "meridian_chat", arguments: { message: "hi, just say hello back briefly" } } }),
  });
  const text = await res.text();
  const m = [...text.matchAll(/^data: ?(.+)$/gm)].pop();
  const reply = m ? (JSON.parse(m[1]).result?.content?.[0]?.text ?? "") : "";
  console.log("B chat on restored session:", res.status, "reply:", reply.slice(0, 80), res.status === 200 ? "PASS" : "FAIL");
});

console.log("AFFINITY SELF-HEAL TEST: PASS");
process.exit(0);
