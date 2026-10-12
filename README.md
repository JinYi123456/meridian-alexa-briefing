# Meridian - Your Personal Chief of Staff on MCP

**Meridian turns a messy spoken sentence into a visually orchestrated, draggable two-day plan - rendered live as an interactive MCP App inside a simulated Alexa+ chat.**

> "I'm flying to Taipei next Wednesday to meet a client, my report is due Thursday, and my dad's birthday is this weekend and I haven't booked dinner yet."
>
> Meridian hears it, plans it, shows its work step-by-step on a live canvas inside the conversation, lets you drag things around while it re-balances your schedule, and keeps watching your plan after you close the session.

Built for the **Alexa+ track** of the [Amazon Developer Hackathon](https://amazonappdev2026.devpost.com) ("Build, Ship, Shape"), implementing:

- A **self-hosted MCP server** on the **official MCP spec 2025-11-25** over **Streamable HTTP** (single `/mcp` endpoint, POST + GET SSE push channel, MCP session management, Origin validation)
- A **simulated Alexa+ web client** that acts as a real MCP host: it initializes an MCP session, lists tools, reads the `ui://meridian/canvas.html` **MCP App resource**, renders it in a sandboxed iframe, and receives **server-initiated notifications** live
- An **agentic planning loop** powered by **Featherless** (OpenAI-compatible inference on Llama-3.3-70B) with automatic fallback to Google **Gemini** native tool-calling, plus **Tavily** web search as a supporting tool
- **Voice input** (browser-native SpeechRecognition) and **any-language chat** - the agent replies, labels progress steps, and writes canvas blocks in the language you spoke (English, 中文, Malay, …)
- MCP **Apps**-style interactive UI (SEP-1865 pattern): the tool result renders as a rich, draggable canvas - not plain text

## What makes it different

| Typical Alexa+ submission | Meridian |
|---|---|
| One tool wraps one API, returns text | 7-domain toolset where the **agent visibly orchestrates** progress steps into the UI as they happen |
| Static chat bubbles | A **draggable spatial canvas** rendered inline in the chat (MCP Apps) - drag a block, the agent re-plans over MCP in real time |
| Session ends, state dies | **Proactive reminders** push over the official GET SSE stream after you stop typing |

## Architecture

```
packages/
  mcp-server/     Node MCP server (official @modelcontextprotocol/sdk), Streamable HTTP on :3001
  canvases/       The day canvas - a self-contained HTML MCP App served as a ui:// resource
  simulator/      The simulated Alexa+ client (open index.html, chat, drag, receive pushes)
```

Key technical pieces, all wired for real (verified end-to-end):

- **Streamable HTTP transport**: POST for JSON-RPC, GET for the standalone SSE push stream, `MCP-Session-Id` session tracking, DELETE for session teardown, `MCP-Protocol-Version` header handling
- **Server-initiated notifications**: agent progress, canvas updates, and scheduled reminders are delivered over the GET stream while a tool call is still running
- **MCP App resource**: `resources/read ui://meridian/canvas.html` returns the full interactive canvas, which the host renders and drives via postMessage
- **Zod-validated tool schemas** mirrored between the MCP server (`registerTool`) and the LLM tool-calling loop (single source of truth in `tools.js`), with a provider abstraction that speaks both Featherless (OpenAI `tool_calls`) and Gemini (native `functionCall`) dialects

## Quickstart

Requirements: Node.js 20+.

```bash
# 1. Clone and install
npm install

# 2. Add your free API keys
cp .env.example .env
#    Edit .env with:
#    FEATHERLESS_API_KEY  (https://featherless.ai) - primary provider, tool-calling open models
#    GEMINI_API_KEY       (https://aistudio.google.com) - automatic fallback provider
#    TAVILY_API_KEY       (https://tavily.com, optional) - web search tool
#
#    Provider selection: MODEL_PROVIDER=featherless|gemini, or leave unset for
#    auto-detect (featherless if its key is present, else gemini). If the active
#    provider errors, the agent transparently falls back to the other.
#    Model override: FEATHERLESS_MODEL (default unsloth/Llama-3.3-70B-Instruct).

# 3. Start the MCP server (terminal 1)
npm run start -w packages/mcp-server
#    -> [meridian] Meridian MCP server ready on :3001 (spec 2025-11-25, Streamable HTTP)

# 4. Open the simulated Alexa+ client (terminal 2)
npx serve packages/simulator -l 5173
#    Open http://localhost:5173 in your browser
```

Then click one of the scenario chips (or type your own messy week) — or press the 🎙 mic and speak it. The agent replies in the language you used.

### Try it online (simulator UI)

**Fully working live demo** (simulator UI + MCP server + agent, all on Vercel):

```
https://meridian-alexa.vercel.app
```

Prefer to host the UI yourself? The same `packages/simulator` UI can be published as a Worker (`deploy/worker.js`, see `deploy/README.md`) and pointed at **your** Meridian MCP server:

1. Run the local MCP server (Quickstart step 3) and open your hosted UI on the same machine — set the server address in the URL, e.g. `?mcp=http%3A%2F%2Flocalhost%3A3001%2Fmcp`
2. Host the MCP server yourself (any Node host / VPS / Fly.io) and point the hosted UI at it: `https://…/index.html?mcp=https://your-server.example.com/mcp`

The full production setup (agent brain + tools + canvas server) must always run where your API keys live — that part is self-hosted by design.

### How to deploy the simulator UI

```bash
# regenerate the bundle (inlines index.html into worker.js)
node deploy/inline.cjs
# then push deploy/manifest.json to your Sites host
# (see deploy/README.md for the exact sites_deploy call and env)
```

### Using Meridian from any MCP client

Because Meridian is a standard MCP server, you can also drive it from Claude Desktop, VS Code, or any MCP host:

```json
{
  "mcpServers": {
    "meridian": {
      "url": "http://localhost:3001/mcp"
    }
  }
}
```

(For stdio-only hosts, any MCP streamable-HTTP-to-stdio proxy works.)

## Tools exposed

| Tool | What it does |
|---|---|
| `meridian_chat` | Main entry point: send the utterance (typed or 🎙 spoken), agent plans and updates the canvas |
| `current_time` | Deterministic clock (no LLM needed) |
| `push_progress` | Streams an orchestration step into the live UI |
| `write_canvas` / `read_canvas` | Commit / inspect schedule blocks |
| `reprioritize` | Re-plan after the user drags a block |
| `notify_later` | Schedule a proactive reminder over the GET stream |
| `search_web` | Tavily-powered web lookup for weather/facts |

## Tracks

- **Primary:** Alexa+ (self-hosted MCP server, spec 2025-11-25, Streamable HTTP + MCP Apps UI + simulated Alexa+ client)
- **Mini challenge:** Open Source (the extracted scheduling/agent-runtime engine lives at [agent-runtime repo link - see submission form])

## Product feedback on the tools used

See `docs/product-feedback.md` for our hands-on notes on the MCP TypeScript SDK, the MCP Apps extension, Featherless, Gemini, and Tavily - what worked, what needs work, and how onboarding felt.

## License

MIT - see [LICENSE](LICENSE).
