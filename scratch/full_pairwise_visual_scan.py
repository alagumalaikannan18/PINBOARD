import os
from PIL import Image
import numpy as np

poster_dir = 'all_new_poster_no_repeated_poster'
files = sorted([f for f in os.listdir(poster_dir) if os.path.isfile(os.path.join(poster_dir, f))])

print(f"Loading and resizing {len(files)} image files...")

imgs = {}
for f in files:
    try:
        path = os.path.join(poster_dir, f)
        im = Image.open(path).convert('RGB').resize((64, 64), Image.Resampling.LANCZOS)
        imgs[f] = np.array(im, dtype=float)
    except Exception as e:
        print(f"Error loading {f}: {e}")

print("Performing pairwise pixel difference comparison...")
dupe_pairs = []

file_keys = list(imgs.keys())
for i in range(len(file_keys)):
    for j in range(i + 1, len(file_keys)):
        f1 = file_keys[i]
        f2 = file_keys[j]
        arr1 = imgs[f1]
        arr2 = imgs[f2]
        diff = np.mean(np.abs(arr1 - arr2))
        if diff < 12.0:
            dupe_pairs.append((f1, f2, diff))

print(f"\nFound {len(dupe_pairs)} confirmed/likely visual duplicate pairs (diff < 12.0):")
for f1, f2, diff in dupe_pairs:
    print(f"  Visual Duplicate: {f1} <==> {f2} (Mean Diff: {diff:.2f})")
