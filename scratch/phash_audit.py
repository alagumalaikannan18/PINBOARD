import os
import glob
from PIL import Image
import numpy as np

def compute_ahash(image, hash_size=8):
    # Average hash
    image = image.convert('L').resize((hash_size, hash_size), Image.Resampling.LANCZOS)
    pixels = np.array(image.getdata(), dtype=float)
    avg = pixels.mean()
    bits = pixels > avg
    return sum([2 ** i for (i, v) in enumerate(bits.flatten()) if v])

def compute_dhash(image, hash_size=8):
    # Difference hash
    image = image.convert('L').resize((hash_size + 1, hash_size), Image.Resampling.LANCZOS)
    pixels = np.array(image.getdata()).reshape((hash_size, hash_size + 1))
    diff = pixels[:, 1:] > pixels[:, :-1]
    return sum([2 ** i for (i, v) in enumerate(diff.flatten()) if v])

def hamming_distance(h1, h2):
    x = h1 ^ h2
    return bin(x).count('1')

poster_dir = 'all_new_poster_no_repeated_poster'
files = [f for f in os.listdir(poster_dir) if os.path.isfile(os.path.join(poster_dir, f))]

print(f"Loaded {len(files)} files.")

hashes = []
for f in files:
    filepath = os.path.join(poster_dir, f)
    try:
        img = Image.open(filepath)
        ah = compute_ahash(img)
        dh = compute_dhash(img)
        hashes.append({'filename': f, 'path': filepath, 'ahash': ah, 'dhash': dh, 'img_size': img.size})
    except Exception as e:
        print(f"Error processing {f}: {e}")

print("Checking for exact or near-visual duplicates (Hamming Distance <= 3)...")
exact_ahash_dupes = []
near_dupes = []

for i in range(len(hashes)):
    for j in range(i + 1, len(hashes)):
        h1 = hashes[i]
        h2 = hashes[j]
        adist = hamming_distance(h1['ahash'], h2['ahash'])
        ddist = hamming_distance(h1['dhash'], h2['dhash'])
        
        if adist == 0 and ddist == 0:
            exact_ahash_dupes.append((h1['filename'], h2['filename'], adist, ddist))
        elif adist <= 3 or ddist <= 3:
            near_dupes.append((h1['filename'], h2['filename'], adist, ddist))

print(f"\nExact visual hash duplicates (distance 0): {len(exact_ahash_dupes)}")
for f1, f2, ad, dd in exact_ahash_dupes:
    print(f"  EXACT VISUAL MATCH: {f1} <==> {f2} (aDist: {ad}, dDist: {dd})")

print(f"\nNear visual duplicates (distance <= 3): {len(near_dupes)}")
for f1, f2, ad, dd in near_dupes:
    print(f"  NEAR VISUAL MATCH: {f1} <==> {f2} (aDist: {ad}, dDist: {dd})")
