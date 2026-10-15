/* 04 State trajectories: dx/dt = Ax as rivers in the phase plane. */
(function () {
  'use strict';
  var L = window.MMLab, M = L.M;
  var PRESETS = {
    node: { label: 'Stable node', A: [[0, 1], [-2, -3]] },
    spiral: { label: 'Stable spiral', A: [[0, 1], [-1.04, -0.4]] },
    saddle: { label: 'Saddle', A: [[0, 1], [2, 1]] },
    centre: { label: 'Centre', A: [[0, 1], [-1, 0]] },
  };
  var math = {
    presets: PRESETS,
    classify: function (A) {
      var e = M.eig2(A[0][0], A[0][1], A[1][0], A[1][1]);
      if (!e.real) return Math.abs(e.re) < 1e-9 ? 'centre' : e.re < 0 ? 'stable spiral' : 'unstable spiral';
      if (e.l1 > 1e-9 && e.l2 < -1e-9) return 'saddle';
      if (e.l1 < -1e-9 && e.l2 < -1e-9) return 'stable node';
      if (e.l1 > 1e-9 && e.l2 > 1e-9) return 'unstable node';
      return 'degenerate (an eigenvalue is 0)';
    },
    traj: function (A, x0, T, n) { return M.rk4(function (t, x) { return M.mv2(A, x); }, x0, 0, T, n); },
  };
  L.register({
    id: '04_state_trajectories', title: 'Phase portraits: modes as rivers', math: math, keywords: 'phase portrait node saddle spiral centre matrix exponential trajectories',
    idea: 'Each starting state flows along dx/dt = Ax. Tap the plane to drop a starting point and watch where it goes.',
    predict: { q: 'For the saddle (eigenvalues 2 and −1), almost every starting point eventually…', options: ['flows into the origin', 'flies off to infinity', 'circles the origin forever', 'stops where it started'] },
    notice: [
      'Stable node: every river drains into the origin, first sliding along the slow eigen-direction (λ = −1), because the fast mode (−2) dies first.',
      'Saddle: only starts exactly on the stable eigen-line reach the origin. Any tiny error grows like e^{2t}: one positive eigenvalue makes the whole system unstable.',
      'Spiral: complex eigenvalues −0.2 ± j add rotation; the real part −0.2 slowly shrinks the loops. Centre: real part 0, loops forever.',
      'The x₁(t), x₂(t) traces underneath are just the same trajectory against time: e^{At}x₀ is the fast-forward button.',
    ],
    setup: function (ui) {
      var p = ui.canvas({ aspect: 0.72, drag: true, label: 'Phase plane with vector field and trajectories', cap: 'Tap or click to drop a starting state.' });
      var q = ui.canvas({ aspect: 0.32, minH: 140, label: 'x1 and x2 against time for the last trajectory' });
      ui.legend([{ label: 'x₁ (position)', color: 's1' }, { label: 'x₂ (velocity)', color: 's2' }, { label: 'eigen-directions', color: 's3', dash: true }]);
      var key = 'node', A = PRESETS.node.A, starts = [];
      var defaults = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [0.5, -1], [-0.5, 1]];
      function reset() { starts = defaults.map(function (s) { return s.slice(); }); }
      reset();
      ui.group(Object.keys(PRESETS).map(function (k) { return { label: PRESETS[k].label, value: k }; }), key, function (k) { key = k; A = PRESETS[k].A; reset(); });
      ui.buttons([{ label: 'Clear trajectories', onClick: function () { starts = []; } }, { label: 'Default starts', onClick: reset }]);
      var ro = ui.readouts([['A', 'A'], ['l', 'eigenvalues'], ['kind', 'type']]);
      var vd = ui.verdict();
      p.onPointer({ down: function (pt) { starts.push([pt[0], pt[1]]); if (starts.length > 14) starts.shift(); ui.redraw(); } });

      ui.draw = function () {
        var C = p.col;
        p.clear().setView(-2, 2, -2, 2, true).grid({ xstep: 0.5, ystep: 0.5, xlabel: 'x₁', ylabel: 'x₂' });
        p.clipOn();
        // vector field
        for (var gx = -2; gx <= 2.01; gx += 0.333) for (var gy = -2; gy <= 2.01; gy += 0.333) {
          var v = M.mv2(A, [gx, gy]), n = Math.hypot(v[0], v[1]) || 1, s = 0.13;
          p.arrow(gx, gy, gx + v[0] / n * s, gy + v[1] / n * s, { color: C.rule2, width: 1.2, head: 5 });
        }
        var e = M.eig2(A[0][0], A[0][1], A[1][0], A[1][1]);
        if (e.real) [e.v1, e.v2].forEach(function (v) { p.line([[-5 * v[0], -5 * v[1]], [5 * v[0], 5 * v[1]]], { color: C.s3, width: 1.5, dash: [6, 5] }); });
        var last = null;
        starts.forEach(function (x0, i) {
          var tr = math.traj(A, x0, 6, 300).map(function (o) { return o.x; }).filter(function (x) { return Math.abs(x[0]) < 8 && Math.abs(x[1]) < 8; });
          p.line(tr, { color: C.ink2, width: 1.6, alpha: i === starts.length - 1 ? 1 : 0.55 });
          p.dot(x0[0], x0[1], { r: 3.5, color: C.ink });
          last = x0;
        });
        p.clipOff();
        q.clear().setView(0, 8, -2.5, 2.5).grid({ xstep: 1, ystep: 1, xlabel: 't' });
        if (last) {
          var tr2 = math.traj(A, last, 8, 400);
          q.clipOn();
          q.line(tr2.map(function (o) { return [o.t, o.x[0]]; }), { color: C.s1 });
          q.line(tr2.map(function (o) { return [o.t, o.x[1]]; }), { color: C.s2 });
          q.clipOff();
        }
        ro.set('A', '[[' + A[0].join(', ') + '], [' + A[1].join(', ') + ']]');
        ro.set('l', e.real ? M.fmt(e.l1, 2) + ', ' + M.fmt(e.l2, 2) : M.fmt(e.re, 2) + ' ± ' + M.fmt(e.im, 2) + 'j');
        var kind = math.classify(A); ro.set('kind', kind);
        vd.set(/^stable/.test(kind) ? 'All eigenvalues in the left half-plane: every trajectory decays to 0.' : kind === 'centre' ? 'Eigenvalues on the imaginary axis: orbits forever, never settles.' : 'At least one eigenvalue has a positive real part: trajectories escape.', /^stable/.test(kind) ? 'good' : kind === 'centre' ? null : 'bad');
      };
    },
  });
})();
