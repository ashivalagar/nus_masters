/* 17 MLP on XOR (trained live with backprop) + the RBF feature-space view. */
(function () {
  'use strict';
  var L = window.MMLab, M = L.M;
  var X = [[0, 0], [0, 1], [1, 0], [1, 1]], Y = [0, 1, 1, 0];
  var math = {
    X: X, Y: Y,
    init: function (H, seed) { var r = M.rng(seed), W1 = [], b1 = [], W2 = []; for (var j = 0; j < H; j++) { W1.push([M.randn(r), M.randn(r)]); b1.push(0); W2.push(M.randn(r)); } return { H: H, W1: W1, b1: b1, W2: W2, b2: 0 }; },
    forward: function (net, x) { var h = [], z = net.b2; for (var j = 0; j < net.H; j++) { h[j] = Math.tanh(net.W1[j][0] * x[0] + net.W1[j][1] * x[1] + net.b1[j]); z += net.W2[j] * h[j]; } return { h: h, p: M.sigmoid(z) }; },
    /** one full-batch backprop step on summed cross-entropy (as in the Python lab); returns mean loss before the step */
    step: function (net, lr) {
      var H = net.H, gW1 = [], gb1 = [], gW2 = [], gb2 = 0, loss = 0, j;
      for (j = 0; j < H; j++) { gW1.push([0, 0]); gb1.push(0); gW2.push(0); }
      for (var i = 0; i < 4; i++) {
        var f = math.forward(net, X[i]), d = f.p - Y[i];
        loss -= Y[i] * Math.log(f.p + 1e-9) + (1 - Y[i]) * Math.log(1 - f.p + 1e-9);
        gb2 += d;
        for (j = 0; j < H; j++) { gW2[j] += d * f.h[j]; var dh = d * net.W2[j] * (1 - f.h[j] * f.h[j]); gW1[j][0] += dh * X[i][0]; gW1[j][1] += dh * X[i][1]; gb1[j] += dh; }
      }
      for (j = 0; j < H; j++) { net.W1[j][0] -= lr * gW1[j][0]; net.W1[j][1] -= lr * gW1[j][1]; net.b1[j] -= lr * gb1[j]; net.W2[j] -= lr * gW2[j]; }
      net.b2 -= lr * gb2;
      return loss / 4;
    },
    train: function (net, epochs, lr) { var l = 0; for (var e = 0; e < epochs; e++) l = math.step(net, lr); return l; },
    rbf: function (x, s) { var c = [[0, 0], [1, 1]]; return c.map(function (cc) { var d2 = (x[0] - cc[0]) * (x[0] - cc[0]) + (x[1] - cc[1]) * (x[1] - cc[1]); return Math.exp(-d2 / (2 * s * s)); }); },
  };
  L.register({
    id: '17_mlp_xor', title: 'An MLP learns XOR', math: math, keywords: 'MLP multilayer perceptron backpropagation XOR hidden units tanh RBF network feature space',
    idea: 'No straight line separates XOR. Train a tiny network with backprop right here, and see how hidden units (or RBF bumps) bend the space.',
    predict: { q: 'What is the smallest number of tanh hidden units that can solve XOR?', options: ['1', '2', '4', 'It cannot be solved'] },
    notice: [
      'With 1 hidden unit the network is still essentially one fence: the loss stalls and at least one corner stays wrong. Two hidden units can carve the two fences XOR needs (it can still get stuck from an unlucky start; try a new initialisation).',
      'The loss curve falls in steps: long plateaus while the hidden units find their roles, then quick drops. More hidden units usually make the plateaus shorter.',
      'RBF view: with centres on the two class-0 corners, (0, 1) and (1, 0) land on the same point in (φ₁, φ₂) space, and a straight line now separates the classes. Hidden layers and RBF bumps both re-map the input until a line works.',
    ],
    setup: function (ui) {
      ui.columns(2);
      var pm = ui.canvas({ aspect: 0.9, label: 'Decision map of the network on the XOR square', cap: 'Network output P(class 1); dots are the 4 XOR points' });
      var pl = ui.canvas({ aspect: 0.9, label: 'Training loss on a log scale', cap: 'Loss (log scale) against epoch' });
      var pr = ui.canvas({ aspect: 0.9, label: 'XOR points in RBF feature space', cap: 'RBF features (φ₁, φ₂), centres at (0,0) and (1,1)' });
      ui.legend([{ label: 'class 0', color: 's1', dot: true }, { label: 'class 1', color: 's2', dot: true }]);
      var seed = 1, net, losses, epoch, running = false, raf = 0;
      var H = ui.slider({ label: 'hidden units', min: 1, max: 8, step: 1, value: 4, fmt: function (x) { return String(Math.round(x)); }, onInput: function () { reset(); } });
      var lr = ui.slider({ label: 'learning rate', min: 0.05, max: 2, step: 0.05, value: 0.3 });
      var sg = ui.slider({ label: 'RBF width σ', min: 0.2, max: 1.5, step: 0.05, value: 0.5 });
      var btns = ui.buttons([
        { label: 'Train', primary: true, onClick: function (b) { running = !running; b.textContent = running ? 'Pause' : 'Train'; if (running) loop(); } },
        { label: '+200 epochs', onClick: function () { run(200); } },
        { label: 'New random init', onClick: function () { seed++; reset(); } },
      ]);
      var ro = ui.readouts([['ep', 'epoch'], ['loss', 'mean loss'], ['out', 'outputs for (00, 01, 10, 11)'], ['ok', 'corners right']]);
      var vd = ui.verdict();
      function reset() { net = math.init(Math.round(H.value), seed); losses = []; epoch = 0; running = false; btns[0].textContent = 'Train'; cancelAnimationFrame(raf); ui.redraw(); }
      function run(n) { for (var i = 0; i < n; i++) { var l = math.step(net, lr.value); epoch++; if (epoch % 10 === 0) losses.push([epoch, l]); } ui.redraw(); }
      function loop() { if (!running) return; run(60); if (epoch >= 6000) { running = false; btns[0].textContent = 'Train'; ui.redraw(); return; } raf = requestAnimationFrame(loop); }
      reset();
      ui.draw = function () {
        var C = pm.col, c1 = ui.rgbOf(C.s1), c2 = ui.rgbOf(C.s2), bg = ui.rgbOf(C.bg);
        pm.clear().setView(-0.5, 1.5, -0.5, 1.5, true);
        pm.heat(function (x, y) { var pr2 = math.forward(net, [x, y]).p, c = pr2 > 0.5 ? c2 : c1, a = Math.min(1, Math.abs(pr2 - 0.5) * 2) * 0.55; return [bg[0] + (c[0] - bg[0]) * a, bg[1] + (c[1] - bg[1]) * a, bg[2] + (c[2] - bg[2]) * a, 255]; }, 4);
        pm.grid({ xstep: 0.5, ystep: 0.5 });
        X.forEach(function (x, i) { pm.dot(x[0], x[1], { r: 8, color: Y[i] ? C.s2 : C.s1, halo: C.ink }); });
        pl.clear().setView(0, Math.max(1000, epoch), -4, 0.5).grid({ ystep: 1, fy: function (v) { return '1e' + Math.round(v); }, xlabel: 'epoch' });
        pl.line(losses.map(function (q) { return [q[0], Math.log10(Math.max(1e-4, q[1]))]; }), { color: C.s1, width: 2 });
        var s = sg.value;
        pr.clear().setView(-0.05, 1.1, -0.05, 1.1, true).grid({ xstep: 0.2, ystep: 0.2, xlabel: 'φ₁', ylabel: 'φ₂' });
        var F = X.map(function (x) { return math.rbf(x, s); });
        // separating line between class-1 image and the class-0 images: φ1 + φ2 = midpoint
        var s1v = F[1][0] + F[1][1], s0 = Math.min(F[0][0] + F[0][1], F[3][0] + F[3][1]);
        if (s0 > s1v + 1e-6) { var cst = (s0 + s1v) / 2; pr.line([[cst + 0.2, -0.2], [-0.2, cst + 0.2]], { color: C.ink, width: 1.6, dash: [6, 4] }); }
        F.forEach(function (f, i) { pr.dot(f[0], f[1], { r: 8, color: Y[i] ? C.s2 : C.s1, halo: C.ink }); });
        var outs = X.map(function (x) { return math.forward(net, x).p; }), right = outs.filter(function (o, i) { return (o > 0.5 ? 1 : 0) === Y[i]; }).length;
        ro.set('ep', String(epoch)); ro.set('loss', losses.length ? M.fmt(losses[losses.length - 1][1], 4) : '—');
        ro.set('out', outs.map(function (o) { return M.fmt(o, 2); }).join(', ')); ro.set('ok', right + ' of 4');
        vd.set(epoch === 0 ? 'Press Train: 60 backprop epochs per frame.' : right === 4 ? 'Solved: all four corners on the right side.' : Math.round(H.value) === 1 ? 'One hidden unit is still one fence: XOR needs two.' : 'Not solved yet. Keep training, or try a new initialisation.', right === 4 ? 'good' : null);
      };
    },
  });
})();
