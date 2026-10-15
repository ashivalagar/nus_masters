/* 10 Pole placement: choose the closed-loop personality; pay for it in control effort. */
(function () {
  'use strict';
  var L = window.MMLab, M = L.M;
  var math = {
    /** unit step response of wn^2 / (s^2 + 2 z wn s + wn^2) (same formulas as the Python lab) */
    step: function (z, wn, t) {
      if (z < 1 - 1e-9) { var wd = wn * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * wn * t) * (Math.cos(wd * t) + z / Math.sqrt(1 - z * z) * Math.sin(wd * t)); }
      if (z <= 1 + 1e-9) return 1 - Math.exp(-wn * t) * (1 + wn * t);
      var s = Math.sqrt(z * z - 1), p1 = -wn * (z - s), p2 = -wn * (z + s); return 1 + (p2 * Math.exp(p1 * t) - p1 * Math.exp(p2 * t)) / (p1 - p2);
    },
    deriv: function (z, wn, t) { var h = 1e-5; return (math.step(z, wn, t + h) - math.step(z, wn, Math.max(0, t - h))) / (t > h ? 2 * h : h); },
    /** state feedback gain for the double integrator x1' = x2, x2' = u: s^2 + k2 s + k1 */
    gain: function (z, wn) { return [wn * wn, 2 * z * wn]; },
    overshoot: function (z) { return z < 1 ? Math.exp(-z * Math.PI / Math.sqrt(1 - z * z)) : 0; },
    settle: function (z, wn) { return 4 / (z * wn); },
    poles: function (z, wn) { if (z < 1) return [[-z * wn, wn * Math.sqrt(1 - z * z)], [-z * wn, -wn * Math.sqrt(1 - z * z)]]; var s = Math.sqrt(z * z - 1); return [[-wn * (z - s), 0], [-wn * (z + s), 0]]; },
  };
  L.register({
    id: '10_pole_placement_effect', title: 'Pole placement chooses the personality', math: math, keywords: 'pole placement state feedback damping ratio natural frequency overshoot settling time gain',
    idea: 'Feedback u = −Kx on a double integrator puts the closed-loop poles wherever you like. Set ζ and ωn, see the step response and the effort.',
    predict: { q: 'Double the natural frequency ωn (poles twice as far from the origin). What happens to the peak control effort?', options: ['It stays the same', 'It doubles', 'It quadruples', 'It halves'] },
    notice: [
      'ζ (the angle of the poles) sets the shape: ζ = 0.1 rings, ζ ≈ 0.7 has about 5% overshoot, ζ = 1 is the fastest response without overshoot, ζ = 2 is sluggish.',
      'ωn (the distance from the origin) sets the speed: settling time ≈ 4 / (ζωn). Same ζ, bigger ωn: same shape, squeezed in time.',
      'The price: K = (ωn², 2ζωn), and the very first instant of a unit step asks for u = ωn². Twice as fast costs four times the push. Poles far left mean huge actuators and noise sensitivity.',
      'Check the self-test: poles at −2 ± j means s² + 4s + 5, so K = (5, 4). Set ωn = √5 ≈ 2.24 and ζ = 2/√5 ≈ 0.89 to see it.',
    ],
    setup: function (ui) {
      ui.columns(2);
      var p = ui.canvas({ aspect: 0.7, label: 'Closed-loop step response', cap: 'Step response y(t); pinned runs stay faint' });
      var q = ui.canvas({ aspect: 0.7, label: 'Control effort', cap: 'Control effort u(t) = −Kx + k₁r' });
      var s = ui.canvas({ aspect: 0.7, label: 'Closed-loop poles', cap: 'Closed-loop poles' });
      var z = ui.slider({ label: 'damping ratio ζ', min: 0.05, max: 2, step: 0.01, value: 0.5 });
      var wn = ui.slider({ label: 'natural frequency ωn', min: 0.5, max: 6, step: 0.05, value: 3 });
      var pins = [];
      ui.buttons([{ label: 'Pin this response', onClick: function () { pins.push([z.value, wn.value]); if (pins.length > 4) pins.shift(); } }, { label: 'Clear pins', onClick: function () { pins = []; } }, { label: 'Poles at −2 ± j', onClick: function () { wn.set(Math.sqrt(5), 1); z.set(2 / Math.sqrt(5), 1); } }]);
      var ro = ui.readouts([['p', 'poles'], ['K', 'K = (k₁, k₂)'], ['os', 'overshoot'], ['ts', 'settling ≈ 4/(ζωn)'], ['u', 'peak |u|']]);
      ui.draw = function () {
        var C = p.col, zz = z.value, w = wn.value, Tm = 8;
        p.clear().setView(0, Tm, 0, 1.9).grid({ xstep: 1, ystep: 0.25, xlabel: 't' });
        p.hline(1, { color: C.ink3, width: 1, dash: [3, 4] });
        p.clipOn();
        pins.forEach(function (pp) { p.fn(function (t) { return math.step(pp[0], pp[1], t); }, { color: C.ink3, width: 1.5, alpha: 0.6 }); });
        p.fn(function (t) { return math.step(zz, w, t); }, { color: C.s1, width: 2.5, n: 500 });
        var ts = math.settle(zz, w); if (ts < Tm) p.vline(ts, { color: C.s3, width: 1.2, dash: [4, 4] });
        p.clipOff();
        var K = math.gain(zz, w), uf = function (t) { return K[0] * (1 - math.step(zz, w, t)) - K[1] * math.deriv(zz, w, t); };
        var umax = Math.max(4, K[0] * 1.1);
        q.clear().setView(0, Tm, -umax * 0.4, umax).grid({ xstep: 1, xlabel: 't' });
        q.clipOn(); pins.forEach(function (pp) { var Kp = math.gain(pp[0], pp[1]); q.fn(function (t) { return Kp[0] * (1 - math.step(pp[0], pp[1], t)) - Kp[1] * math.deriv(pp[0], pp[1], t); }, { color: C.ink3, width: 1.5, alpha: 0.6 }); });
        q.fn(uf, { color: C.s2, width: 2.2, n: 500 }); q.clipOff();
        s.clear().setView(-8, 1, -6, 6).grid({ xstep: 2, ystep: 2 });
        var poles = math.poles(zz, w);
        if (zz < 1) { s.line([[0, 0], [poles[0][0] * 1.4, poles[0][1] * 1.4]], { color: C.ink3, width: 1, dash: [3, 4] }); s.line([[0, 0], [poles[1][0] * 1.4, poles[1][1] * 1.4]], { color: C.ink3, width: 1, dash: [3, 4] }); }
        pins.forEach(function (pp) { math.poles(pp[0], pp[1]).forEach(function (pl) { s.cross(pl[0], pl[1], { color: C.ink3, r: 4, width: 1.5 }); }); });
        poles.forEach(function (pl) { s.cross(pl[0], pl[1], { color: C.s1, r: 6, width: 3 }); });
        ro.set('p', zz < 1 ? M.fmt(poles[0][0], 2) + ' ± ' + M.fmt(poles[0][1], 2) + 'j' : M.fmt(poles[0][0], 2) + ', ' + M.fmt(poles[1][0], 2));
        ro.set('K', '(' + M.fmt(K[0], 2) + ', ' + M.fmt(K[1], 2) + ')'); ro.set('os', M.fmt(math.overshoot(zz) * 100, 1) + '%');
        ro.set('ts', M.fmt(math.settle(zz, w), 2) + ' s'); ro.set('u', M.fmt(K[0], 2) + ' (= ωn²)');
      };
    },
  });
})();
