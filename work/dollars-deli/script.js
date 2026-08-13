const toggle = document.querySelector('.menu-toggle');
const nav = document.getElementById('main-nav');

if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const form = document.querySelector('.enquiry-form');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Demonstration form only — no information is transmitted.');
  });
}
