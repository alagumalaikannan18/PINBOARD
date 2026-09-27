import os
import glob
import cv2
import numpy as np

def inspect_file(fpath):
    if not os.path.exists(fpath):
        return None
    img = cv2.imread(fpath)
    if img is None:
        return None
    h, w, _ = img.shape
    
    # Check top strip and corner colors
    corner_bgr = img[10, 10].tolist()
    
    return {
        'path': fpath,
        'shape': (w, h),
        'aspect': round(w/h, 3),
        'corner_bgr': corner_bgr
    }

print("--- Inspecting poster/Posters sample ---")
for f in sorted(glob.glob('poster/Posters/*.*'))[:10]:
    print(inspect_file(f))

print("\n--- Inspecting poster/drive sample ---")
for f in sorted(glob.glob('poster/drive/*.*'))[:10]:
    print(inspect_file(f))
