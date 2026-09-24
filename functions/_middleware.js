// Root middleware. Pages runs only the root functions/_middleware.js for
// static files; a nested one under functions/concepts/ would never see them.
// Three handlers run in order on every request:
//
// 1. Host redirects. Cloudflare gives every Pages project a free
//    tempanywebstudios.pages.dev URL, and Google found it serving the same
//    content as tempanywebstudios.co.uk ("Duplicate without user-selected
//    canonical"). A canonical tag is only a hint, so that alias and the www
//    host both 301 to the apex, keeping the path and query. Branch previews
//    (<branch>.tempanywebstudios.pages.dev) and per-deployment URLs pass.
// 2. /quiet/ sets or clears the tws_quiet cookie, which stops preview
//    notifications for one browser. It is public and linked from the privacy
//    notice, so it is also how a visitor objects.
// 3. Preview watch. Opening a page under /concepts/ or /demos/ sends Logan a
//    short notification, after the page has been returned. The Cloudflare
//    Web Analytics beacon is stripped from those pages whether or not a
//    notification goes.
//
// Secrets, set in Pages > Settings > Variables and Secrets, Production only:
// TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID, or NTFY_TOPIC (plus NTFY_TOKEN on
// a paid ntfy account). Telegram wins if both are set. With none set, nothing
// is sent and nothing is stored. ALERT_HOST is for local testing only.
//
// The raw IP address is never stored or sent. Every alert step sits inside
// waitUntil and try/catch: a failure logs one line and the page is unaffected.

const APEX = 'tempanywebstudios.co.uk';
const REDIRECT_HOSTS = new Set(['tempanywebstudios.pages.dev', 'www.tempanywebstudios.co.uk']);

// ---------------------------------------------------------------- 1. hosts

async function hostRedirects({ request, next }) {
  const url = new URL(request.url);
  if (REDIRECT_HOSTS.has(url.hostname)) {
    url.protocol = 'https:';
    url.hostname = APEX;
    url.port = '';
    return Response.redirect(url.toString(), 301);
  }
  return next();
}

// ---------------------------------------------------------- 2. the quiet switch

const QUIET_SET = 'tws_quiet=1; Max-Age=34560000; Path=/; Secure; HttpOnly; SameSite=Lax'; // 400 days, Chrome's cap
const QUIET_CLEAR = 'tws_quiet=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=Lax';
const QUIET_COOKIE = /(?:^|;)\s*tws_quiet=1\s*(?:;|$)/;

function channelOf(env) {
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) return 'telegram';
  if (env.NTFY_TOPIC) return 'ntfy';
  return null;
}

function quietPage(said, again, status) {
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Preview notifications &middot; Tempany Web Studios</title>
<style>body{margin:0;padding:3rem 1rem;background:#efe9dd;color:#191712;font:1.125rem/1.55 Georgia,"Times New Roman",serif}main{max-width:34rem;margin:0 auto}h1{font-size:1.5rem;line-height:1.2;margin:0 0 1rem}a{color:#191712}</style>
</head>
<body>
<main>
<h1>Preview notifications</h1>
<p>${said}</p>
<p>${again} &middot; <a href="/privacy/#previews">How preview notifications work</a></p>
<p>Notifications on this deployment: ${status}</p>
</main>
</body>
</html>
`;
}

// Utility page: noindex, no favicon set, no share tags, not in the sitemap.
async function quietSwitch({ request, env, next }) {
  const url = new URL(request.url);
  if (url.pathname !== '/quiet/' && url.pathname !== '/quiet') return next();
  if (request.method !== 'GET' && request.method !== 'HEAD') return next();
  const undo = url.searchParams.has('undo');
  const channel = channelOf(env || {});
  // Names the channel only, never a value. This is how Logan checks that the
  // secrets reached the production deployment.
  const status = channel === 'telegram' ? 'on (Telegram)' : channel === 'ntfy' ? 'on (ntfy)' : 'off (not set up)';
  const said = undo
    ? 'Undone. Opening a preview page in this browser will notify Logan again.'
    : 'Done. Opening a preview page in this browser will no longer notify Logan. This is one cookie, tws_quiet, kept in this browser only, for up to 400 days.';
  const again = undo ? '<a href="/quiet/">Quiet this browser again</a>' : '<a href="/quiet/?undo">Undo</a>';
  return new Response(request.method === 'HEAD' ? null : quietPage(said, again, status), {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Set-Cookie': undo ? QUIET_CLEAR : QUIET_SET,
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}

// --------------------------------------------------------- 3. the preview watch

const UNDER_PREVIEWS = /^\/(?:concepts|demos)\//;
const PREVIEW_PATH = /^\/(concepts|demos)\/([a-z0-9-]+)\/(.*)$/;

// Link unfurlers, crawlers, scanners and scripts. Case-insensitive substrings.
// Kept on purpose: Instagram, FBAN/FBAV, LinkedInApp and GSA, which are people
// tapping a link inside an app.
const BOT_WORDS = [
  'crawl', 'spider', 'slurp', 'preview', 'scan', 'facebookexternalhit', 'facebot',
  'meta-external', 'whatsapp', 'headless', 'lighthouse', 'pagespeed', 'curl/', 'wget',
  'python', 'httpie', 'go-http-client', 'okhttp', 'java/', 'libwww', 'node-fetch', 'undici',
  'axios', 'postman', 'insomnia', 'ms-office', 'microsoft office', 'skypeuripreview',
  'embedly', 'iframely', 'google-safety', 'googleother', 'google-inspectiontool',
  'feedfetcher', 'mediapartners', 'yandex', 'baidu', 'petal', 'semrush', 'ahrefs', 'mj12',
  'dataforseo', 'censys', 'zgrab', 'nuclei', 'masscan', 'claude', 'perplexity', 'ccbot',
  'bytespider',
];
// "bot" counts only where a name ends in it (Googlebot/2.1, PetalBot;,
// Slackbot-LinkExpanding, api.slack.com/robots)), so a phone model such as
// "CUBOT NOTE 20" is not taken for a crawler.
const BOT_RE = new RegExp(['bots?(?:[/;)\\-.:+~,\\]]|$)'].concat(BOT_WORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'))).join('|'), 'i');

// Cloud networks: sent silently and labelled "Scanner?". Microsoft 365 Safe
// Links opens links from 8075 within seconds of delivery.
const DATACENTER_ASNS = new Set([8075, 16509, 14618, 15169, 396982, 14061, 16276, 24940, 63949, 20473, 31898, 45102, 132203, 51167, 12876, 9009, 60781, 36352]);
const DATACENTER_ORG = /microsoft|amazon|google|digitalocean|ovh|hetzner|linode|vultr|oracle|alibaba|tencent|contabo|scaleway|leaseweb/i;
// iCloud Private Relay and WARP exits: people, never datacenter.
const RELAY_ASNS = new Set([13335, 36183, 54113]);
const MOBILE_ORG = /\b(EE|Vodafone|Telefonica|O2|Hutchison|Three|Tesco Mobile|giffgaff|Sky Mobile|Lebara|Lyca)\b/i;

const DEMO_NAMES = {
  'salon-v2': 'Salon demo',
  salon: 'Old salon demo',
  clinic: 'Clinic demo',
  trades: 'Trades demo',
  professional: 'Professional demo',
};
const TAG = /^[a-z0-9][a-z0-9-]{0,39}$/;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const NO_REFERRER = 'No referrer (typed, email app or DM)';
const SEND_TIMEOUT_MS = 5000;
const ALERTS_PER_IP = 3; // then silence until the window ends
const WINDOW_SECONDS = 1800; // 30 minutes, for both the visit and the per-IP limits

// Pages serves //concepts/x/, /%63oncepts/x/ and /concepts/x%2Dy/ as the
// preview they name, so match on the decoded path with repeated slashes
// collapsed. A malformed escape falls back to the raw path.
function normalisePath(raw) {
  let p = raw;
  try {
    p = decodeURIComponent(raw);
  } catch (e) {
    p = raw;
  }
  return p.replace(/\/{2,}/g, '/');
}

function isPagePath(rest) {
  if (rest === '' || rest.endsWith('.html')) return true;
  return !rest.slice(rest.lastIndexOf('/') + 1).includes('.');
}

// Is this request a person opening a preview page? The response status is
// checked separately, once the response is in hand.
function isPreviewOpen(request, url, env, rest) {
  if (url.hostname !== (env.ALERT_HOST || APEX)) return false;
  if (request.method !== 'GET') return false;
  if (!isPagePath(rest)) return false;
  const h = request.headers;
  const dest = h.get('Sec-Fetch-Dest');
  if (dest !== null) {
    if (dest.toLowerCase() !== 'document') return false;
  } else if (!/text\/html/i.test(h.get('Accept') || '')) {
    return false;
  }
  if (/prefetch/i.test(h.get('Sec-Purpose') || '') || /prefetch/i.test(h.get('Purpose') || '')) return false;
  if (QUIET_COOKIE.test(h.get('Cookie') || '')) return false;
  const ua = h.get('User-Agent') || '';
  if (!ua.trim() || BOT_RE.test(ua)) return false;
  return true;
}

function titleCase(slug) {
  return slug.split('-').filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
}

function previewName(kind, slug) {
  if (kind === 'concepts') return `${titleCase(slug)} concept`;
  return DEMO_NAMES[slug] || `${titleCase(slug)} demo`;
}

function deviceOf(ua) {
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Android/.test(ua)) return /Mobile/.test(ua) ? 'Android phone' : 'Android tablet';
  if (/Macintosh/.test(ua)) return 'Mac or iPad'; // iPads in desktop mode send Macintosh too
  if (/Windows/.test(ua)) return 'Windows PC';
  if (/CrOS/.test(ua)) return 'Chromebook';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Unknown device';
}

function browserOf(ua) {
  if (/Instagram/.test(ua)) return 'Instagram in-app browser';
  if (/FBAN|FBAV|FBIOS/.test(ua)) return 'Facebook in-app browser';
  if (/LinkedInApp/.test(ua)) return 'LinkedIn in-app browser';
  if (/GSA\//.test(ua)) return 'Google app';
  if (/\bEdg(?:e|A|iOS)?\//.test(ua)) return 'Edge';
  if (/SamsungBrowser\//.test(ua)) return 'Samsung Internet';
  if (/OPR\//.test(ua)) return 'Opera';
  if (/Firefox|FxiOS/.test(ua)) return 'Firefox';
  if (/CriOS|Chrome\//.test(ua)) return 'Chrome';
  if (/Version\/[\d.]+.*Safari\//.test(ua)) return 'Safari';
  if (/AppleWebKit/.test(ua) && !/Safari/.test(ua)) return 'In-app browser';
  return 'Other browser';
}

function placeOf(cf) {
  const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : '');
  const where = [str(cf.city), str(cf.region), str(cf.country)].filter(Boolean).join(', ');
  const parts = [where, str(cf.asOrganization)].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'Location unknown';
}

let londonFormat = null;
function londonTime(ms) {
  try {
    londonFormat = londonFormat || new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/London', weekday: 'short', month: 'numeric', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    });
    const p = {};
    for (const part of londonFormat.formatToParts(new Date(ms))) p[part.type] = part.value;
    return `${p.weekday} ${p.day} ${MONTHS[Number(p.month) - 1]}, ${p.hour}:${p.minute}`;
  } catch (e) {
    return `${new Date(ms).toISOString().slice(0, 16).replace('T', ' ')} UTC`;
  }
}

function referrerHost(ref) {
  if (!ref) return null;
  try {
    return new URL(ref).hostname || null;
  } catch (e) {
    return null;
  }
}

function compose(v) {
  const cf = v.cf || {};
  const asn = Number(cf.asn);
  const org = typeof cf.asOrganization === 'string' ? cf.asOrganization : '';
  const relay = RELAY_ASNS.has(asn);
  const datacenter = !relay && (DATACENTER_ASNS.has(asn) || DATACENTER_ORG.test(org));
  const name = previewName(v.kind, v.slug);
  const tag = v.tag ? `, for ${v.tag}` : '';
  const fromSite = v.refHost !== null && v.siteHosts.has(v.refHost);

  let title, silent, priority;
  if (datacenter) {
    title = `Scanner? ${name}${tag}`; silent = true; priority = 1;
  } else if (v.kind === 'concepts' || v.tag) {
    title = `${name} opened${tag}`; silent = false; priority = 4;
  } else if (fromSite) {
    title = `${name} opened from your site`; silent = true; priority = 2;
  } else {
    title = `${name} opened`; silent = false; priority = 3;
  }

  const lines = [
    placeOf(cf),
    `${deviceOf(v.ua)} · ${browserOf(v.ua)}`,
    v.refHost === null ? NO_REFERRER : fromSite ? 'From your site' : `From ${v.refHost}`,
    londonTime(v.at),
    v.path,
  ];
  if (datacenter) lines.push('Cloud network: likely an email link scanner, not a person');
  else if (relay) lines.push('Private Relay or VPN: location is rough');
  else if (MOBILE_ORG.test(org)) lines.push("Mobile network: the town is often the operator's hub");
  return { title, message: lines.join('\n'), silent, priority };
}

async function sha256hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function deliver(env, channel, m) {
  let url;
  const headers = { 'Content-Type': 'application/json' };
  let body;
  if (channel === 'telegram') {
    url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    // Plain text, no parse_mode. The path has no scheme, so Telegram neither
    // links it nor fetches a preview of it.
    body = {
      chat_id: env.TELEGRAM_CHAT_ID,
      text: `${m.title}\n${m.message}`,
      disable_notification: m.silent,
      link_preview_options: { is_disabled: true },
    };
  } else {
    // JSON rather than headers, so a city such as Łódź never hits the
    // Latin-1 limit on fetch headers.
    url = 'https://ntfy.sh/';
    if (env.NTFY_TOKEN) headers.Authorization = `Bearer ${env.NTFY_TOKEN}`;
    body = { topic: env.NTFY_TOPIC, title: m.title, message: m.message, priority: m.priority };
  }
  let status;
  try {
    // A hung connection is abandoned after 5 s, so waitUntil always settles.
    const signal = typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(SEND_TIMEOUT_MS) : undefined;
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal });
    if (res.ok) return;
    status = res.status;
  } catch (e) {
    status = e && e.name === 'TimeoutError' ? 'timeout' : 'network error';
  }
  // Never the token, topic, IP or user agent.
  console.error('[preview-alert] send failed', channel, status);
}

function cacheOf() {
  try {
    return typeof caches !== 'undefined' && caches.default ? caches.default : null;
  } catch (e) {
    return null;
  }
}

// A missing or failing cache means a possible extra alert, never a lost one.
async function cacheGet(cache, key) {
  try {
    return (await cache.match(key)) || null;
  } catch (e) {
    return null;
  }
}
async function cachePut(cache, key, body, seconds) {
  try {
    await cache.put(key, new Response(body, { headers: { 'Cache-Control': `max-age=${seconds}` } }));
  } catch (e) { /* send anyway */ }
}

async function sendAlert(env, channel, v) {
  try {
    // Every key is a one-way hash, and the secret in it stops anyone
    // reversing it by trying every IPv4 address. No raw IP is stored.
    const secret = channel === 'telegram' ? env.TELEGRAM_BOT_TOKEN : env.NTFY_TOPIC;
    const visit = `${secret}|${v.ip}|${v.ua}|${v.kind}/${v.slug}|`;
    const seen = `https://${APEX}/__alert-seen/${await sha256hex(visit + v.tag)}`;
    const seenUntagged = v.tag ? `https://${APEX}/__alert-seen/${await sha256hex(visit)}` : seen;
    const perIp = `https://${APEX}/__alert-ip/${await sha256hex(`${secret}|ip|${v.ip}`)}`;
    const cache = cacheOf();
    if (cache) {
      // One visit, one alert. A preview's privacy and terms pages share its
      // key. The ?for= tag is part of the key, so a tagged link always alerts
      // once, even after an untagged open from the same browser.
      if (await cacheGet(cache, seen)) return;
      // At most three alerts per IP address in 30 minutes, so nobody can
      // flood the phone by changing the user agent, tag or referrer.
      let count = { n: 0, start: v.at };
      const held = await cacheGet(cache, perIp);
      if (held) {
        try {
          const c = JSON.parse(await held.text());
          if (Number.isFinite(c.n) && Number.isFinite(c.start) && v.at - c.start < WINDOW_SECONDS * 1000) count = c;
        } catch (e) { /* start a new window */ }
      }
      if (count.n >= ALERTS_PER_IP) return;
      await cachePut(cache, seen, '1', WINDOW_SECONDS);
      // A tagged open also covers the untagged sub-pages it links to.
      if (seenUntagged !== seen) await cachePut(cache, seenUntagged, '1', WINDOW_SECONDS);
      const left = Math.max(1, Math.ceil((count.start + WINDOW_SECONDS * 1000 - v.at) / 1000));
      await cachePut(cache, perIp, JSON.stringify({ n: count.n + 1, start: count.start }), left);
    }
    await deliver(env, channel, compose(v));
  } catch (e) {
    console.error('[preview-alert] failed', e && e.name);
  }
}

// Removes Cloudflare Web Analytics from preview pages. Pages injects the
// beacon into every HTML file, and the concept and demo pages promise no
// analytics. The notification replaces what the beacon measured there.
const PAGES_SNIPPET = /<!-- Cloudflare Pages Analytics -->[\s\S]*?<!-- Cloudflare Pages Analytics -->/g;
const BARE_BEACON = /<script\b[^>]*static\.cloudflareinsights\.com\/beacon\.min\.js[^>]*>\s*<\/script>/gi;

export function stripBeacon(html) {
  if (!html.includes('Cloudflare Pages Analytics') && !html.includes('cloudflareinsights')) return html;
  return html.replace(PAGES_SNIPPET, '').replace(BARE_BEACON, '');
}

async function stripResponse(res) {
  const type = res.headers.get('content-type') || '';
  if (!res.body || res.status === 204 || res.status === 304 || !/text\/html/i.test(type)) return res;
  const html = stripBeacon(await res.text());
  const headers = new Headers(res.headers);
  headers.delete('content-length');
  return new Response(html, { status: res.status, statusText: res.statusText, headers });
}

async function previewWatch(context) {
  const { request } = context;
  const url = new URL(request.url);
  const path = normalisePath(url.pathname);
  if (!UNDER_PREVIEWS.test(path)) return context.next(); // every other path, byte for byte

  const env = context.env || {};
  const m = PREVIEW_PATH.exec(path);
  const channel = channelOf(env);
  let visit = null;
  if (m && channel && isPreviewOpen(request, url, env, m[3])) {
    const alertHost = env.ALERT_HOST || APEX;
    const rawTag = (url.searchParams.get('for') || '').toLowerCase();
    visit = {
      kind: m[1],
      slug: m[2],
      path,
      tag: TAG.test(rawTag) ? rawTag : '',
      ua: request.headers.get('User-Agent') || '',
      ip: request.headers.get('CF-Connecting-IP') || '',
      refHost: referrerHost(request.headers.get('Referer')),
      siteHosts: new Set([alertHost, APEX, `www.${APEX}`]),
      cf: request.cf || {},
      at: Date.now(),
    };
  }

  const response = await context.next();
  // 304 is a returning browser revalidating: still an open.
  if (visit && (response.status === 200 || response.status === 304)) {
    context.waitUntil(sendAlert(env, channel, visit));
  }
  return stripResponse(response);
}

export const onRequest = [hostRedirects, quietSwitch, previewWatch];
