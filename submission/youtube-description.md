# YouTube Upload Kit — Meridian demo video

File to upload: `media/production/meridian-demo.mp4` (2:13, 1080p60)
Thumbnail: `media/production/thumbnail.jpg`

---

## Title (pick one)

```
Meridian — Speak the chaos. Watch the plan assemble. (Alexa+ / MCP Apps demo)
```

Alt: `Meridian: a self-hosted MCP server that plans your week live in Alexa+ (hackathon demo)`

---

## Description (paste as-is)

```
Meridian — Speak the chaos. Watch the plan assemble.

One messy sentence in; a live, draggable two-day plan out. Meridian is a self-hosted MCP server acting as an agentic chief of staff inside an Alexa+ chat client. It plans, re-plans when you drag a block, and keeps working after you stop talking.

Built for the Amazon Developer Hackathon — Alexa+ track.

Chapters
0:00 A week of chaos
0:16 One messy sentence in
0:26 Watch it think — the plan assembles live
0:55 Drag one block — instant re-plan
1:10 Under the hood — real MCP JSON-RPC frames
1:31 Reminders arrive + it answers in Chinese
1:58 Wrap-up

Everything you see is recorded live from the deployed app — every frame in the "Wire" section is real JSON-RPC traffic between the MCP server and its client.

How it works:
• Self-hosted MCP server — spec 2025-11-25, Streamable HTTP with server-initiated pushes over SSE
• The canvas is an MCP App (ui:// resource) rendered in a sandboxed iframe and driven by postMessage
• Agent loop with automatic cross-provider fallback (Featherless AI primary, Gemini fallback) + Tavily web search
• Drag a block → the drag fires the reprioritize tool over MCP → the week re-balances server-side
• Any standard MCP client can connect to the same server

Links:
Live demo → https://meridian-alexa.vercel.app
Source (MIT) → https://github.com/JinYi123456/meridian-alexa-briefing

Stack: JavaScript · Node.js · @modelcontextprotocol/sdk · MCP Apps · Streamable HTTP · SSE · Featherless AI · Google Gemini · Tavily · Zod · Web Speech API

#MCP #AlexaPlus #hackathon #AIagents #ModelContextProtocol
```

---

## Tags (paste into the Tags field)

```
MCP, Model Context Protocol, MCP Apps, Alexa+, Amazon Developer Hackathon, AI agent, agentic AI, self-hosted MCP server, Streamable HTTP, SSE, JSON-RPC, tool calling, function calling, Node.js, JavaScript, Featherless AI, Gemini, Tavily, voice assistant, AI planning, demo
```

---

## Upload settings checklist

| Field | Value |
|---|---|
| Visibility | Public |
| Category | Science & Technology |
| Video language | English |
| Audience | Not made for kids |
| Altered / synthetic content disclosure | **Yes** — contains AI-generated narration (and AI-assisted demo content) |
| License | Standard YouTube License |
| Thumbnail | `media/production/thumbnail.jpg` (1280×720, 120 KB — under the 2 MB cap) |

Notes:
- Chapters only render if the first line is `0:00` and every chapter is ≥10 s — the block above is tuned to the final cut's timings, don't re-time it.
- Uploaded 2026-10-12 → https://youtu.be/MLQzrs07ng8. If the video file is ever replaced (Studio → video row ⋮ → Replace video), the URL stays the same.
