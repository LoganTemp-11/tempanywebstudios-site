// Dreams Beauty, first version by Tempany Web Studios, Nov 2026.
// "Walk me there". Pick where you are standing and the real walking route
// (OSRM foot, on OpenStreetMap streets, built once into route.json and inlined
// as window.DB_ROUTES) draws itself to the gold ring on No. 39: minutes count
// up as the line draws, street names are called in order as the line reaches
// them, and it ends on "You're at the door". Nothing is typed, sent, stored or
// asked for; no request is made and the device's location is never read.
(function () {
  'use strict';
  var DATA = window.DB_ROUTES;
  var form = document.getElementById('from');
  var svg = document.getElementById('walks');
  var layer = document.getElementById('walk-layer');
  if (!DATA || !form || !svg || !layer) return;

  var reduce = document.documentElement.classList.contains('rm') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  var ring = document.getElementById('ring');
  var lead = document.getElementById('walk-lead');
  var noteEl = document.getElementById('walk-note');
  var countEl = document.getElementById('walk-count');
  var minEl = document.getElementById('walk-min');
  var mEl = document.getElementById('walk-m');
  var streetsEl = document.getElementById('walk-streets');
  var endEl = document.getElementById('walk-end');
  var byId = {};
  DATA.routes.forEach(function (r) { byId[r.id] = r; });

  // With JS on, nothing is drawn on arrival: the static station walk is the
  // JS-off fallback only.
  var stat = svg.querySelector('.walk-static');
  if (stat) stat.parentNode.removeChild(stat);
  var DEFAULT_LABEL = 'Street plan of central Stirling, with Dreams Beauty marked by a gold ring at 39 Murray Place';
  svg.setAttribute('aria-label', DEFAULT_LABEL);
  countEl.hidden = true; streetsEl.hidden = true; endEl.hidden = true; noteEl.hidden = true;

  var raf = 0, run = 0;

  function phrase(r) {
    return 'Street plan: walking route from ' + r.label + ' to Dreams Beauty, 39 Murray Place, about ' + r.minutes + ' minute' + (r.minutes === 1 ? '' : 's');
  }
  function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function setStreets(r, upto) {
    var have = streetsEl.children.length;
    for (var i = have; i < r.streets.length && r.streets[i].at <= upto + 1e-6; i++) {
      var s = document.createElement('span');
      s.textContent = (i ? ', ' : '') + r.streets[i].name + (i === r.streets.length - 1 ? '.' : '');
      streetsEl.appendChild(s);
    }
  }

  function finish(r, path, my) {
    if (my !== run) return;
    path.style.strokeDashoffset = '0';
    minEl.textContent = r.minutes;
    mEl.textContent = r.metres;
    setStreets(r, 1);
    endEl.hidden = false;
    svg.setAttribute('aria-label', phrase(r));
    if (ring && !reduce) {
      ring.classList.remove('is-pulse'); void ring.getBoundingClientRect(); ring.classList.add('is-pulse');
    }
    reveal();
  }

  // On a phone the answer can land under the fold or under the cookie bar.
  // Scroll just far enough that the whole answer (note, minutes, streets and
  // "You're at the door") sits above the bar, never pushing its first line
  // off the top. Most of the plan and the drawn walk stay in view.
  function reveal() {
    var live = document.getElementById('walk-live');
    var consent = document.getElementById('consent');
    var floor = innerHeight - (consent && !consent.hidden ? consent.getBoundingClientRect().height + 20 : 0) - 8;
    var r = live.getBoundingClientRect();
    if (r.top >= 0 && r.bottom <= floor) return;
    var by = Math.min(r.bottom - floor, r.top - 70);   // 70: clear of the fixed lamp and tab
    if (by > 0) window.scrollTo({ top: scrollY + by, behavior: reduce ? 'instant' : 'smooth' });
  }

  function inset(r) {
    var pts = r.geometry.concat([DATA.door]);
    var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
    var x0 = Math.min.apply(0, xs), x1 = Math.max.apply(0, xs), y0 = Math.min.apply(0, ys), y1 = Math.max.apply(0, ys);
    var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    var phone = matchMedia('(max-width: 899px)').matches;
    var R = phone ? 92 : 64, Z = Math.min(phone ? 5 : 4, (R * 1.5) / Math.max(x1 - x0, y1 - y0, 1));   // the whole walk and the door fit inside
    var ox = cx + (phone ? 130 : 120), oy = cy + (phone ? 150 : 120);  // below right, over the mall roof
    pts = r.geometry;
    var gi = document.createElementNS(NS, 'g');
    gi.setAttribute('class', 'lens');
    var id = 'lens-clip-' + r.id;
    var cp = document.createElementNS(NS, 'clipPath'); cp.setAttribute('id', id);
    var cc = document.createElementNS(NS, 'circle'); cc.setAttribute('cx', ox); cc.setAttribute('cy', oy); cc.setAttribute('r', R);
    cp.appendChild(cc); gi.appendChild(cp);
    var lead = document.createElementNS(NS, 'line');
    lead.setAttribute('class', 'lens__lead'); lead.setAttribute('x1', cx); lead.setAttribute('y1', cy);
    var d = Math.hypot(ox - cx, oy - cy);
    lead.setAttribute('x2', ox - (ox - cx) * R / d); lead.setAttribute('y2', oy - (oy - cy) * R / d);
    gi.appendChild(lead);
    var bg = document.createElementNS(NS, 'circle'); bg.setAttribute('class', 'lens__bg');
    bg.setAttribute('cx', ox); bg.setAttribute('cy', oy); bg.setAttribute('r', R); gi.appendChild(bg);
    var inner = document.createElementNS(NS, 'g'); inner.setAttribute('clip-path', 'url(#' + id + ')');
    var t = 'translate(' + (ox - Z * cx) + ' ' + (oy - Z * cy) + ') scale(' + Z + ')';
    var art = document.querySelector('.plan__art');
    if (art) {
      var use = document.createElementNS(NS, 'g'); use.setAttribute('transform', t);
      // copy the plan's own blocks, paths and streets (not its labels)
      Array.prototype.forEach.call(art.querySelectorAll('rect, path'), function (n) { use.appendChild(n.cloneNode(true)); });
      inner.appendChild(use);
    }
    var wp = document.createElementNS(NS, 'path'); wp.setAttribute('class', 'walk lens__walk');
    wp.setAttribute('d', 'M' + pts.map(function (p) { return p[0] + ' ' + p[1]; }).join(' L'));
    wp.setAttribute('transform', t); wp.style.strokeWidth = (6 / Z) + 'px'; inner.appendChild(wp);
    var door = document.createElementNS(NS, 'circle'); door.setAttribute('class', 'lens__door');
    door.setAttribute('cx', DATA.door[0]); door.setAttribute('cy', DATA.door[1]); door.setAttribute('r', 10 / Z); door.setAttribute('stroke-width', 3 / Z);
    door.setAttribute('transform', t); inner.appendChild(door);
    gi.appendChild(inner);
    var rim = document.createElementNS(NS, 'circle'); rim.setAttribute('class', 'lens__rim');
    rim.setAttribute('cx', ox); rim.setAttribute('cy', oy); rim.setAttribute('r', R); gi.appendChild(rim);
    var tx = document.createElementNS(NS, 'text'); tx.setAttribute('class', 'lens__t');
    tx.setAttribute('x', ox); tx.setAttribute('y', oy + R + 20);
    tx.textContent = 'Close up: ' + r.metres + ' m';
    gi.appendChild(tx);
    return gi;
  }

  function walk(id) {
    var r = byId[id];
    if (!r) return;
    var my = ++run;
    cancelAnimationFrame(raf);

    // the previous walk fades to a quarter, then goes
    Array.prototype.forEach.call(layer.querySelectorAll('.walk-g'), function (g) {
      g.classList.add('walk--old'); g.removeAttribute('data-current');
      setTimeout(function () { if (g.parentNode) g.parentNode.removeChild(g); }, reduce ? 0 : 300);
    });

    var g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'walk-g'); g.setAttribute('data-current', id);
    var path = document.createElementNS(NS, 'path');
    path.setAttribute('class', 'walk');
    path.setAttribute('d', 'M' + r.geometry.map(function (p) { return p[0] + ' ' + p[1]; }).join(' L'));
    var dot = document.createElementNS(NS, 'circle');
    dot.setAttribute('class', 'walk__from');
    dot.setAttribute('cx', r.geometry[0][0]); dot.setAttribute('cy', r.geometry[0][1]); dot.setAttribute('r', 8);
    g.appendChild(path); g.appendChild(dot);
    layer.appendChild(g);

    // A walk this short (The Thistles, 45 m) hides under the ring at plan
    // scale. Draw a round inset beside it: the same plan and the same walk,
    // four times larger, so the turn out of Orchardcroft onto Murray Place
    // can be seen. Same geometry, nothing added.
    if (r.metres < 100) g.appendChild(inset(r));

    var L = path.getTotalLength();
    path.style.strokeDasharray = L + ' ' + L;

    // the panel
    lead.hidden = true;
    if (r.note) { noteEl.textContent = r.note; noteEl.hidden = false; } else { noteEl.hidden = true; noteEl.textContent = ''; }
    streetsEl.textContent = ''; streetsEl.hidden = false;
    countEl.hidden = false; endEl.hidden = true;

    if (reduce) {
      path.style.strokeDashoffset = '0';
      finish(r, path, my);
      return;
    }
    path.style.strokeDashoffset = String(L);
    minEl.textContent = '0'; mEl.textContent = '0';
    var dur = Math.max(1200, r.metres * 3), t0 = performance.now();
    (function step(now) {
      if (my !== run) return;
      var t = Math.min(1, (now - t0) / dur), e = ease(t);
      path.style.strokeDashoffset = String(L * (1 - e));
      minEl.textContent = Math.min(r.minutes, Math.floor(e * r.minutes));
      mEl.textContent = Math.round(e * r.metres);
      setStreets(r, e);
      if (t < 1) raf = requestAnimationFrame(step);
      else finish(r, path, my);
    })(t0);
  }

  form.addEventListener('change', function (e) {
    if (e.target && e.target.name === 'from') walk(e.target.value);
  });
  // A choice already made (back/forward cache, a restored form) is drawn.
  var pre = form.querySelector('input[name="from"]:checked');
  if (pre) walk(pre.value);

  window.DBWalk = { walk: walk };
})();
