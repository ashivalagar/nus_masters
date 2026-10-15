/* Core UI: theme, navigation drawer, search, shared widgets (cards, predictions, teach-back, tasks). */
(function () {
  'use strict';
  var S = window.MMStore;
  var MM = window.MM || { weeks: [], concepts: [], cards: [] };
  var root = document.body.getAttribute('data-root') || '';
  var $ = function (sel, el) { return (el || document).querySelector(sel); };
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };
  var App = window.MMApp = { $: $, $$: $$, root: root, refreshers: [] };
  App.onRefresh = function (fn) { App.refreshers.push(fn); };
  App.refresh = function () { App.refreshers.forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } }); };
  S.on(function (key, v, remote) { if (remote) App.refresh(); });

  /* ---------------- theme */
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function effTheme() {
    var t = document.documentElement.getAttribute('data-theme');
    return t === 'light' || t === 'dark' ? t : (mq && mq.matches ? 'dark' : 'light');
  }
  function applyEff() {
    var eff = effTheme();
    document.documentElement.setAttribute('data-eff', eff);
    $$('.theme-toggle').forEach(function (b) { b.setAttribute('aria-label', eff === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'); });
    $$('.theme-toggle-text').forEach(function (b) { b.textContent = eff === 'dark' ? 'Use light theme' : 'Use dark theme'; });
    window.dispatchEvent(new CustomEvent('mm-theme', { detail: eff }));
  }
  function toggleTheme() {
    var next = effTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    S.set('theme', next);
    applyEff();
  }
  $$('.theme-toggle, .theme-toggle-text').forEach(function (b) { b.addEventListener('click', toggleTheme); });
  if (mq && mq.addEventListener) mq.addEventListener('change', applyEff);
  applyEff();

  /* ---------------- sync status dot (only shown when a server answers) */
  $$('.brand, .topbar-brand').forEach(function (b) {
    var d = document.createElement('span'); d.className = 'sync-dot'; d.setAttribute('data-sync-dot', ''); d.setAttribute('role', 'img');
    b.appendChild(d);
  });
  S.sync.start();

  /* ---------------- nav drawer */
  var nav = $('#sidenav'), scrim = $('.scrim'), tog = $('.nav-toggle');
  function setNav(open) {
    if (!nav) return;
    nav.classList.toggle('open', open);
    if (scrim) scrim.hidden = !open;
    if (tog) tog.setAttribute('aria-expanded', String(open));
    if (open) { var a = $('a[aria-current="page"]', nav) || $('a', nav); if (a) { a.scrollIntoView({ block: 'center' }); } }
  }
  if (tog) tog.addEventListener('click', function () { setNav(!nav.classList.contains('open')); });
  if (scrim) scrim.addEventListener('click', function () { setNav(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setNav(false); closeSearch(); } });
  // keep the current page visible in the sidebar
  var cur = nav && $('a[aria-current="page"]', nav);
  if (cur && window.innerWidth > 960) { var r = cur.getBoundingClientRect(); if (r.bottom > window.innerHeight - 40) nav.scrollTop = cur.offsetTop - window.innerHeight / 2; }

  /* mastery dots in the sidebar */
  function paintNavMastery() {
    $$('[data-mastery-slug]').forEach(function (a) { a.setAttribute('data-m', S.get('mastery:' + a.getAttribute('data-mastery-slug'), 'new')); });
  }
  paintNavMastery(); App.onRefresh(paintNavMastery);

  /* ---------------- last visited ("continue where you left off") */
  var page = document.body.getAttribute('data-page') || '';
  if (page && page !== 'home' && page !== 'search') {
    var h1 = $('h1');
    var here = location.pathname.split('/').slice(-2);
    var rel = (root ? here.join('/') : here[here.length - 1]);
    // store a root-relative URL
    var depth = (root.match(/\.\.\//g) || []).length;
    var parts = location.pathname.split('/').filter(Boolean);
    var relUrl = parts.slice(parts.length - 1 - depth).join('/') || 'index.html';
    S.set('last', { url: relUrl, title: h1 ? h1.textContent.trim() : document.title, t: Date.now(), hash: '' }, { silent: true });
    void rel;
  }

  /* ---------------- self-test cards (concept pages, week quiz steps) */
  App.cardState = function (id) { return S.get('card:' + id, null); };
  App.gradeCard = function (id, knew) {
    var st = S.get('card:' + id, { box: 1, due: 0, seen: 0, right: 0, wrong: 0 });
    var gaps = [0, 1, 3, 7, 14, 30];
    st.seen++;
    if (knew) { st.right++; st.box = Math.min(5, (st.box || 1) + 1); } else { st.wrong++; st.box = 1; }
    st.due = Date.now() + gaps[st.box] * 864e5 - 36e5;
    st.last = Date.now();
    S.set('card:' + id, st);
    S.event('card_reviewed', id, { knew: !!knew, box: st.box });
    S.markStudied();
    return st;
  };
  function wireCards(scope) {
    $$('.st-card', scope).forEach(function (card) {
      if (card._wired) return; card._wired = true;
      var id = card.getAttribute('data-card');
      var btn = $('.st-reveal', card), ans = $('.st-a', card), grade = $('.st-grade', card);
      var st = App.cardState(id);
      if (st && st.last) card.setAttribute('data-known', st.box > 1 ? 'yes' : 'no');
      if (!btn) return;
      btn.addEventListener('click', function () {
        var open = ans.hidden;
        ans.hidden = !open; grade.hidden = !open;
        btn.textContent = open ? 'Hide answer' : 'Show answer';
        btn.setAttribute('aria-expanded', String(open));
      });
      $$('[data-grade]', grade).forEach(function (g) {
        g.addEventListener('click', function () {
          var knew = g.getAttribute('data-grade') === 'yes';
          App.gradeCard(id, knew);
          card.setAttribute('data-known', knew ? 'yes' : 'no');
          grade.innerHTML = '<span class="saved-note">' + (knew ? 'Moved up a box in Review.' : 'Back to box 1. It will come up again soon.') + '</span>';
        });
      });
    });
  }
  App.wireCards = wireCards;

  /* ---------------- predictions + teach-back (saved text) */
  function debounce(fn, ms) { var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms); }; }
  App.debounce = debounce;
  function wireTextBoxes(scope) {
    $$('[data-teach]', scope).forEach(function (box) {
      if (box._wired) return; box._wired = true;
      var slug = box.getAttribute('data-teach'), ta = $('textarea', box), note = $('.saved-note', box);
      var load = function () { var v = S.get('teach:' + slug, null); if (document.activeElement !== ta) ta.value = v && v.text ? v.text : ''; if (v && v.t) note.textContent = 'Saved ' + ago(v.t) + '.'; };
      load(); App.onRefresh(load);
      ta.addEventListener('input', debounce(function () {
        S.set('teach:' + slug, { text: ta.value, t: Date.now() });
        note.textContent = 'Saved.';
        S.markStudied();
      }, 500));
      ta.addEventListener('change', function () { S.event('teach_back', slug, { chars: ta.value.length }); });
    });
    $$('[data-predict]', scope).forEach(function (box) {
      if (box._wired) return; box._wired = true;
      var id = box.getAttribute('data-predict'), ta = $('textarea', box), note = $('.saved-note', box), commit = $('[data-commit]', box), link = $('.check-link', box);
      var load = function () {
        var v = S.get('predict:' + id, null);
        if (v && v.text && document.activeElement !== ta) ta.value = v.text;
        if (v && v.text) { note.textContent = 'Guess saved ' + ago(v.t) + '. Now check it.'; if (link) link.hidden = false; commit.textContent = 'Update my guess'; }
      };
      load(); App.onRefresh(load);
      commit.addEventListener('click', function () {
        if (!ta.value.trim()) { note.textContent = 'Write a guess first; even a wrong one teaches you something.'; ta.focus(); return; }
        S.set('predict:' + id, { text: ta.value.trim(), t: Date.now() });
        S.event('predict', id);
        S.markStudied();
        load();
        box.dispatchEvent(new CustomEvent('mm-predicted', { bubbles: true }));
      });
    });
  }
  App.wireTextBoxes = wireTextBoxes;

  /* ---------------- vault task lists */
  function wireTasks(scope) {
    $$('.task-box', scope).forEach(function (b) {
      if (b._wired) return; b._wired = true;
      var id = b.getAttribute('data-task');
      var load = function () { var v = S.get('task:' + id, null); b.checked = v == null ? b.hasAttribute('data-default') : !!v; };
      load(); App.onRefresh(load);
      b.addEventListener('change', function () { S.set('task:' + id, b.checked); if (b.checked) S.markStudied(); });
    });
  }

  function ago(t) {
    var s = (Date.now() - t) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return Math.round(s / 60) + ' min ago';
    if (s < 86400) return Math.round(s / 3600) + ' h ago';
    return Math.round(s / 86400) + ' days ago';
  }
  App.ago = ago;

  wireCards(document); wireTextBoxes(document); wireTasks(document);

  /* ---------------- labs on any page */
  if (window.MMLab) {
    $$('.lab-slot').forEach(function (el) {
      try { window.MMLab.mount(el, el.getAttribute('data-lab')); }
      catch (e) { console.error(e); el.innerHTML = '<p class="lab-error">This lab failed to start. The static picture below still works.</p>'; }
    });
  }

  /* ---------------- search */
  var dlg = $('#search-dialog'), input = $('#search-input'), list = $('#search-results');
  var lastFocus = null, index = null, loading = null;
  function loadIndex() {
    if (index) return Promise.resolve(index);
    if (window.MM_SEARCH) { index = prep(window.MM_SEARCH); return Promise.resolve(index); }
    if (loading) return loading;
    loading = new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = root + 'assets/search.js';
      s.onload = function () { index = prep(window.MM_SEARCH || []); res(index); };
      s.onerror = rej; document.head.appendChild(s);
    });
    return loading;
  }
  function norm(s) { return (s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, ''); }
  function prep(items) { return items.map(function (it) { return { it: it, t: norm(it.t), h: norm(it.h), x: norm(it.x), g: norm(it.g) }; }); }
  function subseq(q, s) { var i = 0; for (var j = 0; j < s.length && i < q.length; j++) if (s[j] === q[i]) i++; return i === q.length; }
  function score(e, terms) {
    var total = 0;
    for (var i = 0; i < terms.length; i++) {
      var q = terms[i], sc = 0;
      if (e.t === q) sc = 100;
      else if (e.t.indexOf(q) === 0) sc = 60;
      else if (new RegExp('\\b' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(e.t)) sc = 45;
      else if (e.t.indexOf(q) >= 0) sc = 30;
      else if (e.g.indexOf(q) >= 0) sc = 22;
      else if (e.h.indexOf(q) >= 0) sc = 18;
      else if (e.x.indexOf(q) >= 0) sc = 8 + Math.min(6, e.x.split(q).length - 1);
      else if (q.length > 2 && subseq(q, e.t.replace(/\s+/g, ''))) sc = 6;
      if (!sc) return 0;
      total += sc;
    }
    if (e.it.k === 'Concept') total *= 1.15;
    return total;
  }
  function snippet(e, terms) {
    var x = e.it.x || '', lx = norm(x), q = terms[0] || '';
    var i = q ? lx.indexOf(q) : -1;
    if (i < 0) return esc(x.slice(0, 110));
    var s = Math.max(0, i - 40);
    return (s ? '…' : '') + esc(x.slice(s, i)) + '<mark>' + esc(x.slice(i, i + q.length)) + '</mark>' + esc(x.slice(i + q.length, i + q.length + 70));
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  App.esc = esc;
  function run(q, ul) {
    var terms = norm(q).split(/\s+/).filter(Boolean);
    if (!terms.length) { ul.innerHTML = ''; return; }
    loadIndex().then(function (idx) {
      var res = idx.map(function (e) { return { e: e, s: score(e, terms) }; }).filter(function (r) { return r.s > 0; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 12);
      ul.innerHTML = res.length ? res.map(function (r, i) {
        return '<li><a href="' + root + r.e.it.u + '"' + (i === 0 ? ' aria-selected="true"' : '') + ' role="option"><span class="sr-kind">' + esc(r.e.it.k) + '</span><span class="sr-title">' + esc(r.e.it.t) + '</span><span class="sr-snip">' + snippet(r.e, terms) + '</span></a></li>';
      }).join('') : '<li class="search-empty">Nothing matches “' + esc(q) + '”. Try a shorter word, like “eigen” or “bayes”.</li>';
    });
  }
  function openSearch() {
    if (!dlg) return;
    lastFocus = document.activeElement; dlg.hidden = false; input.value = ''; list.innerHTML = ''; input.focus(); loadIndex();
  }
  function closeSearch() { if (dlg && !dlg.hidden) { dlg.hidden = true; if (lastFocus) lastFocus.focus(); } }
  $$('[data-open-search]').forEach(function (b) { b.addEventListener('click', function () { setNav(false); openSearch(); }); });
  $$('[data-close-search]').forEach(function (b) { b.addEventListener('click', closeSearch); });
  if (dlg) dlg.addEventListener('click', function (e) { if (e.target === dlg) closeSearch(); });
  function keyNav(e, ul) {
    var items = $$('a', ul); if (!items.length) return;
    var i = items.findIndex(function (a) { return a.getAttribute('aria-selected') === 'true'; });
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (i >= 0) items[i].removeAttribute('aria-selected');
      i = e.key === 'ArrowDown' ? Math.min(items.length - 1, i + 1) : Math.max(0, i - 1);
      items[i].setAttribute('aria-selected', 'true'); items[i].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && i >= 0) { e.preventDefault(); location.href = items[i].href; }
  }
  if (input) {
    input.addEventListener('input', function () { run(input.value, list); });
    input.addEventListener('keydown', function (e) { keyNav(e, list); });
  }
  var pin = $('#search-page-input'), pl = $('#search-page-results');
  if (pin) {
    var q0 = new URLSearchParams(location.search).get('q') || '';
    pin.value = q0; if (q0) run(q0, pl);
    pin.addEventListener('input', function () { run(pin.value, pl); });
    pin.addEventListener('keydown', function (e) { keyNav(e, pl); });
    pin.focus();
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
      var t = e.target; var tag = t && t.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
      e.preventDefault(); if (pin) pin.focus(); else openSearch();
    }
  });
})();
