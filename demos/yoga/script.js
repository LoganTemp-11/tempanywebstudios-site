/* Stillwater Yoga — demo interactions */

/* Mobile nav */
const toggle = document.querySelector('.menu-toggle');
const nav = document.getElementById('nav');

if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
    });
  });
}

/* Scroll reveal. Staggered so groups of cards cascade rather than snapping in together. */
const revealables = document.querySelectorAll('[data-reveal]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (reduceMotion || !('IntersectionObserver' in window)) {
  revealables.forEach((el) => el.classList.add('in'));
} else {
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const siblings = [...entry.target.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
      const i = Math.max(0, siblings.indexOf(entry.target));
      entry.target.style.transitionDelay = `${Math.min(i * 80, 320)}ms`;
      entry.target.classList.add('in');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  revealables.forEach((el) => io.observe(el));
}

/* Breathing pacer text, kept in sync with the 12s CSS animation.
   4s in, 2s hold, 6s out. */
const label = document.getElementById('breatheLabel');

if (label && !reduceMotion) {
  const PHASES = [
    { text: 'Breathe in', ms: 4000 },
    { text: 'Hold',       ms: 2000 },
    { text: 'Breathe out', ms: 6000 }
  ];
  let i = 0;
  const step = () => {
    label.textContent = PHASES[i].text;
    const wait = PHASES[i].ms;
    i = (i + 1) % PHASES.length;
    setTimeout(step, wait);
  };
  step();
} else if (label) {
  label.textContent = 'Breathe';
}

/* Demo contact form — never sends anywhere. */
const form = document.querySelector('.contact-form');
const note = document.getElementById('formNote');

if (form && note) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.querySelector('input[name="name"]');
    const email = form.querySelector('input[name="email"]');
    const message = form.querySelector('textarea[name="message"]');

    if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
      note.textContent = 'Please fill in all three fields. (Demonstration only — nothing is sent.)';
      note.style.color = '#96522c';
      return;
    }
    note.textContent = 'Thanks! On a live site this would arrive in the studio inbox. Demonstration only: nothing has been sent.';
    note.style.color = '#3c5734';
    form.reset();
  });
}
