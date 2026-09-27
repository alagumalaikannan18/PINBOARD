import os
from PIL import Image
import numpy as np

poster_dir = 'all_new_poster_no_repeated_poster'
files = sorted([f for f in os.listdir(poster_dir) if os.path.isfile(os.path.join(poster_dir, f))])

imgs = {}
for f in files:
    path = os.path.join(poster_dir, f)
    im = Image.open(path).convert('RGB').resize((128, 128), Image.Resampling.LANCZOS)
    imgs[f] = np.array(im, dtype=float)

file_keys = list(imgs.keys())
print(f"Scanning {len(file_keys)} images at 128x128 resolution...")

pairs = []
for i in range(len(file_keys)):
    for j in range(i + 1, len(file_keys)):
        f1 = file_keys[i]
        f2 = file_keys[j]
        diff = np.mean(np.abs(imgs[f1] - imgs[f2]))
        if diff < 15.0:
            pairs.append((f1, f2, diff))

pairs.sort(key=lambda x: x[2])
for f1, f2, diff in pairs:
    print(f"Diff: {diff:5.2f} | {f1:<35} <==> {f2}")
