/* 02 Pole map: where a pole sits decides how the mode behaves. */
(function () {
  'use strict';
  var L = window.MMLab, M = L.M;
  var math = {
    /** response of the mode pair e^{st} (real part), as in the Python lab */
    mode: function (sig, w, t) { return Math.exp(sig * t) * Math.cos(w * t); },
    zeta: function (sig, w) { var r = Math.hypot(sig, w); return r ? -sig / r : 1; },
    classify: function (sig, w) {
      if (sig > 1e-9) return w > 0 ? 'unstable: growing oscillation' : 'unstable: runs away';
      if (Math.abs(sig) <= 1e-9) return w > 0 ? 'marginally stable: oscillates forever' : 'marginally stable: stays put (integrator)';
      return w > 0 ? 'stable: wobbles and decays' : 'stable: decays without wobbling';
    },
  };
  L.register({
    id: '02_pole_map', title: 'The pole map', math: math, keywords: 's-plane poles stability damping complex',
    idea: 'Drag a pole around the s-plane. Left half lives, right half runs away, height sets the wobble.',
    predict: { q: 'A pole at −0.5 ± 3j. What does its response look like?', options: ['Slow decay, no wobble', 'Fast wobble that slowly dies out', 'Wobble that grows', 'Steady oscillation forever'] },
    notice: [
      'The real part σ is the decay (or growth) rate: the envelope is e^{σt}. Further left means it dies faster; the time constant is 1/|σ|.',
      'The imaginary part ω is the wobble speed: period 2π/ω. Poles always come in mirrored pairs for real systems.',
      'Crossing the imaginary axis is the whole story of stability: σ < 0 lives, σ = 0 rings forever, σ > 0 explodes.',
      'Damping ratio ζ = −σ/|s| is the cosine of the angle from the negative real axis: poles on a ray from the origin share the same overshoot.',
    ],
    setup: function (ui) {
      ui.columns(2);
      var pm = ui.canvas({ aspect: 0.9, drag: true, label: 'Complex s-plane with a draggable pole pair', cap: 'Drag the pole. Its mirror image follows.' });
      var pr = ui.canvas({ aspect: 0.9, label: 'Time response of the mode', cap: 'Response e^{σt} cos(ωt)' });
      var sig = -0.5, w = 3;
      ui.buttons([['Fast decay', -3, 0], ['Slow decay', -0.5, 0], ['Wobble + decay', -0.5, 3], ['Pure oscillation', 0, 2], ['Wobble + grow', 0.3, 2], ['Runaway', 0.5, 0]].map(function (q) {
        return { label: q[0], onClick: function () { sig = q[1]; w = q[2]; } };
      }));
      var ro = ui.readouts([['s', 'pole'], ['tau', 'time constant 1/|σ|'], ['T', 'period 2π/ω'], ['z', 'damping ratio ζ']]);
      var vd = ui.verdict();
      pm.onPointer({ down: move, move: move });
      function move(pt) { sig = M.clamp(Math.round(pt[0] * 20) / 20, -4, 1.5); var ww = Math.abs(pt[1]); w = ww < 0.15 ? 0 : M.clamp(Math.round(ww * 20) / 20, 0, 4); ui.redraw(); }

      ui.draw = function () {
        var C = pm.col;
        pm.clear().setView(-4, 1.5, -4.2, 4.2);
        var c = pm.ctx;
        c.save(); c.fillStyle = ui.hexA(C.good, 0.08); c.fillRect(pm.X(-4), pm.pad.t, pm.X(0) - pm.X(-4), pm.h - pm.pad.t - pm.pad.b);
        c.fillStyle = ui.hexA(C.s2, 0.1); c.fillRect(pm.X(0), pm.pad.t, pm.X(1.5) - pm.X(0), pm.h - pm.pad.t - pm.pad.b); c.restore();
        pm.grid({ xstep: 1, ystep: 1, xlabel: 'σ (decay rate)', ylabel: 'jω (wobble)' });
        pm.text('stable', -3.9, 3.7, { color: C.good, size: 12 });
        pm.text('unstable', 1.45, 3.7, { color: C.ink2, size: 12, align: 'right' });
        // ray of constant damping
        if (w > 0 || sig < 0) pm.line([[0, 0], [sig * 3, w * 3]], { color: C.ink3, width: 1, dash: [3, 4] });
        pm.cross(sig, w, { color: C.s1, r: 7, width: 3 });
        if (w > 0) pm.cross(sig, -w, { color: C.s1, r: 7, width: 3 });
        pr.clear().setView(0, 8, -3, 3).grid({ xstep: 1, ystep: 1, xlabel: 't' });
        var env = sig !== 0;
        if (env && w > 0) { pr.fn(function (t) { return Math.exp(sig * t); }, { color: C.ink3, width: 1, dash: [4, 4] }); pr.fn(function (t) { return -Math.exp(sig * t); }, { color: C.ink3, width: 1, dash: [4, 4] }); }
        pr.clipOn(); pr.fn(function (t) { return M.clamp(math.mode(sig, w, t), -50, 50); }, { color: C.s1, width: 2.5, n: 600 }); pr.clipOff();
        ro.set('s', M.fmt(sig, 2) + (w ? ' ± ' + M.fmt(w, 2) + 'j' : ''));
        ro.set('tau', sig ? M.fmt(1 / Math.abs(sig), 2) + ' s' : '∞'); ro.set('T', w ? M.fmt(2 * Math.PI / w, 2) + ' s' : 'no wobble');
        ro.set('z', sig > 0 ? 'negative' : M.fmt(math.zeta(sig, w), 2));
        var cl = math.classify(sig, w);
        vd.set(cl.charAt(0).toUpperCase() + cl.slice(1) + '.', sig < -1e-9 ? 'good' : sig > 1e-9 ? 'bad' : null);
      };
    },
  });
})();
