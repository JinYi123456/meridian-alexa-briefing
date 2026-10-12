# Meridian Demo Video — Full Production Plan

Target: **YouTube/Vimeo public link, < 3 minutes, English, 1080p.**
This is the plan for a cinematic, judge-proof demo — not a dry screen capture.

---

## 1. Concept: "The Chaos Test"

Every hackathon demo video does the same thing: talking head → screen capture → feature list.
Ours opens like a *product film*:

1. **Hook (0:00–0:08)** — black screen, chaos. On-screen words fly in fast, tumbling over each other:
   *flight Wednesday. report Thursday. dad's birthday when?? dinner!! report!! flight!!* — text collides, overlaps, gets louder in size — a life dissolving into noise.
   Then: silence. One line fades in:

   > **"Your week doesn't have to sound like this."**

2. **Transformation (0:08–0:15)** — the Meridian hero orb appears (the real UI), the same chaos-sentence is spoken into it. The orb **absorbs** the mess — the flying words literally get sucked into the input box as the user types the same sentence.

3. **The Build (0:15–1:15)** — the real product, sped up in motion:
   - click the scenario chip → user bubble → thinking dots
   - progress chips appear + tool-calls counter ticking up (visible proof of agency)
   - canvas blocks **fly onto the timeline** one by one (screen-recorded live push, sped up 1.2×)
   - final agent reply in a chat bubble

4. **The Twist — drag (1:15–1:45)** — the shot judges remember:
   - voice-over goes quiet, cursor grabs a block, drags it across days
   - the pipeline banner pops "agent re-orchestrating…"
   - **the schedule rearranges itself** while we watch
   - whispers (VO): *"Move one thing. It re-plans everything."*

5. **Proof of protocol (1:45–2:15)** — quick cut of a terminal: `curl` initialize → tools list → SSE pushes; then the proactive nudge bubble appearing **after we stopped typing**. VO: *"It's not a chatbot wrapper. It's a real MCP server — spec 2025-11-25 — with server-initiated pushes."*

6. **Voice + language flourish (2:15–2:35)** — mic button pulse → a short spoken messy sentence in the user's language → chat + canvas respond in the same language. VO: *"Speak it. Typing is optional."*

7. **Close (2:35–2:50)** — back to the hero orb, calm now. End card:

   > **Meridian** — *Speak the chaos. Watch the plan assemble.*
   > Self-hosted MCP · spec 2025-11-25 · github.com/JinYi123456/meridian-alexa-briefing

---

## 2. What gets recorded (raw footage list)

| # | Shot | Tool | Duration raw | Speed in edit |
|---|---|---|---|---|
| A | Hero idle + conn badge "mcp live" | browser 1440×900 | 15s | 1× |
| B | Full agent run (chip → blocks → reply) | browser 1440×900 | 60s | 1.4× |
| C | Drag + re-orchestrate | browser 1440×900 | 25s | 1.2× |
| D | Terminal curl init / tools / GET SSE stream | terminal 1280×720 split | 20s | 1× |
| E | Proactive nudge after idle | browser | 20s | 1× |
| F | Mic input + non-English reply | browser | 20s | 1× |
| G | Mobile layout | browser/tab 390×844 | 15s | 1× |
| H | End card | generated PNG | 8s | 1× |

Rules: record everything at 1080p, browser zoom 100%, dark desktop wallpaper; 60 fps where possible.

## 3. Recording setup (this machine)

- **Capture tool:** browser recording (preview_recording) per shot, or OBS if the user wants VO together. Prefer **silent capture + separate VO** (cleaner audio).
- Screen: 1920×1080, browser window 1440×900 crop-scaled to 1080p (crisp text).
- Before every take: fresh MCP session (reload), clear `.logs`, verify conn badge says `mcp live · meridian@2025-11-25`.
- Provider: **Featherless primary** (no Gemini 429 risk during takes). Keep a Gemini fallback ready.
- Record each shot **twice** (A/B); keep the better one. Total raw ≈ 8–10 min.

## 4. Editing recipe

- **Editor:** CapCut / DaVinci Resolve (free) — cut on music beats, speed-ramp B/C shots.
- **Music:** a single dark-electronic bed, builds at 0:08 and drops at 1:15 (the drag twist gets silence). Sources: Artlist free tier / Pixabay.
- **VO script (English, ~85 words):** see §5 — record on a phone mic close to mouth (or AI TTS ElevenLabs if user prefers).
- **Text overlays:** the flying-chaos words (hook), stat callouts ("tool calls: 8 → LIVE counter"), section captions (MCP · SPEC · APPS).
- **Captions:** burned-in subtitles in English throughout.
- Color: slight teal-purple grade to match the UI; grain +2%; vignette -10%.

## 5. VO Script (verbatim, ~85 words → ≈2:40)

> (hook, over chaos words) *"This is Monday. Most weeks sound like this."*
> (0:08) *"We built Meridian — a chief-of-staff that lives behind MCP. One messy sentence. It hears everything."*
> (0:15) *"Watch it work: it checks the time, searches what it needs, and writes your two days — live, while you look."*
> (1:15) *"Move one block. It re-plans everything — in real time."*
> (1:45) *"This is a real MCP server. Spec 2025-11-25. Server-initiated pushes. Any MCP client can drive it."*
> (2:15) *"Speak. English, Chinese, anything — it answers in your language."*
> (2:35) *"Meridian. Speak the chaos. Watch the plan assemble."*

## 6. Shot-to-script sync map

| Script line | Shot | Overlay |
|---|---|---|
| Monday chaos | Hook animation | flying words |
| "Meridian…behind MCP" | A hero + title card | wordmark |
| "One messy sentence…" | B start (typing) | none |
| "checks time, searches, writes" | B mid | tool-call chips flash |
| "two days — live" | B end (blocks landing) | date pills |
| "Move one block." | C drag | none (silence) |
| "re-plans everything" | C re-orchestrate banner | "AGENT RE-PLANNING" |
| "real MCP server" | D terminal | curl lines highlighted |
| "server-initiated pushes" | E nudge | "Arrived AFTER no typing" |
| "Speak…" | F mic + 中文 | none |
| end tag | H end card | URLs |

## 7. Assembly checklist (day of edit)

- [ ] All 8 shots recorded (A–H), each ≥2 takes
- [ ] Music bed trimmed to 2:50, ducked under VO
- [ ] Captions burned in
- [x] Export 1080p H.264 (YouTube preset), audio -14 LUFS → `media/production/meridian-demo.mp4`
- [x] Upload to YouTube (public) → https://youtu.be/1ewnFKpYSyI
- [ ] Thumbnail PNG 3:2 from 1:15 (the drag-twist frame) [see submission doc]
- [ ] Check link plays on a logged-out phone (public visibility)
