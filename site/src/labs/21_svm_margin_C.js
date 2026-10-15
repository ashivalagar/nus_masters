/* 21 Linear SVM: the widest street; C is the tolerance for jaywalkers (Pegasos solver). */
(function () {
  'use strict';
  var L = window.MMLab, M = L.M;
  var math = {
    data: function () { var r = M.rng(7), X = M.blob(r, 40, -1.2, -1.2, 0.9).concat(M.blob(r, 40, 1.2, 1.2, 0.9)), y = []; for (var i = 0; i < 80; i++) y.push(i < 40 ? -1 : 1); return { X: X, y: y }; },
    /**
     * Pegasos (primal sub-gradient) for  min ½‖w‖² + C Σ max(0, 1 − yᵢ(w·xᵢ + b)),
     * i.e. λ = 1/(C n); bias updated without regularisation (scaled step, as in the Python lab);
     * returns the average of the second half of the iterates.
     */
    pegasos: function (X, y, C, iters, seed) {
      var n = X.length, lam = 1 / (C * n), w = [0, 0], b = 0, ws = [0, 0], bs = 0, cnt = 0, r = M.rng(seed || 7);
      iters = iters || 60000;
      for (var t = 1; t <= iters; t++) {
        var i = Math.floor(r() * n), eta = 1 / (lam * (t + 50)), m = y[i] * (X[i][0] * w[0] + X[i][1] * w[1] + b) < 1;
        w[0] *= (1 - eta * lam); w[1] *= (1 - eta * lam);
        if (m) { w[0] += eta * y[i] * X[i][0]; w[1] += eta * y[i] * X[i][1]; b += eta * y[i] * 0.1; }
        if (t > iters / 2) { ws[0] += w[0]; ws[1] += w[1]; bs += b; cnt++; }
      }
      return { w: [ws[0] / cnt, ws[1] / cnt], b: bs / cnt };
    },
    objective: function (X, y, C, w, b) { var h = 0; X.forEach(function (x, i) { h += Math.max(0, 1 - y[i] * (w[0] * x[0] + w[1] * x[1] + b)); }); return 0.5 * (w[0] * w[0] + w[1] * w[1]) + C * h; },
    margin: function (w) { return 2 / Math.hypot(w[0], w[1]); },
    supportVectors: function (X, y, w, b, tol) { tol = tol == null ? 0.05 : tol; var out = []; X.forEach(function (x, i) { if (y[i] * (w[0] * x[0] + w[1] * x[1] + b) <= 1 + tol) out.push(i); }); return out; },
  };
  L.register({
    id: '21_svm_margin_C', title: 'SVM: the widest street, and C', math: math, keywords: 'SVM support vector machine margin hinge loss C regularisation pegasos soft margin',
    idea: 'Find the widest street between the classes. Points on or inside the kerbs are support vectors; C sets how much you charge for them.',
    predict: { q: 'You raise C from 0.05 to 50. What happens to the street?', options: ['It gets wider', 'It gets narrower', 'It stays the same width', 'It rotates 90°'] },
    notice: [
      'Small C: violations are cheap, so the street is wide and many points sit inside it; they are all support vectors. More bias, less variance.',
      'Large C: every violation is expensive, so the street narrows to fit the data tightly. Fewer support vectors, more variance: a single new point can swing the line.',
      'Move a point far from the street and nothing changes: only support vectors (circled) determine w and b. That is why the dual depends only on them.',
      'Assignment 2 tests C ∈ {0.0001, 0.1, 1000}: with 0.0001 the street is so wide almost every point is a support vector.',
    ],
    setup: function (ui) {
      var p = ui.canvas({ aspect: 0.72, drag: true, label: 'Two classes with SVM street and support vectors', cap: 'Tap to add a point of the selected class. Circled points are support vectors.' });
      ui.legend([{ label: 'class −1', color: 's1', dot: true }, { label: 'class +1', color: 's2', dot: true }, { label: 'decision line', color: 'ink' }, { label: 'margins w·x + b = ±1', color: 'ink3', dash: true }]);
      var D = math.data(), cls = 1, fit = null, lastKey = '';
      var C = ui.slider({ label: 'C', min: 0.01, max: 100, value: 1, log: true, fmt: function (x) { return x < 0.1 ? M.fmt(x, 3) : x < 10 ? M.fmt(x, 2) : M.fmt(x, 0); } });
      ui.buttons([0.05, 1, 50].map(function (v) { return { label: 'C = ' + v, onClick: function () { C.set(v); } }; }));
      ui.group([{ label: 'Add class +1', value: 1 }, { label: 'Add class −1', value: -1 }], 1, function (v) { cls = v; });
      ui.buttons([{ label: 'Reset data', onClick: function () { D = math.data(); lastKey = ''; } }]);
      var ro = ui.readouts([['w', 'w, b'], ['m', 'margin width 2/‖w‖'], ['sv', 'support vectors'], ['vio', 'inside or wrong side'], ['obj', 'objective']]);
      var vd = ui.verdict();
      p.onPointer({ down: function (pt) { D.X.push([pt[0], pt[1]]); D.y.push(cls); lastKey = ''; ui.redraw(); } });
      function line(w, b, off) { var pts = []; if (Math.abs(w[1]) > Math.abs(w[0])) pts = [[-6, (off - b - w[0] * -6) / w[1]], [6, (off - b - w[0] * 6) / w[1]]]; else pts = [[(off - b - w[1] * -6) / w[0], -6], [(off - b - w[1] * 6) / w[0], 6]]; return pts; }
      ui.draw = function () {
        var Col = p.col, key = C.value.toFixed(4) + '|' + D.X.length;
        if (key !== lastKey) { fit = math.pegasos(D.X, D.y, C.value, 60000, 7); lastKey = key; }
        var w = fit.w, b = fit.b, sv = math.supportVectors(D.X, D.y, w, b), vio = D.X.filter(function (x, i) { return D.y[i] * (w[0] * x[0] + w[1] * x[1] + b) < 1 - 1e-6; }).length;
        p.clear().setView(-4, 4, -4, 4, true);
        // shade the street
        var st = line(w, b, 1).concat(line(w, b, -1).reverse());
        p.poly(st, { fill: Col.ink3, alpha: 0.1 });
        p.grid({ xstep: 1, ystep: 1 });
        p.clipOn();
        p.line(line(w, b, 0), { color: Col.ink, width: 2.4 });
        p.line(line(w, b, 1), { color: Col.ink3, width: 1.5, dash: [6, 4] }); p.line(line(w, b, -1), { color: Col.ink3, width: 1.5, dash: [6, 4] });
        D.X.forEach(function (x, i) { p.dot(x[0], x[1], { r: 4, color: D.y[i] > 0 ? Col.s2 : Col.s1, halo: sv.indexOf(i) >= 0 ? Col.ink : null }); });
        p.clipOff();
        ro.set('w', '(' + M.fmt(w[0], 2) + ', ' + M.fmt(w[1], 2) + '), ' + M.fmt(b, 2)); ro.set('m', M.fmt(math.margin(w), 2));
        ro.set('sv', String(sv.length)); ro.set('vio', String(vio)); ro.set('obj', M.fmt(math.objective(D.X, D.y, C.value, w, b), 2));
        vd.set(C.value < 0.2 ? 'Small C: a wide street that tolerates many points inside it.' : C.value > 10 ? 'Large C: a narrow street that punishes every violation.' : 'Medium C: a balance between a wide street and few violations.');
      };
    },
  });
})();
