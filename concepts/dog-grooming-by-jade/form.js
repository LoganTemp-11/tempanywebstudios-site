/* Dog Grooming By Jade concept: the request form on find-and-book.

   Every word it shows is in the page: each field's message sits in its .err line,
   and the status lines in template#f-says, all written from the copy deck.

   Concept mode, data-access-key="" (as now): a valid request is checked and kept
   on the page, and the status line says nothing was sent. No request leaves.
   Live mode, data-access-key set: it posts JSON to Web3Forms and says whether
   it went. With JavaScript off the browser's own checks run (required, the phone
   pattern, type="email"); method="dialog" sends nothing, and once live the form
   posts to Web3Forms, which redirects to thanks.

   Switching it on, in this order, once Jade says yes:
   1. Jade makes a Web3Forms access key on her Gmail.
   2. Set data-access-key on form#request, and add
      <input type="hidden" name="access_key" value="..."> for JavaScript off.
   3. Set method="POST" and action="https://api.web3forms.com/submit".
   4. Add <input type="hidden" name="redirect" value="https://<her domain>/thanks">.
   5. Jade gives the retention line for the privacy page.
   6. Remove the not-live note (.form-note) and the concept status line
      ([data-say="concept"] in template#f-says).
   7. Send one real request end to end and check it reaches her inbox. */
(function () {
  var form = document.getElementById('request');
  if (!form) return;
  form.noValidate = true;  // our messages replace the browser's bubbles

  var status = document.getElementById('f-status');
  var send = form.querySelector('.send');
  var label = send.textContent;
  var says = document.getElementById('f-says').content;
  var say = function (k) { return says.querySelector('[data-say="' + k + '"]'); };
  var show = function (k) {
    status.replaceChildren.apply(status, [].map.call(say(k).childNodes, function (n) { return n.cloneNode(true); }));
    status.scrollIntoView({ block: 'nearest' });
  };

  // Checked in this order, so focus goes to the first one wrong.
  var rules = {
    'f-name': function (v) { return v !== ''; },
    'f-phone': function (v) { return /^(0\d{9,10}|\+44\d{9,10})$/.test(v.replace(/\s+/g, '')); },
    'f-email': function (v) { return v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); },
    'f-dog': function (v) { return v !== ''; }
  };
  var ids = Object.keys(rules);
  var field = function (id) { return document.getElementById(id); };
  var good = function (id) { return rules[id](field(id).value.trim()); };

  function mark(id, wrong) {
    var el = field(id), err = document.getElementById(id + '-err');
    err.hidden = !wrong;
    if (wrong) {
      el.setAttribute('aria-invalid', 'true');
      el.setAttribute('aria-describedby', err.id);
    } else {
      el.removeAttribute('aria-invalid');
      el.removeAttribute('aria-describedby');
    }
  }

  function count() {
    var n = ids.filter(function (id) { return field(id).getAttribute('aria-invalid') === 'true'; }).length;
    if (!n) status.textContent = '';
    else if (n === 1) status.textContent = say('invalid-one').textContent;
    else status.textContent = say('invalid-many').textContent.replace(/\bN\b/, n);
    return n;
  }

  // A marked field clears as soon as it is right; nothing new is marked while typing.
  form.addEventListener('input', function (e) {
    var id = e.target.id;
    if (rules[id] && e.target.getAttribute('aria-invalid') === 'true' && good(id)) { mark(id, false); count(); }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (send.disabled) return;
    var wrong = ids.filter(function (id) { var w = !good(id); mark(id, w); return w; });
    if (wrong.length) { count(); field(wrong[0]).focus(); return; }
    if (form.elements.botcheck.checked) return;  // a bot ticked the hidden box: send nothing

    var key = form.getAttribute('data-access-key');
    if (!key) { show('concept'); return; }

    // Every filled field; ticked boxes join into one line. The no-JavaScript
    // inputs (access_key, redirect) are left out: a redirect would answer this
    // request with Jade's thanks page instead of Web3Forms' JSON.
    var data = {};
    new FormData(form).forEach(function (v, k) {
      v = String(v).trim();
      if (v && !/^(botcheck|access_key|redirect)$/.test(k)) data[k] = data[k] ? data[k] + ', ' + v : v;
    });
    data.access_key = key;
    data.botcheck = '';
    data.subject = 'Grooming request: ' + data.dog;

    send.disabled = true;
    send.textContent = say('sending').textContent;
    status.textContent = '';
    var stop = new AbortController();
    var timer = setTimeout(function () { stop.abort(); }, 20000);
    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
      signal: stop.signal
    })
      .then(function (r) { return r.json(); })
      .then(function (j) { return j && j.success === true; }, function () { return false; })
      .then(function (sent) {
        clearTimeout(timer);
        send.disabled = false;
        send.textContent = label;
        if (sent) form.reset();
        show(sent ? 'sent' : 'failed');
        if (document.activeElement === document.body) send.focus();
      });
  });

  // A text box takes focus at its caret, so the browser scrolls only its first
  // line into view, and the rest of the box and its focus ring can sit under the
  // phone bar. Bring the whole box into view; scroll-padding in style.css keeps it
  // clear of the bar.
  var notes = field('f-notes');
  notes.addEventListener('focus', function () { notes.scrollIntoView({ block: 'nearest' }); });
})();
