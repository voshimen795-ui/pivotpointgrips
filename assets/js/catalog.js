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

  /* The Finisher is the hero product and the only one with variants so far.
     A variant's SKU is `base/variantId` — `finisher/adult`. Everything
     downstream resolves through resolve(), so adding an axis to another
     product is a data change, not a code change.

     CONFIRMED prices, read off the client's own product cards. The LENGTH
     lineup is NOT confirmed — see `lengths` below. */
  'finisher': {
    name: 'The "Finisher" Half Bat with PPG',
    img: 'bat-half-bat.png', category: 'bats', mix: 'bat',
    option: 'Model',
    variants: [
      { id: 'youth',  label: 'Youth',  cents: 14499,
        img: 'bat-youth-finisher.png',
        blurb: 'For hands under 7.25\u2033 \u2014 youth grip fitted.' },
      { id: 'adult',  label: 'Adult',  cents: 14999,
        img: 'bat-half-bat.png',
        blurb: 'For hands over 7.25\u2033 \u2014 adult grip fitted.' },
      { id: 'custom', label: 'Custom', cents: 15999,
        img: 'bat-custom-finisher.png',
        blurb: 'Your colors, your logo engraved on the barrel.' },
    ],
    /* TODO — the client's actual length lineup. Their site does not publish it
       anywhere I could reach, and a wrong length on a buy button is a wrong
       order, so this ships empty on purpose: the page renders a "lengths on
       request" note instead of inventing inches. Fill this in and the length
       selector appears, with no other change:
           lengths: ['25\u2033', '27\u2033', '29\u2033', '31\u2033'],
       Mirror it in functions/create-checkout-session.js. */
    lengths: [],
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

/**
 * Turn a cart SKU into everything the UI needs.
 *
 * Accepts both a plain SKU (`sledge`) and a variant SKU (`finisher/adult`),
 * and returns null for anything that is not a real, buyable combination —
 * which is what keeps a stale localStorage entry or a hand-typed SKU out of
 * the cart.
 */
export function resolve(sku) {
  const [base, variantId] = String(sku).split('/');
  const p = PRODUCTS[base];
  if (!p) return null;

  if (!p.variants) {
    // A plain product addressed with a variant is not a real combination.
    if (variantId) return null;
    return { sku, product: p, name: p.name, cents: p.cents, img: p.img, mix: p.mix };
  }

  const v = p.variants.find((x) => x.id === variantId);
  if (!v) return null;
  return {
    sku, product: p, variant: v,
    name: p.name + ' \u2014 ' + v.label,
    cents: v.cents,
    img: v.img || p.img,
    mix: p.mix,
  };
}

/** Lowest price across a product's variants — for "from $x" labels. */
export function fromPrice(baseSku) {
  const p = PRODUCTS[baseSku];
  if (!p) return null;
  return p.variants ? Math.min(...p.variants.map((v) => v.cents)) : p.cents;
}

/** Line items, discount and total. Mirrors the server's pricing exactly. */
export function price(lines) {
  const items = [];
  let subtotal = 0;
  let mixQty = 0;

  for (const { sku, qty } of lines) {
    const r = resolve(sku);
    if (!r || qty < 1) continue;
    const lineTotal = r.cents * qty;
    subtotal += lineTotal;
    if (r.mix === MIX_RULE.group) mixQty += qty;
    items.push({ sku, qty, ...r, lineTotal });
  }

  let discount = 0;
  if (mixQty >= MIX_RULE.minQty) {
    for (const item of items) {
      if (item.mix === MIX_RULE.group) {
        discount += Math.round(item.lineTotal * MIX_RULE.percentOff / 100);
      }
    }
  }

  return { items, subtotal, discount, total: subtotal - discount, mixQty };
}
