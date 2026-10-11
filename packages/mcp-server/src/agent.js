/**
 * agent.js - provider-agnostic tool-calling loop.
 *
 * Providers:
 *  - "featherless": OpenAI-compatible /v1/chat/completions with `tools`
 *    (default when FEATHERLESS_API_KEY is set). Tool-calling-capable open
 *    models such as unsloth/Llama-3.3-70B-Instruct work out of the box.
 *  - "gemini": Google Gemini native functionCalling (fallback when no
 *    Featherless key, or as automatic fallback on a Featherless failure).
 *
 * The LLM decides when to call MCP tools; we just wire through.
 */
import { GoogleGenAI } from "@google/genai";

const FEATHERLESS_BASE_URL =
  process.env.FEATHERLESS_BASE_URL || "https://api.featherless.ai/v1";
const FEATHERLESS_MODEL =
  process.env.FEATHERLESS_MODEL || "unsloth/Llama-3.3-70B-Instruct";
const GEMINI_MODEL = "gemini-3.8-flash";
// NOTE: gemini-2.0-flash / gemini-2.5-flash were retired for new keys (Nov 2026).
// gemini-3.8-flash is the recommended replacement per the Gemini API error payload.

export function activeProvider() {
  if (process.env.FEATHERLESS_API_KEY) return "featherless";
  if (process.env.GEMINI_API_KEY) return "gemini";
  throw new Error("No LLM provider key set (FEATHERLESS_API_KEY / GEMINI_API_KEY)");
}

// ---------- provider wiring ----------

let _gemini = null;
function getGemini() {
  if (!_gemini) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY not set");
    _gemini = new GoogleGenAI({ apiKey: key });
  }
  return _gemini;
}

/** Gemini native function-calling loop (unchanged behavior). */
async function runGemini({ userMessage, toolRouter, maxSteps }) {
  const convo = [{ role: "user", parts: [{ text: userMessage }] }];
  const systemPrompt = systemInstruction();
  for (let i = 0; i < maxSteps; i++) {
    const res = await getGemini().models.generateContent({
      model: GEMINI_MODEL,
      contents: convo,
      config: {
        systemInstruction: systemPrompt,
        tools: [{ functionDeclarations: toolRouter.declarations() }],
      },
    });

    // Preserve the raw model parts (incl. thoughtSignature) - gemini-3.x
    // rejects a follow-up turn that drops the thought signatures.
    const parts = res.candidates?.[0]?.content?.parts ?? [];
    const text = parts
      .filter((p) => p.text)
      .map((p) => p.text)
      .join("");
    if (text.trim()) toolRouter.onText?.(text);

    const calls = parts.filter((p) => p.functionCall);
    if (!calls.length) return { done: true, text };
    convo.push({ role: "model", parts });

    const results = await Promise.all(
      calls.map(async (p) => {
        const out = await toolRouter.call(p.functionCall.name, p.functionCall.args);
        return { functionResponse: { name: p.functionCall.name, response: out } };
      })
    );
    convo.push({ role: "user", parts: results });
  }
  return { done: false, text: "reached max steps" };
}

/** Convert Gemini-style declarations to OpenAI `tools` format. */
function openAiTools(toolRouter) {
  return toolRouter.declarations().map((d) => ({
    type: "function",
    function: {
      name: d.name,
      description: d.description,
      parameters: d.parameters,
    },
  }));
}

/** Featherless (OpenAI-compatible) loop with parallel tool_calls. */
async function runFeatherless({ userMessage, toolRouter, maxSteps }) {
  const key = process.env.FEATHERLESS_API_KEY;
  if (!key) throw new Error("FEATHERLESS_API_KEY not set");
  const tools = openAiTools(toolRouter);
  const messages = [
    { role: "system", content: systemInstruction() },
    { role: "user", content: userMessage },
  ];

  for (let i = 0; i < maxSteps; i++) {
    const res = await fetch(`${FEATHERLESS_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: FEATHERLESS_MODEL,
        messages,
        tools,
        tool_choice: "auto",
      }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`featherless ${res.status}: ${body.slice(0, 300)}`);
    }
    const data = await res.json();
    const choice = data.choices?.[0];
    if (!choice) throw new Error("featherless: empty choices");
    const msg = choice.message ?? {};

    if (msg.content) toolRouter.onText?.(msg.content);

    const calls = msg.tool_calls ?? [];
    if (!calls.length) return { done: true, text: msg.content ?? "" };

    // Echo the assistant tool_calls message back, then tool results.
    messages.push({
      role: "assistant",
      content: msg.content ?? null,
      tool_calls: calls,
    });
    const results = await Promise.all(
      calls.map(async (tc) => {
        let args = {};
        try {
          args = JSON.parse(tc.function?.arguments || "{}");
        } catch {
          /* tolerate malformed arguments */
        }
        const out = await toolRouter.call(tc.function?.name, args);
        return { role: "tool", tool_call_id: tc.id, content: JSON.stringify(out) };
      })
    );
    messages.push(...results);
  }
  return { done: false, text: "reached max steps" };
}

function systemInstruction() {
  return `You are Meridian, an agentic chief-of-staff.
Given a messy real-life constraint dump from the user, use tools to:
1. push_progress as you go so the user sees planning live
2. call current_time once (deterministic clock)
3. optionally search or check facts (search_web)
4. finalize by calling write_canvas with concrete day/time blocks
5. optionally queue notify_later reminders (batch all reminders in one turn)
Speak warmly and concisely.
IMPORTANT — reply in the SAME LANGUAGE the user's message is written in (English, Chinese, Malay, Spanish, …). Match their language for: the final reply, push_progress step labels, canvas block titles/notes, and notify_later reminder messages. If they mix languages, follow the dominant one (proper nouns may stay as-is).`;
}

/**
 * Main loop. Prefers the provider named in MODEL_PROVIDER, else
 * auto-detects (Featherless when its key is set). If the selected provider
 * fails and the other provider has a key, transparently falls back once.
 */
export async function agentLoop({ userMessage, toolRouter, maxSteps = 16 }) {
  const preferred = process.env.MODEL_PROVIDER || activeProvider();
  const providers = { gemini: runGemini, featherless: runFeatherless };
  const run = providers[preferred];
  if (!run) throw new Error(`unknown MODEL_PROVIDER: ${preferred}`);

  try {
    return await run({ userMessage, toolRouter, maxSteps });
  } catch (e) {
    const other = preferred === "featherless" ? "gemini" : "featherless";
    if (other === "gemini" && !process.env.GEMINI_API_KEY) throw e;
    if (other === "featherless" && !process.env.FEATHERLESS_API_KEY) throw e;
    console.error(`[agent] ${preferred} failed (${String(e?.message || e)}); falling back to ${other}`);
    return providers[other]({ userMessage, toolRouter, maxSteps });
  }
}
