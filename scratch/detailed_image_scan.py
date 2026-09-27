import os
import glob
from PIL import Image
import numpy as np

poster_dir = 'all_new_poster_no_repeated_poster'

def inspect_pair(file1, file2):
    p1 = os.path.join(poster_dir, file1)
    p2 = os.path.join(poster_dir, file2)
    img1 = Image.open(p1).convert('RGB')
    img2 = Image.open(p2).convert('RGB')
    
    # Calculate difference
    i1 = img1.resize((100, 100))
    i2 = img2.resize((100, 100))
    arr1 = np.array(i1, dtype=float)
    arr2 = np.array(i2, dtype=float)
    diff = np.mean(np.abs(arr1 - arr2))
    
    print(f"\n--- Comparing {file1} vs {file2} ---")
    print(f"Size 1: {img1.size}, Size 2: {img2.size}")
    print(f"Mean RGB Pixel Difference: {diff:.2f}")
    if diff < 15.0:
        print("=> CONFIRMED VISUAL DUPLICATE (Nearly identical visual content)")
    else:
        print("=> DIFFERENT VISUAL ARTWORK")

candidates = [
    ("1557084.png", "A4 Posters [697243A].png"),
    ("1514179.png", "A4 Posters [55573EA].png"),
    ("1551532 (1).jpg", "1551532.jpg"),
    ("1555899.png", "A4 Posters [5FE0EB5].png"),
    ("1556996.png", "file_00000000d1a482118837991a9779439a.png")
]

for f1, f2 in candidates:
    inspect_pair(f1, f2)
