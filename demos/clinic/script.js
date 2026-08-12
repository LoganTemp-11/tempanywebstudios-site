/* =========================================================
   Rowanbank Physiotherapy — demo site
   Tempany Web Studios · plain vanilla JS, no dependencies
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------------------------------------------------------
     1. Colour theme (light / dark) — remembered per browser
     --------------------------------------------------------- */
  var themeBtn = document.getElementById('themeToggle');

  function storedTheme() {
    try { return localStorage.getItem('rowanbank-theme'); } catch (e) { return null; }
  }
  function storeTheme(value) {
    try { localStorage.setItem('rowanbank-theme', value); } catch (e) { /* private mode */ }
  }
  function systemPrefersDark() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    var isDark = theme === 'dark';
    if (themeBtn) {
      themeBtn.setAttribute('aria-pressed', String(isDark));
      var label = themeBtn.querySelector('.theme-toggle__label');
      if (label) { label.textContent = isDark ? 'Light mode' : 'Dark mode'; }
      themeBtn.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      themeBtn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) { meta.setAttribute('content', isDark ? '#14201B' : '#F8F3EC'); }
  }

  applyTheme(storedTheme() || (systemPrefersDark() ? 'dark' : 'light'));

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      storeTheme(next);
    });
  }

  /* ---------------------------------------------------------
     2. Mobile navigation
     --------------------------------------------------------- */
  var navToggle = document.getElementById('navToggle');
  var nav = document.getElementById('primary-nav');

  function navIsOpen() {
    return navToggle && navToggle.getAttribute('aria-expanded') === 'true';
  }
  function setNav(open) {
    if (!navToggle || !nav) { return; }
    navToggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    var text = navToggle.querySelector('.nav-toggle__text');
    if (text) { text.textContent = open ? 'Close' : 'Menu'; }
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', function () { setNav(!navIsOpen()); });

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) { setNav(false); }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && navIsOpen()) {
        setNav(false);
        navToggle.focus();
      }
    });

    document.addEventListener('click', function (event) {
      if (!navIsOpen()) { return; }
      if (!event.target.closest('#primary-nav') && !event.target.closest('#navToggle')) {
        setNav(false);
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth >= 992 && navIsOpen()) { setNav(false); }
    });
  }

  /* ---------------------------------------------------------
     3. Current-section highlighting in the nav
     --------------------------------------------------------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.primary-nav__list a'));
  var watched = navLinks
    .map(function (link) {
      var id = link.getAttribute('href');
      return id && id.charAt(0) === '#' ? document.querySelector(id) : null;
    })
    .filter(Boolean);

  if ('IntersectionObserver' in window && watched.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        navLinks.forEach(function (link) {
          link.classList.toggle('is-current', link.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    watched.forEach(function (section) { spy.observe(section); });
  }

  /* ---------------------------------------------------------
     4. Gentle reveal on scroll
     --------------------------------------------------------- */
  var revealSelectors = [
    '.section-head', '.treat', '.conditions__intro', '.cgroup', '.step', '.stats',
    '.proof-note', '.person', '.first__intro', '.timeline li', '.fee', '.fee-aside',
    '.visiting__area', '.visiting__panel', '.faq__intro', '.faq__list details',
    '.enquire__aside', '.enquire__formwrap'
  ];

  var revealables = [];
  revealSelectors.forEach(function (selector) {
    Array.prototype.forEach.call(document.querySelectorAll(selector), function (el) {
      revealables.push(el);
    });
  });

  if (!reduceMotion.matches && 'IntersectionObserver' in window) {
    revealables.forEach(function (el) { el.setAttribute('data-reveal', ''); });

    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry, index) {
        if (!entry.isIntersecting) { return; }
        var delay = Math.min(index, 4) * 70;
        entry.target.style.transitionDelay = delay + 'ms';
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealables.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------------------------------------------------------
     5. Opening hours — is the clinic open right now?
     --------------------------------------------------------- */
  var hoursStatus = document.getElementById('hoursStatus');
  var schedule = {
    0: null,
    1: [480, 1170],
    2: [480, 1020],
    3: [480, 1170],
    4: [480, 1020],
    5: [480, 840],
    6: [540, 780]
  };
  var dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function clockFormat(minutes) {
    var h = Math.floor(minutes / 60);
    var m = minutes % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  function nextOpening(fromDay) {
    for (var step = 1; step <= 7; step += 1) {
      var day = (fromDay + step) % 7;
      if (schedule[day]) {
        return { label: step === 1 ? 'tomorrow' : dayNames[day], opens: schedule[day][0] };
      }
    }
    return null;
  }

  if (hoursStatus) {
    var now = new Date();
    var today = now.getDay();
    var minutesNow = now.getHours() * 60 + now.getMinutes();
    var todayHours = schedule[today];
    var message;

    if (todayHours && minutesNow >= todayHours[0] && minutesNow < todayHours[1]) {
      message = 'Open now — closes ' + clockFormat(todayHours[1]);
      hoursStatus.classList.add('is-open');
    } else if (todayHours && minutesNow < todayHours[0]) {
      message = 'Closed — opens today at ' + clockFormat(todayHours[0]);
      hoursStatus.classList.add('is-closed');
    } else {
      var next = nextOpening(today);
      message = next
        ? 'Closed — opens ' + next.label + ' at ' + clockFormat(next.opens)
        : hoursStatus.getAttribute('data-fallback');
      hoursStatus.classList.add('is-closed');
    }

    hoursStatus.textContent = message;

    var todayRow = document.querySelector('.hours tr[data-day="' + today + '"]');
    if (todayRow) { todayRow.classList.add('is-today'); }
  }

  /* ---------------------------------------------------------
     6. Demonstration enquiry form — never submitted anywhere
     --------------------------------------------------------- */
  var form = document.getElementById('enquiryForm');

  if (form) {
    var confirmBox = document.getElementById('formConfirm');
    var confirmBody = document.getElementById('confirmBody');
    var resetBtn = document.getElementById('resetForm');

    function fieldError(input, errorId, invalid) {
      var note = document.getElementById(errorId);
      if (note) { note.hidden = !invalid; }
      if (invalid) {
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', errorId);
      } else {
        input.removeAttribute('aria-invalid');
        input.removeAttribute('aria-describedby');
      }
      return !invalid;
    }

    function validEmail(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
    }

    function validate() {
      var name = form.elements.name;
      var email = form.elements.email;
      var consent = form.elements.consent;
      var problems = [];

      if (!fieldError(name, 'name-err', name.value.trim().length < 2)) { problems.push(name); }
      if (!fieldError(email, 'email-err', !validEmail(email.value))) { problems.push(email); }
      if (!fieldError(consent, 'consent-err', !consent.checked)) { problems.push(consent); }

      return problems;
    }

    ['name', 'email'].forEach(function (id) {
      var input = form.elements[id];
      if (!input) { return; }
      input.addEventListener('blur', function () {
        if (input.value.trim() === '') { return; }
        if (id === 'email') { fieldError(input, 'email-err', !validEmail(input.value)); }
        else { fieldError(input, 'name-err', input.value.trim().length < 2); }
      });
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var problems = validate();
      if (problems.length) {
        problems[0].focus();
        return;
      }

      var firstName = form.elements.name.value.trim().split(/\s+/)[0];
      var issue = form.elements.issue.value;
      var times = Array.prototype.slice
        .call(form.querySelectorAll('input[name="times"]:checked'))
        .map(function (box) { return box.value.toLowerCase(); });

      var lines = ['Thanks, ' + firstName + '. In a live site this enquiry would land in the clinic inbox and you would hear back within one working day.'];

      if (issue) {
        lines.push('You told us it is about: ' + issue.toLowerCase() + '.');
      }
      if (times.length === 1) {
        lines.push('We would look for ' + times[0] + ' first.');
      } else if (times.length > 1) {
        lines.push('We would look at ' + times.slice(0, -1).join(', ') + ' and ' + times[times.length - 1] + '.');
      }

      if (confirmBody) { confirmBody.textContent = lines.join(' '); }

      form.classList.add('is-sent');
      if (confirmBox) {
        confirmBox.hidden = false;
        var heading = confirmBox.querySelector('h3');
        if (heading) {
          heading.setAttribute('tabindex', '-1');
          heading.focus({ preventScroll: true });
          heading.scrollIntoView({
            block: 'center',
            behavior: reduceMotion.matches ? 'auto' : 'smooth'
          });
        }
      }
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        form.reset();
        form.classList.remove('is-sent');
        if (confirmBox) { confirmBox.hidden = true; }
        ['name-err', 'email-err', 'consent-err'].forEach(function (id) {
          var note = document.getElementById(id);
          if (note) { note.hidden = true; }
        });
        Array.prototype.forEach.call(form.querySelectorAll('[aria-invalid]'), function (el) {
          el.removeAttribute('aria-invalid');
          el.removeAttribute('aria-describedby');
        });
        form.elements.name.focus();
      });
    }
  }

  /* ---------------------------------------------------------
     7. Keep anchor jumps clear of the sticky header
     --------------------------------------------------------- */
  var header = document.querySelector('.site-header');
  function syncHeaderHeight() {
    if (!header) { return; }
    root.style.setProperty('--head-h', header.offsetHeight + 'px');
  }
  syncHeaderHeight();
  window.addEventListener('resize', syncHeaderHeight);
  window.addEventListener('load', syncHeaderHeight);
}());
