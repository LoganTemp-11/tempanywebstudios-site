/* Dog Grooming By Jade concept: the cookie bar, the phone call bar and the menu.

   Cookie bar (#consent, in the page flow above the footer, never fixed). The only
   key ever written is dgj-consent, set to "reject" or "accept".
   Analytics: on this concept nothing loads on Accept or on Reject. On Jade's own
   domain, GA4 loads here after Accept, and one listener on [data-track] counts
   call, whatsapp, email, form and map clicks (README section 2).

   Phone call bar (.bar). style.css shows it on phones (below 720px, or a touch
   screen under 500px tall). On Home, while the first screen's Call button is in
   the window, the bar would only repeat it and cover her photo, so it waits until
   that button has left the window. style.css keeps Home's bar out of sight until
   this script says so, which stops it flashing up on load; with JavaScript off it
   always shows. Every other page shows it all the time. */
(function () {
  var KEY = 'dgj-consent';

  // ---- cookie bar
  var bar = document.getElementById('consent');
  if (bar) {
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
    // Its line is hidden in the markup: with JavaScript off there is no bar to reopen.
    var reopen = document.getElementById('cookie-reopen');
    if (reopen) {
      reopen.parentNode.hidden = false;
      reopen.addEventListener('click', function () {
        try { localStorage.removeItem(KEY); } catch (e) {}
        bar.hidden = false;
        bar.querySelector('[data-consent]').focus();
      });
    }
  }

  // ---- phone call bar, Home only
  var call = document.querySelector('.first a.call');
  var callBar = document.querySelector('.bar');
  if (call && callBar && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      callBar.toggleAttribute('data-show', !entries[entries.length - 1].isIntersecting);
    }).observe(call);
  } else if (callBar) {
    callBar.setAttribute('data-show', '');
  }

  // ---- menu: Escape closes it and hands focus back to "Menu"
  var menu = document.querySelector('.menu');
  if (menu) {
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !menu.open) return;
      menu.open = false;
      menu.querySelector('summary').focus();
    });
  }
})();
