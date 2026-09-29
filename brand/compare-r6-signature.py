"""Pixel agreement between the traced SVG renders and the approved artwork.
Each pixel is labelled bone / ember / charcoal by nearest colour in both
images; agreement is reported over the painted (non-charcoal) area."""
import sys
import cv2
import numpy as np

SRC = sys.argv[1]
REGIONS = {'r6-signature-mark': (259, 185, 958, 542), 'r6-signature-lockup': (159, 185, 1092, 706)}
PAL = np.array([[215, 228, 235], [48, 116, 240], [22, 22, 21]], dtype=np.float32)  # BGR bone, ember, charcoal
src = cv2.imread(SRC)

def labels(im):
    d = np.stack([np.linalg.norm(im.astype(np.float32) - c, axis=2) for c in PAL])
    return np.argmin(d, axis=0)

for name, (x0, y0, x1, y1) in REGIONS.items():
    a = labels(src[y0:y1, x0:x1])
    b = labels(cv2.imread(f'brand/{name}.render.png'))
    painted = (a != 2) | (b != 2)
    agree = (a == b) & painted
    print(f'{name}: {agree.sum() / painted.sum() * 100:.2f}% of painted pixels match '
          f'(bone {((a == 0) & (b == 0)).sum()}/{(a == 0).sum()}, ember {((a == 1) & (b == 1)).sum()}/{(a == 1).sum()})')
