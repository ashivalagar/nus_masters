/* 08 Bayes decision boundary in 1D: priors slide the fence; unequal variances bend it. */
(function () {
  'use strict';
  var L = window.MMLab, M = L.M;
  var math = {
    /** points where P1 N(x|m1,s1) = P2 N(x|m2,s2) */
    boundaries: function (m1, s1, m2, s2, p1) {
      var p2 = 1 - p1;
      // log P1 - log s1 - (x-m1)^2/2s1^2 = log P2 - log s2 - (x-m2)^2/2s2^2  ->  a x^2 + b x + c = 0
      var a = 1 / (2 * s2 * s2) - 1 / (2 * s1 * s1);
      var b = m1 / (s1 * s1) - m2 / (s2 * s2);
      var c = m2 * m2 / (2 * s2 * s2) - m1 * m1 / (2 * s1 * s1) + Math.log(p1 / p2) - Math.log(s1 / s2);
      if (Math.abs(a) < 1e-12) return Math.abs(b) < 1e-12 ? [] : [-c / b];
      var D = b * b - 4 * a * c; if (D < 0) return [];
      var r = Math.sqrt(D); return [(-b - r) / (2 * a), (-b + r) / (2 * a)].sort(function (x, y) { return x - y; });
    },
    /** Bayes error = ∫ min(P1 p1(x), P2 p2(x)) dx (numerical) */
    bayesError: function (m1, s1, m2, s2, p1) {
      var lo = Math.min(m1 - 7 * s1, m2 - 7 * s2), hi = Math.max(m1 + 7 * s1, m2 + 7 * s2), n = 4000, h = (hi - lo) / n, sum = 0;
      for (var i = 0; i <= n; i++) { var x = lo + i * h, v = Math.min(p1 * M.npdf(x, m1, s1), (1 - p1) * M.npdf(x, m2, s2)); sum += (i === 0 || i === n ? 0.5 : 1) * v; }
      return sum * h;
    },
  };
  L.register({
    id: '08_bayes_boundary', title: 'Priors slide the Bayes boundary', math: math, keywords: 'bayes decision boundary prior gaussian classifier discriminant error',
    idea: 'Two classes, two Gaussian hills scaled by their priors. Classify by the taller hill; the boundary is where they cross.',
    predict: { q: 'Class 1 (centred at 0) becomes 4× more common than class 2 (centred at 2). Where does the boundary move?', options: ['Toward class 1 (left of 1)', 'Toward class 2 (right of 1)', 'It stays at 1', 'It disappears'] },
    notice: [
      'With equal σ = 1 and P(ω₁) = 0.8 the boundary moves from 1 to 1 + ½·ln 4 ≈ 1.69: the common class claims more ground, so the fence slides toward the rarer class.',
      'Equal variances give one straight cut (linear discriminant). Make the variances different and the log-ratio becomes quadratic: two crossing points appear, a second region of class 2 far out on the wide side.',
      'The shaded overlap is the Bayes error: the best any classifier can do with these distributions. Priors and spreads change it; no clever model can beat it.',
    ],
    setup: function (ui) {
      var p = ui.canvas({ aspect: 0.55, label: 'Prior-weighted class densities with decision regions' });
      ui.legend([{ label: 'P(ω₁) p(x | ω₁)', color: 's1' }, { label: 'P(ω₂) p(x | ω₂)', color: 's2' }, { label: 'Bayes error', color: 'ink3' }]);
      var p1 = ui.slider({ label: 'prior P(ω₁)', min: 0.05, max: 0.95, step: 0.01, value: 0.5 });
      var m2 = ui.slider({ label: 'mean of class 2', min: 0.5, max: 4, step: 0.05, value: 2 });
      var s1 = ui.slider({ label: 'σ₁', min: 0.4, max: 2.5, step: 0.05, value: 1 });
      var s2 = ui.slider({ label: 'σ₂', min: 0.4, max: 2.5, step: 0.05, value: 1 });
      ui.buttons([{ label: 'Equal priors', onClick: function () { p1.set(0.5); } }, { label: 'P(ω₁) = 0.8', onClick: function () { p1.set(0.8); } }, { label: 'Wide class 2', onClick: function () { s2.set(2.2); } }, { label: 'Reset', onClick: function () { p1.set(0.5, 1); m2.set(2, 1); s1.set(1, 1); s2.set(1, 1); } }]);
      var ro = ui.readouts([['b', 'boundary x'], ['err', 'Bayes error'], ['rule', 'decide ω₁ when']]);
      var vd = ui.verdict();
      ui.draw = function () {
        var C = p.col, P1 = p1.value, a = s1.value, b = s2.value, mu2 = m2.value;
        var f1 = function (x) { return P1 * M.npdf(x, 0, a); }, f2 = function (x) { return (1 - P1) * M.npdf(x, mu2, b); };
        var ymax = Math.max(f1(0), f2(mu2)) * 1.15;
        p.clear().setView(-4, 6, 0, ymax).grid({ xstep: 1, labels: true, fy: function (t) { return M.fmt(t, 2); } });
        var bs = math.boundaries(0, a, mu2, b, P1);
        // decision regions as a thin band at the bottom
        var ctx = p.ctx, band = 8;
        for (var px = p.pad.l; px < p.w - p.pad.r; px += 2) { var x = p.inv(px, 0)[0]; ctx.fillStyle = f1(x) >= f2(x) ? C.s1 : C.s2; ctx.globalAlpha = 0.55; ctx.fillRect(px, p.h - p.pad.b - band, 2, band); }
        ctx.globalAlpha = 1;
        p.area(function (x) { return Math.min(f1(x), f2(x)); }, function () { return 0; }, -4, 6, C.ink3, 0.28);
        p.area(f1, function () { return 0; }, -4, 6, C.s1, 0.08);
        p.area(f2, function () { return 0; }, -4, 6, C.s2, 0.08);
        p.fn(f1, { color: C.s1, width: 2.5 }); p.fn(f2, { color: C.s2, width: 2.5 });
        bs.forEach(function (x) { if (x > -4 && x < 6) { p.vline(x, { color: C.ink, width: 1.5, dash: [5, 4] }); p.text('x = ' + M.fmt(x, 2), x, ymax * 0.93, { align: 'center', color: C.ink }); } });
        var err = math.bayesError(0, a, mu2, b, P1);
        ro.set('b', bs.length ? bs.map(function (x) { return M.fmt(x, 3); }).join(' and ') : 'none: one class wins everywhere');
        ro.set('err', M.fmt(err * 100, 1) + '%');
        ro.set('rule', 'P(ω₁)p(x|ω₁) > P(ω₂)p(x|ω₂)');
        vd.set(bs.length === 2 ? 'Unequal spreads: the boundary is quadratic, so class 2 also wins far out on the wide side.' : Math.abs(P1 - 0.5) < 0.005 ? 'Equal priors and spreads: the boundary sits halfway between the means.' : 'The more common class pushes the fence toward the rarer one.');
      };
    },
  });
})();
