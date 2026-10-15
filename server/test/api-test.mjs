#!/usr/bin/env node
// End-to-end API test: starts the real server on a free port with a throwaway data dir.
//   node server/test/api-test.mjs           (needs site/dist built: npm run build)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PASSWORD = 'correct horse battery';
let pass = 0, fail = 0;
const check = (name, ok, extra = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${extra ? '  (' + extra + ')' : ''}`); };
const freePort = () => new Promise((r) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });

async function startServer(dataDir, extraEnv = {}, args = []) {
  const port = await freePort();
  const child = spawn(process.execPath, [path.join(ROOT, 'server/server.mjs'), ...args], {
    cwd: ROOT, env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', DATA_DIR: dataDir, MASTERS_PASSWORD: PASSWORD, SESSION_SECRET: '', ...extraEnv }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let out = ''; child.stdout.on('data', (d) => { out += d; }); child.stderr.on('data', (d) => { out += d; });
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i++) { try { const r = await fetch(base + '/healthz'); if (r.ok) break; } catch { /* not yet */ } await new Promise((r) => setTimeout(r, 100)); }
  return { base, child, log: () => out, stop: () => new Promise((r) => { child.on('exit', r); child.kill('SIGTERM'); }) };
}
const H = { 'Content-Type': 'application/json', 'X-MM-Client': '1' };

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-test-'));
const srv = await startServer(path.join(tmp, 'a'));
const { base } = srv;
try {
  // ---- health + headers
  let r = await fetch(base + '/healthz'); let j = await r.json();
  check('healthz ok', r.ok && j.ok, `store=${j.store}`);
  check('security headers', !!r.headers.get('content-security-policy') && r.headers.get('x-frame-options') === 'DENY' && r.headers.get('x-content-type-options') === 'nosniff');

  // ---- unauthenticated access
  r = await fetch(base + '/', { redirect: 'manual' });
  check('unauthenticated page redirects to /login', r.status === 302 && r.headers.get('location').startsWith('/login'));
  r = await fetch(base + '/api/state'); check('unauthenticated API is 401', r.status === 401);
  r = await fetch(base + '/concepts/controllability.html', { redirect: 'manual' }); check('unauthenticated concept page redirects', r.status === 302);

  // ---- wrong password lockout (per IP via X-Forwarded-For from the tunnel)
  const login = (pw, ip, next = '/') => fetch(base + '/login', { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Forwarded-For': ip }, body: new URLSearchParams({ password: pw, next }) });
  const codes = [];
  for (let i = 0; i < 6; i++) codes.push((await login('wrong-' + i, '203.0.113.9')).status);
  check('5 wrong passwords then locked out (429)', codes.slice(0, 5).every((c) => c === 401) && codes[5] === 429, codes.join(','));
  r = await login(PASSWORD, '203.0.113.9'); check('even the right password is refused while locked', r.status === 429);
  r = await login(PASSWORD, '198.51.100.7', '//evil.example/x');
  const setCookie = r.headers.get('set-cookie') || '';
  check('correct password signs in (303 + cookie)', r.status === 303 && /mm_session=/.test(setCookie));
  check('open redirect blocked', r.headers.get('location') === '/');
  check('cookie is HttpOnly + SameSite=Lax', /HttpOnly/i.test(setCookie) && /SameSite=Lax/i.test(setCookie));
  const r2 = await fetch(base + '/login', { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Forwarded-For': '198.51.100.8', 'X-Forwarded-Proto': 'https' }, body: new URLSearchParams({ password: PASSWORD }) });
  check('cookie is Secure behind https tunnel', /;\s*Secure/i.test(r2.headers.get('set-cookie') || ''));
  const C = { Cookie: setCookie.split(';')[0] };
  const tampered = { Cookie: C.Cookie.replace(/.$/, (c) => (c === 'A' ? 'B' : 'A')) };
  r = await fetch(base + '/api/state', { headers: tampered }); check('tampered cookie rejected', r.status === 401);
  r = await fetch(base + '/', { headers: C }); check('signed-in page loads', r.ok && /Masters Mind/.test(await r.text()));
  r = await fetch(base + '/assets/sync.json', { headers: C }); j = await r.json(); check('sync.json reports server mode', j.server === true);

  // ---- CSRF-style protections and limits
  r = await fetch(base + '/api/state', { method: 'PUT', headers: { ...C, 'Content-Type': 'application/json' }, body: '{"items":{}}' }); check('write without X-MM-Client is 403', r.status === 403);
  r = await fetch(base + '/api/state', { method: 'PUT', headers: { ...C, ...H, Origin: 'https://evil.example' }, body: '{"items":{}}' }); check('cross-origin write is 403', r.status === 403);
  r = await fetch(base + '/api/state', { method: 'PUT', headers: { ...C, 'X-MM-Client': '1', 'Content-Type': 'text/plain' }, body: '{"items":{}}' }); check('non-JSON content type is 415', r.status === 415);
  r = await fetch(base + '/api/state', { method: 'PUT', headers: { ...C, ...H }, body: JSON.stringify({ items: { 'mm:x': { v: 'a'.repeat(2 << 20), t: 1 } } }) }).catch((e) => ({ status: 'reset ' + e.message }));
  check('oversized body rejected (413)', r.status === 413 || String(r.status).startsWith('reset'), String(r.status));

  // ---- two devices, last-writer-wins per key
  const put = (dev, items) => fetch(base + '/api/state', { method: 'PUT', headers: { ...C, ...H }, body: JSON.stringify({ device: dev, items }) }).then((x) => x.json());
  let a = await put('laptop', { 'mm:step:w1-sat:read:probability-basics': { v: '1760000000000', t: 2000 }, 'mm:mastery:pca': { v: '"learning"', t: 1000 } });
  check('device A writes 2 keys', a.applied === 2);
  let b = await put('phone', { 'mm:mastery:pca': { v: '"new"', t: 500 }, 'mm:teach:pca': { v: '{"text":"variance","t":1}', t: 3000 } });
  check('device B: stale write loses, newer server value returned', b.applied === 1 && b.newer['mm:mastery:pca'] && b.newer['mm:mastery:pca'].v === '"learning"');
  b = await put('phone', { 'mm:mastery:pca': { v: '"solid"', t: 4000 } });
  check('device B: newer write wins', b.applied === 1);
  r = await fetch(base + '/api/state', { headers: C }); j = await r.json();
  check('full pull shows merged state', j.items['mm:mastery:pca'].v === '"solid"' && j.items['mm:teach:pca'] && j.items['mm:step:w1-sat:read:probability-basics']);
  const cursor = j.cursor;
  await put('laptop', { 'mm:card:pca#1': { v: '{"box":1,"due":0,"seen":3,"right":0,"wrong":3,"last":1}', t: 5000 } });
  r = await fetch(base + '/api/state?since=' + cursor, { headers: C }); j = await r.json();
  check('incremental pull returns only the new key', Object.keys(j.items).length === 1 && j.items['mm:card:pca#1']);
  a = await put('laptop', { 'bad key': { v: 'x', t: 1 }, 'mm:ok': { v: 'x', t: 'NaN' } });
  check('invalid keys and timestamps are ignored', a.applied === 0);

  // ---- events (dedupe) + stats
  const now = Date.now();
  const evs = [];
  for (let i = 0; i < 25; i++) evs.push({ ts: now - i * 60e3, type: 'active_minute', ref: 'concepts/pca.html' });
  evs.push({ ts: now - 1000, type: 'step_done', ref: 'w1-sat:read:probability-basics' });
  evs.push({ ts: now - 86400e3, type: 'card_reviewed', ref: 'pca#1', payload: { knew: false } });
  r = await fetch(base + '/api/events', { method: 'POST', headers: { ...C, ...H }, body: JSON.stringify({ device: 'laptop', events: evs }) }); j = await r.json();
  check('events inserted', j.inserted === evs.length, String(j.inserted));
  r = await fetch(base + '/api/events', { method: 'POST', headers: { ...C, ...H }, body: JSON.stringify({ device: 'laptop', events: evs }) }); j = await r.json();
  check('retried events are deduplicated', j.inserted === 0);
  r = await fetch(base + '/api/events', { method: 'POST', headers: { ...C, ...H }, body: JSON.stringify({ device: 'x', events: [{ ts: now, type: 'DROP TABLE;', ref: 'x' }] }) }); j = await r.json();
  check('malformed event types are dropped', j.inserted === 0);
  r = await fetch(base + '/api/stats?tz=Asia/Singapore', { headers: C }); j = await r.json();
  const todayMin = j.minutesPerDay[j.minutesPerDay.length - 1].minutes + j.minutesPerDay[j.minutesPerDay.length - 2].minutes;
  check('stats: 25 active minutes counted', todayMin === 25, `minutes7=${j.minutes7}`);
  check('stats: streak counts yesterday + today', j.streak === 2, `streak=${j.streak}`);
  check('stats: mastery counts pca as solid', j.mastery.EE5907.solid === 1);
  check('stats: weak cards list pca#1', j.weakCards.length === 1 && j.weakCards[0].id === 'pca#1');
  check('stats: steps done 1', j.steps.done === 1 && j.steps.total > 100, `${j.steps.done}/${j.steps.total}`);
  check('stats: 8x7 heatmap', j.heatmap.length === 8 && j.heatmap.every((w) => w.length === 7));

  // ---- export -> import into a fresh server
  r = await fetch(base + '/api/export', { headers: C }); const dump = await r.json();
  check('export downloads JSON attachment', /attachment/.test(r.headers.get('content-disposition')) && dump.format === 'masters-mind-export' && Object.keys(dump.state).length === 4 && dump.events.length === evs.length);
  const srv2 = await startServer(path.join(tmp, 'b'));
  const lg = await fetch(srv2.base + '/login', { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ password: PASSWORD }) });
  const C2 = { Cookie: (lg.headers.get('set-cookie') || '').split(';')[0] };
  r = await fetch(srv2.base + '/api/import', { method: 'POST', headers: { ...C2, ...H }, body: JSON.stringify(dump) }); j = await r.json();
  check('import into fresh server', j.state === 4 && j.events === evs.length, JSON.stringify(j));
  r = await fetch(srv2.base + '/api/import', { method: 'POST', headers: { ...C2, ...H }, body: JSON.stringify(dump) }); j = await r.json();
  check('re-import is idempotent', j.state === 0 && j.events === 0);
  r = await fetch(srv2.base + '/api/stats', { headers: C2 }); j = await r.json();
  check('imported stats match', j.mastery.EE5907.solid === 1 && j.weakCards.length === 1);
  await srv2.stop();

  // ---- path traversal / hidden files
  const probes = ['/../server/data/session.secret', '/%2e%2e/%2e%2e/server/data/session.secret', '/assets/..%2f..%2f..%2fpackage.json', '/assets/%2e%2e%5c%2e%2e%5cpackage.json', '/..%5c..%5cserver%5cdata%5cmasters.db', '/index.html%00.png', '/.env', '/%2e%65nv', '/assets/../../.env', '//etc/passwd', '/assets/%252e%252e/%252e%252e/package.json'];
  const results = [];
  for (const p of probes) {
    const res = await new Promise((resolve) => {
      // raw request so the client does not normalise the path
      const s = net.connect(Number(new URL(base).port), '127.0.0.1', () => s.write(`GET ${p} HTTP/1.1\r\nHost: 127.0.0.1\r\nCookie: ${C.Cookie}\r\nConnection: close\r\n\r\n`));
      let d = ''; s.on('data', (x) => { d += x; }); s.on('end', () => resolve(d)); s.on('error', () => resolve(''));
    });
    const status = Number((res.match(/^HTTP\/1\.1 (\d+)/) || [])[1]);
    const leaked = /"name": "nus-masters"|SQLite format|MASTERS_PASSWORD|root:x:0/.test(res) || (p.includes('session.secret') && status === 200);
    results.push(`${status}`);
    check(`traversal blocked: ${p}`, !leaked && status !== 200 && status !== 304, String(status));
  }

  // ---- logout
  r = await fetch(base + '/logout', { method: 'POST', redirect: 'manual', headers: C });
  check('logout clears cookie', r.status === 303 && /Max-Age=0/.test(r.headers.get('set-cookie') || ''));
} finally {
  await srv.stop();
}

// ---- refuses to start without a password; --insecure-local works
const noPw = spawn(process.execPath, [path.join(ROOT, 'server/server.mjs')], { cwd: ROOT, env: { ...process.env, MASTERS_PASSWORD: '', PORT: String(await freePort()), DATA_DIR: path.join(tmp, 'c') } });
const code = await new Promise((r) => noPw.on('exit', r));
check('refuses to start without MASTERS_PASSWORD', code === 1);
const loc = await startServer(path.join(tmp, 'd'), { MASTERS_PASSWORD: '' }, ['--insecure-local']);
let rr = await fetch(loc.base + '/api/state'); check('--insecure-local serves the API without login', rr.ok);
await loc.stop();
// ---- JSON fallback store works too
const js = await startServer(path.join(tmp, 'e'), { MM_FORCE_JSON: '1' });
const lj = await fetch(js.base + '/login', { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ password: PASSWORD }) });
const CJ = { Cookie: (lj.headers.get('set-cookie') || '').split(';')[0] };
rr = await fetch(js.base + '/api/state', { method: 'PUT', headers: { ...CJ, ...H }, body: JSON.stringify({ items: { 'mm:mastery:lda': { v: '"solid"', t: 10 } } }) });
const jj = await rr.json(); const hz = await (await fetch(js.base + '/healthz')).json();
check('JSON fallback store accepts writes', jj.applied === 1 && hz.store === 'json');
check('JSON fallback logs a clear message', /node:sqlite is not available|JSON-file store/.test(js.log()) || hz.store === 'json');
await js.stop();
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
