/* ===== The one place to edit ===== */
var TW_GA4_ID = 'G-F1TEBTR40D';
var TW_ADS_ID = '';          // 'AW-' and digits, from Google Ads once the account exists
var TW_ADS_LEAD_LABEL = '';  // the label of the "Enquiry sent" conversion action
/* ===== Nothing below needs changing to switch Ads on: fill both slots above and push. =====

   Cookie choice for tempanywebstudios.co.uk (loaded with defer from every main page).
   - Nothing from Google is fetched until the visitor allows a purpose on the slip
     (Google's consent mode, basic version). Analytics and Ads are asked separately.
   - The answer is kept in localStorage 'tws-consent' as {v:1, analytics, ads, at}, and
     asked again after 182 days. A browser sending Global Privacy Control is never asked
     and never gets the tag. Preview pages (/demos/, /concepts/) get nothing at all.
   - Refusing later deletes the Google cookies this site set and stops everything at once.
   - The slip is built here, so with JavaScript off there is no slip and no tag.
   The text goes in with textContent only. */
(function (GA4, ADS, LABEL) {
  'use strict';
  var path = location.pathname;
  try { path = decodeURIComponent(path); } catch (e) {}
  if (/^\/+(demos|concepts)\//i.test(path.replace(/\/{2,}/g, '/')) || window.__twConsent) return;
  window.__twConsent = true;

  var DAY = 864e5, KEY = 'tws-consent', OFF = 'ga-disable-' + GA4;
  var adsOK = /^AW-\d{6,12}$/.test(ADS) && /^[A-Za-z0-9_-]{6,40}$/.test(LABEL);
  var me = document.currentScript;
  var tagOff = !!me && me.getAttribute('data-tag') === 'off';
  var gpc = navigator.globalPrivacyControl === true;
  var canStore = true;
  var state = null;        // {analytics, ads, at} once answered (stored or on this page), else null
  var loaded = false, did = { ga: false, aw: false };
  var mode = null, opener = null;

  // ---- the stored answer (PLAN C2): anything malformed, older than 182 days or more than a day ahead is no answer
  function read() {
    var raw = null, r = null;
    try { raw = window.localStorage.getItem(KEY); } catch (e) { canStore = false; return null; }
    if (raw === null) return null;
    try { r = JSON.parse(raw); } catch (e) { return null; }
    if (!r || r.v !== 1 || typeof r.analytics !== 'boolean' || typeof r.ads !== 'boolean' || typeof r.at !== 'number' || !isFinite(r.at)) return null;
    var age = Date.now() - r.at;
    return age < -DAY || age >= 182 * DAY ? null : { analytics: r.analytics, ads: r.ads, at: r.at };
  }
  function write(s) {
    try { window.localStorage.setItem(KEY, JSON.stringify({ v: 1, analytics: s.analytics, ads: s.ads, at: s.at })); }
    catch (e) { canStore = false; }
  }

  // ---- Google's cookies on this site, deleted by name pattern on every parent domain (PLAN C4)
  var GA_RE = /^(_ga$|_ga_|_gid$|_gat)/, AD_RE = /^(_gcl_|_gac_)/;
  function drop(re, ads) {
    var parts = location.hostname.split('.'), doms = [''], i;
    for (i = 0; i < parts.length - 1; i++) doms.push('; domain=.' + parts.slice(i).join('.'));
    var tail = '=; max-age=0; path=/', sec = location.protocol === 'https:' ? '; secure' : '';
    document.cookie.split(';').forEach(function (c) {
      var n = c.split('=')[0].replace(/^\s+|\s+$/g, '');
      if (re.test(n)) doms.forEach(function (d) { document.cookie = n + tail + d + sec; });
    });
    if (ads) try {
      for (i = localStorage.length - 1; i >= 0; i--) { var k = localStorage.key(i); if (k && k.indexOf('_gcl_') === 0) localStorage.removeItem(k); }
    } catch (e) {}
  }

  // ---- the Google tag (PLAN C3), only ever after a yes
  function gtag() { (window.dataLayer = window.dataLayer || []).push(arguments); }
  var G = function (b) { return b ? 'granted' : 'denied'; };
  function configGA() { did.ga = true; gtag('config', GA4, { allow_google_signals: false, allow_ad_personalization_signals: false, cookie_expires: 15724800 }); }
  function configAW() { did.aw = true; gtag('config', ADS, { allow_ad_personalization_signals: false }); }
  function wanted(s) { return !!s && !tagOff && !gpc && (s.analytics || (s.ads && adsOK)); }
  function setup() {
    if (loaded || !wanted(state)) return;
    loaded = true;
    if (state.analytics && window[OFF]) window[OFF] = false;
    gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' });
    gtag('set', 'ads_data_redaction', true);
    gtag('consent', 'update', { analytics_storage: G(state.analytics), ad_storage: G(state.ads), ad_user_data: G(state.ads) });
    gtag('js', new Date());
    if (state.analytics) configGA();
    if (state.ads && adsOK) configAW();
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + (state.analytics ? GA4 : ADS);
    document.head.appendChild(s);
  }
  // A returning visitor's tag waits for the load event and for the first contentful paint
  // (on a fast connection the page can finish loading before it has painted anything).
  function afterLoad(fn) {
    var done = false, run = function () { if (!done) { done = true; setTimeout(fn, 0); } };
    var go = function () {
      try {
        if (performance.getEntriesByName('first-contentful-paint').length) return run();
        new PerformanceObserver(function (l) { if (l.getEntriesByName('first-contentful-paint').length) run(); }).observe({ type: 'paint', buffered: true });
      } catch (e) {}
      requestAnimationFrame(function () { requestAnimationFrame(run); });
    };
    if (document.readyState === 'complete') go(); else addEventListener('load', go);
  }

  // A change of answer on this page: withdraw what was refused, grant what was allowed (PLAN C5).
  function apply(next, now) {
    state = next;
    if (loaded) {
      gtag('consent', 'update', { analytics_storage: G(next.analytics), ad_storage: G(next.ads), ad_user_data: G(next.ads), ad_personalization: 'denied' });
      if (next.analytics) { if (window[OFF]) window[OFF] = false; if (!did.ga) configGA(); }
      if (next.ads && adsOK && !did.aw) configAW();
    } else if (wanted(next)) {
      if (now) setup(); else afterLoad(setup);
    }
    if (!next.analytics) { window[OFF] = true; drop(GA_RE); }
    if (!next.ads) drop(AD_RE, true);
    status();
  }

  // ---- words
  var WHEN = function (at) { return new Date(at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); };
  function said(s) { return 'Google Analytics ' + (s.analytics ? 'allowed' : 'refused') + ', Google Ads ' + (s.ads ? 'allowed' : 'refused'); }
  function status() {
    var p = document.getElementById('cookieStatus');
    if (!p) return;
    p.textContent = 'In this browser: ' + (gpc ? 'Google is off, because your browser sends Global Privacy Control.'
      : !canStore ? "your choice can't be saved, so you'll be asked on each page."
      : state ? said(state) + ', since ' + WHEN(state.at) + '.' : 'no choice made yet.');
    p.hidden = false;
  }

  // ---- the slip (PLAN C6): a torn-off sheet of the pad, built here
  function h(tag, attrs, kids) {
    var e = document.createElement(tag), k;
    for (k in attrs) if (k === 'text') e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]);
    (kids || []).forEach(function (c) { e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  var CSS = '#consent{position:fixed;z-index:70;left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom,0px));color:#4a463f;font:400 1rem/1.35 var(--sc-font-text);letter-spacing:0;word-spacing:.04em;text-align:left;transform:rotate(-.4deg);'
    + 'box-shadow:0 1px 1px rgba(70,56,30,.1),0 8px 18px -8px rgba(70,56,30,.3),0 30px 50px -30px rgba(70,56,30,.35)}'
    + ':root[data-theme=dark] #consent{box-shadow:0 1px 2px rgba(0,0,0,.5),0 14px 30px -10px rgba(0,0,0,.75),0 40px 80px -30px rgba(0,0,0,.9)}'
    + '#consent[hidden],#consent [hidden]{display:none!important}'
    // the perforated top edge: the tear-off's holes, 6px every 14px, painted rather than cut, so they still read
    // where the slip lies over the paper sheet (cut holes vanish there)
    + '.tw-cc__in{background:radial-gradient(circle at 7px 7px,#d3cab8 2.2px,#e4ddcf 2.9px,#0000 3.4px) 0 0/14px 14px repeat-x,#fbf8f1;padding:18px 14px 12px}'
    + '.tw-cc__q,.tw-cc__now{margin:0}.tw-cc__now{margin-top:6px}.tw-cc__q strong{font-weight:700}'
    + '#consent a{display:inline-block;padding:12px 0;margin:-12px 0;color:#4a463f;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:.2em}'
    + '.tw-cc__acts{display:flex;align-items:center;gap:8px;margin-top:10px}'
    + '#consent button{min-height:44px;margin:0;color:#4a463f;background:none;font:700 1rem/1.1 var(--sc-font-text);letter-spacing:0;cursor:pointer;-webkit-tap-highlight-color:transparent}'
    + '.tw-cc__btn{flex:1 1 0;min-width:0;padding:0 6px;border:1.4px solid #4a463f;border-radius:3px}'
    + '#consent .tw-cc__choose{flex:none;padding:0 6px;border:0;font-weight:400;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:.2em}'
    + '.tw-cc__pick{border:0;margin:6px 0 0;padding:0;min-width:0}.tw-cc__pick legend{padding:0;font-weight:700}'
    + '.tw-cc__tick{position:relative;display:flex;align-items:center;gap:10px;min-height:44px;cursor:pointer}'
    + '.tw-cc__tick input{position:absolute;left:0;top:50%;width:18px;height:18px;margin:-9px 0 0;opacity:0}'
    + ".tw-cc__box{flex:none;width:18px;height:18px;background:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M10.4 2.7C5.6 2.3 2.5 5.6 2.6 10.1C2.7 14.5 5.9 17.5 10.1 17.4C14.5 17.3 17.5 14.2 17.4 9.9C17.3 5.4 14.2 2.6 9.5 2.9C7.9 3 6.4 3.7 5.5 4.6' fill='none' stroke='%234a463f' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\") center/contain no-repeat}"
    + ".tw-cc__tick input:checked+.tw-cc__box{background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M10.4 2.7C5.6 2.3 2.5 5.6 2.6 10.1C2.7 14.5 5.9 17.5 10.1 17.4C14.5 17.3 17.5 14.2 17.4 9.9C17.3 5.4 14.2 2.6 9.5 2.9C7.9 3 6.4 3.7 5.5 4.6' fill='none' stroke='%234a463f' stroke-width='1.5' stroke-linecap='round'/%3E%3Cpath d='M7.2 9.1C8.4 7.4 11.8 7.1 12.9 9C13.8 10.7 12.2 13 9.7 12.9C7.7 12.8 6.9 11.2 7.9 9.9C8.9 8.7 11.4 8.8 11.7 10.3C11.9 11.3 10.6 11.8 9.6 11.2' fill='none' stroke='%234a463f' stroke-width='2.3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")}"
    + '.tw-cc__save{display:block;width:100%;margin-top:4px!important}'
    + '#consent:focus{outline:none}#consent:focus-visible,#consent a:focus-visible,#consent button:focus-visible,.tw-cc__tick:has(:focus-visible){outline:2px solid #4a463f;outline-offset:3px}'
    + '.tw-cc-vh{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}'
    + 'html.tw-cc-on{scroll-padding-bottom:var(--tw-cc-h)}html.tw-cc-on body{padding-bottom:var(--tw-cc-h)}'
    + '@media (min-width:720px){#consent{left:auto;width:30rem;max-width:calc(100% - 20px)}}'
    + '@media print{#consent{display:none!important}}';

  var slip, now, pick, ticks, save, live, bar;
  function build() {
    document.head.appendChild(h('style', { text: CSS }));
    var tick = function (name, words) { return h('label', { class: 'tw-cc__tick' }, [h('input', { type: 'checkbox', name: name }), h('span', { class: 'tw-cc__box', 'aria-hidden': 'true' }), words]); };
    now = h('p', { class: 'tw-cc__now', hidden: '' });
    save = h('button', { type: 'button', class: 'tw-cc__btn tw-cc__save', text: 'Save choice' });
    pick = h('fieldset', { class: 'tw-cc__pick', id: 'twCcPick', hidden: '' }, [h('legend', { text: 'Choose which' }), tick('analytics', 'Google Analytics: count visits and enquiries'), tick('ads', 'Google Ads: see whether an advert brought you'), save]);
    ticks = pick.querySelectorAll('input');
    var choose = h('button', { type: 'button', class: 'tw-cc__choose', 'aria-expanded': 'false', 'aria-controls': 'twCcPick', text: 'Choose' });
    slip = h('div', { id: 'consent', role: 'region', 'aria-label': 'Cookie choice', tabindex: '-1', hidden: '' }, [h('div', { class: 'tw-cc__in' }, [
      h('p', { class: 'tw-cc__q' }, [h('strong', { text: 'Can Google count this visit?' }), ' Analytics counts visits and enquiries, and Ads checks if an advert brought you. Both use cookies; neither picks adverts for you. ', h('a', { href: '/privacy/#cookies', text: 'How this works' })]),
      now,
      h('div', { class: 'tw-cc__acts' }, [h('button', { type: 'button', class: 'tw-cc__btn', 'data-consent': 'accept', text: 'Allow both' }), h('button', { type: 'button', class: 'tw-cc__btn', 'data-consent': 'reject', text: 'Refuse both' }), choose]),
      pick])]);
    live = h('p', { class: 'tw-cc-vh', id: 'twCcSaid', 'aria-live': 'polite' });
    var skip = document.querySelector('.skip');
    if (skip && skip.parentNode) skip.parentNode.insertBefore(slip, skip.nextSibling); else document.body.insertBefore(slip, document.body.firstChild);
    document.body.appendChild(live);
    bar = document.querySelector('.tw-index');
    slip.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('button') : null;
      if (!b) return;
      var c = b.getAttribute('data-consent');
      if (c) decide(c === 'accept', c === 'accept');
      else if (b === save) decide(ticks[0].checked, ticks[1].checked);
      else { var open = pick.hidden; pick.hidden = !open; b.setAttribute('aria-expanded', String(open)); place(); }
    });
    if (window.ResizeObserver) { var ro = new ResizeObserver(place); ro.observe(slip); if (bar) ro.observe(bar); }
    addEventListener('resize', place);
  }

  // Where the slip sits: 8px above the index bar on the sub-pages, 10px above the foot on the homepage.
  // While it is open, --tw-cc-h lets the page scroll its last line, or a focused field, clear of it.
  function place() {
    if (!slip || slip.hidden) return;
    if (bar) slip.style.bottom = Math.max(0, innerHeight - bar.getBoundingClientRect().top) + 8 + 'px';
    document.documentElement.style.setProperty('--tw-cc-h', Math.ceil(innerHeight - slip.getBoundingClientRect().top + 8) + 'px');
  }
  function links(open) {
    document.querySelectorAll('[data-cookie-choice]').forEach(function (l) { l.setAttribute('aria-expanded', String(open)); });
  }
  function show(m, from) {
    if (!slip) build();
    mode = m; opener = from || null;
    var change = m === 'change';
    pick.hidden = !change;
    slip.querySelector('.tw-cc__choose').setAttribute('aria-expanded', String(change));
    ticks[0].checked = change && !!state && state.analytics;
    ticks[1].checked = change && !!state && state.ads;
    now.hidden = !change;
    now.textContent = 'Now: ' + (state ? said(state) + ', since ' + WHEN(state.at) + '.' : 'no choice made yet.');
    slip.hidden = false;
    document.documentElement.classList.add('tw-cc-on');
    links(true);
    place();
    if (change) slip.focus();
  }
  function hide(back) {
    var inside = slip && slip.contains(document.activeElement);
    var next = null;
    if (inside && !back) {
      var all = document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,summary,[tabindex]:not([tabindex="-1"])');
      for (var i = 0; i < all.length && !next; i++) {
        var el = all[i];
        if (!slip.contains(el) && (slip.compareDocumentPosition(el) & 4) && el.getClientRects().length && !el.disabled) next = el;
      }
    }
    slip.hidden = true;
    mode = null;
    document.documentElement.classList.remove('tw-cc-on');
    document.documentElement.style.removeProperty('--tw-cc-h');
    links(false);
    var to = back || next;
    if (to) try { to.focus({ preventScroll: true }); } catch (e) { to.focus(); }
  }
  function decide(analytics, ads) {
    var back = mode === 'change' ? opener : null;
    var s = { analytics: analytics, ads: ads, at: Date.now() };
    apply(s, true);
    if (canStore && !gpc) write(s);
    status();
    hide(back);
    live.textContent = '';
    setTimeout(function () { live.textContent = 'Saved. ' + said(s) + '.'; }, 50);
  }

  // ---- "Cookie choice" at the foot of every page, and the button in the privacy notice (PLAN C9)
  function wire() {
    document.querySelectorAll('[data-cookie-choice]').forEach(function (l) {
      if (gpc) return;   // with Global Privacy Control the link just goes to the notice
      if (l.tagName === 'A') l.setAttribute('role', 'button');
      l.hidden = false;
      l.setAttribute('aria-controls', 'consent');
      l.setAttribute('aria-expanded', 'false');
      l.addEventListener('click', function (e) {
        e.preventDefault();
        if (mode === 'change') hide(l); else show('change', l);
      });
      l.addEventListener('keydown', function (e) {
        if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); l.click(); }
      });
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mode === 'change') hide(opener);
  });

  // ---- arrival
  function arrive() {
    var s = gpc ? null : read();
    if (gpc) {
      window[OFF] = true;
      drop(GA_RE); drop(AD_RE, true);
    } else if (s) {
      state = s;
      if (!s.analytics) { window[OFF] = true; drop(GA_RE); }
      if (!s.ads) drop(AD_RE, true);
      if (wanted(s)) afterLoad(setup);
    } else {
      window[OFF] = true;
      drop(GA_RE); drop(AD_RE, true);
      if (!tagOff) show('arrival');
    }
    status();
  }
  // Another tab answered, or the page came back from the back-forward cache: follow what is stored now.
  function follow() {
    if (gpc || !canStore) return;
    var s = read();
    if (s && state && s.analytics === state.analytics && s.ads === state.ads && s.at === state.at) return;
    if (s) { apply(s, false); if (mode === 'arrival') hide(); }
    else if (state) { apply({ analytics: false, ads: false, at: Date.now() }, false); state = null; status(); if (!tagOff && !mode) show('arrival'); }
  }
  addEventListener('storage', function (e) { if (e.key === KEY || e.key === null) follow(); });
  addEventListener('pageshow', function (e) { if (e.persisted) follow(); });

  wire();
  arrive();
})(TW_GA4_ID, TW_ADS_ID, TW_ADS_LEAD_LABEL);
