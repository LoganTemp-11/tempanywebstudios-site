/* Dog Grooming By Jade concept: the cookie bar, the phone call bar and the menu.

   Cookie bar (#consent, in the page flow above the footer, never fixed). The only
   key ever written is dgj-consent, set to "reject" or "accept".
   Analytics: on this concept nothing loads on Accept or on Reject. On Jade's own
   domain, GA4 loads here after Accept, and one listener on [data-track] counts
   call, whatsapp, email, form and map clicks (README section 2).

   Phone call bar (.bar). style.css shows it on phones (below 720px, or a touch
   screen under 500px tall). On Home, while the first screen's Call button is in
   the window, the bar would only repeat it and cover her photo, so this script
   hides it (data-hide) until that button has left the window. The bar shows by
   default, so with JavaScript off Home keeps it, and if this file never arrives
   it shows after style.css's 3s hold. Every other page shows it all the time. */
(function () {
  var KEY = 'dgj-consent';

  // ---- cookie bar
  var bar = document.getElementById('consent');
  if (bar) {
    var stored = null;
    try { stored = localStorage.getItem(KEY); } catch (e) {}
    if (!stored) bar.hidden = false;

    // The button that reopened the bar (privacy#cookies), to hand focus back to.
    var opener = null;
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-consent]');
      if (!b) return;
      try { localStorage.setItem(KEY, b.getAttribute('data-consent')); } catch (err) {}
      // Accept loads nothing on this concept, by design. See the comment above.
      var had = bar.contains(document.activeElement);
      bar.hidden = true;
      // The answer pressed has gone, so focus would drop to the page: hand it to
      // the button that reopened the bar, or else to the next link, the footer's first.
      if (had) (opener || document.querySelector('.foot a')).focus();
      opener = null;
    });

    // "Change your answer" on the privacy page (privacy#cookies) reopens the bar.
    // Its line is hidden in the markup: with JavaScript off there is no bar to reopen.
    var reopen = document.getElementById('cookie-reopen');
    if (reopen) {
      reopen.parentNode.hidden = false;
      reopen.addEventListener('click', function () {
        try { localStorage.removeItem(KEY); } catch (e) {}
        bar.hidden = false;
        opener = reopen;
        bar.querySelector('[data-consent]').focus();
      });
    }
  }

  // ---- phone call bar, Home only
  // style.css holds Home's bar out of sight for its first 3s, until data-watched
  // says this script has taken over. Then it is hidden at once if Call is on
  // screen, and kept in step as Call enters and leaves the window. Without
  // IntersectionObserver the bar just shows.
  var call = document.querySelector('.first a.call');
  var callBar = document.querySelector('.bar');
  if (call && callBar) {
    if ('IntersectionObserver' in window) {
      var r = call.getBoundingClientRect();
      callBar.toggleAttribute('data-hide', r.bottom > 0 && r.top < innerHeight);
      new IntersectionObserver(function (entries) {
        callBar.toggleAttribute('data-hide', entries[entries.length - 1].isIntersecting);
      }).observe(call);
    }
    callBar.setAttribute('data-watched', '');
  }

  // ---- menu: Escape from Menu or one of its links closes it and hands focus back
  // to "Menu". Anywhere else (a form field, say) Escape is left to that element.
  var menu = document.querySelector('.menu');
  var nav = document.querySelector('.nav');
  if (menu && nav) {
    document.addEventListener('keydown', function (e) {
      var f = document.activeElement;
      if (e.key !== 'Escape' || !menu.open || !(menu.contains(f) || nav.contains(f))) return;
      menu.open = false;
      menu.querySelector('summary').focus();
    });
  }
})();
