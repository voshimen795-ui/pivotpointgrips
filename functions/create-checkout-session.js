/**
 * Stripe Checkout Session — Netlify Function.
 *
 * The browser sends SKUs and quantities. It does NOT send prices, and this
 * function never reads a price from the request: everything is priced from
 * the table below. That is the whole point — a static site cannot keep a
 * secret, so the amount charged has to be decided somewhere the customer
 * cannot edit.
 *
 * Setup:
 *   1. Create a Stripe account and copy the secret key (sk_live_… / sk_test_…).
 *   2. Netlify → Site settings → Environment variables:
 *        STRIPE_SECRET_KEY = sk_…
 *        SITE_URL          = https://your-domain.com   (no trailing slash)
 *   3. npm install (installs the stripe package for the function bundle).
 *   4. Deploy. Test with card 4242 4242 4242 4242, any future expiry and CVC.
 *
 * On Vercel: move this file to api/create-checkout-session.js, export a
 * default (req, res) handler instead, and change ENDPOINT in assets/js/cart.js
 * to /api/create-checkout-session.
 *
 * Keep PRICES in step with assets/js/catalog.js. If they drift, the cart shows
 * one number and Stripe charges another.
 */

/* Variant SKUs are `base/variantId`. They are listed flat here on purpose:
   this table is the only thing that decides what anyone is charged, so it
   should be readable at a glance rather than computed. Keep it in step with
   assets/js/catalog.js. */
const PRICES = {
  'finisher/youth':        { name: 'The "Finisher" Half Bat with PPG — Youth',          cents: 14499, mix: 'bat' },
  'finisher/adult':        { name: 'The "Finisher" Half Bat with PPG — Adult',          cents: 14999, mix: 'bat' },
  'finisher/custom':       { name: 'The "Finisher" Half Bat with PPG — Custom',         cents: 15999, mix: 'bat' },

  'ppg-grip-adult':        { name: 'Pivot Point Grip — Self Installation',              cents: 4499 },
  'ppg-grip-youth':        { name: 'Youth Pivot Point Grip — Self Installation',        cents: 3499 },
  'half-bat':              { name: 'The Half Bat with PPG',                             cents: 14999, mix: 'bat' },
  'youth-finisher':        { name: 'Youth "Finisher" Half Bat with PPG',                cents: 14499, mix: 'bat' },
  'sledge':                { name: 'The Sledge Heavy Half Bat with PPG',                cents: 19999, mix: 'bat' },
  'nocast':                { name: 'NoCastBat with PPG',                                cents: 14999 },
  'custom-youth-finisher': { name: 'CUSTOM Youth "Finisher" Half Bat with PPG',         cents: 14999 },
  'custom-finisher':       { name: 'CUSTOM "Finisher" Half Bat with PPG',               cents: 15999 },
  'custom-iron':           { name: 'CUSTOM "Iron" Half Bat with PPG',                   cents: 15999 },
  'stringking-metal2':     { name: 'STRINGKING Metal 2 BBCOR with Pivot Point Grip',    cents: 16999 },
  'skinny-trainer':        { name: 'PPG Skinny Training Bat',                           cents: 3999 },
  'wiffle':                { name: 'PPG Wiffle Bat',                                    cents: 4999 },
};

const MIX = { group: 'bat', minQty: 2, percentOff: 10 };
const MAX_QTY = 99;
const MAX_LINES = 40;

/* Options arrive from a browser, so they are treated as text from a stranger:
   a fixed set of short, known keys, values clipped and stripped of anything
   that is not printable. The result is a flat string because that is what
   ends up on the Stripe line item, the receipt and the packing list. */
const OPT_KEYS = ['build', 'hand', 'grip', 'length', 'size', 'color', 'finish',
                  'engcolor', 'logo', 'engraving'];

function cleanOpts(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return '';
  const parts = [];
  for (const k of OPT_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(raw, k)) continue;
    const v = String(raw[k])
      .replace(/[\u0000-\u001f\u007f]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 60);
    if (v) parts.push(k + ': ' + v);
  }
  return parts.join(' · ');
}

const json = (statusCode, payload) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  const siteUrl = (process.env.SITE_URL || '').replace(/\/+$/, '');

  if (!secret || !siteUrl) {
    // Deployed without configuration. The cart shows its fallback message.
    return json(503, { error: 'Checkout is not configured' });
  }

  let lines;
  try {
    ({ lines } = JSON.parse(event.body || '{}'));
  } catch (err) {
    return json(400, { error: 'Malformed request' });
  }

  if (!Array.isArray(lines) || !lines.length || lines.length > MAX_LINES) {
    return json(400, { error: 'Invalid cart' });
  }

  // Collapse duplicates and clamp quantities before pricing anything.
  //
  // A line's identity is its SKU *and* its options: a right-handed 29" in navy
  // and a left-handed 31" in maroon are the same SKU at the same price and
  // must not be merged into a quantity of two, or the order loses what was
  // actually ordered. Options never move the price — every axis on the shop is
  // a free choice — so they are carried for fulfilment and nothing else.
  const wanted = new Map();
  for (const line of lines) {
    const sku = line && String(line.sku || '');
    const qty = Math.floor(Number(line && line.qty));

    if (!PRICES[sku]) return json(400, { error: 'Unknown item: ' + sku });
    if (!Number.isFinite(qty) || qty < 1 || qty > MAX_QTY) {
      return json(400, { error: 'Invalid quantity for ' + sku });
    }

    const opts = cleanOpts(line && line.opts);
    const key = sku + '|' + opts;
    const prev = wanted.get(key);
    wanted.set(key, { sku, opts, qty: Math.min(MAX_QTY, (prev ? prev.qty : 0) + qty) });
  }

  const rows = [...wanted.values()];

  const mixQty = rows.reduce(
    (n, r) => n + (PRICES[r.sku].mix === MIX.group ? r.qty : 0), 0
  );
  const discountApplies = mixQty >= MIX.minQty;

  const line_items = rows.map(({ sku, opts, qty }) => {
    const p = PRICES[sku];
    const discounted = discountApplies && p.mix === MIX.group;
    const unit = discounted
      ? Math.round(p.cents * (100 - MIX.percentOff) / 100)
      : p.cents;

    return {
      quantity: qty,
      price_data: {
        currency: 'usd',
        unit_amount: unit,
        product_data: {
          name: p.name + (discounted ? ' (training combo −' + MIX.percentOff + '%)' : ''),
          // What the customer chose, on the receipt and in the dashboard, so
          // the bat that gets built is the bat that was ordered.
          ...(opts ? { description: opts } : {}),
          metadata: { sku, ...(opts ? { options: opts.slice(0, 480) } : {}) },
        },
      },
    };
  });

  try {
    const stripe = require('stripe')(secret);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: siteUrl + '/order-confirmed.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: siteUrl + '/bats.html',
      billing_address_collection: 'required',
      shipping_address_collection: { allowed_countries: ['US', 'CA'] },
      phone_number_collection: { enabled: true },
      // Sales tax: enable Stripe Tax in the dashboard, then uncomment.
      // automatic_tax: { enabled: true },
    });

    return json(200, { url: session.url });
  } catch (err) {
    console.error('stripe checkout failed:', err && err.message);
    return json(502, { error: 'Could not start checkout' });
  }
};
