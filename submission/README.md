# Meridian — submission package

Everything Devpost needs, ready to paste or upload.

## 📸 Media (upload these on Devpost)
- `media/thumbnail.png` — 3:2 thumbnail (≤5 MB) ✔ ready
- `media/gallery/01…09.png` — 9 hi-res shots: hero, mobile, canvas, agent thinking, plan complete, drag & rebalance, mobile live ✔ ready
- `media/meridian-demo-take2.webm` — raw footage (edit to final <3 min video per `docs/demo-video-plan.md`, then upload to YouTube and paste the link)

## 📋 Text answers — open and copy-paste
- **`docs/submission-devpost.md`** — every Devpost form field, written out in full: project name, elevator pitch, full "About the project" story, Built-with tags, feedback answers Q1–Q5 (complete verbatim text, no references to other docs), optional Feature Requests (6 items with priorities), optional Friction Log (full 7-row table). Nothing left as "[paste from somewhere else]".
- **`docs/demo-video-plan.md`** — full cinematic plan: concept, shot list, recording setup, edit recipe, 85-word VO script, shot-sync map, assembly checklist.

## 🗂 Project Story (Quick copy)
The full Inspiration / What it does / How we built it / Challenges / Accomplishments / What's next story block lives in `docs/submission-devpost.md` §2 — copy it straight into Devpost "About the project".

## 🔑 Repo & Live URL
- **Judging repo:** https://github.com/JinYi123456/meridian-alexa-briefing (public, MIT license visible — satisfies the repo requirement)
- **Live URL (after Vercel deploy):** see `vercel-ready/README.md` — deploy takes ~2 minutes on vercel.com/new, then paste `https://<project>.vercel.app` into Devpost's "Try it out" links + Optional Project Testing Link.

## 📦 Additional file upload (≤35 MB)
Zip **this folder** (`submission/`) as `meridian-submission.zip` and upload it in Devpost's "Upload a file" field. Contents:
- `screenshots/` — full media set
- `project-feedback.pdf` — exported from `docs/product-feedback.md` (friction log bonus)
- `submission_form_answers.md` — copy of `docs/submission-devpost.md`
- `demo-storyboard.md` — copy of `docs/demo-video-plan.md`
- (optionally) final edited demo video `.mp4` if it fits under 35 MB

## 🚫 Never commit/upload
- `.env` (your API keys), `node_modules/`, raw `.webm` takes >35 MB, server logs, PRIVATE_NOTES.md
