/* Review: Leitner flashcards over every self-test card. */
(function () {
  'use strict';
  var S = window.MMStore, App = window.MMApp, $ = App.$, $$ = App.$$, esc = App.esc;
  var MM = window.MM || { cards: [], concepts: [] };
  var root = $('[data-review]');
  if (!root) return;
  var params = new URLSearchParams(location.search);
  var noteFilter = (params.get('notes') || '').split(',').filter(Boolean);
  var course = 'all', concept = '', dueOnly = true;
  var queue = [], idx = 0, revealed = false, doneCount = 0;
  var bySlug = {}; (MM.concepts || []).forEach(function (c) { bySlug[c.slug] = c; });
  var BOX_LABEL = ['', 'Box 1', 'Box 2', 'Box 3', 'Box 4', 'Box 5'];
  var GAP = ['', 'every session', '1 day', '3 days', '1 week', '2 weeks'];

  var sel = $('[data-concept-select]');
  if (noteFilter.length === 1) { concept = noteFilter[0]; sel.value = concept; noteFilter = []; }
  if (noteFilter.length) {
    var opt = document.createElement('option'); opt.value = '__set'; opt.textContent = 'From your week step (' + noteFilter.length + ' notes)'; sel.insertBefore(opt, sel.options[1]); sel.value = '__set'; concept = '__set';
    dueOnly = false; $('[data-due-only]').checked = false;
  }

  function deck() {
    return (MM.cards || []).filter(function (c) {
      if (course !== 'all' && c.track !== course) return false;
      if (concept === '__set') return noteFilter.indexOf(c.slug) >= 0;
      if (concept && c.slug !== concept) return false;
      return true;
    });
  }
  function st(c) { return S.get('card:' + c.id, null); }
  function build() {
    var now = Date.now(), d = deck();
    var seed = S.today();
    var h = function (s) { var x = 0; for (var i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) | 0; return x; };
    queue = d.filter(function (c) { var s = st(c); return !dueOnly || !s || s.due <= now; })
      .sort(function (a, b) { var sa = st(a), sb = st(b); var ba = sa ? sa.box : 1, bb = sb ? sb.box : 1; return ba - bb || h(seed + a.id) - h(seed + b.id); });
    idx = 0; revealed = false; doneCount = 0;
    paintBoxes(); paintCard();
  }
  function paintBoxes() {
    var counts = [0, 0, 0, 0, 0, 0], d = deck();
    d.forEach(function (c) { var s = st(c); counts[s ? s.box : 1]++; });
    var max = Math.max.apply(null, counts.slice(1)) || 1;
    $('[data-boxes]').innerHTML = counts.slice(1).map(function (n, i) {
      return '<div class="box" title="' + BOX_LABEL[i + 1] + ': comes back ' + GAP[i + 1] + '"><b>' + n + '</b>' + BOX_LABEL[i + 1] + '<div class="box-bar"><span style="width:' + (n / max * 100) + '%"></span></div></div>';
    }).join('');
  }
  function paintCard() {
    var el = $('[data-flash]');
    var c = queue[idx];
    if (!c) {
      var d = deck(), later = d.filter(function (x) { var s = st(x); return s && s.due > Date.now(); }).length;
      el.innerHTML = '<div class="flash-empty">' + (doneCount ? '<p><strong>Session done: ' + doneCount + ' card' + (doneCount > 1 ? 's' : '') + '.</strong></p>' : '') +
        '<p>' + (dueOnly ? 'Nothing due right now' + (later ? '; ' + later + ' card' + (later > 1 ? 's are' : ' is') + ' scheduled for later.' : '.') : 'No cards match this filter.') + '</p>' +
        (dueOnly && d.length ? '<button class="btn btn-quiet" type="button" data-all>Review all ' + d.length + ' anyway</button>' : '') + '</div>';
      var b = $('[data-all]', el); if (b) b.addEventListener('click', function () { dueOnly = false; $('[data-due-only]').checked = false; build(); });
      return;
    }
    var s = st(c), con = bySlug[c.slug];
    el.innerHTML = '<div class="flash-card track-' + c.track + '"><div class="flash-meta"><span>' + (con ? '<a href="' + App.root + con.url + '#self-test">' + esc(con.title) + '</a>' : esc(c.title)) + '</span><span>' + (s ? BOX_LABEL[s.box] + (s.right + s.wrong ? ', ' + s.right + ' of ' + (s.right + s.wrong) + ' right' : '') : 'New card') + '</span></div>' +
      '<div class="flash-q">' + c.q + '</div>' +
      (revealed ? '<div class="flash-a">' + c.a + '</div><div class="flash-actions"><button class="btn btn-quiet" type="button" data-no>Not yet <kbd>1</kbd></button><button class="btn" type="button" data-yes>Knew it <kbd>2</kbd></button></div>'
        : '<div class="flash-actions"><button class="btn" type="button" data-show>Show answer <kbd>Space</kbd></button></div>') +
      '</div><p class="flash-progress">Card ' + (idx + 1) + ' of ' + queue.length + '. Say the answer out loud before you reveal it.</p>';
    var b1 = $('[data-show]', el); if (b1) { b1.addEventListener('click', reveal); }
    var y = $('[data-yes]', el), n = $('[data-no]', el);
    if (y) y.addEventListener('click', function () { answer(true); });
    if (n) n.addEventListener('click', function () { answer(false); });
    var f = $('[data-show], [data-yes]', el); if (f && document.activeElement && root.contains(document.activeElement)) f.focus();
  }
  function reveal() { revealed = true; paintCard(); var y = $('[data-yes]'); if (y) y.focus(); }
  function answer(knew) {
    App.gradeCard(queue[idx].id, knew);
    doneCount++;
    if (!knew && dueOnly) queue.push(queue[idx]); // missed cards come back this session
    idx++; revealed = false; paintBoxes(); paintCard();
  }
  document.addEventListener('keydown', function (e) {
    if (/INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) return;
    if (!queue[idx]) return;
    if (!revealed && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); reveal(); }
    else if (revealed && e.key === '1') answer(false);
    else if (revealed && e.key === '2') answer(true);
  });
  $$('[data-course]').forEach(function (b) {
    b.addEventListener('click', function () {
      course = b.getAttribute('data-course');
      $$('[data-course]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      build();
    });
  });
  sel.addEventListener('change', function () { concept = sel.value; build(); });
  $('[data-due-only]').addEventListener('change', function (e) { dueOnly = e.target.checked; build(); });
  build();
  App.onRefresh(function () { paintBoxes(); });
})();

/* Concepts index: filters + mastery dots */
(function () {
  'use strict';
  var S = window.MMStore, App = window.MMApp, $ = App.$, $$ = App.$$;
  var idx = $('.concepts-index');
  if (!idx) return;
  var current = 'all';
  function paint() {
    $$('[data-mastery-dot]').forEach(function (d) { d.setAttribute('data-m', S.get('mastery:' + d.getAttribute('data-mastery-dot'), 'new')); });
    var shown = 0;
    $$('.concept-item').forEach(function (li) {
      var tags = li.getAttribute('data-tags').split(' '), m = S.get('mastery:' + li.getAttribute('data-slug'), 'new');
      var ok = current === 'all' || (current === 'high-yield' && (tags.indexOf('exam-likely') >= 0 || tags.indexOf('core') >= 0)) || (current === 'upcoming' && tags.indexOf('upcoming') >= 0) || (current === 'not-solid' && m !== 'solid');
      li.hidden = !ok; if (ok) shown++;
    });
    $$('.cgroup').forEach(function (g) { g.hidden = !$$('.concept-item:not([hidden])', g).length; });
    var note = $('[data-filter-note]');
    note.textContent = current === 'high-yield' ? shown + ' high-yield concepts: tagged exam-likely or core in your notes.' : current === 'upcoming' ? shown + ' primers for lectures not given yet. Revisit them after class.' : current === 'not-solid' ? shown + ' concepts not marked solid yet.' : 'High-yield = tagged exam-likely or core in your notes.';
  }
  $$('[data-filter]').forEach(function (b) {
    b.addEventListener('click', function () {
      current = b.getAttribute('data-filter');
      $$('[data-filter]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      try { sessionStorage.setItem('mm:cfilter', current); } catch (e) { /* ignore */ }
      paint();
    });
  });
  try { var saved = sessionStorage.getItem('mm:cfilter'); if (saved) { var btn = $('[data-filter="' + saved + '"]'); if (btn) btn.click(); } } catch (e) { /* ignore */ }
  paint(); App.onRefresh(paint);
})();
