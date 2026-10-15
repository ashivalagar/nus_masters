/* Storage + optional server sync.
 *
 * Everything is kept in localStorage under granular "mm:" keys, so the site works
 * fully offline / as plain static files. Each key also gets an updated-at
 * timestamp (in "mm:__ts"), which lets the optional server merge per key with
 * last-writer-wins: the phone and the laptop never clobber each other's
 * unrelated progress.
 *
 * When the page is served by the bundled server (server/), /api/state answers
 * and we sync on load, on change (debounced) and when the tab regains focus.
 * When it is not (python -m http.server, GitHub Pages, file://), the first probe
 * fails and sync switches itself off silently.
 */
(function () {
  'use strict';
  var PREFIX = 'mm:';
  var TS_KEY = 'mm:__ts';
  var EV_KEY = 'mm:__events';
  var LOCAL_ONLY = { 'mm:theme': 1, 'mm:__ts': 1, 'mm:__events': 1, 'mm:__since': 1, 'mm:__device': 1 };
  var mem = {};
  var ls = null;
  try { ls = window.localStorage; var probe = '__mm_probe'; ls.setItem(probe, '1'); ls.removeItem(probe); } catch (e) { ls = null; }

  function rawGet(k) { try { return ls ? ls.getItem(k) : (k in mem ? mem[k] : null); } catch (e) { return k in mem ? mem[k] : null; } }
  function rawSet(k, v) { try { if (ls) ls.setItem(k, v); else mem[k] = v; } catch (e) { mem[k] = v; } }
  function rawKeys() {
    var out = [];
    try { if (ls) { for (var i = 0; i < ls.length; i++) out.push(ls.key(i)); return out; } } catch (e) { /* fall through */ }
    return Object.keys(mem);
  }
  function parse(s, d) { if (s == null) return d; try { var v = JSON.parse(s); return v == null ? d : v; } catch (e) { return d; } }

  var tsCache = parse(rawGet(TS_KEY), {});
  function saveTs() { rawSet(TS_KEY, JSON.stringify(tsCache)); }

  var listeners = [];
  var S = {
    available: !!ls,
    get: function (key, d) { return parse(rawGet(PREFIX + key), d); },
    /** set(key, value). value === null deletes (kept as a tombstone for sync). */
    set: function (key, value, opts) {
      var full = PREFIX + key;
      rawSet(full, JSON.stringify(value));
      if (!LOCAL_ONLY[full] && !(opts && opts.remote)) {
        tsCache[full] = (opts && opts.t) || Date.now();
        saveTs();
        Sync.dirty(full);
      }
      if (!(opts && opts.silent)) listeners.forEach(function (fn) { try { fn(key, value, !!(opts && opts.remote)); } catch (e) { console.error(e); } });
    },
    keys: function (prefix) {
      var p = PREFIX + (prefix || '');
      return rawKeys().filter(function (k) { return k && k.indexOf(p) === 0 && !LOCAL_ONLY[k]; }).map(function (k) { return k.slice(PREFIX.length); });
    },
    on: function (fn) { listeners.push(fn); },
    /** Append-only activity log (synced to the server's events table when present). */
    event: function (type, ref, payload) {
      var q = parse(rawGet(EV_KEY), []);
      q.push({ ts: Date.now(), type: type, ref: ref || null, payload: payload || null });
      if (q.length > 3000) q = q.slice(q.length - 3000);
      rawSet(EV_KEY, JSON.stringify(q));
      Sync.flushSoon();
    },
    _ts: function () { return tsCache; },
    _raw: rawGet, _rawSet: rawSet,
  };

  /* ------------------------------------------------------------ dates (Asia/Singapore) */
  var fmtDay = (function () {
    try { var f = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit' }); f.format(new Date()); return function (d) { return f.format(d); }; }
    catch (e) { return function (d) { var x = new Date(d.getTime() + 8 * 3600e3); return x.toISOString().slice(0, 10); }; }
  })();
  S.today = function () { return fmtDay(new Date()); };
  S.dayOf = function (d) { return fmtDay(d); };
  S.markStudied = function (why) {
    var d = S.today();
    if (!S.get('day:' + d)) S.set('day:' + d, 1);
  };

  /* ------------------------------------------------------------ server sync */
  var root = (document.body && document.body.getAttribute('data-root')) || '';
  var Sync = {
    state: 'probing', dirtyKeys: {}, timer: null, evTimer: null, busy: false,
    api: function (path) { return root + 'api/' + path; },
    req: function (method, path, body) {
      return fetch(Sync.api(path), {
        method: method, credentials: 'same-origin', cache: 'no-store',
        headers: body ? { 'Content-Type': 'application/json', 'X-MM-Client': '1' } : { 'X-MM-Client': '1' },
        body: body ? JSON.stringify(body) : undefined,
      }).then(function (r) {
        if (r.status === 401) { var err = new Error('auth'); err.auth = true; throw err; }
        if (!r.ok) { var e2 = new Error('http ' + r.status); e2.status = r.status; throw e2; }
        var ct = r.headers.get('content-type') || '';
        if (ct.indexOf('application/json') < 0) { var e3 = new Error('not the sync server'); e3.status = 404; throw e3; }
        return r.json();
      });
    },
    setState: function (s, msg) {
      Sync.state = s;
      document.documentElement.setAttribute('data-sync', s);
      var els = document.querySelectorAll('[data-sync-dot]');
      var labels = { ok: 'Synced with your server', syncing: 'Syncing…', error: 'Sync paused: ' + (msg || 'server unreachable') + '. Progress is safe in this browser.', auth: 'Signed out. Sign in again to sync.', off: 'Saved in this browser only', probing: 'Checking for sync server…' };
      for (var i = 0; i < els.length; i++) { els[i].setAttribute('data-state', s); els[i].setAttribute('title', labels[s] || s); els[i].setAttribute('aria-label', labels[s] || s); }
    },
    dirty: function (fullKey) {
      Sync.dirtyKeys[fullKey] = 1;
      if (Sync.state === 'off' || Sync.state === 'probing') return;
      clearTimeout(Sync.timer);
      Sync.timer = setTimeout(Sync.push, 1200);
    },
    applyRemote: function (items) {
      var changed = 0;
      Object.keys(items || {}).forEach(function (k) {
        if (k.indexOf(PREFIX) !== 0 || LOCAL_ONLY[k]) return;
        var it = items[k];
        var lt = tsCache[k] || 0;
        if (it.t > lt) {
          rawSet(k, it.v == null ? 'null' : (typeof it.v === 'string' ? it.v : JSON.stringify(it.v)));
          tsCache[k] = it.t; changed++;
          delete Sync.dirtyKeys[k];
        }
      });
      if (changed) { saveTs(); listeners.forEach(function (fn) { try { fn('*', null, true); } catch (e) { console.error(e); } }); }
      return changed;
    },
    collect: function (keys) {
      var out = {};
      keys.forEach(function (k) { if (!LOCAL_ONLY[k] && k.indexOf(PREFIX) === 0) out[k] = { v: rawGet(k), t: tsCache[k] || 0 }; });
      return out;
    },
    pull: function (full) {
      var since = full ? 0 : (parse(rawGet('mm:__since'), 0) || 0);
      return Sync.req('GET', 'state' + (since ? '?since=' + since : '')).then(function (res) {
        Sync.applyRemote(res.items);
        rawSet('mm:__since', JSON.stringify(res.cursor || 0));
        return res;
      });
    },
    push: function () {
      if (Sync.busy) { clearTimeout(Sync.timer); Sync.timer = setTimeout(Sync.push, 800); return Promise.resolve(); }
      var keys = Object.keys(Sync.dirtyKeys);
      if (!keys.length) return Sync.flush();
      Sync.busy = true; Sync.setState('syncing');
      var payload = Sync.collect(keys);
      return Sync.req('PUT', 'state', { device: Sync.device(), items: payload }).then(function (res) {
        keys.forEach(function (k) { if (payload[k] && (tsCache[k] || 0) <= payload[k].t) delete Sync.dirtyKeys[k]; });
        Sync.applyRemote(res.newer);
        Sync.busy = false; Sync.setState('ok');
        return Sync.flush();
      }).catch(Sync.fail);
    },
    flushSoon: function () {
      if (Sync.state === 'off' || Sync.state === 'probing') return;
      clearTimeout(Sync.evTimer); Sync.evTimer = setTimeout(Sync.flush, 2000);
    },
    flush: function () {
      var q = parse(rawGet(EV_KEY), []);
      if (!q.length || Sync.state === 'off') return Promise.resolve();
      var batch = q.slice(0, 500);
      return Sync.req('POST', 'events', { device: Sync.device(), events: batch }).then(function () {
        var now = parse(rawGet(EV_KEY), []);
        rawSet(EV_KEY, JSON.stringify(now.slice(batch.length)));
        if (now.length > batch.length) return Sync.flush();
      }).catch(Sync.fail);
    },
    fail: function (e) {
      Sync.busy = false;
      if (e && e.auth) Sync.setState('auth');
      else Sync.setState('error', e && e.message);
    },
    device: function () {
      var d = parse(rawGet('mm:__device'), null);
      if (!d) { d = 'dev-' + Math.random().toString(36).slice(2, 10); rawSet('mm:__device', JSON.stringify(d)); }
      return d;
    },
    start: function () {
      if (location.protocol === 'file:' || !window.fetch) { Sync.setState('off'); return; }
      // assets/sync.json is a static file saying {"server": false}; the bundled server answers {"server": true}.
      // Probing it first means plain static hosting never sees a 404 for /api/*.
      fetch(root + 'assets/sync.json', { cache: 'no-store', credentials: 'same-origin' }).then(function (r) { if (r.status === 401) return { server: true, auth: false }; return r.ok ? r.json() : { server: false }; }).catch(function () { return { server: false }; }).then(function (info) {
        if (!info || !info.server) { Sync.setState('off'); return; }
        if (info.auth === false) { Sync.setState('auth'); return; }
        Sync.connect();
      });
    },
    connect: function () {
      Sync.req('GET', 'state').then(function (res) {
        Sync.setState('ok');
        Sync.applyRemote(res.items);
        rawSet('mm:__since', JSON.stringify(res.cursor || 0));
        // first contact from this browser: push everything newer than the server copy
        var local = S.keys('').map(function (k) { return PREFIX + k; });
        local.forEach(function (k) { var srv = res.items && res.items[k]; if (!srv || (tsCache[k] || 0) > srv.t) Sync.dirtyKeys[k] = 1; });
        return Sync.push();
      }).catch(function (e) {
        if (e && e.auth) Sync.setState('auth'); else Sync.setState('off');
      });
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible' && (Sync.state === 'ok' || Sync.state === 'error')) Sync.pull().then(function () { Sync.setState('ok'); return Sync.push(); }).catch(Sync.fail);
        if (document.visibilityState === 'hidden' && Sync.state === 'ok') { Sync.push(); }
      });
      setInterval(function () {
        if (document.visibilityState === 'visible' && (Sync.state === 'ok' || Sync.state === 'error')) Sync.pull().then(function () { if (Sync.state !== 'ok') Sync.setState('ok'); }).catch(Sync.fail);
      }, 60000);
    },
  };
  S.sync = Sync;
  window.MMStore = S;

  /* active-minute heartbeat: one event per minute of real interaction */
  var lastInput = Date.now();
  ['pointerdown', 'keydown', 'scroll', 'input'].forEach(function (ev) { window.addEventListener(ev, function () { lastInput = Date.now(); }, { passive: true }); });
  setInterval(function () {
    if (document.visibilityState === 'visible' && Date.now() - lastInput < 120000) S.event('active_minute', location.pathname.split('/').slice(-2).join('/'));
  }, 60000);
  try { if (!sessionStorage.getItem('mm:session')) { sessionStorage.setItem('mm:session', '1'); S.event('session_start', location.pathname.split('/').slice(-2).join('/')); } } catch (e) { /* ignore */ }
})();
