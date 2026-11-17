/* Your sizes. Typed millimetres redraw a window or door to scale, with the sizes
   lettered on its edges, and write the email to Donna.
   Nothing is stored and nothing is sent by this script: no storage, no fetch,
   no form post. "Send to Donna" is a mailto link the visitor's own email opens. */
(function () {
  var root = document.querySelector('[data-tool]');
  if (!root) return;
  document.documentElement.classList.add('js');
  root.hidden = false;

  var EMAIL = 'sales@superiorscotland.co.uk';
  var INK = '#1E2226', GLASS = '#F4F6F8';
  // Line-up colours from door-lineup-1.jpg (brief card section 3). White from their
  // white frames and white door (door-white-squares.jpg, stock-windows-racked.jpg).
  var COLOURS = { red: '#7A2A33', purple: '#4A3049', teal: '#2E5D75', anthracite: '#29373B', oak: '#A07F55', white: '#FFFFFF' };
  var TYPES = { window: 'window', door: 'door', patio: 'patio door' };
  var MATERIALS = { upvc: 'uPVC', composite: 'Composite', aluminium: 'Aluminium' };
  // Example from a customer's own question on their post: "are any of the doors 830 by 2050"
  var EX = { type: 'door', material: 'composite', w: 830, h: 2050, colour: 'teal' };
  var MIN = 200, MAX = 6000;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var form = root.querySelector('form');
  var wIn = root.querySelector('#w'), hIn = root.querySelector('#h');
  var svg = root.querySelector('svg');
  var cap = root.querySelector('#cap');
  var msg = root.querySelector('#msg');
  var send = root.querySelector('#send');
  var why = root.querySelector('#why');
  var copyBtn = root.querySelector('#copy');
  var copied = root.querySelector('#copied');

  var good = { w: null, h: null };      // last good typed values
  var shown = null;                     // geometry currently drawn {fw, fh}
  var anim = 0;

  function picked(name) { var r = form.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : null; }

  // ?type= preselects: window, door, patio, composite (a composite door)
  (function () {
    var t = new URLSearchParams(location.search).get('type');
    if (!t) return;
    if (t === 'composite') { check('type', 'door'); check('material', 'composite'); }
    else if (TYPES[t]) check('type', t);
  })();
  function check(name, v) { var r = form.querySelector('input[name="' + name + '"][value="' + v + '"]'); if (r) r.checked = true; }

  function parse(input) {
    var v = input.value.trim();
    if (v === '') return { empty: true };
    if (!/^\d+$/.test(v)) return { bad: true };
    var n = parseInt(v, 10);
    if (n < MIN || n > MAX) return { bad: true };
    return { n: n };
  }

  function showErr(input, on) {
    var e = document.getElementById(input.id + '-err');
    input.setAttribute('aria-invalid', on ? 'true' : 'false');
    e.textContent = on ? 'Check that size: is it in millimetres?' : '';
  }

  var timers = {};
  function onSize(input, key, immediate) {
    var p = parse(input);
    clearTimeout(timers[key]);
    if (p.n) { good[key] = p.n; showErr(input, false); }
    else if (p.empty) { good[key] = null; showErr(input, false); }
    else {
      good[key] = good[key] === undefined ? null : good[key];
      // let people finish typing before telling them off
      if (immediate) showErr(input, true);
      else timers[key] = setTimeout(function () { showErr(input, true); }, 700);
    }
    update();
  }

  function state() {
    var t = picked('type'), m = picked('material'), c = picked('colour');
    var pw = parse(wIn), ph = parse(hIn);
    return {
      type: t, material: m, colour: c,
      w: pw.n || null, h: ph.n || null,
      badW: !!pw.bad, badH: !!ph.bad,
      dw: good.w || EX.w, dh: good.h || EX.h,
      dt: t || EX.type, dc: c || EX.colour,
      example: !(good.w && good.h)
    };
  }

  function syncMaterials() {
    var t = picked('type');
    var comp = form.querySelector('input[name="material"][value="composite"]');
    // their words: "Composite Doors". Composite is a door choice only.
    var off = t && t !== 'door';
    comp.disabled = !!off;
    if (off && comp.checked) comp.checked = false;
  }

  function name(s) {
    var mat = s.material ? MATERIALS[s.material] + ' ' : '';
    var t = TYPES[s.type];
    var str = mat + t;
    return str.charAt(0) === 'u' ? str : str.charAt(0).toUpperCase() + str.slice(1);
  }

  /* ---------- the drawing ---------- */
  var NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, text) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }
  var AREA = { x: 24, y: 64, w: 300, h: 300 };

  function geometry(w, h) {
    var s = Math.min(AREA.w / w, AREA.h / h);
    return { fw: w * s, fh: h * s, s: s };
  }

  function draw(fw, fh, s, st) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var x0 = Math.max(AREA.x, (400 - (fw + 52)) / 2), y0 = AREA.y + (AREA.h - fh) / 2;
    var col = COLOURS[st.dc];
    var t = Math.max(5, Math.min(14, 70 * s));
    var g = el('g', { 'stroke-width': '1' });
    svg.appendChild(g);
    function rect(x, y, w, h, fill) { g.appendChild(el('rect', { x: x.toFixed(1), y: y.toFixed(1), width: Math.max(0, w).toFixed(1), height: Math.max(0, h).toFixed(1), fill: fill, stroke: INK })); }

    rect(x0, y0, fw, fh, col);                                   // outer frame
    if (st.dt === 'window') {
      rect(x0 + t, y0 + t, fw - 2 * t, fh - 2 * t, col);         // sash
      rect(x0 + 2 * t, y0 + 2 * t, fw - 4 * t, fh - 4 * t, GLASS); // glass
    } else if (st.dt === 'patio') {
      var half = (fw - 2 * t) / 2;
      for (var i = 0; i < 2; i++) {
        var px = x0 + t + i * half;
        rect(px, y0 + t, half, fh - 2 * t, col);
        rect(px + t, y0 + 2 * t, half - 2 * t, fh - 4 * t, GLASS);
      }
    } else {                                                      // door
      var lx = x0 + t, ly = y0 + t, lw = fw - 2 * t, lh = fh - t;
      rect(lx, ly, lw, lh, col);                                  // leaf
      rect(lx + lw * 0.3, ly + lh * 0.08, lw * 0.4, lh * 0.3, GLASS); // glazed panel
      rect(lx + lw * 0.3, ly + lh * 0.52, lw * 0.4, Math.max(3, lh * 0.025), INK); // letterbox
      rect(lx + lw * 0.84, ly + lh * 0.46, Math.max(3, lw * 0.04), Math.max(8, lh * 0.08), INK); // handle
    }

    // dimension lines, like a joiner's sketch
    var d = el('g', { stroke: INK, 'stroke-width': '1.25', fill: 'none' });
    svg.appendChild(d);
    var ty = y0 - 22, rx = x0 + fw + 22;
    d.appendChild(el('line', { x1: x0, y1: ty, x2: x0 + fw, y2: ty }));
    d.appendChild(el('line', { x1: x0, y1: ty - 8, x2: x0, y2: ty + 8 }));
    d.appendChild(el('line', { x1: x0 + fw, y1: ty - 8, x2: x0 + fw, y2: ty + 8 }));
    d.appendChild(el('line', { x1: rx, y1: y0, x2: rx, y2: y0 + fh }));
    d.appendChild(el('line', { x1: rx - 8, y1: y0, x2: rx + 8, y2: y0 }));
    d.appendChild(el('line', { x1: rx - 8, y1: y0 + fh, x2: rx + 8, y2: y0 + fh }));
    var font = { 'font-family': 'Carlito, Calibri, sans-serif', 'font-size': '18', 'font-weight': '700', fill: INK, style: 'font-variant-numeric: tabular-nums' };
    var top = el('text', Object.assign({ x: (x0 + fw / 2).toFixed(1), y: (ty - 8).toFixed(1), 'text-anchor': 'middle', 'data-dim': 'width' }, font), st.dw + ' mm');
    var cy = y0 + fh / 2;
    var right = el('text', Object.assign({ x: (rx + 22).toFixed(1), y: cy.toFixed(1), 'text-anchor': 'middle', transform: 'rotate(-90 ' + (rx + 22).toFixed(1) + ' ' + cy.toFixed(1) + ')', 'data-dim': 'height' }, font), st.dh + ' mm');
    svg.appendChild(top); svg.appendChild(right);
    // the frame's own box, for checks
    svg.setAttribute('data-frame', fw.toFixed(2) + ' ' + fh.toFixed(2));
  }

  function render(st) {
    var target = geometry(st.dw, st.dh);
    cancelAnimationFrame(anim);
    if (!shown || reduce) { shown = { fw: target.fw, fh: target.fh }; draw(target.fw, target.fh, target.s, st); return; }
    var from = { fw: shown.fw, fh: shown.fh }, t0 = performance.now(), D = 250;
    (function step(now) {
      var k = Math.min(1, (now - t0) / D);
      var e = 1 - Math.pow(1 - k, 3);
      shown = { fw: from.fw + (target.fw - from.fw) * e, fh: from.fh + (target.fh - from.fh) * e };
      draw(shown.fw, shown.fh, target.s, st);
      if (k < 1) anim = requestAnimationFrame(step);
    })(t0);
  }

  /* ---------- the message ---------- */
  function sketch(w, h, maxCols, maxRows, kind) {
    var k = Math.max(w / maxCols, h / (2 * maxRows));
    var cols = Math.max(4, Math.round(w / k)), rows = Math.max(2, Math.round(h / (2 * k)));
    var edge = '+' + new Array(cols + 1).join('-') + '+';
    var lines = [new Array(Math.max(1, Math.floor((cols + 2) / 2) - 3)).join(' ') + w + ' mm', edge];
    var mid = Math.floor(rows / 2);
    for (var r = 0; r < rows; r++) {
      var inner = new Array(cols + 1).join(' ').split('');
      if (kind === 'patio') inner[Math.floor(cols / 2)] = '|';
      if (kind === 'door' && r === mid) inner[cols - 2] = 'o';
      lines.push('|' + inner.join('') + '|' + (r === mid ? '  ' + h + ' mm' : ''));
    }
    lines.push(edge);
    return lines;
  }

  function compose(st) {
    var complete = st.type && st.material && st.colour && st.w && st.h;
    var desc;
    if (complete) desc = name(st) + ', ' + st.w + ' mm wide x ' + st.h + ' mm high, ' + st.colour + '.';
    else desc = (st.type ? name(st) : '(type)') + ', ' + (st.w || '(width)') + ' mm wide x ' + (st.h || '(height)') + ' mm high, ' + (st.colour || '(colour)') + '.';
    var head = ['Hi Donna,', 'Could I get a price for this, please?', desc, ''];
    var tail = ['', 'Name:', 'Phone:', 'Sent from the sizes page on your website.'];
    var sizes = [[20, 7], [16, 5], [12, 4], [8, 3]];
    var out;
    for (var i = 0; i < sizes.length; i++) {
      var sk = complete ? sketch(st.w, st.h, sizes[i][0], sizes[i][1], st.type) : [];
      var subject = complete ? 'Price request: ' + name(st).replace(/^[A-Z]/, function (c) { return c.toLowerCase(); }) + ' ' + st.w + ' x ' + st.h + ' mm' : '';
      var body = head.concat(sk, tail).join('\r\n');
      var href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      out = { head: head, sk: sk, tail: tail, href: href, complete: !!complete, text: head.concat(sk, tail).join('\n') };
      if (href.length < 1800) break;
    }
    return out;
  }

  function missing(st) {
    var m = [];
    if (!st.type) m.push('what it is');
    if (!st.material) m.push('the material');
    if (!st.w) m.push('the width');
    if (!st.h) m.push('the height');
    if (!st.colour) m.push('a colour');
    return m;
  }

  function update() {
    syncMaterials();
    var st = state();
    render(st);
    // caption and label always describe what is drawn, and say which parts are still the example
    var nothing = !st.type && !st.material && !st.colour && !good.w && !good.h;
    var drawnMat = st.material || (st.type ? null : EX.material);
    var desc = name({ type: st.dt, material: drawnMat }) + ', ' + st.dw + ' mm wide by ' + st.dh + ' mm high, ' + st.dc;
    var ex = [];
    if (!st.type) ex.push('type');
    if (!good.w) ex.push('width');
    if (!good.h) ex.push('height');
    if (!st.colour) ex.push('colour');
    var exList = ex.length > 1 ? ex.slice(0, -1).join(', ') + ' and ' + ex[ex.length - 1] : ex[0];
    svg.setAttribute('aria-label', (ex.length ? 'Example: ' : '') + desc);
    cap.textContent = nothing
      ? 'Example: ' + desc + '. Type your sizes and it redraws to them.'
      : ex.length
        ? desc + '. The ' + exList + (ex.length > 1 ? ' are' : ' is') + ' the example until you choose yours.'
        : 'Drawn to your sizes: ' + desc + '.';

    var c = compose(st);
    msg.textContent = '';
    msg.appendChild(document.createTextNode(c.head.join('\n') + (c.sk.length ? '\n' : '')));
    if (c.sk.length) { var s = document.createElement('span'); s.className = 'sk'; s.textContent = c.sk.join('\n'); msg.appendChild(s); }
    msg.appendChild(document.createTextNode('\n' + c.tail.join('\n')));
    msg.setAttribute('data-text', c.text);

    if (c.complete) {
      send.setAttribute('href', c.href);
      send.removeAttribute('aria-disabled');
      why.textContent = 'Opens your email with this message to ' + EMAIL + '. Add your name and phone before you send.';
    } else {
      send.removeAttribute('href');
      send.setAttribute('aria-disabled', 'true');
      var m = missing(st);
      var list = m.length > 1 ? m.slice(0, -1).join(', ') + ' and ' + m[m.length - 1] : m[0];
      why.textContent = (st.badW || st.badH) ? 'Check the sizes: whole millimetres, 200 to 6000.' : 'To send, add ' + list + '.';
    }
  }

  send.addEventListener('click', function (e) { if (send.getAttribute('aria-disabled') === 'true') { e.preventDefault(); why.focus && why.focus(); } });
  send.addEventListener('keydown', function (e) { if (e.key === ' ' && send.getAttribute('aria-disabled') !== 'true') { e.preventDefault(); send.click(); } });

  copyBtn.addEventListener('click', function () {
    var text = msg.getAttribute('data-text');
    function select() {
      var r = document.createRange(); r.selectNodeContents(msg);
      var sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
      copied.textContent = 'The message is selected: use your phone\'s Copy.';
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { copied.textContent = 'Copied. Paste it into a message to ' + EMAIL + '.'; }, select);
    } else select();
  });

  form.addEventListener('submit', function (e) { e.preventDefault(); });
  form.addEventListener('change', function (e) {
    if (e.target === wIn) return onSize(wIn, 'w', true);
    if (e.target === hIn) return onSize(hIn, 'h', true);
    update();
  });
  wIn.addEventListener('input', function () { onSize(wIn, 'w', false); });
  hIn.addEventListener('input', function () { onSize(hIn, 'h', false); });

  update();
})();
