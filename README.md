# NUS Masters: Masters Mind

An Obsidian vault of EE5101 / EE5907 notes, a static learning site generated from it (week-by-week guided path, 21 interactive labs, flashcards, progress tracking), and a small self-hosted server with a SQLite database that stores your progress.

```
vault/NUS Masters  --(npm run build)-->  site/dist  --served by-->  server (SQLite)  --(ngrok)-->  phone / anywhere
   Obsidian notes                          static pages            progress API + login
```

## Quick start (macOS / Linux)
```
cp .env.example .env      # set MASTERS_PASSWORD
npm install
npm start                 # builds if needed, then http://localhost:8080
```
Windows: see [docs/HANDOFF.md](docs/HANDOFF.md) (`start-windows.ps1`). No password, this machine only: `npm run start:local`.

## Commands
| Command | What it does |
|---|---|
| `npm run build` | Vault to `site/dist` |
| `npm start` | Build if missing, start the server (needs `MASTERS_PASSWORD`) |
| `npm run dev` | Watch the vault, rebuild on change |
| `npm run backup` | Timestamped copy of the database (keeps 14) |
| `npm test` | Lab numerics + server/API tests |
| `npm run verify` | Link, KaTeX and coverage checks on the built site |

This repo is **public**: PDFs, zips, notebooks, past papers and worked past-paper answers are gitignored on purpose. Read [docs/HANDOFF.md](docs/HANDOFF.md) before changing that.
