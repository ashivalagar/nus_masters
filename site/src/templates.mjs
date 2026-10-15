// HTML templates. Every URL is relative: `root` is '' for top-level pages, '../' one level down.
import { escapeHtml as e } from './vault.mjs';

export const TRACKS = {
  foundations: { name: 'Math Foundations', short: 'Foundations' },
  EE5101: { name: 'Linear Systems (EE5101)', short: 'EE5101' },
  EE5907: { name: 'Pattern Recognition (EE5907)', short: 'EE5907' },
  general: { name: 'Planning', short: 'Plan' },
};

const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/>',
  path: '<path d="M5 3v18M5 6h10l-2 3 2 3H5"/>',
  concept: '<path d="M4 5h7v14H4zM13 5h7v14h-7z"/>',
  lab: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/>',
  review: '<rect x="3" y="6" width="14" height="14" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v12"/>',
  exam: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
  note: '<path d="M6 3h9l4 4v14H6zM14 3v5h5"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  stats: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
};
export const icon = (name, cls = 'ic') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;

export function trackChip(track, label) {
  const t = TRACKS[track] || TRACKS.general;
  return `<span class="chip chip-${track}"><span class="dot" aria-hidden="true"></span>${e(label || t.short)}</span>`;
}

export function tagBadges(tags = []) {
  const out = [];
  if (tags.includes('exam-likely')) out.push('<span class="badge badge-exam" title="Tagged exam-likely in your notes">Exam-likely</span>');
  if (tags.includes('core')) out.push('<span class="badge badge-core" title="Tagged core in your notes">Core</span>');
  if (tags.includes('upcoming')) out.push('<span class="badge badge-upcoming">Primer</span>');
  if (tags.includes('assignment')) out.push('<span class="badge badge-assign">Assignment 2</span>');
  return out.join('');
}

function nav(site, root, current) {
  const is = (k) => (current === k ? ' aria-current="page"' : '');
  const weekLinks = site.weeks.map((w) => `<li><a href="${root}weeks/${w.id}.html"${is('week:' + w.id)}><span class="nav-wk">${e(w.short)}</span><span class="nav-sub">${e(w.dates.replace(/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun) /g, ''))}</span></a></li>`).join('');
  const groups = ['foundations', 'EE5101', 'EE5907'].map((tr) => {
    const items = site.concepts.filter((c) => c.track === tr);
    const open = items.some((c) => current === 'concept:' + c.slug) ? ' open' : '';
    return `<details class="nav-group nav-${tr}"${open}><summary><span class="dot" aria-hidden="true"></span>${e(TRACKS[tr].name)}</summary><ul>${items.map((c) => `<li><a href="${root}${c.url}"${is('concept:' + c.slug)} data-mastery-slug="${c.slug}">${e(c.title)}</a></li>`).join('')}</ul></details>`;
  }).join('');
  const notes = site.notesNav.map((n) => `<li><a href="${root}${n.url}"${is('note:' + n.slug)}>${e(n.title)}</a></li>`).join('');
  return `
<nav class="sidenav" id="sidenav" aria-label="Site">
  <a class="brand" href="${root}index.html"><span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M3 22c4 0 5-12 9-12s4 8 7 8 4-6 10-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="10" r="2.4" fill="currentColor"/></svg></span><span class="brand-text">Masters Mind<small>NUS MSc EE, semester 1</small></span></a>
  <button class="search-trigger" type="button" data-open-search>${icon('search')}<span>Search</span><kbd>/</kbd></button>
  <ul class="nav-main">
    <li><a href="${root}index.html"${is('home')}>${icon('home')}Today</a></li>
    <li><a href="${root}path.html"${is('path')}>${icon('path')}Learning path</a></li>
    <li><a href="${root}concepts.html"${is('concepts')}>${icon('concept')}Concepts</a></li>
    <li><a href="${root}labs.html"${is('labs')}>${icon('lab')}Labs</a></li>
    <li><a href="${root}review.html"${is('review')}>${icon('review')}Review</a></li>
    <li><a href="${root}exams.html"${is('exams')}>${icon('exam')}Exams</a></li>
    <li><a href="${root}stats.html"${is('stats')}>${icon('stats')}Stats</a></li>
  </ul>
  <p class="nav-label">Weeks</p>
  <ul class="nav-weeks">${weekLinks}</ul>
  <p class="nav-label">Concepts</p>
  ${groups}
  <p class="nav-label">Notes</p>
  <ul class="nav-notes">${notes}</ul>
</nav>`;
}

export function page({ site, root, current, title, description = '', body, bodyClass = '', scripts = [], labs = false }) {
  const scriptTags = [
    `<script src="${root}assets/data.js"></script>`,
    labs ? `<script src="${root}assets/labs.js"></script>` : '',
    `<script src="${root}assets/app.js"></script>`,
    ...scripts.map((s) => `<script src="${root}${s}"></script>`),
  ].join('\n');
  return `<!doctype html>
<html lang="en-SG">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${e(title)} · Masters Mind</title>
<meta name="description" content="${e(description)}">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#f3f4ef" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#10161e" media="(prefers-color-scheme: dark)">
<link rel="icon" href="${root}assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${root}assets/fonts/fonts.css">
<link rel="stylesheet" href="${root}assets/katex/katex.min.css">
<link rel="stylesheet" href="${root}assets/site.css">
<script src="${root}assets/theme.js"></script>
</head>
<body class="${bodyClass}" data-root="${root}" data-page="${e(current)}">
<a class="skip" href="#main">Skip to content</a>
<header class="topbar">
  <button class="icon-btn nav-toggle" type="button" aria-controls="sidenav" aria-expanded="false" aria-label="Open menu">${icon('menu')}</button>
  <a class="topbar-brand" href="${root}index.html">Masters Mind</a>
  <div class="topbar-actions">
    <button class="icon-btn" type="button" data-open-search aria-label="Search">${icon('search')}</button>
    <button class="icon-btn theme-toggle" type="button" aria-label="Switch colour theme">${icon('sun', 'ic ic-sun')}${icon('moon', 'ic ic-moon')}</button>
  </div>
</header>
<div class="shell">
${nav(site, root, current)}
<div class="scrim" data-close-nav hidden></div>
<main id="main" tabindex="-1">
${body}
<footer class="foot"><p>Built from your Obsidian vault. Progress is saved in this browser only.</p><button class="linkish theme-toggle-text" type="button">Switch theme</button></footer>
</main>
</div>
<div class="search-dialog" id="search-dialog" hidden role="dialog" aria-modal="true" aria-label="Search">
  <div class="search-panel">
    <div class="search-row">${icon('search')}<input id="search-input" type="search" placeholder="Search concepts, labs, weeks…" autocomplete="off" spellcheck="false" aria-label="Search the site"><button class="icon-btn" type="button" data-close-search aria-label="Close search">${icon('close')}</button></div>
    <ul class="search-results" id="search-results" role="listbox"></ul>
    <p class="search-hint">Press <kbd>/</kbd> to search anywhere, <kbd>↑</kbd> <kbd>↓</kbd> to move, <kbd>Enter</kbd> to open.</p>
  </div>
</div>
${scriptTags}
</body>
</html>
`;
}

export function progressRing(id, size = 44, label = '') {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  return `<svg class="ring" data-ring="${id}" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${e(label)} progress"><circle class="ring-track" cx="${size / 2}" cy="${size / 2}" r="${r}"/><circle class="ring-fill" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${c.toFixed(2)}" transform="rotate(-90 ${size / 2} ${size / 2})"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" class="ring-text">0%</text></svg>`;
}
