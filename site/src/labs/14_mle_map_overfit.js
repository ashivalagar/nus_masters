/* 14 MLE vs MAP: data alone vs data plus a sensible hunch (Beta prior on a coin). */
(function () {
  'use strict';
  var L = window.MMLab, M = L.M;
  var math = {
    mle: function (n, h) { return n ? h / n : NaN; },
    /** MAP with a Beta(a, a) prior: (h + a − 1) / (n + 2a − 2) */
    map: function (n, h, a) { return (h + a - 1) / (n + 2 * a - 2); },
    /** curves normalised to peak 1, computed in log space */
    curve: function (h, t, a, b) { // theta^(h+a-1) (1-theta)^(t+b-1)
      var xs = M.linspace(0.0005, 0.9995, 400), ls = xs.map(function (x) { return (h + a - 1) * Math.log(x) + (t + b - 1) * Math.log(1 - x); });
      var mx = Math.max.apply(null, ls); return xs.map(function (x, i) { return [x, Math.exp(ls[i] - mx)]; });
    },
  };
  L.register({
    id: '14_mle_map_overfit', title: 'MLE vs MAP on a coin', math: math, keywords: 'maximum likelihood MAP prior beta posterior overfitting coin',
    idea: 'Flip a coin a few times and estimate its bias. MLE trusts the data alone; MAP blends in a prior hunch that coins are roughly fair.',
    predict: { q: 'Three flips, three heads. What does MLE say the chance of heads is?', options: ['0.5', 'About 0.64', '0.75', '1.0, always heads'] },
    notice: [
      'MLE = h/n = 3/3 = 1: it claims tails is impossible. With tiny data MLE overfits to the extreme.',
      'MAP with a Beta(5, 5) prior = (h + 4)/(n + 8) = 7/11 ≈ 0.64: the prior acts like 8 imaginary flips, half heads, which calms the estimate.',
      'As n grows the likelihood gets narrow and swamps the prior: at n = 100 MLE and MAP nearly agree. Priors matter most when data is scarce.',
      'A stronger prior (bigger a) pulls MAP harder toward 0.5; a = 1 is a flat prior and MAP equals MLE. This is exactly regularisation.',
    ],
    setup: function (ui) {
      var p = ui.canvas({ aspect: 0.5, label: 'Likelihood, prior and posterior over the coin bias' });
      ui.legend([{ label: 'likelihood (data only)', color: 's1' }, { label: 'prior Beta(a, a)', color: 's3', dash: true }, { label: 'posterior (data + prior)', color: 's2' }]);
      var n = ui.slider({ label: 'flips n', min: 1, max: 200, step: 1, value: 3, fmt: function (x) { return String(Math.round(x)); }, onInput: function () { if (h.value > n.value) h.set(n.value, 1); } });
      var h = ui.slider({ label: 'heads h', min: 0, max: 200, step: 1, value: 3, fmt: function (x) { return String(Math.round(x)); }, onInput: function () { if (h.value > n.value) n.set(h.value, 1); } });
      var a = ui.slider({ label: 'prior strength a (Beta(a, a))', min: 1, max: 30, step: 0.5, value: 5, fmt: function (x) { return M.fmt(x, 1); } });
      ui.buttons([['n = 3, h = 3', 3, 3], ['n = 10, h = 8', 10, 8], ['n = 100, h = 52', 100, 52]].map(function (q) { return { label: q[0], onClick: function () { n.set(q[1], 1); h.set(q[2], 1); } }; }));
      var rnd = M.rng(2026), trueP = 0.6;
      ui.buttons([{ label: 'Flip 10 more (true bias hidden)', onClick: function () { var hh = 0; for (var i = 0; i < 10; i++) if (rnd() < trueP) hh++; n.set(Math.min(200, n.value + 10), 1); h.set(Math.min(n.value, h.value + hh), 1); } }]);
      var ro = ui.readouts([['mle', 'MLE h/n'], ['map', 'MAP (h+a−1)/(n+2a−2)'], ['gap', 'difference']]);
      ui.note('The hidden coin used by “Flip 10 more” has bias 0.6.');
      ui.draw = function () {
        var C = p.col, N = Math.round(n.value), H = Math.min(N, Math.round(h.value)), A = a.value;
        p.clear().setView(0, 1, 0, 1.08).grid({ xstep: 0.1, ystep: 0.25, xlabel: 'θ = P(heads)' });
        p.line(math.curve(0, 0, A, A), { color: C.s3, width: 2, dash: [5, 4] });
        p.line(math.curve(H, N - H, 1, 1), { color: C.s1, width: 2.4 });
        p.line(math.curve(H, N - H, A, A), { color: C.s2, width: 2.4 });
        var mle = math.mle(N, H), map = math.map(N, H, A);
        p.vline(mle, { color: C.s1, width: 1, dash: [2, 3] }); p.vline(map, { color: C.s2, width: 1, dash: [2, 3] });
        ro.set('mle', M.fmt(mle, 3)); ro.set('map', M.fmt(map, 3)); ro.set('gap', M.fmt(Math.abs(mle - map), 3));
      };
    },
  });
})();
