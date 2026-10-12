# Devpost Submission Kit — Meridian

Everything below is written to be **pasted directly into the Devpost form**.
Files you must upload are listed in §10. Replace bracketed placeholders before submitting.

---

## 1. General info

**Project name** (≤60 chars)

```
Meridian — Speak the chaos. Watch the plan assemble.
```

**Elevator pitch** (≤200 chars)

```
A self-hosted MCP server (spec 2025-11-25) that turns one messy spoken sentence into a live, draggable 2-day plan — an interactive MCP App inside an Alexa+ chat client.
```

**Project type:** new project (started after Aug 31, 2026 — confirm against your git history; if any code predates the window, describe what was built during the window instead).

---

## 2. About the project (public page, Markdown)

```markdown
## Inspiration

Hackathon weeks sound like this: *"I fly Wednesday, the report is Thursday, dad's birthday is— wait, when? I haven't booked dinner, the landlord wants the deposit…"* Real life doesn't arrive as structured data — it arrives as chaos. Alexa hears it all, but today's voice assistants answer **one question at a time**. We wanted an assistant that takes the whole mess in one breath and gives you back a plan you can *see* and *touch* — not a wall of text.

We also wanted to build on the frontier of the MCP ecosystem: the new **MCP Apps** pattern (SEP-1865), where a tool doesn't just return text — it returns a **live, interactive UI resource** rendered inside the conversation.

## What it does

Meridian is a **self-hosted MCP server** (official spec `2025-11-25`, Streamable HTTP) with an agentic chief-of-staff brain. One messy sentence — typed or **spoken** via the mic button — and the agent:

- streams its steps live into the chat (`push_progress`) so you watch it think,
- checks the real clock, searches the web (Tavily), and commits a concrete **two-day schedule** onto an interactive canvas,
- renders that canvas as an **MCP App** (`ui://` resource) docked next to the chat, drawn from the server over the wire,
- **re-plans in real time when you drag any block** — dragging fires the `reprioritize` tool over MCP and the whole schedule rebalances,
- keeps watching: scheduled **reminders push over the SSE stream after you stop talking**,
- **answers in your language** — English, Chinese, Malay, anything,
- any standard MCP client (Claude Desktop, VS Code) can connect to the same server.

## How we built it

- **`packages/mcp-server`** — Node + official `@modelcontextprotocol/sdk`: one `/mcp` endpoint, POST JSON-RPC + standalone GET SSE, session IDs, origin validation, DELETE teardown, `keepAliveMs` keep-alives.
- **`packages/canvases/canvas-day.html`** — the MCP App: a self-contained HTML hour-grid (06:00–22:00 × 2 days). Served as a `ui://meridian/canvas.html` resource (base64 blob), rendered by the host in a sandboxed iframe, driven by postMessage.
- **`packages/simulator`** — a simulated Alexa+ client that is a *real MCP host*: initialize → tools/list → resources/read → chat loop → GET-stream push client. Voice input via browser SpeechRecognition.
- **Agent brain** — Featherless (OpenAI-compatible, `unsloth/Llama-3.3-70B-Instruct`) with automatic fallback to Gemini `3.8-flash` native function-calling; one tool-declaration source of truth in `tools.js`.
- **E2E-verified**: `packages/mcp-server/e2e-sim.mjs` is a headless protocol-level test (initialize → note → canvas read → chat → SSE push audit → ALL PASS).

## Challenges we ran into

- Gemini retired `2.0/2.5-flash` model IDs for new keys (404s); the error payload names the successor (`3.8-flash`) — and free-tier 429s mid-demo-take taught us to build a **provider abstraction with automatic fallback** (which became a feature: Featherless primary, Gemini fallback).
- The MCP SDK silently drops `notifications/message` without the `logging` capability — cost us a full debugging cycle (now documented in our friction log).
- Zod shapes vs JSON Schema in `registerTool`, manual SSE readers (EventSource can't set headers), and gemini-3.x `thoughtSignature` echo-back all bit us before they clicked.

## Accomplishments that we're proud of

- A **drag → MCP round-trip**: grab a block, and the interaction is a *tool call*, recomputed server-side, and pushed back over SSE. The UI is conversation-native.
- A working **MCP App** (ui:// resource in a sandboxed iframe) before most hosts even render them.
- Headless protocol E2E that audits every server-initiated push by type.

## What we learned

- The 2025-11-25 spec is genuinely implementable by one developer and a `curl` script — and MCP Apps is the most exciting thing in the ecosystem.
- Provider abstraction is not premature engineering: LLM providers break mid-recording, and fallback saved our demo.

## What's next

- Alexa+ production host integration (the simulator mirrors exactly what a host does),
- multi-user sessions + auth on the server,
- voice *out* (spoken replies), calendar sync, conflict explanations.
```

(去掉 accidentally-inserted word "konuş" before pasting.)

---

## 3. Built with (25 tags max)

```
TypeScript alternative note: this is a JavaScript project.
```

Paste as tags:

```
JavaScript, Node.js, MCP, Model Context Protocol, MCP Apps, Streamable HTTP, SSE, Featherless AI, Gemini, Tavily, Zod, HTML5, CSS, Web Speech API, Express (http), Alexa+, agentic AI, tool calling, function calling, real-time, voice input, self-hosted, iframes, postMessage, e2e testing
```

---

## 4. Try it out / source links

- **GitHub repo:** `https://github.com/JinYi123456/meridian-alexa-briefing`
- **Demo video:** https://youtu.be/1ewnFKpYSyI
- **Live demo URL:** see §4a (Vercel deployment — live now)

---

## 4a. Live deployment (Vercel)

Paste this as an extra "Try it out" link and as the **Optional Project Testing Link**:

```
https://meridian-alexa.vercel.app
```

(It serves the simulated Alexa+ client; the MCP server runs as a serverless function at `/mcp`. API keys are set as encrypted Vercel env vars, never committed.)

---

## 5. Additional info (judges-only fields)

- **Submitter type:** Individual
- **Organization name:** N/A
- **Country of residence:** Malaysia (appears in gallery)
- **Canada province:** N/A
- **Primary track:** Alexa+ (+ Fire TV / BeeRing only if you actually target them — currently **Alexa+ only**)
- **Code repo (judging):** `https://github.com/JinYi123456/meridian-alexa-briefing` — public + MIT LICENSE visible at top (already set), or private shared with `testing@devpost.com` and `@AmazonAppDev`.
- **AWS Builder Mini Challenge:** **No** (we do not use Bedrock/AgentCore/Strands; our stack is Featherless/Gemini).
- **Open Source Mini Challenge:** **Yes**
  - Contribution URL: (second repo URL — agent-runtime extraction, pending; see §9)
  - Project repository URL: `https://github.com/JinYi123456/meridian-alexa-briefing`
  - GitHub username: `JinYi123456`
  - Description *(draft, update after extraction)*:

    ```text
    I created a second open-source repo, "agent-runtime", extracting Meridian's provider-agnostic LLM tool-calling loop: one `declarations()` source of truth that speaks both OpenAI-style `tool_calls` (Featherless/OpenAI-compatible endpoints) and Gemini-native functionCall, with automatic cross-provider fallback, streaming progress hooks, and a JS example against a live MCP server. It is MIT-licensed, standalone (no MCP SDK dependency), and reusable by any hackathon project that needs reliable tool-calling across providers.
    ```

---

## 6. Feedback questions (the graded ones — paste)

**Q1 — Which tools/APIs/SDKs did you use and for what?**

```text
@modelcontextprotocol/sdk (self-hosted MCP server, spec 2025-11-25, Streamable HTTP + MCP Apps ui:// resource) · Featherless AI (primary LLM provider: OpenAI-compatible tool-calling, Llama-3.3-70B) · Google Gemini @google/genai (fallback provider: native function-calling) · Tavily (web-search tool) · Zod (tool input schemas) · Web Speech API (voice input) · plain Node http (transport server).
```

**Q2 — What worked well?** (paste this block as-is)

```text
- MCP TypeScript SDK: the Streamable HTTP transport is wire-exact. Once wired, session IDs, 202-on-notification, DELETE teardown, and the standalone GET SSE stream all behaved per spec. registerTool + Zod gives real input validation for free, and notifications/message is exactly the right primitive for streaming agent progress into a live UI.
- Featherless AI: genuinely OpenAI-compatible — the standard tools array + tool_choice:"auto" just worked on Llama-3.3-70B-Instruct; our multi-step plan (time check -> search -> canvas write) executed with zero prompt gymnastics. The /v1/models catalog (~22k models) exposes per-model pricing and context length, making model selection a quick script. Fast, and free credits let us iterate through dozens of full agent loops without quota anxiety.
- Gemini (@google/genai): native tool-calling is reliable and fast on 3.8-flash; the multi-step loop worked without prompt tricks, and the AI Studio key flow is the fastest free start available.
- Tavily: simple REST API, clean result shape, sensible free tier — integrated in minutes.
```

**Q3 — What needs work?** (paste this block as-is)

```text
- MCP SDK: capability gating is silent — notifications/message requires the logging capability to be declared, and without it the notification is silently dropped instead of erroring at registration time (cost us a full debugging cycle). Also, registerTool requires Zod shapes rather than raw JSON Schema; the error message says so but the docs don't lead with it.
- Featherless: model discovery is the weak spot — 22k model IDs with no capability tags (which support tool calling? which are instruct-tuned?). We picked by name heuristics and verified with a test call; a capabilities field on the model object would help a lot. Gated models return a bare permission error with no documented error shape.
- Gemini: older model IDs (gemini-2.0-flash, gemini-2.5-flash) return 404 for new keys; the error payload does helpfully name the successor (gemini-3.8-flash). Free-tier 429 quota exhaustion hit us mid-demo-take; per-key quota transparency would help.
- Tavily: rate-limit error bodies could be more descriptive.
```

**Q4 — Onboarding (zero to hello world)?** (paste as-is)

```text
- Featherless: excellent — API key in, first /v1/models call in under a minute, first tool-calling chat completion in about five. Best onboarding of the four.
- Gemini: excellent key flow via AI Studio, with one wrinkle: retired model IDs (2.0/2.5 flash) 404 for new keys.
- Tavily: minutes — quickstart covers it.
- MCP TypeScript SDK: moderate. The TypeScript quickstart is good, but real-world Streamable HTTP wiring (single endpoint, CORS preflight for browser clients, session header handling, logging capability) required reading transport source code. It would not have been a day-one integration without the SDK being open-source.
```

**Q5 — Would you build with these devices and services again?** (paste as-is)

```text
Yes. MCP SDK: yes — official and wire-correct; the friction is all in discoverability of finer requirements, and it's improving fast. Featherless: yes — it is now our default provider. Gemini: yes — kept wired as automatic fallback. Tavily: yes — simple and clean.
```

### [Optional] Feature Requests (paste as-is)

```text
1) MCP Apps: ship one canonical quickstart for "server app + custom host". Why it matters: our core UX (tool renders as an interactive canvas) depends on the MCP Apps pattern (SEP-1865), but the docs are spread across the extension site, the spec repo, and blog posts; a single page would cut hours for every builder. Priority: Important.

2) MCP Apps: publish a reference host implementation beyond the basic example. Why it matters: there is no official host to test against, so our simulated Alexa+ client (iframe postMessage protocol) was written by reading the ext-apps source side-by-side with the spec. Priority: Important.

3) MCP SDK: fail fast (or warn loudly) when sending a notification while the required capability is not declared. Why it matters: capability gating is currently silent, which cost us a debugging cycle and would silently break every builder's first push. Priority: Critical.

4) MCP SDK: ship a CORS + session-header helper for HTTP-server transports. Why it matters: browser MCP clients need OPTIONS preflight handling and MCP-Session-Id exposure; every self-hosted server author rediscovers this by trial and error. Priority: Nice-to-have.

5) Featherless: add a capabilities field (toolCalling: true/false, instruct: true/false) to the /v1/models objects. Why it matters: with 22k models, picking one without capability metadata is guesswork; it cost us a few test calls to find a function-calling-capable model. Priority: Important.

6) Gemini API: keep retired model IDs returning the successor in the error payload (good!), and consider a grace period where retired IDs hard-redirect. Why it matters: gemini-2.0-flash returning 404 broke our first run until we read the error body carefully. Priority: Nice-to-have.
```

### [Optional] Friction Log (paste as-is, also shipped as docs/product-feedback.md in the repo)

```text
| # | Task attempted | Steps taken | Expected vs actual | Severity | Workaround used | Actionable suggestion |
|---|---|---|---|---|---|---|
| 1 | Stream server-initiated notifications over the GET stream | Declared sends; opened GET stream; watched frames | Expected notification frames; saw silence (only keep-alive comments) | High | Declared logging: {} capability in server constructor | Fail fast at notification() when the required capability is missing; log a one-line hint on connect |
| 2 | Register tools with schemas | Passed raw JSON Schema objects to registerTool | Runtime error: "inputSchema must be a Zod schema or raw shape" | Medium | Converted all tool schemas to Zod raw shapes (single source of truth in tools.js) | Accept JSON Schema directly, or document the conversion path up front |
| 3 | Browser simulator calling the server | POSTed from the simulator origin | Preflight rejected: no OPTIONS handling on the custom http transport | Medium | Added explicit OPTIONS handler + CORS headers exposing MCP-Session-Id | Ship a tiny CORS helper for HTTP-server transports |
| 4 | Debugging the "silent" GET stream | Watched the stream during pushes | Nothing appeared for ~15s; looked broken | Low | Set keepAliveMs: 3000 and documented it | Document the keep-alive default prominently in the transport docs |
| 5 | Model selection on Gemini | Called gemini-2.0-flash with a new key | 404 "model not available for new keys" | Medium | Read error payload; switched to gemini-3.8-flash | Keep surfacing the recommended replacement model in the error (already good) |
| 6 | LLM provider died mid-demo | 429 quota-exhausted during recording | Demo take scrapped | High | Built a provider abstraction: Featherless (OpenAI-compatible tools) primary, Gemini automatic fallback | Not a bug — but graphic proof that multi-provider fallback is essential for demos |
| 7 | Empty-body POST handling | Notification POSTs carry no JSON body | Crashed on JSON.parse of empty body | Medium | Parse only when non-empty; treat as {} | Transport could document the notification case for custom servers |

```

Priority summary: #1 and #3 are Critical/High (both now have documented workarounds in our code + docs/product-feedback.md).

---

## 7. Media checklist ( Produce these, 3:2 each )

- [x] **Thumbnail** (3:2, ≤5 MB) — files: `media/production/thumbnail-3x2.jpg` (also 16:9 at `media/production/thumbnail.jpg`)
- [x] **Gallery images** (≤15, 3:2): `submission/screenshots/01-hero.png` … `09-mobile-live.png` (9 shots)
- [x] **Demo video link** — https://youtu.be/1ewnFKpYSyI (2:13, English, 1080p60)

---

## 8. Additional file upload (≤35 MB)

Upload **one zip**: `meridian-submission.zip`

```
submission/
  screenshots/            (same set as gallery)
  demo-storyboard.md      (from docs/demo-video-plan.md)
  product-feedback.pdf    (exported from docs/product-feedback.md)
  submission_form_answers.md  (this document)
```

*(Do NOT include .env, recordings' raw webm, or node_modules.)*

---

## 9. Still TODO before Oct 23

1. Finish `agent-runtime` OSS repo extraction → get its GitHub URL → replace placeholders in §5.
2. ~~Record + edit demo video~~ done → https://youtu.be/1ewnFKpYSyI
3. ~~Capture media set (§7) → make thumbnail~~ done → `submission/screenshots/` + `media/production/thumbnail.jpg`
4. Fill the *new vs existing project* dropdown honestly (new).
5. Community guidelines checkboxes + AI-tools disclosure (list: Claude/Codebuff-style coding AI, Gemini for testing).

---

## 10. Exact upload file list (what goes where on Devpost)

| Devpost field | File / value |
|---|---|
| Thumbnail | `media/production/thumbnail-3x2.jpg` (fallback: `media/production/thumbnail.jpg`) |
| Image gallery | `submission/screenshots/01-hero.png` … `09-mobile-live.png` (9 images) |
| Video demo link | https://youtu.be/1ewnFKpYSyI |
| "Try it out" links | GitHub repo (+ optional deployed URL later) |
| Code repository (judging) | GitHub URL, public + MIT |
| Open Source Mini Challenge URLs | second-repo URL + this repo URL |
| Upload a file | `meridian-submission.zip` (see §8) |
| Feedback Q1–Q5 | text from §6 |
| Friction/Feature (optional) | reference `docs/product-feedback.md` |
