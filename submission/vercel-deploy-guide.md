# Meridian — Vercel deployment (one-click ready)

This folder is a **standalone, deploy-ready subset** of Meridian for Vercel:
static simulated-Alexa+-client + serverless MCP endpoint (`/api/mcp`), an exact
reuse of the packages/mcp-server logic (same tools, same canvas resource, same
agent loop with Featherless→Gemini fallback).

## Deploy path A — Dashboard import (no CLI needed)

1. Push this folder to a GitHub repo (or use the existing
   `JinYi123456/meridian-alexa-briefing` repo — `vercel-ready/` lives there).
2. **vercel.com/new** → **Import** the repo.
3. In the import screen set **Root Directory = `vercel-ready`** (if importing the
   whole repo) — or, if this folder is a repo of its own, leave Root empty.
   Framework preset: **Other** (Vercel reads `vercel.json`: static `public/` +
   `api/mcp.js` as a serverless function, region sin1, max duration 300s).
4. Add Environment Variables (Project → Settings → Environment Variables):

   | Name | Required | Note |
   |---|---|---|
   | `FEATHERLESS_API_KEY` | yes (or Gemini) | primary provider |
   | `GEMINI_API_KEY` | fallback (recommended) | automatic fallback brain |
   | `TAVILY_API_KEY` | optional | web-search tool |
   | `MODEL_PROVIDER` | optional | `featherless` \| `gemini` (auto if unset) |
   | `FEATHERLESS_MODEL` | optional | default `unsloth/Llama-3.3-70B-Instruct` |

   Never paste these into the repo; Vercel env vars are encrypted at rest.
5. **Deploy** → live at `https://meridian-alexa.vercel.app` (simulator at `/`,
   MCP at `/api/mcp` — the simulator auto-detects same-origin `/api/mcp`).

## Deploy path B — CLI

```bash
npx vercel login          # or: npx vercel --token <your_token>
cd vercel-ready
npx vercel link           # accept defaults (project: meridian-alexa)
npx vercel env add FEATHERLESS_API_KEY production   # paste value when asked
npx vercel env add GEMINI_API_KEY production        # paste value when asked
npx vercel env add TAVILY_API_KEY production        # optional
npx vercel --prod         # -> https://meridian-alexa.vercel.app
```

## Verify after deploy

```bash
open https://meridian-alexa.vercel.app                   # simulator loads, badge "mcp live"
curl -sN "https://meridian-alexa.vercel.app/api/mcp" \
  -H 'accept: text/event-stream' &                      # GET stream
curl -s "https://meridian-alexa.vercel.app/api/mcp" \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"probe","version":"0"}}}'
```

## Known limits on serverless

- Sessions live in the function instance's memory: warm instances reuse them,
  recycled instances start fresh (15-min TTL regardless). Fine for demos and judging.
- SSE pushes work on Vercel Fluid/Node runtime streams; keep `maxDuration` high
  (vercel.json already sets 300s for the agent's multi-step runs).
