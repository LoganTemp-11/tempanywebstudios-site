// The drawn hand for the try-on. One left hand, back up, fingers together and
// slightly fanned, as the top hand lies in the salon's photos. Nails are
// generated from an anchor table and a shape function, so changing the shape
// recomputes each nail's path. Used by script.js in the browser and by
// tools/build.mjs to write the finished static hand into index.html (JS off).
var DNHand = (function () {
  'use strict';
  var SKIN = '#e9c9b5', LINE = '#c99f8a';
  // B: nail base (cuticle centre); a: angle in degrees, 0 is straight up;
  // fl: finger length back from B to the knuckle; fw: finger width;
  // w: nail width; L: nail length for an almond set.
  var FINGERS = [
    { id: 'little', B: [96, 196],  a: -16, fl: 112, fw: 34, w: 28, L: 52 },
    { id: 'ring',   B: [152, 128], a: -6,  fl: 146, fw: 40, w: 33, L: 62 },
    { id: 'middle', B: [212, 104], a: 2,   fl: 158, fw: 42, w: 35, L: 66 },
    { id: 'index',  B: [272, 128], a: 11,  fl: 146, fw: 40, w: 33, L: 62 },
    { id: 'thumb',  B: [356, 252], a: 44,  fl: 150, fw: 44, w: 35, L: 54 }
  ];
  var ACCENT = { middle: 1, ring: 1 };
  // Back of the hand: wide across the knuckles, tapering to the wrist.
  var PALM = '92,300 120,268 214,258 290,272 302,330 290,410 262,470 248,520 150,520 136,470 108,400 96,350';
  var LEN = { almond: 1, coffin: 0.94, oval: 0.62 };

  function f(n) { return Math.round(n * 10) / 10; }
  function dir(a) { var r = a * Math.PI / 180; return [Math.sin(r), -Math.cos(r)]; }

  function shapePath(shape, w, L) {
    var h = w / 2, c = h * 0.55, E = L * (LEN[shape] || 1);
    if (shape === 'coffin') {
      return 'M' + f(-h) + ' 0C' + f(-h) + ' ' + f(-E * 0.4) + ' ' + f(-h * 0.62) + ' ' + f(-E * 0.86) + ' ' + f(-h * 0.5) + ' ' + f(-E) +
        'L' + f(h * 0.5) + ' ' + f(-E) + 'C' + f(h * 0.62) + ' ' + f(-E * 0.86) + ' ' + f(h) + ' ' + f(-E * 0.4) + ' ' + f(h) + ' 0Q0 ' + f(c) + ' ' + f(-h) + ' 0Z';
    }
    if (shape === 'oval') {
      return 'M' + f(-h) + ' 0L' + f(-h) + ' ' + f(-E * 0.5) + 'C' + f(-h) + ' ' + f(-E * 0.94) + ' ' + f(-h * 0.55) + ' ' + f(-E) + ' 0 ' + f(-E) +
        'C' + f(h * 0.55) + ' ' + f(-E) + ' ' + f(h) + ' ' + f(-E * 0.94) + ' ' + f(h) + ' ' + f(-E * 0.5) + 'L' + f(h) + ' 0Q0 ' + f(c) + ' ' + f(-h) + ' 0Z';
    }
    return 'M' + f(-h) + ' 0C' + f(-h) + ' ' + f(-E * 0.5) + ' ' + f(-h * 0.45) + ' ' + f(-E * 0.88) + ' 0 ' + f(-E) +
      'C' + f(h * 0.45) + ' ' + f(-E * 0.88) + ' ' + f(h) + ' ' + f(-E * 0.5) + ' ' + f(h) + ' 0Q0 ' + f(c) + ' ' + f(-h) + ' 0Z';
  }

  // A small seeded random, so the leopard spots land the same every time.
  function rng(seed) { var s = seed; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

  function art(fg, st) {
    var w = fg.w, E = fg.L * (LEN[st.shape] || 1), o = '', i;
    if (st.finish === 'french') {
      o = '<path d="M' + f(-w) + ' ' + f(-E * 0.74) + 'Q0 ' + f(-E * 0.5) + ' ' + f(w) + ' ' + f(-E * 0.74) + 'L' + f(w) + ' ' + f(-E - 4) + 'L' + f(-w) + ' ' + f(-E - 4) + 'Z" fill="' + st.art + '"/>';
    } else if (st.finish === 'dots') {
      var row = 0;
      for (var y = -E * 0.2; y > -E * 0.98; y -= E * 0.19, row++) {
        for (var x = -w * 0.42 + (row % 2 ? w * 0.17 : 0); x < w * 0.5; x += w * 0.34) {
          o += '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(w * 0.085) + '" fill="' + st.art + '"/>';
        }
      }
    } else if (st.finish === 'leopard' && ACCENT[fg.id]) {
      var R = rng(fg.w * 7 + fg.L);
      o = '<rect x="' + f(-w) + '" y="' + f(-E - 4) + '" width="' + f(w * 2) + '" height="' + f(E + 12) + '" fill="#cd9168"/>';
      for (i = 0; i < 9; i++) {
        var sx = (R() - 0.5) * w * 0.95, sy = -(0.08 + R() * 0.86) * E, rx = w * (0.09 + R() * 0.05), rot = Math.round(R() * 180);
        o += '<g transform="translate(' + f(sx) + ' ' + f(sy) + ') rotate(' + rot + ')"><ellipse rx="' + f(rx) + '" ry="' + f(rx * 0.72) + '" fill="#3a2418"/><ellipse cx="' + f(rx * 0.15) + '" rx="' + f(rx * 0.5) + '" ry="' + f(rx * 0.34) + '" fill="#a8673c"/></g>';
      }
    } else if (st.finish === 'line' && ACCENT[fg.id]) {
      var sw = f(w * 0.09);
      o = '<path d="M' + f(-w * 0.7) + ' ' + f(-E * 0.22) + 'C' + f(-w * 0.1) + ' ' + f(-E * 0.48) + ' ' + f(w * 0.25) + ' ' + f(-E * 0.3) + ' ' + f(w * 0.7) + ' ' + f(-E * 0.58) + '" fill="none" stroke="' + st.art + '" stroke-width="' + sw + '" stroke-linecap="round"/>' +
          '<path d="M' + f(-w * 0.7) + ' ' + f(-E * 0.5) + 'C' + f(-w * 0.15) + ' ' + f(-E * 0.74) + ' ' + f(w * 0.2) + ' ' + f(-E * 0.56) + ' ' + f(w * 0.7) + ' ' + f(-E * 0.84) + '" fill="none" stroke="' + st.art + '" stroke-width="' + sw + '" stroke-linecap="round"/>';
    }
    return o;
  }

  function shine(fg, st) {
    var h = fg.w / 2, E = fg.L * (LEN[st.shape] || 1);
    return 'M' + f(-h * 0.42) + ' ' + f(-E * 0.16) + 'Q' + f(-h * 0.56) + ' ' + f(-E * 0.5) + ' ' + f(-h * 0.16) + ' ' + f(-E * 0.8);
  }

  // The skin: each part drawn as an outline stroke then its fill, in order
  // thumb, palm, little to index, so every finger keeps its own edge and the
  // gaps between them read. One flat fill, one outline colour.
  function seg(g) {
    var d = dir(g.a);
    return [[g.B[0] - d[0] * g.fl, g.B[1] - d[1] * g.fl], [g.B[0] + d[0] * g.L * 0.22, g.B[1] + d[1] * g.L * 0.22]];
  }
  function bone(g, col, wd) {
    var p = seg(g);
    return '<line x1="' + f(p[0][0]) + '" y1="' + f(p[0][1]) + '" x2="' + f(p[1][0]) + '" y2="' + f(p[1][1]) + '" stroke="' + col + '" stroke-width="' + wd + '" stroke-linecap="round"/>';
  }
  function skin() {
    // One silhouette: every part's outline first, then every fill on top, so
    // the fingers, thumb and palm share one edge. Gaps between fingers are
    // the outline colour showing through where the fills do not meet.
    var out = '';
    FINGERS.forEach(function (g) { out += bone(g, LINE, g.fw + 4); });
    out += '<polygon points="' + PALM + '" fill="' + LINE + '" stroke="' + LINE + '" stroke-width="4" stroke-linejoin="round"/>';
    FINGERS.forEach(function (g) { out += bone(g, SKIN, g.fw); });
    out += '<polygon points="' + PALM + '" fill="' + SKIN + '"/>';
    // knuckle line across the back of the hand, and a crease on each finger
    var lines = '<path d="M112 286Q200 262 286 288" fill="none" stroke="' + LINE + '" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="1 9" opacity=".8"/>';
    FINGERS.slice(0, 4).forEach(function (g) {
      var d = dir(g.a), m = [g.B[0] - d[0] * g.fl * 0.4, g.B[1] - d[1] * g.fl * 0.4], n = [-d[1], d[0]], q = g.fw * 0.2;
      lines += '<path d="M' + f(m[0] - n[0] * q) + ' ' + f(m[1] - n[1] * q) + 'q' + f(n[0] * q - d[0] * 3) + ' ' + f(n[1] * q - d[1] * 3) + ' ' + f(n[0] * q * 2) + ' ' + f(n[1] * q * 2) + '" fill="none" stroke="' + LINE + '" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>';
    });
    return '<g class="hand__skin">' + out + lines + '</g>';
  }

  function nailMarkup(fg, st, pre) {
    var id = pre + 'n-' + fg.id;
    return '<g transform="translate(' + fg.B[0] + ' ' + fg.B[1] + ') rotate(' + fg.a + ')">' +
      '<clipPath id="' + pre + 'c-' + fg.id + '"><use href="#' + id + '"/></clipPath>' +
      '<path id="' + id + '" data-nail="' + fg.id + '" class="nail" d="' + shapePath(st.shape, fg.w, fg.L) + '" style="fill:' + st.base + '"/>' +
      '<g class="nail__art" clip-path="url(#' + pre + 'c-' + fg.id + ')">' + art(fg, st) + '</g>' +
      '<path class="nail__shine" d="' + shine(fg, st) + '"/></g>';
  }

  function render(st, pre) {
    pre = pre || '';
    return skin() + '<g class="hand__nails">' + FINGERS.map(function (g) { return nailMarkup(g, st, pre); }).join('') + '</g>';
  }

  // Repaint in place: the base path keeps its element, so its fill can glide.
  function update(svg, st) {
    FINGERS.forEach(function (g) {
      var p = svg.querySelector('[data-nail="' + g.id + '"]');
      if (!p) return;
      var grp = p.parentNode;
      p.setAttribute('d', shapePath(st.shape, g.w, g.L));
      p.style.fill = st.base;
      grp.querySelector('.nail__art').innerHTML = art(g, st);
      grp.querySelector('.nail__shine').setAttribute('d', shine(g, st));
    });
  }


  // ------------------------------------------------------------ compose --
  // One colour chip per colour name in sets.json, in table order; its hex is
  // the first set of that name, so every chip colour is a sampled one.
  function colours(sets) {
    var out = [], seen = {};
    sets.forEach(function (s) { if (!seen[s.colourName]) { seen[s.colourName] = 1; out.push({ name: s.colourName, hex: s.base.hex }); } });
    return out;
  }
  function rgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function dist(a, b) { a = rgb(a); b = rgb(b); return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2)); }
  function light(h) { var c = rgb(h); return (c[0] * 299 + c[1] * 587 + c[2] * 114) / 1000 > 150; }
  var FINISH_WORDS = { plain: 'plain', french: 'French tips', dots: 'dots', leopard: 'leopard accents', line: 'line art accents' };

  // Score every set: shape +3, finish +2, colour closeness up to +3. Ties go
  // to table order. The art colour comes from the matched set when its finish
  // is the one chosen, otherwise a plain default for that finish.
  function compose(sets, ch) {
    var hex = (colours(sets).filter(function (c) { return c.name === ch.colour; })[0] || {}).hex || sets[0].base.hex;
    var best = null, bestScore = -1;
    sets.forEach(function (s) {
      var sc = (s.shape === ch.shape ? 3 : 0) + (s.finish === ch.finish ? 2 : 0) + 3 * (1 - Math.min(1, dist(hex, s.base.hex) / 220));
      if (sc > bestScore + 1e-9) { bestScore = sc; best = s; }
    });
    var art = (best.finish === ch.finish && best.art) ? best.art.hex
      : ch.finish === 'french' ? '#f6f4f1'
      : ch.finish === 'line' ? (light(hex) ? '#2b2326' : '#f6f4f1')
      : (light(hex) ? '#2468d8' : '#fbfbff');
    // Art the same colour as the base would vanish (orange slices on orange).
    if (ch.finish !== 'leopard' && dist(art, hex) < 70) art = light(hex) ? '#2b2326' : '#f6f4f1';
    return {
      state: { shape: ch.shape, finish: ch.finish, base: hex, art: art },
      match: best, score: bestScore, close: bestScore >= 5,
      words: ch.shape.charAt(0).toUpperCase() + ch.shape.slice(1) + ' nails, ' + ch.colour + ', ' + FINISH_WORDS[ch.finish]
    };
  }

  return { FINGERS: FINGERS, render: render, update: update, shapePath: shapePath, compose: compose, colours: colours };
})();
if (typeof module !== 'undefined') module.exports = DNHand;
