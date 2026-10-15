/* 05 Gradient descent: a hiker in fog; the learning rate is the stride. */
(function () {
  'use strict';
  var L = window.MMLab, M = L.M;
  var math = {
    path1d: function (eta, w0, n) { var w = w0, out = [w]; for (var i = 0; i < n; i++) { w = w - eta * 2 * (w - 3); out.push(w); } return out; },
    factor1d: function (eta) { return 1 - 2 * eta; }, // error multiplies by this each step
    path2d: function (eta, p0, n, q) { var p = p0.slice(), out = [p.slice()]; for (var i = 0; i < n; i++) { p = [p[0] - eta * q[0] * p[0], p[1] - eta * q[1] * p[1]]; out.push(p.slice()); } return out; },
  };
  L.register({
    id: '05_gradient_descent', title: 'Gradient descent: stride length matters', math: math, keywords: 'gradient descent learning rate convergence divergence zig-zag',
    idea: 'Each step moves against the slope by η times the gradient. Too small crawls; too big bounces or explodes.',
    predict: { q: 'On f(w) = (w − 3)², starting at w = 0 with η = 1.05, what happens?', options: ['Converges smoothly to 3', 'Crawls slowly toward 3', 'Bounces across 3 and settles', 'Bounces further out each step and diverges'] },
    notice: [
      'For f(w) = (w − 3)² the error (w − 3) is multiplied by (1 − 2η) every step. |1 − 2η| < 1 converges; η = 0.5 lands in one step; η > 1 makes |1 − 2η| > 1, so it diverges.',
      'Between η = 0.5 and 1 the factor is negative: the hiker overshoots and ping-pongs across the valley floor, but still converges.',
      'In the narrow valley the steep direction (curvature 15) limits η: above 2/15 ≈ 0.133 it diverges, even though the shallow direction would love a bigger step. That is why badly scaled features slow training.',
    ],
    setup: function (ui) {
      ui.columns(2);
      var p = ui.canvas({ aspect: 0.8, label: 'Gradient descent steps on a parabola', cap: 'f(w) = (w − 3)², start at w = 0, 12 steps' });
      var q = ui.canvas({ aspect: 0.8, label: 'Gradient descent in a narrow valley', cap: 'f = ½(x² + 15y²), start at (−3.5, 1.5), 40 steps' });
      var eta = ui.slider({ label: 'η for the parabola', min: 0.01, max: 1.2, step: 0.01, value: 0.4 });
      ui.buttons([0.05, 0.4, 0.95, 1.05].map(function (v) { return { label: 'η = ' + v, onClick: function () { eta.set(v); } }; }));
      var eta2 = ui.slider({ label: 'η for the valley', min: 0.005, max: 0.16, step: 0.001, value: 0.02, fmt: function (x) { return M.fmt(x, 3); } });
      ui.buttons([0.02, 0.12, 0.14].map(function (v) { return { label: 'η = ' + v, onClick: function () { eta2.set(v); } }; }));
      var ro = ui.readouts([['f', 'parabola: factor 1 − 2η'], ['w', 'w after 12 steps'], ['g', 'valley: steep factor 1 − 15η'], ['d', 'distance after 40 steps']]);
      var vd = ui.verdict();
      ui.draw = function () {
        var C = p.col, e = eta.value;
        p.clear().setView(-1.2, 7.2, -1, 25).grid({ xstep: 1, ystep: 5, xlabel: 'w' });
        p.fn(function (w) { return (w - 3) * (w - 3); }, { color: C.ink3, width: 1.5 });
        var path = math.path1d(e, 0, 12);
        p.clipOn();
        p.line(path.map(function (w) { return [w, (w - 3) * (w - 3)]; }), { color: C.s2, width: 1.8 });
        path.forEach(function (w, i) { p.dot(w, (w - 3) * (w - 3), { r: i === 0 ? 5 : 3.6, color: i === 0 ? C.ink : C.s2 }); });
        p.clipOff();
        var e2 = eta2.value, Q = [1, 15];
        q.clear().setView(-4, 4, -2, 2, true).grid({ xstep: 1, ystep: 1 });
        q.clipOn();
        [0.5, 1.5, 3, 5, 8, 12, 17, 23].forEach(function (lev) {
          var pts = []; for (var i = 0; i <= 80; i++) { var t = i / 80 * 2 * Math.PI; pts.push([Math.sqrt(2 * lev) * Math.cos(t), Math.sqrt(2 * lev / 15) * Math.sin(t)]); }
          q.line(pts, { color: C.rule2, width: 1 });
        });
        var path2 = math.path2d(e2, [-3.5, 1.5], 40, Q);
        q.line(path2, { color: C.s1, width: 1.8 });
        path2.forEach(function (pt, i) { if (Math.abs(pt[0]) < 50 && Math.abs(pt[1]) < 50) q.dot(pt[0], pt[1], { r: i === 0 ? 4.5 : 2.6, color: i === 0 ? C.ink : C.s1, ring: false }); });
        q.dot(0, 0, { r: 4, color: C.good });
        q.clipOff();
        var fac = math.factor1d(e), wl = path[path.length - 1], last = path2[path2.length - 1], dist = Math.hypot(last[0], last[1]);
        ro.set('f', M.fmt(fac, 2)); ro.set('w', isFinite(wl) && Math.abs(wl) < 1e6 ? M.fmt(wl, 3) : 'blew up');
        ro.set('g', M.fmt(1 - 15 * e2, 3)); ro.set('d', dist < 1e6 ? M.fmt(dist, 3) : 'blew up');
        var msg = Math.abs(fac) > 1 ? 'Parabola: |1 − 2η| > 1, every step overshoots further. Diverges.' : fac < 0 ? 'Parabola: ping-pongs across the minimum but converges.' : Math.abs(fac) < 0.05 ? 'Parabola: lands on the minimum almost in one step.' : fac > 0.85 ? 'Parabola: converges, but crawls.' : 'Parabola: converges smoothly.';
        msg += Math.abs(1 - 15 * e2) > 1 ? ' Valley: η > 2/15, it explodes across the steep walls.' : (1 - 15 * e2) < 0 ? ' Valley: zig-zags across the narrow direction.' : ' Valley: no zig-zag, but slow along the flat floor.';
        vd.set(msg, Math.abs(fac) > 1 || Math.abs(1 - 15 * e2) > 1 ? 'bad' : 'good');
      };
    },
  });
})();
