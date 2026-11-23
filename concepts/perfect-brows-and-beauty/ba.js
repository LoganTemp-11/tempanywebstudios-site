/* Before | After switch. Without this file the section shows every frame with its word. */
(function () {
  var section = document.getElementById('before-after');
  if (!section) return;
  var bar = section.querySelector('.ba-switch');
  var live = section.querySelector('.ba-live');
  var buttons = bar.querySelectorAll('button');

  function show(which, announce) {
    section.setAttribute('data-show', which);
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-pressed', String(buttons[i].getAttribute('data-ba') === which));
    }
    if (announce) live.textContent = 'Showing ' + which;
  }

  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', function () {
      show(this.getAttribute('data-ba'), true);
    });
  }

  section.classList.add('ba-on');
  bar.hidden = false;
  show('after', false);
})();
