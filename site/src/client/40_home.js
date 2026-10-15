/* Home dashboard: today's focus, countdowns, deadlines, progress, rhythm, runway. */
(function () {
  'use strict';
  var S = window.MMStore, App = window.MMApp, $ = App.$, $$ = App.$$, esc = App.esc;
  var MM = window.MM || { weeks: [] };
  var DAY = 864e5;

  // countdowns can appear on the home and exams pages
  function paintCountdowns() {
    $$('[data-countdown]').forEach(function (el) {
      var t = Date.parse(el.getAttribute('data-countdown')), now = Date.now(), d = t - now;
      var num = $('[data-cd-days]', el), fine = $('[data-cd-fine]', el);
      if (d <= -3 * 3600e3) { num.textContent = '0'; if (fine) fine.textContent = 'Done. Well done.'; el.classList.add('cd-past'); return; }
      if (d <= 0) { num.textContent = '0'; if (fine) fine.textContent = 'Happening now. Good luck.'; return; }
      var days = Math.floor(d / DAY), hours = Math.floor((d % DAY) / 3600e3);
      num.textContent = String(days);
      if (fine) fine.textContent = days === 0 ? 'Today, in ' + hours + ' h' : 'and ' + hours + ' h';
    });
  }
  paintCountdowns(); setInterval(paintCountdowns, 60000);
  if (!$('.home')) return;

  var allSessions = [];
  MM.weeks.forEach(function (w) { w.sessions.forEach(function (s) { allSessions.push({ s: s, w: w }); }); });
  var today = S.today();

  function fmtToday() {
    try { return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Singapore', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()); }
    catch (e) { return today; }
  }
  function trackChip(c) { return '<span class="chip chip-' + c + '"><span class="dot" aria-hidden="true"></span>' + (c === 'foundations' ? 'Foundations' : c) + '</span>'; }

  function paintFocus() {
    $('[data-today-date]').textContent = fmtToday();
    var first = allSessions[0], last = allSessions[allSessions.length - 1];
    var cur = allSessions.filter(function (x) { return x.s.date === today; })[0];
    var next = allSessions.filter(function (x) { return x.s.date > today; })[0];
    var title = $('[data-focus-title]'), sub = $('[data-focus-sub]'), list = $('[data-focus-steps]'), go = $('[data-focus-go]');
    var pick, lead;
    if (cur) { pick = cur; lead = ''; }
    else if (today < first.s.date) { pick = first; lead = 'The plan starts ' + first.s.label + '. '; }
    else if (today > last.s.date) {
      title.textContent = 'Both finals are behind you';
      sub.textContent = 'The plan is complete. Keep the review deck going if you want to keep it fresh.';
      list.innerHTML = ''; go.textContent = 'Open Review'; go.href = App.root + 'review.html'; return;
    } else { pick = next; lead = 'No session today. Ten minutes of review keeps it warm. Next up: '; }
    var s = pick.s, p = App.sessionProgress(s);
    title.textContent = (cur ? '' : '') + s.title;
    sub.innerHTML = esc(lead) + (cur ? '' : '<strong>' + esc(s.label) + '</strong> ') + trackChip(s.course) + ' <span>' + p.done + ' of ' + p.total + ' steps, about ' + fmtMin(s.minutes) + '</span>';
    var undone = s.steps.filter(function (st) { return !App.isStepDone(st.id); });
    var show = (undone.length ? undone : s.steps).slice(0, 5);
    list.innerHTML = show.map(function (st) { return '<li class="' + (App.isStepDone(st.id) ? 'done' : '') + '"><span>' + esc(st.label) + '</span><span class="fs-min">' + st.min + ' min</span></li>'; }).join('');
    go.textContent = p.done === 0 ? 'Start this session' : p.done === p.total ? 'Review this session' : 'Continue this session';
    go.href = App.root + pick.w.url + '#' + s.id;
  }
  function fmtMin(m) { var h = Math.floor(m / 60), r = m % 60; return h ? h + ' h' + (r ? ' ' + r + ' min' : '') : m + ' min'; }

  function paintContinue() {
    var last = S.get('last', null), a = $('[data-continue]');
    if (last && last.url) { a.hidden = false; a.href = App.root + last.url; a.textContent = 'Continue: ' + last.title; }
  }

  function paintDeadlines() {
    var now = Date.now(), nextMarked = false;
    $$('[data-deadline]').forEach(function (li) {
      var t = Date.parse(li.getAttribute('data-deadline')), rel = $('[data-rel]', li), d = t - now;
      li.classList.toggle('is-past', d < -3 * 3600e3);
      li.classList.remove('is-next');
      if (d >= -3 * 3600e3 && !nextMarked) { li.classList.add('is-next'); nextMarked = true; }
      var days = Math.ceil(d / DAY);
      var dayDiff = Math.round((Date.parse(S.dayOf(new Date(t)) + 'T00:00:00+08:00') - Date.parse(today + 'T00:00:00+08:00')) / DAY);
      rel.textContent = d < -3 * 3600e3 ? 'done' : dayDiff === 0 ? 'today' : dayDiff === 1 ? 'tomorrow' : 'in ' + dayDiff + ' days';
      void days;
    });
  }

  function paintProgress() {
    var p = App.allProgress();
    $('[data-overall]').textContent = Math.round((p.total ? p.done / p.total : 0) * 100) + '%';
    $('[data-overall-steps]').textContent = p.done + ' of ' + p.total + ' steps';
    ['foundations', 'EE5101', 'EE5907'].forEach(function (t) {
      var cs = (MM.concepts || []).filter(function (c) { return c.track === t; });
      var solid = 0, learning = 0;
      cs.forEach(function (c) { var m = S.get('mastery:' + c.slug, 'new'); if (m === 'solid') solid++; else if (m === 'learning') learning++; });
      var el = $('[data-track-meter="' + t + '"]');
      $('.meter-solid', el).style.width = (cs.length ? solid / cs.length * 100 : 0) + '%';
      $('.meter-learning', el).style.width = (cs.length ? learning / cs.length * 100 : 0) + '%';
      $('[data-meter-val]', el).textContent = solid + ' of ' + cs.length + ' solid' + (learning ? ', ' + learning + ' learning' : '');
    });
  }

  function paintRhythm() {
    var days = S.keys('day:').map(function (k) { return k.slice(4); }).filter(function (d) { return S.get('day:' + d, 0); });
    var set = {}; days.forEach(function (d) { set[d] = 1; });
    var streak = 0, cursor = new Date();
    if (!set[S.dayOf(cursor)]) cursor = new Date(cursor.getTime() - DAY); // today not yet counted: streak still alive from yesterday
    while (set[S.dayOf(cursor)]) { streak++; cursor = new Date(cursor.getTime() - DAY); }
    $('[data-streak]').textContent = String(streak);
    $('[data-streak-label]').textContent = streak === 1 ? 'study day in a row' : 'study days in a row';
    var box = $('[data-days14]'), html = '';
    for (var i = 13; i >= 0; i--) {
      var d = S.dayOf(new Date(Date.now() - i * DAY));
      html += '<span class="' + (set[d] ? 'on' : '') + (i === 0 ? ' today' : '') + '" title="' + d + (set[d] ? ': studied' : '') + '"></span>';
    }
    box.innerHTML = html;
    var sorted = days.sort(); var lastDay = sorted[sorted.length - 1];
    if (lastDay) $('[data-last-studied]').textContent = 'Last studied: ' + (lastDay === today ? 'today' : lastDay) + '.';
  }

  function paintDue() {
    var now = Date.now();
    var due = (MM.cards || []).filter(function (c) { var st = S.get('card:' + c.id, null); return !st || st.due <= now; }).length;
    $('[data-due-num]').textContent = String(due);
  }

  function paintRunway() {
    var rw = $('.runway'); if (!rw) return;
    var start = +rw.getAttribute('data-start'), end = +rw.getAttribute('data-end'), now = Date.now();
    var m = $('[data-today]', rw);
    if (now >= start && now <= end) {
      m.hidden = false; m.style.left = ((now - start) / (end - start) * 100) + '%';
      var sc = rw.parentNode; if (sc && sc.scrollWidth > sc.clientWidth + 4 && !sc._scrolled) { sc._scrolled = true; sc.scrollLeft = Math.max(0, m.offsetLeft - 60); }
    }
    allSessions.forEach(function (x) {
      var dot = $('[data-session-dot="' + x.s.id + '"]', rw); if (!dot) return;
      var p = App.sessionProgress(x.s); dot.classList.toggle('done', p.total > 0 && p.done === p.total);
    });
  }

  function all() { paintFocus(); paintContinue(); paintDeadlines(); paintProgress(); paintRhythm(); paintDue(); paintRunway(); }
  all(); App.onRefresh(all);
  setInterval(paintDeadlines, 60000);
})();
