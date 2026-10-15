#!/usr/bin/env node
// Masters Mind server: serves site/dist and the progress-tracking API. Zero npm dependencies.
//
//   MASTERS_PASSWORD=... node server/server.mjs            (normal, password protected)
//   node server/server.mjs --insecure-local                 (no password, binds 127.0.0.1 only)
//
// Env: PORT (8080), HOST (127.0.0.1), MASTERS_PASSWORD, SESSION_SECRET (auto-generated into data/ if unset),
//      DATA_DIR (server/data), DIST_DIR (site/dist), SESSION_DAYS (30), TRUST_PROXY (1 = trust X-Forwarded-* from ngrok)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { openStore } from './db.mjs';
import { computeStats, loadSiteData } from './stats.mjs';
import { loadEnvFile } from './env.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
loadEnvFile(path.join(ROOT, '.env'));

const args = new Set(process.argv.slice(2));
const INSECURE = args.has('--insecure-local') || process.env.MASTERS_INSECURE_LOCAL === '1';
const PORT = Number(process.env.PORT || 8080);
const HOST = INSECURE ? '127.0.0.1' : (process.env.HOST || '127.0.0.1');
const DATA_DIR = path.resolve(ROOT, process.env.DATA_DIR || 'server/data');
const DIST = path.resolve(ROOT, process.env.DIST_DIR || 'site/dist');
const PASSWORD = process.env.MASTERS_PASSWORD || '';
const SESSION_DAYS = Number(process.env.SESSION_DAYS || 30);
const TRUST_PROXY = process.env.TRUST_PROXY !== '0';
const MAX_BODY = 1 << 20;          // 1 MB for normal API writes
const MAX_IMPORT = 25 << 20;       // 25 MB for /api/import
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

if (!INSECURE && PASSWORD.length < 8) {
  console.error('Refusing to start: set MASTERS_PASSWORD (at least 8 characters) in .env or the environment,\n' +
    'or run with --insecure-local for a password-free server bound to 127.0.0.1 only.');
  process.exit(1);
}
if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error(`No built site at ${DIST}. Run "npm run build" first.`);
  process.exit(1);
}

fs.mkdirSync(DATA_DIR, { recursive: true });
const SECRET = (() => {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32) return Buffer.from(process.env.SESSION_SECRET);
  const f = path.join(DATA_DIR, 'session.secret');
  if (!fs.existsSync(f)) fs.writeFileSync(f, crypto.randomBytes(48).toString('base64url'), { mode: 0o600 });
  return Buffer.from(fs.readFileSync(f, 'utf8').trim());
})();
const store = await openStore(DATA_DIR, { log });
const siteData = loadSiteData(path.join(DIST, 'assets/data.js'));

/* ------------------------------------------------------------------ helpers */
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();
const safeEqual = (a, b) => crypto.timingSafeEqual(sha(a), sha(b)); // equal-length digests: constant time
const sign = (payload) => crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');

function makeSession() {
  const payload = Buffer.from(JSON.stringify({ sid: crypto.randomBytes(9).toString('base64url'), exp: Date.now() + SESSION_DAYS * DAY })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}
const DAY = 864e5;
function readSession(req) {
  const m = /(?:^|;\s*)mm_session=([^;]+)/.exec(req.headers.cookie || '');
  if (!m) return null;
  const [payload, sig] = m[1].split('.');
  if (!payload || !sig) return null;
  const good = sign(payload);
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  try { const s = JSON.parse(Buffer.from(payload, 'base64url').toString()); return s.exp > Date.now() ? s : null; } catch { return null; }
}
const isHttps = (req) => (TRUST_PROXY && String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https') || !!req.socket.encrypted;
function cookie(req, value, maxAgeSec) {
  return `mm_session=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${isHttps(req) ? '; Secure' : ''}`;
}
function clientIp(req) {
  const xf = TRUST_PROXY ? String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() : '';
  return xf || req.socket.remoteAddress || '?';
}
function hostOf(req) { return (TRUST_PROXY && req.headers['x-forwarded-host']) || req.headers.host || ''; }
function sameOrigin(req) {
  const o = req.headers.origin;
  if (!o) return true; // non-browser clients (curl) and same-origin GETs may omit it
  try { return new URL(o).host === hostOf(req); } catch { return false; }
}

function securityHeaders(res, req) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
  if (isHttps(req)) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
}
function send(res, status, body, type = 'text/plain; charset=utf-8', extra = {}) {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', ...extra });
  res.end(body);
}
const json = (res, status, obj, extra) => send(res, status, JSON.stringify(obj), 'application/json; charset=utf-8', extra);

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const tooBig = () => Object.assign(new Error('Request body too large'), { status: 413 });
    if (Number(req.headers['content-length'] || 0) > limit) { req.resume(); return reject(tooBig()); }
    let size = 0, over = false; const chunks = [];
    req.on('data', (c) => { if (over) return; size += c.length; if (size > limit) { over = true; reject(tooBig()); } else chunks.push(c); });
    req.on('end', () => { if (!over) resolve(Buffer.concat(chunks).toString('utf8')); });
    req.on('error', reject);
  });
}
async function readJson(req, limit = MAX_BODY) {
  if (!/^application\/json\b/i.test(req.headers['content-type'] || '')) throw Object.assign(new Error('Content-Type must be application/json'), { status: 415 });
  const txt = await readBody(req, limit);
  try { return JSON.parse(txt); } catch { throw Object.assign(new Error('Invalid JSON'), { status: 400 }); }
}

/* ------------------------------------------------------------------ login rate limiting */
const failures = new Map(); // ip -> {count, first, lockedUntil}
let globalFails = [];
const WINDOW = 15 * 60e3, MAX_FAILS = 5, LOCK = 15 * 60e3, GLOBAL_MAX = 50;
function loginBlocked(ip) {
  const now = Date.now();
  globalFails = globalFails.filter((t) => now - t < 3600e3);
  if (globalFails.length >= GLOBAL_MAX) return 3600e3 - (now - globalFails[0]);
  const f = failures.get(ip);
  if (f && f.lockedUntil > now) return f.lockedUntil - now;
  return 0;
}
function noteFailure(ip) {
  const now = Date.now(); globalFails.push(now);
  let f = failures.get(ip);
  if (!f || now - f.first > WINDOW) f = { count: 0, first: now, lockedUntil: 0 };
  f.count++;
  if (f.count >= MAX_FAILS) { f.lockedUntil = now + LOCK; log(`[auth] ${ip} locked out for 15 min after ${f.count} failed logins`); }
  failures.set(ip, f);
}
setInterval(() => { const now = Date.now(); for (const [ip, f] of failures) if (now - f.first > WINDOW && f.lockedUntil < now) failures.delete(ip); }, 60e3).unref();

/* ------------------------------------------------------------------ login page */
function loginPage(msg = '', next = '/') {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sign in · Masters Mind</title>
<link rel="icon" href="/assets/favicon.svg"><link rel="stylesheet" href="/assets/fonts/fonts.css">
<style>
:root{color-scheme:light dark;--paper:#f3f4ef;--sheet:#fbfbf8;--ink:#18202b;--ink3:#5f6876;--rule:#d6dad0;--warn:#9a5b00;--focus:#2a78d6}
@media (prefers-color-scheme:dark){:root{--paper:#10161e;--sheet:#161e28;--ink:#e4e8ee;--ink3:#939dab;--rule:#283241;--warn:#e0a447;--focus:#6aa8f0}}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--paper);color:var(--ink);font:16px/1.5 'IBM Plex Sans',system-ui,sans-serif;padding:16px}
main{width:min(24rem,100%);background:var(--sheet);border:1px solid var(--rule);border-radius:16px;padding:1.6rem 1.5rem}
h1{font:600 1.7rem/1.1 'Literata',Georgia,serif;margin:0 0 .4rem}p{margin:0 0 1.2rem;color:var(--ink3)}
label{display:block;font-weight:600;font-size:.9rem;margin-bottom:.35rem}
input{width:100%;min-height:46px;padding:.5rem .75rem;border:1px solid var(--rule);border-radius:10px;background:var(--paper);color:var(--ink);font:inherit}
input:focus{outline:2px solid var(--focus);outline-offset:1px}
button{margin-top:1rem;width:100%;min-height:46px;border:0;border-radius:10px;background:var(--ink);color:var(--paper);font:600 1rem/1 inherit;font-family:inherit;cursor:pointer}
.err{color:var(--warn);font-weight:600;margin:0 0 1rem}
</style></head><body><main>
<h1>Masters Mind</h1><p>Sign in to your study site.</p>
${msg ? `<p class="err" role="alert">${esc(msg)}</p>` : ''}
<form method="post" action="/login"><input type="hidden" name="next" value="${esc(next)}">
<label for="pw">Password</label><input id="pw" name="password" type="password" autocomplete="current-password" required autofocus>
<button type="submit">Sign in</button></form></main></body></html>`;
}
function safeNext(n) { return typeof n === 'string' && /^\/(?!\/)[^\s\\]*$/.test(n) ? n : '/'; }

/* ------------------------------------------------------------------ static files */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8' };
function serveStatic(req, res, pathname) {
  let rel;
  try { rel = decodeURIComponent(pathname); } catch { return send(res, 400, 'Bad request'); }
  if (rel.includes('\0') || rel.includes('\\')) return send(res, 400, 'Bad request');
  rel = path.posix.normalize(rel);
  if (rel.split('/').some((seg) => seg === '..' || (seg.startsWith('.') && seg !== '.nojekyll'))) return send(res, 404, 'Not found');
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.resolve(DIST, '.' + rel);
  if (file !== DIST && !file.startsWith(DIST + path.sep)) return send(res, 404, 'Not found');
  let st;
  try { st = fs.statSync(file); } catch { return notFound(res); }
  if (st.isDirectory()) return serveStatic(req, res, rel.replace(/\/?$/, '/'));
  // never follow symlinks out of dist
  try { const real = fs.realpathSync(file); if (!real.startsWith(fs.realpathSync(DIST) + path.sep)) return notFound(res); } catch { return notFound(res); }
  const etag = `W/"${st.size.toString(36)}-${Math.floor(st.mtimeMs).toString(36)}"`;
  const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const headers = { 'Content-Type': type, ETag: etag, 'Cache-Control': /\/assets\/(fonts|katex\/fonts|img)\//.test(rel) ? 'private, max-age=604800' : 'private, no-cache' };
  if (req.headers['if-none-match'] === etag) { res.writeHead(304, headers); return res.end(); }
  res.writeHead(200, { ...headers, 'Content-Length': st.size });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).pipe(res);
}
function notFound(res) {
  const f = path.join(DIST, '404.html');
  if (fs.existsSync(f)) return send(res, 404, fs.readFileSync(f), 'text/html; charset=utf-8');
  send(res, 404, 'Not found');
}

/* ------------------------------------------------------------------ API validation */
const KEY_RE = /^mm:[\w:.#|~+\-]{1,200}$/;
function cleanItems(items) {
  if (!items || typeof items !== 'object' || Array.isArray(items)) throw Object.assign(new Error('items must be an object'), { status: 400 });
  const out = {}; const maxT = Date.now() + DAY;
  const entries = Object.entries(items);
  if (entries.length > 5000) throw Object.assign(new Error('Too many items in one request'), { status: 413 });
  for (const [k, it] of entries) {
    if (!KEY_RE.test(k) || !it || typeof it !== 'object') continue;
    const v = it.v == null ? null : String(it.v);
    if (v != null && v.length > 64 * 1024) continue;
    const t = Number(it.t);
    if (!Number.isFinite(t) || t < 0) continue;
    out[k] = { v, t: Math.min(Math.round(t), maxT) };
  }
  return out;
}
function cleanEvents(list) {
  if (!Array.isArray(list)) throw Object.assign(new Error('events must be an array'), { status: 400 });
  if (list.length > 5000) throw Object.assign(new Error('Too many events in one request'), { status: 413 });
  const maxT = Date.now() + DAY;
  return list.filter((e) => e && /^[a-z_]{1,40}$/.test(e.type) && Number.isFinite(Number(e.ts))).map((e) => {
    let payload = e.payload ?? null;
    if (payload != null && JSON.stringify(payload).length > 4096) payload = null;
    return { ts: Math.min(Math.round(Number(e.ts)), maxT), type: e.type, ref: e.ref == null ? '' : String(e.ref).slice(0, 200), payload, device: e.device ? String(e.device).slice(0, 60) : '' };
  });
}

/* ------------------------------------------------------------------ routes */
async function handleApi(req, res, url) {
  const route = `${req.method} ${url.pathname}`;
  const isWrite = req.method !== 'GET' && req.method !== 'HEAD';
  if (isWrite && (req.headers['x-mm-client'] !== '1' || !sameOrigin(req))) return json(res, 403, { error: 'Missing X-MM-Client header or cross-origin request' });
  switch (route) {
    case 'GET /api/state': {
      const since = Math.max(0, Number(url.searchParams.get('since') || 0)) || 0;
      const items = {};
      for (const r of store.getState(since)) items[r.key] = { v: r.value, t: r.updated_at };
      return json(res, 200, { cursor: store.cursor(), items });
    }
    case 'PUT /api/state': {
      const body = await readJson(req);
      const items = cleanItems(body.items);
      const r = store.putState(items, String(body.device || '').slice(0, 60));
      return json(res, 200, { ok: true, applied: r.applied, newer: r.newer, cursor: store.cursor() });
    }
    case 'POST /api/events': {
      const body = await readJson(req);
      const n = store.addEvents(cleanEvents(body.events), String(body.device || '').slice(0, 60));
      return json(res, 200, { ok: true, inserted: n });
    }
    case 'GET /api/stats':
      return json(res, 200, computeStats(store, siteData(), { tz: url.searchParams.get('tz') || 'Asia/Singapore' }));
    case 'GET /api/export': {
      const state = {};
      for (const r of store.allState()) state[r.key] = { v: r.value, t: r.updated_at };
      const body = JSON.stringify({ format: 'masters-mind-export', version: 1, exported_at: new Date().toISOString(), source: 'server', schema_version: store.schemaVersion(), state, events: store.allEvents() }, null, 1);
      return send(res, 200, body, 'application/json; charset=utf-8', { 'Content-Disposition': `attachment; filename="masters-mind-export-${new Date().toISOString().slice(0, 10)}.json"` });
    }
    case 'POST /api/import': {
      const body = await readJson(req, MAX_IMPORT);
      if (body.format !== 'masters-mind-export') return json(res, 400, { error: 'Not a Masters Mind export file' });
      const r = store.putState(cleanItems(body.state || {}), 'import');
      const n = store.addEvents(cleanEvents(body.events || []));
      log(`[import] ${r.applied} state items, ${n} events`);
      return json(res, 200, { ok: true, state: r.applied, events: n, cursor: store.cursor() });
    }
    default:
      return json(res, 404, { error: 'Unknown API route' });
  }
}

const server = http.createServer(async (req, res) => {
  const t0 = Date.now();
  securityHeaders(res, req);
  let url;
  try { url = new URL(req.url, 'http://localhost'); } catch { return send(res, 400, 'Bad request'); }
  try {
    if (url.pathname === '/healthz') return json(res, 200, { ok: true, store: store.kind, uptime: Math.round(process.uptime()), auth: INSECURE ? 'off' : 'password' });
    if (url.pathname === '/assets/favicon.svg' || url.pathname.startsWith('/assets/fonts/')) return serveStatic(req, res, url.pathname);

    if (url.pathname === '/login') {
      if (INSECURE) return send(res, 302, '', 'text/plain', { Location: '/' });
      if (req.method === 'GET') return send(res, 200, loginPage('', safeNext(url.searchParams.get('next'))), 'text/html; charset=utf-8');
      if (req.method === 'POST') {
        if (!sameOrigin(req)) return send(res, 403, 'Cross-origin login refused');
        const ip = clientIp(req);
        const wait = loginBlocked(ip);
        if (wait) return send(res, 429, loginPage(`Too many failed attempts. Try again in ${Math.ceil(wait / 60000)} minutes.`), 'text/html; charset=utf-8', { 'Retry-After': String(Math.ceil(wait / 1000)) });
        const form = new URLSearchParams(await readBody(req, 8192));
        const next = safeNext(form.get('next'));
        if (!safeEqual(form.get('password') || '', PASSWORD)) {
          noteFailure(ip);
          await new Promise((r) => setTimeout(r, 400));
          return send(res, 401, loginPage('That password is not right.', next), 'text/html; charset=utf-8');
        }
        failures.delete(ip);
        log(`[auth] sign-in from ${ip}`);
        return send(res, 303, '', 'text/plain', { Location: next, 'Set-Cookie': cookie(req, makeSession(), SESSION_DAYS * 86400) });
      }
      return send(res, 405, 'Method not allowed', 'text/plain', { Allow: 'GET, POST' });
    }
    if (url.pathname === '/logout' && req.method === 'POST') {
      if (!sameOrigin(req)) return send(res, 403, 'Cross-origin request refused');
      return send(res, 303, '', 'text/plain', { Location: '/login', 'Set-Cookie': cookie(req, '', 0) });
    }

    const authed = INSECURE || !!readSession(req);
    if (url.pathname.startsWith('/api/')) {
      if (!authed) return json(res, 401, { error: 'Sign in first' });
      return await handleApi(req, res, url);
    }
    if (!authed) {
      if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 401, 'Sign in first');
      if (url.pathname === '/assets/sync.json') return json(res, 401, { server: true, auth: false });
      return send(res, 302, '', 'text/plain', { Location: '/login?next=' + encodeURIComponent(url.pathname + url.search) });
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed', 'text/plain', { Allow: 'GET, HEAD' });
    if (url.pathname === '/assets/sync.json') return json(res, 200, { server: true, store: store.kind });
    return serveStatic(req, res, url.pathname === '/' ? '/index.html' : url.pathname);
  } catch (e) {
    const status = e.status || 500;
    if (status >= 500) log('[error]', req.method, url.pathname, e.stack || e.message);
    if (!res.headersSent) json(res, status, { error: status >= 500 ? 'Server error' : e.message }, status === 413 ? { Connection: 'close' } : undefined);
    else res.end();
  } finally {
    if (process.env.LOG_REQUESTS === '1') log(req.method, url && url.pathname, res.statusCode, Date.now() - t0 + 'ms');
  }
});
server.requestTimeout = 30e3;
server.headersTimeout = 15e3;
server.listen(PORT, HOST, () => {
  log(`Masters Mind on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}  (store: ${store.kind}, auth: ${INSECURE ? 'OFF, local only' : 'password'})`);
  log(`site: ${DIST}`);
  log(`data: ${store.file}`);
});
const shutdown = () => { log('shutting down'); server.close(() => { store.close(); process.exit(0); }); setTimeout(() => process.exit(0), 3000).unref(); };
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
