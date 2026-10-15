/* 19 PCA vs LDA: the best shadow vs the best shadow for separating classes. */
(function () {
  'use strict';
  var L = window.MMLab, M = L.M;
  var math = {
    data: function () {
      var r = M.rng(2), sx = Math.sqrt(6), sy = Math.sqrt(0.4), a = [], b = [];
      for (var i = 0; i < 200; i++) a.push([sx * M.randn(r), -1.2 + sy * M.randn(r)]);
      for (i = 0; i < 200; i++) b.push([sx * M.randn(r), 1.2 + sy * M.randn(r)]);
      return { A: a, B: b };
    },
    mean: function (P) { var m = [0, 0]; P.forEach(function (p) { m[0] += p[0]; m[1] += p[1]; }); return [m[0] / P.length, m[1] / P.length]; },
    scatter: function (P, m) { var S = [[0, 0], [0, 0]]; P.forEach(function (p) { var dx = p[0] - m[0], dy = p[1] - m[1]; S[0][0] += dx * dx; S[0][1] += dx * dy; S[1][1] += dy * dy; }); S[1][0] = S[0][1]; return S; },
    /** projected total variance and Fisher criterion J(w) = (m1 − m2)² / (s1² + s2²) along angle th */
    along: function (D, th) {
      var w = [Math.cos(th), Math.sin(th)], pa = D.A.map(function (p) { return p[0] * w[0] + p[1] * w[1]; }), pb = D.B.map(function (p) { return p[0] * w[0] + p[1] * w[1]; });
      var mean = function (v) { return v.reduce(function (s, x) { return s + x; }, 0) / v.length; }, ma = mean(pa), mb = mean(pb), all = pa.concat(pb), mt = mean(all);
      var va = pa.reduce(function (s, x) { return s + (x - ma) * (x - ma); }, 0) / pa.length, vb = pb.reduce(function (s, x) { return s + (x - mb) * (x - mb); }, 0) / pb.length;
      var vt = all.reduce(function (s, x) { return s + (x - mt) * (x - mt); }, 0) / all.length;
      return { pa: pa, pb: pb, variance: vt, J: (ma - mb) * (ma - mb) / (va + vb) };
    },
    pcaAngle: function (D) { var all = D.A.concat(D.B), m = math.mean(all), S = math.scatter(all, m), e = M.eig2(S[0][0], S[0][1], S[1][0], S[1][1]); return Math.atan2(e.v1[1], e.v1[0]); },
    ldaAngle: function (D) { var ma = math.mean(D.A), mb = math.mean(D.B), Sw = M.add2(math.scatter(D.A, ma), math.scatter(D.B, mb)), w = M.mv2(M.inv2(Sw), [mb[0] - ma[0], mb[1] - ma[1]]); return Math.atan2(w[1], w[0]); },
  };
  function norm180(a) { a = a * 180 / Math.PI; while (a < 0) a += 180; while (a >= 180) a -= 180; return a; }
  L.register({
    id: '19_pca_vs_lda', title: 'PCA vs LDA: two different best shadows', math: math, keywords: 'PCA LDA Fisher criterion projection variance discriminant dimensionality reduction',
    idea: 'Rotate a projection axis and look at the shadow. PCA wants the widest shadow; LDA wants the classes to split.',
    predict: { q: 'Both classes are long and flat, stacked one above the other. Which axis does PCA pick?', options: ['Horizontal: along the long direction', 'Vertical: across the gap', 'The 45° diagonal', 'Any axis, they are all equal'] },
    notice: [
      'PCA ignores labels: it picks the horizontal axis because that is where the cloud is widest. Projected there, the two classes sit right on top of each other.',
      'LDA maximises J(w) = (m₁ − m₂)² / (s₁² + s₂²): the vertical axis has a small total spread but a clean gap between classes. Its closed form is w ∝ S_W⁻¹(m₂ − m₁).',
      'The two curves on the right peak at different angles: maximum variance is not maximum separability. That is why Assignment 2 compares PCA and LDA features.',
    ],
    setup: function (ui) {
      ui.columns(2);
      var p = ui.canvas({ aspect: 0.85, label: 'Two classes with the current projection axis', cap: 'Data with your projection axis' });
      var h = ui.canvas({ aspect: 0.85, label: 'Histogram of the projected data', cap: 'Shadow on your axis' });
      var c = ui.canvas({ aspect: 0.4, minH: 150, label: 'Variance and Fisher criterion against angle', cap: 'Variance (blue) and Fisher J (orange), each scaled to its maximum, against angle' });
      ui.legend([{ label: 'class A', color: 's1', dot: true }, { label: 'class B', color: 's2', dot: true }, { label: 'PCA axis', color: 's3', dash: true }, { label: 'LDA axis', color: 'ink', dash: true }]);
      var D = math.data(), pca = math.pcaAngle(D), lda = math.ldaAngle(D);
      var th = ui.slider({ label: 'axis angle', min: 0, max: 179, step: 1, value: 30, fmt: function (x) { return Math.round(x) + '°'; } });
      ui.buttons([{ label: 'Snap to PCA', onClick: function () { th.set(Math.round(norm180(pca))); } }, { label: 'Snap to LDA', onClick: function () { th.set(Math.round(norm180(lda))); } }]);
      var ro = ui.readouts([['v', 'projected variance'], ['J', 'Fisher J'], ['pa', 'PCA angle'], ['la', 'LDA angle']]);
      var curve = []; for (var a = 0; a < 180; a += 2) { var r = math.along(D, a * Math.PI / 180); curve.push([a, r.variance, r.J]); }
      var vmax = Math.max.apply(null, curve.map(function (q) { return q[1]; })), jmax = Math.max.apply(null, curve.map(function (q) { return q[2]; }));
      ui.draw = function () {
        var C = p.col, t = th.value * Math.PI / 180, w = [Math.cos(t), Math.sin(t)], res = math.along(D, t);
        p.clear().setView(-7, 7, -5, 5, true).grid({ xstep: 2, ystep: 2 });
        p.clipOn();
        D.A.forEach(function (q) { p.dot(q[0], q[1], { r: 2.4, color: C.s1, ring: false, alpha: 0.6 }); });
        D.B.forEach(function (q) { p.dot(q[0], q[1], { r: 2.4, color: C.s2, ring: false, alpha: 0.6 }); });
        [[pca, C.s3], [lda, C.ink]].forEach(function (q) { p.line([[-9 * Math.cos(q[0]), -9 * Math.sin(q[0])], [9 * Math.cos(q[0]), 9 * Math.sin(q[0])]], { color: q[1], width: 1.5, dash: [6, 5] }); });
        p.line([[-9 * w[0], -9 * w[1]], [9 * w[0], 9 * w[1]]], { color: C.ink, width: 3 });
        p.clipOff();
        // histogram
        var lo = -8, hi = 8, nb = 40, bw = (hi - lo) / nb, ha = new Array(nb).fill(0), hb = new Array(nb).fill(0);
        res.pa.forEach(function (v) { var i = Math.floor((v - lo) / bw); if (i >= 0 && i < nb) ha[i]++; });
        res.pb.forEach(function (v) { var i = Math.floor((v - lo) / bw); if (i >= 0 && i < nb) hb[i]++; });
        var top = Math.max(10, Math.max.apply(null, ha.concat(hb)) * 1.1);
        h.clear().setView(lo, hi, 0, top).grid({ xstep: 2, labels: true });
        var ctx = h.ctx;
        [[ha, C.s1], [hb, C.s2]].forEach(function (q) { ctx.save(); ctx.fillStyle = q[1]; ctx.globalAlpha = 0.5; q[0].forEach(function (n, i) { if (!n) return; var x0 = h.X(lo + i * bw) + 1, x1 = h.X(lo + (i + 1) * bw) - 1; ctx.fillRect(x0, h.Y(n), Math.max(1, x1 - x0), h.Y(0) - h.Y(n)); }); ctx.restore(); });
        c.clear().setView(0, 180, 0, 1.1).grid({ xstep: 30, ystep: 0.5, fx: function (v) { return Math.round(v) + '°'; } });
        c.line(curve.map(function (q) { return [q[0], q[1] / vmax]; }), { color: C.s1, width: 2 });
        c.line(curve.map(function (q) { return [q[0], q[2] / jmax]; }), { color: C.s2, width: 2 });
        c.vline(th.value, { color: C.ink, width: 1.5 });
        c.vline(norm180(pca), { color: C.s3, width: 1.2, dash: [4, 4] }); c.vline(norm180(lda), { color: C.ink3, width: 1.2, dash: [4, 4] });
        ro.set('v', M.fmt(res.variance, 2)); ro.set('J', M.fmt(res.J, 2)); ro.set('pa', M.fmt(norm180(pca), 1) + '°'); ro.set('la', M.fmt(norm180(lda), 1) + '°');
      };
    },
  });
})();
