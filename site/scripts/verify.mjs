#!/usr/bin/env node
// Browser verification of the built site (needs Playwright + Chromium; optional dev tool).
//   node site/scripts/verify.mjs [--server http://localhost:8080 --cookie "mm_session=..."]
// Checks every page for console errors, broken internal links, KaTeX errors, leaked "$" math,
// horizontal scrolling at phone width, and mounts + pokes all 21 labs.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(HERE, '../dist');
let pw;
for (const p of ['playwright', '/opt/npm-tools/node_modules/playwright/index.mjs']) { try { pw = await import(p); break; } catch { /* try next */ } }
if (!pw) { console.error('Playwright is not installed (npm i -D playwright && npx playwright install chromium).'); process.exit(2); }
const { chromium } = pw;

const report = JSON.parse(fs.readFileSync(path.join(DIST, 'build-report.json'), 'utf8'));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(DIST, p);
  if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nf'); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${srv.address().port}/`;

const exe = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((p) => fs.existsSync(p));
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const problems = [];
const stats = { pages: 0, links: 0, labs: 0, consoleErrors: 0 };

async function crawl(width, scheme) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: scheme });
  const page = await ctx.newPage();
  let errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('requestfailed', (r) => errs.push('request failed: ' + r.url()));
  page.on('response', (r) => { if (r.status() >= 400) errs.push(`HTTP ${r.status()}: ${r.url()}`); });
  for (const rel of report.pages) {
    errs = [];
    await page.goto(base + rel, { waitUntil: 'load' });
    await page.waitForTimeout(rel.startsWith('labs/') ? 250 : 60);
    const info = await page.evaluate(() => {
      const links = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => h && !/^(https?:|mailto:|#)/.test(h));
      const katexErr = document.querySelectorAll('.katex-error').length;
      // text outside KaTeX / code that still contains $...$ math
      const walker = document.createTreeWalker(document.querySelector('main') || document.body, NodeFilter.SHOW_TEXT);
      const leaks = []; let n;
      while ((n = walker.nextNode())) { if (n.parentElement.closest('.katex, code, pre, script, style, textarea')) continue; if (/\$[^\s$][^$]*\$/.test(n.textContent) || /\$\$/.test(n.textContent)) leaks.push(n.textContent.trim().slice(0, 80)); }
      const hscroll = document.documentElement.scrollWidth - window.innerWidth;
      const ids = new Set([...document.querySelectorAll('[id]')].map((e) => e.id));
      const badAnchors = [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href').slice(1)).filter((h) => h && !ids.has(decodeURIComponent(h)) && h !== 'main');
      return { links, katexErr, leaks, hscroll, badAnchors, labs: document.querySelectorAll('.lab').length, labSlots: document.querySelectorAll('.lab-slot').length, labErrors: document.querySelectorAll('.lab-error').length };
    });
    stats.pages++;
    for (const h of info.links) {
      stats.links++;
      const target = new URL(h, base + rel);
      const f = path.join(DIST, decodeURIComponent(target.pathname));
      if (!fs.existsSync(f)) problems.push(`[${width}] ${rel}: broken link ${h}`);
      else if (target.hash && f.endsWith('.html')) {
        const html = fs.readFileSync(f, 'utf8');
        if (!html.includes(`id="${decodeURIComponent(target.hash.slice(1))}"`)) problems.push(`[${width}] ${rel}: missing anchor ${h}`);
      }
    }
    if (info.katexErr) problems.push(`${rel}: ${info.katexErr} .katex-error`);
    if (info.leaks.length) problems.push(`${rel}: raw math leaked: ${info.leaks.slice(0, 3).join(' | ')}`);
    if (info.hscroll > 1) problems.push(`[${width}] ${rel}: horizontal scroll ${info.hscroll}px`);
    if (info.badAnchors.length) problems.push(`${rel}: in-page anchors without target: ${info.badAnchors.join(', ')}`);
    if (info.labSlots !== info.labs || info.labErrors) problems.push(`${rel}: ${info.labSlots} lab slots but ${info.labs} mounted, ${info.labErrors} lab errors`);
    if (errs.length) { stats.consoleErrors += errs.length; problems.push(`[${width} ${scheme}] ${rel}: console: ${errs.join(' | ')}`); }
  }
  await ctx.close();
}

async function pokeLabs() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, hasTouch: false });
  const page = await ctx.newPage();
  let errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push(e.message));
  for (const rel of report.pages.filter((p) => p.startsWith('labs/'))) {
    errs = [];
    await page.goto(base + rel, { waitUntil: 'load' });
    const lab = page.locator('.lab').first();
    // predict first: controls are locked until a guess (or skip)
    const locked = await lab.evaluate((el) => el.classList.contains('locked'));
    const opt = lab.locator('.lab-predict .opts button').first();
    if (await opt.count()) await opt.click(); else await lab.locator('.skip-pred').first().click();
    const unlocked = await lab.evaluate((el) => !el.classList.contains('locked'));
    // move every slider to a few positions
    await page.evaluate(() => {
      for (const s of document.querySelectorAll('.lab input[type=range]')) for (const f of [0, 0.25, 0.75, 1, 0.5]) { s.value = String(+s.min + f * (s.max - s.min)); s.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    // press every button except Train (which animates)
    const btns = lab.locator('.lab-body .lab-btn');
    for (let i = 0; i < await btns.count(); i++) { const b = btns.nth(i); const t = await b.textContent(); if (/^Train/.test(t)) continue; await b.click(); }
    // click/drag on each canvas
    const canv = lab.locator('canvas');
    for (let i = 0; i < await canv.count(); i++) { const bb = await canv.nth(i).boundingBox(); await page.mouse.move(bb.x + bb.width * 0.4, bb.y + bb.height * 0.4); await page.mouse.down(); await page.mouse.move(bb.x + bb.width * 0.6, bb.y + bb.height * 0.3, { steps: 4 }); await page.mouse.up(); }
    const notice = lab.locator('.lab-notice > button'); await notice.click();
    const shown = await lab.locator('.lab-notice ul').isVisible();
    await page.waitForTimeout(150);
    const blank = await page.evaluate(() => [...document.querySelectorAll('.lab canvas')].some((c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let v = new Set(); for (let i = 0; i < d.length; i += 4 * 97) v.add(d[i] + ',' + d[i + 1] + ',' + d[i + 2]); return v.size < 3; }));
    stats.labs++;
    if (!locked || !unlocked) problems.push(`${rel}: predict-first gate did not behave (locked=${locked}, unlocked after guess=${unlocked})`);
    if (!shown) problems.push(`${rel}: "what to notice" did not open`);
    if (blank) problems.push(`${rel}: a canvas looks blank`);
    if (errs.length) problems.push(`${rel}: errors while interacting: ${errs.join(' | ')}`);
  }
  await ctx.close();
}

const t0 = Date.now();
await crawl(1280, 'light');
await crawl(390, 'dark');
await pokeLabs();
await browser.close(); srv.close();
console.log(`Checked ${stats.pages} page loads, ${stats.links} internal links, ${stats.labs} labs in ${((Date.now() - t0) / 1000).toFixed(1)} s.`);
if (problems.length) { console.log(`\n${problems.length} problem(s):\n- ` + problems.join('\n- ')); process.exit(1); }
console.log('No problems found: 0 console errors, 0 broken links, 0 KaTeX errors, no leaked $ math, no horizontal scroll, all labs mount and respond.');
