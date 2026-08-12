/* =========================================================
   Whinstone Joinery & Building — demo site
   Built by Tempany Web Studios
   Plain vanilla JS. No dependencies, no build step.
   ========================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -------------------------------------------------------
     1. Mobile navigation
     ------------------------------------------------------- */
  var header = document.getElementById('siteHeader');
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('primaryNav');

  function setNav(open) {
    if (!header || !toggle) return;
    header.setAttribute('data-nav-open', open ? 'true' : 'false');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function navIsOpen() {
    return header && header.getAttribute('data-nav-open') === 'true';
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      setNav(!navIsOpen());
    });

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) setNav(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && navIsOpen()) {
        setNav(false);
        toggle.focus();
      }
    });

    document.addEventListener('click', function (event) {
      if (!navIsOpen()) return;
      if (header.contains(event.target)) return;
      setNav(false);
    });

    var desktop = window.matchMedia('(min-width: 960px)');
    var onBreakpoint = function (event) {
      if (event.matches) setNav(false);
    };
    if (desktop.addEventListener) {
      desktop.addEventListener('change', onBreakpoint);
    } else if (desktop.addListener) {
      desktop.addListener(onBreakpoint);
    }
  }

  /* -------------------------------------------------------
     2. Sticky header shadow
     ------------------------------------------------------- */
  if (header) {
    var lastStuck = false;
    var onScroll = function () {
      var stuck = window.scrollY > 12;
      if (stuck !== lastStuck) {
        header.classList.toggle('is-stuck', stuck);
        lastStuck = stuck;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* -------------------------------------------------------
     3. Current section highlighting
     ------------------------------------------------------- */
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll('.nav-list a[href^="#"]')
  );
  var watched = navLinks
    .map(function (link) {
      var id = link.getAttribute('href').slice(1);
      var section = id ? document.getElementById(id) : null;
      return section ? { link: link, section: section } : null;
    })
    .filter(Boolean);

  if (watched.length && 'IntersectionObserver' in window) {
    var markCurrent = function (link) {
      navLinks.forEach(function (item) {
        item.classList.toggle('is-current', item === link);
        if (item === link) {
          item.setAttribute('aria-current', 'true');
        } else {
          item.removeAttribute('aria-current');
        }
      });
    };

    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var match = watched.filter(function (item) {
            return item.section === entry.target;
          })[0];
          if (match) markCurrent(match.link);
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );

    watched.forEach(function (item) {
      spy.observe(item.section);
    });
  }

  /* -------------------------------------------------------
     4. Gentle reveal on scroll (skipped for reduced motion)
     ------------------------------------------------------- */
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var revealTargets = Array.prototype.slice.call(
      document.querySelectorAll(
        '.service, .plate, .step, .area-col, .areas__map, .faq__list details, .quote__formwrap, .trust__list li'
      )
    );

    revealTargets.forEach(function (element, index) {
      element.classList.add('reveal');
      element.style.transitionDelay = (index % 3) * 70 + 'ms';
    });

    var revealer = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );

    revealTargets.forEach(function (element) {
      revealer.observe(element);
    });
  }

  /* -------------------------------------------------------
     5. Counting numbers band
     ------------------------------------------------------- */
  var figures = Array.prototype.slice.call(
    document.querySelectorAll('.numbers__figure[data-count]')
  );

  if (figures.length && !reduceMotion && 'IntersectionObserver' in window) {
    var countUp = function (element) {
      var target = parseInt(element.getAttribute('data-count'), 10);
      var suffix = element.getAttribute('data-suffix') || '';
      if (isNaN(target)) return;

      var duration = 1100;
      var started = null;

      var tick = function (now) {
        if (started === null) started = now;
        var progress = Math.min((now - started) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = Math.round(target * eased) + suffix;
        if (progress < 1) window.requestAnimationFrame(tick);
      };

      element.textContent = '0' + suffix;
      window.requestAnimationFrame(tick);
    };

    var counter = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          countUp(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.5 }
    );

    figures.forEach(function (figure) {
      counter.observe(figure);
    });
  }

  /* -------------------------------------------------------
     6. Demonstration enquiry form
     Nothing is submitted anywhere — the handler intercepts
     the submit event and shows an inline confirmation.
     ------------------------------------------------------- */
  var form = document.getElementById('quoteForm');
  var confirmPanel = document.getElementById('quoteConfirm');
  var confirmSummary = document.getElementById('confirmSummary');
  var resetButton = document.getElementById('resetForm');

  var setFieldError = function (input, message) {
    var wrapper = input.closest('.field');
    var errorId = input.getAttribute('aria-describedby');
    var errorEl = errorId ? document.getElementById(errorId) : null;

    if (message) {
      if (wrapper) wrapper.classList.add('has-error');
      input.setAttribute('aria-invalid', 'true');
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.hidden = false;
      }
    } else {
      if (wrapper) wrapper.classList.remove('has-error');
      input.removeAttribute('aria-invalid');
      if (errorEl) errorEl.hidden = true;
    }
  };

  var validate = function () {
    var problems = [];

    var name = document.getElementById('qName');
    var phone = document.getElementById('qPhone');
    var email = document.getElementById('qEmail');
    var job = document.getElementById('qJob');

    if (!name.value.trim()) {
      setFieldError(name, 'Please enter your name.');
      problems.push(name);
    } else {
      setFieldError(name, null);
    }

    var digits = phone.value.replace(/[^0-9]/g, '');
    if (digits.length < 9) {
      setFieldError(phone, 'Please enter a phone number we can reach you on.');
      problems.push(phone);
    } else {
      setFieldError(phone, null);
    }

    if (email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
      setFieldError(email, 'Please check the email address.');
      problems.push(email);
    } else {
      setFieldError(email, null);
    }

    if (!job.value) {
      setFieldError(job, 'Please choose the type of job.');
      problems.push(job);
    } else {
      setFieldError(job, null);
    }

    return problems;
  };

  if (form && confirmPanel) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var problems = validate();
      if (problems.length) {
        problems[0].focus();
        return;
      }

      var name = document.getElementById('qName').value.trim();
      var job = document.getElementById('qJob').value;
      var town = document.getElementById('qTown').value.trim();
      var firstName = name.split(/\s+/)[0];

      if (confirmSummary) {
        confirmSummary.textContent =
          'On a live site, ' + firstName + ', your enquiry about ' +
          job.toLowerCase() +
          (town ? ' in ' + town : '') +
          ' would land in the workshop inbox and you would get a reply within one working day.';
      }

      form.hidden = true;
      confirmPanel.hidden = false;
      confirmPanel.focus();
    });

    form.addEventListener('input', function (event) {
      var field = event.target.closest('.field');
      if (field && field.classList.contains('has-error')) {
        setFieldError(event.target, null);
      }
    });
  }

  if (resetButton && form && confirmPanel) {
    resetButton.addEventListener('click', function () {
      form.reset();
      Array.prototype.slice.call(form.querySelectorAll('.has-error')).forEach(function (field) {
        field.classList.remove('has-error');
      });
      Array.prototype.slice.call(form.querySelectorAll('.err')).forEach(function (error) {
        error.hidden = true;
      });
      confirmPanel.hidden = true;
      form.hidden = false;
      var first = document.getElementById('qName');
      if (first) first.focus();
    });
  }

  /* -------------------------------------------------------
     7. Footer year
     ------------------------------------------------------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
