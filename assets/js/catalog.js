/* Client-side catalogue — display only.
 *
 * These prices render the cart. They are NOT what anyone is charged: the
 * checkout function keeps its own copy and prices the order from the SKU, so
 * editing this file in devtools changes the number on screen and nothing else.
 * If you change a price here, change it in functions/create-checkout-session.js
 * too, or the cart total and the Stripe total will disagree.
 *
 * `mix` groups items for the mix & match discount. Only the training-bat rule
 * is implemented, because it is the only one with published terms: buy 2 or
 * more and take 10% off those lines.
 */
export const CURRENCY = 'usd';

export const MIX_RULE = {
  group: 'bat',
  minQty: 2,
  percentOff: 10,
  label: 'Mix & match — 2+ training bats',
};

export const PRODUCTS = {
  'ppg-grip-adult': {
    name: 'Pivot Point Grip — Self Installation',
    cents: 4499, img: 'grip-adult-black.png', category: 'grips',
  },
  'ppg-grip-youth': {
    name: 'Youth Pivot Point Grip — Self Installation',
    cents: 3499, img: 'grip-youth-orange.png', category: 'grips',
  },

  'half-bat': {
    name: 'The Half Bat with PPG',
    cents: 14999, img: 'bat-half-bat.png', category: 'bats', mix: 'bat',
  },
  'youth-finisher': {
    name: 'Youth "Finisher" Half Bat with PPG',
    cents: 14499, img: 'bat-youth-finisher.png', category: 'bats', mix: 'bat',
  },
  'sledge': {
    name: 'The Sledge Heavy Half Bat with PPG',
    cents: 19999, img: 'bat-sledge.png', category: 'bats', mix: 'bat',
  },
  'nocast': {
    name: 'NoCastBat with PPG',
    cents: 14999, img: 'bat-nocast.png', category: 'bats',
  },
  'custom-youth-finisher': {
    name: 'CUSTOM Youth "Finisher" Half Bat with PPG',
    cents: 14999, img: 'bat-custom-youth-finisher.png', category: 'bats',
  },
  'custom-finisher': {
    name: 'CUSTOM "Finisher" Half Bat with PPG',
    cents: 15999, img: 'bat-custom-finisher.png', category: 'bats',
  },
  'custom-iron': {
    name: 'CUSTOM "Iron" Half Bat with PPG',
    cents: 15999, img: 'bat-custom-iron.png', category: 'bats',
  },
  'stringking-metal2': {
    name: 'STRINGKING Metal 2 BBCOR with Pivot Point Grip',
    cents: 16999, img: 'bat-stringking-metal2.png', category: 'bats',
  },
  'skinny-trainer': {
    name: 'PPG Skinny Training Bat',
    cents: 3999, img: 'bat-skinny-trainer.png', category: 'bats',
  },
  'wiffle': {
    name: 'PPG Wiffle Bat',
    cents: 4999, img: 'bat-wiffle.png', category: 'bats',
  },
};

export function money(cents) {
  return '$' + (cents / 100).toFixed(2);
}

/** Line items, discount and total. Mirrors the server's pricing exactly. */
export function price(lines) {
  const items = [];
  let subtotal = 0;
  let mixQty = 0;

  for (const { sku, qty } of lines) {
    const p = PRODUCTS[sku];
    if (!p || qty < 1) continue;
    const lineTotal = p.cents * qty;
    subtotal += lineTotal;
    if (p.mix === MIX_RULE.group) mixQty += qty;
    items.push({ sku, qty, product: p, lineTotal });
  }

  let discount = 0;
  if (mixQty >= MIX_RULE.minQty) {
    for (const item of items) {
      if (item.product.mix === MIX_RULE.group) {
        discount += Math.round(item.lineTotal * MIX_RULE.percentOff / 100);
      }
    }
  }

  return { items, subtotal, discount, total: subtotal - discount, mixQty };
}
