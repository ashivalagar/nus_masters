/* 11 LQR on the double integrator: R is the budget dial between error and effort. */
(function () {
  'use strict';
  var L = window.MMLab, M = L.M;
  var A = [[0, 1], [0, 0]], B = [0, 1];
  var math = {
    /**
     * Solve A'P + PA − P B R⁻¹ B' P + Q = 0 by integrating the Riccati ODE
     * dP/dτ = A'P + PA − P B R⁻¹ B' P + Q from P = 0 until it stops changing
     * (the steady state is the stabilising solution). Works for any 2x2 A, 2x1 B.
     */
    riccati: function (Am, Bv, Q, r) {
      var P = [[0, 0], [0, 0]], tau = 0, it = 0;
      var f = function (P) {
        var AtP = M.mul2(M.T2(Am), P), PA = M.mul2(P, Am);
        var PB = [P[0][0] * Bv[0] + P[0][1] * Bv[1], P[1][0] * Bv[0] + P[1][1] * Bv[1]];
        var PBBP = [[PB[0] * PB[0] / r, PB[0] * PB[1] / r], [PB[1] * PB[0] / r, PB[1] * PB[1] / r]];
        return [[AtP[0][0] + PA[0][0] - PBBP[0][0] + Q[0][0], AtP[0][1] + PA[0][1] - PBBP[0][1] + Q[0][1]], [AtP[1][0] + PA[1][0] - PBBP[1][0] + Q[1][0], AtP[1][1] + PA[1][1] - PBBP[1][1] + Q[1][1]]];
      };
      var h = 0.002;
      for (it = 0; it < 400000; it++) {
        var k1 = f(P), k2 = f(M.add2(P, k1, h / 2)), k3 = f(M.add2(P, k2, h / 2)), k4 = f(M.add2(P, k3, h));
        var dP = M.add2(M.add2(k1, k2, 2), M.add2(M.scale2(k3, 2), k4, 1), 1);
        P = M.add2(P, dP, h / 6);
        tau += h;
        var nrm = Math.abs(k1[0][0]) + Math.abs(k1[0][1]) + Math.abs(k1[1][1]);
        if (nrm < 1e-11 * (1 + Math.abs(P[0][0]) + Math.abs(P[1][1]))) break;
        if (it % 200 === 199) h = Math.min(0.05, h * 1.5); // speed up once transients die
        if (!isFinite(P[0][0])) return null;
      }
      var K = [(Bv[0] * P[0][0] + Bv[1] * P[1][0]) / r, (Bv[0] * P[0][1] + Bv[1] * P[1][1]) / r];
      return { P: P, K: K, iters: it };
    },
    /** closed form for the double integrator with Q = diag(q1, q2) */
    analytic: function (q1, q2, r) { var k1 = Math.sqrt(q1 / r); return [k1, Math.sqrt((q2 + 2 * Math.sqrt(q1 * r)) / r)]; },
    lqr: function (q1, r) { return math.riccati(A, B, [[q1, 0], [0, 1]], r); },
    simulate: function (K, x0, T, n) { var Acl = [[0, 1], [-K[0], -K[1]]]; return M.rk4(function (t, x) { return M.mv2(Acl, x); }, x0, 0, T, n || 500); },
  };
  L.register({
    id: '11_lqr_tradeoff', title: 'LQR: the budget dial between error and effort', math: math, keywords: 'LQR riccati quadratic optimal control Q R weights gain double integrator',
    idea: 'Minimise ∫ xᵀQx + Ru² for a double integrator. The Riccati equation turns your priorities into a gain K, solved live in the browser.',
    predict: { q: 'Make R 100× bigger (effort is expensive). What happens to the response?', options: ['Faster, with a bigger push', 'Slower, with a gentler push', 'Same speed, less push', 'It becomes unstable'] },
    notice: [
      'Small R: control is cheap, so LQR slams the actuator (peak |u| = K₁ = 1/√R at t = 0) and the error vanishes fast. Large R: a lazy, slow, gentle response.',
      'Every R gives a stable closed loop: both poles stay in the left half-plane. LQR never trades away stability, only speed against effort.',
      'For Q = I, R = 1 the solver lands on K = (1, √3 ≈ 1.732), matching the closed form K = (√(q₁/r), √((q₂ + 2√(q₁r))/r)).',
      'x₀ᵀ P x₀ in the readout is the exact total cost from that start: the Riccati P is the price of being in a state.',
    ],
    setup: function (ui) {
      ui.columns(2);
      var p = ui.canvas({ aspect: 0.75, label: 'Position error over time', cap: 'Position x₁(t) from x₀ = (1, 0)' });
      var q = ui.canvas({ aspect: 0.75, label: 'Control effort over time', cap: 'Control effort u(t) = −Kx' });
      ui.legend([{ label: 'your R', color: 's1' }, { label: 'R = 0.01, 1, 100 (reference)', color: 'ink3' }]);
      var R = ui.slider({ label: 'R (effort price)', min: 0.01, max: 100, value: 1, log: true, fmt: function (x) { return x < 0.1 ? M.fmt(x, 3) : x < 10 ? M.fmt(x, 2) : M.fmt(x, 0); } });
      var Q1 = ui.slider({ label: 'q₁ (position error price)', min: 0.1, max: 10, value: 1, log: true, fmt: function (x) { return M.fmt(x, 2); } });
      ui.buttons([0.01, 1, 100].map(function (v) { return { label: 'R = ' + v, onClick: function () { R.set(v); } }; }));
      var ro = ui.readouts([['K', 'K = R⁻¹BᵀP'], ['Kc', 'closed form'], ['P', 'P'], ['p', 'closed-loop poles'], ['J', 'cost x₀ᵀPx₀'], ['u', 'peak |u|']]);
      var vd = ui.verdict();
      var cache = {};
      function solve(q1, r) { var key = q1.toFixed(4) + '|' + r.toFixed(5); if (!cache[key]) cache[key] = math.lqr(q1, r); return cache[key]; }
      ui.draw = function () {
        var C = p.col, r = R.value, q1 = Q1.value, sol = solve(q1, r);
        var refs = [0.01, 1, 100].map(function (rr) { return solve(1, rr); });
        p.clear().setView(0, 10, -0.3, 1.05).grid({ xstep: 1, ystep: 0.25, xlabel: 't' });
        var umin = -Math.max(2, sol.K[0] * 1.1);
        q.clear().setView(0, 10, umin, Math.max(0.6, -umin * 0.12)).grid({ xstep: 1, xlabel: 't' });
        p.clipOn(); q.clipOn();
        refs.forEach(function (s) {
          var tr = math.simulate(s.K, [1, 0], 10, 400);
          p.line(tr.map(function (o) { return [o.t, o.x[0]]; }), { color: C.ink3, width: 1.3, alpha: 0.55 });
          q.line(tr.map(function (o) { return [o.t, -(s.K[0] * o.x[0] + s.K[1] * o.x[1])]; }), { color: C.ink3, width: 1.3, alpha: 0.55 });
        });
        var tr = math.simulate(sol.K, [1, 0], 10, 800);
        p.line(tr.map(function (o) { return [o.t, o.x[0]]; }), { color: C.s1, width: 2.6 });
        q.line(tr.map(function (o) { return [o.t, -(sol.K[0] * o.x[0] + sol.K[1] * o.x[1])]; }), { color: C.s1, width: 2.6 });
        p.clipOff(); q.clipOff();
        var e = M.eig2(0, 1, -sol.K[0], -sol.K[1]), an = math.analytic(q1, 1, r), P = sol.P;
        ro.set('K', '(' + M.fmt(sol.K[0], 3) + ', ' + M.fmt(sol.K[1], 3) + ')'); ro.set('Kc', '(' + M.fmt(an[0], 3) + ', ' + M.fmt(an[1], 3) + ')');
        ro.set('P', '[[' + M.fmt(P[0][0], 2) + ', ' + M.fmt(P[0][1], 2) + '], [·, ' + M.fmt(P[1][1], 2) + ']]');
        ro.set('p', e.real ? M.fmt(e.l1, 2) + ', ' + M.fmt(e.l2, 2) : M.fmt(e.re, 2) + ' ± ' + M.fmt(e.im, 2) + 'j');
        ro.set('J', M.fmt(P[0][0], 3)); ro.set('u', M.fmt(sol.K[0], 2));
        vd.set(r < 0.1 ? 'Cheap control: aggressive, big initial push, error gone quickly.' : r > 10 ? 'Expensive control: gentle and slow, but still stable.' : 'Balanced: moderate push, moderate speed.', 'good');
      };
    },
  });
})();
