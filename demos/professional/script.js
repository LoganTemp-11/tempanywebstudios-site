const toggle = document.querySelector('.nav-toggle');
const navList = document.getElementById('nav-menu');

if (toggle && navList) {
  toggle.addEventListener('click', () => {
    const open = navList.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  navList.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navList.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduceMotion && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('js-ready');
  const revealItems = document.querySelectorAll('[data-reveal]');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  revealItems.forEach((el) => observer.observe(el));
}

const form = document.getElementById('enquiry-form');
const status = document.getElementById('form-status');

if (form && status) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    status.hidden = false;
    status.classList.add('is-success');
    status.textContent = "Thanks — in a real enquiry this would reach the office within one working day. Nothing here was actually sent.";
    form.reset();
    status.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
  });
}
