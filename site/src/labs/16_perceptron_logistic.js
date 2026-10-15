/* 16 Perceptron and logistic regression: nudge the fence vs a soft fence. */
(function () {
  'use strict';
  var L = window.MMLab, M = L.M;
  var math = {
    data: function () { var r = M.rng(3), X = M.blob(r, 40, -1.5, -1, 0.8).concat(M.blob(r, 40, 1.5, 1, 0.8)), y = []; for (var i = 0; i < 80; i++) y.push(i < 40 ? -1 : 1); return { X: X, y: y }; },
    /** one perceptron epoch over `order`; returns number of updates */
    epoch: function (w, X, y, order) { var upd = 0; order.forEach(function (i) { var x = X[i]; if (y[i] * (w[0] * x[0] + w[1] * x[1] + w[2]) <= 0) { w[0] += y[i] * x[0]; w[1] += y[i] * x[1]; w[2] += y[i]; upd++; } }); return upd; },
    errors: function (w, X, y) { var e = 0; X.forEach(function (x, i) { if (y[i] * (w[0] * x[0] + w[1] * x[1] + w[2]) <= 0) e++; }); return e; },
    /** batch gradient descent on mean cross-entropy, labels mapped to {0,1} */
    logistic: function (X, y, iters, lr) {
      var w = [0, 0, 0], n = X.length;
      for (var k = 0; k < iters; k++) {
        var g = [0, 0, 0];
        for (var i = 0; i < n; i++) { var p = M.sigmoid(w[0] * X[i][0] + w[1] * X[i][1] + w[2]), t = (y[i] + 1) / 2, d = p - t; g[0] += d * X[i][0]; g[1] += d * X[i][1]; g[2] += d; }
        w = [w[0] - lr * g[0] / n, w[1] - lr * g[1] / n, w[2] - lr * g[2] / n];
      }
      return w;
    },
    loss: function (w, X, y) { var s = 0; X.forEach(function (x, i) { var p = M.sigmoid(w[0] * x[0] + w[1] * x[1] + w[2]), t = (y[i] + 1) / 2; s -= t * Math.log(p + 1e-12) + (1 - t) * Math.log(1 - p + 1e-12); }); return s / X.length; },
  };
  L.register({
    id: '16_perceptron_logistic', title: 'Perceptron and logistic regression', math: math, keywords: 'perceptron logistic regression sigmoid cross-entropy linear classifier decision boundary',
    idea: 'The perceptron nudges its line whenever a point is on the wrong side. Logistic regression fits a soft fence: probability fades across the line.',
    predict: { q: 'Add one blue point deep inside the orange cloud. What does the perceptron do?', options: ['Ignores it', 'Keeps updating forever, never settling', 'Moves the line once and stops', 'Deletes the point'] },
    notice: [
      'On separable data the perceptron stops as soon as every point is on the right side: any separating line will do, so the final line depends on the visiting order.',
      'Make the data non-separable (one point on the wrong side) and the perceptron never stops updating: the convergence theorem only holds for separable data.',
      'Logistic regression always converges to one answer: it minimises cross-entropy, so points near the line matter and confident correct points matter little. The shading is P(orange | x) = σ(wᵀx + b).',
      'On perfectly separable data logistic weights keep growing (the fence gets sharper and sharper); regularisation or early stopping keeps them finite.',
    ],
    setup: function (ui) {
      var p = ui.canvas({ aspect: 0.72, drag: true, label: 'Two classes with perceptron and logistic boundaries', cap: 'Tap to add a point of the selected class.' });
      ui.legend([{ label: 'class −1', color: 's1', dot: true }, { label: 'class +1', color: 's2', dot: true }, { label: 'perceptron line', color: 'ink' }, { label: 'logistic p = 0.5', color: 'ink3', dash: true }]);
      var D = math.data(), w = [0, 0, 0], wl = null, epochs = 0, lastUpd = null, cls = 1, ptr = 0;
      var order = function () { var r = M.rng(100 + epochs), o = D.X.map(function (_, i) { return i; }); for (var i = o.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = o[i]; o[i] = o[j]; o[j] = t; } return o; };
      ui.group([{ label: 'Add class +1', value: 1 }, { label: 'Add class −1', value: -1 }], 1, function (v) { cls = v; });
      ui.buttons([
        { label: 'Perceptron: 1 epoch', primary: true, onClick: function () { lastUpd = math.epoch(w, D.X, D.y, order()); epochs++; } },
        { label: 'Step 1 point', onClick: function () { var i = ptr % D.X.length; math.epoch(w, D.X, D.y, [i]); ptr++; } },
        { label: 'Fit logistic', primary: true, onClick: function () { wl = math.logistic(D.X, D.y, 1500, 0.5); } },
      ]);
      ui.buttons([{ label: 'Reset weights', onClick: function () { w = [0, 0, 0]; wl = null; epochs = 0; lastUpd = null; ptr = 0; } }, { label: 'Reset data', onClick: function () { D = math.data(); w = [0, 0, 0]; wl = null; epochs = 0; lastUpd = null; } }]);
      var ro = ui.readouts([['ep', 'perceptron epochs'], ['upd', 'updates in last epoch'], ['err', 'perceptron errors'], ['ll', 'logistic loss'], ['lacc', 'logistic errors']]);
      var vd = ui.verdict();
      p.onPointer({ down: function (pt) { D.X.push([pt[0], pt[1]]); D.y.push(cls); if (wl) wl = math.logistic(D.X, D.y, 1500, 0.5); ui.redraw(); } });
      function boundary(wv, opt) { if (Math.abs(wv[1]) < 1e-9 && Math.abs(wv[0]) < 1e-9) return; var pts = []; if (Math.abs(wv[1]) > Math.abs(wv[0])) { pts = [[-5, -(wv[0] * -5 + wv[2]) / wv[1]], [5, -(wv[0] * 5 + wv[2]) / wv[1]]]; } else { pts = [[-(wv[1] * -5 + wv[2]) / wv[0], -5], [-(wv[1] * 5 + wv[2]) / wv[0], 5]]; } p.line(pts, opt); }
      ui.draw = function () {
        var C = p.col;
        p.clear().setView(-4, 4, -4, 4, true);
        if (wl) { var c1 = ui.rgbOf(C.s1), c2 = ui.rgbOf(C.s2), bg = ui.rgbOf(C.bg.length === 7 ? C.bg : '#ffffff');
          p.heat(function (x, y) { var pr = M.sigmoid(wl[0] * x + wl[1] * y + wl[2]), c = pr > 0.5 ? c2 : c1, a = Math.abs(pr - 0.5) * 2 * 0.35; return [bg[0] + (c[0] - bg[0]) * a, bg[1] + (c[1] - bg[1]) * a, bg[2] + (c[2] - bg[2]) * a, 255]; }, 5); }
        p.grid({ xstep: 1, ystep: 1, labels: true });
        p.clipOn();
        D.X.forEach(function (x, i) { var wrong = epochs > 0 && D.y[i] * (w[0] * x[0] + w[1] * x[1] + w[2]) <= 0; p.dot(x[0], x[1], { r: 4.2, color: D.y[i] > 0 ? C.s2 : C.s1, halo: wrong ? C.ink : null }); });
        if (wl) boundary(wl, { color: C.ink3, width: 2, dash: [6, 4] });
        boundary(w, { color: C.ink, width: 2.4 });
        p.clipOff();
        var err = math.errors(w, D.X, D.y);
        ro.set('ep', String(epochs)); ro.set('upd', lastUpd == null ? '—' : String(lastUpd)); ro.set('err', String(err));
        ro.set('ll', wl ? M.fmt(math.loss(wl, D.X, D.y), 3) : 'not fitted'); ro.set('lacc', wl ? String(math.errors(wl, D.X, D.y)) : '—');
        vd.set(epochs === 0 ? 'Run an epoch: the line starts at w = 0 and moves only on mistakes.' : lastUpd === 0 ? 'Converged: a whole epoch with no mistakes.' : 'Still updating: ' + lastUpd + ' mistakes last epoch.', lastUpd === 0 ? 'good' : null);
      };
    },
  });
})();
