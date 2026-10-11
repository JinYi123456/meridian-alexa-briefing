/**
 * e2e-sim.mjs - headless simulated Alexa+ host over Streamable HTTP.
 * Verifies: initialize -> initialized(202) -> GET SSE -> meridian_chat (live Gemini)
 *           -> server-push progress/canvas notifications -> resources/read canvas html.
 * Run: node packages/mcp-server/e2e-sim.mjs "a messy sentence here"
 */
const BASE = "http://localhost:3001/mcp";
let rpcId = 1;

async function post(body, sid) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      ...(sid ? { "mcp-session-id": sid } : {}),
      "mcp-protocol-version": "2025-11-25",
    },
    body: JSON.stringify(body),
  });
  const newSid = res.headers.get("mcp-session-id");
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return { status: res.status, sid: newSid, json: await res.json() };
  }
  const text = await res.text();
  let json = null;
  for (const chunk of text.split("\n\n")) {
    if (chunk.startsWith("data:")) json = JSON.parse(chunk.slice(5).trim());
  }
  return { status: res.status, sid: newSid, json };
}

// capture GET-stream pushes in the background
const pushes = [];
let streamDone = null;
function openStream(sid) {
  const ctrl = new AbortController();
  streamDone = (async () => {
    const res = await fetch(BASE, {
      method: "GET",
      headers: { accept: "text/event-stream", "mcp-session-id": sid },
      signal: ctrl.signal,
    });
    if (!res.ok || !res.body) return;
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf("\n\n")) >= 0) {
        const raw = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        for (const line of raw.split("\n")) {
          if (line.startsWith("data:")) {
            try {
              const j = JSON.parse(line.slice(5).trim());
              if (j?.params?.data) pushes.push(JSON.parse(j.params.data));
            } catch {}
          }
        }
      }
    }
  })().catch(() => {});
  return ctrl;
}

const utterance = process.argv[2] || "Flying to Taipei Wednesday for a client, report due Thursday, dad's birthday this weekend and dinner not booked.";

function safeAtob(s) { if (!s) return ""; try { return Buffer.from(s, "base64").toString("utf8"); } catch { return ""; } }

// 1. initialize
const init = await post({ jsonrpc: "2.0", id: rpcId++, method: "initialize", params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "e2e-sim", version: "1" } } });
const sid = init.sid;
console.log(`initialize        : ${init.status} (${init.json?.result?.serverInfo?.name} @ ${init.json?.result?.protocolVersion})`);
if (!sid) throw new Error("no session id");

// 2. initialized notification
const note = await post({ jsonrpc: "2.0", method: "notifications/initialized" }, sid);
console.log(`initialized note  : ${note.status}`);

// 3. open GET SSE push stream
const ctrl = openStream(sid);

// 4. resources/read canvas
const rres = await post({ jsonrpc: "2.0", id: rpcId++, method: "resources/read", params: { uri: "ui://meridian/canvas.html" } }, sid);
const canvasBlob = rres.json?.result?.contents?.[0];
const canvasHtml = safeAtob(canvasBlob?.blob) || canvasBlob?.text || "";
console.log(`resources/read    : ${rres.status} canvas ${canvasHtml.length} bytes`);

// 5. meridian_chat (live agent loop)
console.log(`meridian_chat     : sending "${utterance.slice(0, 60)}..."`);
const t0 = Date.now();
const chat = await post({ jsonrpc: "2.0", id: rpcId++, method: "tools/call", params: { name: "meridian_chat", arguments: { message: utterance } } }, sid);
const secs = ((Date.now() - t0) / 1000).toFixed(1);
const reply = chat.json?.result?.content?.[0]?.text ?? "";
console.log(`meridian_chat     : ${chat.status} in ${secs}s, reply ${reply.length} chars`);
console.log(`reply head        : ${reply.slice(0, 140).replace(/\n/g, " ")}`);

// 6. inspect pushes
await new Promise((r) => setTimeout(r, 500));
ctrl.abort();
const kinds = {};
for (const p of pushes) kinds[p.type] = (kinds[p.type] || 0) + 1;
console.log(`sse pushes        : ${pushes.length} total -> ${JSON.stringify(kinds)}`);
const canvasPush = pushes.find((p) => p.type === "canvas");
console.log(`canvas push       : ${canvasPush ? canvasPush.blocks.length + " blocks, first: " + canvasPush.blocks[0]?.title : "NONE"}`);
const progress = pushes.filter((p) => p.type === "progress");
console.log(`progress steps    : ${progress.map((p) => '"' + (p.step || "").slice(0, 30) + '"').join(", ") || "NONE"}`);

let fail = 0;
if (!reply.length) { console.log("FAIL: empty reply"); fail = 1; }
if (!canvasPush) { console.log("FAIL: no canvas push"); fail = 1; }
if (!progress.length) { console.log("FAIL: no progress pushes"); fail = 1; }
console.log(fail ? "E2E: FAILED" : "E2E: ALL PASS");
process.exit(fail);
