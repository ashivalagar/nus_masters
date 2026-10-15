/* 20 K-means step by step: tutors move to the centre of their students. */
(function () {
  'use strict';
  var L = window.MMLab, M = L.M;
  var math = {
    data: function () { var r = M.rng(4), X = []; [[0, 0], [4, 0], [2, 3.5]].forEach(function (m) { X = X.concat(M.blob(r, 50, m[0], m[1], 0.6)); }); return X; },
    assign: function (X, Cs) { return X.map(function (x) { var best = 0, bd = Infinity; Cs.forEach(function (c, j) { var d = (x[0] - c[0]) * (x[0] - c[0]) + (x[1] - c[1]) * (x[1] - c[1]); if (d < bd) { bd = d; best = j; } }); return best; }); },
    move: function (X, lab, Cs) { return Cs.map(function (c, j) { var s = [0, 0], n = 0; X.forEach(function (x, i) { if (lab[i] === j) { s[0] += x[0]; s[1] += x[1]; n++; } }); return n ? [s[0] / n, s[1] / n] : c.slice(); }); },
    sse: function (X, lab, Cs) { var s = 0; X.forEach(function (x, i) { var c = Cs[lab[i]]; s += (x[0] - c[0]) * (x[0] - c[0]) + (x[1] - c[1]) * (x[1] - c[1]); }); return s; },
    run: function (X, Cs, maxIt) { var lab = math.assign(X, Cs), it = 0; for (; it < (maxIt || 100); it++) { var nc = math.move(X, lab, Cs), nl = math.assign(X, nc), same = nl.every(function (v, i) { return v === lab[i]; }); Cs = nc; lab = nl; if (same) break; } return { C: Cs, lab: lab, sse: math.sse(X, lab, Cs), it: it + 1 }; },
    randomInit: function (X, k, rnd) { var idx = []; while (idx.length < k) { var i = Math.floor(rnd() * X.length); if (idx.indexOf(i) < 0) idx.push(i); } return idx.map(function (i) { return X[i].slice(); }); },
  };
  L.register({
    id: '20_kmeans_steps', title: 'K-means, one step at a time', math: math, keywords: 'k-means clustering centroids assignment local minimum restarts inertia SSE',
    idea: 'Assign every point to its nearest centre, move each centre to the mean of its points, repeat. Watch it, then try a bad start.',
    predict: { q: 'Three centres all start inside the bottom-left blob. Will K-means find the three obvious clusters?', options: ['Yes, always', 'No, it can get stuck in a worse solution', 'It never converges', 'Only if k = 2'] },
    notice: [
      'Each assign step and each move step can only lower (or keep) the total squared distance, so K-means always converges, but only to a local minimum.',
      'From the bad start, two centres can end up sharing one real cluster while one centre covers two clusters: a higher SSE that K-means cannot escape by itself.',
      'Fix: run several random restarts (or K-means++ seeding) and keep the lowest SSE. The restart history shows how often a bad local minimum appears.',
    ],
    setup: function (ui) {
      var p = ui.canvas({ aspect: 0.72, label: 'Points coloured by cluster with centroids', cap: 'Crosses are centres; faint trails show where they came from.' });
      ui.legend([{ label: 'cluster 1', color: 's1', dot: true }, { label: 'cluster 2', color: 's2', dot: true }, { label: 'cluster 3', color: 's3', dot: true }, { label: 'centre', color: 'ink' }]);
      var X = math.data(), K = 3, Cs, lab = null, trail, phase = 'assign', iter = 0, rnd = M.rng(9), history = [];
      function start(c) { Cs = c; lab = null; trail = Cs.map(function (q) { return [q.slice()]; }); phase = 'assign'; iter = 0; }
      start([[1, 1], [1.5, 1], [1.2, 0.5]]);
      var k = ui.slider({ label: 'k (clusters)', min: 2, max: 6, step: 1, value: 3, fmt: function (x) { return String(Math.round(x)); }, onInput: function (v) { K = Math.round(v); start(math.randomInit(X, K, rnd)); } });
      ui.buttons([
        { label: 'Next step', primary: true, onClick: function () { if (phase === 'assign') { lab = math.assign(X, Cs); phase = 'move'; } else { Cs = math.move(X, lab, Cs); Cs.forEach(function (c, j) { trail[j].push(c.slice()); }); phase = 'assign'; iter++; } } },
        { label: 'Run to convergence', onClick: function () { var r = math.run(X, Cs); Cs = r.C; lab = r.lab; iter += r.it; Cs.forEach(function (c, j) { trail[j].push(c.slice()); }); phase = 'assign'; history.push(r.sse); if (history.length > 10) history.shift(); } },
      ]);
      ui.buttons([
        { label: 'Bad start', onClick: function () { K = 3; k.set(3, 1); start([[1, 1], [1.5, 1], [1.2, 0.5]]); } },
        { label: 'Random start', onClick: function () { start(math.randomInit(X, K, rnd)); } },
        { label: 'Best of 10 restarts', onClick: function () { var best = null; for (var i = 0; i < 10; i++) { var r = math.run(X, math.randomInit(X, K, rnd)); history.push(r.sse); if (!best || r.sse < best.sse) best = r; } history = history.slice(-10); start(best.C); lab = best.lab; } },
      ]);
      var ro = ui.readouts([['it', 'iteration'], ['next', 'next step'], ['sse', 'SSE (inertia)'], ['hist', 'recent runs SSE']]);
      ui.draw = function () {
        var C = p.col, cols = [C.s1, C.s2, C.s3, C.found, C.ee5907, C.ink2];
        p.clear().setView(-1.8, 6, -1.8, 5.5, true).grid({ xstep: 1, ystep: 1 });
        p.clipOn();
        X.forEach(function (x, i) { p.dot(x[0], x[1], { r: 3.4, color: lab ? cols[lab[i] % cols.length] : C.neutral, ring: false, alpha: 0.85 }); });
        trail.forEach(function (t, j) { if (t.length > 1) p.line(t, { color: cols[j % cols.length], width: 1.5, dash: [3, 3] }); });
        Cs.forEach(function (c, j) { p.cross(c[0], c[1], { color: C.ink, r: 7, width: 3 }); p.dot(c[0], c[1], { r: 3, color: cols[j % cols.length], ring: false }); });
        p.clipOff();
        var l = lab || math.assign(X, Cs);
        ro.set('it', String(iter)); ro.set('next', phase === 'assign' ? 'assign points' : 'move centres');
        ro.set('sse', M.fmt(math.sse(X, l, Cs), 1)); ro.set('hist', history.length ? history.map(function (s) { return Math.round(s); }).join(', ') : '—');
      };
    },
  });
})();
