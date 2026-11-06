// Dreams Beauty, first version by Tempany Web Studios, Nov 2026.
// The note (the letterbox at the door). Once the salon's Web3Forms key is in
// (tools/build.mjs), a plain POST that works with JS off; with JS, inline
// errors, focus the first one, and the button reads "Posting" while it goes.
// While the key is still the placeholder the form is not connected: nothing
// is posted, what was typed stays on the page, and a line says to call or
// walk in. That switch is read from the key itself, so a real key turns
// sending on with no other change. Nothing from the walk is carried in.
(function () {
  'use strict';
  var note = document.getElementById('note');
  if (!note) return;
  var keyEl = note.querySelector('input[name="access_key"]');
  var live = !!(keyEl && keyEl.value && !/^REPLACE_/.test(keyEl.value) && note.getAttribute('action'));
  var send = document.getElementById('send');
  var status = document.getElementById('note-status');
  // Unconnected: the button is disabled for JS off; with JS it checks the
  // note and then says plainly that it was not sent.
  if (!live && send) { send.disabled = false; }
  note.setAttribute('novalidate', '');
  var PHONE = /^\+?[\d\s()-]{10,16}$/;
  var MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var rules = [
    ['f-name', 'e-name', function (v) { return v ? '' : 'Please add your name.'; }],
    ['f-reach', 'e-reach', function (v) {
      if (!v) return 'Please add a phone number or an email address.';
      var digits = v.replace(/\D/g, '');
      return (MAIL.test(v) || (PHONE.test(v) && digits.length >= 10 && digits.length <= 13)) ? '' : 'That does not look like a UK phone number or an email address.';
    }],
    ['f-msg', 'e-msg', function (v) { return v ? (v.length > 1000 ? 'Please keep it under 1000 characters.' : '') : 'Please write a short note.'; }]
  ];
  note.addEventListener('submit', function (e) {
    var firstBad = null;
    rules.forEach(function (r) {
      var f = document.getElementById(r[0]), er = document.getElementById(r[1]);
      var msg = r[2](f.value.trim());
      if (msg) {
        f.setAttribute('aria-invalid', 'true'); er.textContent = msg; er.hidden = false;
        if (!firstBad) firstBad = f;
      } else {
        f.removeAttribute('aria-invalid'); er.textContent = ''; er.hidden = true;
      }
    });
    if (firstBad) { e.preventDefault(); firstBad.focus(); return; }
    if (!live) {
      e.preventDefault();
      if (status) {
        status.innerHTML = 'Not sent: this first version is not connected to the salon yet, so your note is still here on the page and has gone nowhere. Call <a href="tel:+441786357717">01786 357717</a> or walk in, Tuesday to Saturday, 10am to 5pm. The note will work once the salon says yes.';
        status.hidden = false;
        status.setAttribute('tabindex', '-1');
        status.focus();
      }
      return;
    }
    send.textContent = 'Posting'; send.setAttribute('aria-disabled', 'true');
  });
  rules.forEach(function (r) {
    document.getElementById(r[0]).addEventListener('input', function () {
      var f = this, er = document.getElementById(r[1]);
      if (f.getAttribute('aria-invalid') === 'true' && !r[2](f.value.trim())) { f.removeAttribute('aria-invalid'); er.hidden = true; }
    });
  });
})();
