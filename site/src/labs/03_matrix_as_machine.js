/* 03 Matrix as a machine: det is the area scale; det 0 squashes the plane flat. */
(function () {
  'use strict';
  var L = window.MMLab, M = L.M;
  var math = {
    det: function (a, b, c, d) { return a * d - b * c; },
    rank: function (a, b, c, d) { var tol = 1e-9; if (Math.abs(a * d - b * c) > tol) return 2; return (Math.abs(a) + Math.abs(b) + Math.abs(c) + Math.abs(d)) > tol ? 1 : 0; },
    inverse: function (a, b, c, d) { var D = a * d - b * c; if (Math.abs(D) < 1e-12) return null; return [[d / D, -b / D], [-c / D, a / D]]; },
  };
  L.register({
    id: '03_matrix_as_machine', title: 'A matrix is a machine that warps space', math: math, keywords: 'determinant area inverse rank singular linear map',
    idea: 'Every matrix moves the whole grid. Watch the unit square: its new area is the determinant.',
    predict: { q: 'The matrix [[1, 1], [1, 1]] acts on the unit square. What comes out?', options: ['A bigger square', 'A tilted parallelogram with area 1', 'A flat line segment (area 0)', 'The same square'] },
    notice: [
      'The orange shape is where the unit square lands; its area is |det A|. A shear keeps area 1 even though the shape changes.',
      'At det = 0 the plane collapses onto a line: two different inputs land on the same output, so nothing can undo it. That is exactly "not invertible".',
      'Rank is how many dimensions survive: 2 for a full parallelogram, 1 for a line, 0 for the zero matrix.',
      'A negative determinant means the square got flipped over (the corner labels swap order).',
    ],
    setup: function (ui) {
      var p = ui.canvas({ aspect: 0.75, label: 'Grid and unit square before and after the matrix' });
      ui.legend([{ label: 'unit square before', color: 'ink3', dash: true }, { label: 'after A', color: 's2' }, { label: 'columns of A', color: 's1' }]);
      var f1 = function (x) { return M.fmt(x, 2); };
      var a = ui.slider({ label: 'a', min: -2, max: 2, step: 0.05, value: 1, fmt: f1 });
      var b = ui.slider({ label: 'b', min: -2, max: 2, step: 0.05, value: 1, fmt: f1 });
      var c = ui.slider({ label: 'c', min: -2, max: 2, step: 0.05, value: 0, fmt: f1 });
      var d = ui.slider({ label: 'd', min: -2, max: 2, step: 0.05, value: 1, fmt: f1 });
      var q = Math.cos(0.52), s = Math.sin(0.52);
      ui.buttons([['Rotate 30°', [q, -s, s, q]], ['Stretch x', [2, 0, 0, 1]], ['Shear', [1, 1, 0, 1]], ['Squeeze', [0.5, 0, 0, 0.5]], ['Flip', [0, 1, 1, 0]], ['Singular', [1, 1, 1, 1]]].map(function (pr) {
        return { label: pr[0], onClick: function () { a.set(pr[1][0], 1); b.set(pr[1][1], 1); c.set(pr[1][2], 1); d.set(pr[1][3], 1); } };
      }));
      var ro = ui.readouts([['det', 'det A = area scale'], ['rank', 'rank'], ['inv', 'inverse']]);
      var vd = ui.verdict();
      ui.draw = function () {
        var A = [[a.value, b.value], [c.value, d.value]], C = p.col;
        p.clear().setView(-2.5, 3.5, -2.5, 3, true).grid({ xstep: 1, ystep: 1, labels: true });
        p.clipOn();
        for (var g = -3; g <= 4; g += 0.5) {
          p.line([M.mv2(A, [g, -3]), M.mv2(A, [g, 4])], { color: C.rule2, width: 1 });
          p.line([M.mv2(A, [-3, g]), M.mv2(A, [4, g])], { color: C.rule2, width: 1 });
        }
        var sq = [[0, 0], [1, 0], [1, 1], [0, 1]];
        p.poly(sq, { stroke: C.ink3, dash: [5, 4], width: 1.5 });
        var img = sq.map(function (v) { return M.mv2(A, v); });
        p.poly(img, { fill: C.s2, alpha: 0.35, stroke: C.s2, width: 2 });
        p.arrow(0, 0, A[0][0], A[1][0], { color: C.s1, width: 2.6 });
        p.arrow(0, 0, A[0][1], A[1][1], { color: C.s1, width: 2.6 });
        ['1', '2', '3', '4'].forEach(function (lab, i) { p.text(lab, img[i][0], img[i][1], { size: 11, color: C.ink, align: 'center', dx: i === 0 || i === 3 ? -9 : 9, dy: i < 2 ? 9 : -9 }); });
        p.clipOff();
        var D = math.det(a.value, b.value, c.value, d.value), r = math.rank(a.value, b.value, c.value, d.value), inv = math.inverse(a.value, b.value, c.value, d.value);
        ro.set('det', M.fmt(D, 3)); ro.set('rank', String(r));
        ro.set('inv', inv ? '[[' + inv[0].map(f1).join(', ') + '], [' + inv[1].map(f1).join(', ') + ']]' : 'none (det = 0)');
        if (Math.abs(D) < 1e-9) vd.set('Flattened: the plane collapses to ' + (r ? 'a line' : 'a point') + '. No inverse exists.', 'bad');
        else if (D < 0) vd.set('Area scaled by ' + M.fmt(Math.abs(D), 2) + ' and the square is flipped over (det < 0).');
        else vd.set('Area scaled by ' + M.fmt(D, 2) + '. Invertible: the machine can be run backwards.', 'good');
      };
    },
  });
})();
