// Stirling Nail Art, first version by Tempany Web Studios. The chrome, shared
// by every page: the lights (theme), the cookie choice, the ground colour and
// the swatch fan. Everything here decorates; with JS off the page reads as a
// plain document and the fan is a plain list of links.
(function () {
  'use strict';
  var html = document.documentElement;
  var reduce = html.classList.contains('rm');
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* blocked: fine, it asks again */ } }
  function tok(n, d) { var v = getComputedStyle(html).getPropertyValue(n).trim(); return v || d; }

  // ------------------------------------------------------------ the ground --
  // The wall does not change colour as you scroll; it is one wall. The
  // listener is kept so the page always owns --sc-canvas per theme (never the
  // engine's default, never data-sc-drift, which writes an inline colour the
  // theme cannot reach).
  function stops() { return { light: [tok('--p-wall-l', '#efe6d6')], dark: [tok('--p-wall-d', '#3d3e40')] }; }
  var acts = Array.prototype.slice.call(document.querySelectorAll('[data-sna-ground]'));
  function ground() {
    var list = stops()[html.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'];
    if (!acts.length) { html.style.setProperty('--sc-canvas', list[0]); return; }
    var mid = innerHeight / 2, i = 0;
    for (var k = 0; k < acts.length; k++) { if (acts[k].getBoundingClientRect().top <= mid) i = k; }
    html.style.setProperty('--sc-canvas', list[+acts[i].getAttribute('data-sna-ground')] || list[0]);
  }

  // ------------------------------------------------------------ the lights --
  var lights = document.getElementById('lights');
  var meta = document.querySelector('meta[name="theme-color"]');
  function paintLights() {
    var light = html.getAttribute('data-theme') !== 'dark';
    if (lights) {
      lights.setAttribute('aria-pressed', String(light));
      lights.setAttribute('aria-label', light ? 'Lights off in the salon' : 'Lights on in the salon');
    }
    var s = stops();
    if (meta) meta.setAttribute('content', light ? s.light[0] : s.dark[0]);
    ground();
  }
  if (lights) lights.addEventListener('click', function () {
    var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    set('sna-theme', next);
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
    function show() { consent.hidden = false; height(); chromeTop(); }
    function hide() { consent.hidden = true; height(); chromeTop(); }
    function enableAnalytics() { /* intentionally empty: nothing is loaded on accept */ }
    consent.addEventListener('click', function (e) {
      var b = e.target.closest('[data-consent]');
      if (!b) return;
      set('sna-consent', b.getAttribute('data-consent'));
      hide();
      if (b.getAttribute('data-consent') === 'accept') enableAnalytics();
    });
    var saved = get('sna-consent');
    if (saved !== 'accept' && saved !== 'reject') show();
    addEventListener('resize', height);
    function reopen(e) { if (e) e.preventDefault(); show(); var f = consent.querySelector('[data-consent]'); if (f) f.focus(); }
    document.querySelectorAll('[data-cookie-settings]').forEach(function (a) {
      // On the privacy page itself the link reopens the choice; elsewhere it
      // goes to the cookies section, which reopens it too.
      if (document.body.classList.contains('legal')) a.addEventListener('click', reopen);
    });
    if (location.hash === '#cookies' && document.body.classList.contains('legal')) show();
  })();

  // ---------------------------------------------- chrome under the strip --
  // On arrival the chrome sits under the demo strip; once the strip has
  // scrolled away it rises to 10px from the top.
  var strip = document.getElementById('strip');
  function chromeTop() {
    var t = strip ? Math.max(10, Math.round(strip.getBoundingClientRect().bottom + 10)) : 10;
    html.style.setProperty('--chrome-top', t + 'px');
    // The first act fills the screen under the strip, not under the top edge.
    if (strip) html.style.setProperty('--strip-h', strip.offsetHeight + 'px');
    // The plaque never rides up over the script: the first act starts its
    // content below the h1's bottom edge. On a very short phone the act then
    // grows taller than the screen rather than overlapping.
    var h1 = document.querySelector('.wall__script'), act = document.getElementById('wall');
    if (h1 && act && scrollY < 1) {
      var gap = h1.getBoundingClientRect().bottom - act.getBoundingClientRect().top + 10;
      html.style.setProperty('--h1-room', Math.max(0, Math.round(gap)) + 'px');
    }
  }

  // --------------------------------------------------------- the swatch fan --
  var btn = document.getElementById('fan-btn');
  var fan = document.getElementById('fan');
  var tips = fan ? Array.prototype.slice.call(fan.querySelectorAll('[data-tip]')) : [];
  var targets = tips.map(function (a) { return document.querySelector(a.getAttribute('href')); });

  function jump(t) {
    var prev = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    window.scrollTo(0, Math.round(t.getBoundingClientRect().top + scrollY));
    html.style.scrollBehavior = prev;
    t.focus({ preventScroll: true });
    try { history.replaceState(null, '', '#' + t.id); } catch (e) { /* file:// */ }
  }
  function open(v, focusBtn) {
    if (!btn) return;
    btn.setAttribute('aria-expanded', String(v));
    html.classList.toggle('fan-open', v);
    if (!v && focusBtn) btn.focus();
  }
  if (btn && fan) {
    html.classList.add('has-fan');
    btn.addEventListener('click', function () { open(btn.getAttribute('aria-expanded') !== 'true', false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { open(false, true); }
    });
    document.addEventListener('pointerdown', function (e) {
      if (btn.getAttribute('aria-expanded') === 'true' && !e.target.closest('.chrome')) open(false, false);
    });
    fan.addEventListener('focusout', function (e) {
      if (e.relatedTarget && !e.relatedTarget.closest('.chrome')) open(false, false);
    });
    tips.forEach(function (a, i) {
      a.addEventListener('click', function (e) {
        var t = targets[i]; if (!t) return;
        e.preventDefault(); open(false, false); jump(t);
      });
    });
  }

  // The current section's tip is painted. A line 40% down the screen decides.
  function current() {
    if (!tips.length) return;
    var cur = 0, line = innerHeight * 0.4;
    targets.forEach(function (t, i) { if (t && t.getBoundingClientRect().top <= line) cur = i; });
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) cur = tips.length - 1;
    tips.forEach(function (a, i) { if (i === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  }
  // current() runs on every scroll frame (rAF-throttled below), so the
  // painted tip follows PageDown, the fan's own jumps and slow scrolls alike.

  var ticking = false;
  addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { ticking = false; ground(); chromeTop(); current(); });
  }, { passive: true });
  addEventListener('resize', function () { ground(); chromeTop(); current(); }, { passive: true });
  chromeTop(); current();
  window.SNAChrome = { ground: ground, jump: jump, reduce: reduce, current: current };
})();
