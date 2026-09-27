import os
import json
import cv2
import numpy as np

with open('scratch/products_list.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

# Collect all images from products
image_map = {}
for p in products:
    for img in p.get('images', []):
        if img not in image_map:
            image_map[img] = []
        image_map[img].append(p['id'])

print(f"Total unique images in products: {len(image_map)}")

# Let's inspect every image file
image_info = []
for img_path, p_ids in image_map.items():
    if not os.path.exists(img_path):
        continue
    img = cv2.imread(img_path)
    if img is None:
        continue
    h, w, c = img.shape
    
    # Sample 4 corners (top-left, top-right, bottom-left, bottom-right)
    tl = img[10, 10].tolist()
    tr = img[10, w-10].tolist()
    bl = img[h-10, 10].tolist()
    br = img[h-10, w-10].tolist()
    
    # Check bottom center area (y=85..95%, x=30..70%) for VYON POSTERZ or wall background
    bottom_center = img[int(h*0.85):int(h*0.95), int(w*0.3):int(w*0.7)]
    bottom_mean = np.mean(bottom_center, axis=(0,1)).tolist()
    
    image_info.append({
        'path': img_path,
        'p_ids': p_ids,
        'w': w,
        'h': h,
        'aspect': round(w/h, 3),
        'tl': tl,
        'tr': tr,
        'bl': bl,
        'br': br,
        'bottom_mean': [round(x,1) for x in bottom_mean]
    })

print(f"Successfully read {len(image_info)} images.")
with open('scratch/image_info.json', 'w', encoding='utf-8') as f:
    json.dump(image_info, f, indent=2)

print("Saved scratch/image_info.json")
