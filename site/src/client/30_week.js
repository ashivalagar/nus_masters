/* Learning path: step completion, progress rings, "next step". Shared helpers for home + path pages. */
(function () {
  'use strict';
  var S = window.MMStore, App = window.MMApp, $ = App.$, $$ = App.$$;
  var MM = window.MM || { weeks: [] };

  App.isStepDone = function (id) { return !!S.get('step:' + id, 0); };
  App.setStep = function (id, done) {
    S.set('step:' + id, done ? Date.now() : 0);
    if (done) { S.event('step_done', id); S.markStudied(); }
  };
  App.sessionProgress = function (s) { var d = s.steps.filter(function (st) { return App.isStepDone(st.id); }).length; return { done: d, total: s.steps.length }; };
  App.weekProgress = function (w) {
    var d = 0, t = 0; w.sessions.forEach(function (s) { var p = App.sessionProgress(s); d += p.done; t += p.total; });
    return { done: d, total: t };
  };
  App.allProgress = function () { var d = 0, t = 0; MM.weeks.forEach(function (w) { var p = App.weekProgress(w); d += p.done; t += p.total; }); return { done: d, total: t }; };
  App.ring = function (svg, done, total) {
    if (!svg) return;
    var c = svg.querySelector('.ring-fill'), txt = svg.querySelector('.ring-text');
    var len = parseFloat(c.getAttribute('stroke-dasharray'));
    var f = total ? done / total : 0;
    c.style.strokeDashoffset = String(len * (1 - f));
    txt.textContent = Math.round(f * 100) + '%';
    if (total && done === total) svg.setAttribute('data-complete', ''); else svg.removeAttribute('data-complete');
  };
  App.paintRings = function () {
    MM.weeks.forEach(function (w) {
      var p = App.weekProgress(w);
      $$('[data-ring="w:' + w.id + '"]').forEach(function (r) { App.ring(r, p.done, p.total); });
      w.sessions.forEach(function (s) { var q = App.sessionProgress(s); $$('[data-ring="s:' + s.id + '"]').forEach(function (r) { App.ring(r, q.done, q.total); }); });
    });
  };
  App.paintRings(); App.onRefresh(App.paintRings);

  var week = $('[data-week]');
  if (!week) return;
  var steps = $$('.step', week);

  function paint() {
    var nextSet = false;
    steps.forEach(function (li) {
      var id = li.getAttribute('data-step');
      var box = $('.step-box', li);
      var done = App.isStepDone(id);
      box.checked = done;
      li.classList.toggle('is-done', done);
      li.classList.remove('is-next');
      $$('[data-check]', li).forEach(function (c) { c.checked = !!S.get('check:' + c.getAttribute('data-check'), 0); });
    });
    // "next" = first undone step in today's session if there is one, otherwise first undone overall
    var today = S.today();
    var todays = $('.session[data-date="' + today + '"]', week);
    $$('.session', week).forEach(function (s) { s.classList.toggle('is-today', s === todays); });
    var pool = todays ? $$('.step', todays).concat(steps) : steps;
    for (var i = 0; i < pool.length; i++) if (!pool[i].classList.contains('is-done')) { pool[i].classList.add('is-next'); nextSet = pool[i]; break; }
    var label = $('[data-next-label]'), btn = $('[data-next-step]');
    if (nextSet) {
      var meta = findStep(nextSet.getAttribute('data-step'));
      label.textContent = meta ? meta.label : '';
      btn.disabled = false; btn.textContent = 'Next step';
    } else {
      label.textContent = 'Every step in this week is done. Nicely finished.';
      btn.textContent = 'Open the learning path'; btn.disabled = false;
    }
    App.paintRings();
    paintMastery();
  }
  function findStep(id) {
    for (var i = 0; i < MM.weeks.length; i++) for (var j = 0; j < MM.weeks[i].sessions.length; j++) {
      var s = MM.weeks[i].sessions[j];
      for (var k = 0; k < s.steps.length; k++) if (s.steps[k].id === id) return s.steps[k];
    }
    return null;
  }
  function paintMastery() {
    $$('[data-mastery-of]', week).forEach(function (el) {
      var m = S.get('mastery:' + el.getAttribute('data-mastery-of'), 'new');
      el.setAttribute('data-m', m);
      el.textContent = m === 'solid' ? 'Solid' : m === 'learning' ? 'Learning' : '';
    });
  }

  steps.forEach(function (li) {
    var id = li.getAttribute('data-step');
    $('.step-box', li).addEventListener('change', function (e) { App.setStep(id, e.target.checked); paint(); });
    // checkpoint items: step completes when all are ticked
    var checks = $$('[data-check]', li);
    checks.forEach(function (c) {
      c.addEventListener('change', function () {
        S.set('check:' + c.getAttribute('data-check'), c.checked ? Date.now() : 0);
        var all = checks.every(function (x) { return x.checked; });
        if (all !== App.isStepDone(id)) App.setStep(id, all);
        paint();
      });
    });
    // predictions and teach-backs complete their step when saved
    li.addEventListener('mm-predicted', function () { if (!App.isStepDone(id)) { App.setStep(id, true); paint(); } });
    var ta = $('[data-teach] textarea', li);
    if (ta) ta.addEventListener('input', App.debounce(function () { if (ta.value.trim().length > 80 && !App.isStepDone(id)) { App.setStep(id, true); paint(); } }, 900));
    // following a step link counts as starting it (not finishing)
    $$('.step-title a', li).forEach(function (a) { a.addEventListener('click', function () { S.set('resume', { week: week.getAttribute('data-week'), step: id, t: Date.now() }); }); });
  });

  $('[data-next-step]').addEventListener('click', function () {
    var n = $('.step.is-next', week);
    if (!n) { location.href = App.root + 'path.html'; return; }
    n.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    var f = $('.step-title a, textarea, .step-box', n); if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 350);
  });
  paint(); App.onRefresh(paint);
  // deep link to today's session
  if (!location.hash) { var t = $('.session.is-today', week); if (t && t !== $('.session', week)) t.scrollIntoView(); }
})();
