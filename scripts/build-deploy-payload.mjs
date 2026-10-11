/**
 * build-deploy-payload.mjs — print (or write to stdout file) a Vercel inline
 * deployment payload containing the entire Meridian app source as inlined files.
 * Usage: node scripts/build-deploy-payload.mjs > logs/deploy-payload.json
 */
import { readFileSync } from "node:fs";

const files = [
  "package.json",
  "vercel.json",
  "public/index.html",
  "api/mcp.js",
  "packages/mcp-server/src/agent.js",
  "packages/mcp-server/src/tools.js",
  "packages/mcp-server/src/util.js",
  "packages/mcp-server/src/canvas-store.js",
  "packages/mcp-server/package.json",
  "packages/canvases/canvas-day.html",
];

const payload = {
  name: "meridian-alexa",
  target: "production",
  projectSettings: {
    framework: null,
    installCommand: "npm install @modelcontextprotocol/sdk@1.32.1 zod@4.6.5 @google/genai@2.28.0",
    buildCommand: null,
    outputDirectory: "public",
    nodeVersion: "22.x",
    serverlessFunctionRegion: "sin1",
  },
  files: files.map((f) => ({ file: f, data: readFileSync(f, "utf-8"), encoding: "utf-8" })),
};

console.log(JSON.stringify(payload));
