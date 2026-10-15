#!/usr/bin/env node
// Build the static learning site from the Obsidian vault.
//   node build.mjs [--include-exams] [--out dist]
//   VAULT="/path/to/NUS Masters" node build.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { loadVault, Renderer, slugify, escapeHtml as e, plainText, getKatexErrors } from './src/vault.mjs';
import { page, trackChip, tagBadges, progressRing, icon, TRACKS } from './src/templates.mjs';
import { WEEKS, EXAMS, DEADLINES, PHASES } from './src/path.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const INCLUDE_EXAMS = args.includes('--include-exams') || process.env.INCLUDE_EXAMS === '1';
const outArg = args.indexOf('--out');
const OUT = path.resolve(HERE, outArg >= 0 ? args[outArg + 1] : 'dist');
const VAULT = (() => {
  if (process.env.VAULT) return path.resolve(process.env.VAULT);
  for (const c of ['vault/NUS Masters', '../vault/NUS Masters']) {
    const p = path.resolve(HERE, c);
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Vault not found. Set VAULT="/path/to/NUS Masters".');
})();
const R = '\u0003'; // root placeholder inside rendered note html

const t0 = Date.now();
const warn = [];
const log = (...a) => console.log('·', ...a);

// ------------------------------------------------------------------ labs registry (load lab files in a sandbox)
const LAB_DIR = path.join(HERE, 'src/labs');
const labFiles = fs.readdirSync(LAB_DIR).filter((f) => /^\d\d_.*\.js$/.test(f)).sort();
const labSources = ['_kit.js', ...labFiles].map((f) => fs.readFileSync(path.join(LAB_DIR, f), 'utf8'));
const sandbox = { window: {}, console };
sandbox.window.window = sandbox.window;
vm.createContext(sandbox);
for (const src of labSources) vm.runInContext(src.replace(/^/, 'var window = this.window;\n'), sandbox);
const LABS = Object.values(sandbox.window.MMLab.registry).sort((a, b) => a.id.localeCompare(b.id));
for (const f of labFiles) if (!LABS.find((l) => l.id === f.replace(/\.js$/, ''))) warn.push(`Lab file ${f} did not register an id matching its name`);
const labIds = new Map(LABS.map((l) => [l.id, l]));

// ------------------------------------------------------------------ vault
const { notes, images, excluded } = loadVault(VAULT, { includeExams: INCLUDE_EXAMS });
log(`vault: ${notes.length} notes, ${images.length} images, ${excluded.length} excluded (exam material)${INCLUDE_EXAMS ? ' [--include-exams]' : ''}`);
const renderer = new Renderer({ notes, excluded, labs: labIds });
const bySlug = new Map(notes.map((n) => [n.slug, n]));
const byTitle = new Map(notes.map((n) => [n.title.toLowerCase(), n]));

const GROUP_ORDER = ['foundations', 'EE5101', 'EE5907'];
for (const n of notes) {
  n.url = renderer.urlFor(n);
  n.r = renderer.render(n, R);
  n.displayTitle = (n.r.h1 || n.title).replace(/^🧠\s*/, '');
  // "(upcoming — Lecture 10)" in the title becomes a ribbon
  const up = n.displayTitle.match(/\s*\((upcoming[^)]*)\)\s*$/i);
  n.upcoming = n.tags.includes('upcoming') || !!n.r.primer || !!up;
  n.upcomingWhen = up ? up[1].replace(/^upcoming\s*[—-]\s*/i, '') : '';
  if (up) n.displayTitle = n.displayTitle.slice(0, up.index).trim();
  n.text = plainText(n.body);
  n.minutes = Math.max(5, Math.round(n.text.split(' ').length / 90) * 5);
}
const concepts = notes.filter((n) => n.type === 'concept').sort((a, b) =>
  GROUP_ORDER.indexOf(a.track) - GROUP_ORDER.indexOf(b.track) || orderKey(a) - orderKey(b));
function orderKey(n) {
  // keep the vault's own reading order (Masters Mind concept index)
  const home = byTitle.get('masters mind');
  const i = home ? home.body.indexOf(`[[${n.title}]]`) : -1;
  return n.title === '00 Math Roadmap' ? -1 : i < 0 ? 9999 : i;
}

// backlinks
const backlinks = new Map();
for (const [from, set] of renderer.links) for (const to of set) {
  if (!backlinks.has(to)) backlinks.set(to, new Set());
  backlinks.get(to).add(from);
}

// dependencies (Needs / Used by), inferred both ways
for (const c of concepts) c.deps = { needs: new Set(), usedBy: new Set(), related: new Set() };
for (const c of concepts) {
  const m = c.r.meta; if (!m) continue;
  const add = (set, t) => { const n = byTitle.get(t.toLowerCase()); if (n && n.type === 'concept' && n !== c) set.add(n.slug); return n; };
  m.needs.forEach((t) => { const n = add(c.deps.needs, t); if (n && n.deps) n.deps.usedBy.add(c.slug); });
  m.usedBy.forEach((t) => { const n = add(c.deps.usedBy, t); if (n && n.deps) n.deps.needs.add(c.slug); });
  m.related.forEach((t) => add(c.deps.related, t));
}

// lab -> concepts that embed it
const labConcepts = new Map();
for (const n of notes) for (const id of n.r.labs) {
  if (!labConcepts.has(id)) labConcepts.set(id, []);
  if (!labConcepts.get(id).includes(n.slug)) labConcepts.get(id).push(n.slug);
}

// all cards
const cards = notes.flatMap((n) => n.r.cards);

// ------------------------------------------------------------------ path: resolve steps
const noteRef = (title, ctx) => {
  const n = byTitle.get(title.toLowerCase());
  if (!n) throw new Error(`path.mjs: unknown note "${title}" in ${ctx}`);
  return n;
};
const covered = new Set();
let stepTotal = 0;
for (const w of WEEKS) {
  for (const s of w.sessions) {
    const seen = new Map();
    s.minutes = 0;
    s.steps.forEach((st) => {
      let key = st.note ? slugify(st.note) : st.lab || st.id || (st.notes ? st.notes.map(slugify).join('+') : hash(st.text || (st.items || []).join('|')));
      key = `${s.id}:${st.kind}:${key}`;
      const k = seen.get(key) || 0; seen.set(key, k + 1);
      st.sid = k ? `${key}~${k}` : key;
      if (st.note) { const n = noteRef(st.note, s.id); st.ref = n; if (n.type === 'concept') covered.add(n.slug); }
      if (st.notes) st.refs = st.notes.map((t) => { const n = noteRef(t, s.id); if (n.type === 'concept') covered.add(n.slug); return n; });
      if (st.link) st.linkRef = noteRef(st.link, s.id);
      if (st.lab && !labIds.has(st.lab)) throw new Error(`path.mjs: unknown lab ${st.lab}`);
      st.min = st.min || (st.kind === 'predict' ? 3 : st.kind === 'checkpoint' ? 5 : 10);
      s.minutes += st.min;
      stepTotal++;
    });
  }
}
const missing = concepts.filter((c) => !covered.has(c.slug)).map((c) => c.title);
if (missing.length) throw new Error('Concept notes not covered by the learning path: ' + missing.join(', '));
log(`path: ${WEEKS.length} weeks, ${WEEKS.reduce((a, w) => a + w.sessions.length, 0)} sessions, ${stepTotal} steps; all ${concepts.length} concepts covered`);

function hash(s) { let h = 2166136261; for (const ch of s) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }

// ------------------------------------------------------------------ site data
const site = {
  weeks: WEEKS,
  concepts: concepts.map((c) => ({ slug: c.slug, title: c.displayTitle, track: c.track, url: c.url })),
  notesNav: ['Masters Mind', 'Exam Intel', 'Weekend Study Plan', 'Make It Stick', 'EE5101 Course Map', 'EE5907 Course Map', 'Assignment 2 Notes', 'EE5907 Cheat Sheet', 'Visual Labs', 'EE5101 Past Paper Analysis', 'EE5907 Exam Style and Proxy Papers', 'Past Papers Log']
    .map((t) => byTitle.get(t.toLowerCase())).filter(Boolean).map((n) => ({ slug: n.slug, title: n.displayTitle.replace(/ — Course Map$/, ' course map'), url: n.url })),
};
const fix = (html, root) => html.split(R).join(root);

// ------------------------------------------------------------------ output helpers
fs.rmSync(OUT, { recursive: true, force: true });
const write = (rel, content) => { const p = path.join(OUT, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, content); };
const pagesWritten = [];
const emit = (rel, opts) => { const root = '../'.repeat(rel.split('/').length - 1); write(rel, page({ site, root, ...opts, body: fix(opts.body, root) })); pagesWritten.push(rel); };

const stepKindLabel = { read: 'Read', see: 'Play', predict: 'Predict', quiz: 'Self-test', teach: 'Teach back', do: 'Do', checkpoint: 'Checkpoint' };
const cardsFor = (slugs) => cards.filter((c) => slugs.includes(c.slug));

function fileChips(files = []) {
  return files.map((f) => `<span class="course-file" title="Course file in your vault"><span class="cf-ext">${e(f.split('.').pop().toUpperCase())}</span>${e(f.replace(/\.[a-z]+$/i, ''))}</span>`).join(' ');
}

function stepHtml(st, s) {
  const id = e(st.sid);
  const k = st.kind;
  let main = '';
  const min = `<span class="step-min">${st.min} min</span>`;
  if (k === 'read') {
    const n = st.ref;
    main = `<p class="step-title"><a href="${R}${n.url}">${e(n.displayTitle)}</a> ${min}</p>${n.type === 'concept' ? `<p class="step-sub">${trackChip(n.track)} ${tagBadges(n.tags)}<span class="mastery-inline" data-mastery-of="${n.slug}"></span></p>` : ''}`;
  } else if (k === 'see') {
    const lab = labIds.get(st.lab);
    main = `<p class="step-title"><a href="${R}labs/${lab.id}.html">Lab: ${e(lab.title)}</a> ${min}</p><p class="step-sub">${e(lab.idea)}</p>`;
  } else if (k === 'predict') {
    main = `<p class="step-title">Commit to a guess first ${min}</p><p class="predict-prompt">${e(st.prompt)}</p>
<div class="predict-box" data-predict="${e(st.id)}"><label class="sr-only" for="pr-${e(st.id)}">Your prediction</label><textarea id="pr-${e(st.id)}" rows="2" placeholder="Write your guess in a sentence. No peeking."></textarea><div class="row"><button type="button" class="btn btn-small" data-commit>Save my guess</button><span class="saved-note" aria-live="polite"></span>${st.lab ? `<a class="check-link" href="${R}labs/${st.lab}.html" hidden>Now check it in the lab</a>` : ''}</div></div>`;
  } else if (k === 'quiz') {
    const cs = cardsFor(st.refs.map((n) => n.slug));
    main = `<p class="step-title">Self-test: ${st.refs.map((n) => `<a href="${R}${n.url}#self-test">${e(n.displayTitle)}</a>`).join(', ')} ${min}</p>
<details class="quiz-drawer"><summary>${cs.length} card${cs.length === 1 ? '' : 's'}. Answer out loud before revealing.</summary><ol class="selftest">${cs.map((c) => `<li class="st-card" data-card="${e(c.id)}"><div class="st-q">${c.q}</div><button type="button" class="st-reveal" aria-expanded="false">Show answer</button><div class="st-a" hidden>${c.a}</div><div class="st-grade" hidden><button type="button" data-grade="no">Not yet</button><button type="button" data-grade="yes">Knew it</button></div></li>`).join('')}</ol>
<a class="linkish" href="${R}review.html?notes=${st.refs.map((n) => n.slug).join(',')}">Drill these as flashcards</a></details>`;
  } else if (k === 'teach') {
    const n = st.ref;
    main = `<p class="step-title">Teach back: ${e(n.displayTitle)} ${min}</p><p class="step-sub">Close the note. Explain it to a 12-year-old in two minutes, using the analogy from its mental picture. Where you stall is what to re-read.</p>
<div class="teach-box" data-teach="${n.slug}"><label class="sr-only" for="tb-${id}">Your explanation</label><textarea id="tb-${id}" rows="4" placeholder="Explain it in your own words…"></textarea><p class="saved-note" aria-live="polite"></p></div>`;
  } else if (k === 'do') {
    main = `<p class="step-title">${renderer.inline(e(st.text), null, R)} ${min}</p>${st.files || st.linkRef ? `<p class="step-sub">${fileChips(st.files)}${st.linkRef ? ` <a class="note-link" href="${R}${st.linkRef.url}">${icon('note')}${e(st.linkRef.displayTitle)}</a>` : ''}</p>` : ''}`;
  } else if (k === 'checkpoint') {
    main = `<p class="step-title">Can you…? ${min}</p><ul class="checklist">${st.items.map((it, i) => `<li><label><input type="checkbox" data-check="${id}|${i}"> ${e(it)}</label></li>`).join('')}</ul>`;
  }
  return `<li class="step step-${k}" data-step="${id}" id="${id.replace(/[^\w-]/g, '_')}">
  <div class="step-rail"><input type="checkbox" class="step-box" data-step-box="${id}" aria-label="Mark step done: ${e(stepKindLabel[k])}"${k === 'checkpoint' ? ' data-auto="1"' : ''}></div>
  <div class="step-body"><p class="step-kind kind-${k}">${stepKindLabel[k]}</p>${main}</div>
</li>`;
}

function weekPage(w, wi) {
  const prev = WEEKS[wi - 1], next = WEEKS[wi + 1];
  const phase = PHASES.find((p) => p.id === w.phase);
  const total = w.sessions.reduce((a, s) => a + s.minutes, 0);
  const sessions = w.sessions.map((s, si) => `
<section class="session" id="${s.id}" data-session="${s.id}" data-date="${s.date}">
  <header class="session-head">
    ${progressRing('s:' + s.id, 52, s.label)}
    <div><p class="session-date">${e(s.label)}</p><h2>${e(s.title)}</h2><p class="session-meta">${trackChip(s.course === 'foundations' ? 'foundations' : s.course)} <span>${s.steps.length} steps</span> <span>about ${fmtMin(s.minutes)}</span></p></div>
  </header>
  <ol class="steps">${s.steps.map((st) => stepHtml(st, s)).join('')}</ol>
</section>`).join('');
  const body = `
<article class="week" data-week="${w.id}">
  <header class="page-head">
    <p class="crumbs"><a href="${R}path.html">Learning path</a> <span aria-hidden="true">/</span> ${e(phase.title)}</p>
    <div class="week-title-row"><div><h1><span class="week-short">${e(w.short)}</span>${e(w.title)}</h1><p class="lede">${e(w.blurb)}</p><p class="week-facts"><span>${e(w.dates)}</span><span>${w.sessions.length} sessions</span><span>about ${fmtMin(total)} of study</span></p></div>${progressRing('w:' + w.id, 84, w.short)}</div>
  </header>
  <div class="next-bar" data-next-bar><button type="button" class="btn" data-next-step>Next step</button><p class="next-label" data-next-label></p></div>
  ${sessions}
  <nav class="pager" aria-label="Weeks">${prev ? `<a class="pager-prev" href="${prev.id}.html"><small>Previous</small>${e(prev.short)}: ${e(prev.title)}</a>` : '<span></span>'}${next ? `<a class="pager-next" href="${next.id}.html"><small>Next</small>${e(next.short)}: ${e(next.title)}</a>` : ''}</nav>
</article>`;
  emit(`weeks/${w.id}.html`, { current: 'week:' + w.id, title: `${w.short}: ${w.title}`, description: w.blurb, body, bodyClass: 'page-week' });
}
function fmtMin(m) { const h = Math.floor(m / 60), r = m % 60; return h ? `${h} h${r ? ` ${r} min` : ''}` : `${m} min`; }

// ------------------------------------------------------------------ concept pages
const LADDER = [
  { k: 'picture', label: 'Picture', hint: 'Read the mental picture' },
  { k: 'play', label: 'Play', hint: 'Predict, then poke the lab' },
  { k: 'learn', label: 'Learn', hint: 'Work through the theory' },
  { k: 'practice', label: 'Practice', hint: 'Redo the worked example' },
  { k: 'selftest', label: 'Self-test', hint: 'Answer before revealing' },
  { k: 'teach', label: 'Teach-back', hint: 'Explain it in 2 minutes' },
];
function ladderTargets(n) {
  const hs = n.r.headings.filter((h) => h.level === 2);
  const after = hs.findIndex((h) => h.id === 'picture');
  const isMeta = (h) => /^(self-test|mistakes|worked|used-in|where-it-appears)/.test(h.id);
  const learn = hs.slice(after + 1).find((h) => !isMeta(h));
  const practice = hs.find((h) => /^worked|^tests|^two-standard|^three-ways/.test(h.id)) || hs.find((h) => /example/.test(h.id));
  return {
    picture: hs.find((h) => h.id === 'picture') ? 'picture' : null,
    play: n.r.labs.length ? 'play' : null,
    learn: learn ? learn.id : null,
    practice: practice ? practice.id : null,
    selftest: hs.find((h) => h.id === 'self-test') ? 'self-test' : null,
    teach: 'teach-back',
  };
}
const chipLink = (slug) => { const c = bySlug.get(slug); return `<a class="dep dep-${c.track}" href="${R}${c.url}">${e(c.displayTitle)}</a>`; };

const masteryField = (where) => `<fieldset class="mastery mastery-${where}"><legend>How solid is it?</legend>${['new', 'learning', 'solid'].map((v) => `<label><input type="radio" name="mastery-${where}" value="${v}" data-mastery-input${v === 'new' ? ' checked' : ''}><span>${v[0].toUpperCase() + v.slice(1)}</span></label>`).join('')}</fieldset>`;
function conceptPage(n, i) {
  const tg = ladderTargets(n);
  const ladder = `<aside class="ladder" aria-label="Learning ladder" data-ladder="${n.slug}">
  <p class="ladder-title">Learning ladder</p>
  <ol>${LADDER.map((l, li) => `<li class="rung${tg[l.k] ? '' : ' rung-na'}" data-rung="${l.k}"><input type="checkbox" id="rung-${l.k}" data-rung-box="${l.k}" aria-label="${l.label} done"${tg[l.k] ? '' : ' disabled'}><a href="${tg[l.k] ? '#' + tg[l.k] : '#'}" ${tg[l.k] ? '' : 'aria-disabled="true" tabindex="-1"'}><span class="rung-n">${li + 1}</span><span class="rung-label">${l.label}</span><span class="rung-hint">${tg[l.k] ? l.hint : l.k === 'play' ? 'No lab for this note' : 'Not in this note'}</span></a></li>`).join('')}</ol>
  ${masteryField('side')}
</aside>`;
  const d = n.deps;
  const deps = (d.needs.size || d.usedBy.size || d.related.size) ? `<div class="deps" aria-label="Concept dependencies">
  ${d.needs.size ? `<div class="deps-col"><p class="deps-label">Needs</p><div class="deps-list">${[...d.needs].map(chipLink).join('')}</div></div>` : ''}
  <div class="deps-here" aria-hidden="true"><span>${e(n.displayTitle)}</span></div>
  ${d.usedBy.size ? `<div class="deps-col"><p class="deps-label">Used by</p><div class="deps-list">${[...d.usedBy].map(chipLink).join('')}</div></div>` : ''}
  ${d.related.size ? `<div class="deps-col deps-rel"><p class="deps-label">Pairs with</p><div class="deps-list">${[...d.related].map(chipLink).join('')}</div></div>` : ''}
</div>` : '';
  const meta = n.r.meta;
  const other = meta && meta.other.length ? `<p class="meta-other">${meta.other.join(' ')}</p>` : '';
  const courseMap = meta && meta.courseMap ? byTitle.get(meta.courseMap.toLowerCase()) : null;
  const bl = [...(backlinks.get(n.slug) || [])].map((s) => bySlug.get(s)).filter(Boolean);
  const prev = concepts[i - 1], next = concepts[i + 1];
  // insert teach-back before Mistakes log (or at end)
  const teach = `<section class="teach-back" id="teach-back" aria-labelledby="tb-h"><h2 id="tb-h">Teach it back</h2><p>Close everything above. In two minutes, explain <strong>${e(n.displayTitle)}</strong> to a 12-year-old using the mental picture. Type it, or say it aloud and jot the gaps.</p><div class="teach-box" data-teach="${n.slug}"><label class="sr-only" for="teach-${n.slug}">Your explanation</label><textarea id="teach-${n.slug}" rows="5" placeholder="In plain words…"></textarea><p class="saved-note" aria-live="polite"></p></div></section>`;
  let html = n.r.html;
  html = html.includes('<h2 id="mistakes-log"') ? html.replace('<h2 id="mistakes-log"', teach + '<h2 id="mistakes-log"') : html + teach;
  const body = `
<div class="concept-layout">
<article class="concept prose track-${n.track}" data-concept="${n.slug}">
  <header class="page-head">
    <p class="crumbs"><a href="${R}concepts.html">Concepts</a> <span aria-hidden="true">/</span> ${trackChip(n.track, TRACKS[n.track].name)}${courseMap ? ` <span aria-hidden="true">/</span> <a href="${R}${courseMap.url}">Course map</a>` : ''}</p>
    ${n.upcoming ? `<p class="ribbon"><strong>Upcoming lecture — primer</strong>${n.upcomingWhen ? `<span>${e(n.upcomingWhen)}</span>` : ''}<span>Written before the lecture; update it after class.</span></p>` : ''}
    <h1>${e(n.displayTitle)}</h1>
    <p class="head-meta">${tagBadges(n.tags)}<span class="read-time">${n.minutes} min read</span>${n.r.cards.length ? `<span class="read-time">${n.r.cards.length} self-test card${n.r.cards.length > 1 ? 's' : ''}</span>` : ''}</p>
    ${other}
    ${masteryField('top')}
  </header>
  ${deps}
  ${html}
  ${bl.length ? `<section class="backlinks"><h2>Linked from</h2><ul>${bl.map((b) => `<li><a href="${R}${b.url}">${e(b.displayTitle)}</a></li>`).join('')}</ul></section>` : ''}
  <nav class="pager" aria-label="Concepts">${prev ? `<a class="pager-prev" href="${R}${prev.url}"><small>Previous</small>${e(prev.displayTitle)}</a>` : '<span></span>'}${next ? `<a class="pager-next" href="${R}${next.url}"><small>Next</small>${e(next.displayTitle)}</a>` : ''}</nav>
</article>
${ladder}
</div>`;
  emit(n.url, { current: 'concept:' + n.slug, title: n.displayTitle, description: n.text.slice(0, 150), body, bodyClass: 'page-concept', labs: n.r.labs.length > 0 });
}

function notePage(n) {
  const bl = [...(backlinks.get(n.slug) || [])].map((s) => bySlug.get(s)).filter(Boolean);
  const body = `
<article class="note prose" data-note="${n.slug}">
  <header class="page-head">
    <p class="crumbs">${trackChip(n.track, TRACKS[n.track].name)}${n.exam ? ' <span class="badge badge-exam">Exam material</span>' : ''}</p>
    <h1>${e(n.displayTitle)}</h1>
  </header>
  ${n.r.html}
  ${bl.length ? `<section class="backlinks"><h2>Linked from</h2><ul>${bl.map((b) => `<li><a href="${R}${b.url}">${e(b.displayTitle)}</a></li>`).join('')}</ul></section>` : ''}
</article>`;
  emit(n.url, { current: 'note:' + n.slug, title: n.displayTitle, description: n.text.slice(0, 150), body, bodyClass: 'page-note', labs: n.r.labs.length > 0 });
}

// ------------------------------------------------------------------ home
function runway() {
  const start = Date.parse('2026-10-12T00:00:00+08:00'), end = Date.parse('2026-12-02T00:00:00+08:00');
  const pct = (iso) => (((Date.parse(iso.length === 10 ? iso + 'T00:00:00+08:00' : iso) - start) / (end - start)) * 100).toFixed(2);
  const phases = PHASES.map((p) => {
    const l = pct(p.from), r = pct(new Date(Date.parse(p.to + 'T00:00:00+08:00') + 864e5).toISOString());
    return `<div class="rw-phase rw-${p.id}" style="left:${l}%;width:${(r - l).toFixed(2)}%"><span>${e(p.title.replace(' + Part 1 catch-up', ''))}</span></div>`;
  }).join('');
  const study = WEEKS.flatMap((w) => w.sessions).map((s) => `<a class="rw-day rw-${s.course}" style="left:${pct(s.date)}%" href="${R}weeks/${WEEKS.find((w) => w.sessions.includes(s)).id}.html#${s.id}" title="${e(s.label)}: ${e(s.title)}" data-session-dot="${s.id}"><span class="sr-only">${e(s.label)}: ${e(s.title)}</span></a>`).join('');
  const pins = DEADLINES.map((d) => `<div class="rw-pin${d.important ? ' rw-pin-big' : ''} rw-${d.course}" style="left:${pct(d.iso)}%"><span class="rw-pin-label">${e(d.title.replace(' lecture', '').replace(' (CA2, 20%)', '').replace(' final exam', ' exam'))}</span></div>`).join('');
  const ticks = ['2026-10-12', '2026-10-19', '2026-10-26', '2026-11-02', '2026-11-09', '2026-11-16', '2026-11-23', '2026-11-30'].map((d) => `<span class="rw-tick" style="left:${pct(d)}%">${new Date(d + 'T00:00:00+08:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Singapore' })}</span>`).join('');
  return `<div class="runway-scroll" tabindex="0" aria-label="Semester runway, scrolls sideways on small screens"><div class="runway" data-start="${start}" data-end="${end}" aria-label="Semester runway from 12 Oct to 1 Dec">
  <div class="rw-pins">${pins}</div>
  <div class="rw-track">${phases}${study}<div class="rw-today" data-today hidden><span>Today</span></div></div>
  <div class="rw-ticks" aria-hidden="true">${ticks}</div>
</div></div>`;
}

function homePage() {
  const body = `
<div class="home">
  <section class="today" aria-labelledby="today-h">
    <p class="today-date" data-today-date>Today</p>
    <h1 id="today-h" data-focus-title>Your study plan</h1>
    <p class="today-sub" data-focus-sub></p>
    <ol class="focus-steps" data-focus-steps></ol>
    <div class="today-actions"><a class="btn" data-focus-go href="${R}path.html">Open the plan</a><a class="btn btn-quiet" data-continue hidden href="#">Continue where you left off</a></div>
  </section>
  <section class="countdowns" aria-label="Exam countdowns">
    ${EXAMS.map((x) => `<div class="countdown cd-${x.course}" data-countdown="${x.iso}"><p class="cd-course">${trackChip(x.course)}</p><p class="cd-num"><span data-cd-days>–</span><small>days</small></p><p class="cd-when">${e(x.name.replace(/^EE\d+ /, ''))} final, ${e(x.label)}</p><p class="cd-fine" data-cd-fine></p></div>`).join('')}
  </section>
  <section class="panel runway-panel" aria-labelledby="rw-h"><div class="panel-head"><h2 id="rw-h">The runway</h2><p>Seven weekends to two finals, three days apart. Dots are study sessions.</p></div>${runway()}</section>
  <div class="home-grid">
    <section class="panel" aria-labelledby="prog-h"><div class="panel-head"><h2 id="prog-h">Progress</h2></div>
      <div class="progress-overall"><p class="po-num" data-overall>0%</p><p class="po-label">of the learning path done<br><span data-overall-steps></span></p></div>
      <div class="meters">${GROUP_ORDER.map((t) => `<div class="meter meter-${t}" data-track-meter="${t}"><p class="meter-label">${trackChip(t, TRACKS[t].name)}<span data-meter-val>0 of 0 solid</span></p><div class="meter-bar"><span class="meter-learning"></span><span class="meter-solid"></span></div></div>`).join('')}</div>
      <p class="meter-key"><span class="key-solid"></span>solid <span class="key-learning"></span>learning, from the mastery buttons on each concept page</p>
    </section>
    <section class="panel" aria-labelledby="dl-h"><div class="panel-head"><h2 id="dl-h">Fixed dates</h2></div>
      <ol class="deadlines">${DEADLINES.map((d) => `<li class="dl${d.important ? ' dl-big' : ''}" data-deadline="${d.iso}">${trackChip(d.course)}<span class="dl-title">${e(d.title)}</span><span class="dl-when">${e(d.label)}</span><span class="dl-rel" data-rel></span></li>`).join('')}</ol>
    </section>
    <section class="panel" aria-labelledby="streak-h"><div class="panel-head"><h2 id="streak-h">Rhythm</h2></div>
      <p class="streak"><span class="streak-num" data-streak>0</span><span class="streak-label" data-streak-label>study days in a row</span></p>
      <div class="days14" data-days14 aria-label="Study activity, last 14 days"></div>
      <p class="muted small" data-last-studied>Tick a step or a ladder rung and today counts as a study day.</p>
    </section>
    <section class="panel" aria-labelledby="rev-h"><div class="panel-head"><h2 id="rev-h">Review queue</h2></div>
      <p class="review-due"><span data-due-num>${cards.length}</span> cards ready</p>
      <p class="muted small">Leitner boxes: a card you know moves up and comes back later; one you miss goes back to box 1.</p>
      <a class="btn btn-quiet" href="${R}review.html">Start a review</a>
    </section>
  </div>
</div>`;
  emit('index.html', { current: 'home', title: 'Today', description: 'Dashboard: today\'s focus, exam countdowns and progress.', body, bodyClass: 'page-home' });
}

function pathPage() {
  const body = `
<article class="pathpage">
  <header class="page-head"><h1>Learning path</h1><p class="lede">The weekend study plan as concrete steps. Each session ends with self-test cards and a teach-back, and each weekend starts by revisiting the last one. Nothing is locked: jump anywhere.</p></header>
  <ol class="phase-list">${PHASES.map((p) => `<li class="phase"><h2 class="phase-title"><span>${e(p.title)}</span><small>${fmtDate(p.from)} – ${fmtDate(p.to)}</small></h2>
    <ol class="week-cards">${WEEKS.filter((w) => w.phase === p.id).map((w) => `<li><a class="week-card" href="weeks/${w.id}.html">${progressRing('w:' + w.id, 56, w.short)}<div><p class="wc-short">${e(w.short)} <span>${e(w.dates)}</span></p><h3>${e(w.title)}</h3><p>${e(w.blurb)}</p><ul class="wc-sessions">${w.sessions.map((s) => `<li>${trackChip(s.course === 'foundations' ? 'foundations' : s.course, s.label)}<span>${e(s.title)}</span></li>`).join('')}</ul></div></a></li>`).join('')}</ol></li>`).join('')}</ol>
</article>`;
  emit('path.html', { current: 'path', title: 'Learning path', description: 'Week-by-week guided steps.', body, bodyClass: 'page-path' });
}
function fmtDate(iso) { return new Date(iso + 'T00:00:00+08:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Singapore' }); }

function conceptsIndex() {
  const groups = GROUP_ORDER.map((t) => `<section class="cgroup cgroup-${t}"><h2>${trackChip(t, TRACKS[t].name)}</h2><ul class="concept-list">${concepts.filter((c) => c.track === t).map((c) => {
    const first = (c.r.html.match(/<section class="mental-picture"[\s\S]*?<li>([\s\S]*?)<\/li>/) || [])[1] || '';
    const hook = first.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 140);
    return `<li class="concept-item" data-tags="${e(c.tags.join(' '))}" data-track="${c.track}" data-slug="${c.slug}"><a href="${c.url}"><span class="ci-state" data-mastery-dot="${c.slug}" title="Mastery"></span><span class="ci-title">${e(c.displayTitle)}</span><span class="ci-badges">${tagBadges(c.tags)}${c.r.labs.length ? '<span class="badge badge-lab">Lab</span>' : ''}</span>${hook ? `<span class="ci-hook">${e(hook)}${hook.length >= 140 ? '…' : ''}</span>` : ''}</a></li>`;
  }).join('')}</ul></section>`).join('');
  const body = `
<article class="concepts-index">
  <header class="page-head"><h1>Concepts</h1><p class="lede">${concepts.length} notes in three tracks. Foundations first; each concept page has a learning ladder from picture to teach-back.</p></header>
  <div class="filters" role="group" aria-label="Filter concepts">
    <button type="button" class="filter" aria-pressed="true" data-filter="all">All</button>
    <button type="button" class="filter" aria-pressed="false" data-filter="high-yield">High-yield</button>
    <button type="button" class="filter" aria-pressed="false" data-filter="upcoming">Primers</button>
    <button type="button" class="filter" aria-pressed="false" data-filter="not-solid">Not solid yet</button>
  </div>
  <p class="muted small filter-note" data-filter-note>High-yield = tagged exam-likely or core in your notes.</p>
  ${groups}
</article>`;
  emit('concepts.html', { current: 'concepts', title: 'Concepts', description: 'All concept notes grouped by track.', body, bodyClass: 'page-concepts' });
}

function labsPages() {
  const gallery = LABS.map((l) => {
    const cs = (labConcepts.get(l.id) || []).map((s) => bySlug.get(s));
    const tr = cs[0] ? cs[0].track : 'foundations';
    return `<li class="lab-card lab-${tr}"><a href="labs/${l.id}.html"><span class="lab-num">${l.id.slice(0, 2)}</span><img loading="lazy" src="assets/img/${l.id}.png" alt=""><span class="lab-card-title">${e(l.title)}</span><span class="lab-card-idea">${e(l.idea)}</span></a><p class="lab-card-concepts">${cs.map((c) => `<a href="${c.url}">${e(c.displayTitle)}</a>`).join(', ')}</p></li>`;
  }).join('');
  const vl = byTitle.get('visual labs');
  emit('labs.html', { current: 'labs', title: 'Labs', description: '21 interactive labs.', bodyClass: 'page-labs', body: `
<article class="labs-index">
  <header class="page-head"><h1>Labs</h1><p class="lede">${LABS.length} interactive versions of your Python Visual Labs. The habit: predict, play, then explain the gap. Each lab asks for your guess before showing what to notice.</p></header>
  <ul class="lab-grid">${gallery}</ul>
  ${vl ? `<p class="muted">The original table lives in <a href="${vl.url}">Visual Labs</a>.</p>` : ''}
</article>` });
  for (const [i, l] of LABS.entries()) {
    const cs = (labConcepts.get(l.id) || []).map((s) => bySlug.get(s));
    const prev = LABS[i - 1], next = LABS[i + 1];
    emit(`labs/${l.id}.html`, { current: 'labs', title: l.title, description: l.idea, bodyClass: 'page-lab', labs: true, body: `
<article class="lab-page">
  <header class="page-head"><p class="crumbs"><a href="${R}labs.html">Labs</a> <span aria-hidden="true">/</span> Lab ${l.id.slice(0, 2)}</p>
  <h1>${e(l.title)}</h1>${cs.length ? `<p class="head-meta">Goes with ${cs.map((c) => `<a class="dep dep-${c.track}" href="${R}${c.url}">${e(c.displayTitle)}</a>`).join(' ')}</p>` : ''}</header>
  <div class="lab-slot" data-lab="${l.id}" id="lab-${l.id}"></div>
  <details class="lab-static"><summary>Static picture (from the Python lab)</summary><img loading="lazy" src="${R}assets/img/${l.id}.png" alt="Static matplotlib output of lab ${l.id}"></details>
  <nav class="pager" aria-label="Labs">${prev ? `<a class="pager-prev" href="${prev.id}.html"><small>Previous</small>${e(prev.title)}</a>` : '<span></span>'}${next ? `<a class="pager-next" href="${next.id}.html"><small>Next</small>${e(next.title)}</a>` : ''}</nav>
</article>` });
  }
}

function reviewPage() {
  emit('review.html', { current: 'review', title: 'Review', description: 'Flashcards from every self-test.', bodyClass: 'page-review', body: `
<article class="review" data-review>
  <header class="page-head"><h1>Review</h1><p class="lede">${cards.length} cards from the self-tests in your notes. Answer out loud, then reveal. “Knew it” moves a card up a box and spaces it out; “Not yet” sends it back to box 1.</p></header>
  <div class="review-controls">
    <div class="filters" role="group" aria-label="Course"><button type="button" class="filter" aria-pressed="true" data-course="all">All</button>${GROUP_ORDER.map((t) => `<button type="button" class="filter" aria-pressed="false" data-course="${t}">${e(TRACKS[t].short)}</button>`).join('')}</div>
    <label class="select-wrap">Concept <select data-concept-select><option value="">All concepts</option>${concepts.filter((c) => c.r.cards.length).map((c) => `<option value="${c.slug}">${e(c.displayTitle)}</option>`).join('')}</select></label>
    <label class="toggle"><input type="checkbox" data-due-only checked> Due cards only</label>
  </div>
  <div class="boxes" data-boxes aria-label="Leitner boxes"></div>
  <div class="flash" data-flash aria-live="polite"></div>
</article>` });
}

function examsPage() {
  const intel = byTitle.get('exam intel'), plan = byTitle.get('weekend study plan'), cheat = byTitle.get('ee5907 cheat sheet');
  const maps = ['ee5907 course map', 'ee5101 course map'].map((t) => byTitle.get(t)).filter(Boolean);
  const hy = (t) => concepts.filter((c) => c.track === t && (c.tags.includes('exam-likely') || c.tags.includes('core')));
  emit('exams.html', { current: 'exams', title: 'Exams', description: 'Exam dates, formats and plan.', bodyClass: 'page-exams', body: `
<article class="exams">
  <header class="page-head"><h1>Exams</h1><p class="lede">Two finals, three days apart. EE5907 is closed book with one double-sided cheat sheet; the only EE5101 paper on record (2021/22) was open book.</p></header>
  <section class="countdowns" aria-label="Exam countdowns">
    ${EXAMS.map((x) => `<div class="countdown cd-${x.course}" data-countdown="${x.iso}"><p class="cd-course">${trackChip(x.course)}</p><p class="cd-num"><span data-cd-days>–</span><small>days</small></p><p class="cd-when">${e(x.label)}</p><p class="cd-fine">${e(x.format)}</p></div>`).join('')}
  </section>
  <div class="exam-cols">
  ${['EE5907', 'EE5101'].map((t) => `<section class="panel"><div class="panel-head"><h2>${trackChip(t, TRACKS[t].name)}</h2><p>High-yield concepts from your tags</p></div><ul class="hy-list">${hy(t).map((c) => `<li><a href="${c.url}">${e(c.displayTitle)}</a> ${tagBadges(c.tags)}</li>`).join('')}</ul></section>`).join('')}
  </div>
  <section class="panel"><div class="panel-head"><h2>Plan and intel</h2></div><ul class="link-list">
    ${[intel, plan, cheat, ...maps].filter(Boolean).map((n) => `<li><a href="${n.url}">${e(n.displayTitle)}</a></li>`).join('')}
    ${INCLUDE_EXAMS ? notes.filter((n) => n.exam).map((n) => `<li><a href="${n.url}">${e(n.displayTitle)}</a> <span class="badge badge-exam">Exam material</span></li>`).join('') : `<li class="muted">Past-paper notes stay in your vault and are not published (build with <code>--include-exams</code> to include them).</li>`}
  </ul></section>
</article>` });
}

function statsPage() {
  emit('stats.html', { current: 'stats', title: 'Stats', description: 'Study minutes, streaks, mastery and weak cards.', bodyClass: 'page-stats', body: `
<article class="stats" data-stats>
  <header class="page-head"><h1>Stats</h1><p class="lede" data-stats-lede>How the weekends are adding up: minutes studied, streaks, mastery and the cards that keep slipping.</p></header>
  <div class="stat-row" data-stat-tiles></div>
  <section class="panel"><div class="panel-head"><h2>Minutes studied, last 30 days</h2><p>Counted from active minutes on the site, all devices combined.</p></div><div class="bars" data-minutes></div></section>
  <div class="exam-cols">
    <section class="panel"><div class="panel-head"><h2>Last 8 weeks</h2><p>Darker squares mean more minutes.</p></div><div class="heat" data-heat></div></section>
    <section class="panel"><div class="panel-head"><h2>Mastery by track</h2></div><div class="meters" data-mastery-stats></div></section>
  </div>
  <section class="panel"><div class="panel-head"><h2>Weak cards</h2><p>Self-test cards you have missed more often than you got right.</p></div><ol class="weak" data-weak></ol></section>
  <section class="panel"><div class="panel-head"><h2>Your data</h2><p data-data-note>Download everything as one JSON file, or bring a file back in. Imports merge: the newer value of each item wins.</p></div>
    <div class="btn-row-l"><button class="btn btn-quiet" type="button" data-export>Download my progress</button><label class="btn btn-quiet file-btn">Import a progress file<input type="file" accept="application/json,.json" data-import hidden></label></div>
    <p class="saved-note" data-import-note aria-live="polite"></p>
  </section>
</article>` });
}

function searchPage() {
  emit('search.html', { current: 'search', title: 'Search', description: 'Search the site.', bodyClass: 'page-search', body: `
<article><header class="page-head"><h1>Search</h1></header><div class="search-inline"><label class="sr-only" for="search-page-input">Search</label><input id="search-page-input" type="search" placeholder="Try “riccati”, “bayes”, “week 3”…" autocomplete="off"><ul class="search-results" id="search-page-results"></ul></div></article>` });
}

// ------------------------------------------------------------------ build pages
homePage();
pathPage();
WEEKS.forEach(weekPage);
concepts.forEach(conceptPage);
notes.filter((n) => n.type !== 'concept').forEach(notePage);
conceptsIndex();
labsPages();
reviewPage();
examsPage();
searchPage();
statsPage();

// ------------------------------------------------------------------ data + search index
const pub = {
  weeks: WEEKS.map((w) => ({ id: w.id, short: w.short, title: w.title, dates: w.dates, from: w.from, to: w.to, url: `weeks/${w.id}.html`,
    sessions: w.sessions.map((s) => ({ id: s.id, date: s.date, label: s.label, course: s.course, title: s.title, minutes: s.minutes,
      steps: s.steps.map((st) => ({ id: st.sid, kind: st.kind, min: st.min, label: stepLabel(st) })) })) })),
  concepts: concepts.map((c) => ({ slug: c.slug, title: c.displayTitle, track: c.track, url: c.url, tags: c.tags, cards: c.r.cards.length })),
  cards: cards.map((c) => ({ ...c, q: fix(c.q, ''), a: fix(c.a, '') })),
  exams: EXAMS, deadlines: DEADLINES, phases: PHASES,
  labs: LABS.map((l) => ({ id: l.id, title: l.title, concepts: labConcepts.get(l.id) || [] })),
  built: new Date().toISOString(),
};
function stepLabel(st) {
  if (st.kind === 'read') return `Read ${st.ref.displayTitle}`;
  if (st.kind === 'see') return `Lab: ${labIds.get(st.lab).title}`;
  if (st.kind === 'predict') return 'Predict: ' + st.prompt.slice(0, 70) + (st.prompt.length > 70 ? '…' : '');
  if (st.kind === 'quiz') return `Self-test: ${st.refs.map((n) => n.displayTitle).join(', ')}`;
  if (st.kind === 'teach') return `Teach back ${st.ref.displayTitle}`;
  if (st.kind === 'do') return st.text.length > 80 ? st.text.slice(0, 78) + '…' : st.text;
  return 'Checkpoint';
}
write('assets/data.js', `window.MM=${JSON.stringify(pub)};`);

const index = [
  ...notes.map((n) => ({ t: n.displayTitle, u: n.url, k: n.type === 'concept' ? 'Concept' : 'Note', c: n.track, h: n.r.headings.map((h) => h.text).join(' | '), x: n.text.slice(0, 4000), g: n.tags.join(' ') })),
  ...WEEKS.map((w) => ({ t: `${w.short}: ${w.title}`, u: `weeks/${w.id}.html`, k: 'Week', c: 'general', h: w.sessions.map((s) => `${s.label} ${s.title}`).join(' | '), x: w.blurb + ' ' + w.dates, g: '' })),
  ...LABS.map((l) => ({ t: `Lab ${l.id.slice(0, 2)}: ${l.title}`, u: `labs/${l.id}.html`, k: 'Lab', c: ((labConcepts.get(l.id) || [])[0] && bySlug.get(labConcepts.get(l.id)[0]).track) || 'general', h: '', x: l.idea + ' ' + (l.keywords || ''), g: '' })),
  { t: 'Review flashcards', u: 'review.html', k: 'Page', c: 'general', h: '', x: 'Leitner flashcards self-test review', g: '' },
  { t: 'Exams', u: 'exams.html', k: 'Page', c: 'general', h: '', x: 'exam countdown dates format cheat sheet', g: '' },
  { t: 'Learning path', u: 'path.html', k: 'Page', c: 'general', h: '', x: 'weeks schedule plan', g: '' },
];
write('assets/search.js', `window.MM_SEARCH=${JSON.stringify(index)};`);

// ------------------------------------------------------------------ assets
const copy = (from, to) => { fs.mkdirSync(path.dirname(path.join(OUT, to)), { recursive: true }); fs.copyFileSync(from, path.join(OUT, to)); };
const copyDir = (from, to) => fs.cpSync(from, path.join(OUT, to), { recursive: true });
const require = createRequire(import.meta.url);
const pkgDir = (name) => path.dirname(require.resolve(name + '/package.json'));
copy(path.join(pkgDir('katex'), 'dist/katex.min.css'), 'assets/katex/katex.min.css');
copyDir(path.join(pkgDir('katex'), 'dist/fonts'), 'assets/katex/fonts');
// fonts (latin + latin-ext + greek where present)
const fontCss = [];
const lit = path.join(pkgDir('@fontsource-variable/literata'), 'files');
for (const style of ['normal', 'italic']) for (const sub of ['latin', 'latin-ext', 'greek']) {
  const f = `literata-${sub}-opsz-${style}.woff2`;
  if (!fs.existsSync(path.join(lit, f))) continue;
  copy(path.join(lit, f), `assets/fonts/${f}`);
  fontCss.push(`@font-face{font-family:'Literata';font-style:${style};font-display:swap;font-weight:200 900;src:url(${f}) format('woff2-variations'),url(${f}) format('woff2');${sub === 'latin' ? 'unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;' : sub === 'greek' ? 'unicode-range:U+0370-0377,U+037A-037F,U+0384-038A,U+038C,U+038E-03A1,U+03A3-03FF;' : 'unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF;'}}`);
}
const atk = path.join(pkgDir('@fontsource/ibm-plex-sans'), 'files');
for (const [w, style] of [[400, 'normal'], [400, 'italic'], [500, 'normal'], [600, 'normal'], [700, 'normal']]) for (const sub of ['latin', 'latin-ext']) {
  const f = `ibm-plex-sans-${sub}-${w}-${style}.woff2`;
  if (!fs.existsSync(path.join(atk, f))) continue;
  copy(path.join(atk, f), `assets/fonts/${f}`);
  fontCss.push(`@font-face{font-family:'IBM Plex Sans';font-style:${style};font-display:swap;font-weight:${w};src:url(${f}) format('woff2');${sub === 'latin' ? 'unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;' : 'unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF;'}}`);
}
write('assets/fonts/fonts.css', fontCss.join('\n'));
for (const img of images) copy(img.abs, `assets/img/${img.name}`);
copy(path.join(HERE, 'src/styles/site.css'), 'assets/site.css');
copy(path.join(HERE, 'src/favicon.svg'), 'assets/favicon.svg');
const clientDir = path.join(HERE, 'src/client');
write('assets/app.js', fs.readdirSync(clientDir).filter((f) => f.endsWith('.js')).sort().map((f) => `/* ${f} */\n` + fs.readFileSync(path.join(clientDir, f), 'utf8')).join('\n'));
write('assets/labs.js', ['_kit.js', ...labFiles].map((f) => `/* ${f} */\n` + fs.readFileSync(path.join(LAB_DIR, f), 'utf8')).join('\n'));
write('.nojekyll', '');
write('assets/theme.js', "try{var t=localStorage.getItem('mm:theme');t=t&&JSON.parse(t);if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}");
write('assets/sync.json', JSON.stringify({ server: false }));
write('404.html', `<!doctype html><meta charset="utf-8"><title>Not found</title><meta name="viewport" content="width=device-width"><body style="font:16px/1.5 system-ui;padding:2rem;max-width:40rem;margin:auto"><h1>Page not found</h1><p>This page is not part of the site. <a href="./index.html">Go to today’s plan</a>.</p></body>`);

// ------------------------------------------------------------------ report
const kErr = getKatexErrors();
if (kErr.length) warn.push(`${kErr.length} KaTeX errors:\n  ` + kErr.map((k) => `${k.tex} -> ${k.msg}`).join('\n  '));
if (renderer.unknown.size) warn.push(`Links to notes not in the vault (rendered as muted text): ${[...renderer.unknown].join(', ')}`);
log(`labs: ${LABS.length}; cards: ${cards.length}; course files referenced: ${renderer.courseFiles.size}`);
log(`wrote ${pagesWritten.length} pages to ${path.relative(process.cwd(), OUT) || OUT} in ${Date.now() - t0} ms`);
for (const w of warn) console.warn('! ' + w);
write('build-report.json', JSON.stringify({ pages: pagesWritten, labs: LABS.length, cards: cards.length, concepts: concepts.length, katexErrors: kErr, unknownLinks: [...renderer.unknown], excluded, includeExams: INCLUDE_EXAMS }, null, 1));
