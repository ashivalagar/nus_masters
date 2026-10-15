/* 07 Covariance cloud: Σ is the shape of the egg; its eigenvectors are the egg's axes. */
(function () {
  'use strict';
  var L = window.MMLab, M = L.M;
  var math = {
    sigma: function (sx, sy, rho) { return [[sx * sx, rho * sx * sy], [rho * sx * sy, sy * sy]]; },
    /** symmetric 2x2 eigen-decomposition, largest first */
    eigSym: function (S) { var e = M.eig2(S[0][0], S[0][1], S[1][0], S[1][1]); return e; },
    sampleCov: function (pts) {
      var n = pts.length, mx = 0, my = 0; pts.forEach(function (p) { mx += p[0]; my += p[1]; }); mx /= n; my /= n;
      var a = 0, b = 0, c = 0; pts.forEach(function (p) { var dx = p[0] - mx, dy = p[1] - my; a += dx * dx; b += dx * dy; c += dy * dy; });
      return [[a / (n - 1), b / (n - 1)], [b / (n - 1), c / (n - 1)]];
    },
  };
  L.register({
    id: '07_covariance_cloud', title: 'Covariance is the shape of the cloud', math: math, keywords: 'covariance correlation eigenvectors ellipse PCA multivariate gaussian',
    idea: 'Set the spreads and the correlation. The off-diagonal of Σ tilts the egg; its eigenvectors point along the egg’s axes.',
    predict: { q: 'Both spreads are equal and you raise the correlation ρ to 0.8. Which way does the long axis point?', options: ['Along x', 'Along y', 'Along the 45° diagonal', 'It stays round'] },
    notice: [
      'With equal spreads, any ρ ≠ 0 tilts the long axis to exactly ±45°. Its eigenvalues are σ²(1 ± ρ): correlation stretches one diagonal and squeezes the other.',
      'Arrow length is 2√λ: eigenvalue = variance along that direction. The long arrow is the first principal component (PCA).',
      'Negative ρ tilts the egg the other way. ρ = 0 with unequal spreads gives an axis-aligned egg (a diagonal Σ).',
      'The sample covariance from 400 points wobbles around the true Σ: estimates are noisy, especially the off-diagonal.',
    ],
    setup: function (ui) {
      var p = ui.canvas({ aspect: 0.8, maxH: 480, label: 'Scatter of 400 Gaussian samples with eigen-axes' });
      ui.legend([{ label: 'samples', color: 's1', dot: true }, { label: 'eigenvectors × 2√λ', color: 's2' }, { label: '2σ ellipse', color: 'ink3', dash: true }]);
      var sx = ui.slider({ label: 'σx', min: 0.3, max: 2, step: 0.05, value: 1.41 });
      var sy = ui.slider({ label: 'σy', min: 0.3, max: 2, step: 0.05, value: 1.41 });
      var rho = ui.slider({ label: 'correlation ρ', min: -0.95, max: 0.95, step: 0.05, value: 0.8 });
      ui.buttons([['Round', 1, 1, 0], ['Wide', 1.73, 0.63, 0], ['Tilted +', 1.41, 1.41, 0.8], ['Tilted −', 1.41, 1.41, -0.8]].map(function (q) { return { label: q[0], onClick: function () { sx.set(q[1], 1); sy.set(q[2], 1); rho.set(q[3], 1); } }; }));
      var ro = ui.readouts([['S', 'Σ'], ['l', 'eigenvalues'], ['ang', 'long-axis angle'], ['hat', 'sample Σ (n = 400)']]);
      var rnd = M.rng(11), z = []; for (var i = 0; i < 400; i++) z.push([M.randn(rnd), M.randn(rnd)]);
      ui.draw = function () {
        var C = p.col, S = math.sigma(sx.value, sy.value, rho.value);
        // Cholesky: x = L z
        var l11 = Math.sqrt(S[0][0]), l21 = S[1][0] / l11, l22 = Math.sqrt(Math.max(1e-12, S[1][1] - l21 * l21));
        var pts = z.map(function (q) { return [l11 * q[0], l21 * q[0] + l22 * q[1]]; });
        p.clear().setView(-5, 5, -5, 5, true).grid({ xstep: 1, ystep: 1 });
        p.clipOn();
        pts.forEach(function (q) { p.dot(q[0], q[1], { r: 2.2, color: C.s1, ring: false, alpha: 0.5 }); });
        var e = math.eigSym(S);
        var ell = []; for (var k = 0; k <= 100; k++) { var t = k / 100 * 2 * Math.PI, c = Math.cos(t) * 2 * Math.sqrt(e.l1), s = Math.sin(t) * 2 * Math.sqrt(e.l2); ell.push([c * e.v1[0] + s * e.v2[0], c * e.v1[1] + s * e.v2[1]]); }
        p.line(ell, { color: C.ink3, width: 1.4, dash: [5, 4] });
        [[e.v1, e.l1], [e.v2, e.l2]].forEach(function (q) { var L2 = 2 * Math.sqrt(q[1]); p.arrow(0, 0, q[0][0] * L2, q[0][1] * L2, { color: C.s2, width: 3 }); });
        p.clipOff();
        var H = math.sampleCov(pts), f = function (x) { return M.fmt(x, 2); };
        ro.set('S', '[[' + f(S[0][0]) + ', ' + f(S[0][1]) + '], [' + f(S[1][0]) + ', ' + f(S[1][1]) + ']]');
        ro.set('l', f(e.l1) + ', ' + f(e.l2));
        var ang = Math.atan2(e.v1[1], e.v1[0]) * 180 / Math.PI; if (ang > 90) ang -= 180; if (ang <= -90) ang += 180;
        ro.set('ang', M.fmt(ang, 1) + '°');
        ro.set('hat', '[[' + f(H[0][0]) + ', ' + f(H[0][1]) + '], [' + f(H[1][0]) + ', ' + f(H[1][1]) + ']]');
      };
    },
  });
})();
