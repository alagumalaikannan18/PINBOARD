import json
import os
import cv2
import numpy as np

with open('scratch/products_list.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

# Map every unique image path to product metadata
image_map = {}
for p in products:
    p_id = p['id']
    title = p['title']
    for img in p.get('images', []):
        if img not in image_map:
            image_map[img] = []
        image_map[img].append((p_id, title))

all_images = sorted(image_map.keys())
print(f"Total unique images to inspect: {len(all_images)}")

# Function to check if image is a wall mockup and determine crop box
def inspect_image(img_path):
    if not os.path.exists(img_path):
        return {'status': 'MISSING', 'crop': None}
    
    img = cv2.imread(img_path)
    if img is None:
        return {'status': 'UNREADABLE', 'crop': None}
    
    h, w, c = img.shape
    
    # 1. Sample 4 outer border strips (top 5%, bottom 5%, left 5%, right 5%)
    top_strip = img[:int(h*0.05), :]
    bottom_strip = img[-int(h*0.05):, :]
    left_strip = img[:, :int(w*0.05)]
    right_strip = img[:, -int(w*0.05):]
    
    # Check if border strips are uniform wall color or have wall lighting
    # In mockups, the border region (wall) is warm beige/gray: R, G, B are high (>120) and close to each other
    # Or in template A (1200x1600): wall BGR ~ [140-210, 150-215, 160-225]
    
    border_pixels = np.vstack([
        top_strip.reshape(-1, 3),
        bottom_strip.reshape(-1, 3),
        left_strip.reshape(-1, 3),
        right_strip.reshape(-1, 3)
    ])
    
    b_mean, g_mean, r_mean = np.mean(border_pixels, axis=0)
    
    # Check bottom center area (y=85..95%, x=30..70%) for VYON POSTERZ or empty wall space
    bottom_center = img[int(h*0.85):int(h*0.95), int(w*0.3):int(w*0.7)]
    bc_b, bc_g, bc_r = np.mean(bottom_center, axis=(0,1))
    
    # Check if image is 1200x1600 New Project template or similar
    if w == 1200 and h == 1600 and r_mean > 120 and g_mean > 120:
        # Standard crop box for 1200x1600 wall mockup:
        # x1=255, y1=285, x2=945, y2=1205 => (w=690, h=920, ratio=0.75)
        return {'status': 'MOCKUP', 'type': '1200x1600', 'crop': [255, 285, 945, 1205]}
    
    # Check 1200x1697 poster/opt template (or similar aspect ~ 0.707)
    # In 1200x1697 mockups, the frame is centered:
    # Let's inspect if border pixels are wall color (R>140, G>140, B>120)
    if (120 <= b_mean <= 225) and (130 <= g_mean <= 230) and (140 <= r_mean <= 235):
        # Check if there is frame/wall transition around y=200-300 and y=1200-1400
        # Let's check center region (x=300..900, y=300..1300) vs outer border
        center_region = img[int(h*0.25):int(h*0.75), int(w*0.25):int(w*0.75)]
        center_std = np.std(center_region)
        border_std = np.std(border_pixels)
        
        # In mockups, center_std (poster artwork) is high (>30), border_std (wall) is lower (<40)
        # Also check if there's wall below poster (bottom center is wall color)
        if (130 <= bc_r <= 235) and (120 <= bc_g <= 230) and (110 <= bc_b <= 225):
            # It's a wall mockup!
            # Let's determine exact frame coordinates for this canvas size:
            # If w=1200, h=1697:
            # Frame inner poster box in 1200x1697 template:
            # Let's find precise crop boundaries for 1200x1697 or (w, h)
            x1 = int(w * 0.2125) # ~ 255 for 1200
            y1 = int(h * 0.178)  # ~ 302 for 1697
            x2 = int(w * 0.7875) # ~ 945 for 1200
            y2 = int(h * 0.755)  # ~ 1281 for 1697
            return {'status': 'MOCKUP', 'type': f'{w}x{h}', 'crop': [x1, y1, x2, y2]}
    
    # Check 800x1131 or similar template
    if (120 <= bc_r <= 235) and (120 <= bc_g <= 230) and (110 <= bc_b <= 225) and (r_mean > 130):
        x1 = int(w * 0.2125)
        y1 = int(h * 0.178)
        x2 = int(w * 0.7875)
        y2 = int(h * 0.755)
        return {'status': 'MOCKUP', 'type': f'{w}x{h}', 'crop': [x1, y1, x2, y2]}
    
    return {'status': 'CLEAN', 'type': f'{w}x{h}', 'crop': None}

inspection_results = {}
mockups = []
cleans = []

for img_path in all_images:
    res = inspect_image(img_path)
    res['products'] = image_map[img_path]
    inspection_results[img_path] = res
    if res['status'] == 'MOCKUP':
        mockups.append(img_path)
    else:
        cleans.append(img_path)

print(f"\nTotal mockups detected: {len(mockups)}")
print(f"Total clean images detected: {len(cleans)}")

with open('scratch/all_154_inspected.json', 'w', encoding='utf-8') as f:
    json.dump(inspection_results, f, indent=2)

print("Saved scratch/all_154_inspected.json")
