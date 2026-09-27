import os
import glob
from PIL import Image
import numpy as np

new_posters = sorted(glob.glob('new_posters/*.png'))
existing_opt = sorted(glob.glob('poster/opt/*.webp'))

print(f"Comparing {len(new_posters)} new posters against {len(existing_opt)} existing poster/opt/ files...")

def get_fingerprint(img_path):
    img = Image.open(img_path).convert('L').resize((64, 64), Image.Resampling.LANCZOS)
    return np.array(img, dtype=np.float32)

new_fps = {p: get_fingerprint(p) for p in new_posters}

for p_path, p_fp in new_fps.items():
    p_name = os.path.basename(p_path)
    matches = []
    for ext_path in existing_opt:
        try:
            ext_fp = get_fingerprint(ext_path)
            mse = np.mean((p_fp - ext_fp) ** 2)
            if mse < 100: # threshold for high similarity
                matches.append((os.path.basename(ext_path), round(mse, 2)))
        except Exception as e:
            pass
    if matches:
        print(f"MATCH FOUND for {p_name}: {matches}")
    else:
        print(f"No duplicate found for {p_name} (Unique)")
