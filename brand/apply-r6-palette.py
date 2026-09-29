"""Move the site from the old ice-cyan / purple / navy palette to the approved
R6 signature palette: charcoal #151616, bone #EBE4D7, ember #F07430.

One colour rule, applied in HSL to every hex and rgb()/rgba() literal:
  - cyan accents (hue 165-200, saturated)  -> ember hue, same lightness
  - purple (hue 245-300)                   -> warm sand/bone, same lightness
  - navy darks (dark, hue 195-250)         -> charcoal, same lightness
  - cool greys / cool near-whites          -> warm greys / bone
Semantic colours are left alone: defense blue, attack orange, success green,
danger red, gold, pure white/black. Alpha is preserved.

  py brand/apply-r6-palette.py <file> [<file> ...]
"""
import colorsys
import re
import sys

EMBER_H = 22 / 360
SAND_H = 36 / 360
WARM_H = 38 / 360

def mapped(r, g, b):
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    deg = h * 360
    if s < 0.02 or (r, g, b) in ((255, 255, 255), (0, 0, 0)):
        return None
    # Defense-side blue is semantic (attack orange / defense blue): keep it.
    if 203 <= deg <= 232 and s > 0.55 and 0.45 <= l <= 0.8:
        return None
    if 165 <= deg <= 200 and s > 0.45 and l > 0.25:          # cyan accent
        nh, nl, ns = EMBER_H, min(max(l, 0.5), 0.86) if l < 0.5 else l, min(s, 0.86)
    elif 245 <= deg <= 300 and s > 0.3:                      # purple
        nh, nl, ns = SAND_H, max(l, 0.55), 0.42
    elif l < 0.2 and 180 <= deg <= 260:                      # navy dark -> charcoal
        nh, nl, ns = WARM_H, l, min(s, 0.04)
    elif 190 <= deg <= 260 and s < 0.35:                     # cool grey / near-white
        nh, nl, ns = WARM_H, l, min(max(s, 0.1), 0.2) if l > 0.8 else min(s, 0.1)
    elif 165 <= deg <= 200 and l <= 0.25:                    # very dark teal -> charcoal
        nh, nl, ns = WARM_H, l, 0.04
    else:
        return None
    nr, ng, nb = colorsys.hls_to_rgb(nh, nl, ns)
    return round(nr * 255), round(ng * 255), round(nb * 255)

# Exact brand anchors (so the key tokens land on the approved values).
ANCHORS = {
    (0x00, 0xE5, 0xFF): (0xF0, 0x74, 0x30),
    (0xEC, 0xED, 0xF3): (0xEB, 0xE4, 0xD7),
    (230, 233, 239): (235, 228, 215),
    (0x07, 0x09, 0x0B): (0x15, 0x16, 0x16),
}

HEX = re.compile(r'#([0-9a-fA-F]{6})\b')
RGB = re.compile(r'(rgba?\(\s*)(\d{1,3})(\s*,\s*)(\d{1,3})(\s*,\s*)(\d{1,3})')

def fix_hex(m):
    v = m.group(1)
    rgb = tuple(int(v[i:i + 2], 16) for i in (0, 2, 4))
    out = ANCHORS.get(rgb) or mapped(*rgb)
    if not out:
        return m.group(0)
    s = '#%02X%02X%02X' % out
    return s if v.isupper() else s.lower()

def fix_rgb(m):
    rgb = (int(m.group(2)), int(m.group(4)), int(m.group(6)))
    out = ANCHORS.get(rgb) or mapped(*rgb)
    if not out:
        return m.group(0)
    return f'{m.group(1)}{out[0]}{m.group(3)}{out[1]}{m.group(5)}{out[2]}'

total = 0
for path in sys.argv[1:]:
    src = open(path, encoding='utf-8').read()
    new = RGB.sub(fix_rgb, HEX.sub(fix_hex, src))
    if new != src:
        n = sum(1 for a, b in zip(src.split('\n'), new.split('\n')) if a != b)
        total += n
        open(path, 'w', encoding='utf-8', newline='').write(new)
        print(f'{n:5d} lines  {path}')
print('lines changed:', total)
