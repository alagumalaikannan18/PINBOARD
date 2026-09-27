import cv2
import os

test_files = ['1554016.png', 'poster/opt/1554016.webp']

os.makedirs('scratch/preview_800', exist_ok=True)

for tf in test_files:
    if not os.path.exists(tf):
        continue
    img = cv2.imread(tf)
    h, w, _ = img.shape
    # Crop box for 800x1131 template: [201:853, 170:630]
    crop = img[201:853, 170:630]
    out_name = os.path.basename(tf).replace('.png', '_crop.png').replace('.webp', '_crop.png')
    cv2.imwrite(os.path.join('scratch/preview_800', out_name), crop)
    print(f"Cropped {tf} -> {out_name} (shape: {crop.shape})")
