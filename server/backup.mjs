#!/usr/bin/env node
// Copy the progress database to server/backups/ with a timestamp; keep the newest 14.
//   npm run backup        (safe while the server is running: uses SQLite VACUUM INTO)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openStore } from './db.mjs';
import { loadEnvFile } from './env.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
loadEnvFile(path.join(ROOT, '.env'));
const DATA_DIR = path.resolve(ROOT, process.env.DATA_DIR || 'server/data');
const OUT = path.resolve(ROOT, process.env.BACKUP_DIR || 'server/backups');
const KEEP = Number(process.env.BACKUP_KEEP || 14);

const store = await openStore(DATA_DIR, { log: () => {} });
fs.mkdirSync(OUT, { recursive: true });
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
const ext = store.kind === 'sqlite' ? 'db' : 'json';
const dest = path.join(OUT, `masters-${stamp}.${ext}`);
if (fs.existsSync(dest)) fs.rmSync(dest);
store.backup(dest);
store.close();
const all = fs.readdirSync(OUT).filter((f) => /^masters-\d{8}-\d{6}\.(db|json)$/.test(f)).sort();
const old = all.slice(0, Math.max(0, all.length - KEEP));
for (const f of old) fs.rmSync(path.join(OUT, f));
console.log(`Backup written: ${path.relative(ROOT, dest)} (${(fs.statSync(dest).size / 1024).toFixed(1)} KB). Kept ${Math.min(all.length, KEEP)}, removed ${old.length}.`);
