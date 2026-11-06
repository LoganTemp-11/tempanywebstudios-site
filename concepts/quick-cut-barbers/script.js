// Quick Cut Barbers, first version by Tempany Web Studios, Nov 2026.
// The years and the text to Stephen. Everything is progressive: with JS off
// the years are a plain list and the default text ships in the HTML, link and
// all. Nothing here sends, stores or fetches anything.
(function () {
  'use strict';
  var html = document.documentElement;
  var reduce = html.classList.contains('rm');

  // ------------------------------------------------------------ the years --
  // Pinned only with motion and a screen at least 600px tall. The numeral runs
  // 1982 to 2026 over the first 80% of the pin, then rests; each line is lit
  // once the numeral reaches its year.
  var yAct = document.getElementById('years');
  var yNum = document.getElementById('yr-num');
  var yItems = yAct ? Array.prototype.slice.call(yAct.querySelectorAll('[data-y]')) : [];
  var shown = null;
  function yMode() {
    var flat = reduce || innerHeight < 600;
    html.classList.toggle('yr-flat', flat);
    html.classList.toggle('yr-live', !flat);
    return flat;
  }
  function years() {
    if (!yAct || !yNum) return;
    if (html.classList.contains('yr-flat')) { yItems.forEach(function (li) { li.setAttribute('data-lit', ''); }); return; }
    var r = yAct.getBoundingClientRect();
    var p = Math.max(0, Math.min(1, -r.top / Math.max(r.height - innerHeight, 1)));
    var yr = 1982 + Math.round(44 * Math.min(1, p / 0.8));
    if (yr !== shown) { yNum.textContent = String(yr); shown = yr; }
    yItems.forEach(function (li) {
      if (yr >= +li.getAttribute('data-y')) li.setAttribute('data-lit', ''); else li.removeAttribute('data-lit');
    });
  }
  yMode(); years();

  // ---------------------------------------------------- the text to Stephen --
  var NUMBER = '+447776237491';
  var MM = { 1: 3, 2: 6, 3: 10, 4: 13, 5: 16, 6: 19, 7: 22, 8: 25 };   // standard guards, roughly
  var form = document.getElementById('composer');
  var bubble = document.getElementById('bubble');
  var send = document.getElementById('send');
  var clipper = document.getElementById('clipper');
  var gauge = document.getElementById('gauge');
  var bar = document.getElementById('gauge-bar');
  var copyBtn = document.getElementById('copy');
  var status = document.getElementById('copy-status');
  var lastG = 2;

  function val(n) { var c = form.querySelector('input[name="' + n + '"]:checked'); return c ? c.value : null; }

  // The message, exactly as PLAN.md writes it (sig.mjs checks these words).
  function message(o) {
    var G = o.sides, kind = o.top, phrase, allOver = false;
    if (kind === 'up1' || kind === 'up2') {
      var T = Math.min(8, G + (kind === 'up1' ? 1 : 2));
      if (T === G) { phrase = 'a number ' + G + ' all over'; allOver = true; }
      else phrase = 'a number ' + G + ' back and sides, number ' + T + ' on top';
    } else if (kind === 'tidy') {
      phrase = 'a number ' + G + ' back and sides, just a tidy on top';
    } else {
      phrase = 'a number ' + G + ' all over'; allOver = true;
    }
    if (o.beard === 'yes') phrase += allOver ? ' and a beard trim' : ', and a beard trim';
    var hi = 'Hi Stephen' + (o.name ? ", it's " + o.name : '') + '.';
    return hi + " I'd like " + phrase + '. When suits?';
  }

  // One guard, drawn to scale: tooth length is mm * 2.4 in the SVG's units.
  function guard(g) {
    var h = (MM[g] * 2.4).toFixed(1), teeth = '';
    for (var x = 62; x <= 150; x += 8) teeth += '<rect x="' + x + '" y="14" width="4" height="' + h + '" rx="2"/>';
    return '<rect class="guard__plate" x="56" y="0" width="108" height="16" rx="3"/><g class="guard__teeth">' + teeth +
      '</g><text class="guard__no" x="110" y="12" text-anchor="middle">No. ' + g + '</text>';
  }
  function clip(g) {
    var cur = document.getElementById('guard');
    if (!cur) return;
    if (!reduce && g !== lastG) {
      // the old guard slides down and fades; the new one clips up
      var old = cur.cloneNode(true);
      old.removeAttribute('id'); old.setAttribute('class', 'guard guard--out'); old.setAttribute('aria-hidden', 'true');
      cur.parentNode.insertBefore(old, cur);
      setTimeout(function () { if (old.parentNode) old.parentNode.removeChild(old); }, 200);
      cur.setAttribute('class', 'guard');
      void cur.getBoundingClientRect();
      cur.setAttribute('class', 'guard is-in');
    }
    cur.innerHTML = guard(g);
    lastG = g;
  }

  function read() {
    var who = document.getElementById('who');
    return {
      sides: parseInt(val('sides') || '2', 10),
      top: val('top') || 'same',
      beard: val('beard') || 'no',
      name: who ? who.value.replace(/\s+/g, ' ').trim() : ''
    };
  }

  function update() {
    var o = read(), body = message(o), mm = MM[o.sides];
    bubble.textContent = body;
    send.setAttribute('href', 'sms:' + NUMBER + '?&body=' + encodeURIComponent(body));
    if (o.sides !== lastG) clip(o.sides);
    clipper.setAttribute('aria-label', 'Clipper with a number ' + o.sides + ' guard, about ' + mm + 'mm');
    gauge.querySelector('.gauge__no').textContent = 'No. ' + o.sides;
    gauge.querySelector('.gauge__mm').textContent = 'about ' + mm + 'mm';
    bar.setAttribute('height', (mm * 2.4).toFixed(1));
    if (status) status.textContent = '';
  }

  if (form && bubble && send) {
    form.addEventListener('change', update);
    form.addEventListener('input', function (e) { if (e.target.id === 'who') update(); });
    update();
  }

  if (copyBtn) copyBtn.addEventListener('click', function () {
    var text = bubble.textContent;
    function fallback() {
      try {
        var range = document.createRange(); range.selectNodeContents(bubble);
        var sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
      } catch (e) { /* nothing more to try */ }
      status.textContent = 'Press and hold the message to copy it.';
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        status.textContent = 'Copied. Paste it into a text to 07776 237491.';
      }, fallback);
    } else fallback();
  });

  // ------------------------------------------------------------ the loop --
  var ticking = false;
  addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { ticking = false; years(); });
  }, { passive: true });
  addEventListener('resize', function () { yMode(); years(); }, { passive: true });
})();
