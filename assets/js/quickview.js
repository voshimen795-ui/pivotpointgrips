/* Quick view — the product sheet that opens over the grid.
 *
 * Lazily imported by main.js the first time somebody opens a product, because
 * most visits never open one and this module carries every word of product
 * copy on the site.
 *
 * It does not own cart state. Adding dispatches a `ppg:add` event that cart.js
 * listens for, so there is still exactly one place where a cart line is
 * created and exactly one place that talks to localStorage.
 */
import { PRODUCTS, fromPrice, money, resolve } from './catalog.js';
import { DETAIL } from './product-data.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

let root = null;      // the dialog element, built once
let lastFocused = null;
let state = null;     // { sku, opts, qty, detail, product }

/* --- Markup -------------------------------------------------------------- */

function optionMarkup(axis) {
  const head =
    '<div class="qv-opt__head">' +
      '<p class="qv-opt__label" id="qv-' + axis.id + '">' + esc(axis.label) +
        (axis.required ? '<span class="qv-opt__req" title="Required" aria-label="required"> *</span>' : '') +
      '</p>' +
      '<p class="qv-opt__chosen" data-chosen="' + axis.id + '"></p>' +
    '</div>';

  // No published list — say so rather than offer invented values.
  if (axis.type !== 'text' && !axis.values.length) {
    return '<div class="qv-opt qv-opt--ask">' + head +
      '<p class="qv-opt__ask">' + esc(axis.ask || '') +
      ' <a href="contact.html">Ask us</a>.</p></div>';
  }

  if (axis.type === 'text') {
    return '<div class="qv-opt">' + head +
      '<input class="qv-opt__text" type="text" data-opt="' + axis.id + '"' +
        ' maxlength="' + (axis.max || 40) + '"' +
        ' aria-labelledby="qv-' + axis.id + '"' +
        ' placeholder="' + esc(axis.placeholder || '') + '">' +
      '<p class="qv-opt__note">Up to ' + (axis.max || 40) + ' characters.' +
        (axis.note ? ' ' + esc(axis.note) : '') + '</p>' +
    '</div>';
  }

  if (axis.type === 'swatch') {
    const sw = axis.values.map((o, i) => (
      '<button class="qv-sw" type="button" role="radio" aria-checked="false"' +
        ' data-opt="' + axis.id + '" data-value="' + esc(o.v) + '"' +
        ' title="' + esc(o.v) + '" aria-label="' + esc(o.v) + '"' +
        ' style="--sw:' + esc(o.hex) + '"></button>'
    )).join('');
    return '<div class="qv-opt">' + head +
      '<div class="qv-sw-grid" role="radiogroup" aria-labelledby="qv-' + axis.id + '">' +
        sw + '</div>' +
      (axis.note ? '<p class="qv-opt__note">' + esc(axis.note) + '</p>' : '') +
    '</div>';
  }

  const btns = axis.values.map((o) => (
    '<button class="qv-choice" type="button" role="radio" aria-checked="false"' +
      ' data-opt="' + axis.id + '" data-value="' + esc(o.v) + '">' +
      '<b>' + esc(o.v) + '</b>' +
      (o.note ? '<span>' + esc(o.note) + '</span>' : '') +
    '</button>'
  )).join('');
  return '<div class="qv-opt">' + head +
    '<div class="qv-choices" role="radiogroup" aria-labelledby="qv-' + axis.id + '">' +
      btns + '</div>' +
    (axis.note ? '<p class="qv-opt__note">' + esc(axis.note) + '</p>' : '') +
  '</div>';
}

function sectionMarkup(s) {
  return '<div class="qv-sec">' +
    (s.title ? '<h3 class="qv-sec__title">' + esc(s.title) + '</h3>' : '') +
    (s.body ? '<p>' + esc(s.body) + '</p>' : '') +
    (s.listTitle ? '<p class="qv-sec__lt">' + esc(s.listTitle) + '</p>' : '') +
    (s.list ? '<ul class="qv-list">' + s.list.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '') +
    (s.foot ? '<p class="qv-sec__foot">' + esc(s.foot) + '</p>' : '') +
  '</div>';
}

function build(sku) {
  const p = PRODUCTS[sku];
  const d = DETAIL[sku] || {};
  const from = p.variants ? 'From ' : '';
  const cents = fromPrice(sku);
  const gallery = (d.gallery && d.gallery.length ? d.gallery : [p.img]);

  const badges =
    (p.mix ? '<span class="qv-badge">Training combo — 10% off 2+</span>' : '') +
    (d.lead && d.lead.preorder ? '<span class="qv-badge qv-badge--wait">Pre-order</span>' : '');

  const stars = d.reviews
    ? '<p class="qv-stars"><span aria-hidden="true">★★★★★</span> ' +
      d.reviews.avg.toFixed(1) + ' · ' + d.reviews.count +
      ' review' + (d.reviews.count === 1 ? '' : 's') +
      ' <span class="qv-stars__src">on pivotpointgrips.com</span></p>'
    : '';

  return '' +
  '<div class="qv__scrim" data-qv-close></div>' +
  '<div class="qv__panel" role="dialog" aria-modal="true" aria-labelledby="qv-title">' +
    '<button class="qv__close" type="button" data-qv-close aria-label="Close">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
    '</button>' +

    '<div class="qv__grid">' +
      '<div class="qv__media">' +
        '<div class="qv__stage"><img data-qv-img src="assets/img/' + esc(gallery[0]) + '" alt="' + esc(p.name) + '" width="560" height="420"></div>' +
        (gallery.length > 1
          ? '<div class="qv__thumbs">' + gallery.map((g, i) => (
              '<button class="qv__thumb" type="button" data-qv-thumb="' + esc(g) + '"' +
              ' aria-pressed="' + (i === 0) + '" aria-label="View ' + (i + 1) + '">' +
              '<img src="assets/img/' + esc(g) + '" alt="" loading="lazy" width="70" height="70"></button>'
            )).join('') + '</div>'
          : '') +
      '</div>' +

      '<div class="qv__buy">' +
        (badges ? '<div class="qv-badges">' + badges + '</div>' : '') +
        '<h2 class="qv__title" id="qv-title">' + esc(p.name) + '</h2>' +
        (d.tagline ? '<p class="qv__tagline">' + esc(d.tagline) + '</p>' : '') +
        stars +
        '<p class="qv__price">' + from + money(cents) +
          '<span class="qv__tax">Excl. sales tax</span></p>' +
        (d.lead ? '<p class="qv__lead">' + esc(d.lead.text) + '</p>' : '') +

        '<div class="qv__opts">' +
          (d.options || []).map(optionMarkup).join('') +
        '</div>' +

        '<div class="qv__act">' +
          '<div class="qty qty--qv">' +
            '<button class="qty__btn" type="button" data-qv-qty="-1" aria-label="Decrease quantity">&minus;</button>' +
            '<span class="qty__value" data-qv-qtyval aria-live="polite">1</span>' +
            '<button class="qty__btn" type="button" data-qv-qty="1" aria-label="Increase quantity">+</button>' +
          '</div>' +
          '<button class="btn btn--accent qv__add" type="button" data-qv-add>' +
            (d.lead && d.lead.preorder ? 'Pre-order' : 'Add to cart') + '</button>' +
        '</div>' +
        '<p class="qv__err" data-qv-err role="status"></p>' +

        (sku === 'finisher' || sku === 'half-bat'
          ? '<p class="qv__more"><a href="finisher.html">See the full Finisher page →</a></p>' : '') +
      '</div>' +
    '</div>' +

    '<div class="qv__body">' +
      (d.pitch || []).map((t) => '<p class="qv__pitch">' + esc(t) + '</p>').join('') +
      (d.sections || []).map(sectionMarkup).join('') +

      (d.specs ? '<div class="qv-sec"><p class="qv-sec__lt">Details</p><ul class="qv-list">' +
        d.specs.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div>' : '') +

      (d.use ? '<div class="qv-sec"><p class="qv-sec__lt">Training use</p><p>' + esc(d.use) + '</p></div>' : '') +

      (d.balls ? '<div class="qv-warn"><p class="qv-warn__t">Approved balls only</p><p>' + esc(d.balls) + '</p></div>' : '') +

      '<div class="qv-fine">' +
        (d.policy ? '<details><summary>Returns</summary><p>' + esc(d.policy.returns) + '</p></details>' : '') +
        (d.policy ? '<details><summary>Warranty</summary><p>' + esc(d.policy.warranty) + '</p></details>' : '') +
        (d.policy ? '<details><summary>Shipping</summary><p>' + esc(d.policy.shipping) + '</p></details>' : '') +
      '</div>' +

      (d.maker ? '<p class="qv-note">' + esc(d.maker) + '</p>' : '') +
      (d.patent ? '<p class="qv-note">' + esc(d.patent) + '</p>' : '') +
    '</div>' +
  '</div>';
}

/* --- Behaviour ----------------------------------------------------------- */

function chosenLabel(id) {
  const el = root.querySelector('[data-chosen="' + id + '"]');
  if (el) el.textContent = state.opts[id] || '';
}

function pick(btn) {
  const id = btn.getAttribute('data-opt');
  const val = btn.getAttribute('data-value');
  state.opts[id] = val;
  root.querySelectorAll('[data-opt="' + id + '"]').forEach((b) => {
    if (b.tagName === 'BUTTON') b.setAttribute('aria-checked', String(b === btn));
  });
  chosenLabel(id);
  root.querySelector('[data-qv-err]').textContent = '';
}

function setQty(n) {
  state.qty = Math.max(1, Math.min(99, state.qty + n));
  root.querySelector('[data-qv-qtyval]').textContent = String(state.qty);
}

function missing() {
  return (state.detail.options || [])
    .filter((a) => a.required && a.type !== 'text' && a.values.length && !state.opts[a.id])
    .map((a) => a.label);
}

function submit() {
  const err = root.querySelector('[data-qv-err]');
  const gaps = missing();
  if (gaps.length) {
    err.textContent = 'Choose ' + gaps.join(' and ').toLowerCase() + ' first.';
    const first = state.detail.options.find((a) => a.label === gaps[0]);
    const el = root.querySelector('[data-opt="' + first.id + '"]');
    if (el && el.focus) el.focus();
    return;
  }
  window.dispatchEvent(new CustomEvent('ppg:add', {
    detail: { sku: state.sku, qty: state.qty, opts: state.opts },
  }));
  close();
}

export function close() {
  if (!root) return;
  root.setAttribute('data-open', 'false');
  document.body.style.overflow = '';
  setTimeout(() => { root.hidden = true; }, 320);
  if (lastFocused && lastFocused.focus) lastFocused.focus();
}

export function open(sku) {
  if (!resolve(sku) && !PRODUCTS[sku]) return;

  if (!root) {
    root = document.createElement('div');
    root.className = 'qv';
    root.hidden = true;
    document.body.appendChild(root);
    wire();
  }

  state = { sku, qty: 1, opts: {}, product: PRODUCTS[sku], detail: DETAIL[sku] || { options: [] } };
  root.innerHTML = build(sku);

  lastFocused = document.activeElement;
  root.hidden = false;
  requestAnimationFrame(() => root.setAttribute('data-open', 'true'));
  document.body.style.overflow = 'hidden';
  const close0 = root.querySelector('.qv__close');
  if (close0) close0.focus();
}

function wire() {
  root.addEventListener('click', (e) => {
    if (e.target.closest('[data-qv-close]')) { close(); return; }

    const opt = e.target.closest('[data-opt]');
    if (opt && opt.tagName === 'BUTTON') { pick(opt); return; }

    const thumb = e.target.closest('[data-qv-thumb]');
    if (thumb) {
      root.querySelector('[data-qv-img]').src = 'assets/img/' + thumb.getAttribute('data-qv-thumb');
      root.querySelectorAll('[data-qv-thumb]').forEach((t) => t.setAttribute('aria-pressed', String(t === thumb)));
      return;
    }

    const q = e.target.closest('[data-qv-qty]');
    if (q) { setQty(Number(q.getAttribute('data-qv-qty'))); return; }

    if (e.target.closest('[data-qv-add]')) submit();
  });

  root.addEventListener('input', (e) => {
    const t = e.target.closest('[data-opt]');
    if (t && t.tagName === 'INPUT') {
      state.opts[t.getAttribute('data-opt')] = t.value.trim();
      chosenLabel(t.getAttribute('data-opt'));
    }
  });

  // Escape closes; Tab stays inside — a dialog you can tab out of behind the
  // scrim is a dialog screen reader users get lost in.
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;
    const f = root.querySelectorAll(
      'button, [href], input, select, textarea, summary, [tabindex]:not([tabindex="-1"])');
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}
