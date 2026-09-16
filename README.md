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

All of it stops under `prefers-reduced-motion: reduce`, and pointer effects are
gated behind `(hover: hover) and (pointer: fine)` so touch devices never pay for
them. Entrance animations are additionally gated behind a `js` class set in
`<head>` — with JavaScript off the pages render completely, just without motion.

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
5. **Cart.** The header cart is presentational. Wire it to the real store when
   the commerce platform is decided.
6. **Footer links** for Terms, Returns and Blog are placeholders (`#terms`,
   `#returns`, `#blog`).

## Editing note

The header and footer markup is duplicated in all ten HTML files. It is
identical in each — if you change a nav item, change it in all ten, or the
navigation will drift between pages.
