# Pivot Point Grips — 2026 site rebuild

Static HTML/CSS/JS. No build step, no dependencies, no framework. Open
`index.html` in a browser, or drop the folder on any host (Netlify, Vercel,
Cloudflare Pages, plain cPanel) and it works.

```
index.html          Home
testimonials.html   Testimonials (built to match the approved design comp)
assets/css/         Design system + components
assets/js/          Mobile nav, testimonial filter, marquee, scroll reveal
assets/fonts/       Self-hosted Archivo / Inter / Space Mono (woff2)
assets/img/         Photography and product shots
```

## Colour

The comp came back in lime green. This build uses the brand orange sampled from
the live site and the product itself, so the site matches the logo, the
packaging and the social accounts.

| Token | Value | Where it came from | Used for |
| --- | --- | --- | --- |
| `--orange` | `#e68a18` | live site nav links | primary accent, buttons, headline highlight, CTA band |
| `--orange-hi` | `#ff9d2a` | — | hover state |
| `--ember` | `#e25600` | the youth grip | reserved deep accent |
| `--ink` | `#101010` | — | dark sections |
| `--cream` | `#f2efe7` | — | light sections |

Every colour is a custom property at the top of `assets/css/style.css`. Change
`--orange` in one place and the whole site follows.

## Type

Archivo (display), Inter (body), Space Mono (labels and eyebrows) — all
self-hosted, so there is no third-party request and no flash of fallback text.
Archivo and Inter are variable fonts: one file covers every weight.

## What still needs real content

These are the only gaps. Everything else is live copy from the current site.

1. **Six testimonial cards** in *More from the cage* on `testimonials.html` are
   marked slots (`[Coach testimonial 2 — ...]`). Paste in the remaining quotes
   from the current Athletes and Coaches carousels. Keep `data-role="athlete"`
   or `data-role="coach"` on each `<article>` so the filter chips and the hero
   counts stay correct.
2. **Images.** `assets/img/` currently holds crops taken from screenshots of the
   live site — correct framing, but low resolution. Replace each file with the
   original at the same filename and nothing else changes. `install-steps.jpg`
   in particular should be swapped for the full instruction sheet.
3. **The contact form** posts nowhere. Point its `action` at the real endpoint
   (Wix, Formspree, Netlify Forms) before launch.
4. **Cart.** The header cart is presentational. Wire it to the real store when
   the commerce platform is decided.
5. **Footer links** for Terms, Returns and Blog are placeholders (`#terms`,
   `#returns`, `#blog`).

## Pages not yet built

Grips, Bats, Team Sales, Grip Installation and Our Story exist as sections on
the home page and are linked from the nav by anchor. If the client wants them
as standalone pages, each section lifts out as-is into its own file — the
design system already covers every component they need.
