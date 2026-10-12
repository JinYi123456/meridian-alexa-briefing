# Devpost form — final answers (blank fields filled 2026-10-12)

Filled directly in the Devpost form (edit URL: submission 1230515). Verified saved in the form. Local mirror for reference.

Verified by API on 2026-10-12:
- agent-runtime: public, SPDX `MIT`, description mentions fallback + extraction from Meridian
- meridian-alexa-briefing: public, SPDX `MIT`

Still blank on the form (owner action):
- **Video demo link** — required on the final step; upload is the user's call.

---

## Which AI tools have you leveraged while working on this project? (filled, 463 chars)

```
Codebuff (AI coding agent) did the hands-on implementation — the MCP server, the agent loop, the MCP App canvas, serverless deployment, screenshots, and all debugging. Meridian itself was AI-tested end-to-end through two LLM providers running the same agent workflow: Google Gemini (gemini-3.8-flash) and Featherless (unsloth/Llama-3.3-70B-Instruct) — running both side by side surfaced our streaming and fallback bugs. Tavily powered the agent's live web search.
```

## Describe the level of learning (filled: dropdown changed Moderate → Significant)

Rationale text (kept for reference; the form field is dropdown-only):

```
Significant. I implemented the full MCP spec 2025-11-25 (Streamable HTTP + SSE push) from the wire protocol up, built an MCP App interactive UI (SEP-1865) before most hosts render one, and learned to design provider-agnostic LLM tool-calling after a quota failure killed a demo take — the fallback architecture became a shipped feature. Every layer was verified in a real runtime, not just locally.
```

## Gallery captions (filled, ≤140 chars; 01 = photo 5563806, 08 = photo 5563807)

- Image 01 (hero, empty canvas) — 119 chars:
  `Speak or type the chaos, and the two-day canvas sits ready beside the chat — an MCP App, streamed live from the server.`

- Image 08 (rebalanced after drag) — 121 chars:
  `After a drag, the agent re-plans over MCP: dad's dinner moved up, a proactive reminder pushed over SSE — plan rebalanced.`

## Built with — corrected

`express-(http)` → `node-http` (transport uses Node's built-in `http`; no Express dependency). Now 23 tags, all saved.

## Open Source Mini Challenge description

Already filled in the form (draft from submission kit is accurate; no rewrite needed).
