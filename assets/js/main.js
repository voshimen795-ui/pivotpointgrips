/* Pivot Point Grips — site behaviour. No dependencies.
 *
 * Everything here is an enhancement: with JS off or motion reduced, the page
 * still renders completely. Pointer work is throttled to one rAF per frame
 * and writes CSS custom properties rather than touching style.transform, so
 * the compositor does the interpolation.
 */
(function () {
  'use strict';

  // In a classic script, dynamic import() resolves against the DOCUMENT url,
  // not this file's — './bat3d.js' would look for /bat3d.js. Capture our own
  // src while currentScript is still set and resolve against that instead.
  var SELF_SRC = (document.currentScript && document.currentScript.src) || '';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

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

  /* --- Header scroll state ----------------------------------------------
   * Adds a stronger bottom edge once the page has moved, so the sticky bar
   * reads as a surface sitting over the content rather than part of it.
   */
  var header = document.querySelector('.site-header');

  if (header) {
    var stuck = false;
    var onScrollHeader = function () {
      var next = window.scrollY > 8;
      if (next === stuck) return;
      stuck = next;
      header.classList.toggle('is-stuck', stuck);
    };
    window.addEventListener('scroll', onScrollHeader, { passive: true });
    onScrollHeader();
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
  });

  /* --- Headline word stagger --------------------------------------------
   * Split on words only, and keep each word's text in a single span so the
   * accessibility tree still reads a normal sentence. <br> is preserved.
   */
  document.querySelectorAll('[data-split]').forEach(function (el) {
    var out = '';
    var i = 0;

    Array.prototype.forEach.call(el.childNodes, function (node) {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part.trim()) { out += part; return; }
          out += '<span class="word"><span style="--i:' + i++ + '">' + part + '</span></span>';
        });
      } else if (node.nodeName === 'BR') {
        out += '<br>';
      } else if (node.nodeType === 1) {
        // Keep wrapper elements (e.g. .accent) and split their text inside.
        var inner = '';
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part.trim()) { inner += part; return; }
          inner += '<span class="word"><span style="--i:' + i++ + '">' + part + '</span></span>';
        });
        var clone = node.cloneNode(false);
        clone.innerHTML = inner;
        out += clone.outerHTML;
      }
    });

    el.innerHTML = out;
  });

  requestAnimationFrame(function () {
    document.querySelectorAll('[data-split]').forEach(function (el) {
      el.classList.add('is-lit');
    });
  });

  /* --- Pointer tracking --------------------------------------------------
   * One shared rAF loop. Each registered element gets --px / --py in the
   * range -1 … 1, measured from its own centre; the CSS decides what to do
   * with them. Elements that scrolled out of view are skipped.
   */
  var tracked = [];
  var pointer = { x: 0, y: 0, active: false };
  var queued = false;

  function track(el, opts) {
    tracked.push({ el: el, global: !!(opts && opts.global), cls: opts && opts.cls });
  }

  function flush() {
    queued = false;

    tracked.forEach(function (item) {
      var r = item.el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;

      var px, py;

      if (item.global) {
        px = (pointer.x / window.innerWidth) * 2 - 1;
        py = (pointer.y / window.innerHeight) * 2 - 1;
      } else {
        var inside =
          pointer.x >= r.left && pointer.x <= r.right &&
          pointer.y >= r.top && pointer.y <= r.bottom;

        if (item.cls) item.el.classList.toggle(item.cls, inside && pointer.active);
        if (!inside) { item.el.style.setProperty('--px', 0); item.el.style.setProperty('--py', 0); return; }

        px = ((pointer.x - r.left) / r.width) * 2 - 1;
        py = ((pointer.y - r.top) / r.height) * 2 - 1;
      }

      item.el.style.setProperty('--px', px.toFixed(3));
      item.el.style.setProperty('--py', py.toFixed(3));
    });
  }

  if (finePointer && !reduced) {
    window.addEventListener('pointermove', function (e) {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
      if (!queued) { queued = true; requestAnimationFrame(flush); }
    }, { passive: true });

    document.addEventListener('pointerleave', function () {
      pointer.active = false;
      tracked.forEach(function (item) {
        item.el.style.setProperty('--px', 0);
        item.el.style.setProperty('--py', 0);
        if (item.cls) item.el.classList.remove(item.cls);
      });
    });

    document.querySelectorAll('[data-stage]').forEach(function (el) {
      track(el, { global: true });
    });
    document.querySelectorAll('[data-tilt]').forEach(function (el) {
      track(el, { cls: 'tilt' });
    });
  }

  /* --- Hero footage ------------------------------------------------------
   * The <video> carries the neon still as its poster, so a missing or slow
   * file degrades to the image rather than to a black box. Pause it when the
   * hero scrolls away — no point decoding frames nobody sees.
   */
  var heroVideo = document.querySelector('[data-hero-video]');

  if (heroVideo) {
    if (reduced) {
      heroVideo.removeAttribute('autoplay');
      heroVideo.pause();
    } else if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var p = heroVideo.play();
            if (p && p.catch) p.catch(function () { /* autoplay blocked; poster stands in */ });
          } else {
            heroVideo.pause();
          }
        });
      }, { threshold: 0.05 }).observe(heroVideo);
    }
  }

  /* --- 3D bat ------------------------------------------------------------
   * three.js is ~180 kB gzipped, so it is never part of the initial payload:
   * the module is imported only once the section is close to the viewport,
   * and only when the device can actually use it. Everything below bails to
   * the static product photo already in the markup.
   */
  var stage3d = document.querySelector('[data-bat3d]');

  if (stage3d) {
    var capable = (function () {
      if (reduced) return false;
      if (navigator.connection && navigator.connection.saveData) return false;
      if (typeof WebGLRenderingContext === 'undefined') return false;
      try {
        var c = document.createElement('canvas');
        return !!(c.getContext('webgl2') || c.getContext('webgl'));
      } catch (err) {
        return false;
      }
    })();

    if (capable && 'IntersectionObserver' in window) {
      var loader = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        loader.disconnect();

        var url = SELF_SRC
          ? new URL('bat3d.js', SELF_SRC).href
          : 'assets/js/bat3d.js';

        import(url)
          .then(function (mod) { mod.mount(stage3d); })
          .catch(function () { stage3d.setAttribute('data-failed', 'true'); });
      }, { rootMargin: '400px 0px' });

      loader.observe(stage3d);
    } else {
      stage3d.setAttribute('data-failed', 'true');
    }
  }

  /* --- Product page: variant picker + sticky buy bar ----------------------
   * The page ships with a working default selected in the markup, so it is
   * buyable before this runs. All this does is swap the selection.
   */
  var pdp = document.querySelector('[data-pdp]');

  if (pdp) {
    var addBtn = pdp.querySelector('[data-pdp-add]');
    var priceEl = pdp.querySelector('[data-pdp-price]');
    var chosenEl = pdp.querySelector('[data-pdp-chosen]');
    var blurbEl = pdp.querySelector('[data-pdp-blurb]');
    var imgEl = pdp.querySelector('[data-pdp-img]');
    var barName = document.querySelector('[data-bar-name]');
    var barPrice = document.querySelector('[data-bar-price]');
    var barAdd = document.querySelector('[data-bar-add]');

    var choose = function (btn) {
      var sku = btn.getAttribute('data-variant');

      pdp.querySelectorAll('[data-variant]').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });

      if (addBtn) addBtn.setAttribute('data-add-to-cart', sku);
      if (barAdd) barAdd.setAttribute('data-add-to-cart', sku);
      if (priceEl) priceEl.textContent = btn.getAttribute('data-price');
      if (barPrice) barPrice.textContent = btn.getAttribute('data-price');
      if (chosenEl) chosenEl.textContent = btn.getAttribute('data-label');
      if (barName) barName.textContent = btn.getAttribute('data-bar');
      if (blurbEl) blurbEl.textContent = btn.getAttribute('data-blurb');

      var img = btn.getAttribute('data-img');
      if (imgEl && img) imgEl.setAttribute('src', img);
    };

    pdp.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-variant]');
      if (btn) choose(btn);
    });

    // Reveal the mobile buy bar once the real buy panel has scrolled away,
    // so the two are never on screen at the same time.
    var bar = document.querySelector('[data-buy-bar]');
    var panel = pdp.querySelector('[data-pdp-buy]');

    if (bar && panel && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        bar.classList.toggle('is-on', !entries[0].isIntersecting);
      }, { threshold: 0 }).observe(panel);
    }
  }

  /* --- Scroll reveal ----------------------------------------------------- */
  var targets = document.querySelectorAll('[data-reveal], .media-reveal');
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
