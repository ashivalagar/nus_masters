/* 09 Controllability: two rooms (tanks), one heater in room 1, a door with coupling k. */
(function () {
  'use strict';
  var L = window.MMLab, M = L.M;
  // A = [[-1, 0], [k, -2]], B = [1, 0]^T (room 1 feeds room 2 through the door)
  var math = {
    A: function (k) { return [[-1, 0], [k, -2]]; },
    expA: function (k, t) { var e1 = Math.exp(-t), e2 = Math.exp(-2 * t); return [[e1, 0], [k * (e1 - e2), e2]]; },
    ctrb: function (k) { return [[1, -1], [0, k]]; }, // [B, AB]
    obsv: function (k) { return [[0, 1], [k, -2]]; }, // sensor in room 2: [C; CA]
    gramian: function (k, T, n) {
      n = n || 400; var h = T / n, W = [[0, 0], [0, 0]];
      for (var i = 0; i <= n; i++) {
        var E = math.expA(k, i * h), b = [E[0][0], E[1][0]], w = (i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2);
        W[0][0] += w * b[0] * b[0]; W[0][1] += w * b[0] * b[1]; W[1][1] += w * b[1] * b[1];
      }
      W[0][0] *= h / 3; W[0][1] *= h / 3; W[1][1] *= h / 3; W[1][0] = W[0][1];
      return W;
    },
    /** minimum-energy input that moves x0 to xf in time T (or best effort on room 1 when uncontrollable) */
    plan: function (k, T, x0, xf) {
      var W = math.gramian(k, T), E = math.expA(k, T), free = M.mv2(E, x0), d = [xf[0] - free[0], xf[1] - free[1]];
      var detW = M.det2(W), singular = Math.abs(detW) < 1e-10;
      var eta = singular ? [d[0] / W[0][0], 0] : M.mv2(M.inv2(W), d);
      var u = function (t) { var Et = math.expA(k, T - t); return Et[0][0] * eta[0] + Et[1][0] * eta[1]; }; // B^T e^{A^T (T-t)} eta
      var energy = singular ? d[0] * eta[0] : d[0] * eta[0] + d[1] * eta[1];
      return { u: u, energy: energy, singular: singular, detW: detW };
    },
    simulate: function (k, T, x0, u, n) { var A = math.A(k); return M.rk4(function (t, x) { var ax = M.mv2(A, x); return [ax[0] + u(t), ax[1]]; }, x0, 0, T, n || 400); },
  };
  L.register({
    id: '09_controllability_rooms', title: 'Can one heater reach every room?', math: math, keywords: 'controllability rank Kalman PBH gramian observability two tanks rooms',
    idea: 'The heater pushes room 1 only. Room 2 feels it only through the door (coupling k). Drag the target and see what input it takes.',
    predict: { q: 'Close the door until k is tiny (but not zero). What happens to the heater effort needed to set room 2?', options: ['It stays about the same', 'It grows enormously', 'It drops to zero', 'Room 2 can no longer be reached at all'] },
    notice: [
      'The rank of [B AB] = [[1, −1], [0, k]] is 2 exactly when k ≠ 0: det = k. Any open door, however small, makes the pair (A, B) controllable.',
      'But the minimum energy to reach a target scales like 1/k²: "controllable" means possible, not cheap. Nearly uncontrollable modes need huge inputs (the Gramian is nearly singular).',
      'At k = 0 room 2 never sees the heater: its temperature just decays as e^{−2t} whatever you do, and its pole (−2) cannot be moved by any feedback.',
      'Duality: put the only thermometer in room 2 and observability needs the same door: rank [C; CA] = 2 iff k ≠ 0.',
    ],
    setup: function (ui) {
      ui.columns(2);
      var p = ui.canvas({ aspect: 0.95, drag: true, label: 'Room temperatures as a state trajectory', cap: 'Drag the target (ring).' });
      var q = ui.canvas({ aspect: 0.95, label: 'Heater input over time', cap: 'Minimum-energy heater input u(t)' });
      ui.legend([{ label: 'trajectory', color: 's1' }, { label: 'drift with heater off', color: 'ink3', dash: true }, { label: 'target', color: 's2', dot: true }]);
      var k = ui.slider({ label: 'door coupling k', min: 0, max: 2, step: 0.01, value: 1 });
      var T = ui.slider({ label: 'time allowed T', min: 1, max: 6, step: 0.1, value: 3, fmt: function (x) { return M.fmt(x, 1) + ' s'; } });
      ui.buttons([{ label: 'Door wide open', onClick: function () { k.set(1.5); } }, { label: 'Door ajar (k = 0.1)', onClick: function () { k.set(0.1); } }, { label: 'Door shut', onClick: function () { k.set(0); } }]);
      var ro = ui.readouts([['C', '[B AB]'], ['rank', 'rank [B AB]'], ['E', 'energy ∫u² dt'], ['peak', 'peak |u|'], ['miss', 'miss at T'], ['obs', 'observable from room 2?']]);
      var vd = ui.verdict();
      var x0 = [1, -1], xf = [0, 0.6];
      p.onPointer({ down: function (pt) { xf = [M.clamp(pt[0], -1.8, 1.8), M.clamp(pt[1], -1.8, 1.8)]; ui.redraw(); }, move: function (pt) { xf = [M.clamp(pt[0], -1.8, 1.8), M.clamp(pt[1], -1.8, 1.8)]; ui.redraw(); } });
      ui.draw = function () {
        var C = p.col, kk = k.value, TT = T.value, plan = math.plan(kk, TT, x0, xf);
        var sim = math.simulate(kk, TT, x0, plan.u, 500), drift = math.simulate(kk, TT, x0, function () { return 0; }, 200);
        p.clear().setView(-2, 2, -2, 2, true).grid({ xstep: 0.5, ystep: 0.5, xlabel: 'room 1', ylabel: 'room 2' });
        p.clipOn();
        p.line(drift.map(function (o) { return o.x; }), { color: C.ink3, width: 1.5, dash: [5, 4] });
        p.line(sim.map(function (o) { return o.x; }), { color: C.s1, width: 2.5 });
        p.dot(x0[0], x0[1], { r: 5, color: C.ink });
        var end = sim[sim.length - 1].x; p.dot(end[0], end[1], { r: 4, color: C.s1 });
        p.dot(xf[0], xf[1], { r: 7, color: C.s2, alpha: 0.25, halo: C.s2 });
        p.clipOff();
        var us = sim.map(function (o) { return [o.t, plan.u(o.t)]; }), peak = us.reduce(function (m, v) { return Math.max(m, Math.abs(v[1])); }, 0);
        var lim = Math.max(2, Math.min(200, peak * 1.15));
        q.clear().setView(0, TT, -lim, lim).grid({ xlabel: 't' });
        q.clipOn(); q.area(function (t) { return plan.u(t); }, function () { return 0; }, 0, TT, C.s1, 0.12); q.line(us, { color: C.s1, width: 2.2 }); q.clipOff();
        var miss = Math.hypot(end[0] - xf[0], end[1] - xf[1]);
        ro.set('C', '[[1, −1], [0, ' + M.fmt(kk, 2) + ']]'); ro.set('rank', kk > 1e-9 ? '2 (det = ' + M.fmt(kk, 2) + ')' : '1');
        ro.set('E', M.fmt(plan.energy, plan.energy > 100 ? 0 : 2)); ro.set('peak', M.fmt(peak, 1)); ro.set('miss', M.fmt(miss, 3));
        ro.set('obs', kk > 1e-9 ? 'yes, rank [C; CA] = 2' : 'no, rank 1');
        if (plan.singular) vd.set('Door shut: rank 1, not controllable. Room 2 just drifts toward 0; the heater can only set room 1.', 'bad');
        else if (plan.energy > 50) vd.set('Controllable (rank 2), but reaching the target costs a lot of energy: a nearly uncontrollable mode.', 'bad');
        else vd.set('Controllable: rank 2. The heater reaches the target exactly at time T.', 'good');
      };
    },
  });
})();
