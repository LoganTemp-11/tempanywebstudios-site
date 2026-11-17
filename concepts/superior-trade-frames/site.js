/* Superior Trade Frames concept: consent bar and the sticky-bar offset. Nothing else.
   Only one key is ever written: stf-consent. */
(function () {
  var KEY = 'stf-consent';
  var root = document.documentElement;
  var bar = document.getElementById('consent');

  function setOffset() {
    var h = bar && !bar.hidden ? bar.offsetHeight : 0;
    root.style.setProperty('--consent-h', h + 'px');
  }

  var stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) {}
  if (bar && !stored) { bar.hidden = false; }
  setOffset();
  window.addEventListener('resize', setOffset);

  if (bar) {
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-consent]');
      if (!b) return;
      try { localStorage.setItem(KEY, b.getAttribute('data-consent')); } catch (err) {}
      // Accept: on the live build GA4 is loaded here. In this concept nothing loads either way.
      bar.hidden = true;
      setOffset();
    });
  }

  // "Cookie settings" on the privacy page reopens the bar
  var reopen = document.getElementById('cookie-reopen');
  if (reopen && bar) {
    reopen.addEventListener('click', function () {
      try { localStorage.removeItem(KEY); } catch (e) {}
      bar.hidden = false; setOffset();
      var first = bar.querySelector('[data-consent]'); if (first) first.focus();
    });
  }

  // Sticky bar "Send sizes" on the Get a price page: focus the width field
  var go = document.querySelector('[data-focus-width]');
  if (go) {
    go.addEventListener('click', function (e) {
      var w = document.getElementById('w');
      if (w && !w.closest('[hidden]')) { e.preventDefault(); w.scrollIntoView({ block: 'center' }); w.focus({ preventScroll: true }); }
    });
  }
})();
