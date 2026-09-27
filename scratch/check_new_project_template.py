import cv2
import os
import glob

np_files = sorted(glob.glob('New Project 22 *.png'))
print(f"Found {len(np_files)} New Project 22 png files:")

os.makedirs('scratch/preview_np', exist_ok=True)

for f in np_files:
    img = cv2.imread(f)
    if img is None:
        continue
    h, w, _ = img.shape
    # Standard crop for 1200x1600 template:
    # Let's inspect if w=1200 and h=1600
    if w == 1200 and h == 1600:
        crop = img[285:1205, 255:945]
        out_name = os.path.basename(f).replace('.png', '_crop.png')
        cv2.imwrite(os.path.join('scratch/preview_np', out_name), crop)
        print(f"Processed {f} -> {out_name} (shape: {crop.shape})")
    else:
        print(f"Non-standard shape for {f}: {w}x{h}")
