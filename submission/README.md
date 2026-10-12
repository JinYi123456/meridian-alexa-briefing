# Meridian — submission package

Everything Devpost needs, ready to paste or upload.

## 📸 Media (upload these on Devpost)
- `media/production/thumbnail-3x2.jpg` — Devpost thumbnail (3:2, ≤5 MB) ✔ ready — 16:9版 `media/production/thumbnail.jpg`
- `submission/screenshots/01-hero.png` … `09-mobile-live.png` — 9 hi-res shots ✔ ready
- Demo video (2:13, English): https://youtu.be/MLQzrs07ng8 — master at `media/production/meridian-demo.mp4` (local-only, not in repo)

## 📋 Text answers — open and copy-paste
- **`docs/submission-devpost.md`** — every Devpost form field, written out in full: project name, elevator pitch, full "About the project" story, Built-with tags, feedback answers Q1–Q5 (complete verbatim text, no references to other docs), optional Feature Requests (6 items with priorities), optional Friction Log (full 7-row table). Nothing left as "[paste from somewhere else]".
- **`docs/demo-video-plan.md`** — full cinematic plan: concept, shot list, recording setup, edit recipe, 85-word VO script, shot-sync map, assembly checklist.

## 🗂 Project Story (Quick copy)
The full Inspiration / What it does / How we built it / Challenges / Accomplishments / What's next story block lives in `docs/submission-devpost.md` §2 — copy it straight into Devpost "About the project".

## 🔑 Repo & Live URL
- **Judging repo:** https://github.com/JinYi123456/meridian-alexa-briefing (public, MIT license visible — satisfies the repo requirement)
- **Live URL:** https://meridian-alexa.vercel.app — paste it into Devpost's "Try it out" links + Optional Project Testing Link.
- **Demo video:** https://youtu.be/MLQzrs07ng8

## 📦 Additional file upload (≤35 MB)
Zip **this folder** (`submission/`) as `meridian-submission.zip` and upload it in Devpost's "Upload a file" field. Contents:
- `screenshots/` — full media set (9 shots)
- `submission-devpost.md` — every Devpost form field written out
- `form-answers-final.md` — the final answers as filled on Devpost
- `demo-video-plan.md` — storyboard / video plan
- `vercel-deploy-guide.md` — deployment notes
- `youtube-description.md` — video title / chapters / description kit
- `project-feedback.pdf` — friction log (bonus)

## 🚫 Never commit/upload
- `.env` (your API keys), `node_modules/`, raw `.webm` takes >35 MB, server logs, PRIVATE_NOTES.md
