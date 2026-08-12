const menuButton = document.querySelector('.menu-button');
const siteNav = document.getElementById('site-navigation');

if (menuButton && siteNav) {
  menuButton.addEventListener('click', () => {
    const open = siteNav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  siteNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
    });
  });
}

function openDetailsFromHash() {
  if (!window.location.hash) return;
  const el = document.getElementById(window.location.hash.slice(1));
  if (el instanceof HTMLDetailsElement) el.open = true;
}
openDetailsFromHash();
window.addEventListener('hashchange', openDetailsFromHash);

const WEB3FORMS_ACCESS_KEY = '7148c950-d9f1-4d33-b78e-a411c89cb1e3';

const form = document.getElementById('enquiry-form');
const status = form ? form.querySelector('.form-status') : null;

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') || '');
    const business = String(data.get('business') || '');
    const email = String(data.get('email') || '');
    const website = String(data.get('website') || 'Not supplied');
    const project = String(data.get('project') || 'Not selected');
    const budget = String(data.get('budget') || 'Not selected');
    const timeline = String(data.get('timeline') || 'Not selected');
    const message = String(data.get('message') || '');

    const submitButton = form.querySelector('.form-button');
    submitButton.disabled = true;
    if (status) { status.textContent = ''; status.className = 'form-status'; }

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: `New Tempany Web Studios enquiry — ${business}`,
          from_name: 'Tempany Web Studios website',
          replyto: email,
          botcheck: !!String(data.get('company_url') || ''),
          Name: name,
          Business: business,
          Email: email,
          'Current website': website,
          'Project type': project,
          Budget: budget,
          'Preferred timing': timeline,
          'Project details': message,
          'Submitted from': window.location.href,
        }),
      });
      const result = await res.json().catch(() => null);
      if (!(res.ok && result?.success === true)) throw new Error('The enquiry could not be sent.');
      form.reset();
      if (status) { status.textContent = "Thanks — your enquiry has been sent. I'll reply within one working day."; status.className = 'form-status success'; }
    } catch {
      if (status) { status.textContent = 'Your enquiry did not send. Please try again, or use the email link if this keeps happening.'; status.className = 'form-status error'; }
    } finally {
      submitButton.disabled = false;
    }
  });
}
