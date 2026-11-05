// Dunblane Nails, first version by Tempany Web Studios. The chrome, shared by
// every page: the lamp (theme), the cookie choice, the rug's ground colour and
// the loyalty-card nav. Everything here decorates; with JS off the page reads
// as a plain document and the small card is a plain row of links.
(function () {
  'use strict';
  var html = document.documentElement;
  var reduce = html.classList.contains('rm');
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* blocked: fine, it asks again */ } }

  // ------------------------------------------------------------ the ground --
  // The rug's base colour shifts a shade per act. Two arrays, one per theme;
  // written to --sc-canvas from the act in view and how far through it we are.
  // Never data-sc-drift: that writes an inline colour the theme cannot reach.
  var STOPS = {
    light: ['#f5f2eb', '#f4efea', '#f5eeee', '#f5f2eb'],
    dark: ['#1f1b24', '#211c27', '#231d29', '#1f1b24']
  };
  var acts = Array.prototype.slice.call(document.querySelectorAll('[data-dn-ground]'));
  function hex(h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }); }
  function mix(a, b, t) { a = hex(a); b = hex(b); return 'rgb(' + a.map(function (v, i) { return Math.round(v + (b[i] - v) * t); }).join(',') + ')'; }
  function ground() {
    var list = STOPS[html.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'];
    if (!acts.length) { html.style.setProperty('--sc-canvas', list[0]); return; }
    var mid = innerHeight / 2, i = 0;
    for (var k = 0; k < acts.length; k++) { if (acts[k].getBoundingClientRect().top <= mid) i = k; }
    var r = acts[i].getBoundingClientRect();
    var t = Math.max(0, Math.min(1, (mid - r.top) / Math.max(r.height, 1)));
    var a = list[+acts[i].getAttribute('data-dn-ground')];
    var b = acts[i + 1] ? list[+acts[i + 1].getAttribute('data-dn-ground')] : a;
    html.style.setProperty('--sc-canvas', mix(a, b, t * t));
  }

  // -------------------------------------------------------------- the lamp --
  var lights = document.getElementById('lights');
  var meta = document.querySelector('meta[name="theme-color"]');
  function paintLamp() {
    var light = html.getAttribute('data-theme') !== 'dark';
    if (lights) {
      lights.setAttribute('aria-pressed', String(light));
      lights.setAttribute('aria-label', light ? 'Turn the lamp off' : 'Turn the lamp on');
    }
    if (meta) meta.setAttribute('content', light ? STOPS.light[0] : STOPS.dark[0]);
    ground();
  }
  if (lights) lights.addEventListener('click', function () {
    var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    set('dn-theme', next);
    paintLamp();
  });
  paintLamp();

  // -------------------------------------------------------- cookie choice --
  // The page sets no cookies and loads nothing from a third party. The only
  // things kept are the lamp choice and this answer, in the visitor's own
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
      set('dn-consent', b.getAttribute('data-consent'));
      hide();
      if (b.getAttribute('data-consent') === 'accept') enableAnalytics();
    });
    var saved = get('dn-consent');
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

  // ------------------------------------------------- the loyalty-card nav --
  var mini = document.getElementById('mini');
  var boxes = mini ? Array.prototype.slice.call(mini.querySelectorAll('[data-box]')) : [];
  var targets = boxes.map(function (b) { return document.querySelector(b.getAttribute('href')); });
  var first = document.getElementById('card');

  function jump(t) {
    var prev = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    // Land the section below the small card, not under it: its height is
    // measured, so one row (44px) or two rows (under 388px) both clear.
    var bar = mini && mini.closest('[data-chrome]');
    var off = bar && getComputedStyle(bar).position === 'fixed' ? mini.getBoundingClientRect().bottom + 12 : 0;
    var h = t.querySelector('h2'), lift = 0;
    if (h) lift = Math.max(0, off - (h.getBoundingClientRect().top - t.getBoundingClientRect().top));
    window.scrollTo(0, Math.round(t.getBoundingClientRect().top + scrollY - lift));
    html.style.scrollBehavior = prev;
    t.focus({ preventScroll: true });
    try { history.replaceState(null, '', '#' + t.id); } catch (e) { /* file:// */ }
  }

  function stamp() {
    if (!mini) return;
    // Tucked away while the big card is on screen, so the two are never seen together.
    if (first) {
      var r = first.getBoundingClientRect();
      var away = r.bottom < innerHeight * 0.55 || -r.top > r.height * 0.45;
      if (away) mini.removeAttribute('data-hidden'); else mini.setAttribute('data-hidden', '');
    }
    var cur = -1, line = innerHeight * 0.4;
    targets.forEach(function (t, i) {
      if (!t) return;
      if (t.getBoundingClientRect().top <= line) {
        cur = i;
        if (!boxes[i].hasAttribute('data-stamped')) {
          boxes[i].setAttribute('data-stamped', '');   // a loyalty card: stamps stay
        }
      }
    });
    // At the very bottom the last box is current, however short the act.
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) {
      cur = boxes.length - 1;
      boxes.forEach(function (b) { b.setAttribute('data-stamped', ''); });
    }
    boxes.forEach(function (b, i) { if (i === cur) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
  }

  if (mini) {
    html.classList.add('has-mini');
    boxes.forEach(function (b, i) {
      b.addEventListener('click', function (e) {
        var t = targets[i];
        if (!t) return;
        e.preventDefault();
        jump(t);
        stamp();
      });
    });
  }

  var ticking = false;
  addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { ticking = false; ground(); stamp(); });
  }, { passive: true });
  addEventListener('resize', function () { ground(); stamp(); }, { passive: true });
  stamp();
  window.DNChrome = { ground: ground, stamp: stamp, jump: jump, reduce: reduce };
})();
