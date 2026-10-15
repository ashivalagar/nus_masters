-- 001: initial schema
-- kv_state mirrors the browser's localStorage "mm:" keys. Merge rule: last writer wins per key,
-- by the client's updated_at timestamp (ms). seq is a server-side change counter used as the
-- cursor for incremental pulls (GET /api/state?since=<seq>).
CREATE TABLE IF NOT EXISTS kv_state (
  key         TEXT PRIMARY KEY,
  value       TEXT,               -- raw JSON text exactly as stored in localStorage (NULL/'null' = deleted)
  updated_at  INTEGER NOT NULL,   -- client timestamp of the change (ms since epoch)
  seq         INTEGER NOT NULL,   -- server change counter
  device      TEXT
);
CREATE INDEX IF NOT EXISTS kv_state_seq ON kv_state(seq);

-- Append-only activity log: step_done, card_reviewed, lab_opened, session_start, active_minute, ...
CREATE TABLE IF NOT EXISTS events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ts          INTEGER NOT NULL,   -- client time (ms)
  type        TEXT NOT NULL,
  ref         TEXT NOT NULL DEFAULT '',
  payload     TEXT,               -- small JSON object or NULL
  device      TEXT NOT NULL DEFAULT '',
  received_at INTEGER NOT NULL
);
-- retries from a flaky connection must not double count
CREATE UNIQUE INDEX IF NOT EXISTS events_dedupe ON events(device, ts, type, ref);
CREATE INDEX IF NOT EXISTS events_ts ON events(ts);
CREATE INDEX IF NOT EXISTS events_type_ts ON events(type, ts);
