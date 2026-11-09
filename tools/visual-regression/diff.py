"""Pixel-diff two screenshot dirs. usage: python diff.py <before> <after> <diffout>"""
import sys, os
from PIL import Image, ImageChops

a_dir, b_dir, out = sys.argv[1:4]
os.makedirs(out, exist_ok=True)
for name in sorted(f for f in os.listdir(a_dir) if f.endswith('.png')):
    pa, pb = os.path.join(a_dir, name), os.path.join(b_dir, name)
    if not os.path.exists(pb):
        print(f'{name}: MISSING in after'); continue
    a, b = Image.open(pa).convert('RGB'), Image.open(pb).convert('RGB')
    if a.size != b.size:
        print(f'{name}: SIZE {a.size} -> {b.size}')
        w, h = min(a.width, b.width), min(a.height, b.height)
        a, b = a.crop((0, 0, w, h)), b.crop((0, 0, w, h))
    d = ImageChops.difference(a, b)
    g = d.convert('L')
    total = g.width * g.height
    hist = g.histogram()
    changed = total - hist[0]
    big = sum(hist[16:])  # perceptible (>~6% channel delta)
    bbox = g.getbbox()
    status = 'IDENTICAL' if changed == 0 else f'changed={changed} ({changed/total:.4%}) perceptible={big} ({big/total:.4%}) bbox={bbox}'
    print(f'{name}: {status}')
    if changed:
        mask = g.point(lambda v: 255 if v > 0 else 0)
        vis = Image.composite(Image.new('RGB', a.size, (255, 0, 255)), a.point(lambda v: v // 3), mask)
        vis.save(os.path.join(out, name))
