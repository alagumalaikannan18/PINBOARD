import os
import glob
import cv2
import numpy as np
from PIL import Image

# List of images from PINBOARD_PRODUCTS or files in poster/ and root
def analyze_image(path):
    if not os.path.exists(path):
        return {"path": path, "exists": False}
    
    img = cv2.imread(path)
    if img is None:
        return {"path": path, "error": "failed to read"}
    
    h, w, c = img.shape
    
    # Sample corner pixels (wall in mockups is near corners)
    corners = [
        img[0, 0], img[0, w-1], img[h-1, 0], img[h-1, w-1],
        img[10, 10], img[10, w-11], img[h-11, 10], img[h-11, w-11]
    ]
    
    avg_corner_bgr = np.mean(corners, axis=0)
    
    # Check bottom center area for VYON POSTERZ or wall background
    bottom_strip = img[int(h*0.85):int(h*0.95), int(w*0.2):int(w*0.8)]
    
    return {
        "path": path,
        "width": w,
        "height": h,
        "aspect_ratio": round(w / h, 3),
        "corner_bgr": avg_corner_bgr.tolist()
    }

# Load js/products-data.js images
import re

with open('js/products-data.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Match image strings in images array
matches = re.findall(r'"images":\s*\[\s*([^\]]+)\]', text)
images = set()
for m in matches:
    imgs = re.findall(r'"([^"]+)"', m)
    for img in imgs:
        images.add(img)

print(f"Total unique images in JS: {len(images)}")
analyzed = [analyze_image(img) for img in sorted(images)]
print("Sample analyzed:", list(analyzed)[:5])
