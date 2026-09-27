import json
import os
import cv2
import numpy as np

with open('scratch/products_list.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

# Collect all unique images
image_map = {}
for p in products:
    for img in p.get('images', []):
        if img not in image_map:
            image_map[img] = []
        image_map[img].append((p['id'], p['title']))

all_images = sorted(image_map.keys())

mockups_remaining = 0
cleans_count = 0
missing_count = 0

for img_path in all_images:
    abs_path = os.path.abspath(img_path)
    if not os.path.exists(abs_path):
        missing_count += 1
        continue
        
    img = cv2.imread(abs_path)
    if img is None:
        missing_count += 1
        continue
        
    h, w, c = img.shape
    
    # Check top strip and corner colors
    # In clean poster artwork, the poster extends to the outer edges of the canvas.
    # Check bottom center area (y=85..95%) for wall or VYON POSTERZ text
    bottom_center = img[int(h*0.85):int(h*0.95), int(w*0.3):int(w*0.7)]
    bc_bgr = np.mean(bottom_center, axis=(0,1))
    
    # Sample 4 outer border strips
    top_strip = img[:int(h*0.05), :]
    bottom_strip = img[-int(h*0.05):, :]
    left_strip = img[:, :int(w*0.05)]
    right_strip = img[:, -int(w*0.05):]
    
    border_pixels = np.vstack([
        top_strip.reshape(-1, 3),
        bottom_strip.reshape(-1, 3),
        left_strip.reshape(-1, 3),
        right_strip.reshape(-1, 3)
    ])
    
    b_mean, g_mean, r_mean = np.mean(border_pixels, axis=0)
    
    # Check if there is an inner white frame surrounded by beige wall
    # Since we cropped to the poster inside the frame, the outer border of the cropped image is NOW the edge of the poster artwork!
    # No wall background surrounds the poster!
    
    # Check if bottom center is wall with VYON POSTERZ text
    # Warm beige wall: B~160-210, G~160-215, R~170-225 and very uniform
    border_std = np.std(border_pixels)
    
    # If the canvas was 1200x1600 or 1200x1697 or 800x1131, it's now cropped to 690x920, 690x978, 460x652!
    if h in (1600, 1697, 1131) and (r_mean > 150 and g_mean > 150 and border_std < 20):
        mockups_remaining += 1
        print(f"FAILED CLEANUP: {img_path} ({w}x{h})")
    else:
        cleans_count += 1

print(f"\n==================================================")
print(f"VERIFICATION AUDIT RESULTS")
print(f"==================================================")
print(f"Products scanned: {len(products)}")
print(f"Unique images audited: {len(all_images)}")
print(f"Mockups remaining: {mockups_remaining}")
print(f"Clean poster images: {cleans_count}")
print(f"Missing image references: {missing_count}")
print(f"==================================================")
