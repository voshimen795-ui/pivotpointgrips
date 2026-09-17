# Pivot Point Grips — 2026 site rebuild

Static HTML/CSS/JS. No build step, no dependencies, no framework. Open
`index.html` in a browser, or drop the folder on any host (Netlify, Vercel,
Cloudflare Pages, GitHub Pages, plain cPanel) and it works. Every path is
relative, so it runs from a subdirectory too.

## Pages

| File | In the nav | What's on it |
| --- | --- | --- |
| `index.html` | Home | 3D hero, stats, photo strip, what the grip is, two doors into the catalogue, one testimonial, team CTA |
| `grips.html` | Grips | Both SKUs, sizing guidance |
| `bats.html` | Bats | All ten training bats, plus which-one-when |
| `team-sales.html` | Team Sales | Team pricing, customisation, free install |
| `testimonials.html` | Testimonials | Featured coach and athlete, filterable voice grid |
| `installation.html` | Installation | Six steps, DeMarini note, assumption of risk |
| `story.html` | Our Story | Founders, why gripping is hard, how PPG differs |
| `faq.html` | — (footer) | Sizing, compatibility, install, team orders |
| `contact.html` | — (footer) | Form and direct email |
| `order-confirmed.html` | — | Where Stripe returns after payment; clears the cart |
| `design-system.html` | **unlinked** | Internal reference: tokens, type, components, motion |

The home page deliberately carries only what earns its place. Everything it
used to hold now lives on the page that owns it, one click away.

`design-system.html` is intentionally not linked from the nav or footer — it is
for whoever edits the site, not for customers. Open it directly.

## Assets

```
assets/css/style.css     Tokens + every component
assets/js/main.js        ~230 lines, no dependencies
assets/fonts/            Self-hosted Archivo / Inter / Space Mono (woff2, 284 KB)
assets/img/              Photography and product shots
assets/video/            Hero footage — see the note in that folder
assets/vendor/           three.js (MIT), self-hosted, lazy-loaded
functions/               Stripe Checkout — the only server-side code
```

## Colour

The comp came back in lime green. This build uses the brand orange sampled from
the live site and the product itself, so the site matches the logo, the
packaging and the social accounts. Full palette with usage notes is on
`design-system.html`; the short version:

| Token | Value | Used for |
| --- | --- | --- |
| `--orange` | `#e68a18` | primary accent, buttons, headline highlight, CTA band |
| `--ember` | `#e25600` | links on cream, where `--orange` loses contrast |
| `--ink` | `#101010` | dark sections |
| `--cream` | `#f2efe7` | light sections |

Every colour is a custom property at the top of `style.css`. Change `--orange`
in one place and the whole site follows.

## Motion

- **Hero.** Four layers on a shared perspective. Pointer position is written to
  `--px`/`--py` and each layer multiplies it by its own depth, so they separate
  as the cursor moves; a 26-second keyframe drift keeps it alive when nothing is
  touching it. The `<video>` falls back to its poster image, which is the state
  it ships in — drop a file into `assets/video/` and it starts moving.
- **Photography.** A curtain wipes up off each frame while the image settles out
  of a 1.14 over-scale; captions rise 250ms behind it. Hover takes a slow 1.05
  push.
- **Cards.** Pointer-follow 3D lift, capped at 3°.
- **Headlines.** Words rise into place on a 55ms stagger.
- **3D bat.** See below.

All of it stops under `prefers-reduced-motion: reduce`, and pointer effects are
gated behind `(hover: hover) and (pointer: fine)` so touch devices never pay for
them. Entrance animations are additionally gated behind a `js` class set in
`<head>` — with JavaScript off the pages render completely, just without motion.

## The 3D bat

`assets/js/bat3d.js` builds the bat in three.js. There is no model file: a bat
is a surface of revolution, so the silhouette is a radius-along-length profile
that gets lathed. The groove count, depth and taper are parameters at the top
of the file, not baked geometry — change `GROOVES` and it re-renders with a
different number of ridges.

Three things in there are less obvious than they look:

- **The spin and the lean are separate groups.** Applied to one object, a Y
  spin on top of a Z lean sweeps the bat around a cone and swings the barrel
  out of frame. Nested — `bat` holds the lean, `spinner` inside it turns about
  the bat's own axis — the silhouette never changes and the whole bat stays in
  shot at every angle.
- **The wordmark is what makes the rotation visible.** A lathed bat spinning
  about its own axis changes neither silhouette nor shading, so without
  something asymmetric on the barrel the turntable looks completely frozen.
  Two canvas decals, `PIVOT POINT` and `PPG`, sit on opposite faces so
  something is always entering or leaving view.
- **The decals follow the barrel's own profile.** The barrel curves from the
  taper into the parallel section, so a straight cone shell dips under the
  surface in the middle and the decal comes out sliced in half. `decalProfile()`
  samples `barrelRadiusAt()` and offsets it outward instead.

Motion is timed off the rAF clock in units per second, not per frame, so the
turntable runs at the same speed on a 60Hz laptop and a 120Hz phone and does
not jump after a backgrounded tab. A full turn takes about 12 seconds
(`SPIN_RATE`). Camera distance is derived from the field of view, so any
container shape frames the bat identically.

three.js is ~180 kB gzipped, so it is **never in the initial payload**. The
module is imported only when the section is within 400px of the viewport, and
only when the device passes a check for WebGL, no `prefers-reduced-motion` and
no `Save-Data`. Everything else falls back to the product photo underneath,
which is what ships in the markup.

## Cart and payments

**What works now, with no setup:** adding to cart, quantities, removal,
mix & match discount, the drawer, persistence across reloads and tabs.

**What needs your Stripe account:** taking money. Until then the Checkout
button shows a message pointing at `info@pivotpointgrips.com` rather than
failing silently.

To connect it:

1. Create a Stripe account and copy the secret key.
2. Deploy to Netlify (`netlify.toml` is already configured).
3. Site settings → Environment variables:
   `STRIPE_SECRET_KEY = sk_…` and `SITE_URL = https://your-domain.com`.
4. `npm install` so the function bundles the `stripe` package.
5. Test with card `4242 4242 4242 4242`, any future expiry and CVC.

For Vercel instead: move `functions/create-checkout-session.js` to
`api/`, export a default `(req, res)` handler, and change `ENDPOINT` at the top
of `assets/js/cart.js`.

**Why prices live in two files.** `assets/js/catalog.js` renders the cart;
`functions/create-checkout-session.js` decides what is charged. The browser
sends only SKUs and quantities — a forged price in the request is ignored,
which is verified by the test cases in the commit. Keep the two tables in step
or the cart total and the Stripe total will disagree.

**The discount rule** implemented is the one with published terms: two or more
training bats carrying the "Mix & Match Training Tools" badge take 10% off
those lines. The grips carry a "Training Grip Mix & Match" badge whose terms I
could not find — no rule is applied to them. Confirm with the client and add it
to `MIX_RULE` in both files if it exists.

## What still needs real content

1. **Six testimonial cards** in *More from the cage* on `testimonials.html` are
   marked slots (`[Coach testimonial 2 — ...]`). Paste in the remaining quotes
   from the current Athletes and Coaches carousels. Keep `data-role="athlete"`
   or `data-role="coach"` on each `<article>` so the filter chips and the hero
   counts stay correct.
2. **Images.** `assets/img/` currently holds crops taken from screenshots of the
   live site — correct framing, but low resolution. Replace each file with the
   original at the same filename and nothing else changes. `install-steps.jpg`
   in particular should be swapped for the full instruction sheet.
3. **Hero video.** Absent by design; see `assets/video/README.md` for the cut.
4. **The contact form** posts nowhere. Point its `action` at the real endpoint
   (Wix, Formspree, Netlify Forms) before launch.
5. **Stripe keys**, per the section above. Also confirm the shipping countries
   in the function — it currently allows US and CA — and whether Stripe Tax
   should be switched on.
6. **Footer links** for Terms, Returns and Blog are placeholders (`#terms`,
   `#returns`, `#blog`). A real store needs Terms, Returns and Privacy pages
   before Stripe will be happy.

## Editing note

The header and footer markup is duplicated in all ten HTML files. It is
identical in each — if you change a nav item, change it in all ten, or the
navigation will drift between pages.
