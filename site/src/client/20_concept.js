/* Concept pages: learning ladder (persisted rungs), mastery state, scroll position on the ladder. */
(function () {
  'use strict';
  var S = window.MMStore, App = window.MMApp, $ = App.$, $$ = App.$$;
  var ladder = $('[data-ladder]');
  if (!ladder) return;
  var slug = ladder.getAttribute('data-ladder');
  var KEY = 'ladder:' + slug;

  function load() {
    var st = S.get(KEY, {});
    $$('[data-rung-box]', ladder).forEach(function (b) { b.checked = !!st[b.getAttribute('data-rung-box')]; });
    var m = S.get('mastery:' + slug, 'new');
    $$('[data-mastery-input]').forEach(function (r) { r.checked = r.value === m; });
  }
  load(); App.onRefresh(load);

  $$('[data-rung-box]', ladder).forEach(function (b) {
    b.addEventListener('change', function () {
      var st = S.get(KEY, {});
      st[b.getAttribute('data-rung-box')] = b.checked ? Date.now() : 0;
      S.set(KEY, st);
      if (b.checked) { S.markStudied(); S.event('rung_done', slug, { rung: b.getAttribute('data-rung-box') }); }
      // nudge mastery from new -> learning on first progress
      var m = S.get('mastery:' + slug, 'new');
      if (b.checked && m === 'new') { S.set('mastery:' + slug, 'learning'); load(); }
    });
  });
  $$('[data-mastery-input]').forEach(function (r) {
    r.addEventListener('change', function () {
      if (!r.checked) return;
      S.set('mastery:' + slug, r.value);
      S.event('mastery', slug, { state: r.value });
      S.markStudied();
      $$('[data-mastery-slug="' + slug + '"]').forEach(function (a) { a.setAttribute('data-m', r.value); });
    });
  });

  // auto-tick rungs from real actions
  function tick(k) {
    var st = S.get(KEY, {});
    if (st[k]) return;
    st[k] = Date.now(); S.set(KEY, st); load();
    if (S.get('mastery:' + slug, 'new') === 'new') { S.set('mastery:' + slug, 'learning'); load(); }
  }
  document.addEventListener('mm-lab-predicted', function () { tick('play'); });
  var tb = $('#teach-back textarea');
  if (tb) tb.addEventListener('input', App.debounce(function () { if (tb.value.trim().length > 60) tick('teach'); }, 800));
  $$('#self-test ~ .selftest [data-grade], .selftest [data-grade]').forEach(function (g) {
    g.addEventListener('click', function () {
      var cards = $$('.concept .selftest .st-card[data-card]');
      var answered = cards.filter(function (c) { return c.hasAttribute('data-known'); }).length;
      if (cards.length && answered === cards.length) tick('selftest');
    });
  });

  // highlight the rung for the section in view
  var rungs = $$('.rung', ladder);
  var targets = rungs.map(function (r) { var a = $('a', r); var h = a && a.getAttribute('href'); return h && h.length > 1 ? document.getElementById(h.slice(1)) : null; });
  function spy() {
    var y = window.innerHeight * 0.3, best = -1;
    targets.forEach(function (t, i) { if (t && t.getBoundingClientRect().top < y) best = i; });
    rungs.forEach(function (r, i) { r.classList.toggle('is-here', i === best); });
    if (best >= 0 && window.innerWidth <= 1180) {
      var ol = $('ol', ladder), r = rungs[best];
      if (ol && r && (r.offsetLeft < ol.scrollLeft || r.offsetLeft + r.offsetWidth > ol.scrollLeft + ol.clientWidth)) ol.scrollLeft = r.offsetLeft - 20;
    }
  }
  var raf = 0;
  window.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(function () { raf = 0; spy(); }); }, { passive: true });
  spy();
  S.event('concept_open', slug);
})();
