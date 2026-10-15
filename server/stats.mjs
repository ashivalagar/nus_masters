// Dashboard statistics computed from kv_state + events.
import fs from 'node:fs';

const DAY = 864e5;
const STUDY_EVENTS = new Set(['step_done', 'card_reviewed', 'rung_done', 'predict', 'lab_predict', 'teach_back', 'mastery']);

export function dayFormatter(tz) {
  try { const f = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }); f.format(new Date()); return (d) => f.format(d); }
  catch { return (d) => new Date(d.getTime() + 8 * 3600e3).toISOString().slice(0, 10); }
}

/** Reads the site's data.js (window.MM = {...}) for concept tracks, cards and path steps. */
export function loadSiteData(file) {
  let cache = null, mtime = 0;
  return () => {
    try {
      const st = fs.statSync(file);
      if (!cache || st.mtimeMs !== mtime) {
        const txt = fs.readFileSync(file, 'utf8');
        cache = JSON.parse(txt.slice(txt.indexOf('=') + 1).replace(/;\s*$/, ''));
        mtime = st.mtimeMs;
      }
    } catch { cache = cache || { concepts: [], cards: [], weeks: [] }; }
    return cache;
  };
}

const val = (raw, d) => { if (raw == null) return d; try { const v = JSON.parse(raw); return v == null ? d : v; } catch { return d; } };

export function computeStats(store, site, { tz = 'Asia/Singapore', now = Date.now() } = {}) {
  const day = dayFormatter(tz);
  const today = day(new Date(now));
  const events = store.eventsSince(now - 70 * DAY);
  // minutes: distinct active minutes across all devices
  const minuteSet = new Map();
  const studied = new Set();
  for (const e of events) {
    const d = day(new Date(e.ts));
    if (e.type === 'active_minute') { if (!minuteSet.has(d)) minuteSet.set(d, new Set()); minuteSet.get(d).add(Math.floor(e.ts / 60000)); }
    if (STUDY_EVENTS.has(e.type)) studied.add(d);
  }
  for (const r of store.statePrefix('mm:day:')) if (val(r.value, 0)) studied.add(r.key.slice(7));
  const minutes = (d) => (minuteSet.get(d) ? minuteSet.get(d).size : 0);

  const minutesPerDay = [];
  for (let i = 29; i >= 0; i--) { const d = day(new Date(now - i * DAY)); minutesPerDay.push({ day: d, minutes: minutes(d) }); }
  let streak = 0, cur = now;
  if (!studied.has(day(new Date(cur)))) cur -= DAY;
  while (studied.has(day(new Date(cur)))) { streak++; cur -= DAY; }

  // heatmap: 8 weeks, Monday first
  const noon = Date.parse(today + 'T12:00:00Z');
  const dow = (new Date(noon).getUTCDay() + 6) % 7;
  const start = noon - (dow + 7 * 7) * DAY;
  const heatmap = [];
  for (let w = 0; w < 8; w++) { const rowA = []; for (let k = 0; k < 7; k++) { const d = new Date(start + (w * 7 + k) * DAY).toISOString().slice(0, 10); rowA.push({ day: d, minutes: minutes(d), future: d > today }); } heatmap.push(rowA); }

  const kv = new Map(store.statePrefix('mm:').map((r) => [r.key, r.value]));
  const get = (k, d) => val(kv.get('mm:' + k), d);
  const mastery = {};
  for (const t of ['foundations', 'EE5101', 'EE5907']) mastery[t] = { new: 0, learning: 0, solid: 0, total: 0 };
  for (const c of site.concepts || []) { const m = get('mastery:' + c.slug, 'new'); if (!mastery[c.track]) continue; mastery[c.track][m] = (mastery[c.track][m] || 0) + 1; mastery[c.track].total++; }
  let cardsDue = 0; const weak = [];
  for (const c of site.cards || []) {
    const s = get('card:' + c.id, null);
    if (!s || s.due <= now) cardsDue++;
    if (s && s.wrong > s.right) weak.push({ id: c.id, slug: c.slug, title: c.title, q: c.q, right: s.right, wrong: s.wrong, box: s.box });
  }
  weak.sort((a, b) => (b.wrong - b.right) - (a.wrong - a.right) || a.box - b.box);
  let done = 0, total = 0;
  const weeks = (site.weeks || []).map((w) => { let d = 0, t = 0; for (const s of w.sessions) for (const st of s.steps) { t++; if (get('step:' + st.id, 0)) d++; } done += d; total += t; return { id: w.id, short: w.short, done: d, total: t }; });
  const reviewed7 = events.filter((e) => e.type === 'card_reviewed' && e.ts >= now - 7 * DAY).length;
  return {
    today, tz, streak,
    studiedDays: [...studied].sort().slice(-60),
    minutesPerDay, minutes7: minutesPerDay.slice(-7).reduce((a, b) => a + b.minutes, 0), minutes30: minutesPerDay.reduce((a, b) => a + b.minutes, 0),
    heatmap, mastery, cardsDue, cardsTotal: (site.cards || []).length, cardsReviewed7: reviewed7,
    weakCards: weak.slice(0, 10), steps: { done, total }, weeks,
    events: store.eventCount(),
  };
}
