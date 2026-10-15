/* 18 kNN: ask your k nearest neighbours; k trades jagged vs over-smooth. */
(function () {
  'use strict';
  var L = window.MMLab, M = L.M;
  var math = {
    data: function () { var r = M.rng(5), X = M.blob(r, 60, -0.8, 0, 1).concat(M.blob(r, 60, 0.8, 0, 1)), y = []; for (var i = 0; i < 120; i++) y.push(i < 60 ? 0 : 1); return { X: X, y: y }; },
    /** fraction of class-1 among the k nearest (optionally excluding index `skip`) */
    vote: function (X, y, q, k, skip) {
      var d = []; for (var i = 0; i < X.length; i++) if (i !== skip) d.push([(X[i][0] - q[0]) * (X[i][0] - q[0]) + (X[i][1] - q[1]) * (X[i][1] - q[1]), y[i]]);
      d.sort(function (a, b) { return a[0] - b[0]; });
      var kk = Math.min(k, d.length), s = 0; for (var j = 0; j < kk; j++) s += d[j][1]; return s / kk;
    },
    accuracy: function (X, y, k, loo) { var ok = 0; for (var i = 0; i < X.length; i++) { var v = math.vote(X, y, X[i], k, loo ? i : -1); if ((v > 0.5 ? 1 : v < 0.5 ? 0 : y[i]) === y[i]) ok++; } return ok / X.length; },
  };
  L.register({
    id: '18_knn_boundary', title: 'kNN: ask your k nearest neighbours', math: math, keywords: 'k nearest neighbours kNN overfitting underfitting decision boundary leave-one-out',
    idea: 'Each spot in the plane takes the majority class of its k nearest training points. Slide k and add points.',
    predict: { q: 'What is the training accuracy of 1-NN (each point is its own nearest neighbour)?', options: ['About 50%', 'About 75%', '100%', 'It depends on k'] },
    notice: [
      'k = 1 scores 100% on the training data by construction, with a jagged boundary full of islands: it memorises noise (high variance).',
      'Leave-one-out accuracy is the honest number: it usually peaks at a moderate k and falls again when k is so large that the vote ignores local structure (high bias).',
      'At k = 119 every location gets the overall majority class: the most underfit model possible.',
      'Add a single mislabelled point and watch a 1-NN island appear around it; at k = 15 it barely matters.',
    ],
    setup: function (ui) {
      var p = ui.canvas({ aspect: 0.72, drag: true, label: 'kNN decision regions over two classes', cap: 'Tap to add a point of the selected class.' });
      ui.legend([{ label: 'class 0', color: 's1', dot: true }, { label: 'class 1', color: 's2', dot: true }]);
      var D = math.data(), cls = 1;
      var k = ui.slider({ label: 'k (neighbours)', min: 1, max: 119, step: 2, value: 15, fmt: function (x) { return String(Math.round(x)); } });
      ui.buttons([1, 15, 51, 99].map(function (v) { return { label: 'k = ' + v, onClick: function () { k.set(v); } }; }));
      ui.group([{ label: 'Add class 1', value: 1 }, { label: 'Add class 0', value: 0 }], 1, function (v) { cls = v; });
      ui.buttons([{ label: 'Reset data', onClick: function () { D = math.data(); } }]);
      var ro = ui.readouts([['n', 'training points'], ['tr', 'training accuracy'], ['loo', 'leave-one-out accuracy']]);
      var vd = ui.verdict();
      p.onPointer({ down: function (pt) { D.X.push([pt[0], pt[1]]); D.y.push(cls); ui.redraw(); } });
      ui.draw = function () {
        var C = p.col, kk = Math.round(k.value), c1 = ui.rgbOf(C.s1), c2 = ui.rgbOf(C.s2), bg = ui.rgbOf(C.bg);
        p.clear().setView(-4, 4, -4, 4, true);
        p.heat(function (x, y) { var v = math.vote(D.X, D.y, [x, y], kk, -1), c = v > 0.5 ? c2 : c1, a = v === 0.5 ? 0 : 0.28; return [bg[0] + (c[0] - bg[0]) * a, bg[1] + (c[1] - bg[1]) * a, bg[2] + (c[2] - bg[2]) * a, 255]; }, 6);
        p.grid({ xstep: 1, ystep: 1 });
        p.clipOn(); D.X.forEach(function (x, i) { p.dot(x[0], x[1], { r: 3.8, color: D.y[i] ? C.s2 : C.s1 }); }); p.clipOff();
        var tr = math.accuracy(D.X, D.y, kk, false), loo = math.accuracy(D.X, D.y, kk, true);
        ro.set('n', String(D.X.length)); ro.set('tr', M.fmt(tr * 100, 1) + '%'); ro.set('loo', M.fmt(loo * 100, 1) + '%');
        vd.set(kk <= 3 ? 'Small k: jagged boundary, memorises noise. Training accuracy flatters it.' : kk >= 81 ? 'Huge k: a lazy majority vote. The boundary washes out.' : 'Moderate k: a smoother boundary that generalises better.', kk <= 3 || kk >= 81 ? 'bad' : 'good');
      };
    },
  });
})();
