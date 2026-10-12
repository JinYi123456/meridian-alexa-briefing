# deploy/ — hosted simulator UI

This folder holds everything needed to publish the Meridian simulator UI as a
Worker-based site (no secrets, no agent backend).

## Files

- `worker.js` — Worker entry. Inlines the simulator UI (`index.html` served at `/`)
  and transparently proxies `/mcp` traffic to the real Meridian MCP server
  (`MERIDIAN_MCP_URL` env, default `http://127.0.0.1:3001/mcp`).
- `index.html` — copy of `packages/simulator/index.html`. **Regenerate with:
  `cp packages/simulator/index.html deploy/index.html && node deploy/inline.cjs`**
- `manifest.json` — Sites deploy manifest (entrypoint worker.js, esm module).
- `inline.cjs` — build helper: replaces the `import indexHtml` line in worker.js
  with a JSON-escaped constant. Run before every deploy.

## Deploy

```
cp packages/simulator/index.html deploy/index.html
node deploy/inline.cjs
# then deploy with the sites manifest (deploy/manifest.json) to preview/production
```

## Pointing the hosted UI at your server

Open `https://…/?mcp=<url-encoded MCP endpoint>` — for example:

```
?mcp=http%3A%2F%2Flocalhost%3A3001%2Fmcp        (same machine as your dev server)
?mcp=https%3A%2F%2Fyour-meridian-host.example%2Fmcp   (self-hosted server)
```

The agent brain, tools and API keys stay wherever the MCP server runs — the
hosted UI only talks MCP. Something else to know: the current Worker proxy
defaults to `127.0.0.1:3001` (useful only for local testing of the Worker
itself). For a real hosted server set `MERIDIAN_MCP_URL` to its public URL.
