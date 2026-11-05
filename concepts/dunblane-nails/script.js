// Dunblane Nails, first version by Tempany Web Studios, Nov 2026.
// The try-on, the prints and the note. Everything is progressive: with JS off
// the hand ships painted, the prints are a grid and the form is a plain POST.
(function () {
  'use strict';
  var html = document.documentElement;
  var reduce = html.classList.contains('rm');

  // sets.json, inlined by tools/build.mjs so file:// and a cached page work.
  /*sets:start*/var SETS = [{"id":"s01","photo":"dn-01","shape":"almond","finish":"dots","colourName":"plum","caption":"Almond, deep plum with white dots and stars","base":{"hex":"#36202c"},"art":{"hex":"#fbfbff"}},{"id":"s02","photo":"dn-02","shape":"coffin","finish":"dots","colourName":"chocolate","caption":"Coffin, chocolate brown with pink polka-dot accents","base":{"hex":"#412728"},"art":{"hex":"#e5b9c6"}},{"id":"s03","photo":"dn-03","shape":"almond","finish":"french","colourName":"nude","caption":"Long almond, classic white French","base":{"hex":"#dca5a1"},"art":{"hex":"#e8e9e4"}},{"id":"s04","photo":"dn-04","shape":"almond","finish":"line","colourName":"orange","caption":"Almond, bright orange with orange-slice accents","base":{"hex":"#fe4913"},"art":{"hex":"#f95713"}},{"id":"s06","photo":"dn-06","shape":"almond","finish":"leopard","colourName":"burgundy","caption":"Almond, burgundy with leopard accents","base":{"hex":"#64071a"},"art":{"hex":"#cd9168"}},{"id":"s07","photo":"dn-07","shape":"almond","finish":"line","colourName":"nude","caption":"Almond, nude with black line art","base":{"hex":"#b99291"},"art":{"hex":"#432c2a"}},{"id":"s09","photo":"dn-09","shape":"almond","finish":"dots","colourName":"nude","caption":"Almond, nude with blue dotted French tips","base":{"hex":"#ead9d4"},"art":{"hex":"#2468d8"}},{"id":"s10","photo":"dn-10","shape":"almond","finish":"french","colourName":"milky","caption":"Almond, nude with patterned magenta tips and a dark accent","base":{"hex":"#efeaec"},"art":{"hex":"#a43068"}},{"id":"s11","photo":"dn-11","shape":"oval","finish":"plain","colourName":"nude","caption":"Short oval, natural gloss","base":{"hex":"#bfa7ac"},"art":null},{"id":"s17","photo":"dn-17","shape":"almond","finish":"french","colourName":"pink","caption":"Almond, pink with white French tips and pink flowers","base":{"hex":"#f1aecb"},"art":{"hex":"#f8e8fb"}},{"id":"s19","photo":"dn-19","shape":"almond","finish":"french","colourName":"nude","caption":"Almond, nude with green French tips and a leaf","base":{"hex":"#9a7c82"},"art":{"hex":"#0f3a1f"}}];/*sets:end*/

  // -------------------------------------------------------------- try-on --
  var form = document.getElementById('composer');
  var svg = document.getElementById('hand');
  var mImg = document.getElementById('match-img');
  var mSrc = document.getElementById('match-src');
  var mText = document.getElementById('match-text');
  var mNone = document.getElementById('match-none');
  var last = null;

  function choice() {
    var v = function (n) { var c = form.querySelector('input[name="' + n + '"]:checked'); return c ? c.value : null; };
    return { shape: v('shape') || 'almond', colour: v('colour') || 'nude', finish: v('finish') || 'plain' };
  }
  function srcset(p) { return ['480', '800', '1200'].map(function (w) { return 'assets/img/' + p + '-' + w + '.webp ' + w + 'w'; }).join(', '); }

  function paint() {
    if (!form || !svg || !window.DNHand || !SETS.length) return;
    var ch = choice(), r = DNHand.compose(SETS, ch);
    DNHand.update(svg, r.state);
    svg.setAttribute('aria-label', 'Drawn hand wearing ' + r.words.charAt(0).toLowerCase() + r.words.slice(1));
    var m = r.match;
    if (!last || last.match.id !== m.id) {
      mSrc.setAttribute('srcset', srcset(m.photo));
      mImg.src = 'assets/img/' + m.photo + '-800.jpg';
      mImg.alt = m.caption + ', a set done at the salon';
      if (!reduce) { var fig = mImg.closest('figure'); fig.classList.remove('is-landing'); void fig.offsetWidth; fig.classList.add('is-landing'); }
    }
    mText.textContent = m.caption;
    mNone.hidden = r.close;
    last = r;
  }
  if (form) {
    form.addEventListener('change', paint);
    // On a phone the hand sits sticky over the top of the act; keep a focused
    // chip below it, not under it.
    form.addEventListener('focusin', function (e) {
      var st = document.querySelector('.tryon__stage');
      if (!st || getComputedStyle(st).position !== 'sticky') return;
      var r = e.target.getBoundingClientRect(), b = st.getBoundingClientRect().bottom;
      if (r.top < b + 8) window.scrollBy(0, r.top - b - 16);
    });
    paint();
  }

  // ------------------------------------------------- show it at the desk --
  var dlg = document.getElementById('desk');
  var openBtn = document.getElementById('desk-open');
  if (dlg && openBtn && typeof dlg.showModal === 'function') {
    openBtn.addEventListener('click', function () {
      if (!last) paint();
      var dh = document.getElementById('desk-hand');
      dh.innerHTML = DNHand.render(last.state, 'd');
      dh.setAttribute('aria-label', 'Drawn hand wearing ' + last.words.charAt(0).toLowerCase() + last.words.slice(1));
      document.getElementById('desk-words').textContent = last.words + '.';
      // The photo is made only when the dialog opens, so a closed dialog costs nothing.
      var di = document.getElementById('desk-img');
      if (!di) {
        di = document.createElement('img');
        di.id = 'desk-img'; di.width = 800; di.height = 1066; di.decoding = 'async';
        var fig = document.getElementById('desk-photo');
        fig.insertBefore(di, fig.firstChild);
      }
      di.src = 'assets/img/' + last.match.photo + '-800.jpg';
      di.alt = last.match.caption + ', a set done at the salon';
      document.getElementById('desk-cap').textContent = (last.close ? 'Closest set they have done: ' : 'Nearest they have posted: ') + last.match.caption;
      dlg.showModal();
      document.getElementById('desk-close').focus();
    });
    document.getElementById('desk-close').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function () { openBtn.focus(); });
  } else if (openBtn) {
    openBtn.hidden = true;
  }

  // -------------------------------------------------------------- prints --
  // Each print drops onto the rug in turn as the pinned act runs. Driven from
  // the engine's --sc-p; CSS reads --d (0..1) per print. Reduced motion keeps
  // the plain grid, so nothing here runs.
  var work = document.getElementById('work');
  var prints = work ? Array.prototype.slice.call(work.querySelectorAll('.print--drop')) : [];
  if (work && prints.length && !reduce) {
    html.classList.add('drops');
    var n = prints.length;
    var drive = function () {
      var p = parseFloat(getComputedStyle(work).getPropertyValue('--sc-p')) || 0;
      prints.forEach(function (el, i) {
        var a = 0.04 + i * (0.8 / n), d = Math.max(0, Math.min(1, (p - a) / (0.8 / n)));
        el.style.setProperty('--d', d.toFixed(3));
      });
    };
    var t = false;
    addEventListener('scroll', function () { if (!t) { t = true; requestAnimationFrame(function () { t = false; drive(); }); } }, { passive: true });
    addEventListener('resize', drive, { passive: true });
    drive();
    // Keyboard users tab into a print that has not dropped yet: land it.
    prints.forEach(function (el) { el.addEventListener('focusin', function () { el.style.setProperty('--d', '1'); }); });
  }

  // ---------------------------------------------------------------- note --
  // A plain POST to Web3Forms that works with JS off. With JS: inline errors,
  // focus the first one, and the button reads "Sending" while the POST goes.
  var note = document.getElementById('note');
  if (note) {
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
      b.textContent = 'Sending'; b.setAttribute('aria-disabled', 'true');
    });
    rules.forEach(function (r) {
      document.getElementById(r[0]).addEventListener('input', function () {
        var f = this, er = document.getElementById(r[1]);
        if (f.getAttribute('aria-invalid') === 'true' && !r[2](f.value.trim())) { f.removeAttribute('aria-invalid'); er.hidden = true; }
      });
    });
  }
})();
