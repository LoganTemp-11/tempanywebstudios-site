// Dreams Beauty, first version by Tempany Web Studios. The chrome, shared by
// every page: the shop lights (theme), the cookie choice, the ground colour
// and the pocket plan nav. Everything here decorates; with JS off the page
// reads as a plain document and the pocket plan is a plain list of links.
(function () {
  'use strict';
  var html = document.documentElement;
  var reduce = html.classList.contains('rm');
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* blocked: fine, it asks again */ } }

  // ------------------------------------------------------------ the ground --
  // The blush paper shifts a shade per act. Two arrays, one per theme, written
  // to --sc-canvas from the act in view and how far through it we are. Never
  // data-sc-drift: that writes an inline colour the theme cannot reach.
  var STOPS = {
    light: ['#FBF5F7', '#F8EEF2', '#FBF5F7', '#F6E3EA'],
    dark: ['#221E20', '#262124', '#221E20', '#2C2629']
  };
  var acts = Array.prototype.slice.call(document.querySelectorAll('[data-db-ground]'));
  function hex(h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }); }
  function mix(a, b, t) { a = hex(a); b = hex(b); return 'rgb(' + a.map(function (v, i) { return Math.round(v + (b[i] - v) * t); }).join(',') + ')'; }
  function ground() {
    var list = STOPS[html.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'];
    if (!acts.length) { html.style.setProperty('--sc-canvas', list[0]); return; }
    var mid = innerHeight / 2, i = 0;
    for (var k = 0; k < acts.length; k++) { if (acts[k].getBoundingClientRect().top <= mid) i = k; }
    var r = acts[i].getBoundingClientRect();
    var t = Math.max(0, Math.min(1, (mid - r.top) / Math.max(r.height, 1)));
    var a = list[+acts[i].getAttribute('data-db-ground')];
    var b = acts[i + 1] ? list[+acts[i + 1].getAttribute('data-db-ground')] : a;
    html.style.setProperty('--sc-canvas', mix(a, b, t * t));
  }

  // ------------------------------------------------------ the shop lights --
  var lights = document.getElementById('lights');
  var meta = document.querySelector('meta[name="theme-color"]');
  function paintLights() {
    var light = html.getAttribute('data-theme') !== 'dark';
    if (lights) {
      lights.setAttribute('aria-pressed', String(light));
      lights.setAttribute('aria-label', light ? 'Turn the shop lights off' : 'Turn the shop lights on');
    }
    if (meta) meta.setAttribute('content', light ? STOPS.light[0] : STOPS.dark[0]);
    ground();
  }
  if (lights) lights.addEventListener('click', function () {
    var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    set('db-theme', next);
    paintLights();
  });
  paintLights();

  // -------------------------------------------------------- cookie choice --
  // The page sets no cookies and loads nothing from a third party. The only
  // things kept are the lights choice and this answer, in the visitor's own
  // browser. Accepting injects nothing: a noindexed concept with no analytics.
  (function () {
    var consent = document.getElementById('consent');
    if (!consent) return;
    function height() {
      html.style.setProperty('--consent-h', (consent.hidden ? 0 : Math.ceil(consent.getBoundingClientRect().height) + 16) + 'px');
    }
    function show() { consent.hidden = false; height(); }
    function hide() { consent.hidden = true; height(); }
    function enableAnalytics() { /* intentionally empty: nothing is loaded on accept */ }
    consent.addEventListener('click', function (e) {
      var b = e.target.closest('[data-consent]');
      if (!b) return;
      set('db-consent', b.getAttribute('data-consent'));
      hide();
      if (b.getAttribute('data-consent') === 'accept') enableAnalytics();
    });
    var saved = get('db-consent');
    if (saved !== 'accept' && saved !== 'reject') show();
    addEventListener('resize', height);
    function reopen(e) { if (e) e.preventDefault(); show(); var f = consent.querySelector('[data-consent]'); if (f) f.focus(); }
    document.querySelectorAll('[data-cookie-settings]').forEach(function (a) {
      // On the privacy page the link reopens the choice; elsewhere it goes to
      // the cookies section, which reopens it too.
      if (document.body.classList.contains('legal')) a.addEventListener('click', reopen);
    });
    if (location.hash === '#cookies' && document.body.classList.contains('legal')) show();
  })();

  // ------------------------------------------------------ the pocket plan --
  var tab = document.getElementById('pocket-tab');
  var list = document.getElementById('stops');
  var rows = list ? Array.prototype.slice.call(list.querySelectorAll('a')) : [];
  var dots = tab ? Array.prototype.slice.call(tab.querySelectorAll('.pocket__dot')) : [];
  var targets = rows.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  var names = rows.map(function (a) { return a.textContent.replace(/^\s*\d+\s*/, '').trim(); });

  function open(v) {
    if (!tab) return;
    tab.setAttribute('aria-expanded', String(v));
    list.classList.toggle('is-open', v);
  }
  function jump(t) {
    var prev = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    // Stop any smooth scroll still running (scrollcraft.css sets smooth, and a
    // focus move just before the jump can start one): an instant scroll issued
    // mid-glide is otherwise overridden by the glide's own target.
    window.scrollTo({ top: scrollY, behavior: 'instant' });
    // Land the heading 12px below the tab, not under it.
    var off = tab ? tab.getBoundingClientRect().bottom + 12 : 0;
    var h = t.querySelector('h2'), lift = 0;
    if (h) lift = Math.max(0, off - (h.getBoundingClientRect().top - t.getBoundingClientRect().top));
    window.scrollTo({ top: Math.round(t.getBoundingClientRect().top + scrollY - lift), behavior: 'instant' });
    html.style.scrollBehavior = prev;
    (h || t).setAttribute('tabindex', '-1');
    (h || t).focus({ preventScroll: true });
    try { history.replaceState(null, '', '#' + t.id); } catch (e) { /* file:// */ }
  }

  function mark() {
    if (!rows.length) return;
    var cur = 0, line = innerHeight * 0.4;
    targets.forEach(function (t, i) { if (t && t.getBoundingClientRect().top <= line) cur = i; });
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) cur = rows.length - 1;
    rows.forEach(function (a, i) {
      if (i === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      a.classList.toggle('is-done', i < cur);
      if (dots[i]) dots[i].classList.toggle('is-on', i <= cur);
    });
    if (tab) tab.setAttribute('aria-label', 'Sections, now: ' + names[cur]);
  }

  if (tab && list) {
    tab.addEventListener('click', function (e) { e.stopPropagation(); open(tab.getAttribute('aria-expanded') !== 'true'); });
    rows.forEach(function (a, i) {
      a.addEventListener('click', function (e) {
        var t = targets[i];
        if (!t) return;
        e.preventDefault();
        open(false);
        jump(t);
        mark();
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && tab.getAttribute('aria-expanded') === 'true') { open(false); tab.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (tab.getAttribute('aria-expanded') === 'true' && !list.contains(e.target) && e.target !== tab) open(false);
    });
  }

  var ticking = false;
  addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { ticking = false; ground(); mark(); });
  }, { passive: true });
  addEventListener('resize', function () { ground(); mark(); }, { passive: true });
  mark();
  window.DBChrome = { ground: ground, mark: mark, jump: jump, reduce: reduce };
})();
