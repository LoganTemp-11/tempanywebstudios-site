/* Tempany Web Studios — homepage behaviour. */

// Mobile menu
const menuButton = document.querySelector('.menu-button');
const siteNav = document.getElementById('site-navigation');
if (menuButton && siteNav) {
  menuButton.addEventListener('click', () => {
    const open = siteNav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });
  siteNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
}

// Theme toggle. The initial theme is set inline in <head> before first paint.
const themeToggle = document.querySelector('.theme-toggle');
function syncThemeLabel() {
  const label = document.querySelector('.theme-label');
  if (label) label.textContent = document.documentElement.dataset.theme === 'dark' ? 'Dark' : 'Light';
}
syncThemeLabel();
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('tws-theme', next); } catch (e) {}
    syncThemeLabel();
  });
}

// Deep links to the legal accordions should open them.
function openDetailsFromHash() {
  if (!window.location.hash) return;
  const el = document.getElementById(window.location.hash.slice(1));
  if (el instanceof HTMLDetailsElement) el.open = true;
}
openDetailsFromHash();
window.addEventListener('hashchange', openDetailsFromHash);

// Enquiry form — posts JSON to Web3Forms without leaving the page.
// The form's method/action stay as a no-JS fallback.
const form = document.getElementById('enquiry-form');
const status = form ? form.querySelector('.form-status') : null;

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = new FormData(form);
    if (String(data.get('company_url') || '') !== '') return; // honeypot

    const payload = {
      access_key: String(data.get('access_key')),
      subject: `Website enquiry from ${String(data.get('name') || 'the website')}`,
      from_name: 'Tempany Web Studios website',
      name: String(data.get('name') || ''),
      business: String(data.get('business') || ''),
      email: String(data.get('email') || ''),
      website: String(data.get('website') || 'Not supplied'),
      route: String(data.get('project') || 'Not selected'),
      message: String(data.get('message') || ''),
    };

    const submitButton = form.querySelector('.form-button');
    submitButton.disabled = true;
    if (status) { status.textContent = 'Sending…'; status.className = 'form-status'; }

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        if (status) { status.textContent = 'Sent. You’ll get a straight answer within one working day.'; status.className = 'form-status is-ok'; }
        form.reset();
      } else {
        throw new Error(result.message || 'Submission failed');
      }
    } catch (err) {
      if (status) {
        status.textContent = 'That didn’t send — please email logan@tempanywebstudios.co.uk directly.';
        status.className = 'form-status is-error';
      }
    } finally {
      submitButton.disabled = false;
    }
  });
}
