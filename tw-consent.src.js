/* The cookie choice and the Google tag for tempanywebstudios.co.uk: the readable source.
   Pages load tw-consent.js, whose config block (the Google IDs and the forms' key) is the one place to edit.
   Below that block, tw-consent.js holds this engine minified: after editing this file, run build-min.sh,
   which keeps the config block as it is and rebuilds the rest. Nothing from Google loads before a yes
   (consent mode, basic), Analytics and Ads are asked separately, the answer is kept in localStorage
   'tws-consent' for 182 days, Global Privacy Control counts as a refusal, and previews get nothing. */
(function (GA4, ADS, LABEL, FORM) {
  'use strict';
  var path = location.pathname;
  try { path = decodeURIComponent(path); } catch (e) {}
  if (/^\/+(demos|concepts)\//i.test(path.replace(/\/{2,}/g, '/')) || window.__twConsent) return;
  window.__twConsent = true;

  // How they arrived (PLAN C10): one of two fixed strings from the address at send time; copies and stores nothing.
  window.twArrivedFrom = function () {
    var q = new URLSearchParams(location.search);
    var src = (q.get('utm_source') || '').toLowerCase(), med = (q.get('utm_medium') || '').toLowerCase();
    var ad = /[?&](gclid|gbraid|wbraid)=[^&#]/.test(location.search) || (src === 'google' && /^(cpc|ppc|paid|paidsearch)$/.test(med));
    return ad ? 'Google advert' : 'Not marked as from an advert';
  };

  var DAY = 864e5, KEY = 'tws-consent', OFF = 'ga-disable-' + GA4;
  var adsOK = /^AW-\d{6,12}$/.test(ADS) && /^[A-Za-z0-9_-]{6,40}$/.test(LABEL);
  var me = document.currentScript;
  var tagOff = !!me && me.getAttribute('data-tag') === 'off';
  var gpc = navigator.globalPrivacyControl === true;
  var canStore = true;
  var state = null;        // {analytics, ads, at} once answered (stored or on this page), else null
  var loaded = false, did = { ga: false, aw: false };
  var mode = null, opener = null;

  // The stored answer (C2): malformed, 182 days old or a day ahead counts as none.
  function read() {
    var raw = null, r = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { canStore = false; return null; }
    if (raw === null) return null;
    try { r = JSON.parse(raw); } catch (e) { return null; }
    if (!r || r.v !== 1 || typeof r.analytics !== 'boolean' || typeof r.ads !== 'boolean' || typeof r.at !== 'number' || !isFinite(r.at)) return null;
    var age = Date.now() - r.at;
    return age < -DAY || age >= 182 * DAY ? null : { analytics: r.analytics, ads: r.ads, at: r.at };
  }
  function write(s) {
    try { localStorage.setItem(KEY, JSON.stringify({ v: 1, analytics: s.analytics, ads: s.ads, at: s.at })); }
    catch (e) { canStore = false; }
  }

  // Google's cookies, deleted by name on this host and every parent domain (C4).
  var GA_RE = /^(_ga$|_ga_|_gid$|_gat)/, AD_RE = /^(_gcl_|_gac_)/;
  function drop(re, ads) {
    var parts = location.hostname.split('.'), doms = [''], i;
    for (i = 0; i < parts.length - 1; i++) doms.push('; domain=.' + parts.slice(i).join('.'));
    var tail = '=; max-age=0; path=/', sec = location.protocol === 'https:' ? '; secure' : '';
    document.cookie.split(';').forEach(function (c) {
      var n = c.split('=')[0].trim();
      if (re.test(n)) doms.forEach(function (d) { document.cookie = n + tail + d + sec; });
    });
    if (ads) try {
      for (i = localStorage.length - 1; i >= 0; i--) { var k = localStorage.key(i); if (k && k.indexOf('_gcl_') === 0) localStorage.removeItem(k); }
    } catch (e) {}
  }

  // Withdrawing Analytics (Logan, 1 Oct 2026): the random ID in _ga is read before the cookie goes and sent once,
  // with the date and nothing else, through the forms' service; Logan deletes that ID's visits in Google Analytics.
  function gaIds() {
    var ids = [];
    document.cookie.split(';').forEach(function (c) {
      var i = c.indexOf('='), m = i > 0 && c.slice(0, i).trim() === '_ga' && /\d+\.\d+$/.exec(c.slice(i + 1).trim());
      if (m && ids.indexOf(m[0]) < 0) ids.push(m[0]);
    });
    return ids;
  }
  function erase(ids) {
    if (!ids.length || !FORM) return;
    try {
      fetch('https://api.web3forms.com/submit', { method: 'POST', keepalive: true, credentials: 'omit', redirect: 'manual', headers: { Accept: 'application/json' },
        body: new URLSearchParams({ access_key: FORM, subject: 'Delete Google Analytics data', message: 'Client ID: ' + ids.join(', ') + '\nDate: ' + WHEN(Date.now()) }) })['catch'](function () {});
    } catch (e) {}
  }

  // Unless Ads is allowed, Google Analytics gets the address (and a same-site referrer) without advert click IDs.
  var CLICK = /^(gclid|gbraid|wbraid|dclid|gclsrc)$/i;
  function strip(u) {
    var cut = 0, m = /^([^?#]*)(?:\?([^#]*))?/.exec(u), q = (m[2] || '').split('&').filter(function (p) {
      var k = p.split('=')[0];
      try { k = decodeURIComponent(k); } catch (e) {}
      return !(CLICK.test(k) && ++cut);
    }).join('&');
    return cut ? m[1] + (q ? '?' + q : '') : '';
  }
  function clean() {
    var o = {}, l = strip(location.href), r = document.referrer, s = !r.indexOf(location.origin + '/') && strip(r);
    if (l) o.page_location = l;
    if (s) o.page_referrer = s;
    return o;
  }

  // The Google tag (C3), only ever after a yes.
  function gtag() { (window.dataLayer = window.dataLayer || []).push(arguments); }
  var G = function (b) { return b ? 'granted' : 'denied'; };
  function configGA() {
    did.ga = true;
    var p = { allow_google_signals: false, allow_ad_personalization_signals: false, cookie_expires: 15724800 }, c = state.ads ? {} : clean(), k;
    for (k in c) p[k] = c[k];
    gtag('config', GA4, p);
  }
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
  // A returning visitor's tag waits for load and for the first contentful paint, which can come later.
  function afterLoad(fn) {
    var done = false, run = function () { if (!done) { done = true; setTimeout(fn, 0); } };
    var go = function () {
      try {
        if (performance.getEntriesByName('first-contentful-paint').length) return run();
        if ((PerformanceObserver.supportedEntryTypes || []).indexOf('paint') > -1)
          return new PerformanceObserver(function (l) { if (l.getEntriesByName('first-contentful-paint').length) run(); }).observe({ type: 'paint', buffered: true });
      } catch (e) {}
      requestAnimationFrame(function () { requestAnimationFrame(run); });   // no paint timing here
    };
    if (document.readyState === 'complete') go(); else addEventListener('load', go);
  }

  // A new answer: withdraw what was refused, grant what was allowed (C5). A lapse (record expired or gone) is not a withdrawal.
  function apply(next, now, lapse) {
    var was = state, ids = !lapse && was && was.analytics && !next.analytics ? gaIds() : [];
    state = next;
    if (loaded) {
      gtag('consent', 'update', { analytics_storage: G(next.analytics), ad_storage: G(next.ads), ad_user_data: G(next.ads), ad_personalization: 'denied' });
      if (next.analytics) { if (window[OFF]) window[OFF] = false; if (!did.ga) configGA(); }
      if (next.ads && adsOK && !did.aw) configAW();
      if (did.ga && was && was.ads && !next.ads) { var c = clean(); if (c.page_location || c.page_referrer) gtag('set', c); }
    } else if (wanted(next)) {
      if (now) setup(); else afterLoad(setup);
    }
    if (!next.analytics) { window[OFF] = true; drop(GA_RE); }
    if (!next.ads) drop(AD_RE, true);
    erase(ids);
    status();
  }

  // The lead (C10): once per successful enquiry, for what is allowed now; only the form's name goes.
  window.twLead = function (name) {
    if (typeof name !== 'string' || !/^(home|audit|stirling)$/.test(name) || !wanted(state)) return;
    if (!loaded) setup();   // sent before load: the yes is already given
    if (state.analytics) gtag('event', 'generate_lead', { send_to: GA4, form_name: name });
    if (state.ads && adsOK) gtag('event', 'conversion', { send_to: ADS + '/' + LABEL });
  };

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

  // The slip (C6), a torn-off sheet of the pad. Text goes in with textContent only.
  function h(tag, attrs, kids) {
    var e = document.createElement(tag), k;
    for (k in attrs) if (k === 'text') e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]);
    (kids || []).forEach(function (c) { e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  // The slip carries its own type, ink and spacing, set on every element in it under its id, so no page rule for
  // p, strong or a can reach in: it reads and measures the same at the foot or in the page, in either theme, on
  // every page. Bold runs take the site's wider word gap (.065em) everywhere, the homepage included.
  var CSS = '#consent{position:fixed;z-index:70;left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom,0px));color:#4a463f;font:400 1rem/1.35 var(--sc-font-text);letter-spacing:0;word-spacing:.04em;text-align:left;text-wrap:pretty;overflow-wrap:break-word;transform:rotate(-.4deg);'
    + 'box-shadow:0 1px 1px rgba(70,56,30,.1),0 8px 18px -8px rgba(70,56,30,.3),0 30px 50px -30px rgba(70,56,30,.35)}'
    + ':root[data-theme=dark] #consent{box-shadow:0 1px 2px rgba(0,0,0,.5),0 14px 30px -10px rgba(0,0,0,.75),0 40px 80px -30px rgba(0,0,0,.9)}'
    + '#consent[hidden],#consent [hidden]{display:none!important}'
    + '#consent p,#consent strong,#consent legend,#consent label{margin:0;padding:0;max-width:none;color:inherit;font:inherit}#consent strong,#consent legend{font-weight:700;word-spacing:.065em}'
    // the tear-off's holes, 6px every 14px, painted: cut holes vanish where the slip lies over the sheet
    + '#consent .tw-cc__in{background:radial-gradient(circle at 7px 7px,#d3cab8 2.2px,#e4ddcf 2.9px,#0000 3.4px) 0 0/14px 14px repeat-x,#fbf8f1;padding:18px 14px 12px}'
    + '#consent .tw-cc__now{margin-top:6px}'
    + '#consent a{display:inline-block;padding:12px 0;margin:-12px 0;color:#4a463f}#consent a,#consent .tw-cc__choose{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:.2em}'
    + '#consent .tw-cc__acts{display:flex;align-items:center;gap:8px;margin-top:10px}'
    + '#consent button{min-height:44px;margin:0;color:#4a463f;background:none;font:700 1rem/1.1 var(--sc-font-text);letter-spacing:0;cursor:pointer}'
    + '#consent .tw-cc__btn{flex:1 1 0;min-width:0;padding:0 6px;border:1.4px solid #4a463f;border-radius:3px}'
    + '#consent .tw-cc__choose{flex:none;padding:0 6px;border:0;font-weight:400}'
    + '#consent fieldset{border:0;margin:6px 0 0;padding:0;min-width:0}'
    + '#consent label{position:relative;display:flex;align-items:center;gap:10px;min-height:44px;cursor:pointer}'
    + '#consent input{position:absolute;left:0;top:50%;width:18px;height:18px;margin:-9px 0 0;opacity:0}'
    + "#consent .tw-cc__box{flex:none;width:18px;height:18px;background:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M10.4 2.7C5.6 2.3 2.5 5.6 2.6 10.1C2.7 14.5 5.9 17.5 10.1 17.4C14.5 17.3 17.5 14.2 17.4 9.9C17.3 5.4 14.2 2.6 9.5 2.9C7.9 3 6.4 3.7 5.5 4.6' fill='none' stroke='%234a463f' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\") center/contain no-repeat}"
    + "#consent input:checked+.tw-cc__box{background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M10.4 2.7C5.6 2.3 2.5 5.6 2.6 10.1C2.7 14.5 5.9 17.5 10.1 17.4C14.5 17.3 17.5 14.2 17.4 9.9C17.3 5.4 14.2 2.6 9.5 2.9C7.9 3 6.4 3.7 5.5 4.6' fill='none' stroke='%234a463f' stroke-width='1.5' stroke-linecap='round'/%3E%3Cpath d='M7.2 9.1C8.4 7.4 11.8 7.1 12.9 9C13.8 10.7 12.2 13 9.7 12.9C7.7 12.8 6.9 11.2 7.9 9.9C8.9 8.7 11.4 8.8 11.7 10.3C11.9 11.3 10.6 11.8 9.6 11.2' fill='none' stroke='%234a463f' stroke-width='2.3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")}"
    + '#consent .tw-cc__save{display:block;width:100%;margin-top:4px}'
    + '#consent:focus{outline:none}#consent:focus-visible,#consent a:focus-visible,#consent button:focus-visible,#consent label:has(:focus-visible){outline:2px solid #4a463f;outline-offset:3px}'
    + '@supports not selector(:has(a)){#consent input:focus-visible+span{outline:2px solid #4a463f;outline-offset:3px}}'
    + '.tw-cc-vh{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}'
    + 'html.tw-cc-on{scroll-padding-bottom:var(--tw-cc-h)}html.tw-cc-on body{padding-bottom:var(--tw-cc-h)}'
    // compact on phones and short screens
    + '@media (max-width:719px),(max-height:500px){#consent{font-size:15px}#consent .tw-cc__in{padding:16px 12px 10px}#consent .tw-cc__acts{margin-top:8px}}'
    + '@media (min-width:720px){#consent{left:auto;width:30rem;max-width:calc(100% - 20px)}}'
    // in the page: on a phone it reaches out over the page's gutters to 10px from each edge, as wide as at the foot;
    // scrolled to from Cookie choice, 40px of the page stays above it, more than a footer still rising into place
    // (two 14px reveals) takes away, so the question stays in view
    + '#consent.tw-cc--in{position:relative;inset:auto;width:auto;max-width:30rem;margin:24px calc(10px - (100vw - 100%) / 2);scroll-margin-top:40px}@media (min-width:520px){#consent.tw-cc--in{margin:24px auto}}'
    // a fixed slip never runs past its room: it scrolls inside, question first
    + '#consent:not(.tw-cc--in){overflow-y:auto}'
    + '@media print{#consent{display:none!important}}';

  var slip, now, pick, ticks, save, live, bar, skip, where = 'bottom', kb = false, vw = innerWidth, turned = 0;
  // Lines a first-time visitor must still see: the homepage's bar, question, facts, proof, chips and name line,
  // the town pages' proof line, and the opening h1 and price line where a page has them.
  var KEEP = '.te,#skH1,.sk-facts,.sk-live,#skPick,#skNameRow,.tw-live,.tw-open-act h1,.tw-open-act .tw-label__facts', FOCUS = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[tabindex]:not([tabindex="-1"])';
  function build() {
    document.head.appendChild(h('style', { text: CSS }));
    var tick = function (name, words) { return h('label', { class: 'tw-cc__tick' }, [h('input', { type: 'checkbox', name: name }), h('span', { class: 'tw-cc__box', 'aria-hidden': 'true' }), words]); };
    now = h('p', { class: 'tw-cc__now', hidden: '' });
    save = h('button', { type: 'button', class: 'tw-cc__btn tw-cc__save', text: 'Save choice' });
    pick = h('fieldset', { class: 'tw-cc__pick', id: 'twCcPick', hidden: '' }, [h('legend', { text: 'Choose which' }), tick('analytics', 'Google Analytics: pages and where you came from, campaign tags included'), tick('ads', 'Google Ads: link an advert click to an enquiry'), save]);
    ticks = pick.querySelectorAll('input');
    var choose = h('button', { type: 'button', class: 'tw-cc__choose', 'aria-expanded': 'false', 'aria-controls': 'twCcPick', text: 'Choose' });
    slip = h('div', { id: 'consent', role: 'region', 'aria-label': 'Cookie choice', tabindex: '-1', hidden: '' }, [h('div', { class: 'tw-cc__in' }, [
      h('p', { class: 'tw-cc__q' }, [h('strong', { text: 'Can Google count this visit?' }), ' Analytics records pages and where you came from, campaign tags included. Ads links an advert click to an enquiry. Both use cookies. Change it with Cookie choice at the foot of the page; I ask again after 6 months. ', h('a', { href: '/privacy/#cookies', text: 'How this works' })]),
      now,
      h('div', { class: 'tw-cc__acts' }, [h('button', { type: 'button', class: 'tw-cc__btn', 'data-consent': 'accept', text: 'Allow both' }), h('button', { type: 'button', class: 'tw-cc__btn', 'data-consent': 'reject', text: 'Refuse both' }), choose]),
      pick])]);
    live = h('p', { class: 'tw-cc-vh', id: 'twCcSaid', 'aria-live': 'polite' });
    skip = document.querySelector('.skip');
    put('bottom');
    document.body.appendChild(live);
    bar = document.querySelector('.tw-index');
    slip.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('button') : null;
      if (!b) return;
      kb = !e.detail;   // pressed from the keyboard (a click by pointer has a count)
      var c = b.getAttribute('data-consent');
      if (c) decide(c === 'accept', c === 'accept');
      else if (b === save) decide(ticks[0].checked, ticks[1].checked);
      else { var open = pick.hidden; pick.hidden = !open; b.setAttribute('aria-expanded', String(open)); place(); }
    });
    if (window.ResizeObserver) { var ro = new ResizeObserver(keep); ro.observe(slip); ro.observe(document.documentElement); if (bar) ro.observe(bar); }
    addEventListener('resize', function () { if (innerWidth !== vw) { vw = innerWidth; turned = Date.now(); } keep(); });
  }

  // Two places, and once placed the slip stays there: Choose opening it out, or the phone turning, never moves it.
  // At the foot: fixed 8px above the index bar or 10px above the foot of the screen, capped to its room and
  // scrolling inside if it ever outgrows it; --tw-cc-h lets the last line or a focused field scroll clear of it.
  // In the page: at `at` ([parent, next sibling]).
  function put(w, at) {
    var f = document.activeElement, back = slip.contains(f);
    where = w === 'in' && !at ? 'bottom' : w;
    slip.classList.toggle('tw-cc--in', where === 'in');
    if (where === 'in') at[0].insertBefore(slip, at[1]);
    else if (skip && skip.parentNode) skip.parentNode.insertBefore(slip, skip.nextSibling); else document.body.insertBefore(slip, document.body.firstChild);
    if (back && document.activeElement !== f) f.focus({ preventScroll: true });
    place();
  }
  // The screen turned while someone is in a slip in the page: for a second, while the page lays itself out again
  // (scrollcraft's resize, WebKit's late reflow; WebKit keeps no reading place across it), the page scrolls back to
  // them. The slip itself stays where it is.
  function keep() {
    var f = document.activeElement;
    place();
    if (Date.now() - turned < 1000 && where === 'in' && slip.contains(f)) f.scrollIntoView({ block: f === slip ? 'start' : 'nearest', behavior: 'instant' });
  }
  // --tw-cc-h is what the page keeps free at its foot: the fixed slip and the bar, or in the page only the bar, so
  // a slip that ends up last on a short page (404) can still be scrolled clear of the bar.
  function place() {
    if (!slip) return;
    var d = document.documentElement, s = slip.style, on = !slip.hidden, foot = on && where === 'bottom', low = foot ? slip : on && bar;
    d.classList.toggle('tw-cc-on', !!low);
    s.bottom = foot && bar ? Math.max(0, innerHeight - bar.getBoundingClientRect().top) + 8 + 'px' : '';
    s.maxHeight = foot ? room() + 'px' : '';
    if (low) d.style.setProperty('--tw-cc-h', Math.ceil(innerHeight - low.getBoundingClientRect().top + 8) + 'px'); else d.style.removeProperty('--tw-cc-h');
  }
  // The room at the foot: from 8px below the top of the screen to 8px above the bar (or 10px above the foot).
  function room() { return (bar ? bar.getBoundingClientRect().top - 8 : innerHeight - 10) - 8; }
  function covers(sel) {
    var s = slip.getBoundingClientRect();
    return [].some.call(document.querySelectorAll(sel), function (e) {
      var r = e.getBoundingClientRect();
      return !slip.contains(e) && r.top < s.bottom + 4 && r.bottom > s.top - 4 && r.left < s.right && r.right > s.left;
    });
  }
  // One rule for both ways in. The slip is fixed at the foot only if the whole of it, Choose open, takes no more
  // than two thirds of the room, so a third is always left for the page and whatever has focus; on arrival it must
  // also leave KEEP clear by 4px. Otherwise it goes in the page: straight after the control that opened it, or on
  // arrival just below the first screen, so nothing on screen moves.
  function seat() {
    var by = opener && (opener.closest('p') || opener), was = pick.hidden, tall;
    put('bottom');
    pick.hidden = false; tall = slip.scrollHeight > room() * 2 / 3; pick.hidden = was;
    if (tall || mode === 'arrival' && covers(KEEP)) put('in', by ? [by.parentNode, by.nextSibling] : spot());
  }
  // In the page on arrival: before the first block that starts below the screen, else after the block the fold
  // runs through. It only goes down through plain page structure, never into a card, a list, a revealed group or
  // the homepage's sketchpad (there it goes after the first block).
  function spot() {
    var el = document.querySelector('main > *'), i, r, k;
    while (el && el.matches('section,.tw-page,.tw-open-act,.tw-open-act>div') && !el.querySelector('#sk')) {
      for (i = 0; (k = el.children[i]); i++) if (k !== slip && (r = k.getBoundingClientRect()).height && r.bottom > innerHeight) break;
      if (!k) break;
      if (r.top >= innerHeight) return [el, k];
      el = k;
    }
    return el && [el.parentNode, el.nextSibling];
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
    links(true);
    seat();
    if (change) { slip.focus({ preventScroll: true }); if (where === 'in') slip.scrollIntoView({ block: 'start', behavior: 'instant' }); }
  }
  // One rule for every close: focus goes back to the control that opened the slip, or else to the first control
  // after the slip that is not above the screen. If that is off screen, a keyboard user's page scrolls at once,
  // the least it can, to show it; after a pointer the page stays where it is.
  function hide(back) {
    var inside = slip && slip.contains(document.activeElement), to = back, all, i;
    slip.hidden = true;
    mode = null;
    place();
    links(false);
    if (inside && !to) for (all = document.querySelectorAll(FOCUS), i = 0; !to && i < all.length; i++)
      if ((slip.compareDocumentPosition(all[i]) & 4) && all[i].getClientRects().length && !all[i].disabled && all[i].getBoundingClientRect().top >= 0) to = all[i];
    if (to) { to.focus({ preventScroll: true }); if (kb) to.scrollIntoView({ block: 'nearest', behavior: 'instant' }); }
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

  // "Cookie choice" at the foot of the pages, and the privacy notice's button (C9).
  function wire() {
    document.querySelectorAll('[data-cookie-choice]').forEach(function (l) {
      if (gpc) return;   // with Global Privacy Control the link just goes to the notice
      if (l.tagName === 'A') l.setAttribute('role', 'button');
      l.hidden = false;
      l.setAttribute('aria-controls', 'consent');
      l.setAttribute('aria-expanded', 'false');
      l.addEventListener('click', function (e) {
        e.preventDefault();
        kb = !e.detail;
        if (mode === 'change') hide(l); else show('change', l);
      });
      l.addEventListener('keydown', function (e) {
        if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); l.click(); }
      });
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mode === 'change') { kb = true; hide(opener); }
  });

  function arrive() {
    if (gpc) {   // a stored yes under Global Privacy Control is withdrawn here, and the refusal saved
      var r = read(), ids = r && r.analytics ? gaIds() : [];
      window[OFF] = true;
      drop(GA_RE); drop(AD_RE, true);
      erase(ids);
      if (r && (r.analytics || r.ads)) write({ analytics: false, ads: false, at: Date.now() });   // kept, like any refusal
    } else if ((state = read())) {
      if (!state.analytics) { window[OFF] = true; drop(GA_RE); }
      if (!state.ads) drop(AD_RE, true);
      if (wanted(state)) afterLoad(setup);
    } else {
      window[OFF] = true;
      drop(GA_RE); drop(AD_RE, true);
      // shown once the fonts have settled the page, so where it goes is decided once, on the final layout
      if (!tagOff) try { document.fonts.ready.then(function () { if (!mode && !state) show('arrival'); }); } catch (e) { show('arrival'); }
    }
    status();
  }
  // Another tab answered, or the page came back from the back-forward cache: follow storage.
  function follow() {
    if (gpc || !canStore) return;
    var s = read();
    if (s && state && s.analytics === state.analytics && s.ads === state.ads && s.at === state.at) return;
    if (s) { apply(s, false); if (mode === 'arrival') hide(); }
    else if (state) { apply({ analytics: false, ads: false, at: Date.now() }, false, true); state = null; status(); if (!tagOff && !mode) show('arrival'); }
  }
  addEventListener('storage', function (e) { if (e.key === KEY || e.key === null) follow(); });
  addEventListener('pageshow', function (e) { if (e.persisted) follow(); });

  wire();
  arrive();
})(TW_GA4_ID, TW_ADS_ID, TW_ADS_LEAD_LABEL, TW_FORM_KEY);
