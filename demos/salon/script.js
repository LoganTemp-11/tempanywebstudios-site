/* Brackenwynd Hair Studio — demo interactions.
   Demo site by Tempany Web Studios. No build step, no dependencies.

   Six independent modules. Modules 4, 5 and 6 are each wrapped in their own
   try/catch so that one failure can never leave a blank section on the page.

     1. DATA     salon facts, hours, stylists, 25 services. Single source of truth.
     2. nav      mobile menu toggle
     3. reveal   IntersectionObserver scroll reveal
     4. booking  state machine, deterministic slot engine, renderer
     5. chrome   cookie bar, sticky CTA, Fresha panel, open-today strip
     6. forms    demo contact form
*/
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Analytics hook. Fires no network request in this demo. On a live
     client site it hands off to Plausible if present, otherwise it
     pushes to a dataLayer for GTM to pick up.
     ------------------------------------------------------------------ */
  window.twsTrack = function (name, props) {
    try {
      if (window.plausible) return window.plausible(name, { props: props });
      (window.dataLayer = window.dataLayer || []).push(
        Object.assign({ event: name }, props || {})
      );
    } catch (e) { /* analytics must never break the page */ }
  };

  /* ==================================================================
     1. DATA — single source of truth.
     Nothing else in this file hard-codes a price, a duration or a name.
     ================================================================== */

  var SALON = {
    name: 'Brackenwynd Hair Studio',
    phone: '01632 960 118',
    phoneHref: 'tel:+441632960118',
    mobile: '07700 900 118',
    whatsapp: 'https://wa.me/447700900118',
    email: 'hello@brackenwynd.example',
    address: '9 Corbie Wynd, Falkirk, FK1'
  };

  var STYLISTS = [
    { id: 'nicola', name: 'Rhona Baird',     first: 'Rhona', role: 'Owner & Colour Director' },
    { id: 'erin',   name: 'Erin MacFarlane',  first: 'Erin',   role: 'Senior Stylist' },
    { id: 'callum', name: 'Callum Dewar',     first: 'Callum', role: 'Stylist & Barber' },
    { id: 'sophie', name: 'Sophie Lang',      first: 'Sophie', role: 'Stylist' }
  ];

  /* Opening hours as minutes from midnight, keyed by Date.getDay().
     null = closed. Sunday = 0. */
  var HOURS = {
    0: null, 1: null,
    2: [540, 1050],   /* Tue 09:00-17:30 */
    3: [540, 1050],   /* Wed 09:00-17:30 */
    4: [600, 1200],   /* Thu 10:00-20:00 */
    5: [540, 1080],   /* Fri 09:00-18:00 */
    6: [510, 990]     /* Sat 08:30-16:30 */
  };

  /* Per-day diary density: the chance, at each 30-minute step, that an
     appointment starts there. A baseline — diaryFor walks outwards from it
     per stylist and per day. Do not change without re-running tools/sweep.js
     and tools/realism.js; the tuning is delicate. */
  var LOAD = { 2: 44, 3: 44, 4: 46, 5: 50, 6: 56 };


  var CATEGORIES = [
    { id: 'cut',    name: 'Cutting & Styling' },
    { id: 'colour', name: 'Colour' },
    { id: 'treat',  name: 'Treatments' },
    { id: 'gents',  name: 'Gents & Children' }
  ];

  /* [ id, name, minutes, price (0 = free), from?, category, stylist ids,
       colour? (triggers the skin-test notice) ]
     Prices are 2026 Falkirk-market prices. Change them here AND in the
     price table in index.html — tools/check-data.js compares the two. */
  var SERVICE_ROWS = [
    ['cbd',         'Cut & Blow Dry',                              60,  45, 0, 'cut',    'nicola erin sophie',        0],
    ['restyle',     'Restyle — consultation, cut & blow dry',  75,  58, 1, 'cut',    'nicola erin',               0],
    ['wetcut',      'Wet Cut (no blow dry)',                        45,  34, 0, 'cut',    'nicola erin sophie callum', 0],
    ['blowdry',     'Blow Dry',                                     45,  28, 0, 'cut',    'nicola erin sophie',        0],
    ['fringe',      'Fringe Trim',                                  15,  10, 0, 'cut',    'erin sophie',               0],
    ['hairup',      'Hair Up / Occasion Styling',                   60,  45, 0, 'cut',    'nicola erin sophie',        0],

    ['consult',     'Colour Consultation & Skin Test',              15,   0, 0, 'colour', 'nicola erin sophie callum', 0],
    ['toner',       'Toner / Gloss',                                30,  24, 0, 'colour', 'nicola erin sophie',        1],
    ['roottint',    'Root Tint',                                    90,  52, 0, 'colour', 'nicola erin sophie',        1],
    ['fullcolour',  'Full Head Colour',                            120,  72, 1, 'colour', 'nicola erin',               1],
    ['halfhl',      'Half Head Highlights',                        120,  78, 1, 'colour', 'nicola erin',               1],
    ['roottintcbd', 'Root Tint, Cut & Blow Dry',                   135,  78, 0, 'colour', 'nicola erin',               1],
    ['fullhl',      'Full Head Highlights',                        165,  98, 1, 'colour', 'nicola erin',               1],
    ['balayage',    'Balayage',                                    180, 115, 1, 'colour', 'nicola erin',               1],
    ['balayagecbd', 'Balayage, Cut & Blow Dry',                    210, 145, 1, 'colour', 'nicola erin',               1],

    ['olaplex',     'Bond Repair Treatment (add-on)',               20,  20, 0, 'treat',  'nicola erin sophie callum', 0],
    ['scalp',       'Scalp Treatment',                              30,  24, 0, 'treat',  'nicola erin sophie',        0],
    ['deepcond',    'Deep Conditioning Treatment',                  30,  26, 0, 'treat',  'nicola erin sophie',        0],
    ['keratin',     'Keratin Smoothing',                           150, 160, 1, 'treat',  'nicola erin',               0],

    ['beard',       'Beard Trim & Shape',                           15,  12, 0, 'gents',  'callum',                    0],
    ['firstcut',    'First Haircut (under 5, with keepsake curl)',  30,  14, 0, 'gents',  'sophie',                    0],
    ['kids',        'Children\u2019s Cut (under 12)',               30,  16, 0, 'gents',  'sophie callum',             0],
    ['gents',       'Gents Cut',                                    30,  22, 0, 'gents',  'callum',                    0],
    ['skinfade',    'Gents Skin Fade',                              45,  27, 0, 'gents',  'callum',                    0],
    ['gentsbeard',  'Gents Cut & Beard',                            45,  30, 0, 'gents',  'callum',                    0]
  ];

  var SERVICES = SERVICE_ROWS.map(function (r) {
    return {
      id: r[0], name: r[1], duration: r[2], price: r[3],
      from: !!r[4], cat: r[5], stylists: r[6].split(' '), colour: !!r[7]
    };
  });

  function deepFreeze(o) {
    if (o && typeof o === 'object' && !Object.isFrozen(o)) {
      Object.freeze(o);
      Object.keys(o).forEach(function (k) { deepFreeze(o[k]); });
    }
    return o;
  }

  var DATA = deepFreeze({
    salon: SALON, stylists: STYLISTS, hours: HOURS, load: LOAD,
    categories: CATEGORIES, services: SERVICES
  });

  var SERVICE_BY_ID = {}, STYLIST_BY_ID = {};
  DATA.services.forEach(function (s) { SERVICE_BY_ID[s.id] = s; });
  DATA.stylists.forEach(function (s) { STYLIST_BY_ID[s.id] = s; });

  /* ------------------------------------------------------------------
     Formatting helpers. Day and month names are hard-coded rather than
     taken from toLocaleDateString, so the output is identical in every
     browser locale — the demo must never render "mercredi" on a French
     laptop, and determinism is the whole point of the slot engine.
     ------------------------------------------------------------------ */
  var DAY_LONG  = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MON_LONG  = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                   'August', 'September', 'October', 'November', 'December'];
  var MON_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
                   'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function isoOf(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function dateOf(iso) { var p = iso.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function timeOf(mins) { return pad2(Math.floor(mins / 60)) + ':' + pad2(mins % 60); }

  function dateLong(iso) {
    var d = dateOf(iso);
    return DAY_LONG[d.getDay()] + ' ' + d.getDate() + ' ' + MON_LONG[d.getMonth()] + ' ' + d.getFullYear();
  }
  function dateShort(iso) {
    var d = dateOf(iso);
    return DAY_SHORT[d.getDay()] + ' ' + d.getDate() + ' ' + MON_SHORT[d.getMonth()];
  }
  function priceText(s) {
    if (s.price === 0) return 'Free';
    return (s.from ? 'from £' : '£') + s.price;
  }
  function durationText(m) {
    if (m < 60) return m + ' min';
    var h = Math.floor(m / 60), r = m % 60;
    return h + ' hr' + (r ? ' ' + r : '');
  }
  /* Spoken form for screen readers — "1 hr 15" is read as "one aitch are fifteen". */
  function durationSpoken(m) {
    if (m < 60) return m + ' minutes';
    var h = Math.floor(m / 60), r = m % 60;
    return h + (h === 1 ? ' hour' : ' hours') + (r ? ' ' + r + ' minutes' : '');
  }

  /* ==================================================================
     Deterministic availability engine.
     Same inputs give the same slots on every device, in every engine,
     for ever. There is no Math.random anywhere in this file.
     ================================================================== */

  /* FNV-1a, 32-bit. Math.imul and the >>> 0 are load-bearing: without them
     V8 and JavaScriptCore diverge once the multiply overflows 2^53. */
  function hash32(s) {
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
  }

  /* Which stylists can do this service, given the visitor's choice.
     'any' = every qualifying stylist. */
  function poolFor(service, stylistId) {
    if (!service) return [];
    if (stylistId === 'any' || !stylistId) return service.stylists.slice();
    return service.stylists.indexOf(stylistId) > -1 ? [stylistId] : [];
  }

  /* The distinct appointment lengths each stylist offers, shortest first.
     The longest one decides how big a window she has to keep clear. */
  var DURATIONS = {};
  DATA.stylists.forEach(function (st) {
    var seen = {};
    DATA.services.forEach(function (sv) {
      if (sv.stylists.indexOf(st.id) > -1) seen[sv.duration] = 1;
    });
    DURATIONS[st.id] = Object.keys(seen).map(Number).sort(function (a, b) { return a - b; });
  });

  function cellsFor(minutes) { return Math.ceil(minutes / 30); }
  function dayCells(dow) { var h = HOURS[dow]; return (h[1] - h[0]) / 30; }

  /* Every 30 minutes from opening, keeping only starts that finish by
     closing. No cap: an 18-slot cap silently truncated Thursday, the only
     10-hour day. 24 is a guard, not a limit. */
  function startTimes(dateISO, duration) {
    var hours = HOURS[dateOf(dateISO).getDay()];
    if (!hours) return [];
    var out = [];
    for (var t = hours[0]; t + duration <= hours[1] && out.length < 24; t += 30) {
      out.push(timeOf(t));
    }
    return out;
  }
  function lastStartIndex(dow, duration) {
    var h = HOURS[dow], last = -1;
    for (var t = h[0]; t + duration <= h[1]; t += 30) last = (t - h[0]) / 30;
    return last;
  }

  /* ---- the diary ----
     ONE occupancy array per stylist per day, hashed on the date and the
     stylist and nothing else. Availability for a service is a sliding window
     over it; "no preference" is the union across eligible stylists. Every
     engine guarantee falls out of that by construction, not by tuning.
     Asserted by tools/sweep.js. */

  /* Appointment lengths in cells, drawn from what each stylist actually does,
     so a colour director's day is built out of long blocks and a barber's out
     of half hours. NEW-6: one shared length table made all four days look the
     same shape. */
  var LEN_POOL = {};
  DATA.stylists.forEach(function (st) {
    /* One entry per service she offers, not per distinct duration, so the
       mix is weighted the way her price list is: plenty of cuts and add-ons,
       the occasional half day of colour. */
    LEN_POOL[st.id] = DATA.services
      .filter(function (sv) { return sv.stylists.indexOf(st.id) > -1; })
      .map(function (sv) { return cellsFor(sv.duration); });
  });

  /* How full each chair runs, relative to the day's baseline. Callum turns a
     gents cut round in half an hour so his day is busier and choppier;
     Sophie's is the quietest. */
  var CHAIR_LOAD = { nicola: 8, erin: 2, callum: 16, sophie: -6 };

  var STYLIST_ORDER = {};
  DATA.stylists.forEach(function (st, i) { STYLIST_ORDER[st.id] = i; });

  function longestCellsFor(stylistId) {
    var d = DURATIONS[stylistId];
    return cellsFor(d[d.length - 1]);
  }
  var MAX_LONG = (function () {
    var m = 0;
    DATA.stylists.forEach(function (st) { m = Math.max(m, longestCellsFor(st.id)); });
    return m;
  })();

  /* Two cells a day when the whole salon is committed. Chosen first, only
     from positions leaving room for the longest protected window on one
     side. This is what guarantees floor rule 2. */
  function salonBusy(dateISO, dow) {
    var n = dayCells(dow), cands = [], p;
    for (p = 1; p + 1 <= n - 1; p++) {
      /* a gap of MAX_LONG + 2 must still fit before or after it */
      if (p >= MAX_LONG + 2 || p <= n - MAX_LONG - 4) cands.push(p);
    }
    if (!cands.length) return [];
    p = cands[hash32(dateISO + '|busy') % cands.length];
    return [p, p + 1];
  }

  /* The window each stylist keeps clear for her longest booking. Position is
     drawn from every place it could legally sit, so one stylist's clear
     window can be the morning and another's the afternoon — which is what
     stops two diaries reading as the same person. */
  function gapFor(dateISO, stylistId, dow) {
    var n = dayCells(dow), L = longestCellsFor(stylistId);
    var last = lastStartIndex(dow, DURATIONS[stylistId][DURATIONS[stylistId].length - 1]);
    if (last < 2) return { g: 0, G: 0 };
    /* Exactly L + 2, the minimum yielding three valid starts. Varying it
       makes the candidate list differ between two stylists with the same
       longest service, defeating the spread below. */
    var G = L + 2;
    var pair = salonBusy(dateISO, dow), cands = [], g, i, clash;
    for (g = 0; g <= last - 2 && g + G <= n; g++) {
      clash = false;
      for (i = 0; i < pair.length; i++) if (pair[i] >= g && pair[i] < g + G) clash = true;
      if (!clash) cands.push(g);
    }
    if (!cands.length) return { g: 0, G: 0 };
    /* Spread the four windows rather than drawing each independently:
       Rhona and Erin top out at the same booking length, so independent
       draws stack them and their diaries read as one person. */
    var seat = STYLIST_ORDER[stylistId] || 0;
    var stride = Math.max(1, Math.round(cands.length / DATA.stylists.length));
    /* No jitter: a short range makes the stride one cell, and any jitter
       puts two stylists back on the same position. */
    var idx = (hash32(dateISO + '|gapbase') % cands.length) + seat * stride;
    return { g: cands[idx % cands.length], G: G };
  }

  /* A second, one-cell pocket elsewhere in the day: makes a diary read as
     two or three pockets rather than one window, and stops two stylists whose
     booked stretch fills solid producing identical days. */
  function pocketFor(dateISO, stylistId, dow, gp) {
    var n = dayCells(dow), pair = salonBusy(dateISO, dow), cands = [], p, i, clash;
    for (p = 1; p < n - 1; p++) {
      if (gp.G && p >= gp.g - 1 && p <= gp.g + gp.G) continue;   /* not beside the window */
      clash = false;
      for (i = 0; i < pair.length; i++) if (Math.abs(pair[i] - p) < 2) clash = true;
      if (!clash) cands.push(p);
    }
    if (!cands.length) return -1;
    var seat = STYLIST_ORDER[stylistId] || 0;
    var stride = Math.max(1, Math.round(cands.length / DATA.stylists.length));
    return cands[(hash32(dateISO + '|pk') % cands.length + seat * stride) % cands.length];
  }

  function buildDiary(dateISO, stylistId, dow, density) {
    var n = dayCells(dow), gp = gapFor(dateISO, stylistId, dow);
    var pocket = pocketFor(dateISO, stylistId, dow, gp);
    var pool = LEN_POOL[stylistId];
    /* How often she leaves a half hour between appointments varies by the
       day. It is the cheapest entropy available: it only ever moves single
       idle cells, so it changes the shape of the day without changing how
       much of it is bookable. */
    var breakRate = 2 + hash32(dateISO + '|br|' + stylistId) % 3;
    var busy = new Array(n), i, j;
    for (i = 0; i < n; i++) busy[i] = false;

    var pair = salonBusy(dateISO, dow);
    for (i = 0; i < pair.length; i++) if (pair[i] < n) busy[pair[i]] = true;

    /* Her own appointments, seeded with nothing shared — anything common to
       all four gives them the same busy skeleton. */
    i = 0;
    while (i < n) {
      if (gp.G && i >= gp.g && i < gp.g + gp.G) { i = gp.g + gp.G; continue; }
      if (i === pocket) { i += 1; continue; }
      var h = hash32(dateISO + '|' + stylistId + '|' + i);
      if (h % 100 < density) {
        var len = pool[(h >>> 8) % pool.length];
        var end = Math.min(n, i + len);
        if (gp.G && i < gp.g) end = Math.min(end, gp.g);   /* never spill in */
        if (pocket > i && pocket < end) end = pocket;      /* nor over the pocket */
        for (j = i; j < end; j++) busy[j] = true;
        i = Math.max(end, i + 1);
        /* A half hour between appointments. Skipping the cell rather than
           testing it forces it idle: shape without a bookable hour. */
        if (((h >>> 20) % 5) < breakRate) i += 1;
      } else {
        i += 1;
      }
    }
    return busy;
  }

  function freeStartsIn(busy, dow, duration) {
    var k = cellsFor(duration), last = lastStartIndex(dow, duration), out = [];
    for (var c = 0; c <= last; c++) {
      var ok = true;
      for (var j = c; j < c + k; j++) if (busy[j]) { ok = false; break; }
      out.push(ok);
    }
    return out;
  }

  /* Density is chosen per stylist-day and never per query, which is the
     point: her day must look the same whoever is asking and whatever they
     are asking for. */
  function densityOrder(base) {
    var order = [base], d;
    for (var step = 4; step <= 92; step += 4) {
      d = base + step; if (d <= 88) order.push(d);
      d = base - step; if (d >= 0) order.push(d);
    }
    return order;
  }

  var diaryCache = {};
  var lookingBack = false;

  function diaryFor(dateISO, stylistId) {
    var key = dateISO + '|' + stylistId;
    if (diaryCache[key]) return diaryCache[key];
    var dow = dateOf(dateISO).getDay();
    /* A few points either way per stylist per day, so two dates with the
       same window position do not produce the same fill. */
    var nudge = (hash32(dateISO + '|dens|' + stylistId) % 5 - 2) * 4;
    var order = densityOrder(LOAD[dow] + (CHAIR_LOAD[stylistId] || 0) + nudge);
    var fallback = null, chosen = null;

    /* Days already decided, so a coincidence can be nudged rather than
       shipped: the other chairs today, and this chair's own recent days.
       Nothing here can recurse — lower seats only, and the lookback is
       depth-limited to one. */
    var seat = STYLIST_ORDER[stylistId] || 0, taken = [], t;
    for (t = 0; t < seat; t++) taken.push(diaryFor(dateISO, DATA.stylists[t].id).join(''));
    if (!lookingBack) {
      lookingBack = true;
      var d0 = dateOf(dateISO), seen = 0;
      for (t = 1; t <= 22 && seen < 11; t++) {
        var prev = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate() - t);
        if (!HOURS[prev.getDay()]) continue;
        seen++;
        taken.push(diaryFor(isoOf(prev), stylistId).join(''));
      }
      lookingBack = false;
    }

    for (var i = 0; i < order.length && !chosen; i++) {
      var busy = buildDiary(dateISO, stylistId, dow, order[i]);
      var ok1 = true, ok2 = true, ok3 = taken.indexOf(busy.join('')) < 0;
      var durs = DURATIONS[stylistId];
      for (var d = 0; d < durs.length; d++) {
        var free = freeStartsIn(busy, dow, durs[d]);
        var n = free.length, f = 0;
        for (var x = 0; x < n; x++) if (free[x]) f++;
        if (f < 3) ok1 = false;
        if (n > 4 && n - f < 2) ok2 = false;
      }
      if (ok1 && !fallback) fallback = busy;
      if (ok1 && ok2 && ok3) chosen = busy;
    }
    return (diaryCache[key] = chosen || fallback ||
      buildDiary(dateISO, stylistId, dow, 0));
  }

  /* Returns [{ time, free, stylistId }] for one day.
     Empty array = closed, or nobody can do that service. */
  function slotsFor(dateISO, stylistId, serviceId) {
    var svc = SERVICE_BY_ID[serviceId];
    if (!svc) return [];
    var dow = dateOf(dateISO).getDay();
    if (!HOURS[dow]) return [];
    var times = startTimes(dateISO, svc.duration);
    if (!times.length) return [];
    var pool = poolFor(svc, stylistId);
    if (!pool.length) return [];

    var per = pool.map(function (id) {
      return freeStartsIn(diaryFor(dateISO, id), dow, svc.duration);
    });

    return times.map(function (hhmm, i) {
      var free = false, who = null, best = -1, anyWho = null, anyMax = -1;
      for (var k = 0; k < pool.length; k++) {
        var h = hash32(dateISO + '|' + pool[k] + '|' + hhmm + '|' + serviceId);
        if (h > anyMax) { anyMax = h; anyWho = pool[k]; }
        if (per[k][i]) {
          free = true;
          if (h > best) { best = h; who = pool[k]; }
        }
      }
      return { time: hhmm, free: free, stylistId: free ? who : anyWho };
    });
  }

  function freeCountFor(dateISO, stylistId, serviceId) {
    var n = 0, s = slotsFor(dateISO, stylistId, serviceId);
    for (var i = 0; i < s.length; i++) if (s[i].free) n++;
    return n;
  }

  /* The next 12 calendar days, starting tomorrow. Never today: if Logan
     demos at 16:45 on a Saturday, "today" would show zero slots and the
     whole thing would look broken. */
  function dayList(fromDate) {
    var base = fromDate || new Date();
    var days = [];
    for (var i = 1; i <= 12; i++) {
      var d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
      days.push({ iso: isoOf(d), dow: d.getDay(), open: !!HOURS[d.getDay()] });
    }
    return days;
  }

  /* First bookable slot across the next 12 days — powers the hero strip. */
  function nextAvailable(serviceId, stylistId, fromDate) {
    var days = dayList(fromDate);
    for (var i = 0; i < days.length; i++) {
      if (!days[i].open) continue;
      var s = slotsFor(days[i].iso, stylistId, serviceId);
      for (var j = 0; j < s.length; j++) {
        if (s[j].free) return { iso: days[i].iso, time: s[j].time, stylistId: s[j].stylistId };
      }
    }
    return null;
  }

  /* Exposed so the acceptance tests in tools/ can run the identical
     functions under Node and compare them with the browser console. */
  window.BW = {
    DATA: DATA, hash32: hash32, slotsFor: slotsFor, dayList: dayList,
    freeCountFor: freeCountFor, nextAvailable: nextAvailable,
    priceText: priceText, durationText: durationText,
    diaryFor: diaryFor, startTimes: startTimes, durationsFor: function (id) { return DURATIONS[id]; }
  };

  /* ==================================================================
     2. nav — mobile menu
     ================================================================== */
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('nav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
        toggle.focus();
      }
    });
  }

  /* ==================================================================
     3. reveal — staggered scroll reveal, off under reduced motion
     ================================================================== */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealables = document.querySelectorAll('[data-reveal]');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var siblings = [].slice.call(entry.target.parentElement.children)
          .filter(function (c) { return c.hasAttribute('data-reveal'); });
        var i = Math.max(0, siblings.indexOf(entry.target));
        entry.target.style.transitionDelay = Math.min(i * 80, 320) + 'ms';
        entry.target.classList.add('in');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ==================================================================
     4. booking — the request flow.
     State lives in memory only. Never written to storage, never put in
     the URL, never sent anywhere. Refreshing the page resets it, which
     is deliberate: a half-restored form looks broken, a clean step 1
     does not.
     ================================================================== */
  try {
    var app = document.getElementById('bookingApp');
    if (app) {

      var state = {
        step: 1, serviceId: null, stylistId: null, dateISO: null, time: null,
        name: '', phone: '', notes: '', ref: null, preferred: null,
        errors: []             /* [[field, message]] — lives in state so a
                                  re-render cannot silently drop it */
      };

      var submitting = false;  /* duplicate-submit guard */
      var started = false;     /* booking_start fires once */
      var lastTrackedStep = 0; /* so a re-render does not double-count a step */
      var restored = false;    /* M7: this session was rebuilt from storage */
      var dropped = null;      /* 'day' or 'time' if one had to be discarded */

      /* Transition guard, two independent rules, neither of which can wedge.
         1. PANEL AGE. A control that has existed for less than READY_MS
            cannot have been read, so a tap on it is the second half of a
            double tap, not a choice. This expires on its own and does not
            care about the user's cadence — the earlier "any two inputs
            inside 520 ms" rule refused a sustained fast tapper for ever,
            because each refused tap reset its own timer.
         2. SAME SPOT. A rage-burst lands on one point; two real choices do
            not. Position for a pointer, element identity for a keyboard.
         Refused input never updates the accepted record, so the guard always
         lets go. Never silent: see markBusy/refuse. */
      var READY_MS = 360;    /* how long a freshly painted panel stays inert */
      var GUARD_MS = 520;    /* same-spot repeat window */
      var GUARD_PX = 16;     /* a thumb that has not moved at all */
      var settleUntil = 0;   /* = panelPaintedAt + READY_MS */
      var acceptedAt = 0, acceptedX = null, acceptedY = null, acceptedKey = null;
      var inputRefused = false;
      /* Reverse controls (Back, the summary chips) are never the fast path,
         and a FORWARD selection re-renders the panel, which can slide one of
         them under a thumb that is still tapping. So a reverse control is
         refused only in the window after a forward selection — never after
         another reverse one, so Back twice in a row still works. */
      var forwardAt = 0;
      /* A burst refused at one spot keeps this alive, so a long burst can
         never outlast the guard and land on Back. It is deliberately NOT
         used for forward controls: there it would refuse a determined
         tapper for ever, which was the wedge the Manager caught. */
      var spotAt = 0;
      function reverseBlocked() {
        var now = monoNow();
        return (!!forwardAt && (now - forwardAt) < GUARD_MS) ||
               (!!spotAt && (now - spotAt) < GUARD_MS);
      }

      /* Monotonic: a wall-clock jump backwards (DST, a device correction)
         would otherwise wedge the guard into refusing input for ever. */
      var monoNow = (window.performance && window.performance.now)
        ? function () { return window.performance.now(); }
        : function () { return Date.now(); };
      var advanceTimer = null, busyTimer = null, pulseTimer = null;
      var announcedBusy = false;

      /* Keep an unfinished request across a page load. Everything saved is
         re-validated against today's availability before it is trusted, and a
         submitted request is never resurrected. Reverses PLAN's "refresh
         resets"; see BUILD-LOG. */
      var STORE_KEY = 'bw-flow-v1';

      function storage() {
        /* Safari treats file:// as an opaque origin and throws on access. */
        try { return window.sessionStorage; } catch (e) { return null; }
      }
      function forgetState() {
        var st = storage();
        if (!st) return;
        try { st.removeItem(STORE_KEY); } catch (e) { /* nothing we can do */ }
      }
      function saveState() {
        var st = storage();
        if (!st) return;
        try {
          if (state.step > 5 || (!state.serviceId && !state.name && !state.phone)) {
            st.removeItem(STORE_KEY);
            return;
          }
          st.setItem(STORE_KEY, JSON.stringify({
            step: state.step, serviceId: state.serviceId, stylistId: state.stylistId,
            dateISO: state.dateISO, time: state.time, name: state.name,
            phone: state.phone, notes: state.notes, preferred: state.preferred
          }));
        } catch (e) { /* quota or opaque origin — persistence is a bonus */ }
      }

      /* Rebuild, dropping anything that no longer holds and falling back to
         the deepest step that still makes sense. */
      function restoreState() {
        var st = storage();
        if (!st) return false;
        var raw;
        try { raw = st.getItem(STORE_KEY); } catch (e) { return false; }
        if (!raw) return false;
        var o;
        try { o = JSON.parse(raw); } catch (e) { forgetState(); return false; }
        if (!o || typeof o !== 'object') { forgetState(); return false; }

        var svc = SERVICE_BY_ID[o.serviceId];
        if (!svc) { forgetState(); return false; }
        state.serviceId = svc.id;
        state.preferred = STYLIST_BY_ID[o.preferred] ? o.preferred : null;
        state.name = typeof o.name === 'string' ? o.name.slice(0, 120) : '';
        state.phone = typeof o.phone === 'string' ? o.phone.slice(0, 40) : '';
        state.notes = typeof o.notes === 'string' ? o.notes.slice(0, 600) : '';
        var deepest = 2;

        var okStylist = o.stylistId === 'any' ||
          (STYLIST_BY_ID[o.stylistId] && svc.stylists.indexOf(o.stylistId) > -1);
        if (okStylist) {
          state.stylistId = o.stylistId;
          deepest = 3;
          var days = dayList();
          var stillOffered = false;
          for (var i = 0; i < days.length; i++) {
            if (days[i].iso === o.dateISO && days[i].open) { stillOffered = true; break; }
          }
          if (stillOffered && freeCountFor(o.dateISO, state.stylistId, svc.id) > 0) {
            state.dateISO = o.dateISO;
            deepest = 4;
            var slots = slotsFor(o.dateISO, state.stylistId, svc.id);
            for (var j = 0; j < slots.length; j++) {
              if (slots[j].time === o.time && slots[j].free) { state.time = o.time; deepest = 5; break; }
            }
          }
        }
        state.step = Math.min(Math.max(1, o.step | 0) || deepest, deepest);
        restored = (state.step >= 2);
        /* Say what actually went, and nothing when nothing did. */
        dropped = (o.dateISO && !state.dateISO) ? 'day'
                : (o.time && !state.time) ? 'time' : null;
        return restored;
      }

      function busy() {
        return (monoNow() < settleUntil) || inputRefused;
      }
      function busyUntil() {
        return Math.max(settleUntil, acceptedAt ? acceptedAt + GUARD_MS : 0);
      }
      /* Only inputs that could move the flow are guarded; opening a category
         or typing is not a step. */
      function countsAsStepInput(t) {
        if (!t || !t.closest) return true;          /* panel inert: target is the card */
        if (t.closest('summary')) return false;     /* opening a category */
        if (t.closest('input, textarea, select')) return false;
        return true;
      }
      /* Runs on pointerdown/keydown in the capture phase, so the decision is
         made before the click it produces reaches any handler. */
      function noteInput(e) {
        if (e && !countsAsStepInput(e.target)) return;
        var now = monoNow();
        var isPointer = !!(e && e.type === 'pointerdown');
        var x = isPointer && typeof e.clientX === 'number' ? e.clientX : null;
        var y = isPointer && typeof e.clientY === 'number' ? e.clientY : null;
        var key = (!isPointer && e && e.target) ? e.target : null;

        var repeat = false;
        if (acceptedAt && (now - acceptedAt) < GUARD_MS) {
          if (isPointer && x !== null && acceptedX !== null) {
            /* Same thumb, same pixel: a double tap, or a burst. Tap targets
               are 44 px apart, so this cannot catch two real choices. */
            repeat = Math.abs(x - acceptedX) <= GUARD_PX &&
                     Math.abs(y - acceptedY) <= GUARD_PX;
          } else if (!isPointer && key) {
            repeat = (key === acceptedKey);
          }
        }
        if (repeat) spotAt = now;   /* holds the reverse-control guard open */
        inputRefused = repeat || (now < settleUntil);
        if (inputRefused) return;   /* a refused input must not reset the clock */
        acceptedAt = now;
        /* spotAt is deliberately NOT cleared here: the tap that finally gets
           through after a burst is the dangerous one, and clearing it would
           unblock Back at exactly that moment. It expires on its own. */
        acceptedX = x; acceptedY = y; acceptedKey = key;
      }

      var STEP_SAY = {
        1: 'Step 1 of 5. Choose a service.',
        2: 'Step 2 of 5. Choose a stylist.',
        3: 'Step 3 of 5. Choose a day.',
        4: 'Step 4 of 5. Choose a time.',
        5: 'Step 5 of 5. Your name and mobile number.'
      };

      /* ---- tiny DOM helpers ---- */
      function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null) n.textContent = text;   /* textContent, never innerHTML */
        return n;
      }
      function btn(cls, label) {
        var b = el('button', cls);
        b.type = 'button';
        if (label != null) b.textContent = label;
        return b;
      }
      /* Static, developer-authored markup only. No user input ever reaches this. */
      function svg(markup) {
        var wrap = el('span', 'bw-ico');
        wrap.innerHTML = markup;
        wrap.setAttribute('aria-hidden', 'true');
        return wrap;
      }
      var TICK = '<svg viewBox="0 0 52 52" width="46" height="46" focusable="false">' +
        '<circle class="tick-ring" cx="26" cy="26" r="24"/>' +
        '<path class="tick-path" d="M15 27l8 8 15-16"/></svg>';

      /* ---- shell ---- */
      var live = el('p', 'visually-hidden');
      live.id = 'bwLive';
      live.setAttribute('role', 'status');
      live.setAttribute('aria-live', 'polite');

      var stepNo = el('p', 'bw-stepno');
      var settleTag = el('span', 'bw-settling', 'one moment');
      settleTag.setAttribute('aria-hidden', 'true');
      var chips = el('ul', 'bw-chips');
      chips.setAttribute('aria-label', 'Your choices so far');

      var panel = el('div', 'bw-panel');
      var form = el('form', 'bw-form');
      form.noValidate = true;
      form.appendChild(panel);

      /* N1: the card already carries an <h3>Request an appointment</h3>, so
         the widget does not repeat it. The step counter carries the state. */
      var head = el('div', 'bw-top');
      var headRow = el('div', 'bw-top-row');
      headRow.appendChild(stepNo);
      headRow.appendChild(settleTag);
      head.appendChild(headRow);
      head.appendChild(chips);

      var shell = document.createDocumentFragment();
      shell.appendChild(head);
      shell.appendChild(live);
      shell.appendChild(form);

      app.textContent = '';
      app.appendChild(shell);

      /* Capture phase, so the burst rule sees taps that never reach a
         control. */
      app.addEventListener('pointerdown', noteInput, true);
      app.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') noteInput(e);
      }, true);

      /* The panel is inert while it settles, so a stray tap lands here
         instead of vanishing. Acknowledge it. */
      app.addEventListener('click', function (e) {
        if (busy() && !panel.contains(e.target)) refuse();
        /* The refusal belongs to this click only, so it can never outlive it
           and block a programmatic or synthetic click that follows. */
        window.setTimeout(function () { inputRefused = false; }, 0);
      });
      app.addEventListener('keydown', function (e) {
        if (!busy()) return;
        if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
        var t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
        e.preventDefault();
        refuse();
      });

      function say(msg) { live.textContent = msg; }

      /* The band of the viewport behind neither the sticky header nor
         whichever bar is pinned to the bottom. */
      function clearBand() {
        var hdr = document.querySelector('.site-header');
        var top = (hdr ? hdr.getBoundingClientRect().height : 0) + 8;
        var barPx = parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue('--bottom-bar')) || 0;
        return { top: top, bottom: window.innerHeight - barPx - 8 };
      }

      function scrollStepIntoView() {
        var band = clearBand();
        var headRect = head.getBoundingClientRect();
        var stickyH = headRect.height;
        var delta = headRect.top - band.top;          /* default: top of the step */

        /* The grid is what has to end up in the clear band; the progress
           row is sticky, so pushing past it does not lose it. */
        var grid = panel.querySelector('.bw-times, .bw-days');
        if (grid) {
          var g = grid.getBoundingClientRect();
          var roomTop = band.top + stickyH;
          if (g.height <= band.bottom - roomTop) {
            delta = g.bottom - band.bottom;            /* show all of it */
            if (g.top - delta < roomTop) delta = g.top - roomTop;
          } else {
            delta = g.top - roomTop;                   /* taller than the band */
          }
        }
        if (Math.abs(delta) > 1) window.scrollBy(0, delta);
      }

      function track(name, props) { window.twsTrack(name, props); }

      /* ---- transitions ---- */
      function cancelAdvance() {
        if (advanceTimer) { window.clearTimeout(advanceTimer); advanceTimer = null; }
      }

      function clearBusy() {
        app.classList.remove('is-settling');
        panel.style.pointerEvents = '';
        panel.removeAttribute('aria-busy');
        announcedBusy = false;
      }
      function markBusy() {
        app.classList.add('is-settling');
        panel.style.pointerEvents = 'none';
        panel.setAttribute('aria-busy', 'true');
        window.clearTimeout(busyTimer);
        busyTimer = window.setTimeout(clearBusy, Math.max(0, busyUntil() - monoNow()) + 20);
      }
      /* Called when a new panel is painted: it is inert until it is old
         enough to have been read. */
      function startSettle(fromPaint) {
        settleUntil = monoNow() + (fromPaint ? READY_MS : 180);
        markBusy();
      }
      /* A refused tap has to be visible. */
      function refuse() {
        app.classList.add('is-refused');
        window.clearTimeout(pulseTimer);
        pulseTimer = window.setTimeout(function () {
          app.classList.remove('is-refused');
        }, 320);
        markBusy();
        if (!announcedBusy) {
          announcedBusy = true;
          say('One moment — still loading the next step.');
        }
      }

      function goto(step, opts) {
        cancelAdvance();
        state.step = step;
        render(opts || {});
      }

      /* Auto-advance: 180 ms of highlight so the tap registers visually,
         then move on. Steps 1-4 only, so this can never steal focus from
         a text field. */
      function advance(step, source) {
        if (busy()) { refuse(); return; }
        forwardAt = monoNow();
        startSettle();
        if (source) source.classList.add('is-picked');
        cancelAdvance();
        advanceTimer = window.setTimeout(function () {
          advanceTimer = null;
          goto(step, { announce: true, focus: true, scroll: true });
          startSettle(true);   /* the new panel is painted but not yet old
                                  enough to have been read */
        }, 180);
      }

      function reset(keepPreferred) {
        state.step = 1; state.serviceId = null; state.stylistId = null;
        state.dateISO = null; state.time = null;
        state.name = ''; state.phone = ''; state.notes = ''; state.ref = null;
        if (!keepPreferred) state.preferred = null;
        state.errors = [];
        submitting = false;
        lastTrackedStep = 0;
        cancelAdvance();
        window.clearTimeout(busyTimer);
        window.clearTimeout(pulseTimer);
        settleUntil = 0; acceptedAt = 0; forwardAt = 0; spotAt = 0;
        acceptedX = acceptedY = acceptedKey = null;
        inputRefused = false;
        app.classList.remove('is-refused');
        restored = false; dropped = null;
        clearBusy();
        forgetState();
      }

      /* Changing an earlier answer clears everything after it. */
      function clearFrom(step) {
        if (step <= 1) { state.serviceId = null; }
        if (step <= 2) { state.stylistId = null; }
        if (step <= 3) { state.dateISO = null; }
        if (step <= 4) { state.time = null; }
        state.ref = null;
        state.errors = [];
      }

      /* ---- summary chips ---- */
      function renderChips() {
        chips.textContent = '';
        if (state.step > 5) { chips.hidden = true; return; }
        chips.hidden = false;
        var items = [];
        if (state.serviceId) {
          var s = SERVICE_BY_ID[state.serviceId];
          items.push({
            step: 1, label: s.name + ' · ' + priceText(s) + ' · ' + durationText(s.duration),
            say: 'Change service, currently ' + s.name
          });
        }
        if (state.stylistId) {
          items.push({
            step: 2,
            label: state.stylistId === 'any' ? 'No preference' : STYLIST_BY_ID[state.stylistId].first,
            say: 'Change stylist, currently ' +
                 (state.stylistId === 'any' ? 'no preference' : STYLIST_BY_ID[state.stylistId].name)
          });
        }
        if (state.dateISO) {
          items.push({ step: 3, label: dateShort(state.dateISO), say: 'Change day, currently ' + dateLong(state.dateISO) });
        }
        if (state.time) {
          items.push({ step: 4, label: state.time, say: 'Change time, currently ' + state.time });
        }
        if (!items.length) { chips.hidden = true; return; }
        items.forEach(function (it) {
          var li = el('li');
          var b = btn('bw-chip', it.label);
          b.setAttribute('aria-label', it.say);
          b.addEventListener('click', function () {
            if (busy() || reverseBlocked()) { refuse(); return; }   /* M1: chips were unguarded */
            clearFrom(it.step);
            goto(it.step, { announce: true, focus: true, scroll: true });
          });
          li.appendChild(b);
          chips.appendChild(li);
        });
      }

      /* ---- shared bits ---- */
      function legendFor(text) {
        var lg = el('legend', 'bw-legend');
        var span = el('span', 'bw-legend-text', text);
        span.tabIndex = -1;
        lg.appendChild(span);
        return lg;
      }
      function backBtn(toStep) {
        var b = btn('bw-back');
        b.appendChild(svg('<svg viewBox="0 0 16 16" width="13" height="13" focusable="false"><path d="M10 2L4 8l6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'));
        b.appendChild(document.createTextNode('Back'));
        b.addEventListener('click', function () {
          if (busy() || reverseBlocked()) { refuse(); return; }  /* M1: Back was unguarded, so a
                                               Back tapped 40 ms after a
                                               selection landed on step 5 */
          goto(toStep, { announce: true, focus: true, scroll: true });
        });
        return b;
      }
      function skinTestNote() {
        var p = el('p', 'bw-note bw-note-skin',
          'Colour appointment: if you have not had colour with us before, we need to do a free skin test at least 48 hours beforehand. It takes five minutes — pop in any time we are open.');
        return p;
      }
      function isColour(id) { var s = SERVICE_BY_ID[id]; return !!(s && s.colour); }
      function needsDeposit(id) { var s = SERVICE_BY_ID[id]; return !!(s && s.colour && s.duration > 120); }

      /* ---- step 1: service ---- */
      /* Tell the visitor, rather than silently re-filling a form. */
      function restoredNote(fs) {
        if (!restored) return;
        var p = el('p', 'bw-note bw-note-kept');
        p.appendChild(document.createTextNode(
          dropped === 'time' ? 'We kept what you had started. That time has gone since, so please pick another.'
          : dropped === 'day' ? 'We kept what you had started. That day is no longer on the list, so please pick another.'
          : 'We kept what you had started.'));
        var again = btn('bw-linkish', 'Start again');
        again.addEventListener('click', function () {
          if (busy()) { refuse(); return; }
          reset();
          started = false;
          goto(1, { announce: true, focus: true, scroll: true });
        });
        p.appendChild(document.createTextNode(' '));
        p.appendChild(again);
        fs.appendChild(p);
      }

      function renderService(root) {
        var fs = el('fieldset', 'bw-step');
        fs.appendChild(legendFor('Choose a service'));
        restoredNote(fs);

        var filter = state.preferred;
        if (filter) {
          var who = STYLIST_BY_ID[filter];
          var note = el('p', 'bw-note');
          note.appendChild(document.createTextNode('Showing what ' + who.first + ' does. '));
          var all = btn('bw-linkish', 'Show every service');
          all.addEventListener('click', function () {
            state.preferred = null;
            goto(1, { focus: true });
          });
          note.appendChild(all);
          fs.appendChild(note);
        }

        /* 25 services in one list is 2,000px of thumb-scrolling on a phone.
           One category open at a time keeps step 1 to about a screen and a
           half. Native <details>, so keyboard and AT get it free. */
        var shown = 0;
        var listFor = function (cat) {
          return DATA.services.filter(function (s) {
            return s.cat === cat.id && (!filter || s.stylists.indexOf(filter) > -1);
          });
        };
        /* Which group opens: the one holding the chosen service; else the
           filtered stylist's biggest group (Callum's work is nearly all
           Gents); else the first. */
        var openCat = null;
        if (state.serviceId && (!filter || SERVICE_BY_ID[state.serviceId].stylists.indexOf(filter) > -1)) {
          openCat = SERVICE_BY_ID[state.serviceId].cat;
        } else if (filter) {
          var best = -1;
          DATA.categories.forEach(function (c) {
            var n = listFor(c).length;
            if (n > best) { best = n; openCat = c.id; }
          });
        } else {
          for (var ci = 0; ci < DATA.categories.length && !openCat; ci++) {
            if (listFor(DATA.categories[ci]).length) openCat = DATA.categories[ci].id;
          }
        }
        DATA.categories.forEach(function (cat) {
          var list = listFor(cat);
          if (!list.length) return;
          var grp = el('details', 'bw-group');
          if (cat.id === openCat) grp.open = true;
          var sum = el('summary');
          sum.appendChild(el('span', 'bw-cat', cat.name));
          sum.appendChild(el('span', 'bw-cat-count', list.length + ' service' + (list.length === 1 ? '' : 's')));
          grp.appendChild(sum);
          /* One open at a time — otherwise it is no shorter than the flat list. */
          grp.addEventListener('toggle', function () {
            if (!grp.open) return;
            panel.querySelectorAll('.bw-group').forEach(function (o) { if (o !== grp) o.open = false; });
          });
          fs.appendChild(grp);
          var wrap = el('div', 'bw-list');
          list.forEach(function (s) {
            shown++;
            var b = btn('bw-opt' + (state.serviceId === s.id ? ' is-on' : ''));
            b.setAttribute('aria-pressed', state.serviceId === s.id ? 'true' : 'false');
            b.setAttribute('aria-label', s.name + ', ' + durationSpoken(s.duration) + ', ' +
              (s.price === 0 ? 'free' : (s.from ? 'from ' : '') + s.price + ' pounds'));
            var nm = el('span', 'bw-opt-name', s.name);
            var mt = el('span', 'bw-opt-meta', durationText(s.duration));
            var pr = el('span', 'bw-opt-price', priceText(s));
            b.appendChild(nm); b.appendChild(mt); b.appendChild(pr);
            b.addEventListener('click', function () {
              if (busy()) { refuse(); return; }
              if (!started) { started = true; track('booking_start', {}); }
              clearFrom(1);
              state.serviceId = s.id;
              /* Honour a "Book with X" preselection, but the visitor still
                 confirms it on step 2 — nothing is chosen behind their back. */
              if (state.preferred && s.stylists.indexOf(state.preferred) > -1) {
                state.stylistId = state.preferred;
              }
              advance(2, b);
            });
            wrap.appendChild(b);
          });
          grp.appendChild(wrap);
        });

        if (!shown) fs.appendChild(el('p', 'bw-note', 'No services to show.'));
        root.appendChild(fs);
      }

      /* ---- step 2: stylist ---- */
      function renderStylist(root) {
        var svc = SERVICE_BY_ID[state.serviceId];
        var fs = el('fieldset', 'bw-step');
        fs.appendChild(legendFor('Choose a stylist'));
        restoredNote(fs);

        if (state.stylistId) {
          fs.appendChild(el('p', 'bw-note',
            (state.stylistId === 'any' ? 'No preference' : STYLIST_BY_ID[state.stylistId].first) +
            ' is selected. Tap to carry on, or pick someone else.'));
        } else {
          fs.appendChild(el('p', 'bw-note', 'Pick a person, or let us match you with whoever is free.'));
        }

        var wrap = el('div', 'bw-list');
        var opts = [{ id: 'any', name: 'No preference', role: 'Whoever is free first — most choice of times' }];
        svc.stylists.forEach(function (id) {
          var st = STYLIST_BY_ID[id];
          opts.push({ id: id, name: st.name, role: st.role });
        });

        opts.forEach(function (o) {
          var b = btn('bw-opt bw-opt-person' + (state.stylistId === o.id ? ' is-on' : ''));
          b.setAttribute('aria-pressed', state.stylistId === o.id ? 'true' : 'false');
          if (o.id === 'any') {
            b.appendChild(svg('<svg viewBox="0 0 40 40" width="34" height="34" focusable="false"><circle cx="20" cy="20" r="19" class="mono-disc"/><path d="M13 24c0-4 3-6 7-6s7 2 7 6" fill="none" stroke="currentColor" stroke-width="1.6" class="mono-any"/><circle cx="20" cy="15" r="4" fill="none" stroke="currentColor" stroke-width="1.6" class="mono-any"/></svg>'));
          } else {
            b.appendChild(svg('<svg viewBox="0 0 40 40" width="34" height="34" focusable="false"><circle cx="20" cy="20" r="19" class="mono-disc"/><circle cx="20" cy="20" r="17.2" class="mono-ring"/><text x="20" y="26" text-anchor="middle" class="mono-initial">' + o.name.charAt(0) + '</text></svg>'));
          }
          var col = el('span', 'bw-opt-person-text');
          col.appendChild(el('span', 'bw-opt-name', o.name));
          col.appendChild(el('span', 'bw-opt-meta', o.role));
          b.appendChild(col);
          b.addEventListener('click', function () {
            if (busy()) { refuse(); return; }
            clearFrom(2);
            state.stylistId = o.id;
            /* N5: otherwise going back to step 1 still claimed to be
               "showing what Callum does" after Sophie had been chosen. */
            state.preferred = (o.id === 'any') ? null : o.id;
            advance(3, b);
          });
          wrap.appendChild(b);
        });

        fs.appendChild(wrap);
        fs.appendChild(backBtn(1));
        root.appendChild(fs);
      }

      /* ---- step 3: day ---- */
      function renderDay(root) {
        var fs = el('fieldset', 'bw-step');
        fs.appendChild(legendFor('Choose a day'));
        restoredNote(fs);
        fs.appendChild(el('p', 'bw-note', 'We are closed Sundays and Mondays. Times shown are the next twelve days.'));

        var wrap = el('div', 'bw-days');
        dayList().forEach(function (d) {
          var b = btn('bw-day');
          b.appendChild(el('span', 'bw-day-name', DAY_SHORT[d.dow]));
          b.appendChild(el('span', 'bw-day-num', String(dateOf(d.iso).getDate())));
          b.appendChild(el('span', 'bw-day-mon', MON_SHORT[dateOf(d.iso).getMonth()]));

          if (!d.open) {
            b.disabled = true;
            b.classList.add('is-closed');
            b.appendChild(el('span', 'bw-day-tag', 'Closed'));
            b.setAttribute('aria-label', dateLong(d.iso) + ', closed');
          } else {
            var n = freeCountFor(d.iso, state.stylistId, state.serviceId);
            if (n === 0) {
              b.disabled = true;
              b.classList.add('is-closed');
              b.appendChild(el('span', 'bw-day-tag', 'Full'));
              b.setAttribute('aria-label', dateLong(d.iso) + ', fully booked');
            } else {
              if (n <= 4) {
                var pill = el('span', 'bw-day-tag is-low', n + ' left');
                b.appendChild(pill);
              }
              b.setAttribute('aria-pressed', state.dateISO === d.iso ? 'true' : 'false');
              if (state.dateISO === d.iso) b.classList.add('is-on');
              b.setAttribute('aria-label', dateLong(d.iso) + ', ' + n + ' appointment' + (n === 1 ? '' : 's') + ' available');
              b.addEventListener('click', function () {
                if (busy()) { refuse(); return; }
                clearFrom(3);
                state.dateISO = d.iso;
                advance(4, b);
              });
            }
          }
          wrap.appendChild(b);
        });

        fs.appendChild(wrap);
        fs.appendChild(backBtn(2));
        root.appendChild(fs);
      }

      /* ---- step 4: time ---- */
      function renderTime(root) {
        var svc = SERVICE_BY_ID[state.serviceId];
        var fs = el('fieldset', 'bw-step');
        fs.appendChild(legendFor('Choose a time'));
        restoredNote(fs);

        var hrs = HOURS[dateOf(state.dateISO).getDay()];
        /* One line, not three: each one pushes the grid under the bar. */
        fs.appendChild(el('p', 'bw-note bw-note-tight',
          dateShort(state.dateISO) + ' · ' + svc.name + ' · ' + durationText(svc.duration)));

        var slots = slotsFor(state.dateISO, state.stylistId, state.serviceId);
        var grid = el('div', 'bw-times');
        slots.forEach(function (s) {
          var b = btn('bw-time', s.time);
          if (!s.free) {
            b.disabled = true;
            b.classList.add('is-taken');
            b.setAttribute('aria-label', s.time + ', already booked');
          } else {
            b.setAttribute('aria-pressed', state.time === s.time ? 'true' : 'false');
            if (state.time === s.time) b.classList.add('is-on');
            b.setAttribute('aria-label', s.time + ', available' +
              (state.stylistId === 'any' ? ' with ' + STYLIST_BY_ID[s.stylistId].name : ''));
            b.addEventListener('click', function () {
              if (busy()) { refuse(); return; }
              state.time = s.time;
              advance(5, b);
            });
          }
          grid.appendChild(b);
        });
        fs.appendChild(grid);

        var legend = el('p', 'bw-legend-key');
        legend.appendChild(el('span', 'bw-key bw-key-free', 'Free'));
        legend.appendChild(el('span', 'bw-key bw-key-taken', 'Already booked'));
        fs.appendChild(legend);

        if (state.stylistId === 'any') {
          fs.appendChild(el('p', 'bw-note', 'We will match you with whoever is free — you will see who on the next screen.'));
        }
        if (isColour(state.serviceId)) fs.appendChild(skinTestNote());

        fs.appendChild(backBtn(3));
        root.appendChild(fs);
      }

      /* ---- step 5: details ---- */
      var fieldRefs = {};

      function field(name, label, type, hint, required) {
        var wrap = el('div', 'bw-field');
        var id = 'bw-' + name;
        var lab = el('label', null, label);
        lab.htmlFor = id;
        if (required) {
          var req = el('span', 'bw-req', ' (required)');
          lab.appendChild(req);
        }
        var input = el(type === 'textarea' ? 'textarea' : 'input');
        input.id = id;
        input.name = name;
        if (type !== 'textarea') input.type = type;
        if (type === 'textarea') input.rows = 3;
        input.value = state[name] || '';
        if (name === 'name') input.autocomplete = 'name';
        if (name === 'phone') { input.autocomplete = 'tel'; input.setAttribute('inputmode', 'tel'); }
        var err = el('p', 'bw-err');
        err.id = id + '-err';
        err.hidden = true;
        var hintEl = null;
        if (hint) {
          hintEl = el('p', 'bw-hint', hint);
          hintEl.id = id + '-hint';
          input.setAttribute('aria-describedby', hintEl.id);
        }
        input.addEventListener('input', function () {
          state[name] = input.value;
          saveState();
          if (input.getAttribute('aria-invalid') === 'true') {
            input.removeAttribute('aria-invalid');
            err.hidden = true; err.textContent = '';
            input.setAttribute('aria-describedby', hintEl ? hintEl.id : '');
            if (!hintEl) input.removeAttribute('aria-describedby');
            state.errors = state.errors.filter(function (e) { return e[0] !== name; });
          }
        });
        wrap.appendChild(lab);
        if (hintEl) wrap.appendChild(hintEl);
        wrap.appendChild(input);
        wrap.appendChild(err);
        fieldRefs[name] = { input: input, err: err, hint: hintEl };
        return wrap;
      }

      function renderDetails(root) {
        fieldRefs = {};
        var svc = SERVICE_BY_ID[state.serviceId];
        var fs = el('fieldset', 'bw-step');
        fs.appendChild(legendFor('Your details'));
        restoredNote(fs);
        fs.appendChild(el('p', 'bw-note', 'Two things and you are done. We text you back to confirm.'));

        fs.appendChild(field('name', 'Your name', 'text', null, true));
        fs.appendChild(field('phone', 'Mobile number', 'tel', 'So we can text you back — for example 07700 900 118.', true));
        fs.appendChild(field('notes', 'Anything we should know? (optional)', 'textarea',
          'Hair history, a photo you want to bring, or if you are running to a school run.', false));

        /* Re-apply failed validation, so a re-render never clears it. */
        for (var e = 0; e < state.errors.length; e++) {
          showError(state.errors[e][0], state.errors[e][1]);
        }

        if (isColour(state.serviceId)) fs.appendChild(skinTestNote());
        if (needsDeposit(state.serviceId)) {
          fs.appendChild(el('p', 'bw-note',
            'Colour appointments over two hours carry a £20 deposit, taken when we confirm. It comes off your bill.'));
        }

        var send = el('button', 'btn btn-primary bw-submit',
          'Send my request' + (svc ? ' · ' + priceText(svc) : ''));
        send.type = 'submit';
        fs.appendChild(send);
        fs.appendChild(el('p', 'bw-fineprint',
          'Demonstration only — nothing is sent, stored or emailed anywhere.'));
        fs.appendChild(backBtn(4));
        root.appendChild(fs);
      }

      /* ---- validation ---- */
      /* UK numbers, tolerant of spaces, dashes, brackets and +44 / 0044. */
      function validPhone(v) {
        var c = v.replace(/[\s\-().]/g, '');
        if (/^\+44\d{9,10}$/.test(c)) return true;
        if (/^0044\d{9,10}$/.test(c)) return true;
        if (/^0\d{9,10}$/.test(c)) return true;
        return false;
      }

      function showError(name, msg) {
        var f = fieldRefs[name];
        if (!f) return;
        f.input.setAttribute('aria-invalid', 'true');
        f.err.textContent = msg;
        f.err.hidden = false;
        f.input.setAttribute('aria-describedby', (f.hint ? f.hint.id + ' ' : '') + f.err.id);
      }

      function validate() {
        var errs = [];
        var name = (fieldRefs.name ? fieldRefs.name.input.value : '').trim();
        var phone = (fieldRefs.phone ? fieldRefs.phone.input.value : '').trim();
        if (!name) errs.push(['name', 'Please tell us your name.']);
        else if (name.length < 2) errs.push(['name', 'That looks a bit short — please give us your full name.']);
        if (!phone) errs.push(['phone', 'We need a mobile number so we can text you back.']);
        else if (!validPhone(phone)) errs.push(['phone', 'That does not look like a UK phone number. Try 07700 900 118.']);
        return errs;
      }

      function submit() {
        if (submitting) return;
        var errs = validate();
        if (errs.length) {
          state.errors = errs;
          errs.forEach(function (e) { showError(e[0], e[1]); });
          say(errs.length + (errs.length === 1 ? ' problem' : ' problems') + ' with the form. ' + errs[0][1]);
          track('booking_error', { fields: errs.map(function (e) { return e[0]; }).join(',') });
          fieldRefs[errs[0][0]].input.focus();
          return;
        }
        submitting = true;
        state.errors = [];
        forgetState();            /* never resurrect a sent request */
        state.name = fieldRefs.name.input.value.trim();
        state.phone = fieldRefs.phone.input.value.trim();
        state.notes = fieldRefs.notes ? fieldRefs.notes.input.value.trim() : '';
        state.ref = 'BW-' + (hash32(state.serviceId + state.stylistId + state.dateISO + state.time + state.name) % 9000 + 1000);
        track('booking_submit', {
          service: state.serviceId, stylist: state.stylistId,
          date: state.dateISO, time: state.time
        });
        goto(6, { announce: true, focus: true, scroll: true });
      }

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (state.step !== 5) return;
        submit();
      });

      /* ---- step 6: confirmation ---- */
      function resolvedStylist() {
        var slots = slotsFor(state.dateISO, state.stylistId, state.serviceId);
        for (var i = 0; i < slots.length; i++) {
          if (slots[i].time === state.time) return STYLIST_BY_ID[slots[i].stylistId];
        }
        return state.stylistId !== 'any' ? STYLIST_BY_ID[state.stylistId] : DATA.stylists[0];
      }

      function row(dl, k, v) {
        var dt = el('dt', null, k);
        var dd = el('dd', null, v);
        dl.appendChild(dt); dl.appendChild(dd);
      }

      function renderDone(root) {
        var svc = SERVICE_BY_ID[state.serviceId];
        var who = resolvedStylist();
        var box = el('div', 'bw-done');

        var tick = el('div', 'bw-tick' + (reduceMotion ? '' : ' is-anim'));
        tick.innerHTML = TICK;
        tick.setAttribute('aria-hidden', 'true');
        box.appendChild(tick);

        var firstName = state.name.split(' ')[0] || state.name;
        var h = el('h4', 'bw-done-title');
        h.tabIndex = -1;
        h.textContent = 'Thanks, ' + firstName + ' — that is with the salon.';
        box.appendChild(h);

        box.appendChild(el('p', 'bw-done-sub',
          'This is a request, not a confirmed booking. We will text you back to confirm, usually within a couple of hours while we are open.'));

        var card = el('div', 'bw-card');
        var dl = el('dl', 'bw-dl');
        row(dl, 'Service', svc.name);
        row(dl, 'Stylist', who.name + (state.stylistId === 'any' ? ' (whoever was free)' : ''));
        row(dl, 'Date', dateLong(state.dateISO));
        row(dl, 'Time', state.time);
        row(dl, 'Takes', durationText(svc.duration));
        row(dl, 'Price', priceText(svc));
        row(dl, 'Name', state.name);
        row(dl, 'Mobile', state.phone);
        if (state.notes) row(dl, 'Notes', state.notes);
        card.appendChild(dl);
        var ref = el('p', 'bw-ref');
        ref.appendChild(el('span', 'bw-ref-label', 'Reference '));
        ref.appendChild(el('strong', null, state.ref));
        card.appendChild(ref);
        box.appendChild(card);

        if (needsDeposit(state.serviceId)) {
          box.appendChild(el('p', 'bw-note',
            'We will ask for a £20 deposit when we confirm — it comes off your bill.'));
        }
        if (isColour(state.serviceId)) {
          box.appendChild(el('p', 'bw-note',
            'If you have not had colour with us before, pop in for a free skin test at least 48 hours beforehand.'));
        }

        var acts = el('div', 'bw-done-acts');
        var again = btn('btn btn-ghost', 'Start again');
        again.addEventListener('click', function () {
          reset();
          started = false;
          goto(1, { announce: true, focus: true, scroll: true });
        });
        var call = el('a', 'btn btn-primary', 'Call the salon instead');
        call.href = SALON.phoneHref;
        call.addEventListener('click', function () { track('call_click', { from: 'confirmation' }); });
        acts.appendChild(again);
        acts.appendChild(call);
        box.appendChild(acts);

        box.appendChild(el('p', 'bw-fineprint',
          'Demonstration only — nothing has been sent, stored or emailed anywhere.'));

        root.appendChild(box);
      }

      /* ---- render dispatcher ---- */
      function render(opts) {
        opts = opts || {};

        /* Repair first, paint second. M1: the header used to be written from
           state.step *before* this guard ran, so a chip tapped mid-advance
           left "Step 5 of 5" sitting permanently above "Choose a day". */
        if (state.step >= 2 && !state.serviceId) state.step = 1;
        if (state.step >= 3 && !state.stylistId) state.step = 2;
        if (state.step >= 4 && !state.dateISO) state.step = 3;
        if (state.step >= 5 && !state.time) state.step = 4;
        if (state.step === 6 && !state.ref) state.step = 5;

        panel.textContent = '';
        renderChips();
        stepNo.textContent = state.step > 5 ? '' : 'Step ' + state.step + ' of 5';
        stepNo.hidden = state.step > 5;

        if (state.step === 1) renderService(panel);
        else if (state.step === 2) renderStylist(panel);
        else if (state.step === 3) renderDay(panel);
        else if (state.step === 4) renderTime(panel);
        else if (state.step === 5) renderDetails(panel);
        else renderDone(panel);

        if (opts.announce) {
          say(state.step > 5
            ? 'Request sent. Reference ' + state.ref + '. This is a request, not a confirmed booking.'
            : STEP_SAY[state.step]);
        }
        if (state.step <= 5 && state.step !== lastTrackedStep) {
          lastTrackedStep = state.step;
          track('booking_step', { step: state.step });
        }

        if (opts.focus) {
          var target = panel.querySelector('.bw-legend-text, .bw-done-title');
          if (target) { try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); } }
        }
        if (opts.scroll) scrollStepIntoView();
        saveState();
      }

      if (restoreState()) {
        started = true;                 /* booking_start already fired */
        lastTrackedStep = state.step;   /* M7: no duplicate booking_step */
        render({});
        say('We kept the request you had started. Step ' + state.step + ' of 5.');
      } else {
        render({});
      }

      /* "Book with <name>" buttons on the team cards. */
      document.querySelectorAll('[data-book-stylist]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-book-stylist');
          if (!STYLIST_BY_ID[id]) return;
          reset(true);
          state.preferred = id;
          state.stylistId = null;
          if (!started) { started = true; track('booking_start', { from: 'team' }); }
          goto(1, { announce: true });
          say('Step 1 of 5. Choose a service. Showing services ' + STYLIST_BY_ID[id].first + ' offers.');
          var sec = document.getElementById('book');
          if (sec) sec.scrollIntoView({ block: 'start' });
          var t = panel.querySelector('.bw-legend-text');
          if (t) setTimeout(function () { try { t.focus({ preventScroll: true }); } catch (e) { t.focus(); } }, 400);
        });
      });

      /* bfcache: coming back from privacy.html with the Back button can
         restore a stale DOM. Re-render from state, which is cheap. */
      window.addEventListener('pageshow', function (e) {
        if (!e.persisted) return;
        /* Errors live in state and are re-applied by renderDetails, and
           booking_step is de-duplicated, so a restore cannot clear an error
           or double-count a step. */
        settleUntil = 0; acceptedAt = 0; forwardAt = 0; spotAt = 0;
        acceptedX = acceptedY = acceptedKey = null;
        inputRefused = false;
        cancelAdvance();
        clearBusy();
        render({});
      });

      /* Hero "next available" strip. */
      var na = document.getElementById('nextAvailable');
      if (na) {
        var n = nextAvailable('cbd', 'any');
        if (n) {
          na.textContent = dateLong(n.iso).replace(/ \d{4}$/, '') + ' at ' + n.time;
        }
      }
    }
  } catch (err) {
    /* The flow failed. Leave the phone number visible rather than a blank box. */
    var fallback = document.getElementById('bookingApp');
    if (fallback && !fallback.querySelector('.bw-fallback')) {
      fallback.textContent = '';
      var p = document.createElement('p');
      p.className = 'bw-fallback';
      p.textContent = 'The request form is not loading. Please phone the salon on ' +
        SALON.phone + ' and we will book you in.';
      fallback.appendChild(p);
    }
  }

  /* ==================================================================
     5. chrome — cookie bar, sticky CTA, Fresha panel, open-today strip
     ================================================================== */
  try {
    /* ---- storage that cannot throw. Safari treats file:// as an opaque
       origin and throws on localStorage access; that must not take the
       page down, so every call is guarded and we simply forget the
       visitor's choice if storage is unavailable. ---- */
    var KEY = 'bw-cookie-choice';
    function readChoice() {
      try { return window.localStorage.getItem(KEY); } catch (e) { return null; }
    }
    function writeChoice(v) {
      try { window.localStorage.setItem(KEY, v); } catch (e) { /* no storage, no memory */ }
    }

    var bar = document.getElementById('cookieBar');
    var cookieOpen = false;
    var stickyEl = document.getElementById('stickyCta');
    var heroOut = false, bookOn = false;
    var mqNarrow = window.matchMedia('(max-width: 859px)');

    /* Whichever fixed bar is on screen, reserve exactly its height at the
       foot of the document. Without this the bar permanently covers whatever
       happens to be underneath it and there is no way to scroll clear —
       which is how the cookie bar came to hide seven afternoon time slots
       and the hero CTA on a 375x667 screen. */
    function reserveBottom() {
      var h = 0;
      if (bar && !bar.hidden) h = bar.offsetHeight;
      else if (stickyEl && !stickyEl.hidden) h = stickyEl.offsetHeight;
      document.documentElement.style.setProperty('--bottom-bar', h + 'px');
    }

    function updateSticky() {
      if (stickyEl) {
        var show = mqNarrow.matches && heroOut && !bookOn && !cookieOpen;
        stickyEl.hidden = !show;
        stickyEl.classList.toggle('is-on', show);
      }
      reserveBottom();
    }

    function showBar() {
      if (!bar) return;
      bar.hidden = false;
      cookieOpen = true;
      updateSticky();
    }
    function hideBar(choice) {
      if (!bar) return;
      bar.hidden = true;
      cookieOpen = false;
      if (choice) writeChoice(choice);
      updateSticky();
    }

    /* Keep --header-h honest: it drives the sticky offset of the booking
       progress row and every anchor's scroll-margin. */
    var siteHeader = document.querySelector('.site-header');
    function syncHeaderHeight() {
      if (!siteHeader) return;
      var h = Math.round(siteHeader.getBoundingClientRect().height);
      if (h > 0) document.documentElement.style.setProperty('--header-h', h + 'px');
    }
    syncHeaderHeight();
    window.addEventListener('resize', syncHeaderHeight);
    if (window.ResizeObserver && siteHeader) new ResizeObserver(syncHeaderHeight).observe(siteHeader);

    /* The bars re-wrap when the phone rotates or the text scales. */
    window.addEventListener('resize', reserveBottom);
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(reserveBottom);
      if (bar) ro.observe(bar);
      if (stickyEl) ro.observe(stickyEl);
    }

    if (bar) {
      var accept = document.getElementById('cookieAccept');
      var reject = document.getElementById('cookieReject');
      if (accept) accept.addEventListener('click', function () { hideBar('accepted'); });
      if (reject) reject.addEventListener('click', function () { hideBar('rejected'); });

      /* 1200 ms, so it is not the first thing anyone sees. */
      if (!readChoice()) window.setTimeout(showBar, 1200);

      document.querySelectorAll('[data-cookie-settings]').forEach(function (link) {
        link.addEventListener('click', function (e) {
          e.preventDefault();
          showBar();
          var first = bar.querySelector('button');
          if (first) first.focus();
        });
      });
    }

    if (stickyEl && 'IntersectionObserver' in window) {
      var hero = document.querySelector('.hero');
      var book = document.getElementById('book');
      if (hero) {
        new IntersectionObserver(function (en) {
          heroOut = !en[0].isIntersecting;
          updateSticky();
        }, { threshold: 0 }).observe(hero);
      }
      if (book) {
        new IntersectionObserver(function (en) {
          bookOn = en[0].isIntersecting;
          updateSticky();
        }, { threshold: 0 }).observe(book);
      }
      if (mqNarrow.addEventListener) mqNarrow.addEventListener('change', updateSticky);
      else if (mqNarrow.addListener) mqNarrow.addListener(updateSticky);
    }

    /* ---- Fresha panel: open by default on a wide screen, collapsed on a
       phone so the working request flow gets the thumb first. ---- */
    var fresha = document.getElementById('freshaPanel');
    if (fresha) {
      var mqWide = window.matchMedia('(min-width: 900px)');
      /* N4: opening it ourselves fires a toggle event too, so without this
         flag every desktop load reported 100% engagement with the panel. */
      var programmaticOpen = false;
      if (mqWide.matches) { programmaticOpen = true; fresha.open = true; }
      fresha.addEventListener('toggle', function () {
        if (programmaticOpen) { programmaticOpen = false; return; }
        if (fresha.open) window.twsTrack('fresha_panel_open', {});
      });
    }

    document.querySelectorAll('.price-group').forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (d.open) window.twsTrack('prices_expand', { group: d.getAttribute('data-group') || '' });
      });
    });

    document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
      a.addEventListener('click', function () { window.twsTrack('call_click', {}); });
    });
    document.querySelectorAll('a[href*="wa.me"]').forEach(function (a) {
      a.addEventListener('click', function () { window.twsTrack('whatsapp_click', {}); });
    });

    /* M5: the mock used to hard-code "Thu 10 Sep · 14:30". This demo has to
       survive a months-long outreach push, so it follows the calendar. */
    var mockWhen = document.getElementById('mockWhen');
    if (mockWhen) {
      var na = nextAvailable('cbd', 'any');
      if (na) mockWhen.textContent = dateShort(na.iso) + ' \u00b7 ' + na.time;
    }

    /* ---- "Open today until…" ---- */
    var openToday = document.getElementById('openToday');
    if (openToday) {
      var clockNow = new Date();
      var mins = clockNow.getHours() * 60 + clockNow.getMinutes();
      var todays = HOURS[clockNow.getDay()];
      var msg;
      if (todays && mins < todays[1]) {
        msg = mins < todays[0]
          ? 'Opens today at ' + timeOf(todays[0])
          : 'Open now until ' + timeOf(todays[1]);
      } else {
        for (var i = 1; i <= 7; i++) {
          var d = new Date(clockNow.getFullYear(), clockNow.getMonth(), clockNow.getDate() + i);
          if (HOURS[d.getDay()]) {
            msg = 'Closed now · open ' + DAY_LONG[d.getDay()] + ' from ' + timeOf(HOURS[d.getDay()][0]);
            break;
          }
        }
      }
      if (msg) openToday.textContent = msg;
    }
  } catch (err2) { /* chrome is decoration; the page works without it */ }

  /* ==================================================================
     6. forms — demo contact form. Never sends anywhere.
     ================================================================== */
  try {
    var cform = document.querySelector('.contact-form');
    var cnote = document.getElementById('formNote');
    if (cform && cnote) {
      cform.addEventListener('submit', function (e) {
        e.preventDefault();
        var fields = [
          { el: cform.querySelector('#cf-name'), msg: 'Please tell us your name.' },
          { el: cform.querySelector('#cf-email'), msg: 'Please give us an email address we can reply to.' },
          { el: cform.querySelector('#cf-message'), msg: 'Please write us a message.' }
        ];
        var bad = null;
        fields.forEach(function (f) {
          if (!f.el) return;
          var v = f.el.value.trim();
          var ok = !!v;
          if (ok && f.el.type === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
          if (!ok) {
            f.el.setAttribute('aria-invalid', 'true');
            if (!bad) bad = f;
          } else {
            f.el.removeAttribute('aria-invalid');
          }
        });
        if (bad) {
          cnote.textContent = bad.msg + ' (Demonstration only — nothing is sent.)';
          cnote.className = 'form-note is-error';
          bad.el.focus();
          return;
        }
        cnote.textContent = 'Thanks — on a live site this would land in the salon inbox and on Rhona’s phone. Demonstration only: nothing has been sent, stored or emailed.';
        cnote.className = 'form-note is-ok';
        cform.reset();
      });
      cform.querySelectorAll('input,textarea').forEach(function (i) {
        i.addEventListener('input', function () { i.removeAttribute('aria-invalid'); });
      });
    }
  } catch (err3) { /* contact form is not critical to the pitch */ }

})();
