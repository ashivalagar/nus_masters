// Vault loading + Obsidian-flavoured markdown rendering (build time).
import fs from 'node:fs';
import path from 'node:path';
import { Marked } from 'marked';
import katex from 'katex';

export const COURSE_FILE_EXT = /\.(pdf|ipynb|zip|py|docx?|pptx?|xlsx?|csv)$/i;
const IMG_EXT = /\.(png|jpe?g|gif|svg|webp)$/i;

export function slugify(s) {
  return s.normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

function parseFrontmatter(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { fm: {}, body: src };
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (v.startsWith('[') && v.endsWith(']')) v = v.slice(1, -1).split(',').map((x) => x.trim()).filter(Boolean);
    fm[kv[1]] = v;
  }
  return { fm, body: src.slice(m[0].length) };
}

/** Classify a note by its folder. */
function classify(rel) {
  const parts = rel.split(path.sep);
  if (parts[0] === 'Concepts') {
    const group = parts[1];
    const track = group === 'Math Foundations' ? 'foundations' : group === 'Linear Systems' ? 'EE5101' : 'EE5907';
    return { type: 'concept', track, group };
  }
  if (parts[0].startsWith('EE5101')) return { type: 'note', track: 'EE5101' };
  if (parts[0].startsWith('EE5907')) return { type: 'note', track: 'EE5907' };
  return { type: 'note', track: 'general' };
}

export function loadVault(vaultDir, { includeExams = false } = {}) {
  const files = walk(vaultDir);
  const notes = [];
  const images = [];
  const excluded = [];
  for (const abs of files) {
    const rel = path.relative(vaultDir, abs);
    const isExam = rel.split(path.sep).includes('Past Papers') || /^Past Papers Log\.md$/i.test(path.basename(rel));
    if (IMG_EXT.test(abs)) { images.push({ abs, name: path.basename(abs) }); continue; }
    if (!abs.endsWith('.md')) continue;
    const title = path.basename(abs, '.md');
    if (isExam && !includeExams) { excluded.push(title); continue; }
    const src = fs.readFileSync(abs, 'utf8');
    const { fm, body } = parseFrontmatter(src);
    const tags = Array.isArray(fm.tags) ? fm.tags : fm.tags ? [fm.tags] : [];
    const cls = classify(rel);
    notes.push({ title, rel, slug: slugify(title), tags, body, ...cls, exam: isExam });
  }
  return { notes, images, excluded };
}

// ---------------------------------------------------------------- math

let katexErrors = [];
export function getKatexErrors() { return katexErrors; }

function renderTex(tex, display) {
  try {
    return katex.renderToString(tex, { displayMode: display, throwOnError: true, strict: 'ignore', output: 'html' });
  } catch (e) {
    katexErrors.push({ tex, msg: e.message });
    return katex.renderToString(tex, { displayMode: display, throwOnError: false, strict: 'ignore', output: 'html' });
  }
}

/**
 * Replace code and math with opaque placeholders so marked can't touch them.
 * Returns { text, restore(html) }.
 */
function protect(md) {
  const store = [];
  const ph = (html) => { store.push(html); return `\u0001${store.length - 1}\u0002`; };
  // fenced code
  md = md.replace(/^```([\w-]*)\n([\s\S]*?)^```\s*$/gm, (_, lang, code) =>
    ph(`<pre class="code"><code${lang ? ` data-lang="${escapeHtml(lang)}"` : ''}>${escapeHtml(code.replace(/\n$/, ''))}</code></pre>`));
  // inline code
  md = md.replace(/`([^`\n]+)`/g, (_, code) => ph(`<code>${escapeHtml(code)}</code>`));
  // display math $$...$$ (can span lines)
  md = md.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => ph(`<span class="math-display">${renderTex(tex.trim(), true)}</span>`));
  // inline math $...$ : opening $ not followed by space/digit-currency pattern; closing $ not preceded by space, not followed by digit
  md = md.replace(/(^|[^\\$\w])\$(?=[^\s$])((?:\\\$|[^$\n])+?)(?<=[^\s\\])\$(?!\d)/gm, (m, pre, tex) => {
    return pre + ph(renderTex(tex, false));
  });
  const restore = (html) => {
    let prev;
    html = html.replace(/<p>\s*(\u0001\d+\u0002)\s*<\/p>/g, '$1');
    do { prev = html; html = html.replace(/\u0001(\d+)\u0002/g, (_, i) => store[+i]); } while (html !== prev);
    return html;
  };
  return { text: md, restore, ph };
}

// ---------------------------------------------------------------- renderer

export class Renderer {
  constructor({ notes, excluded, labs, root = '' }) {
    this.byTitle = new Map(notes.map((n) => [n.title.toLowerCase(), n]));
    this.excluded = new Set(excluded.map((t) => t.toLowerCase()));
    // exam notes may be physically absent (public repo); still label them as exam material
    this.isExamName = (n) => this.excluded.has(n) || /past papers? (log|analysis)|exam style and proxy/i.test(n);
    this.labs = labs; // map image base name -> lab id
    this.links = new Map(); // slug -> Set(target slug)
    this.unknown = new Set();
    this.courseFiles = new Set();
  }

  urlFor(note) {
    if (note.type === 'concept') return `concepts/${note.slug}.html`;
    return `notes/${note.slug}.html`;
  }

  // wikilink -> html
  wikilink(target, alias, fromNote, root) {
    let [name, heading] = target.split('#');
    name = name.trim();
    const label = (alias || (heading && !name ? heading : name) || target).trim();
    if (COURSE_FILE_EXT.test(name)) {
      this.courseFiles.add(name);
      const ext = name.split('.').pop().toUpperCase();
      return `<span class="course-file" title="Course file: ${escapeHtml(name)} (kept in your vault, not published)"><span class="cf-ext">${ext}</span>${escapeHtml(alias ? alias : name.replace(COURSE_FILE_EXT, ''))}</span>`;
    }
    const note = this.byTitle.get(name.toLowerCase());
    if (!note) {
      const exam = this.isExamName(name.toLowerCase());
      if (!exam) this.unknown.add(name);
      return `<span class="dead-link" title="${exam ? 'Exam material: kept in your private vault, not published' : 'Not in the published notes'}">${escapeHtml(label)}</span>`;
    }
    if (fromNote) {
      if (!this.links.has(fromNote.slug)) this.links.set(fromNote.slug, new Set());
      if (note.slug !== fromNote.slug) this.links.get(fromNote.slug).add(note.slug);
    }
    const hash = heading ? '#' + slugify(heading) : '';
    return `<a class="wl wl-${note.track}" href="${root}${this.urlFor(note)}${hash}">${escapeHtml(label)}</a>`;
  }

  /** Inline-only render (used for self-test cards, meta strips, etc.). */
  inline(md, fromNote, root) {
    const p = protect(md);
    let t = this.replaceWikilinks(p.text, fromNote, root, p.ph);
    const m = new Marked({ gfm: true });
    return p.restore(m.parseInline(t));
  }

  replaceWikilinks(text, fromNote, root, ph) {
    // escaped pipes inside tables: [[a\|b]]
    return text.replace(/(!?)\[\[([^\[\]\n]+?)\]\]/g, (m, bang, inner) => {
      inner = inner.replace(/\\\|/g, '|');
      const [target, alias] = inner.split('|');
      if (bang) return ph(this.embed(target.trim(), fromNote, root));
      return ph(this.wikilink(target, alias, fromNote, root));
    });
  }

  embed(target, fromNote, root) {
    const base = target.replace(/\.[a-z]+$/i, '');
    if (IMG_EXT.test(target) && this.labs.has(base)) {
      const id = base;
      return `\n\n<div class="lab-slot" data-lab="${id}" id="lab-${id}"><noscript><img src="${root}assets/img/${escapeHtml(target)}" alt="Static picture for lab ${id}"></noscript></div>\n<details class="lab-static"><summary>Static picture (from the Python lab)</summary><img loading="lazy" src="${root}assets/img/${escapeHtml(target)}" alt="Static matplotlib output of ${escapeHtml(base)}"></details>\n\n`;
    }
    if (IMG_EXT.test(target)) return `<img loading="lazy" src="${root}assets/img/${escapeHtml(target)}" alt="${escapeHtml(base)}">`;
    if (COURSE_FILE_EXT.test(target)) return this.wikilink(target, null, fromNote, root);
    const note = this.byTitle.get(target.toLowerCase());
    if (note) return `<p class="embed-ref">See ${this.wikilink(target, null, fromNote, root)}</p>`;
    return `<span class="dead-link">${escapeHtml(target)}</span>`;
  }

  /**
   * Full render of a note body.
   * Returns { html, headings[], cards[], meta, labs[] }
   */
  render(note, root) {
    let md = note.body.replace(/\r\n/g, '\n');
    const out = { headings: [], cards: [], meta: null, labs: [], h1: null };

    // H1 (title line) — removed from body; page template renders it.
    md = md.replace(/^# (.+)\n/m, (_, t) => { out.h1 = t.trim(); return ''; });

    // "Predict first" boilerplate after lab embeds is replaced by the lab's own prompt.
    md = md.replace(/^> \*Predict first:[^\n]*\n?/gm, '');
    // Primer line becomes the page ribbon.
    md = md.replace(/^\*\*Primer written before the lecture[^\n]*\n?/m, () => { out.primer = true; return ''; });

    // meta lines (Course map / Needs / Used by / Prev / Next / Source) directly under the H1 for concept notes
    if (note.type === 'concept') {
      const lines = md.replace(/^\n+/, '').split('\n');
      const metaLines = [];
      while (lines.length && lines[0].trim() && !lines[0].startsWith('#') && /^(\*\*)?[A-Z][\w /]+?:/.test(lines[0])) metaLines.push(lines.shift());
      if (metaLines.length) {
        md = lines.join('\n');
        out.meta = this.parseMeta(metaLines.join(' · '), note, root);
      }
    }

    const p = protect(md);
    let t = p.text;

    // callouts > [!type](-|+)? Title
    t = t.replace(/^> \[!(\w+)\]([+-]?)[ \t]*(.*)\n((?:>.*(?:\n|$))*)/gm, (_, type, fold, title, rest) => {
      const body = rest.split('\n').map((l) => l.replace(/^> ?/, '')).join('\n');
      const inner = this.renderBlock(body, note, root, p.ph);
      const ttl = title ? this.inline(title, note, root) : type[0].toUpperCase() + type.slice(1);
      const ty = escapeHtml(type.toLowerCase());
      if (fold) return p.ph(`<details class="callout callout-${ty}"${fold === '+' ? ' open' : ''}><summary>${ttl}</summary><div class="callout-body">${inner}</div></details>`) + '\n\n';
      return p.ph(`<aside class="callout callout-${ty}"><p class="callout-title">${ttl}</p><div class="callout-body">${inner}</div></aside>`) + '\n\n';
    });

    // Self-test section -> reveal cards
    t = t.replace(/^(## Self-test[^\n]*)\n((?:(?!## ).*\n?)*)/m, (whole, head, body) => {
      const items = [];
      const rest = [];
      const lines = body.split('\n');
      for (const line of lines) {
        const m = line.match(/^\s*(\d+)\.\s+(.*?)\s*\*\((.+)\)\*\s*$/);
        const q = line.match(/^\s*(\d+)\.\s+(.*\S)\s*$/);
        if (m) items.push({ q: m[2], a: m[3] });
        else if (q) items.push({ q: q[2], a: null });
        else if (line.trim()) rest.push(line);
      }
      if (!items.length) return whole;
      const cardsHtml = items.map((it, i) => {
        const id = `${note.slug}#${i + 1}`;
        const inl = (txt) => p.restore(new Marked({ gfm: true }).parseInline(this.replaceWikilinks(txt, note, root, p.ph)));
        const qh = inl(it.q);
        if (it.a == null) return `<li class="st-card st-open" data-card="${id}"><div class="st-q">${qh}</div><p class="st-note">No answer written yet — fill it in after the lecture.</p></li>`;
        const ah = inl(it.a);
        out.cards.push({ id, slug: note.slug, title: note.title, track: note.track, q: qh, a: ah });
        return `<li class="st-card" data-card="${id}"><div class="st-q">${qh}</div><button type="button" class="st-reveal" aria-expanded="false">Show answer</button><div class="st-a" hidden>${ah}</div><div class="st-grade" hidden><button type="button" data-grade="no">Not yet</button><button type="button" data-grade="yes">Knew it</button></div></li>`;
      }).join('');
      return `${head}\n\n${p.ph(`<ol class="selftest">${cardsHtml}</ol>`)}\n\n${rest.join('\n')}\n`;
    });

    t = this.replaceWikilinks(t, note, root, p.ph);

    let html = this.mdToHtml(t);
    html = p.restore(html);

    // headings: ids, record for ladder/toc
    const used = new Set();
    html = html.replace(/<h([2-4])>([\s\S]*?)<\/h\1>/g, (_, lvl, inner) => {
      const text = inner.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
      let id = slugify(text.replace(/^🧠\s*/, '')) || 'section';
      if (/^🧠/.test(text)) id = 'picture';
      if (/^Self-test/i.test(text)) id = 'self-test';
      while (used.has(id)) id += '-x';
      used.add(id);
      out.headings.push({ level: +lvl, text, id });
      const cls = id === 'picture' ? ' class="h-picture"' : '';
      return `<h${lvl} id="${id}"${cls}>${inner.replace(/^🧠\s*/, '')}</h${lvl}>`;
    });

    // wrap mental picture section into a distinctive block
    html = html.replace(/(<h2 id="picture"[\s\S]*?)(?=<h2 |$)/, (sec) => {
      // pull the lab(s) out of the block so they sit full width afterwards
      const labs = [];
      sec = sec.replace(/<div class="lab-slot"[\s\S]*?<\/div>\s*<details class="lab-static">[\s\S]*?<\/details>/g, (m) => { labs.push(m); return ''; });
      return `<section class="mental-picture" aria-labelledby="picture">${sec}</section>${labs.length ? `<div class="play" id="play">${labs.join('')}</div>` : ''}`;
    });
    // labs elsewhere
    for (const m of html.matchAll(/data-lab="([\w]+)"/g)) out.labs.push(m[1]);

    // task lists -> interactive (index per page)
    let ti = 0;
    html = html.replace(/<li>\s*<input (checked="" )?disabled="" type="checkbox">\s*/g, (_, checked) => {
      const i = ti++;
      return `<li class="task"><input type="checkbox" class="task-box" data-task="${note.slug}:${i}"${checked ? ' checked data-default="1"' : ''} aria-label="Mark task done"> `;
    });
    // remove a "- " placeholder in Mistakes log to keep it tidy
    html = html.replace(/<ul>\s*<li><\/li>\s*<\/ul>/g, '<p class="muted">Nothing logged yet. Add mistakes in your vault note.</p>');
    // tables: wrap for horizontal scroll on phones
    html = html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>');
    out.html = html;
    return out;
  }

  renderBlock(md, note, root, ph) {
    const t = this.replaceWikilinks(md, note, root, ph);
    return this.mdToHtml(t);
  }

  mdToHtml(t) {
    const m = new Marked({ gfm: true, breaks: false });
    return m.parse(t);
  }

  parseMeta(line, note, root) {
    const segs = line.split(/\s+·\s+/);
    const meta = { needs: [], usedBy: [], related: [], prev: null, next: null, courseMap: null, sources: [], other: [] };
    for (let seg of segs) {
      seg = seg.trim();
      const m = seg.match(/^(\*\*)?([A-Z][\w /]+?):(\*\*)?\s*(.*)$/);
      const names = [...seg.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g)].map((x) => x[1].trim());
      if (!m) { meta.other.push(this.inline(seg, note, root)); continue; }
      const key = m[2].toLowerCase();
      if (key === 'needs') meta.needs.push(...names);
      else if (key === 'used by' || key === 'used in') meta.usedBy.push(...names);
      else if (key === 'prev') meta.prev = names[0] || null;
      else if (key === 'next') { meta.next = names[0] || null; meta.usedBy.push(...names); }
      else if (key === 'course map' || key === 'back to') meta.courseMap = names[0] || null;
      else if (key === 'dual' || key === 'dual of' || key === 'compare' || key === 'related') meta.related.push(...names);
      else meta.other.push(this.inline(seg, note, root));
      // register the link for backlinks
      for (const n of names) this.wikilink(n, null, note, root);
    }
    return meta;
  }
}

export function plainText(md) {
  return md
    .replace(/^---[\s\S]*?---/, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$[^$\n]+\$/g, ' ')
    .replace(/!\[\[[^\]]+\]\]/g, ' ')
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/[#>*_`|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
