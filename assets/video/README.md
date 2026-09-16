# Hero footage

The home page hero looks for these two files and falls back to
`assets/img/hero-neon.jpg` (the `poster`) when they are missing — which is the
state it ships in. Drop the files in and the hero starts moving; no markup
change needed.

```
assets/video/hero.mp4     H.264 / AAC-free (the element is muted)
assets/video/hero.webm    VP9, optional but smaller in Chrome and Firefox
```

Cutting notes, so it holds up behind the headline:

- **6–12 seconds, seamless loop.** It sits under type the whole time; a visible
  cut is more distracting than a longer take.
- **1920×1080, no larger.** The layer renders at `opacity: .4` under a scrim, so
  detail is wasted. Aim under 3 MB — this file blocks nothing, but it competes
  with the fonts on first paint.
- **Slow motion, locked-off or slow push.** The stage already applies a 26-second
  drift and pointer parallax on top. Handheld or fast camera movement fights it.
- **Keep the action left-of-centre clear.** The headline and buttons occupy the
  left 55% on desktop.
- **No audio track needed.** The element is `muted` and `playsinline`; strip audio
  to save weight.

Good candidates from existing footage: cage work in slow motion, hands closing
on the grip, a bat spinning on the bench, the neon sign with light flicker.
