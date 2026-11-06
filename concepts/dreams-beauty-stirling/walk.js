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
      s.textContent = r.streets[i].name;
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
