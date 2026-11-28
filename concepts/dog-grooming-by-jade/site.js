/* Dog Grooming By Jade concept: the cookie bar and its reopen button.
   The only key ever written is dgj-consent. Phase 2 adds the phone bar's
   hide-while-Call-shows and the menu state; nothing here runs before them.
   Analytics: on this concept nothing loads on Accept or on Reject. On Jade's
   own domain, GA4 loads here after Accept, and one listener on [data-track]
   counts call, whatsapp, email, form and map clicks (README section 2). */
(function () {
  var KEY = 'dgj-consent';
  var bar = document.getElementById('consent');
  if (!bar) return;

  var stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) {}
  if (!stored) bar.hidden = false;

  bar.addEventListener('click', function (e) {
    var b = e.target.closest('[data-consent]');
    if (!b) return;
    try { localStorage.setItem(KEY, b.getAttribute('data-consent')); } catch (err) {}
    // Accept loads nothing on this concept, by design. See the comment above.
    bar.hidden = true;
  });

  // "Change your answer" on the privacy page (privacy#cookies) reopens the bar.
  var reopen = document.getElementById('cookie-reopen');
  if (reopen) {
    reopen.addEventListener('click', function () {
      try { localStorage.removeItem(KEY); } catch (e) {}
      bar.hidden = false;
      var first = bar.querySelector('[data-consent]');
      if (first) first.focus();
    });
  }
})();
