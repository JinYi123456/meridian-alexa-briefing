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

Meridian is a **self-hosted MCP server** (official spec `2025-11-25`, Streamable HTTP) with an agentic chief-of-staff brain. konuş One messy sentence — typed or **spoken** via the mic button — and the agent:

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
- **Demo video:** (YouTube/Vimeo URL after upload)
- Optional live link: leave empty — rules say a live deploy is **not required** (judges test from repo + video). If you do deploy later, add it.

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

**Q2 — What worked well?** → paste §"What worked well" bullets from `docs/product-feedback.md` (SDK transport exactness; Featherless drop-in OpenAI compat + 22k-model catalog; Gemini native FC; Tavily 5-minute integration).

**Q3 — What needs work?** → paste §"What needs work" bullets (SDK silent capability gating; Featherless no capability tags on 22k models; Gemini model-ID retirement; rate-limit error bodies).

**Q4 — Onboarding (zero→hello)?** → SDK: moderate (real-world HTTP wiring required reading transport source) · Featherless: excellent (key → working tool-call in 5 min) · Gemini: excellent key flow, 404 model-name wrinkle · Tavily: minutes.

**Q5 — Build with them again?**

```text
Yes — MCP SDK (official and wire-correct; friction is discoverability), Featherless (now our default provider), Gemini (works, kept as fallback), Tavily (simple and clean).
```

**Friction log / feature requests:** point judges to `docs/product-feedback.md` in the repo (full table with severities + workarounds — this earns the bonus). Feature request example: *"MCP Apps: a reference host implementation + one canonical quickstart for server-app + custom host."*

---

## 7. Media checklist ( Produce these, 3:2 each )

- [ ] **Thumbnail** (3:2, ≤5 MB) — screenshot from the drag-twist moment (rebalance banner visible), or a generated composite: orb + one-line tagline. Files: `media/thumbnail.png`
- [ ] **Gallery images** (≤15, 3:2): hero orb empty state; full plan canvas; drag + "agent re-orchestrating"; terminal curl/SSE proof; proactive nudge bubble; mobile layout; voice-input close-up; end card. Screenshot set lives in `media/`.
- [ ] **Demo video link** — YouTube/Vimeo public URL (< 3 min, English).

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
2. Record + edit demo video per `docs/demo-video-plan.md` → get YouTube URL.
3. Capture media set (§7) → make thumbnail.
4. Fill the *new vs existing project* dropdown honestly (new).
5. Community guidelines checkboxes + AI-tools disclosure (list: Claude/Codebuff-style coding AI, Gemini for testing).

---

## 10. Exact upload file list (what goes where on Devpost)

| Devpost field | File / value |
|---|---|
| Thumbnail | `media/thumbnail.png` |
| Image gallery | `media/gallery-01.png` … `media/gallery-08.png` |
| Video demo link | YouTube URL (from edited `media/meridian-demo-final.mp4`) |
| "Try it out" links | GitHub repo (+ optional deployed URL later) |
| Code repository (judging) | GitHub URL, public + MIT |
| Open Source Mini Challenge URLs | second-repo URL + this repo URL |
| Upload a file | `meridian-submission.zip` (see §8) |
| Feedback Q1–Q5 | text from §6 |
| Friction/Feature (optional) | reference `docs/product-feedback.md` |
