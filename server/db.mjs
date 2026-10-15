// Storage: SQLite via the built-in node:sqlite when available, otherwise a JSON file.
// Both expose the same small API used by the server and the backup script.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_SEQ_KEY = 'max_seq';

export async function openStore(dataDir, { log = console.log } = {}) {
  fs.mkdirSync(dataDir, { recursive: true });
  let sqlite = null;
  try {
    // node:sqlite ships with Node 22.5+ (unflagged from 22.13 / 23.4). Silence its "experimental" warning once.
    const orig = process.emitWarning;
    process.emitWarning = (w, ...a) => (String(w).includes('SQLite') ? undefined : orig.call(process, w, ...a));
    sqlite = await import('node:sqlite');
    process.emitWarning = orig;
  } catch (e) {
    sqlite = null;
  }
  if (sqlite && sqlite.DatabaseSync && process.env.MM_FORCE_JSON !== '1') return sqliteStore(sqlite, dataDir, log);
  if (process.env.MM_FORCE_JSON === '1') { log(`[store] MM_FORCE_JSON=1: using the JSON-file store at ${path.join(dataDir, 'masters.json')}.`); return jsonStore(dataDir, log); }
  log(`[store] node:sqlite is not available in Node ${process.version}; using the JSON-file store at ${path.join(dataDir, 'masters.json')}. ` +
    'Upgrade to Node 22.13+ (or start with --experimental-sqlite) to use SQLite.');
  return jsonStore(dataDir, log);
}

/* ------------------------------------------------------------------ SQLite */
function sqliteStore(sqlite, dataDir, log) {
  const file = path.join(dataDir, 'masters.db');
  const db = new sqlite.DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 3000;');
  db.exec('CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT)');
  migrate(db, log);
  const q = {
    meta: db.prepare('SELECT value FROM meta WHERE key = ?'),
    setMeta: db.prepare('INSERT INTO meta(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'),
    get: db.prepare('SELECT key, value, updated_at, seq FROM kv_state WHERE key = ?'),
    upsert: db.prepare('INSERT INTO kv_state(key, value, updated_at, seq, device) VALUES(?, ?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, seq = excluded.seq, device = excluded.device'),
    since: db.prepare('SELECT key, value, updated_at, seq FROM kv_state WHERE seq > ? ORDER BY seq'),
    all: db.prepare('SELECT key, value, updated_at, seq, device FROM kv_state ORDER BY key'),
    prefix: db.prepare("SELECT key, value, updated_at FROM kv_state WHERE key >= ? AND key < ?"),
    addEvent: db.prepare('INSERT OR IGNORE INTO events(ts, type, ref, payload, device, received_at) VALUES(?, ?, ?, ?, ?, ?)'),
    eventsSince: db.prepare('SELECT ts, type, ref, payload, device FROM events WHERE ts >= ? ORDER BY ts'),
    allEvents: db.prepare('SELECT ts, type, ref, payload, device, received_at FROM events ORDER BY id'),
    countEvents: db.prepare('SELECT COUNT(*) AS n FROM events'),
  };
  let maxSeq = Number((q.meta.get(MAX_SEQ_KEY) || {}).value || 0);
  const tx = (fn) => { db.exec('BEGIN IMMEDIATE'); try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; } };
  return {
    kind: 'sqlite', file,
    cursor: () => maxSeq,
    getState: (since = 0) => q.since.all(since).map(row),
    allState: () => q.all.all().map((r) => ({ ...row(r), device: r.device })),
    statePrefix: (prefix) => q.prefix.all(prefix, prefix + '￿').map((r) => ({ key: r.key, value: r.value, updated_at: r.updated_at })),
    /** merge items {key: {v, t}}; returns {applied, newer: {key: {v, t}}} */
    putState: (items, device = '') => tx(() => {
      let applied = 0; const newer = {};
      for (const [key, it] of Object.entries(items)) {
        const cur = q.get.get(key);
        if (cur && (cur.updated_at > it.t || (cur.updated_at === it.t && (cur.value || '') >= (it.v || '')))) {
          if (cur.value !== it.v) newer[key] = { v: cur.value, t: cur.updated_at };
          continue;
        }
        maxSeq++; q.upsert.run(key, it.v, it.t, maxSeq, device); applied++;
      }
      q.setMeta.run(MAX_SEQ_KEY, String(maxSeq));
      return { applied, newer };
    }),
    addEvents: (events, device = '') => tx(() => { let n = 0; const now = Date.now(); for (const e of events) { const r = q.addEvent.run(e.ts, e.type, e.ref || '', e.payload == null ? null : JSON.stringify(e.payload), device || e.device || '', now); n += Number(r.changes); } return n; }),
    eventsSince: (ts) => q.eventsSince.all(ts).map((e) => ({ ...e, payload: parse(e.payload) })),
    allEvents: () => q.allEvents.all().map((e) => ({ ...e, payload: parse(e.payload) })),
    eventCount: () => q.countEvents.get().n,
    schemaVersion: () => Number((q.meta.get('schema_version') || {}).value || 0),
    backup: (dest) => { db.exec(`VACUUM INTO '${dest.replace(/'/g, "''")}'`); },
    close: () => db.close(),
  };
}
function row(r) { return { key: r.key, value: r.value, updated_at: r.updated_at, seq: r.seq }; }
function parse(s) { if (s == null) return null; try { return JSON.parse(s); } catch { return null; } }

function migrate(db, log) {
  const dir = fileURLToPath(new URL('./migrations/', import.meta.url));
  const files = fs.readdirSync(dir).filter((f) => /^\d+_.*\.sql$/.test(f)).sort();
  const get = db.prepare("SELECT value FROM meta WHERE key = 'schema_version'");
  const set = db.prepare("INSERT INTO meta(key, value) VALUES('schema_version', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
  let current = Number((get.get() || {}).value || 0);
  for (const f of files) {
    const v = parseInt(f, 10);
    if (v <= current) continue;
    db.exec('BEGIN');
    try { db.exec(fs.readFileSync(path.join(dir, f), 'utf8')); set.run(String(v)); db.exec('COMMIT'); log(`[store] applied migration ${f}`); current = v; }
    catch (e) { db.exec('ROLLBACK'); throw e; }
  }
}

/* ------------------------------------------------------------------ JSON fallback */
function jsonStore(dataDir, log) {
  const file = path.join(dataDir, 'masters.json');
  let data = { schema_version: 1, max_seq: 0, kv: {}, events: [], seen: {} };
  if (fs.existsSync(file)) data = { ...data, ...JSON.parse(fs.readFileSync(file, 'utf8')) };
  const seen = new Set(data.events.map((e) => `${e.device}|${e.ts}|${e.type}|${e.ref}`));
  let timer = null;
  const flush = () => { const tmp = file + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(data)); fs.renameSync(tmp, file); };
  const save = () => { clearTimeout(timer); timer = setTimeout(flush, 300); };
  process.on('exit', () => { if (timer) { clearTimeout(timer); flush(); } });
  return {
    kind: 'json', file,
    cursor: () => data.max_seq,
    getState: (since = 0) => Object.entries(data.kv).filter(([, r]) => r.seq > since).map(([key, r]) => ({ key, value: r.value, updated_at: r.updated_at, seq: r.seq })),
    allState: () => Object.entries(data.kv).sort().map(([key, r]) => ({ key, ...r })),
    statePrefix: (prefix) => Object.entries(data.kv).filter(([k]) => k.startsWith(prefix)).map(([key, r]) => ({ key, value: r.value, updated_at: r.updated_at })),
    putState: (items, device = '') => {
      let applied = 0; const newer = {};
      for (const [key, it] of Object.entries(items)) {
        const cur = data.kv[key];
        if (cur && (cur.updated_at > it.t || (cur.updated_at === it.t && (cur.value || '') >= (it.v || '')))) { if (cur.value !== it.v) newer[key] = { v: cur.value, t: cur.updated_at }; continue; }
        data.kv[key] = { value: it.v, updated_at: it.t, seq: ++data.max_seq, device }; applied++;
      }
      save(); return { applied, newer };
    },
    addEvents: (events, device = '') => { let n = 0; const now = Date.now(); for (const e of events) { const d = device || e.device || ''; const k = `${d}|${e.ts}|${e.type}|${e.ref || ''}`; if (seen.has(k)) continue; seen.add(k); data.events.push({ ts: e.ts, type: e.type, ref: e.ref || '', payload: e.payload ?? null, device: d, received_at: now }); n++; } save(); return n; },
    eventsSince: (ts) => data.events.filter((e) => e.ts >= ts).sort((a, b) => a.ts - b.ts),
    allEvents: () => data.events.slice(),
    eventCount: () => data.events.length,
    schemaVersion: () => data.schema_version,
    backup: (dest) => { flush(); fs.copyFileSync(file, dest); },
    close: () => { if (timer) { clearTimeout(timer); flush(); } },
  };
}
