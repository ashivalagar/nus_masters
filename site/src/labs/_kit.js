/* Lab kit: tiny shared helpers for the interactive labs (no dependencies).
 *
 *   MMLab.register({ id, title, idea, predict, notice, math, setup(ui) })
 *   MMLab.mount(element, id)
 *
 * A lab's setup(ui) builds its canvases and controls through `ui`, and sets
 * ui.draw = function () {...} which the kit calls on every change, resize and
 * theme switch. Pure numerics live in `math` so they can be unit-tested in node
 * (see scripts/test-labs.mjs). Nothing here touches the DOM at load time.
 */
(function () {
  'use strict';
  var registry = {};

  /* ------------------------------------------------------------ numerics */
  var M = {
    rng: function (seed) { // mulberry32
      var a = seed >>> 0;
      return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    },
    randn: function (rnd) { var u = 0, v = 0; while (u === 0) u = rnd(); while (v === 0) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); },
    blob: function (rnd, n, mx, my, sx, sy) { var out = []; for (var i = 0; i < n; i++) out.push([mx + sx * M.randn(rnd), my + (sy == null ? sx : sy) * M.randn(rnd)]); return out; },
    /** eigenvalues/vectors of [[a,b],[c,d]] */
    eig2: function (a, b, c, d) {
      var tr = a + d, det = a * d - b * c, disc = tr * tr / 4 - det;
      if (disc >= -1e-12) {
        var s = Math.sqrt(Math.max(0, disc)), l1 = tr / 2 + s, l2 = tr / 2 - s;
        var vec = function (l) {
          var v = Math.abs(b) > 1e-12 ? [b, l - a] : Math.abs(c) > 1e-12 ? [l - d, c] : (Math.abs(l - a) < 1e-12 ? [1, 0] : [0, 1]);
          var n = Math.hypot(v[0], v[1]) || 1; return [v[0] / n, v[1] / n];
        };
        var v1 = vec(l1), v2 = vec(l2);
        // repeated eigenvalue with a full eigenspace (scalar matrix)
        if (Math.abs(b) < 1e-12 && Math.abs(c) < 1e-12) { v1 = [1, 0]; v2 = [0, 1]; if (a < d) { var tmp = l1; l1 = l2; l2 = tmp; v1 = [0, 1]; v2 = [1, 0]; } }
        return { real: true, l1: l1, l2: l2, v1: v1, v2: v2, tr: tr, det: det };
      }
      var w = Math.sqrt(-disc);
      return { real: false, re: tr / 2, im: w, tr: tr, det: det };
    },
    det2: function (A) { return A[0][0] * A[1][1] - A[0][1] * A[1][0]; },
    mul2: function (A, B) { return [[A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]], [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]]]; },
    mv2: function (A, v) { return [A[0][0] * v[0] + A[0][1] * v[1], A[1][0] * v[0] + A[1][1] * v[1]]; },
    inv2: function (A) { var d = M.det2(A); return [[A[1][1] / d, -A[0][1] / d], [-A[1][0] / d, A[0][0] / d]]; },
    T2: function (A) { return [[A[0][0], A[1][0]], [A[0][1], A[1][1]]]; },
    add2: function (A, B, s) { s = s == null ? 1 : s; return [[A[0][0] + s * B[0][0], A[0][1] + s * B[0][1]], [A[1][0] + s * B[1][0], A[1][1] + s * B[1][1]]]; },
    scale2: function (A, s) { return [[A[0][0] * s, A[0][1] * s], [A[1][0] * s, A[1][1] * s]]; },
    /** classical RK4 for x' = f(t, x), x an array */
    rk4: function (f, x0, t0, t1, n) {
      var h = (t1 - t0) / n, x = x0.slice(), out = [{ t: t0, x: x.slice() }];
      for (var i = 0; i < n; i++) {
        var t = t0 + i * h;
        var k1 = f(t, x), k2 = f(t + h / 2, x.map(function (v, j) { return v + h / 2 * k1[j]; }));
        var k3 = f(t + h / 2, x.map(function (v, j) { return v + h / 2 * k2[j]; })), k4 = f(t + h, x.map(function (v, j) { return v + h * k3[j]; }));
        x = x.map(function (v, j) { return v + h / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]); });
        out.push({ t: t + h, x: x.slice() });
      }
      return out;
    },
    erf: function (x) { // Abramowitz-Stegun 7.1.26, |err| < 1.5e-7
      var s = x < 0 ? -1 : 1; x = Math.abs(x);
      var t = 1 / (1 + 0.3275911 * x);
      var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
      return s * y;
    },
    Phi: function (z) { return 0.5 * (1 + M.erf(z / Math.SQRT2)); },
    npdf: function (x, mu, s) { return Math.exp(-0.5 * ((x - mu) / s) * ((x - mu) / s)) / (s * Math.sqrt(2 * Math.PI)); },
    sigmoid: function (z) { return z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z)); },
    linspace: function (a, b, n) { var o = []; for (var i = 0; i < n; i++) o.push(a + (b - a) * i / (n - 1)); return o; },
    clamp: function (v, a, b) { return Math.max(a, Math.min(b, v)); },
    fmt: function (v, d) { if (!isFinite(v)) return v > 0 ? '∞' : v < 0 ? '−∞' : '—'; d = d == null ? 2 : d; var s = (Math.abs(v) < 1e-12 ? 0 : v).toFixed(d); return s.replace('-', '−'); },
  };

  /* ------------------------------------------------------------ colours */
  function palette() {
    var cs = getComputedStyle(document.documentElement);
    var g = function (n, d) { return (cs.getPropertyValue(n) || d).trim() || d; };
    return {
      ink: g('--ink', '#18202b'), ink2: g('--ink-2', '#47515f'), ink3: g('--ink-3', '#5f6876'),
      rule: g('--rule', '#d6dad0'), rule2: g('--rule-strong', '#b9bfb3'), grid: g('--grid', 'rgba(0,0,0,.05)'),
      bg: g('--sheet', '#fbfbf8'), bg2: g('--sheet-2', '#eceee7'), paper: g('--paper', '#f3f4ef'),
      s1: g('--s1', '#2a78d6'), s2: g('--s2', '#eb6834'), s3: g('--s3', '#1baf7a'), neutral: g('--s-neutral', '#9aa1a9'),
      good: g('--good', '#2e7d32'), bad: g('--s2', '#eb6834'),
      found: g('--found', '#a86b00'), ee5101: g('--ee5101', '#009487'), ee5907: g('--ee5907', '#6a3fb5'),
      dark: document.documentElement.getAttribute('data-eff') === 'dark',
    };
  }
  function hexA(hex, a) {
    if (hex.indexOf('rgb') === 0) return hex.replace(/rgba?\(([^)]+)\)/, function (_, inner) { var p = inner.split(',').slice(0, 3); return 'rgba(' + p.join(',') + ',' + a + ')'; });
    var h = hex.replace('#', ''); if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(h, 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function rgbOf(hex) { var h = hex.replace('#', ''); var n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

  /* ------------------------------------------------------------ plot */
  function Plot(canvas, opts) {
    this.c = canvas; this.ctx = canvas.getContext('2d'); this.o = opts || {};
    this.w = 300; this.h = 200; this.pad = this.o.pad || { l: 34, r: 10, t: 10, b: 24 };
    this.view = { x0: -1, x1: 1, y0: -1, y1: 1 };
    this.col = palette();
  }
  Plot.prototype.resize = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    var w = Math.max(200, this.c.parentNode.clientWidth);
    var h = Math.round(Math.min(this.o.maxH || 520, Math.max(this.o.minH || 180, w * (this.o.aspect || 0.62))));
    this.w = w; this.h = h;
    this.c.width = Math.round(w * dpr); this.c.height = Math.round(h * dpr);
    this.c.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.dpr = dpr;
  };
  Plot.prototype.setView = function (x0, x1, y0, y1, equal) {
    var v = { x0: x0, x1: x1, y0: y0, y1: y1 };
    if (equal) { // expand the range so one unit is the same length on both axes
      var pw = this.w - this.pad.l - this.pad.r, ph = this.h - this.pad.t - this.pad.b;
      var sx = pw / (x1 - x0), sy = ph / (y1 - y0);
      if (sx > sy) { var cx = (x0 + x1) / 2, hw = pw / sy / 2; v.x0 = cx - hw; v.x1 = cx + hw; }
      else { var cy = (y0 + y1) / 2, hh = ph / sx / 2; v.y0 = cy - hh; v.y1 = cy + hh; }
    }
    this.view = v; return this;
  };
  Plot.prototype.X = function (x) { var v = this.view; return this.pad.l + (x - v.x0) / (v.x1 - v.x0) * (this.w - this.pad.l - this.pad.r); };
  Plot.prototype.Y = function (y) { var v = this.view; return this.h - this.pad.b - (y - v.y0) / (v.y1 - v.y0) * (this.h - this.pad.t - this.pad.b); };
  Plot.prototype.inv = function (px, py) { var v = this.view; return [v.x0 + (px - this.pad.l) / (this.w - this.pad.l - this.pad.r) * (v.x1 - v.x0), v.y0 + (this.h - this.pad.b - py) / (this.h - this.pad.t - this.pad.b) * (v.y1 - v.y0)]; };
  Plot.prototype.clear = function () { this.col = palette(); var c = this.ctx; c.clearRect(0, 0, this.w, this.h); c.fillStyle = this.col.bg; c.fillRect(0, 0, this.w, this.h); return this; };
  Plot.prototype.clipOn = function () { var c = this.ctx; c.save(); c.beginPath(); c.rect(this.pad.l, this.pad.t, this.w - this.pad.l - this.pad.r, this.h - this.pad.t - this.pad.b); c.clip(); };
  Plot.prototype.clipOff = function () { this.ctx.restore(); };
  function niceStep(range, target) { var raw = range / target, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p; return (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p; }
  Plot.prototype.grid = function (o) {
    o = o || {}; var c = this.ctx, v = this.view, col = this.col;
    var xs = o.xstep || niceStep(v.x1 - v.x0, Math.max(3, this.w / 90)), ys = o.ystep || niceStep(v.y1 - v.y0, Math.max(3, this.h / 60));
    c.save(); c.lineWidth = 1; c.strokeStyle = col.rule; c.globalAlpha = 0.7;
    c.font = '11px ' + getComputedStyle(document.body).getPropertyValue('--sans'); c.fillStyle = col.ink3;
    var x, y;
    for (x = Math.ceil(v.x0 / xs) * xs; x <= v.x1 + 1e-9; x += xs) { var px = Math.round(this.X(x)) + 0.5; c.beginPath(); c.moveTo(px, this.pad.t); c.lineTo(px, this.h - this.pad.b); c.stroke(); }
    for (y = Math.ceil(v.y0 / ys) * ys; y <= v.y1 + 1e-9; y += ys) { var py = Math.round(this.Y(y)) + 0.5; c.beginPath(); c.moveTo(this.pad.l, py); c.lineTo(this.w - this.pad.r, py); c.stroke(); }
    c.globalAlpha = 1;
    if (o.labels !== false) {
      c.textAlign = 'center'; c.textBaseline = 'top';
      var fx = o.fx || function (t) { return M.fmt(t, xs < 1 ? (xs < 0.1 ? 2 : 1) : 0); }, fy = o.fy || function (t) { return M.fmt(t, ys < 1 ? (ys < 0.1 ? 2 : 1) : 0); };
      var pxX = Math.abs(this.X(xs) - this.X(0)), pxY = Math.abs(this.Y(ys) - this.Y(0));
      var sx = Math.max(1, Math.ceil(34 / pxX)), sy = Math.max(1, Math.ceil(20 / pxY)), ix = 0, iy = 0;
      for (x = Math.ceil(v.x0 / xs) * xs; x <= v.x1 + 1e-9; x += xs, ix++) if (Math.round(x / xs) % sx === 0) c.fillText(fx(Math.abs(x) < 1e-9 ? 0 : x), this.X(x), this.h - this.pad.b + 5);
      c.textAlign = 'right'; c.textBaseline = 'middle';
      for (y = Math.ceil(v.y0 / ys) * ys; y <= v.y1 + 1e-9; y += ys, iy++) if (Math.round(y / ys) % sy === 0) c.fillText(fy(Math.abs(y) < 1e-9 ? 0 : y), this.pad.l - 5, this.Y(y));
    }
    if (o.axes !== false) {
      c.strokeStyle = col.ink3; c.lineWidth = 1;
      if (v.x0 < 0 && v.x1 > 0) { c.beginPath(); c.moveTo(Math.round(this.X(0)) + 0.5, this.pad.t); c.lineTo(Math.round(this.X(0)) + 0.5, this.h - this.pad.b); c.stroke(); }
      if (v.y0 < 0 && v.y1 > 0) { c.beginPath(); c.moveTo(this.pad.l, Math.round(this.Y(0)) + 0.5); c.lineTo(this.w - this.pad.r, Math.round(this.Y(0)) + 0.5); c.stroke(); }
    }
    if (o.xlabel) { c.textAlign = 'right'; c.textBaseline = 'bottom'; c.fillStyle = col.ink3; c.fillText(o.xlabel, this.w - this.pad.r - 2, this.h - this.pad.b - 3); }
    if (o.ylabel) { c.textAlign = 'left'; c.textBaseline = 'top'; c.fillStyle = col.ink3; c.fillText(o.ylabel, this.pad.l + 4, this.pad.t + 2); }
    c.restore(); return this;
  };
  Plot.prototype.line = function (pts, o) {
    o = o || {}; var c = this.ctx; if (!pts.length) return this;
    c.save(); c.strokeStyle = o.color || this.col.s1; c.lineWidth = o.width || 2; c.lineJoin = 'round'; c.lineCap = 'round'; c.globalAlpha = o.alpha == null ? 1 : o.alpha;
    if (o.dash) c.setLineDash(o.dash);
    c.beginPath();
    var started = false;
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i]; if (!p || !isFinite(p[0]) || !isFinite(p[1])) { started = false; continue; }
      var px = this.X(p[0]), py = M.clamp(this.Y(p[1]), -5000, 5000);
      if (!started) { c.moveTo(px, py); started = true; } else c.lineTo(px, py);
    }
    c.stroke(); c.restore(); return this;
  };
  Plot.prototype.fn = function (f, o) { o = o || {}; var v = this.view, n = o.n || Math.max(100, Math.round(this.w)), pts = []; for (var i = 0; i <= n; i++) { var x = v.x0 + (v.x1 - v.x0) * i / n; pts.push([x, f(x)]); } return this.line(pts, o); };
  Plot.prototype.area = function (f, g, x0, x1, color, alpha) {
    var c = this.ctx, n = Math.max(60, Math.round(this.w / 2)), i, x;
    c.save(); c.fillStyle = color; c.globalAlpha = alpha == null ? 0.15 : alpha; c.beginPath();
    for (i = 0; i <= n; i++) { x = x0 + (x1 - x0) * i / n; var px = this.X(x), py = this.Y(f(x)); if (i) c.lineTo(px, py); else c.moveTo(px, py); }
    for (i = n; i >= 0; i--) { x = x0 + (x1 - x0) * i / n; c.lineTo(this.X(x), this.Y(g(x))); }
    c.closePath(); c.fill(); c.restore(); return this;
  };
  Plot.prototype.poly = function (pts, o) {
    o = o || {}; var c = this.ctx; c.save(); c.beginPath();
    pts.forEach(function (p, i) { var px = this.X(p[0]), py = this.Y(p[1]); if (i) c.lineTo(px, py); else c.moveTo(px, py); }, this);
    c.closePath();
    if (o.fill) { c.fillStyle = o.fill; c.globalAlpha = o.alpha == null ? 0.3 : o.alpha; c.fill(); c.globalAlpha = 1; }
    if (o.stroke) { c.strokeStyle = o.stroke; c.lineWidth = o.width || 1.5; if (o.dash) c.setLineDash(o.dash); c.stroke(); }
    c.restore(); return this;
  };
  Plot.prototype.dot = function (x, y, o) {
    o = o || {}; var c = this.ctx, r = o.r || 4.5;
    c.save(); c.beginPath(); c.arc(this.X(x), this.Y(y), r, 0, 2 * Math.PI);
    if (o.ring !== false) { c.lineWidth = 2; c.strokeStyle = o.ringColor || this.col.bg; c.stroke(); }
    c.fillStyle = o.color || this.col.s1; c.globalAlpha = o.alpha == null ? 1 : o.alpha; c.fill(); c.restore();
    if (o.halo) { c.save(); c.beginPath(); c.arc(this.X(x), this.Y(y), r + 4, 0, 2 * Math.PI); c.lineWidth = 1.6; c.strokeStyle = o.halo; c.stroke(); c.restore(); }
    return this;
  };
  Plot.prototype.cross = function (x, y, o) {
    o = o || {}; var c = this.ctx, r = o.r || 6, px = this.X(x), py = this.Y(y);
    c.save(); c.strokeStyle = this.col.bg; c.lineWidth = (o.width || 2.5) + 3; c.lineCap = 'round';
    c.beginPath(); c.moveTo(px - r, py - r); c.lineTo(px + r, py + r); c.moveTo(px + r, py - r); c.lineTo(px - r, py + r); c.stroke();
    c.strokeStyle = o.color || this.col.ink; c.lineWidth = o.width || 2.5; c.stroke(); c.restore(); return this;
  };
  Plot.prototype.arrow = function (x0, y0, x1, y1, o) {
    o = o || {}; var c = this.ctx, ax = this.X(x0), ay = this.Y(y0), bx = this.X(x1), by = this.Y(y1);
    var ang = Math.atan2(by - ay, bx - ax), len = Math.hypot(bx - ax, by - ay), hl = Math.min(o.head || 10, len * 0.45);
    c.save(); c.strokeStyle = c.fillStyle = o.color || this.col.ink; c.lineWidth = o.width || 2.2; c.lineCap = 'round'; c.globalAlpha = o.alpha == null ? 1 : o.alpha;
    if (o.dash) c.setLineDash(o.dash);
    c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx - Math.cos(ang) * hl * 0.6, by - Math.sin(ang) * hl * 0.6); c.stroke();
    c.setLineDash([]);
    c.beginPath(); c.moveTo(bx, by); c.lineTo(bx - hl * Math.cos(ang - 0.42), by - hl * Math.sin(ang - 0.42)); c.lineTo(bx - hl * Math.cos(ang + 0.42), by - hl * Math.sin(ang + 0.42)); c.closePath(); c.fill();
    c.restore(); return this;
  };
  Plot.prototype.text = function (s, x, y, o) {
    o = o || {}; var c = this.ctx;
    c.save(); c.font = (o.weight || 600) + ' ' + (o.size || 12) + 'px ' + getComputedStyle(document.body).getPropertyValue('--sans');
    c.textAlign = o.align || 'left'; c.textBaseline = o.base || 'middle';
    var px = (o.px ? x : this.X(x)) + (o.dx || 0), py = (o.px ? y : this.Y(y)) + (o.dy || 0);
    if (o.halo !== false) { c.lineWidth = 4; c.strokeStyle = this.col.bg; c.lineJoin = 'round'; c.strokeText(s, px, py); }
    c.fillStyle = o.color || this.col.ink2; c.fillText(s, px, py); c.restore(); return this;
  };
  Plot.prototype.vline = function (x, o) { var v = this.view; return this.line([[x, v.y0], [x, v.y1]], Object.assign({ width: 1.5, color: this.col.ink3 }, o || {})); };
  Plot.prototype.hline = function (y, o) { var v = this.view; return this.line([[v.x0, y], [v.x1, y]], Object.assign({ width: 1.5, color: this.col.ink3 }, o || {})); };
  /** colour each cell by f(x, y) -> [r,g,b,a] (decision maps). */
  Plot.prototype.heat = function (f, res) {
    res = res || 4; var c = this.ctx;
    var x0 = Math.floor(this.pad.l), y0 = Math.floor(this.pad.t), W = Math.ceil(this.w - this.pad.l - this.pad.r), H = Math.ceil(this.h - this.pad.t - this.pad.b);
    var cols = Math.ceil(W / res), rows = Math.ceil(H / res);
    var off = document.createElement('canvas'); off.width = cols; off.height = rows;
    var oc = off.getContext('2d'), img = oc.createImageData(cols, rows);
    for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
      var p = this.inv(x0 + (i + 0.5) * res, y0 + (j + 0.5) * res), rgba = f(p[0], p[1]), k = (j * cols + i) * 4;
      img.data[k] = rgba[0]; img.data[k + 1] = rgba[1]; img.data[k + 2] = rgba[2]; img.data[k + 3] = rgba[3] == null ? 255 : rgba[3];
    }
    oc.putImageData(img, 0, 0);
    c.save(); c.imageSmoothingEnabled = true; c.drawImage(off, x0, y0, cols * res, rows * res); c.restore(); return this;
  };
  Plot.prototype.frame = function () { var c = this.ctx; c.save(); c.strokeStyle = this.col.rule; c.lineWidth = 1; c.strokeRect(this.pad.l + 0.5, this.pad.t + 0.5, this.w - this.pad.l - this.pad.r - 1, this.h - this.pad.t - this.pad.b - 1); c.restore(); return this; };

  /* ------------------------------------------------------------ mounting */
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var store = {
    get: function (k, d) { try { return window.MMStore ? window.MMStore.get(k, d) : d; } catch (e) { return d; } },
    set: function (k, v) { try { if (window.MMStore) window.MMStore.set(k, v); } catch (e) { /* ignore */ } },
    event: function (t, r, p) { try { if (window.MMStore) window.MMStore.event(t, r, p); } catch (e) { /* ignore */ } },
  };

  function mount(host, id) {
    var def = registry[id];
    if (!def) { host.innerHTML = '<p class="lab-error">Unknown lab ' + esc(id) + '.</p>'; return; }
    host.innerHTML = '';
    var root = el('section', 'lab locked'); root.setAttribute('aria-label', 'Interactive lab: ' + def.title);
    root.appendChild(el('header', 'lab-head', '<span class="lab-id">' + id.slice(0, 2) + '</span><h3 class="lab-title">' + esc(def.title) + '</h3><p class="lab-idea">' + esc(def.idea) + '</p>'));
    var pred = el('div', 'lab-predict'); root.appendChild(pred);
    var body = el('div', 'lab-body'); root.appendChild(body);
    var stage = el('div', 'lab-stage'); body.appendChild(stage);
    var side = el('div', 'lab-side'); body.appendChild(side);
    var controls = el('div', 'lab-controls'); side.appendChild(controls);
    controls.style.display = 'grid'; controls.style.gap = '.8rem';
    var notice = el('div', 'lab-notice'); root.appendChild(notice);
    host.appendChild(root);

    var plots = [], draw = function () {}, scheduled = false;
    var ui = {
      M: M, root: root, side: side, controls: controls, stage: stage, colors: palette, hexA: hexA, rgbOf: rgbOf,
      redraw: function () {
        if (scheduled) return; scheduled = true;
        requestAnimationFrame(function () { scheduled = false; try { ui.draw(); } catch (e) { console.error(e); } });
      },
      draw: function () {},
      columns: function (n) { stage.classList.toggle('two', n === 2); },
      canvas: function (opts) {
        opts = opts || {};
        var wrap = el('div', 'lab-canvas-wrap'), cv = el('canvas');
        if (opts.drag) cv.classList.add('drag');
        cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', opts.label || def.title);
        wrap.appendChild(cv);
        if (opts.cap) wrap.appendChild(el('p', 'lab-cap', esc(opts.cap)));
        (opts.into || stage).appendChild(wrap);
        var p = new Plot(cv, opts); p.resize(); plots.push(p);
        p.onPointer = function (h) {
          var dragging = false;
          var pos = function (e) { var r = cv.getBoundingClientRect(); return p.inv(e.clientX - r.left, e.clientY - r.top).concat([e.clientX - r.left, e.clientY - r.top]); };
          cv.addEventListener('pointerdown', function (e) { if (root.classList.contains('locked')) return; dragging = true; try { cv.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ } if (h.down) h.down(pos(e), e); });
          cv.addEventListener('pointermove', function (e) { if (dragging && h.move) h.move(pos(e), e); else if (!dragging && h.hover) h.hover(pos(e), e); });
          var up = function (e) { if (!dragging) return; dragging = false; if (h.up) h.up(pos(e), e); };
          cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
          cv.addEventListener('pointerleave', function (e) { if (!dragging && h.leave) h.leave(e); });
        };
        return p;
      },
      slider: function (o) {
        var wrap = el('div', 'ctl'), sid = 'l' + id + '-' + Math.random().toString(36).slice(2, 7);
        var toVal = function (s) { return o.log ? Math.pow(10, s) : s; }, toSlider = function (v) { return o.log ? Math.log10(v) : v; };
        wrap.innerHTML = '<div class="ctl-top"><label for="' + sid + '">' + o.label + '</label><output for="' + sid + '"></output></div>';
        var inp = el('input'); inp.type = 'range'; inp.id = sid;
        inp.min = o.log ? Math.log10(o.min) : o.min; inp.max = o.log ? Math.log10(o.max) : o.max; inp.step = o.step || (o.log ? 0.01 : (o.max - o.min) / 100);
        inp.value = toSlider(o.value);
        wrap.appendChild(inp); (o.into || controls).appendChild(wrap);
        var out = wrap.querySelector('output');
        var api = {
          get value() { return toVal(parseFloat(inp.value)); },
          set: function (v, quiet) { inp.value = toSlider(v); out.textContent = (o.fmt || function (x) { return M.fmt(x, 2); })(api.value); if (!quiet && o.onInput) o.onInput(api.value); ui.redraw(); },
          input: inp,
        };
        out.textContent = (o.fmt || function (x) { return M.fmt(x, 2); })(api.value);
        inp.addEventListener('input', function () { out.textContent = (o.fmt || function (x) { return M.fmt(x, 2); })(api.value); if (o.onInput) o.onInput(api.value); ui.redraw(); });
        return api;
      },
      buttons: function (list, into) {
        var row = el('div', 'btn-row'); (into || controls).appendChild(row);
        return list.map(function (b) {
          var btn = el('button', 'lab-btn' + (b.primary ? ' primary' : ''), esc(b.label)); btn.type = 'button';
          if (b.pressed != null) btn.setAttribute('aria-pressed', String(!!b.pressed));
          btn.addEventListener('click', function () { b.onClick(btn); ui.redraw(); });
          row.appendChild(btn); return btn;
        });
      },
      group: function (list, value, onChange, into) { // segmented, one pressed
        var btns = ui.buttons(list.map(function (it) {
          return { label: it.label, pressed: it.value === value, onClick: function (b) { btns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); onChange(it.value); } };
        }), into);
        return { set: function (v) { list.forEach(function (it, i) { btns[i].setAttribute('aria-pressed', String(it.value === v)); }); } };
      },
      readouts: function (rows, into) {
        var dl = el('dl', 'readouts'); (into || side).appendChild(dl);
        var map = {};
        rows.forEach(function (r) { var dt = el('dt', null, esc(r[1])), dd = el('dd', null, '—'); dl.appendChild(dt); dl.appendChild(dd); map[r[0]] = dd; });
        return { set: function (k, v) { if (map[k]) map[k].textContent = v; }, el: dl };
      },
      verdict: function (into) {
        var v = el('p', 'verdict'); v.setAttribute('aria-live', 'polite'); (into || side).appendChild(v);
        return { set: function (txt, tone) { v.textContent = txt; if (tone) v.setAttribute('data-tone', tone); else v.removeAttribute('data-tone'); } };
      },
      legend: function (items, into) {
        var p = el('p', 'legend'); (into || stage).appendChild(p);
        var paint = function () { var C = palette(); p.innerHTML = items.map(function (it) { var col = typeof it.color === 'function' ? it.color(C) : C[it.color] || it.color; return '<span><i class="' + (it.dot ? 'pt' : '') + '" style="background:' + col + (it.dash ? ';background:repeating-linear-gradient(90deg,' + col + ' 0 4px,transparent 4px 7px)' : '') + '"></i>' + esc(it.label) + '</span>'; }).join(''); };
        paint(); window.addEventListener('mm-theme', paint);
        return p;
      },
      note: function (html, into) { var p = el('p', 'muted small', html); p.style.margin = '0'; (into || side).appendChild(p); return p; },
      store: store,
    };

    /* predict-first gate */
    var PK = 'labpred:' + id;
    function unlock(guess) {
      root.classList.remove('locked');
      pred.innerHTML = guess && guess !== '__skip'
        ? '<p class="your-guess">Your guess: “' + esc(guess) + '”. Now play, then reveal what to notice.</p>'
        : '<p class="your-guess">No guess recorded. Try predicting next time; the surprise is the lesson.</p>';
      var redo = el('button', 'linkish skip-pred', 'Change my guess'); redo.type = 'button'; redo.addEventListener('click', function () { store.set(PK, null); renderPredict(); });
      pred.appendChild(redo);
      noticeBtn.disabled = false;
    }
    function commit(g) { store.set(PK, { guess: g, t: Date.now() }); store.event('lab_predict', id, { guess: g }); unlock(g); host.dispatchEvent(new CustomEvent('mm-lab-predicted', { bubbles: true })); }
    function renderPredict() {
      root.classList.add('locked'); noticeBtn.disabled = true; list.hidden = true; noticeBtn.setAttribute('aria-expanded', 'false'); noticeBtn.textContent = 'Reveal what to notice';
      var P = def.predict || { q: 'What do you expect to see?' };
      pred.innerHTML = '<p><b>Predict first</b>' + esc(P.q) + '</p>';
      if (P.options) {
        var opts = el('div', 'opts'); pred.appendChild(opts);
        P.options.forEach(function (o) { var b = el('button', null, esc(o)); b.type = 'button'; b.addEventListener('click', function () { commit(o); }); opts.appendChild(b); });
      } else {
        var row = el('div', 'free'); pred.appendChild(row);
        var inp = el('input'); inp.type = 'text'; inp.placeholder = 'Your guess, in a few words'; inp.setAttribute('aria-label', 'Your prediction');
        var go = el('button', 'lab-btn primary', 'Lock it in'); go.type = 'button';
        go.addEventListener('click', function () { if (inp.value.trim()) commit(inp.value.trim()); else inp.focus(); });
        inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') go.click(); });
        row.appendChild(inp); row.appendChild(go);
      }
      var skip = el('button', 'linkish skip-pred', 'Skip and just play'); skip.type = 'button';
      skip.addEventListener('click', function () { commit('__skip'); });
      var r2 = el('div', 'free'); r2.style.marginTop = '.4rem'; r2.appendChild(skip); pred.appendChild(r2);
    }
    var noticeBtn = el('button', 'lab-btn', 'Reveal what to notice'); noticeBtn.type = 'button'; noticeBtn.setAttribute('aria-expanded', 'false');
    var list = el('div'); list.hidden = true;
    list.innerHTML = '<ul>' + (def.notice || []).map(function (n) { return '<li>' + n + '</li>'; }).join('') + '</ul>';
    notice.appendChild(noticeBtn); notice.appendChild(list);
    noticeBtn.addEventListener('click', function () {
      var open = list.hidden; list.hidden = !open; noticeBtn.setAttribute('aria-expanded', String(open));
      noticeBtn.textContent = open ? 'Hide what to notice' : 'Reveal what to notice';
      if (open) {
        var g = store.get(PK, null);
        var gap = list.querySelector('.gap'); if (gap) gap.remove();
        if (g && g.guess && g.guess !== '__skip') list.appendChild(el('p', 'gap', 'You guessed “' + esc(g.guess) + '”. Where was the gap? Say it in one sentence.'));
        store.event('lab_notice', id);
      }
    });

    def.setup(ui);
    var saved = store.get(PK, null);
    if (saved && saved.guess) unlock(saved.guess); else renderPredict();

    var relayout = function () { plots.forEach(function (p) { p.resize(); }); ui.redraw(); };
    if (window.ResizeObserver) { var ro = new ResizeObserver(function () { relayout(); }); ro.observe(stage); }
    else window.addEventListener('resize', relayout);
    window.addEventListener('mm-theme', function () { ui.redraw(); });
    ui.redraw();
    store.event('lab_opened', id);
    return ui;
  }

  window.MMLab = { registry: registry, register: function (def) { registry[def.id] = def; }, mount: mount, M: M, Plot: Plot };
})();
