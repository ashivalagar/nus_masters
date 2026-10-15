/* Stats page: uses the server's /api/stats when available, otherwise this browser's own data. Plus export/import. */
(function () {
  'use strict';
  var S = window.MMStore, App = window.MMApp, $ = App.$, $$ = App.$$, esc = App.esc;
  var MM = window.MM || { cards: [], concepts: [], weeks: [] };
  var root = $('[data-stats]');
  if (!root) return;
  var DAY = 864e5;

  function whenSyncKnown(cb) {
    var t0 = Date.now();
    (function wait() { var st = S.sync.state; if (st !== 'probing' || Date.now() - t0 > 4000) cb(st); else setTimeout(wait, 80); })();
  }

  /* -------- local fallback: same shape as the server's /api/stats */
  function localStats() {
    var events = []; try { events = JSON.parse(S._raw('mm:__events') || '[]'); } catch (e) { events = []; }
    var minutes = {}, studied = {};
    events.forEach(function (ev) { var d = S.dayOf(new Date(ev.ts)); if (ev.type === 'active_minute') minutes[d] = (minutes[d] || 0) + 1; });
    S.keys('day:').forEach(function (k) { if (S.get(k, 0)) studied[k.slice(4)] = 1; });
    return build(minutes, studied, function (k, d) { return S.get(k, d); }, 'this browser');
  }
  function build(minutes, studied, get, source) {
    var today = S.today(), days30 = [];
    for (var i = 29; i >= 0; i--) { var d = S.dayOf(new Date(Date.now() - i * DAY)); days30.push({ day: d, minutes: minutes[d] || 0 }); }
    var streak = 0, cur = new Date(); if (!studied[S.dayOf(cur)]) cur = new Date(cur.getTime() - DAY);
    while (studied[S.dayOf(cur)]) { streak++; cur = new Date(cur.getTime() - DAY); }
    var mastery = {}; ['foundations', 'EE5101', 'EE5907'].forEach(function (t) { mastery[t] = { new: 0, learning: 0, solid: 0, total: 0 }; });
    (MM.concepts || []).forEach(function (c) { var m = get('mastery:' + c.slug, 'new'); mastery[c.track][m] = (mastery[c.track][m] || 0) + 1; mastery[c.track].total++; });
    var now = Date.now(), due = 0, weak = [];
    (MM.cards || []).forEach(function (c) { var s = get('card:' + c.id, null); if (!s || s.due <= now) due++; if (s && s.wrong > s.right) weak.push({ id: c.id, slug: c.slug, title: c.title, q: c.q, right: s.right, wrong: s.wrong, box: s.box }); });
    weak.sort(function (a, b) { return (b.wrong - b.right) - (a.wrong - a.right) || a.box - b.box; });
    var stepsDone = 0, stepsTotal = 0; (MM.weeks || []).forEach(function (w) { w.sessions.forEach(function (s) { s.steps.forEach(function (st) { stepsTotal++; if (get('step:' + st.id, 0)) stepsDone++; }); }); });
    var heat = []; var monday = new Date(Date.parse(today + 'T00:00:00+08:00')); var dow = (new Date(Date.parse(today + 'T12:00:00+08:00')).getUTCDay() + 6) % 7;
    var start = new Date(monday.getTime() - (dow + 7 * 7) * DAY);
    for (var w = 0; w < 8; w++) { var row = []; for (var k = 0; k < 7; k++) { var dd = S.dayOf(new Date(start.getTime() + (w * 7 + k) * DAY + 12 * 3600e3)); row.push({ day: dd, minutes: minutes[dd] || 0, future: dd > today }); } heat.push(row); }
    var week = days30.slice(-7).reduce(function (a, b) { return a + b.minutes; }, 0);
    return { source: source, streak: streak, today: today, minutesPerDay: days30, minutes7: week, minutes30: days30.reduce(function (a, b) { return a + b.minutes; }, 0), mastery: mastery, cardsDue: due, cardsTotal: (MM.cards || []).length, weakCards: weak.slice(0, 10), steps: { done: stepsDone, total: stepsTotal }, heatmap: heat };
  }

  function fmtMin(m) { var h = Math.floor(m / 60), r = m % 60; return h ? h + ' h ' + (r ? r + ' min' : '') : m + ' min'; }
  function render(st) {
    var tiles = [
      [st.streak, st.streak === 1 ? 'study day in a row' : 'study days in a row'],
      [fmtMin(st.minutes7), 'studied in the last 7 days'],
      [fmtMin(st.minutes30), 'studied in the last 30 days'],
      [st.steps.done + ' / ' + st.steps.total, 'learning-path steps done'],
      [st.cardsDue, 'cards due for review'],
    ];
    $('[data-stat-tiles]').innerHTML = tiles.map(function (t) { return '<div class="stat"><p class="stat-v">' + esc(String(t[0])) + '</p><p class="stat-l">' + esc(t[1]) + '</p></div>'; }).join('');
    // minutes bar chart (SVG, single series, hover tooltips)
    var data = st.minutesPerDay, max = Math.max(30, Math.max.apply(null, data.map(function (d) { return d.minutes; })));
    var top = Math.ceil(max / 30) * 30, W = 600, H = 180, pl = 34, pb = 22, bw = (W - pl) / data.length;
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Minutes studied per day for the last 30 days" preserveAspectRatio="none">';
    for (var g = 0; g <= 3; g++) { var y = H - pb - (H - pb - 8) * g / 3; svg += '<line class="grid" x1="' + pl + '" x2="' + W + '" y1="' + y + '" y2="' + y + '"/><text class="ax" x="' + (pl - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + Math.round(top * g / 3) + '</text>'; }
    data.forEach(function (d, i) {
      var h = (H - pb - 8) * d.minutes / top, x = pl + i * bw + Math.max(1, (bw - Math.min(24, bw - 2)) / 2), w2 = Math.min(24, bw - 2), y2 = H - pb - h;
      var label = new Date(d.day + 'T12:00:00+08:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Singapore' });
      svg += '<g class="bar-g" tabindex="0" data-tip="' + esc(label + ': ' + d.minutes + ' min') + '"><rect class="hit" x="' + (pl + i * bw) + '" y="0" width="' + bw + '" height="' + (H - pb) + '"/>' + (h > 0 ? '<path class="bar" d="M' + x + ' ' + (H - pb) + 'V' + (y2 + Math.min(4, h)) + 'q0 -' + Math.min(4, h) + ' ' + Math.min(4, h) + ' -' + Math.min(4, h) + 'H' + (x + w2 - Math.min(4, h)) + 'q' + Math.min(4, h) + ' 0 ' + Math.min(4, h) + ' ' + Math.min(4, h) + 'V' + (H - pb) + 'Z"/>' : '') + '</g>';
      if (i % 7 === 0 || i === data.length - 1) svg += '<text class="ax" x="' + (pl + i * bw + bw / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(i === data.length - 1 ? 'today' : label.replace(/^\w+ /, '')) + '</text>';
    });
    svg += '</svg><div class="tip" hidden></div>';
    var bars = $('[data-minutes]'); bars.innerHTML = svg;
    var tip = $('.tip', bars);
    $$('.bar-g', bars).forEach(function (gEl) {
      var show = function () { var r = gEl.getBoundingClientRect(), rb = bars.getBoundingClientRect(); tip.hidden = false; tip.textContent = gEl.getAttribute('data-tip'); tip.style.left = (r.left - rb.left + r.width / 2) + 'px'; tip.style.top = '0px'; gEl.classList.add('on'); };
      var hide = function () { tip.hidden = true; gEl.classList.remove('on'); };
      gEl.addEventListener('mouseenter', show); gEl.addEventListener('focus', show); gEl.addEventListener('mouseleave', hide); gEl.addEventListener('blur', hide);
    });
    // heatmap
    var hmax = 1; st.heatmap.forEach(function (r) { r.forEach(function (c) { hmax = Math.max(hmax, c.minutes); }); });
    $('[data-heat]').innerHTML = '<div class="heat-grid"><span></span>' + ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(function (d) { return '<span class="hd">' + d + '</span>'; }).join('') +
      st.heatmap.map(function (row) { return '<span class="hd hw">' + esc(new Date(row[0].day + 'T12:00:00+08:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Singapore' })) + '</span>' + row.map(function (c) { var lv = c.future ? -1 : c.minutes === 0 ? 0 : Math.min(4, 1 + Math.floor(3.999 * c.minutes / hmax)); return '<span class="cell l' + lv + '" title="' + esc(c.day + ': ' + c.minutes + ' min') + '"></span>'; }).join(''); }).join('') + '</div>' +
      '<p class="heat-key">less <span class="cell l0"></span><span class="cell l1"></span><span class="cell l2"></span><span class="cell l3"></span><span class="cell l4"></span> more</p>';
    // mastery
    var names = { foundations: 'Math Foundations', EE5101: 'Linear Systems (EE5101)', EE5907: 'Pattern Recognition (EE5907)' };
    $('[data-mastery-stats]').innerHTML = Object.keys(names).map(function (t) {
      var m = st.mastery[t] || { solid: 0, learning: 0, total: 0 };
      return '<div class="meter meter-' + t + '"><p class="meter-label"><span class="chip chip-' + t + '"><span class="dot"></span>' + names[t] + '</span><span>' + m.solid + ' solid, ' + m.learning + ' learning, of ' + m.total + '</span></p><div class="meter-bar"><span class="meter-learning" style="width:' + (m.total ? m.learning / m.total * 100 : 0) + '%"></span><span class="meter-solid" style="width:' + (m.total ? m.solid / m.total * 100 : 0) + '%"></span></div></div>';
    }).join('');
    var bySlug = {}; (MM.concepts || []).forEach(function (c) { bySlug[c.slug] = c; });
    var wk = $('[data-weak]');
    wk.innerHTML = st.weakCards.length ? st.weakCards.map(function (c) { var con = bySlug[c.slug]; return '<li><div class="weak-q">' + c.q + '</div><p class="weak-meta">' + (con ? '<a href="' + App.root + con.url + '#self-test">' + esc(con.title) + '</a>' : '') + '<span>' + c.right + ' right, ' + c.wrong + ' missed</span></p></li>'; }).join('')
      : '<li class="muted">No weak cards yet. Cards you miss more often than you get right will collect here.</li>';
    $('[data-stats-lede]').textContent = st.source === 'server' ? 'Combined across every device that syncs with your server.' : 'From this browser only. Run the bundled server (npm start) to combine your phone and laptop.';
  }

  whenSyncKnown(function (state) {
    if (state === 'ok' || state === 'syncing') {
      S.sync.flush().then(function () { return S.sync.req('GET', 'stats?tz=Asia/Singapore'); }).then(function (st) { st.source = 'server'; render(st); }).catch(function () { render(localStats()); });
    } else render(localStats());
  });

  /* -------- export / import */
  var note = $('[data-import-note]');
  $('[data-export]').addEventListener('click', function () {
    if (S.sync.state === 'ok' || S.sync.state === 'syncing') { location.href = App.root + 'api/export'; return; }
    var items = {}, ts = S._ts();
    S.keys('').forEach(function (k) { items['mm:' + k] = { v: S._raw('mm:' + k), t: ts['mm:' + k] || 0 }; });
    var events = []; try { events = JSON.parse(S._raw('mm:__events') || '[]'); } catch (e) { /* ignore */ }
    var blob = new Blob([JSON.stringify({ format: 'masters-mind-export', version: 1, exported_at: new Date().toISOString(), source: 'browser', state: items, events: events }, null, 1)], { type: 'application/json' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'masters-mind-progress-' + S.today() + '.json'; document.body.appendChild(a); a.click(); a.remove();
  });
  $('[data-import]').addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0]; if (!f) return;
    f.text().then(function (txt) {
      var data = JSON.parse(txt);
      if (!data || data.format !== 'masters-mind-export') throw new Error('This is not a Masters Mind export file.');
      if (S.sync.state === 'ok' || S.sync.state === 'syncing') {
        return S.sync.req('POST', 'import', data).then(function (r) { note.textContent = 'Imported ' + r.state + ' items and ' + r.events + ' events.'; return S.sync.pull(true); });
      }
      var n = S.sync.applyRemote(data.state || {});
      note.textContent = 'Imported ' + n + ' newer items into this browser.';
    }).then(function () { App.refresh(); }).catch(function (err) { note.textContent = 'Import failed: ' + err.message; });
  });
})();
