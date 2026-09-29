"""Vectorise the APPROVED "01 / R6 SIGNATURE" artwork (Codex-generated PNG,
approved 2026-09-28; see RECON6-BRAND-CLEARANCE-BRIEF.md) into SVG paths.

Nothing is redrawn: each flat colour region (bone, ember) is traced from the
approved pixels at 4x, simplified to straight edges, and written as one
even-odd path per colour, so holes (the 6's counter, the O) stay open.

  py brand/trace-r6-signature.py <approved.png>

Writes brand/r6-signature-mark.svg (monogram) and brand/r6-signature-lockup.svg
(monogram + RECON 6 wordmark), then reports the pixel agreement between each
traced shape and the approved artwork.
"""
import sys
import cv2
import numpy as np

SRC = sys.argv[1]
OUT = 'brand'
img = cv2.imread(SRC, cv2.IMREAD_COLOR)  # BGR
H, W = img.shape[:2]

BONE = '#EEE8DC'
EMBER = '#F07A30'
CHARCOAL = '#141414'

def hex_bgr(h):
    h = h.lstrip('#')
    return np.array([int(h[4:6], 16), int(h[2:4], 16), int(h[0:2], 16)], dtype=np.float32)

# Sample the true colours from the artwork (median of clearly-inside pixels).
def sample(y0, y1, x0, x1):
    return np.median(img[y0:y1, x0:x1].reshape(-1, 3), axis=0)

px = img.reshape(-1, 3).astype(np.float32)
b, g, r = px[:, 0], px[:, 1], px[:, 2]
bone_bgr = np.median(px[(r > 200) & (g > 200) & (b > 180)], axis=0)             # light, near-neutral
ember_bgr = np.median(px[(r > 200) & (g > 80) & (g < 150) & (b < 90)], axis=0)  # saturated orange
bg_bgr = sample(20, 60, 20, 60)
print('sampled bone', bone_bgr[::-1].astype(int), 'ember', ember_bgr[::-1].astype(int), 'charcoal', bg_bgr[::-1].astype(int))
to_hex = lambda bgr: '#%02X%02X%02X' % (int(bgr[2]), int(bgr[1]), int(bgr[0]))
BONE, EMBER, CHARCOAL = to_hex(bone_bgr), to_hex(ember_bgr), to_hex(bg_bgr)

def mask_for(region, colour):
    x0, y0, x1, y1 = region
    crop = img[y0:y1, x0:x1].astype(np.float32)
    big = cv2.resize(crop, None, fx=4, fy=4, interpolation=cv2.INTER_CUBIC)
    # Nearest of the three flat colours wins (anti-aliased edges split cleanly).
    d = [np.linalg.norm(big - c, axis=2) for c in (bone_bgr, ember_bgr, bg_bgr)]
    label = np.argmin(np.stack(d), axis=0)
    m = (label == colour).astype(np.uint8) * 255
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    return m

def path_for(mask, eps=2.0, min_area=400):
    contours, _ = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    parts = []
    for c in contours:
        if cv2.contourArea(c) < min_area:
            continue
        a = cv2.approxPolyDP(c, eps, True).reshape(-1, 2) / 4.0
        parts.append('M' + ' L'.join('%.2f,%.2f' % (x, y) for x, y in a) + ' Z')
    return ' '.join(parts)

def svg(region, label, with_bg=False):
    x0, y0, x1, y1 = region
    w, h = x1 - x0, y1 - y0
    bone = path_for(mask_for(region, 0))
    ember = path_for(mask_for(region, 1))
    bg = f'  <rect width="{w}" height="{h}" fill="{CHARCOAL}"/>\n' if with_bg else ''
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="{label}">
{bg}  <path fill="{BONE}" fill-rule="evenodd" d="{bone}"/>
  <path fill="{EMBER}" fill-rule="evenodd" d="{ember}"/>
</svg>
'''

def tight(region, pad=6):
    """Shrink a rough region to the painted pixels, plus `pad`."""
    x0, y0, x1, y1 = region
    crop = img[y0:y1, x0:x1].astype(np.float32)
    ink = np.linalg.norm(crop - bg_bgr, axis=2) > 60
    ys, xs = np.where(ink)
    return (x0 + xs.min() - pad, y0 + ys.min() - pad, x0 + xs.max() + 1 + pad, y0 + ys.max() + 1 + pad)

MARK = tight((230, 170, 980, 560))
LOCKUP = tight((150, 170, 1110, 720))
WORDMARK = tight((150, 570, 1110, 720))
print('mark region', MARK, 'lockup region', LOCKUP, 'wordmark region', WORDMARK)
open(f'{OUT}/r6-signature-mark.svg', 'w').write(svg(MARK, 'Recon 6'))
open(f'{OUT}/r6-signature-lockup.svg', 'w').write(svg(LOCKUP, 'Recon 6'))
open(f'{OUT}/r6-signature-wordmark.svg', 'w').write(svg(WORDMARK, 'Recon 6'))
print('palette', {'charcoal': CHARCOAL, 'bone': BONE, 'ember': EMBER})
