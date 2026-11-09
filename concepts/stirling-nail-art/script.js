// Stirling Nail Art, first version by Tempany Web Studios, Nov 2026.
// The club, the build-up and the note. Everything is progressive: with JS off
// the club is a grid of figures, the build-up is a static list beside a nail
// drawn at rung 3, and the form is a plain POST.
(function () {
  'use strict';
  var html = document.documentElement;
  var reduce = html.classList.contains('rm');
  var clamp01 = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };

  // menu.json, inlined by tools/build.mjs so file:// and a cached page work.
  /*menu:start*/var MENU = {"fresha":"https://www.fresha.com/a/stirling-nail-art-stirling-21-upper-craigs-tau3hbuc","rungs":[{"n":1,"name":"Hygienic Manicure","price":20,"time":"40 minutes","junior":{"name":"Hygienic Manicure","price":15}},{"n":2,"name":"Hygienic Manicure + Regular Polish","price":25,"time":"1 hour","junior":null},{"n":3,"name":"Hygienic Manicure + Gel Polish","price":35,"time":"1 hour 20 minutes","junior":{"name":"Hygienic Manicure + Gel Polish","price":25}},{"n":4,"name":"Hygienic Manicure + BIAB + Gel Polish","price":40,"time":"1 hour 30 minutes","junior":{"name":"Manicure, BIAB and gel","price":30}},{"n":5,"name":"Nail extension and Gel Polish","price":50,"time":"2 hours","junior":null}]};/*menu:end*/

  // Progress through a pinned act, the engine's own formula, measured here so
  // a scroll frame never reads last frame's --sc-p.
  function prog(el) {
    var r = el.getBoundingClientRect();
    return clamp01(-r.top / Math.max(r.height - innerHeight, 1));
  }

  // ------------------------------------------------------------- the club --
  // One spot on the wall; the sets swap in place there as the act runs.
  var club = document.getElementById('club');
  var shots = club ? Array.prototype.slice.call(club.querySelectorAll('.shot')) : [];
  var cNum = document.getElementById('club-n'), cCap = document.getElementById('club-cap');
  var cur = -1;
  function clubDrive() {
    if (!shots.length) return;
    var n = shots.length, i = Math.min(n - 1, Math.floor(prog(club) * n));
    if (i === cur) return;
    cur = i;
    shots.forEach(function (s, k) { if (k === i) s.setAttribute('data-on', ''); else s.removeAttribute('data-on'); });
    if (cNum) cNum.textContent = String(i + 1);
    if (cCap) cCap.textContent = shots[i].getAttribute('data-cap') || '';
  }
  if (club && shots.length && !reduce) {
    html.classList.add('club-swap');
    clubDrive();
  }

  // The engine measured act tops at mount, before the classes above changed
  // the layout (club-swap pins the club; build-live shows the ladder). Ask it
  // to measure again now, once the fonts land, and whenever the page's own
  // height changes (a FAQ opening, a resize the engine skipped on a phone).
  function relayout() { var I = window.ScrollCraft && ScrollCraft.instances[0]; if (I && I.layout) I.layout(); }
  window.SNARelayout = relayout;

  // --------------------------------------------------------- the build-up --
  var build = document.getElementById('buildup');
  var rungs = build ? Array.prototype.slice.call(build.querySelectorAll('input[name="rung"]')) : [];
  var readout = document.getElementById('readout');
  var fresha = document.getElementById('fresha-btn');
  var layers = build ? Array.prototype.slice.call(build.querySelectorAll('[data-d3]')) : [];
  var lastRung = 0;

  function menu() { var m = build.querySelector('input[name="menu"]:checked'); return m ? m.value : 'main'; }

  function paintRung(n) {
    n = Math.max(1, Math.min(5, n));
    var junior = menu() === 'junior';
    build.setAttribute('data-rung', String(n));
    build.setAttribute('data-menu', junior ? 'junior' : 'main');
    rungs.forEach(function (r) { r.checked = (+r.value === n); });
    // Builder and gel sit on the coat under them, so their outline moves.
    var key = n >= 5 ? 'data-d5' : n === 4 ? 'data-d4' : 'data-d3';
    layers.forEach(function (p) {
      var d = p.getAttribute(key) || p.getAttribute('data-d4') || p.getAttribute('data-d3');
      if (d && p.tagName.toLowerCase() === 'path') p.style.d = 'path("' + d + '")';
    });
    var R = MENU.rungs && MENU.rungs[n - 1];
    if (!R) return;
    var name = R.name, txt;
    if (junior && R.junior) {
      name = R.junior.name;
      txt = name + ', junior menu with Yuliia. £' + R.junior.price + ', time on Fresha.';
    } else if (junior) {
      txt = R.name + ': main menu only. £' + R.price + ', ' + R.time + '.';
    } else {
      txt = R.name + '. £' + R.price + ', ' + R.time + '.';
    }
    if (n !== lastRung || readout.textContent !== txt) readout.textContent = txt;
    lastRung = n;
    if (fresha) fresha.setAttribute('aria-label', 'Book ' + name + ' on Fresha');
  }

  function rungFromScroll() { return Math.min(5, Math.floor(prog(build) * 5) + 1); }

  // While a tap's scroll is travelling, the rung it asked for holds; scroll
  // does not repaint the ladder until the page has arrived (within 2px).
  var seek = null;   // { y, n, raf }

  function buildDrive() {
    if (!build || seek) return;
    var n = rungFromScroll();
    if (n !== +build.getAttribute('data-rung') || !lastRung) paintRung(n);
  }

  function targetY(n) {
    var r = build.getBoundingClientRect();
    var travel = Math.max(r.height - innerHeight, 1);
    return Math.round(r.top + scrollY + travel * ((n - 0.5) / 5));
  }

  // Any smooth scroll still running (a fan jump, scrollIntoView, an earlier
  // tap) is cancelled by an instant scrollTo to where the page is now; then
  // this tap's own rAF animation carries the page to its rung. A second tap
  // mid-flight cancels the first the same way. The rung is released only on
  // arrival, so tap and scroll can never end up disagreeing.
  function stopNative() {
    var prev = html.style.scrollBehavior; html.style.scrollBehavior = 'auto';
    window.scrollTo(0, scrollY);
    html.style.scrollBehavior = prev;
  }
  function jumpTo(y) {
    var prev = html.style.scrollBehavior; html.style.scrollBehavior = 'auto';
    window.scrollTo(0, y);
    html.style.scrollBehavior = prev;
  }
  function goRung(n) {
    if (seek && seek.raf) cancelAnimationFrame(seek.raf);
    stopNative();
    paintRung(n);
    var y = targetY(n), y0 = scrollY;
    seek = { y: y, n: n, raf: 0 };
    if (reduce || Math.abs(y - y0) < 2) { jumpTo(y); arrive(); return; }
    var t0 = performance.now(), dur = Math.min(700, 240 + Math.abs(y - y0) * 0.25);
    var me = seek;
    (function step(now) {
      if (seek !== me) return;
      var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      jumpTo(Math.round(y0 + (y - y0) * e));
      if (k < 1) { me.raf = requestAnimationFrame(step); return; }
      // Land exactly (the target can move a pixel if layout settled meanwhile).
      me.y = targetY(n); jumpTo(me.y);
      if (Math.abs(scrollY - me.y) <= 2) arrive(); else me.raf = requestAnimationFrame(step);
    })(t0);
  }
  function arrive() {
    if (!seek) return;
    var n = seek.n; seek = null;
    paintRung(n);
  }
  // A reader who grabs the page mid-flight takes over: wheel, touch or a key
  // cancels the tap's animation and scroll drives the rung again.
  ['wheel', 'touchstart', 'keydown'].forEach(function (ev) {
    addEventListener(ev, function (e) {
      if (!seek) return;
      if (ev === 'keydown' && !/^(Page|Arrow(Up|Down)$|Home|End| )/.test(e.key)) return;
      if (ev === 'keydown' && e.target && e.target.name === 'rung') return;
      cancelAnimationFrame(seek.raf); seek = null; buildDrive();
    }, { passive: true });
  });

  if (build && rungs.length && MENU.rungs) {
    html.classList.add('build-live');
    // A tap must move the page even when its rung is already checked (a
    // scroll passing through that rung's band checks it), and a checked
    // radio fires no change event. So taps go through click; arrow keys,
    // which do change the checked radio, go through change. One tap, one
    // goRung: the click lands on the input after the label's own click.
    build.addEventListener('click', function (e) {
      var t = e.target;
      if (t.name === 'rung' && e.detail !== 0) goRung(+t.value);
    });
    build.addEventListener('change', function (e) {
      var t = e.target;
      if (t.name === 'rung') { if (!seek || seek.n !== +t.value) goRung(+t.value); }
      else if (t.name === 'menu') {
        Array.prototype.forEach.call(build.querySelectorAll('[data-main]'), function (s) {
          s.textContent = s.getAttribute(t.value === 'junior' ? 'data-junior' : 'data-main');
        });
        paintRung(+build.getAttribute('data-rung'));
      }
    });
    buildDrive();
  }

  relayout();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  if ('ResizeObserver' in window) {
    var lastH = 0, ro = new ResizeObserver(function () {
      var h = document.documentElement.scrollHeight;
      if (h !== lastH) { lastH = h; relayout(); frame(); }
    });
    ro.observe(document.querySelector('main'));
  }
  addEventListener('resize', relayout, { passive: true });

  var t = false;
  function frame() { t = false; if (html.classList.contains('club-swap')) clubDrive(); buildDrive(); }
  addEventListener('scroll', function () { if (!t) { t = true; requestAnimationFrame(frame); } }, { passive: true });
  addEventListener('resize', function () { cur = -1; frame(); }, { passive: true });

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
