// Dreams Beauty, first version by Tempany Web Studios, Nov 2026.
// The note (the letterbox at the door). A plain POST to Web3Forms that works
// with JS off. With JS: inline errors, focus the first one, and the button
// reads "Posting" while the POST goes. Nothing from the walk is carried in.
(function () {
  'use strict';
  var note = document.getElementById('note');
  if (!note) return;
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
    var b = document.getElementById('send');
    b.textContent = 'Posting'; b.setAttribute('aria-disabled', 'true');
  });
  rules.forEach(function (r) {
    document.getElementById(r[0]).addEventListener('input', function () {
      var f = this, er = document.getElementById(r[1]);
      if (f.getAttribute('aria-invalid') === 'true' && !r[2](f.value.trim())) { f.removeAttribute('aria-invalid'); er.hidden = true; }
    });
  });
})();
