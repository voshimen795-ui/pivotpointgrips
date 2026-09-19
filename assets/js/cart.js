/* Cart: localStorage state, a slide-in drawer, and the hand-off to checkout.
 *
 * Nothing here is trusted by the payment step. The drawer sends only SKUs and
 * quantities; the serverless function prices the order from its own table and
 * creates the Stripe Checkout Session. See functions/create-checkout-session.js.
 */
import { MIX_RULE, lineKey, money, optsText, price, resolve } from './catalog.js';

const KEY = 'ppg.cart.v1';
const ENDPOINT = '/.netlify/functions/create-checkout-session';

/* --- State -------------------------------------------------------------- */

let lines = load();

/* Options are strings chosen from the product's own lists, plus one free-text
   engraving field. Sanitising on the way in keeps a hand-edited localStorage
   entry from putting anything odd in front of whoever packs the order. */
function cleanOpts(raw) {
  if (!raw || typeof raw !== 'object') return undefined;
  const out = {};
  for (const k of Object.keys(raw).slice(0, 12)) {
    if (!/^[a-z][a-z0-9]{0,15}$/.test(k)) continue;
    const v = String(raw[k]).slice(0, 60).trim();
    if (v) out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    // Drop anything that is no longer a real SKU — catalogues change.
    return raw
      .filter((l) => l && resolve(l.sku) && Number.isFinite(l.qty) && l.qty > 0)
      .map((l) => ({
        sku: l.sku,
        qty: Math.min(99, Math.floor(l.qty)),
        opts: cleanOpts(l.opts),
      }));
  } catch (err) {
    return [];
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch (err) {
    /* private mode / quota — the cart still works for this page view */
  }
}

function count() {
  return lines.reduce((n, l) => n + l.qty, 0);
}

function add(sku, qty = 1, opts) {
  if (!resolve(sku)) return;
  const line = { sku, qty, opts: cleanOpts(opts) };
  const key = lineKey(line);
  const found = lines.find((l) => lineKey(l) === key);
  if (found) found.qty = Math.min(99, found.qty + qty);
  else lines.push(line);
  commit();
}

function setQty(key, qty) {
  const i = lines.findIndex((l) => lineKey(l) === key);
  if (i < 0) return;
  if (qty < 1) lines.splice(i, 1);
  else lines[i].qty = Math.min(99, qty);
  commit();
}

function commit() {
  save();
  renderBadge();
  renderDrawer();
}

/* --- Header badge ------------------------------------------------------- */

const badges = document.querySelectorAll('[data-cart-count]');
const openers = document.querySelectorAll('[data-cart-open]');

function renderBadge() {
  const n = count();
  badges.forEach((b) => {
    b.textContent = String(n);
    b.classList.toggle('is-filled', n > 0);
  });
  openers.forEach((o) => {
    o.setAttribute('aria-label', n === 1 ? 'Cart, 1 item' : 'Cart, ' + n + ' items');
  });
}

/* --- Drawer ------------------------------------------------------------- */

const drawer = document.querySelector('[data-cart-drawer]');
const body = drawer && drawer.querySelector('[data-cart-body]');
const foot = drawer && drawer.querySelector('[data-cart-foot]');
const status = drawer && drawer.querySelector('[data-cart-status]');
let lastFocused = null;

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function renderDrawer() {
  if (!drawer) return;

  const { items, subtotal, discount, total, mixQty } = price(lines);

  if (!items.length) {
    body.innerHTML =
      '<p class="cart-empty">Your cart is empty.</p>' +
      '<p class="cart-empty__sub">Grips turn any bat into your best bat. ' +
      'Training bats are built around them.</p>' +
      '<div class="cart-empty__links">' +
      '<a class="btn btn--accent" href="grips.html">Shop grips</a> ' +
      '<a class="btn btn--ghost" href="bats.html">Shop bats</a>' +
      '</div>';
    foot.hidden = true;
    return;
  }

  body.innerHTML = items.map((it) => {
    const spec = optsText(it.opts);
    return (
    '<article class="cart-line">' +
      '<img class="cart-line__img" src="assets/img/' + esc(it.img) + '" alt="" width="80" height="60" loading="lazy">' +
      '<div class="cart-line__main">' +
        '<p class="cart-line__name">' + esc(it.name) + '</p>' +
        (spec ? '<p class="cart-line__spec">' + esc(spec) + '</p>' : '') +
        '<p class="cart-line__unit">' + money(it.cents) + ' each</p>' +
        '<div class="qty">' +
          '<button type="button" class="qty__btn" data-qty-down="' + esc(it.key) + '" aria-label="Decrease quantity of ' + esc(it.name) + '">&minus;</button>' +
          '<span class="qty__value" aria-live="polite">' + it.qty + '</span>' +
          '<button type="button" class="qty__btn" data-qty-up="' + esc(it.key) + '" aria-label="Increase quantity of ' + esc(it.name) + '">+</button>' +
          '<button type="button" class="qty__remove" data-qty-remove="' + esc(it.key) + '">Remove</button>' +
        '</div>' +
      '</div>' +
      '<p class="cart-line__total">' + money(it.lineTotal) + '</p>' +
    '</article>'
    );
  }).join('');

  const nearMix = MIX_RULE.minQty - mixQty;

  foot.hidden = false;
  foot.innerHTML =
    '<dl class="cart-totals">' +
      '<div><dt>Subtotal</dt><dd>' + money(subtotal) + '</dd></div>' +
      (discount
        ? '<div class="cart-totals__save"><dt>' + esc(MIX_RULE.label) + '</dt><dd>&minus;' + money(discount) + '</dd></div>'
        : '') +
      '<div class="cart-totals__grand"><dt>Total</dt><dd>' + money(total) + '</dd></div>' +
    '</dl>' +
    (nearMix > 0 && mixQty > 0
      ? '<p class="cart-nudge">Add ' + nearMix + ' more training bat' + (nearMix > 1 ? 's' : '') +
        ' to take ' + MIX_RULE.percentOff + '% off.</p>'
      : '') +
    '<p class="cart-fineprint">Shipping and sales tax are calculated at checkout.</p>' +
    '<button class="btn btn--accent cart-checkout" type="button" data-checkout>Checkout</button>';
}

function openDrawer() {
  if (!drawer) return;
  lastFocused = document.activeElement;
  drawer.hidden = false;
  requestAnimationFrame(() => drawer.setAttribute('data-open', 'true'));
  document.body.style.overflow = 'hidden';
  const close = drawer.querySelector('[data-cart-close]');
  if (close) close.focus();
}

function closeDrawer() {
  if (!drawer) return;
  drawer.setAttribute('data-open', 'false');
  document.body.style.overflow = '';
  setTimeout(() => { drawer.hidden = true; }, 350);
  if (lastFocused && lastFocused.focus) lastFocused.focus();
}

/* --- Checkout ----------------------------------------------------------- */

async function checkout(button) {
  if (!lines.length) return;

  button.disabled = true;
  button.textContent = 'Starting checkout…';
  if (status) status.textContent = '';

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines }),
    });

    if (!res.ok) throw new Error('HTTP ' + res.status);

    const data = await res.json();
    if (!data.url) throw new Error('no session url');

    window.location.href = data.url;
  } catch (err) {
    button.disabled = false;
    button.textContent = 'Checkout';
    if (status) {
      status.textContent =
        'Checkout is not connected yet. Email info@pivotpointgrips.com and ' +
        'we will take the order directly.';
    }
  }
}

/* --- Wiring ------------------------------------------------------------- */

document.addEventListener('click', (e) => {
  const addBtn = e.target.closest('[data-add-to-cart]');
  if (addBtn) {
    e.preventDefault();
    // Buy panels that carry an option axis keep the chosen values here, so
    // this stays the one place a cart line is created.
    let opts;
    try { opts = JSON.parse(addBtn.getAttribute('data-opts') || 'null'); } catch (err) { opts = null; }
    add(addBtn.getAttribute('data-add-to-cart'), 1, opts);
    addBtn.classList.add('is-added');
    setTimeout(() => addBtn.classList.remove('is-added'), 1400);
    openDrawer();
    return;
  }

  if (e.target.closest('[data-cart-open]')) { e.preventDefault(); openDrawer(); return; }
  if (e.target.closest('[data-cart-close]') || e.target.closest('[data-cart-scrim]')) {
    closeDrawer();
    return;
  }

  const up = e.target.closest('[data-qty-up]');
  const down = e.target.closest('[data-qty-down]');
  const rm = e.target.closest('[data-qty-remove]');
  if (up)   { const k = up.getAttribute('data-qty-up');     setQty(k, qtyOf(k) + 1); return; }
  if (down) { const k = down.getAttribute('data-qty-down'); setQty(k, qtyOf(k) - 1); return; }
  if (rm)   { setQty(rm.getAttribute('data-qty-remove'), 0); return; }

  const pay = e.target.closest('[data-checkout]');
  if (pay) checkout(pay);
});

function qtyOf(key) {
  const l = lines.find((x) => lineKey(x) === key);
  return l ? l.qty : 0;
}

/* The quick view adds configured lines through here rather than reaching into
   this module's state. */
window.addEventListener('ppg:add', (e) => {
  const d = e.detail || {};
  add(d.sku, d.qty || 1, d.opts);
  openDrawer();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && drawer && drawer.getAttribute('data-open') === 'true') {
    closeDrawer();
  }
});

// Another tab changed the cart — keep them in step.
window.addEventListener('storage', (e) => {
  if (e.key !== KEY) return;
  lines = load();
  renderBadge();
  renderDrawer();
});

renderBadge();
renderDrawer();
