# Meridian - Architecture & Design Doc

## 1. What it is

Meridian is a self-hosted MCP server (spec 2025-11-25, Streamable HTTP) that turns a single messy human sentence into a **visually orchestrated, draggable day plan rendered as an interactive MCP App inside the chat**.

One project, three layers:

| Layer | What it is | Tech |
|---|---|---|
| **Agent brain** | Gemini tool-calling loop via a thin agent runtime | `@google/genai`, custom loop |
| **MCP server** | Official TypeScript MCP SDK, Streamable HTTP transport, GET push notifications | `@modelcontextprotocol/sdk` |
| **Interactive canvases** | MCP Apps UI delivered via `ui://` resources, rendered inside our simulator | vanilla JS canvas |

Mini challenge: the **canvas-rendering engine + agent-runtime pattern** is extracted into a clean, MIT-licensed standalone open-source library published on a separate GitHub repo alongside this project.

## 2. Flow

1. User speaks: "I'm flying to Taipei next Wednesday, my report is due Thursday, and Dad's birthday is this weekend and I haven't booked any dinner yet."
2. Simulator opens an MCP session over Streamable HTTP to the local server.
3. Gemini plans with available tools:
   - `current_time` (deterministic, no LLM)
   - `get_weather` / `search_web` (Tavily)
   - `read_canvas` / `write_canvas` (deterministic state on the server)
   - `notify_later`
4. Server mirrors each tool step back to the canvas as a **pipeline rail** (planner cards stream in like scheduler chips).
5. Final tool call: `write_canvas` - commits the schedule in structured JSON and returns a `ui://` App resource that the simulator renders as a canvas.
6. User drags a block -> UI posts callback to server -> Gemini re-plans just that cluster -> canvas updates live.
7. The "close the browser" moment: after session end, a separate push event over the MCP GET stream -> "your flight to Taipei is in 36 hours" appears.

## 3. Judging criteria mapping

- **Tech Implementation** - official spec 2025-11-25 + GET push + MCP Apps UI. Not a toy server.
- **Design** - canvas-first UX, spatial + conversational hybrid interaction. Nothing else in this track does this.
- **Potential Impact** - chief-of-staff as a daily companion, installable by anyone in Claude Desktop or any MCP host.
- **Quality of the Idea** - bleeding-edge MCP Apps (finalized in 2026). Judges called it out in the Creative list.

## 4. Repo layout

```
meridian/
  packages/
    mcp-server/       # Meridian server (Streamable HTTP + push)
    canvases/         # MCP App UI bundle (day canvas)
    simulator/        # the "Alexa+" web client (host that renders MCP Apps)
    agent-runtime/    # extracted open-source library (OS mini challenge)
  docs/
  LICENSE
  README.md
```
