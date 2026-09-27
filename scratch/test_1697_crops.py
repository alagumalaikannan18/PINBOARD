import cv2
import os

test_files = [
    'poster/opt/1513633.webp',
    'poster/opt/1554018.webp',
    'poster/opt/1556445.webp',
    'poster/opt/1556729.webp',
    'poster/opt/1557012.webp'
]

os.makedirs('scratch/preview_1697', exist_ok=True)

for tf in test_files:
    if not os.path.exists(tf):
        continue
    img = cv2.imread(tf)
    h, w, _ = img.shape
    # Crop box for 1200x1697 template: [302:1280, 255:945]
    crop = img[302:1280, 255:945]
    out_name = os.path.basename(tf).replace('.webp', '_crop.png')
    cv2.imwrite(os.path.join('scratch/preview_1697', out_name), crop)
    print(f"Cropped {tf} -> {out_name} (shape: {crop.shape})")
