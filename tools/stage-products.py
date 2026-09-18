#!/usr/bin/env python3
"""Put every product shot on one stage.

The product crops came off screenshots of the old site, so each one carries a
flat rgb(29,29,29) rectangle of that site's background. Against the card's
#141414 that rectangle is plainly visible, and because each crop framed its
product differently the products also sat at wildly different scales — a bat
filling 3.4% of its frame next to a grip filling 21%.

This keys the background out to transparency and re-stages each product at a
fixed size with fixed padding, so the card background shows through and every
product reads at the same weight.

Re-run it after dropping better source images into assets/img/_source/ (or
straight into assets/img/ as .jpg). It is idempotent: it always reads the
.jpg and writes the .png, so running twice changes nothing.

    python3 tools/stage-products.py
"""
import os
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageFilter

IMG = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'img')

# Background the old site used behind its product shots.
BG = np.array([29, 29, 29])
TOL = 16          # how far from BG still counts as background
FEATHER = 1.2     # px of edge softening, so the cut is not jagged

# One canvas per orientation, matching the card media aspect ratios.
STAGE = {
    'wide': (560, 420),   # .product-card__media          4 / 3
    'tall': (420, 560),   # .product-grid--tall media     3 / 4
}
FILL = 0.80           # product's long side as a share of the canvas long side

PRODUCTS = [
    # file                             stage   rotate-to (deg) or None
    ('bat-half-bat',                   'wide', None),
    ('bat-youth-finisher',             'wide', None),
    ('bat-sledge',                     'wide', None),
    ('bat-nocast',                     'wide', None),
    ('bat-custom-finisher',            'wide', None),
    ('bat-custom-iron',                'wide', None),
    # Shot much steeper than the rest of the family; bring it into line.
    ('bat-stringking-metal2',          'wide', -20.0),
    ('bat-skinny-trainer',             'wide', None),
    ('bat-wiffle',                     'wide', None),
    # A barrel detail of the engraving rather than a whole bat. Left at its own
    # angle on purpose — engraved type has to read horizontally.
    ('bat-custom-youth-finisher',      'wide', None),
    ('grip-adult-black',               'tall', None),
    ('grip-youth-orange',              'tall', None),
]


def background_mask(rgb):
    """Flood fill inwards from the border across background-coloured pixels.

    Filling from the edge rather than selecting every dark pixel is what keeps
    the black grip intact — its body is close to BG in value but it is not
    connected to the border.
    """
    h, w = rgb.shape[:2]
    near = np.abs(rgb.astype(int) - BG).max(axis=2) <= TOL

    seen = np.zeros((h, w), bool)
    q = deque()

    for x in range(w):
        for y in (0, h - 1):
            if near[y, x] and not seen[y, x]:
                seen[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if near[y, x] and not seen[y, x]:
                seen[y, x] = True
                q.append((y, x))

    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and near[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                q.append((ny, nx))

    return seen


def stage(name, kind, rotate_to):
    src = os.path.join(IMG, name + '.jpg')
    if not os.path.exists(src):
        print('  skip (no source): %s' % name)
        return

    im = Image.open(src).convert('RGB')
    rgb = np.asarray(im)

    alpha = (~background_mask(rgb) * 255).astype(np.uint8)
    cut = im.convert('RGBA')
    cut.putalpha(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(FEATHER)))

    if rotate_to is not None:
        ys, xs = np.nonzero(alpha > 40)
        x = xs - xs.mean(); y = ys - ys.mean()
        vals, vecs = np.linalg.eigh(np.cov(np.vstack([x, y])))
        vx, vy = vecs[:, int(np.argmax(vals))]
        ang = np.degrees(np.arctan2(vy, vx))
        if ang > 90: ang -= 180
        if ang < -90: ang += 180
        # PIL rotates counter-clockwise for a positive angle.
        cut = cut.rotate(ang - rotate_to, resample=Image.BICUBIC, expand=True)

    bbox = cut.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()
    if not bbox:
        print('  skip (nothing found): %s' % name)
        return
    cut = cut.crop(bbox)

    cw, ch = STAGE[kind]
    target = FILL * (cw if cw >= ch else ch)
    longest = max(cut.size)
    scale = target / longest
    # Never blow a source up past 2x — past that it is mush, and the honest
    # answer is a better source file.
    scale = min(scale, 2.0)
    new = (max(1, round(cut.width * scale)), max(1, round(cut.height * scale)))
    cut = cut.resize(new, Image.LANCZOS)

    canvas = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
    canvas.alpha_composite(cut, ((cw - cut.width) // 2, (ch - cut.height) // 2))

    out = os.path.join(IMG, name + '.png')
    canvas.save(out, optimize=True)
    print('  %-32s %sx%s  subject %sx%s (%.2fx)' %
          (name + '.png', cw, ch, cut.width, cut.height, scale))


if __name__ == '__main__':
    print('Staging %d products:' % len(PRODUCTS))
    for name, kind, rot in PRODUCTS:
        stage(name, kind, rot)
    print('Done.')
