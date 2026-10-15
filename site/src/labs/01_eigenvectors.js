/* 01 Eigenvectors: directions a matrix only stretches, never turns. */
(function () {
  'use strict';
  var L = window.MMLab, M = L.M;
  var math = {
    eig: M.eig2,
    /** signed angle (deg) from v to Av */
    turn: function (A, v) { var w = M.mv2(A, v); var a = Math.atan2(v[0] * w[1] - v[1] * w[0], v[0] * w[0] + v[1] * w[1]); return a * 180 / Math.PI; },
  };
  L.register({
    id: '01_eigenvectors', title: 'Eigenvectors stay on their own line', math: math, keywords: 'eigenvalue eigenvector Av = lambda v diagonalization',
    idea: 'Spin a test vector v and watch where A sends it. Most directions get turned; eigenvectors only get stretched.',
    predict: { q: 'For A = [[1, 2], [2, 1]], which direction does A only stretch, never turn?', options: ['Along the x-axis', 'Along the diagonal (1, 1)', 'No direction: every vector turns', 'Every direction'] },
    notice: [
      'Along (1, 1) the arrow Av lands on the same line, three times longer: λ = 3. Along (1, −1) it flips to the opposite side: λ = −1. A negative eigenvalue reverses direction but still stays on the line.',
      'For a symmetric matrix the two eigenvectors are perpendicular: they are the long and short axes of the ellipse that the unit circle becomes.',
      'Pick the rotation preset: no real direction survives, so the eigenvalues become a complex pair a ± bi (rotation mixed with stretching).',
      'In every preset, trace = λ₁ + λ₂ and det = λ₁·λ₂. Check it in the readouts: it is the fastest exam sanity check.',
    ],
    setup: function (ui) {
      var p = ui.canvas({ aspect: 0.8, drag: true, maxH: 520, label: 'Unit circle, its image under A, test vector and eigen-directions', cap: 'Drag anywhere to aim the test vector v.' });
      ui.legend([{ label: 'v (test vector)', color: 'ink' }, { label: 'Av', color: 's2' }, { label: 'A × unit circle', color: 's1' }, { label: 'eigen-directions', color: 's3', dash: true }]);
      var a = ui.slider({ label: 'a (row 1, col 1)', min: -3, max: 3, step: 0.1, value: 1, fmt: f1 });
      var b = ui.slider({ label: 'b (row 1, col 2)', min: -3, max: 3, step: 0.1, value: 2, fmt: f1 });
      var c = ui.slider({ label: 'c (row 2, col 1)', min: -3, max: 3, step: 0.1, value: 2, fmt: f1 });
      var d = ui.slider({ label: 'd (row 2, col 2)', min: -3, max: 3, step: 0.1, value: 1, fmt: f1 });
      var th = ui.slider({ label: 'angle of v', min: 0, max: 360, step: 1, value: 20, fmt: function (x) { return Math.round(x) + '°'; } });
      function f1(x) { return M.fmt(x, 1); }
      var presets = [['Symmetric', [1, 2, 2, 1]], ['Shear', [1, 1, 0, 1]], ['Rotate + stretch', [1, -2, 2, 1]], ['A from a control system', [0, 1, -2, -3]], ['Diagonal', [2, 0, 0, 0.5]]];
      ui.buttons(presets.map(function (pr) { return { label: pr[0], onClick: function () { a.set(pr[1][0], 1); b.set(pr[1][1], 1); c.set(pr[1][2], 1); d.set(pr[1][3], 1); } }; }));
      ui.buttons([{ label: 'Snap v to an eigenvector', onClick: function () {
        var e = math.eig(a.value, b.value, c.value, d.value); if (!e.real) return;
        var cur = th.value, cands = [e.v1, e.v2, [-e.v1[0], -e.v1[1]], [-e.v2[0], -e.v2[1]]].map(function (v) { return (Math.atan2(v[1], v[0]) * 180 / Math.PI + 360) % 360; });
        cands.sort(function (x, y) { return Math.abs(x - cur) - Math.abs(y - cur); });
        th.set(Math.round(cands[0]) % 360);
      } }]);
      var ro = ui.readouts([['l', 'eigenvalues'], ['tr', 'trace'], ['det', 'det'], ['turn', 'A turns v by'], ['gain', '|Av| / |v|']]);
      var vd = ui.verdict();
      p.onPointer({ down: aim, move: aim });
      function aim(pt) { var ang = (Math.atan2(pt[1], pt[0]) * 180 / Math.PI + 360) % 360; th.set(Math.round(ang)); }

      ui.draw = function () {
        var A = [[a.value, b.value], [c.value, d.value]], C = p.col;
        p.clear().setView(-4, 4, -4, 4, true).grid({ xstep: 1, ystep: 1 });
        p.clipOn();
        var e = math.eig(a.value, b.value, c.value, d.value);
        if (e.real) [e.v1, e.v2].forEach(function (v) { p.line([[-9 * v[0], -9 * v[1]], [9 * v[0], 9 * v[1]]], { color: C.s3, width: 1.5, dash: [6, 5] }); });
        var circ = [], ell = [];
        for (var i = 0; i <= 120; i++) { var t = i / 120 * 2 * Math.PI, u = [Math.cos(t), Math.sin(t)]; circ.push(u); ell.push(M.mv2(A, u)); }
        p.line(circ, { color: C.ink3, width: 1.2, dash: [3, 4] });
        p.line(ell, { color: C.s1, width: 2 });
        var r = th.value * Math.PI / 180, v = [Math.cos(r), Math.sin(r)], Av = M.mv2(A, v);
        p.arrow(0, 0, Av[0], Av[1], { color: C.s2, width: 3 });
        p.arrow(0, 0, v[0], v[1], { color: C.ink, width: 3 });
        p.text('v', v[0] * 1.18, v[1] * 1.18, { color: C.ink, align: 'center' });
        p.text('Av', Av[0] + 0.25 * Math.sign(Av[0] || 1), Av[1] + 0.25 * Math.sign(Av[1] || 1), { color: C.ink, align: 'center' });
        p.clipOff();
        var turn = math.turn(A, v), gain = Math.hypot(Av[0], Av[1]);
        ro.set('l', e.real ? M.fmt(e.l1, 2) + ', ' + M.fmt(e.l2, 2) : M.fmt(e.re, 2) + ' ± ' + M.fmt(e.im, 2) + 'i');
        ro.set('tr', M.fmt(e.tr, 2)); ro.set('det', M.fmt(e.det, 2));
        ro.set('turn', gain < 1e-9 ? 'squashed to 0' : M.fmt(turn, 1) + '°'); ro.set('gain', M.fmt(gain, 2));
        var onLine = gain < 1e-9 || Math.abs(turn) < 1.5 || Math.abs(Math.abs(turn) - 180) < 1.5;
        if (onLine) vd.set('v stays on its own line: it is an eigenvector, with λ ≈ ' + M.fmt((Math.abs(turn) > 90 ? -1 : 1) * gain, 2) + '.', 'good');
        else vd.set(e.real ? 'A turns this v. Keep spinning: two lines (dashed) are special.' : 'Complex eigenvalues: every direction gets turned. No real eigenvector exists.');
      };
    },
  });
})();
