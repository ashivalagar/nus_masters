#!/usr/bin/env node
// npm run dev: build, start the server, and rebuild whenever the vault or the site source changes
// (so edits made in Obsidian show up on the next page refresh).
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { loadEnvFile } = await import('../server/env.mjs');
loadEnvFile(path.join(ROOT, '.env'));
const VAULT_DIR = process.env.VAULT ? path.resolve(ROOT, process.env.VAULT) : path.join(ROOT, 'vault');
if (process.env.VAULT) process.env.VAULT = VAULT_DIR;
const build = () => {
  const t = Date.now();
  const r = spawnSync(process.execPath, [path.join(ROOT, 'site/build.mjs')], { cwd: path.join(ROOT, 'site'), encoding: 'utf8' });
  if (r.status === 0) console.log(`[dev] rebuilt in ${Date.now() - t} ms`);
  else console.error('[dev] build failed:\n' + (r.stderr || r.stdout));
  return r.status === 0;
};
if (!build()) process.exit(1);
const args = process.argv.slice(2);
const server = spawn(process.execPath, [path.join(ROOT, 'server/server.mjs'), ...args], { stdio: 'inherit', cwd: ROOT });
server.on('exit', (c) => process.exit(c ?? 0));

let timer = null, pending = new Set();
const ignore = (f) => !f || /(^|[\\/])(\.obsidian|\.trash|dist|node_modules|\.git)([\\/]|$)/.test(f) || /\.(tmp|swp)$|~$/.test(f);
const onChange = (where) => (ev, f) => {
  if (ignore(f)) return;
  pending.add(path.join(where, String(f)));
  clearTimeout(timer);
  timer = setTimeout(() => { console.log(`[dev] changed: ${[...pending].slice(0, 3).map((p) => path.relative(ROOT, p)).join(', ')}${pending.size > 3 ? ' …' : ''}`); pending.clear(); build(); }, 400);
};
for (const p of [VAULT_DIR, path.join(ROOT, 'site/src'), path.join(ROOT, 'site/build.mjs')]) {
  const dir = path.relative(ROOT, p) || p;
  if (!fs.existsSync(p)) continue;
  try { fs.watch(p, { recursive: fs.statSync(p).isDirectory() }, onChange(fs.statSync(p).isDirectory() ? p : path.dirname(p))); }
  catch (e) { console.warn(`[dev] cannot watch ${dir}: ${e.message}`); }
}
console.log('[dev] watching vault/ and site/src/ for changes. Refresh the browser after a rebuild.');
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { server.kill(sig); process.exit(0); });
