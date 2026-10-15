/* 12 Servo with integral action: cruise control that remembers the hill. */
(function () {
  'use strict';
  var L = window.MMLab, M = L.M;
  var math = {
    /** plant y' = −y + u + d, r = 1, hill d = −h after t = 10 (Euler, dt = 0.01, as in the Python lab) */
    sim: function (kp, ki, hill, T) {
      T = T || 20; var dt = 0.01, y = 0, I = 0, out = [];
      for (var t = 0; t < T; t += dt) {
        var d = t > 10 ? -hill : 0, e = 1 - y; I += e * dt; var u = kp * e + ki * I;
        y += dt * (-y + u + d); out.push([t, y, u]);
      }
      return out;
    },
    steadyP: function (kp, d) { return (kp + d) / (1 + kp); }, // y_ss with P only, r = 1
    poles: function (kp, ki) { return M.eig2(0, 1, -ki, -(1 + kp)); }, // s^2 + (1 + kp)s + ki
  };
  L.register({
    id: '12_servo_integral', title: 'Integral action removes the offset', math: math, keywords: 'servo integral action steady-state error disturbance rejection internal model PI cruise control',
    idea: 'A car on cruise control meets a hill at t = 10. Proportional control alone settles short of the target; adding an integrator fixes it.',
    predict: { q: 'With P-only control (Kp = 3), where does the speed settle before the hill?', options: ['Exactly at the target 1.0', 'Below the target, at 0.75', 'Above the target', 'It never settles'] },
    notice: [
      'P-only: the controller needs a nonzero error to produce any push, so it settles where Kp·e balances the drag: y = Kp/(1 + Kp) = 0.75 for Kp = 3. The hill makes it worse: (Kp − 0.5)/(1 + Kp) ≈ 0.63.',
      'Raising Kp shrinks the offset but never removes it (and in a real car amplifies noise).',
      'The integrator keeps adding up error while any remains. At steady state ė must be 0 only when e = 0, so y = r exactly, hill or no hill: the internal model of a constant.',
      'Too much Ki brings overshoot and oscillation: the closed-loop poles s² + (1 + Kp)s + Ki become a complex pair.',
    ],
    setup: function (ui) {
      var p = ui.canvas({ aspect: 0.5, label: 'Speed over time for P and PI control', cap: 'Target speed 1.0; a hill (disturbance) arrives at t = 10' });
      ui.legend([{ label: 'P only', color: 's2' }, { label: 'P + integral', color: 's1' }, { label: 'target', color: 'ink3', dash: true }]);
      var kp = ui.slider({ label: 'Kp', min: 0.5, max: 10, step: 0.1, value: 3, fmt: function (x) { return M.fmt(x, 1); } });
      var ki = ui.slider({ label: 'Ki', min: 0, max: 8, step: 0.1, value: 2, fmt: function (x) { return M.fmt(x, 1); } });
      var hill = ui.slider({ label: 'hill size', min: 0, max: 1, step: 0.05, value: 0.5 });
      var ro = ui.readouts([['p0', 'P only, before hill'], ['p1', 'P only, on the hill'], ['pi', 'PI, on the hill'], ['poles', 'PI closed-loop poles']]);
      var vd = ui.verdict();
      ui.draw = function () {
        var C = p.col, a = math.sim(kp.value, 0, hill.value), b = math.sim(kp.value, ki.value, hill.value);
        p.clear().setView(0, 20, 0, 1.4).grid({ xstep: 2.5, ystep: 0.2, xlabel: 't' });
        p.hline(1, { color: C.ink3, width: 1.2, dash: [3, 4] });
        p.vline(10, { color: C.ink3, width: 1, dash: [6, 4] });
        p.text('hill', 10.2, 0.12, { color: C.ink3 });
        p.clipOn();
        p.line(a.map(function (o) { return [o[0], o[1]]; }), { color: C.s2, width: 2.4 });
        p.line(b.map(function (o) { return [o[0], o[1]]; }), { color: C.s1, width: 2.4 });
        p.clipOff();
        var e = math.poles(kp.value, ki.value);
        ro.set('p0', M.fmt(math.steadyP(kp.value, 0), 3)); ro.set('p1', M.fmt(math.steadyP(kp.value, -hill.value), 3));
        ro.set('pi', M.fmt(b[b.length - 1][1], 3));
        ro.set('poles', e.real ? M.fmt(e.l1, 2) + ', ' + M.fmt(e.l2, 2) : M.fmt(e.re, 2) + ' ± ' + M.fmt(e.im, 2) + 'j');
        vd.set(ki.value === 0 ? 'Ki = 0: both curves are P-only and keep the offset.' : 'Offset with P only: ' + M.fmt((1 - math.steadyP(kp.value, -hill.value)) * 100, 0) + '% short on the hill. With integral action: ' + M.fmt(Math.abs(1 - b[b.length - 1][1]) * 100, 1) + '%.', ki.value === 0 ? 'bad' : 'good');
      };
    },
  });
})();
