# Advance widths (em) for static Nunito instances: python3 measure.py <dir> -> {"700": {"a": 0.55, ...}, ...}
import json, sys
from fontTools.ttLib import TTFont
base = sys.argv[1]
out = {}
for w in (600, 700, 800, 900, 950):
    f = TTFont(f"{base}/Nunito-{w}.ttf")
    cmap = f.getBestCmap(); hmtx = f['hmtx']; upem = f['head'].unitsPerEm
    out[w] = {ch: hmtx[cmap[ord(ch)]][0] / upem for ch in map(chr, range(32, 0x2100)) if ord(ch) in cmap}
json.dump(out, sys.stdout)
