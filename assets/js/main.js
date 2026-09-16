/* Pivot Point Grips — site behaviour. No dependencies. */
(function () {
  'use strict';

  /* --- Mobile nav ------------------------------------------------------- */
  var toggle = document.querySelector('[data-nav-toggle]');
  var nav = document.querySelector('[data-nav]');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.setAttribute('data-open', String(!open));
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        toggle.setAttribute('aria-expanded', 'false');
        nav.setAttribute('data-open', 'false');
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        toggle.setAttribute('aria-expanded', 'false');
        nav.setAttribute('data-open', 'false');
        toggle.focus();
      }
    });
  }

  /* --- Testimonial filter ----------------------------------------------- */
  var chips = document.querySelectorAll('[data-filter]');
  var filterables = document.querySelectorAll('[data-role]');
  var emptyNote = document.querySelector('[data-empty]');

  if (chips.length && filterables.length) {
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var want = chip.getAttribute('data-filter');

        chips.forEach(function (c) {
          c.setAttribute('aria-pressed', String(c === chip));
        });

        var shown = 0;
        filterables.forEach(function (el) {
          var match = want === 'all' || el.getAttribute('data-role') === want;
          el.hidden = !match;
          if (match) shown++;
        });

        if (emptyNote) emptyNote.hidden = shown > 0;
      });
    });
  }

  /* --- Marquee: duplicate the track so the loop is seamless -------------- */
  document.querySelectorAll('[data-marquee]').forEach(function (track) {
    track.insertAdjacentHTML('beforeend', track.innerHTML);
    track.setAttribute('aria-hidden', 'false');
  });

  /* --- Scroll reveal ----------------------------------------------------- */
  var targets = document.querySelectorAll('[data-reveal]');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!targets.length) return;

  if (reduced || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  targets.forEach(function (el) { io.observe(el); });
})();
