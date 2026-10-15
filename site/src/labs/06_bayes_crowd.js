/* 06 Bayes crowd: 1000 people; rare disease + good test ≠ likely sick. */
(function () {
  'use strict';
  var L = window.MMLab, M = L.M;
  var math = {
    posterior: function (prev, sens, fpr) { var tp = prev * sens, fp = (1 - prev) * fpr; return tp / (tp + fp); },
    counts: function (N, prev, sens, fpr) { var sick = Math.round(N * prev), tp = Math.round(sick * sens), fp = Math.round((N - sick) * fpr); return { sick: sick, healthy: N - sick, tp: tp, fn: sick - tp, fp: fp, tn: N - sick - fp }; },
  };
  L.register({
    id: '06_bayes_crowd', title: 'Bayes rule as a crowd of 1000 people', math: math, keywords: 'bayes rule posterior prevalence base rate sensitivity false positive',
    idea: 'Count dots instead of juggling formulas: among everyone who tests positive, how many are actually sick?',
    predict: { q: '1% are sick; the test catches 95% of them and wrongly flags 5% of the healthy. You test positive. Chance you are sick?', options: ['About 95%', 'About 50%', 'About 16%', 'About 1%'] },
    notice: [
      'With 1% prevalence there are only 10 sick people, and about 10 true positives, but 5% of 990 healthy people is about 50 false positives. So P(sick | +) ≈ 10/60 ≈ 16%.',
      'Raising sensitivity barely helps. Lowering the false-positive rate or raising prevalence (testing a higher-risk group) changes the answer a lot: the prior term dominates.',
      'Bayes rule is exactly this count: P(D|+) = P(+|D)P(D) / [P(+|D)P(D) + P(+|¬D)P(¬D)].',
    ],
    setup: function (ui) {
      var p = ui.canvas({ aspect: 0.62, label: '1000 people as dots, coloured by health and test result' });
      ui.legend([{ label: 'sick and test positive', color: 's2', dot: true }, { label: 'healthy but test positive', color: 's1', dot: true }, { label: 'sick but missed', color: 'ink', dot: true }, { label: 'negative', color: 'neutral', dot: true }]);
      var pct = function (x) { return M.fmt(x * 100, x < 0.01 ? 1 : 0) + '%'; };
      var prev = ui.slider({ label: 'prevalence (sick)', min: 0.001, max: 0.3, step: 0.001, value: 0.01, fmt: pct, log: false });
      var sens = ui.slider({ label: 'sensitivity P(+ | sick)', min: 0.5, max: 1, step: 0.01, value: 0.95, fmt: pct });
      var fpr = ui.slider({ label: 'false-positive rate P(+ | healthy)', min: 0, max: 0.3, step: 0.005, value: 0.05, fmt: pct });
      var ro = ui.readouts([['tp', 'true positives'], ['fp', 'false positives'], ['post', 'P(sick | +)'], ['npv', 'P(healthy | −)']]);
      var vd = ui.verdict();
      // fixed shuffled seating so dots don't jump
      var rnd = M.rng(7), order = []; for (var i = 0; i < 1000; i++) order.push(i);
      for (i = 999; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = order[i]; order[i] = order[j]; order[j] = t; }
      ui.draw = function () {
        var C = p.col, k = math.counts(1000, prev.value, sens.value, fpr.value);
        p.clear(); var cols = 40, rows = 25, w = p.w, h = p.h, cw = (w - 16) / cols, ch = (h - 12) / rows, r = Math.max(2, Math.min(cw, ch) * 0.32);
        var ctx = p.ctx;
        for (var n = 0; n < 1000; n++) {
          var id = order[n]; // id < sick are sick; first tp of them positive; ids sick..sick+fp-1 are false positives
          var col = C.neutral, big = false;
          if (id < k.sick) { if (id < k.tp) { col = C.s2; big = true; } else { col = C.ink; big = true; } }
          else if (id < k.sick + k.fp) { col = C.s1; big = true; }
          var x = 8 + (n % cols + 0.5) * cw, y = 6 + (Math.floor(n / cols) + 0.5) * ch;
          ctx.beginPath(); ctx.arc(x, y, big ? r * 1.35 : r, 0, 2 * Math.PI); ctx.fillStyle = col; ctx.globalAlpha = big ? 1 : 0.55; ctx.fill();
        }
        ctx.globalAlpha = 1;
        var post = math.posterior(prev.value, sens.value, fpr.value);
        var npv = (k.tn) / Math.max(1, k.tn + k.fn);
        ro.set('tp', String(k.tp)); ro.set('fp', String(k.fp));
        ro.set('post', k.tp + ' / ' + (k.tp + k.fp) + ' ≈ ' + pct(post)); ro.set('npv', pct(npv));
        vd.set('Of everyone who tests positive, ' + pct(post) + ' are sick (exact formula). ' + (post < 0.5 ? 'False alarms outnumber real cases.' : 'Real cases now outnumber false alarms.'), post < 0.5 ? 'bad' : 'good');
      };
    },
  });
})();
