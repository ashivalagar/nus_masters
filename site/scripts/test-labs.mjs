// Numerical checks for the interactive labs (runs the lab code in a sandbox, no browser).
//   node scripts/test-labs.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/labs');
const sb = { window: {}, console };
sb.window.window = sb.window;
vm.createContext(sb);
const files = ['_kit.js', ...fs.readdirSync(DIR).filter((f) => /^\d\d_.*\.js$/.test(f)).sort()];
for (const f of files) vm.runInContext('var window = this.window;\n' + fs.readFileSync(path.join(DIR, f), 'utf8'), sb, { filename: f });
const reg = sb.window.MMLab.registry, M = sb.window.MMLab.M;
let fails = 0, passes = 0;
const near = (name, got, want, tol = 1e-3) => {
  const ok = Math.abs(got - want) <= tol * Math.max(1, Math.abs(want));
  ok ? passes++ : fails++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: got ${typeof got === 'number' ? got.toFixed(6) : got}, want ${want}`);
};
const truthy = (name, v) => { v ? passes++ : fails++; console.log(`${v ? 'ok  ' : 'FAIL'} ${name}`); };

truthy('21 labs registered', Object.keys(reg).length === 21);
for (const f of files.slice(1)) truthy(`id matches file ${f}`, !!reg[f.replace(/\.js$/, '')]);

// 01 eigen
let e = M.eig2(1, 2, 2, 1); near('01 eig [[1,2],[2,1]] λ1', e.l1, 3); near('01 eig [[1,2],[2,1]] λ2', e.l2, -1);
e = M.eig2(4, 1, 2, 3); near('01 eig [[4,1],[2,3]] λ1', e.l1, 5); near('01 eig [[4,1],[2,3]] λ2', e.l2, 2);
e = M.eig2(1, 2, 2, 1); near('01 eigenvector for λ=3 is along (1,1)', Math.abs(e.v1[0] - e.v1[1]), 0, 1e-9);
e = M.eig2(1, -2, 2, 1); near('01 rotation: complex re', e.re, 1); near('01 rotation: complex im', e.im, 2);
e = M.eig2(0, 1, -2, -3); near('01 control A eig', e.l1, -1); near('01 control A eig 2', e.l2, -2);
near('01 turn angle zero on eigenvector', reg['01_eigenvectors'].math.turn([[1, 2], [2, 1]], [Math.SQRT1_2, Math.SQRT1_2]), 0, 1e-9);
// 02
near('02 damping ratio of -0.5±3j', reg['02_pole_map'].math.zeta(-0.5, 3), 0.5 / Math.hypot(0.5, 3));
// 03
near('03 det shear', reg['03_matrix_as_machine'].math.det(1, 1, 0, 1), 1); near('03 rank singular', reg['03_matrix_as_machine'].math.rank(1, 1, 1, 1), 1);
const inv = reg['03_matrix_as_machine'].math.inverse(1, 2, 3, 4); near('03 inverse [[1,2],[3,4]] (1,1)', inv[0][0], -2); near('03 inverse (2,1)', inv[1][0], 1.5);
// 04 RK4 vs matrix exponential: A=[[0,1],[-2,-3]], x0=(1,0): x1(t)=2e^{-t}-e^{-2t}
const tr = reg['04_state_trajectories'].math.traj([[0, 1], [-2, -3]], [1, 0], 2, 400);
near('04 RK4 x1(2) vs e^{At}', tr[tr.length - 1].x[0], 2 * Math.exp(-2) - Math.exp(-4), 1e-6);
truthy('04 saddle classified', reg['04_state_trajectories'].math.classify([[0, 1], [2, 1]]) === 'saddle');
// 05
const gd = reg['05_gradient_descent'].math; near('05 eta=0.5 one step to 3', gd.path1d(0.5, 0, 1)[1], 3); truthy('05 eta=1.05 diverges', Math.abs(gd.path1d(1.05, 0, 12)[12] - 3) > 3);
// 06 Bayes posterior
near('06 P(sick|+) 1%/95%/5%', reg['06_bayes_crowd'].math.posterior(0.01, 0.95, 0.05), 0.0095 / (0.0095 + 0.0495), 1e-9);
near('06 ≈ 0.161', reg['06_bayes_crowd'].math.posterior(0.01, 0.95, 0.05), 0.161, 0.01);
near('06 note example 1%/99%/5% ≈ 0.167', reg['06_bayes_crowd'].math.posterior(0.01, 0.99, 0.05), 0.1667, 0.01);
// 07
e = reg['07_covariance_cloud'].math.eigSym(reg['07_covariance_cloud'].math.sigma(Math.sqrt(2), Math.sqrt(2), 0.8)); near('07 eig Σ=[[2,1.6],[1.6,2]] λ1', e.l1, 3.6); near('07 λ2', e.l2, 0.4);
// 08 Bayes boundary
const bb = reg['08_bayes_boundary'].math;
near('08 boundary equal priors', bb.boundaries(0, 1, 2, 1, 0.5)[0], 1); near('08 boundary P1=0.8', bb.boundaries(0, 1, 2, 1, 0.8)[0], 1 + 0.5 * Math.log(4));
near('08 Bayes error equal priors = Φ(-1)', bb.bayesError(0, 1, 2, 1, 0.5), M.Phi(-1), 1e-4);
// 09 controllability
const cr = reg['09_controllability_rooms'].math;
near('09 det [B AB] = k', M.det2(cr.ctrb(0.7)), 0.7);
const E = cr.expA(0.7, 1.3), num = sb.window.MMLab.M.rk4((t, x) => M.mv2(cr.A(0.7), x), [1, 0], 0, 1.3, 400);
near('09 analytic e^{At} matches RK4', E[1][0], num[num.length - 1].x[1], 1e-6);
let plan = cr.plan(0.5, 3, [1, -1], [0, 0.6]); let sim = cr.simulate(0.5, 3, [1, -1], plan.u, 2000), end = sim[sim.length - 1].x;
near('09 min-energy input hits target x1', end[0], 0, 2e-3); near('09 min-energy input hits target x2', end[1], 0.6, 2e-3);
const e1 = cr.plan(1, 3, [1, -1], [0, 0.6]).energy, e2 = cr.plan(0.1, 3, [1, -1], [0, 0.6]).energy; truthy(`09 energy grows as k shrinks (${e1.toFixed(2)} -> ${e2.toFixed(1)})`, e2 > 20 * e1);
// 10
const pp = reg['10_pole_placement_effect'].math; const K = pp.gain(2 / Math.sqrt(5), Math.sqrt(5)); near('10 K for poles -2±j: k1', K[0], 5); near('10 k2', K[1], 4);
near('10 overshoot ζ=0.5', pp.overshoot(0.5), 0.163, 0.01); near('10 step(ζ=1) at t→∞', pp.step(1, 3, 20), 1, 1e-6);
// 11 LQR
const lq = reg['11_lqr_tradeoff'].math;
let s = lq.lqr(1, 1); near('11 Riccati K1 (Q=I,R=1)', s.K[0], 1, 1e-4); near('11 Riccati K2 = √3', s.K[1], Math.sqrt(3), 1e-4);
for (const r of [0.01, 100]) { s = lq.lqr(1, r); const a = lq.analytic(1, 1, r); near(`11 Riccati K1 R=${r}`, s.K[0], a[0], 1e-4); near(`11 Riccati K2 R=${r}`, s.K[1], a[1], 1e-4); }
s = lq.riccati([[1]].length ? [[1, 0], [0, -5]] : null, [1, 0], [[1, 0], [0, 0]], 1); near('11 scalar a=b=q=r=1 embedded: K = 1+√2', s.K[0], 1 + Math.SQRT2, 1e-4);
// 12 servo
const sv = reg['12_servo_integral'].math; let run = sv.sim(3, 0, 0.5);
near('12 P-only before hill 0.75', run[999][1], 0.75, 1e-3); near('12 P-only on hill 0.625', run[run.length - 1][1], 0.625, 1e-3);
run = sv.sim(3, 2, 0.5); near('12 PI removes offset', run[run.length - 1][1], 1, 2e-3);
// 13 observer
const ob = reg['13_observer_predict_correct'].math;
for (const a of [0.5, 3]) { const ee = ob.errEig(ob.gains(a)); near(`13 eig(A−LC) at −${a}`, ee.real ? ee.l1 : ee.re, -a, 1e-4); }
// 14 MLE/MAP
const mm = reg['14_mle_map_overfit'].math; near('14 MAP n=3 h=3 Beta(5,5)', mm.map(3, 3, 5), 7 / 11); near('14 MAP n=10 h=8', mm.map(10, 8, 5), 12 / 18); near('14 MLE n=3 h=3', mm.mle(3, 3), 1);
// 15 ROC
near('15 AUC d′=1.5', reg['15_roc_threshold_dial'].math.auc(1.5), 0.8556, 1e-3);
// 16 perceptron converges on separable data, logistic error small
const pl = reg['16_perceptron_logistic'].math, D = pl.data(), w = [0, 0, 0]; let upd = 1, ep = 0; while (upd && ep < 100) { upd = pl.epoch(w, D.X, D.y, D.X.map((_, i) => i)); ep++; }
truthy(`16 perceptron converged in ${ep} epochs`, upd === 0);
const wl = pl.logistic(D.X, D.y, 1500, 0.5); truthy('16 logistic misclassifies ≤ 2 points', pl.errors(wl, D.X, D.y) <= 2);
// 17 MLP XOR
const mx = reg['17_mlp_xor'].math, net = mx.init(4, 1); const loss = mx.train(net, 6000, 0.3);
truthy(`17 MLP(4) solves XOR, loss ${loss.toFixed(4)}`, mx.X.every((x, i) => (mx.forward(net, x).p > 0.5 ? 1 : 0) === mx.Y[i]) && loss < 0.05);
const f = mx.rbf([0, 0], 0.5); near('17 RBF φ(0,0) = (1, e^-4)', f[1], Math.exp(-4), 1e-9);
// 18 kNN
const kn = reg['18_knn_boundary'].math, KD = kn.data(); near('18 1-NN training accuracy = 100%', kn.accuracy(KD.X, KD.y, 1, false), 1);
// 19 PCA vs LDA: PCA ≈ horizontal, LDA ≈ vertical
const pc = reg['19_pca_vs_lda'].math, PD = pc.data(); const pa = Math.abs(Math.cos(pc.pcaAngle(PD))), la = Math.abs(Math.sin(pc.ldaAngle(PD)));
truthy(`19 PCA axis near horizontal (|cos| = ${pa.toFixed(3)})`, pa > 0.98); truthy(`19 LDA axis near vertical (|sin| = ${la.toFixed(3)})`, la > 0.97);
truthy('19 LDA maximises J vs PCA', pc.along(PD, pc.ldaAngle(PD)).J > pc.along(PD, pc.pcaAngle(PD)).J * 5);
// 20 k-means monotone SSE
const km = reg['20_kmeans_steps'].math, KX = km.data(); let Cs = [[1, 1], [1.5, 1], [1.2, 0.5]], lab = km.assign(KX, Cs), prev = Infinity, mono = true;
for (let i = 0; i < 20; i++) { Cs = km.move(KX, lab, Cs); const s1 = km.sse(KX, lab, Cs); if (s1 > prev + 1e-9) mono = false; lab = km.assign(KX, Cs); const s2 = km.sse(KX, lab, Cs); if (s2 > s1 + 1e-9) mono = false; prev = s2; }
truthy('20 K-means SSE never increases', mono);
// 21 SVM: Pegasos close to exact soft-margin solution (dual coordinate descent with the same objective)
const sm = reg['21_svm_margin_C'].math, SD = sm.data();
function dcd(X, y, C) { // exact-ish solver: projected gradient on the primal via many full-batch subgradient + polishing (reference)
  let w = [0, 0], b = 0; const n = X.length;
  for (let t = 1; t <= 200000; t++) {
    const eta = 0.5 / Math.sqrt(t); let g = [w[0], w[1]], gb = 0;
    for (let i = 0; i < n; i++) if (y[i] * (w[0] * X[i][0] + w[1] * X[i][1] + b) < 1) { g[0] -= C * y[i] * X[i][0]; g[1] -= C * y[i] * X[i][1]; gb -= C * y[i]; }
    const scale = eta / (1 + C * n / 10); w = [w[0] - scale * g[0], w[1] - scale * g[1]]; b -= scale * gb;
  }
  return { w, b };
}
for (const C of [0.05, 1]) {
  const a = sm.pegasos(SD.X, SD.y, C, 60000, 7), ref = dcd(SD.X, SD.y, C);
  const oa = sm.objective(SD.X, SD.y, C, a.w, a.b), or = sm.objective(SD.X, SD.y, C, ref.w, ref.b);
  truthy(`21 Pegasos objective within 3% of reference at C=${C} (${oa.toFixed(3)} vs ${or.toFixed(3)})`, oa <= or * 1.03 + 1e-3);
}
const m1 = sm.margin(sm.pegasos(SD.X, SD.y, 0.05).w), m2 = sm.margin(sm.pegasos(SD.X, SD.y, 50).w);
truthy(`21 margin shrinks as C grows (${m1.toFixed(2)} -> ${m2.toFixed(2)})`, m1 > m2);

console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
