/* 15 ROC threshold dial: a smoke alarm's sensitivity knob. */
(function () {
  'use strict';
  var L = window.MMLab, M = L.M;
  var math = {
    tpr: function (th, d) { return 1 - M.Phi(th - d); },
    fpr: function (th) { return 1 - M.Phi(th); },
    /** AUC for two unit-variance Gaussians separated by d' */
    auc: function (d) { return M.Phi(d / Math.SQRT2); },
    precision: function (th, d, prev) { var tp = prev * math.tpr(th, d), fp = (1 - prev) * math.fpr(th); return tp + fp > 0 ? tp / (tp + fp) : NaN; },
  };
  L.register({
    id: '15_roc_threshold_dial', title: 'ROC: turning the threshold dial', math: math, keywords: 'ROC AUC threshold TPR FPR recall precision classifier evaluation',
    idea: 'Scores for negatives and positives overlap. Every threshold is a trade: one dot on the ROC curve.',
    predict: { q: 'Slide the threshold to the right (stricter alarm). What happens?', options: ['Fewer false alarms and fewer catches', 'More false alarms and more catches', 'Fewer false alarms, same catches', 'Nothing changes on the ROC'] },
    notice: [
      'Moving the threshold right lowers both TPR (recall) and FPR: the dot slides down and left along the same curve. The curve itself only changes if the classes become more or less separated.',
      'AUC = Φ(d′/√2) for these Gaussians: 0.5 is a coin flip (d′ = 0), and it rises toward 1 as the classes pull apart. AUC does not depend on the threshold at all.',
      'Precision depends on prevalence, ROC does not: with rare positives, a decent-looking ROC point can still mean most alarms are false (see the Bayes crowd lab).',
    ],
    setup: function (ui) {
      ui.columns(2);
      var p = ui.canvas({ aspect: 0.75, label: 'Score distributions with threshold', cap: 'Scores: negatives vs positives' });
      var q = ui.canvas({ aspect: 0.75, label: 'ROC curve with the current operating point', cap: 'ROC: each threshold is one dot' });
      ui.legend([{ label: 'negatives', color: 's1' }, { label: 'positives', color: 's2' }, { label: 'threshold', color: 'ink' }]);
      var th = ui.slider({ label: 'threshold', min: -3, max: 4.5, step: 0.05, value: 0.75 });
      var d = ui.slider({ label: 'separation d′', min: 0, max: 4, step: 0.05, value: 1.5 });
      var prev = ui.slider({ label: 'share of positives', min: 0.01, max: 0.5, step: 0.01, value: 0.5, fmt: function (x) { return Math.round(x * 100) + '%'; } });
      var ro = ui.readouts([['tpr', 'TPR (recall)'], ['fpr', 'FPR (false alarms)'], ['prec', 'precision'], ['auc', 'AUC']]);
      p.onPointer({ down: function (pt) { th.set(Math.round(M.clamp(pt[0], -3, 4.5) * 20) / 20); }, move: function (pt) { th.set(Math.round(M.clamp(pt[0], -3, 4.5) * 20) / 20); } });
      ui.draw = function () {
        var C = p.col, t = th.value, dd = d.value;
        p.clear().setView(-4, 6, 0, 0.45).grid({ xstep: 1, ystep: 0.1, xlabel: 'score' });
        var n0 = function (x) { return M.npdf(x, 0, 1); }, n1 = function (x) { return M.npdf(x, dd, 1); };
        p.area(n0, function () { return 0; }, -4, 6, C.s1, 0.12); p.area(n1, function () { return 0; }, -4, 6, C.s2, 0.12);
        p.area(n0, function () { return 0; }, t, 6, C.s1, 0.4); // false positives
        p.area(n1, function () { return 0; }, -4, t, C.s2, 0.4); // misses
        p.fn(n0, { color: C.s1, width: 2 }); p.fn(n1, { color: C.s2, width: 2 });
        p.vline(t, { color: C.ink, width: 2 });
        p.text('false alarms', t + 0.15, 0.03, { size: 11, color: C.ink2 });
        p.text('misses', t - 0.15, 0.03, { size: 11, align: 'right', color: C.ink2 });
        q.clear().setView(0, 1, 0, 1, true).grid({ xstep: 0.2, ystep: 0.2, xlabel: 'FPR', ylabel: 'TPR' });
        q.line([[0, 0], [1, 1]], { color: C.ink3, width: 1, dash: [3, 4] });
        var pts = []; for (var s = 6; s >= -4; s -= 0.05) pts.push([math.fpr(s), math.tpr(s, dd)]);
        q.line(pts, { color: C.s2, width: 2.5 });
        q.dot(math.fpr(t), math.tpr(t, dd), { r: 6, color: C.ink });
        var pr = math.precision(t, dd, prev.value);
        ro.set('tpr', M.fmt(math.tpr(t, dd), 3)); ro.set('fpr', M.fmt(math.fpr(t), 3));
        ro.set('prec', isFinite(pr) ? M.fmt(pr, 3) : '—'); ro.set('auc', M.fmt(math.auc(dd), 3));
      };
    },
  });
})();
