#!/usr/bin/env node
// The shared page chrome: one index bar and one footer, pasted into every page.
//
//   node scripts/chrome.mjs           check: exit 1 naming the first page whose copy drifted
//   node scripts/chrome.mjs --write   rewrite every page's copy from scripts/partials/
//
// Pages: every *.html at the root and every */index.html, except demos/ and
// concepts/. Each sub-page carries <!-- tw:index --> ... <!-- /tw:index --> around
// its bar (the homepage has no bar; its header is the sketchpad's top edge), and
// every page carries <!-- tw:foot --> ... <!-- /tw:foot --> around its footer.
// {{reply}} in the index partial becomes #reply on a page with its own form
// (id="reply" in the file) and /#reply everywhere else. No dependencies.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PART = path.join(ROOT, 'scripts', 'partials');
const WRITE = process.argv.includes('--write');

const indexPartial = fs.readFileSync(path.join(PART, 'index.html'), 'utf8').trimEnd();
const footPartial = fs.readFileSync(path.join(PART, 'foot.html'), 'utf8').trimEnd();

function pages() {
  const out = [];
  for (const name of fs.readdirSync(ROOT)) {
    if (name === 'demos' || name === 'concepts' || name.startsWith('.') || name === 'node_modules') continue;
    const full = path.join(ROOT, name);
    const st = fs.statSync(full);
    if (st.isFile() && name.endsWith('.html')) out.push(full);
    else if (st.isDirectory() && fs.existsSync(path.join(full, 'index.html'))) out.push(path.join(full, 'index.html'));
  }
  return out.sort();
}

// Replaces what sits between the two markers, keeping the markers on their own lines.
function splice(html, tag, body) {
  const open = `<!-- tw:${tag} -->`, close = `<!-- /tw:${tag} -->`;
  const a = html.indexOf(open), b = html.indexOf(close);
  if (a < 0 && b < 0) return { html, found: false };
  if (a < 0 || b < 0 || b < a) throw new Error(`unbalanced tw:${tag} markers`);
  const before = html.slice(0, a + open.length), after = html.slice(b);
  return { html: before + '\n' + body + '\n' + after, found: true };
}

let drift = [];
for (const file of pages()) {
  const rel = path.relative(ROOT, file);
  const src = fs.readFileSync(file, 'utf8');
  const isHome = rel === 'index.html';
  const reply = /id="reply"/.test(src) ? '#reply' : '/#reply';
  let html = src;
  try {
    const i = splice(html, 'index', indexPartial.replace('{{reply}}', reply));
    if (!isHome && !i.found) { drift.push(`${rel}: no <!-- tw:index --> markers`); continue; }
    if (isHome && i.found) { drift.push(`${rel}: the homepage must not carry the index bar`); continue; }
    html = i.html;
    const f = splice(html, 'foot', footPartial);
    if (!f.found) { drift.push(`${rel}: no <!-- tw:foot --> markers`); continue; }
    html = f.html;
  } catch (e) { drift.push(`${rel}: ${e.message}`); continue; }
  if (html !== src) {
    if (WRITE) { fs.writeFileSync(file, html); console.log(`wrote ${rel}`); }
    else drift.push(`${rel}: chrome differs from scripts/partials/ (run node scripts/chrome.mjs --write)`);
  }
}

if (drift.length && !WRITE) { console.error('chrome.mjs: ' + drift[0]); process.exit(1); }
if (drift.length) { console.error('chrome.mjs: ' + drift.join('\n  ')); process.exit(1); }
console.log(`chrome.mjs: ${WRITE ? 'written' : 'every page matches scripts/partials/'}`);
