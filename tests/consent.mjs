// Proves the promise in the privacy notice: nothing from Google loads before a yes.
//
//   SCROLLCRAFT_CHROME=/path/to/chrome node tests/consent.mjs
//
// Serves the repo root the way Cloudflare Pages does (extensionless first, then
// .html), launches Chromium from SCROLLCRAFT_CHROME, routes every request to
// googletagmanager.com to an empty 200 and counts the hits. Every other
// off-origin request is aborted and counted too, so a stray beacon fails the run.
// Prints one PASS or FAIL line per check and exits 1 on any FAIL, 2 when it
// cannot run at all (no browser path, playwright-core missing).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.SCROLLCRAFT_CHROME;
if (!CHROME || !fs.existsSync(CHROME)) {
  console.error('tests/consent.mjs: set SCROLLCRAFT_CHROME to a Chromium binary (got ' + JSON.stringify(CHROME || null) + ')');
  process.exit(2);
}
let chromium;
try {
  ({ chromium } = await import('playwright-core'));
} catch (e) {
  try { ({ chromium } = createRequire(import.meta.url)('playwright-core')); }
  catch (e2) {
    try { ({ chromium } = createRequire(import.meta.url)('playwright')); }
    catch (e3) { console.error('tests/consent.mjs: playwright-core is not installed where node can find it'); process.exit(2); }
  }
}

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain', '.woff2': 'font/woff2', '.webp': 'image/webp', '.mp4': 'video/mp4', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/html' }); res.end(fs.readFileSync(path.join(ROOT, '404.html'))); return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); res.end(fs.readFileSync(f));
});
await new Promise(r => server.listen(0, r));
const BASE = 'http://127.0.0.1:' + server.address().port;
const browser = await chromium.launch({ executablePath: CHROME });

const out = []; let fails = 0;
const ok = (c, m) => { out.push((c ? 'PASS  ' : 'FAIL  ') + m); if (!c) fails++; };
const KEY = 'tws-consent';

// A fresh context: GTM routed and counted, everything else off-origin aborted and counted.
async function fresh(opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1440, height: 900 }, isMobile: !!opts.mobile, hasTouch: !!opts.mobile });
  const hits = { gtm: [], other: [] };
  await ctx.route('**/*', r => {
    const u = r.request().url();
    if (u.startsWith(BASE)) return r.continue();
    if (/googletagmanager\.com/.test(u)) { hits.gtm.push(u); return r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }); }
    hits.other.push(u); return r.abort();
  });
  if (opts.init) await ctx.addInitScript(opts.init.fn, opts.init.arg);
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  return { ctx, page, hits, errs };
}
const record = page => page.evaluate(k => { const r = localStorage.getItem(k); return r === null ? null : JSON.parse(r); }, KEY);
const visible = (page, sel) => page.evaluate(s => { const el = document.querySelector(s); if (!el || el.hidden) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; }, sel);
const settle = page => page.waitForLoadState('networkidle').then(() => page.waitForTimeout(600));

// 1. Fresh visit to the homepage: nothing loads, the slip shows, nothing stored.
{
  const { ctx, page, hits, errs } = await fresh();
  await page.goto(BASE + '/'); await settle(page);
  await page.waitForFunction(() => { const c = document.getElementById('consent'); return c && !c.hidden; }, null, { timeout: 5000 }).catch(() => {});
  ok(hits.gtm.length === 0, `fresh /: 0 hits to googletagmanager.com (got ${hits.gtm.length})`);
  ok(hits.other.length === 0, `fresh /: no other off-origin request (got ${hits.other.join(', ') || 'none'})`);
  ok(await visible(page, '#consent'), 'fresh /: #consent is visible');
  ok((await record(page)) === null, `fresh /: localStorage.${KEY} is null`);

  // 2. Allow both: exactly one hit, the right id, record saved, slip hidden.
  await page.click('#consent [data-consent="accept"]');
  await page.waitForFunction(() => !!document.querySelector('script[src*="googletagmanager.com"]'), null, { timeout: 5000 }).catch(() => {});
  await settle(page);
  ok(hits.gtm.length === 1 && /\/gtag\/js\?id=G-ZFDENLSWXF$/.test(hits.gtm[0]), `allow both: exactly 1 hit, to /gtag/js?id=G-ZFDENLSWXF (got ${JSON.stringify(hits.gtm)})`);
  const r = await record(page);
  ok(r && r.v === 1 && r.analytics === true && r.ads === true && typeof r.at === 'number', `allow both: stored record analytics:true, ads:true (got ${JSON.stringify(r)})`);
  ok(!(await visible(page, '#consent')), 'allow both: #consent hidden');
  ok(errs.length === 0, `allow both: no page errors${errs.length ? ' (' + errs.join('; ') + ')' : ''}`);
  await ctx.close();
}

// 3. Refuse both: no hit, refusal stored.
{
  const { ctx, page, hits } = await fresh();
  await page.goto(BASE + '/'); await settle(page);
  await page.waitForFunction(() => { const c = document.getElementById('consent'); return c && !c.hidden; }, null, { timeout: 5000 }).catch(() => {});
  await page.click('#consent [data-consent="reject"]'); await settle(page);
  const r = await record(page);
  ok(hits.gtm.length === 0, `refuse both: 0 hits (got ${hits.gtm.length})`);
  ok(r && r.analytics === false && r.ads === false, `refuse both: stored record analytics:false, ads:false (got ${JSON.stringify(r)})`);
  ok(!(await visible(page, '#consent')), 'refuse both: #consent hidden');
  await ctx.close();
}

// 4. Global Privacy Control with a stored yes: nothing loads, no slip, the yes becomes a refusal.
{
  const { ctx, page, hits } = await fresh({ init: { fn: k => {
    Object.defineProperty(navigator, 'globalPrivacyControl', { get: () => true, configurable: true });
    try { localStorage.setItem(k, JSON.stringify({ v: 1, analytics: true, ads: true, at: Date.now() })); } catch (e) {}
  }, arg: KEY } });
  await page.goto(BASE + '/'); await settle(page);
  const r = await record(page);
  ok(hits.gtm.length === 0, `GPC + stored yes: 0 hits after networkidle (got ${hits.gtm.length})`);
  ok(!(await visible(page, '#consent')), 'GPC + stored yes: no slip');
  ok(r && r.analytics === false && r.ads === false, `GPC + stored yes: record now analytics:false, ads:false (got ${JSON.stringify(r)})`);
  await ctx.close();
}

// 5. On a phone the slip keeps clear of the lines a first-time visitor must see.
for (const vp of [{ width: 390, height: 844 }, { width: 375, height: 812 }]) {
  const { ctx, page } = await fresh({ viewport: vp, mobile: true });
  await page.goto(BASE + '/'); await settle(page);
  await page.waitForFunction(() => { const c = document.getElementById('consent'); return c && !c.hidden; }, null, { timeout: 5000 }).catch(() => {});
  const res = await page.evaluate(sels => {
    const c = document.getElementById('consent'); if (!c || c.hidden) return { shown: false };
    const s = c.getBoundingClientRect();
    const hit = (a, b) => !(a.bottom <= b.top || a.top >= b.bottom || a.right <= b.left || a.left >= b.right);
    const r = { shown: true, covered: [], missing: [] };
    for (const sel of sels) {
      const el = document.querySelector(sel); if (!el) { r.missing.push(sel); continue; }
      const b = el.getBoundingClientRect();
      if (b.width === 0 || b.height === 0) { r.missing.push(sel); continue; }
      if (hit(s, b)) r.covered.push(sel + '@' + Math.round(b.top) + '-' + Math.round(b.bottom) + ' slip@' + Math.round(s.top) + '-' + Math.round(s.bottom));
    }
    return r;
  }, ['.sk-send', '#skH1', '.sk-facts', '#skPick', '#skNameRow']);
  ok(res.shown, `${vp.width}x${vp.height}: slip shown on arrival`);
  ok(res.shown && res.missing.length === 0, `${vp.width}x${vp.height}: all five kept elements present (${res.missing ? res.missing.join(', ') || 'none missing' : ''})`);
  ok(res.shown && res.covered.length === 0, `${vp.width}x${vp.height}: slip does not intersect .sk-send, #skH1, .sk-facts, #skPick, #skNameRow${res.covered && res.covered.length ? ' (covers ' + res.covered.join('; ') + ')' : ''}`);
  await ctx.close();
}

// 6. /thanks/ loads the engine with data-tag="off": nothing loads, no slip.
{
  const { ctx, page, hits } = await fresh();
  await page.goto(BASE + '/thanks/'); await settle(page);
  ok(hits.gtm.length === 0, `/thanks/: 0 hits (got ${hits.gtm.length})`);
  ok(!(await visible(page, '#consent')), '/thanks/: no slip');
  await ctx.close();
}

await browser.close(); server.close();
console.log(out.join('\n'));
console.log(fails ? `\n${fails} FAIL` : '\nALL PASS');
process.exit(fails ? 1 : 0);
