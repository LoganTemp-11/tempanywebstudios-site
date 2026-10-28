/* The page chrome's behaviour, shared by every page: the light switch, the Where I work
   lists (the homepage's details and the index bar's button), and the mark on the town
   page you are on. Loaded deferred after tw-consent.js. Nothing here stores anything
   until the switch is pressed. */
(function () {
  'use strict';

  /* The lights. Paper for everyone; the dark desk only on the switch, written to storage only when pressed. */
  (function () {
    var btn = document.getElementById('twLights');
    var docEl = document.documentElement;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!btn) return;
    function sync() {
      var light = docEl.getAttribute('data-theme') !== 'dark';
      btn.setAttribute('aria-pressed', light ? 'true' : 'false');
      btn.setAttribute('aria-label', light ? 'Turn the lights down' : 'Turn the lights up');
      if (meta) meta.setAttribute('content', light ? '#efe9dd' : '#141210');
    }
    btn.addEventListener('click', function () {
      var light = docEl.getAttribute('data-theme') !== 'dark';
      docEl.setAttribute('data-theme', light ? 'dark' : 'light');
      try { localStorage.setItem('tws-theme', light ? 'dark' : 'light'); } catch (e) {}
      sync();
    });
    sync();
  })();

  /* Where I work on the homepage: a details element in the top edge. Closes on Escape
     (focus back on its summary), when focus moves out of it, and on a click anywhere else. */
  (function () {
    var d = document.querySelector('.te__where');
    if (!d) return;
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !d.open) return;
      d.open = false;
      var s = d.querySelector('summary');
      if (s) s.focus();
    });
    d.addEventListener('focusout', function (e) {
      if (d.open && e.relatedTarget && !d.contains(e.relatedTarget)) d.open = false;
    });
    document.addEventListener('click', function (e) {
      if (d.open && !d.contains(e.target)) d.open = false;
    });
  })();

  /* Where I work in the index bar: a button that opens the town list upwards. Escape
     (focus back on the button), focus leaving the list and a click anywhere else close it.
     The town whose page this is gets aria-current="page". */
  (function () {
    var wrap = document.querySelector('.tw-where');
    var btn = wrap && wrap.querySelector('.tw-where__btn');
    var list = wrap && wrap.querySelector('.tw-where__list');
    if (!btn || !list) return;
    var here = location.pathname.replace(/\/+$/, '') || '/';
    Array.prototype.forEach.call(list.querySelectorAll('a[href]'), function (a) {
      var there = a.pathname.replace(/\/+$/, '') || '/';
      if (there === here) a.setAttribute('aria-current', 'page');
    });
    function set(open) { list.hidden = !open; btn.setAttribute('aria-expanded', String(open)); }
    btn.addEventListener('click', function () { set(list.hidden); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !list.hidden) { set(false); btn.focus(); }
    });
    wrap.addEventListener('focusout', function (e) {
      if (!list.hidden && e.relatedTarget && !wrap.contains(e.relatedTarget)) set(false);
    });
    document.addEventListener('click', function (e) {
      if (!list.hidden && !wrap.contains(e.target)) set(false);
    });
  })();
})();
