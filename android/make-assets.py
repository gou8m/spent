"""Builds the launcher / splash artwork the Android wrapper app uses, into android/res-overrides/.

The website serves the icon as a full-bleed green square with a white "S." (icons/maskable-512). That is
right for a web manifest but wrong for an Android adaptive icon and for the splash screen: used as-is it
fills the whole circle / screen. This script lifts the white "S." out of it (transparent background) and
re-draws it at the right size:

  - ic_launcher_foreground.png (5 densities): the "S." at 40% of the 108dp adaptive-icon canvas, centred
    in the safe zone; the green background is a colour (see apply-overrides.cjs).
  - splash.png: a 512px transparent canvas with a small "S." (20% wide). The Chrome-hosted splash scales
    the image up (about 1.45x on a phone), so this lands at roughly a quarter of the screen width.

Usage:  python android/make-assets.py <path to maskable-512.png>
Needs Pillow.
"""
import os
import sys
from PIL import Image

src_path = sys.argv[1] if len(sys.argv) > 1 else None
if not src_path:
    sys.exit("usage: make-assets.py <maskable-512.png>")

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "res-overrides")
src = Image.open(src_path).convert("RGB")
green = src.getpixel((4, 4))
base = sum(green) / 3

alpha = Image.new("L", src.size)
px, ap = src.load(), alpha.load()
for y in range(src.size[1]):
    for x in range(src.size[0]):
        lum = sum(px[x, y]) / 3
        ap[x, y] = max(0, min(255, int((lum - base) / (255 - base) * 255)))
glyph = alpha.crop(alpha.getbbox())


def place(canvas_px: int, width_fraction: float) -> Image.Image:
    w = int(canvas_px * width_fraction)
    g = glyph.resize((w, int(glyph.size[1] * w / glyph.size[0])), Image.LANCZOS)
    layer = Image.merge("LA", (Image.new("L", g.size, 255), g))
    canvas = Image.new("LA", (canvas_px, canvas_px), (255, 0))
    canvas.paste(layer, ((canvas_px - g.size[0]) // 2, (canvas_px - g.size[1]) // 2))
    return canvas.convert("RGBA")


for density, size in {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}.items():
    out = os.path.join(root, f"drawable-{density}")
    os.makedirs(out, exist_ok=True)
    place(size, 0.40).save(os.path.join(out, "ic_launcher_foreground.png"))

out = os.path.join(root, "drawable-xxxhdpi")
os.makedirs(out, exist_ok=True)
place(512, 0.20).save(os.path.join(out, "splash.png"))
print("wrote", root)
