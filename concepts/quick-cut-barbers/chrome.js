// Quick Cut Barbers, first version by Tempany Web Studios. The chrome, shared
// by every page: the lights (theme), the cookie choice, the ground colour and
// the pole. Everything here decorates; with JS off the page reads as a plain
// document and the pole is a plain column of six links.
(function () {
  'use strict';
  var html = document.documentElement;
  var reduce = html.classList.contains('rm');
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* blocked: fine, it asks again */ } }

  // ------------------------------------------------------------ the ground --
  // A shade per act, two arrays (one per theme), written to --sc-canvas from
  // the act in view and how far through it we are. Never data-sc-drift: that
  // writes an inline colour the theme cannot reach.
  var STOPS = {
    light: ['#f6f3ec', '#efebe3', '#f6f3ec'],
    dark: ['#151314', '#1b191a', '#151314']
  };
  var acts = Array.prototype.slice.call(document.querySelectorAll('[data-qc-ground]'));
  function hex(h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }); }
  function mix(a, b, t) { a = hex(a); b = hex(b); return 'rgb(' + a.map(function (v, i) { return Math.round(v + (b[i] - v) * t); }).join(',') + ')'; }
  function ground() {
    var list = STOPS[html.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'];
    if (!acts.length) { html.style.setProperty('--sc-canvas', list[0]); return; }
    var mid = innerHeight / 2, i = 0;
    for (var k = 0; k < acts.length; k++) { if (acts[k].getBoundingClientRect().top <= mid) i = k; }
    var r = acts[i].getBoundingClientRect();
    var t = Math.max(0, Math.min(1, (mid - r.top) / Math.max(r.height, 1)));
    var a = list[+acts[i].getAttribute('data-qc-ground')];
    var b = acts[i + 1] ? list[+acts[i + 1].getAttribute('data-qc-ground')] : a;
    html.style.setProperty('--sc-canvas', mix(a, b, t * t));
  }

  // The strip's height, so the door unit on the first screen fits what is left.
  var strip = document.getElementById('strip');
  function stripH() { if (strip) html.style.setProperty('--strip-h', strip.offsetHeight + 'px'); }
  if (strip) { addEventListener('resize', stripH); if (document.fonts && document.fonts.ready) document.fonts.ready.then(stripH); }

  // ------------------------------------------------------------ the lights --
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
    set('qc-theme', next);
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
      fitNow();
    }
    function show() { consent.hidden = false; height(); }
    function hide() { consent.hidden = true; height(); }
    function enableAnalytics() { /* intentionally empty: nothing is loaded on accept */ }
    consent.addEventListener('click', function (e) {
      var b = e.target.closest('[data-consent]');
      if (!b) return;
      set('qc-consent', b.getAttribute('data-consent'));
      hide();
      if (b.getAttribute('data-consent') === 'accept') enableAnalytics();
    });
    var saved = get('qc-consent');
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

  // -------------------------------------------------------------- the pole --
  var pole = document.querySelector('.pole');
  var bands = pole ? Array.prototype.slice.call(pole.querySelectorAll('[data-band]')) : [];
  var targets = bands.map(function (b) { var h = b.getAttribute('href'); return h.charAt(0) === '#' ? document.querySelector(h) : null; });
  var current = -1;

  function jump(t) {
    var prev = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    // No fixed top bar, so the section lands 12px from the top.
    window.scrollTo(0, Math.round(t.getBoundingClientRect().top + scrollY - 12));
    html.style.scrollBehavior = prev;
    t.focus({ preventScroll: true });
    try { history.replaceState(null, '', '#' + t.id); } catch (e) { /* file:// */ }
  }

  // The band's name, lettered under the pole's foot.
  var now = document.getElementById('pole-now');
  function name(i) {
    var t = (bands[i].getAttribute('aria-label') || '').replace(/^\d+,\s*/, '');
    return t.replace(/^(\d+)/, '<span class="label__num">$1</span>');
  }

  // The name is shown only where it fits on screen, clear of the consent bar.
  function fitNow() {
    if (!now) return;
    now.style.visibility = '';
    var cs = parseFloat(getComputedStyle(html).getPropertyValue('--consent-h')) || 0;
    var r = now.getBoundingClientRect();
    if (r.height && r.bottom > innerHeight - cs - 8) now.style.visibility = 'hidden';
  }

  function band() {
    if (!bands.length) return;
    var cur = 0, line = innerHeight * 0.4;
    targets.forEach(function (t, i) { if (t && t.getBoundingClientRect().top <= line) cur = i; });
    // At the very bottom the door is current, however short the act.
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) cur = bands.length - 1;
    if (cur !== current) {
      current = cur;
      bands.forEach(function (b, i) { if (i === cur) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
      if (now) now.innerHTML = name(cur);
    }
    fitNow();
  }

  // The stripes turn with scroll: the tile slides 0.3px per pixel scrolled.
  function turn() {
    if (!pole || reduce) return;
    pole.style.setProperty('--qc-turn', ((scrollY * 0.3) % 34).toFixed(1) + 'px');
  }

  if (pole) {
    bands.forEach(function (b, i) {
      b.addEventListener('click', function (e) {
        var t = targets[i];
        if (!t) return;
        e.preventDefault();
        jump(t);
        band();
      });
    });
  }

  var ticking = false;
  addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { ticking = false; ground(); band(); turn(); });
  }, { passive: true });
  addEventListener('resize', function () { ground(); band(); }, { passive: true });
  band(); turn();
  window.QCChrome = { ground: ground, band: band, jump: jump, reduce: reduce };
})();
