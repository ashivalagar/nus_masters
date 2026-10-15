/* 13 Observer: predict with the model, correct with the measurement. */
(function () {
  'use strict';
  var L = window.MMLab, M = L.M;
  var A = [[0, 1], [-1, -0.2]];
  var math = {
    A: A,
    /** L that puts both eigenvalues of A − LC at −a (C = [1 0]): s² + (0.2 + l1)s + (0.2 l1 + 1 + l2) = (s + a)² */
    gains: function (a) { var l1 = 2 * a - 0.2, l2 = a * a - 1 - 0.2 * l1; return [l1, l2]; },
    errEig: function (Lg) { return M.eig2(-Lg[0], 1, -1 - Lg[1], -0.2); },
    /** Euler simulation as in the Python lab; optional measurement noise (seeded) */
    sim: function (a, noise, T, seed) {
      var Lg = math.gains(a), dt = 0.01, x = [1, 0], xh = [-1, 1.5], out = [], rnd = M.rng(seed || 3);
      for (var t = 0; t < (T || 15); t += dt) {
        var y = x[0] + (noise ? noise * M.randn(rnd) : 0);
        out.push([t, x[0], xh[0], Math.hypot(x[0] - xh[0], x[1] - xh[1])]);
        var ax = M.mv2(A, x), axh = M.mv2(A, xh), innov = y - xh[0];
        x = [x[0] + dt * ax[0], x[1] + dt * ax[1]];
        xh = [xh[0] + dt * (axh[0] + Lg[0] * innov), xh[1] + dt * (axh[1] + Lg[1] * innov)];
      }
      return out;
    },
  };
  L.register({
    id: '13_observer_predict_correct', title: 'An observer chases the truth', math: math, keywords: 'observer luenberger state estimation L gain error dynamics separation principle noise',
    idea: 'Only position is measured. The observer runs the model and nudges its estimate by L times the measurement mismatch.',
    predict: { q: 'You move the observer poles from −0.5 to −3. What changes?', options: ['Estimate converges faster; noise jitters it more', 'Estimate converges faster with no downside', 'Estimate converges slower', 'Nothing: L does not matter'] },
    notice: [
      'The estimation error obeys ė = (A − LC)e, so its decay rate is exactly the observer pole you choose. At −3 the error shrinks like e^{−3t}: the log plot is a straight, steep line.',
      'With the slow observer (−0.5) the estimate lags the truth for many seconds; a controller using it would steer by stale information.',
      'Add measurement noise: the fast observer trusts the sensor more (big L) and passes the noise straight into the estimate. The rule of thumb is 2–5× faster than the controller, not infinitely fast.',
      'Separation principle: the controller poles (A − BK) and observer poles (A − LC) can be designed independently; the combined system has both sets.',
    ],
    setup: function (ui) {
      ui.columns(2);
      var p = ui.canvas({ aspect: 0.75, label: 'True position and its estimate', cap: 'Position: truth vs estimate (slow observer stays faint)' });
      var q = ui.canvas({ aspect: 0.75, label: 'Estimation error on a log scale', cap: 'Error ‖x − x̂‖ (log scale)' });
      ui.legend([{ label: 'truth', color: 'ink', dash: true }, { label: 'your observer', color: 's1' }, { label: 'slow observer (−0.5)', color: 's2' }]);
      var a = ui.slider({ label: 'observer poles at', min: 0.3, max: 6, step: 0.1, value: 3, fmt: function (x) { return '−' + M.fmt(x, 1) + ' (double)'; } });
      var noise = ui.slider({ label: 'measurement noise', min: 0, max: 0.3, step: 0.01, value: 0 });
      var ro = ui.readouts([['L', 'L = (l₁, l₂)'], ['eig', 'eig(A − LC)'], ['t', 'error < 1% after'], ['jit', 'estimate jitter']]);
      var vd = ui.verdict();
      ui.draw = function () {
        var C = p.col, s = math.sim(a.value, noise.value), slow = math.sim(0.5, noise.value);
        p.clear().setView(0, 15, -1.5, 1.6).grid({ xstep: 2.5, ystep: 0.5, xlabel: 't' });
        p.clipOn();
        p.line(slow.map(function (o) { return [o[0], o[2]]; }), { color: C.s2, width: 1.6, alpha: 0.7 });
        p.line(s.map(function (o) { return [o[0], o[2]]; }), { color: C.s1, width: 2.2 });
        p.line(s.map(function (o) { return [o[0], o[1]]; }), { color: C.ink, width: 2, dash: [6, 4] });
        p.clipOff();
        q.clear().setView(0, 15, -8, 1).grid({ xstep: 2.5, ystep: 1, fy: function (v) { return '1e' + Math.round(v); }, xlabel: 't' });
        q.clipOn();
        q.line(slow.map(function (o) { return [o[0], Math.log10(Math.max(1e-9, o[3]))]; }), { color: C.s2, width: 1.6, alpha: 0.7 });
        q.line(s.map(function (o) { return [o[0], Math.log10(Math.max(1e-9, o[3]))]; }), { color: C.s1, width: 2.2 });
        q.clipOff();
        var Lg = math.gains(a.value), e = math.errEig(Lg), e0 = s[0][3], tHit = null;
        for (var i = 0; i < s.length; i++) if (s[i][3] < 0.01 * e0) { tHit = s[i][0]; break; }
        var tail = s.filter(function (o) { return o[0] > 10; }), jit = Math.sqrt(tail.reduce(function (acc, o) { return acc + (o[1] - o[2]) * (o[1] - o[2]); }, 0) / tail.length);
        ro.set('L', '(' + M.fmt(Lg[0], 2) + ', ' + M.fmt(Lg[1], 2) + ')');
        ro.set('eig', e.real ? M.fmt(e.l1, 2) + ', ' + M.fmt(e.l2, 2) : M.fmt(e.re, 2) + ' ± ' + M.fmt(e.im, 2) + 'j');
        ro.set('t', tHit == null ? 'not within 15 s' : M.fmt(tHit, 1) + ' s'); ro.set('jit', M.fmt(jit, 3));
        vd.set(noise.value > 0.05 && a.value > 3 ? 'Fast observer + noisy sensor: quick to converge, but the estimate jitters.' : a.value < 1 ? 'Slow observer: the estimate lags the truth for a long time.' : 'Error decays like e^{−' + M.fmt(a.value, 1) + 't}: you chose that rate with L.', a.value < 1 || (noise.value > 0.05 && a.value > 3) ? 'bad' : 'good');
      };
    },
  });
})();
