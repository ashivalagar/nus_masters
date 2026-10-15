# Handoff: Masters Mind

For a fresh Claude Code session, or Shiv, picking this up cold (for example on the Windows PC).

## 1. Context
- Shiv: MSc Electrical Engineering at NUS, part-time, studies on weekends, about 5 years out of university, starting from near zero.
- Exams: **EE5907 Pattern Recognition, Sat 28 Nov 2026, 1:00 PM (2 h)**; **EE5101 Linear Systems, Tue 1 Dec 2026, 1:00 PM (2.5 h)**.
- **EE5907 Assignment 2 is due Fri 6 Nov 2026, 5:59 PM** (needs 10 selfies; wrong filename costs 20 points; late penalties are steep).
- EE5101: lectures Mondays 6 to 9 PM; L9 to L11 on 19 Oct, 26 Oct, 2 Nov. The 2026 exam format and the Part 2 project brief (30%) are not yet confirmed.
- EE5907: no past paper exists. The 2021/22 EE5101 paper is open book (4 compulsory questions, 25 marks each); the 2026 format is unconfirmed.

## 2. Architecture
```
vault/NUS Masters/*.md  (Obsidian)        site/src/path.mjs (weeks, sessions, steps)
        |                                   site/src/labs/*.js (21 interactive labs)
        v                                          |
   site/build.mjs  ------------------------------> site/dist/  (static HTML/CSS/JS, KaTeX pre-rendered)
                                                    |
                          server/server.mjs  <------+  serves dist + /api/* + login
                                |
                          server/data/masters.db  (SQLite; JSON-file fallback)
                                |
                          ngrok http 8080  --->  https://<your-domain>.ngrok-free.app
```
The browser keeps progress in localStorage (works offline or on a plain static host) and syncs to `/api/state` when the server is reachable.

## 3. Repo map
- `vault/NUS Masters/`: the Obsidian vault (open this folder in Obsidian). `Concepts/` (Math Foundations, Linear Systems, Pattern Recognition), course maps, `Study Plan/`, `00 Start Here/`, `Visual Labs/` (Python originals plus images).
- `site/`: `build.mjs`, `src/path.mjs` (the learning path data), `src/labs/` (JS labs, shared `_kit.js`), `src/client`, `src/styles`, `src/templates.mjs`, `scripts/` (lab tests, verifier).
- `server/`: `server.mjs`, `db.mjs`, `stats.mjs`, `schema.sql`, `migrations/`, `backup.mjs`, `test/`.
- `scripts/start.mjs`, `scripts/dev.mjs`, `start-windows.ps1`, `start.sh`, `.env.example`.

## 4. Setup from zero on Windows
1. Install **Node.js 22 LTS or newer** (nodejs.org) and **Git**. Install **ngrok** and run `ngrok config add-authtoken <token>` (from your ngrok dashboard).
2. `git clone https://github.com/ashivalagar/nus_masters` then `cd nus_masters`.
3. Run `.\start-windows.ps1` once. It creates `.env` from `.env.example`; open it (`notepad .env`), set `MASTERS_PASSWORD` to a long passphrase, save.
4. Run `.\start-windows.ps1` again. It runs `npm install`, builds, and starts on http://localhost:8080. Check http://localhost:8080/healthz returns `{"ok":true,...}`.
5. Expose it: `ngrok http 8080` (or set `NGROK_DOMAIN` in `.env` and use `.\start-windows.ps1 -Tunnel`). Free accounts get one static domain; use it so the URL never changes.
6. Alternative auth handled by ngrok instead of the app password (matches the earlier GitHub-login wish): check the current syntax at https://ngrok.com/docs/traffic-policy/ and https://ngrok.com/docs (OAuth / traffic policy). The app password stays as a second layer.
7. Run at login: Task Scheduler, Create Task, trigger "At log on", action `powershell.exe -ExecutionPolicy Bypass -File "C:\path\to\nus_masters\start-windows.ps1"`, tick "Run whether user is logged on or not" only if `.env` is complete (no prompts).

## 5. Day-to-day
- Edit notes in Obsidian (open `vault/NUS Masters`). `npm run dev` rebuilds on every save.
- Sync with the Mac: `git pull` / `git add -A && git commit -m "notes" && git push`. The database and `.env` are never committed.
- Backups: `npm run backup` (schedule it weekly in Task Scheduler). Full export from the Stats page or `GET /api/export`; restore with `POST /api/import`.
- To move progress between machines, export from one and import into the other.

## 6. How things work
- **Learning path:** `site/src/path.mjs` defines weeks, sessions and typed steps (`read`, `see`, `predict`, `quiz`, `teach`, `do`, `checkpoint`). Add a week or a step there; the build fails if a concept note is not covered by any step.
- **Labs:** one file per lab in `site/src/labs/`, named like the Python script (`NN_name.js`), built on `_kit.js`. Concept notes embed a lab via `![[NN_name.png]]`; the build swaps in the interactive lab and keeps the PNG as a static fallback. Test numerics with `npm run test:labs`.
- **Flashcards:** any `## Self-test` list item written `1. Question *(answer)*` becomes a reveal card and a Review deck entry.
- **Note conventions:** YAML frontmatter with tags (`exam-likely`, `core`); a `## 🧠 Mental picture` section first; `Needs:` / `Used by:` / `Dual:` lines under the title feed the prerequisite strip; `[[wikilinks]]`; foldable callouts `> [!note]- Title`; LaTeX `$..$`.
- **Database:** `kv_state` (per-key blobs with `updated_at`, last writer wins per key) and an append-only `events` log (step_done, card_reviewed, lab_opened, session_start) behind `/api/stats` (streak, minutes per day, mastery counts, cards due, week heatmap). Schema in `server/schema.sql`.
- **API:** `GET/PUT /api/state`, `POST /api/events`, `GET /api/stats`, `GET /api/export`, `POST /api/import`, `GET /healthz`. Writes need a custom header (CSRF guard) plus the session cookie.

## 7. Security (the site is exposed to the internet)
- The server refuses to start without `MASTERS_PASSWORD` unless `--insecure-local` is passed (binds 127.0.0.1 only).
- Login sets an HttpOnly, SameSite=Lax HMAC-signed cookie; constant-time compare; per-IP lockout on failures; body size limits; path traversal tested.
- This GitHub repo is **public**. `.gitignore` excludes PDFs, zips, notebooks, past papers and worked past-paper answers. Never commit course files. The Mac keeps the full vault (including those) at `~/Documents/NUS Masters`; copy course files into your local vault only if you want them, and keep them untracked.
- Keep `.env` and `server/data/` out of git (already ignored).

## 8. Known gaps / TODO
- After each lecture, flesh out the primer notes: Decoupling, Observers (EE5101 L9 to L11), GMM and EM, SVM, Boosting (EE5907 Part II). They are marked "Upcoming lecture" on the site.
- Get from the lecturers: the EE5101 2026 exam format and Part 2 project brief; EE5907 sample papers (ask the GA, Nguyen Tuan Hiep).
- Take the 10 selfies for Assignment 2 (this week).
- Nothing yet adds study blocks to a calendar (offered, not requested).
- Browser-level testing was done on Chromium only (desktop and phone width, light and dark).

## 9. Verification checklist
`npm test` (expects 0 failures), `npm run verify`, open `/healthz`, log in with a wrong password then the right one, tick a step on the phone and see it on the laptop after reload, open three labs, flip a flashcard, run `npm run backup`.

## 10. Troubleshooting
- "Refuses to start": set `MASTERS_PASSWORD` in `.env`.
- Blank labs: hard-refresh (the site is cached); run `npm run build` again.
- `node:sqlite` missing (Node older than 22.5): the server falls back to a JSON file and logs it; upgrade Node.
- ngrok shows an interstitial page: normal on free plans, click through once.
