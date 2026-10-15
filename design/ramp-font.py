"""The hero liquid's font: JetBrains Mono cut down to the ASCII ramp, each glyph in its own alpha.

usage: python3 design/ramp-font.py SRC.woff2 OUT.woff2 RAMP STRENGTH

Like the sign-in page's glyph atlas, ramp level i (1 .. n-1) is white at
STRENGTH * (.3 + .7 * i / (n - 1)): faint dots, bright dense glyphs. The alpha lives in the font
(COLR v0 colour layers over a CPAL palette), so a frame is one plain run of text per row instead of
one layer per brightness.
"""
import copy
import sys

from fontTools.colorLib.builder import buildCOLR, buildCPAL
from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont

src, out, ramp, strength = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4])
font = TTFont(src, recalcTimestamp=False)  # the same input always gives the same font
options = Options()
options.layout_features = []
options.hinting = False
subsetter = Subsetter(options)
subsetter.populate(text=ramp)
subsetter.subset(font)

cmap = font.getBestCmap()
glyf, hmtx = font['glyf'], font['hmtx']
steps = len(ramp) - 1
layers, palette = {}, []
for level, char in enumerate(ramp[1:], start=1):
    base = cmap[ord(char)]
    # each colour glyph paints a copy of its own outline in its palette entry
    ink = f'{base}.ink'
    glyf[ink] = copy.deepcopy(glyf[base])
    hmtx[ink] = hmtx[base]
    layers[base] = [(ink, level - 1)]
    palette.append((1.0, 1.0, 1.0, round(strength * (0.3 + 0.7 * level / steps), 4)))
font.setGlyphOrder(glyf.glyphOrder)
font['COLR'] = buildCOLR(layers)
font['CPAL'] = buildCPAL([palette])
font.flavor = 'woff2'
font.save(out)
