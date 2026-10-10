/**
 * agent.js - Gemini native tool-calling loop.
 * The LLM itself decides when to call MCP tools; we just wire through.
 */
import { GoogleGenAI } from "@google/genai";

let _ai = null;
function getAi() {
  if (!_ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY not set");
    _ai = new GoogleGenAI({ apiKey: key });
  }
  return _ai;
}
const MODEL = "gemini-2.0-flash";

export async function agentLoop({ userMessage, toolRouter, maxSteps = 12 }) {
  const convo = [
    { role: "user", parts: [{ text: userMessage }] },
  ];
  const systemPrompt = `You are Meridian, an agentic chief-of-staff.
Given a messy real-life constraint dump from the user, use tools to:
1. push_progress as you go so the user sees planning live
2. call current_time once (deterministic clock)
3. optionally search or check facts (search_web)
4. finalize by calling write_canvas with concrete day/time blocks
5. optionally queue notify_later reminders
Speak warmly and concisely in English.`;

  for (let i = 0; i < maxSteps; i++) {
    const res = await getAi().models.generateContent({
      model: MODEL,
      contents: convo,
      config: {
        systemInstruction: systemPrompt,
        tools: [{ functionDeclarations: toolRouter.declarations() }],
      },
    });

    // forward any text fragment
    const text = res.text ?? "";
    if (text.trim()) toolRouter.onText?.(text);

    const calls = res.functionCalls ?? [];
    if (!calls.length) return { done: true, text };
    convo.push({ role: "model", parts: calls.map((c) => ({ functionCall: c })) });

    const results = await Promise.all(
      calls.map(async (call) => {
        const out = await toolRouter.call(call.name, call.args);
        return { functionResponse: { name: call.name, response: out } };
      })
    );
    convo.push({ role: "user", parts: results });
  }
  return { done: false, text: "reached max steps" };
}
