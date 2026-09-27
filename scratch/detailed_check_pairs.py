import os
from PIL import Image
import numpy as np

poster_dir = 'all_new_poster_no_repeated_poster'

def detailed_check(f1, f2):
    p1 = os.path.join(poster_dir, f1)
    p2 = os.path.join(poster_dir, f2)
    img1 = Image.open(p1).convert('RGB')
    img2 = Image.open(p2).convert('RGB')
    
    # Resize to exact same dimensions
    i1 = img1.resize((300, 420), Image.Resampling.LANCZOS)
    i2 = img2.resize((300, 420), Image.Resampling.LANCZOS)
    
    arr1 = np.array(i1, dtype=float)
    arr2 = np.array(i2, dtype=float)
    
    diff = np.mean(np.abs(arr1 - arr2))
    max_diff = np.max(np.abs(arr1 - arr2))
    
    print(f"\n==========================================")
    print(f"Comparing {f1} vs {f2}:")
    print(f"  Mean RGB Diff: {diff:.2f}, Max Diff: {max_diff:.2f}")
    if diff < 8.0:
        print("  => CONFIRMED VISUAL DUPLICATE ARTWORK")
    else:
        print("  => DIFFERENT VISUAL ARTWORK")

detailed_check("1514179.png", "A4 Posters [55573EA].png")
detailed_check("1554532.png", "1555986.png")
