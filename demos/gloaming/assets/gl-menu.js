/* Gloaming: the house card. Builds the menu once on every page, from one list,
   so the pages can never disagree about what exists. Any element with
   [data-menu-open] opens it. It also owns the lights: dark, light, or follow
   the device, kept in localStorage 'gl-theme'. */
(function () {
  'use strict';
  var me = document.currentScript;
  var base = new URL('../', me && me.src ? me.src : location.href).href; // this file lives in assets/
  var path = location.pathname.replace(/\.html$/, '');
  var leaf = path.split('/').pop();
  var onHome = leaf === '' || leaf === 'index' || leaf === 'artifact';
  if (!onHome && !/^(menu|privacy|terms)$/.test(leaf) && document.querySelector('[data-sc-mode]')) onHome = true;
  var onPage = onHome ? '' : leaf;

  var PAGES = [
    ['',        'The film',   'home'],
    ['menu',    'The board',  'menu & allergens'],
    ['#order',  'Order ahead','skip the queue'],
    ['#visit',  'Hours',      'when we\u2019re open'],
    ['#faq',    'Questions',  'asked at the till']
  ];
  var SMALL = [['privacy', 'Privacy'], ['terms', 'Terms']];
  function href(slug) {
    if (slug.charAt(0) === '#') return onHome ? slug : base + slug;
    return slug === '' ? (onHome ? '#top' : base) : base + slug;
  }
  var pad = function (i) { return (i < 9 ? '0' : '') + (i + 1); };

  var html = '' +
    '<div class="glm__scrim" data-glm-close></div>' +
    '<div class="glm__card" role="dialog" aria-modal="true" aria-labelledby="glm-h">' +
      '<div class="glm__head">' +
        '<p class="glm__eyebrow">Gloaming · the house card</p>' +
        '<h2 class="glm__h" id="glm-h">Where <em>to?</em></h2>' +
        '<button class="glm__x" type="button" data-glm-close aria-label="Close the menu"><svg viewBox="0 0 14 14" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="1.6" fill="none"/></svg></button>' +
      '</div>' +
      '<nav class="glm__group" aria-label="Pages"><p class="glm__label">Pages</p><ol class="glm__list">' +
        PAGES.map(function (p, i) {
          var cur = (p[0] === '' && onHome) || (p[0] === onPage && onPage) ? ' aria-current="page"' : '';
          return '<li><a href="' + href(p[0]) + '"' + cur + '><span class="glm__n">' + pad(i) + '</span><span class="glm__t">' + p[1] + '</span><span class="glm__dots" aria-hidden="true"></span><span class="glm__k">' + p[2] + '</span></a></li>';
        }).join('') +
      '</ol></nav>' +
      '<nav class="glm__group" aria-label="The small print"><p class="glm__label">Small print</p><ol class="glm__list glm__list--small">' +
        SMALL.map(function (p, i) {
          var cur = p[0] === onPage ? ' aria-current="page"' : '';
          return '<li><a href="' + href(p[0]) + '"' + cur + '><span class="glm__n">' + pad(PAGES.length + i) + '</span><span class="glm__t">' + p[1] + '</span><span class="glm__dots" aria-hidden="true"></span><span class="glm__k">read</span></a></li>';
        }).join('') +
      '</ol></nav>' +
      '<section class="glm__lights" aria-labelledby="glm-l">' +
        '<p class="glm__label" id="glm-l">Lights</p>' +
        '<fieldset class="glm__opts"><legend class="vh" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Choose the lights</legend>' +
          opt('dark', 'Down', 'after dark') + opt('light', 'Up', 'morning') + opt('system', 'Auto', 'your device') +
        '</fieldset>' +
      '</section>' +
      '<div class="glm__foot">' +
        (document.getElementById('consent') ? '<button type="button" data-glm-cookies>Cookie settings</button>' : '<span>Pay at the pass</span>') +
        '<span>Built by <a href="https://tempanywebstudios.co.uk/">Tempany Web Studios</a></span>' +
      '</div>' +
    '</div>';
  function opt(v, on, sub) {
    return '<label class="glm__opt"><input type="radio" name="glm-lights" id="glm-lights-' + v + '" value="' + v + '"><span class="glm__sw glm__sw--' + v + '" aria-hidden="true"></span><span class="glm__on">' + on + '</span><span class="glm__sub">' + sub + '</span></label>';
  }

  /* ---------------------------------------------------------- lights -- */
  var mq = matchMedia('(prefers-color-scheme: light)');
  function stored() { try { return localStorage.getItem('gl-theme') || 'dark'; } catch (e) { return 'dark'; } }
  function apply(choice) {
    var t = choice === 'system' ? (mq.matches ? 'light' : 'dark') : choice;
    document.documentElement.setAttribute('data-theme', t === 'light' ? 'light' : 'dark');
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', t === 'light' ? '#EFE6D8' : '#0E0A07');
    try { document.dispatchEvent(new CustomEvent('gl:theme', { detail: { choice: choice, theme: t } })); } catch (e) {}
  }
  function choose(choice) { try { localStorage.setItem('gl-theme', choice); } catch (e) {} apply(choice); }
  var onMq = function () { if (stored() === 'system') apply('system'); };
  mq.addEventListener ? mq.addEventListener('change', onMq) : mq.addListener(onMq);

  /* ------------------------------------------------------------ menu -- */
  var root, card, opener = null;
  function build() {
    root = document.createElement('div');
    root.className = 'glm'; root.id = 'glm'; root.hidden = true;
    root.innerHTML = html;
    document.body.appendChild(root);
    card = root.querySelector('.glm__card');
    root.querySelectorAll('[data-glm-close]').forEach(function (b) { b.addEventListener('click', close); });
    root.querySelectorAll('.glm__list a').forEach(function (a) { a.addEventListener('click', function () { close(true); }); });
    root.querySelectorAll('input[name="glm-lights"]').forEach(function (i) { i.addEventListener('change', function () { choose(i.value); }); });
    var ck = root.querySelector('[data-glm-cookies]');
    if (ck) ck.addEventListener('click', function () {
      close(true);
      var bar = document.getElementById('consent'); if (!bar) return;
      bar.hidden = false; try { window.dispatchEvent(new Event('resize')); } catch (e) {}
      var b = bar.querySelector('button'); b && b.focus();
    });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      var f = Array.prototype.filter.call(card.querySelectorAll('a[href], button, input:checked, input[type=radio]:not([name="glm-lights"])'), function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }
  function open(e) {
    if (!root) build();
    opener = e && e.currentTarget || document.activeElement;
    var c = stored(); var r = root.querySelector('#glm-lights-' + c); if (r) r.checked = true;
    root.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('is-open'); }); });
    document.querySelectorAll('[data-menu-open]').forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
    setTimeout(function () { var x = root.querySelector('.glm__x'); x && x.focus(); }, 60);
  }
  function close(navigating) {
    if (!root || root.hidden) return;
    root.classList.remove('is-open');
    document.documentElement.style.overflow = '';
    document.querySelectorAll('[data-menu-open]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(function () { root.hidden = true; }, reduce ? 0 : 420);
    if (navigating !== true && opener && opener.focus) opener.focus();
  }
  function wire() {
    document.querySelectorAll('[data-menu-open]').forEach(function (b) {
      b.setAttribute('aria-haspopup', 'dialog'); b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', 'glm');
      b.addEventListener('click', open);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
  window.glMenu = { open: open, close: close, choose: choose };
})();
