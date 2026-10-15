#!/usr/bin/env node
// npm start: build the site if dist/ is missing (or older than the vault), then run the server.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { loadEnvFile } = await import('../server/env.mjs');
loadEnvFile(path.join(ROOT, '.env')); // e.g. VAULT=..., passed on to the build and the server
const major = Number(process.versions.node.split('.')[0]);
if (major < 22) { console.error(`Node ${process.version} is too old. Install Node 22 LTS or newer.`); process.exit(1); }

const dist = path.join(ROOT, 'site/dist/index.html');
const vault = process.env.VAULT ? path.resolve(ROOT, process.env.VAULT) : path.join(ROOT, 'vault');
if (process.env.VAULT) process.env.VAULT = vault; // absolute for the build child process
function newest(dir) { let t = 0; const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (e.name.startsWith('.')) continue; const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else t = Math.max(t, fs.statSync(p).mtimeMs); } }; if (fs.existsSync(dir)) walk(dir); return t; }
const stale = !fs.existsSync(dist) || newest(vault) > fs.statSync(dist).mtimeMs || newest(path.join(ROOT, 'site/src')) > fs.statSync(dist).mtimeMs;
if (stale || process.argv.includes('--build')) {
  console.log(fs.existsSync(dist) ? 'Vault or site changed since the last build: rebuilding…' : 'No build yet: building the site…');
  const r = spawnSync(process.execPath, [path.join(ROOT, 'site/build.mjs')], { stdio: 'inherit', cwd: path.join(ROOT, 'site') });
  if (r.status !== 0) process.exit(r.status || 1);
}
const extra = process.argv.slice(2).filter((a) => a !== '--build');
const child = spawn(process.execPath, [path.join(ROOT, 'server/server.mjs'), ...extra], { stdio: 'inherit', cwd: ROOT });
child.on('exit', (code) => process.exit(code ?? 0));
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill(sig));
