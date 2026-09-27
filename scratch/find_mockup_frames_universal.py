import os
import json
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
print(f"Total unique product images: {len(all_images)}")

os.makedirs('scratch/all_previews', exist_ok=True)

# Let's inspect each image for the inner poster frame
# In mockups, the frame border (white line or white matting) forms a rectangular boundary around the poster.
# Let's detect the inner poster rectangle for any image that contains a wall mockup.

def detect_mockup_and_crop(img_path):
    if not os.path.exists(img_path):
        return {'status': 'MISSING'}
    
    img = cv2.imread(img_path)
    if img is None:
        return {'status': 'UNREADABLE'}
    
    h, w, c = img.shape
    
    # 1. Standard template check by dimensions and known mockup filenames:
    # Known mockup filenames or templates:
    # - New Project 22 [...] -> 1200x1600 mockup template: crop [285:1205, 255:945]
    # - 1553031.webp -> 1200x1697 mockup: crop [302:1280, 255:945]
    # - 1553031.jpg.jpeg -> 2480x3508 mockup: scale crop accordingly [625:2646, 527:1953]
    # - 1553164.webp / 1553164.jpg.jpeg -> 800x1131 mockup: crop [201:853, 170:630]
    
    # Let's check for white frame border / matting in the image:
    # A white frame border has high brightness (R>200, G>200, B>200) forming a rectangle near x=20-25% and y=15-25%.
    
    # Let's check if the image has the 1200x1600 template:
    if w == 1200 and h == 1600:
        return {
            'is_mockup': True,
            'crop': {'left': 255, 'top': 285, 'width': 690, 'height': 920},
            'type': '1200x1600'
        }
    
    # Let's check if the image has the 1200x1697 template:
    # In 1200x1697 mockup images:
    # Let's check if there is a white frame at y=280..310 and x=240..270
    region_tl = img[280:320, 240:270]
    has_white_border_tl = np.any((region_tl[:, :, 0] > 180) & (region_tl[:, :, 1] > 180) & (region_tl[:, :, 2] > 180))
    
    # Check bottom center area (y=85..95%) for wall or VYON POSTERZ text
    bc = img[int(h*0.85):int(h*0.95), int(w*0.3):int(w*0.7)]
    bc_bgr = np.mean(bc, axis=(0,1))
    
    # If it's 1200x1697 and has white frame / wall:
    if w == 1200 and h == 1697 and (has_white_border_tl or '1553031' in img_path):
        return {
            'is_mockup': True,
            'crop': {'left': 255, 'top': 302, 'width': 690, 'height': 978},
            'type': '1200x1697'
        }
    
    # If 800x1131 mockup (scaled version of 1200x1697):
    if w == 800 and h == 1131 and (has_white_border_tl or '155' in img_path or 'New Project' in img_path):
        # Check if border has wall or frame
        return {
            'is_mockup': True,
            'crop': {'left': 170, 'top': 201, 'width': 460, 'height': 652},
            'type': '800x1131'
        }
    
    # Check general 2480x3508 (high-res 1200x1697)
    if w == 2480 and h == 3508 and '1553031' in img_path:
        return {
            'is_mockup': True,
            'crop': {'left': 527, 'top': 625, 'width': 1426, 'height': 2021},
            'type': '2480x3508'
        }
        
    return {'is_mockup': False, 'type': f'{w}x{h}'}

results = {}
mockups = []
cleans = []

for img_path in all_images:
    res = detect_mockup_and_crop(img_path)
    res['products'] = image_map[img_path]
    results[img_path] = res
    if res.get('is_mockup'):
        mockups.append(img_path)
    else:
        cleans.append(img_path)

print(f"Mockups count: {len(mockups)}")
print(f"Cleans count: {len(cleans)}")

with open('scratch/universal_mockups_audit.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2)

print("Saved scratch/universal_mockups_audit.json")
