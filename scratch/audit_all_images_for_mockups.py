import os
import json
import cv2
import numpy as np

with open('scratch/products_list.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

# Collect all unique image paths
image_to_products = {}
for p in products:
    p_id = p['id']
    title = p['title']
    for img in p.get('images', []):
        if img not in image_to_products:
            image_to_products[img] = []
        image_to_products[img].append((p_id, title))

print(f"Total unique product image paths: {len(image_to_products)}")

# Function to check if an image contains wall mockup
def analyze_mockup(img_path):
    if not os.path.exists(img_path):
        return {'status': 'MISSING'}
    
    img = cv2.imread(img_path)
    if img is None:
        return {'status': 'UNREADABLE'}
    
    h, w, c = img.shape
    
    # 1. Check for beige wall background at the edges
    # Top 5% and bottom 5%
    top_strip = img[:int(h*0.05), :]
    bottom_strip = img[-int(h*0.05):, :]
    left_strip = img[:, :int(w*0.05)]
    right_strip = img[:, -int(w*0.05):]
    
    edges_combined = np.vstack([
        top_strip.reshape(-1, 3),
        bottom_strip.reshape(-1, 3),
        left_strip.reshape(-1, 3),
        right_strip.reshape(-1, 3)
    ])
    
    avg_bgr = np.mean(edges_combined, axis=0)
    std_bgr = np.std(edges_combined, axis=0)
    
    # Check if top strip has wall color (BGR warm beige ~ [160-225, 160-225, 170-235])
    # and low color variance across wall
    b, g, r = avg_bgr
    is_warm_beige = (140 <= b <= 220) and (140 <= g <= 225) and (160 <= r <= 235) and (r >= b)
    
    # Also check if bottom center has VYON POSTERZ or wall area below frame
    # In mockups, the frame ends above the bottom (e.g. at ~75-80% height)
    # Let's check brightness and variance at y=85% to y=95%
    bottom_center = img[int(h*0.85):int(h*0.95), int(w*0.2):int(w*0.8)]
    bc_avg = np.mean(bottom_center, axis=(0,1))
    bc_b, bc_g, bc_r = bc_avg
    is_bottom_wall = (140 <= bc_b <= 220) and (140 <= bc_g <= 225) and (160 <= bc_r <= 235)
    
    # Check if there is an inner white frame or sharp contrast boundary in the image
    # In mockups, near (x=20%-25%, y=15%-25%), there is a white frame boundary
    # Let's test if top-left region near x=20%, y=20% has a white frame pixel (R>220, G>220, B>220)
    sample_tl_region = img[int(h*0.12):int(h*0.25), int(w*0.15):int(w*0.30)]
    has_white_frame = np.any((sample_tl_region[:, :, 0] > 210) & (sample_tl_region[:, :, 1] > 210) & (sample_tl_region[:, :, 2] > 210))
    
    is_mockup = (is_warm_beige or is_bottom_wall) and has_white_frame
    
    return {
        'status': 'MOCKUP' if is_mockup else 'CLEAN',
        'width': w,
        'height': h,
        'aspect': round(w/h, 3),
        'avg_bgr': [round(x, 1) for x in avg_bgr],
        'std_bgr': [round(x, 1) for x in std_bgr],
        'is_warm_beige': bool(is_warm_beige),
        'is_bottom_wall': bool(is_bottom_wall),
        'has_white_frame': bool(has_white_frame)
    }

results = {}
mockup_count = 0
clean_count = 0

for img_path, p_info in sorted(image_to_products.items()):
    res = analyze_mockup(img_path)
    res['products'] = p_info
    results[img_path] = res
    if res['status'] == 'MOCKUP':
        mockup_count += 1
    elif res['status'] == 'CLEAN':
        clean_count += 1

print(f"\nAudit Summary:")
print(f"Mockups detected: {mockup_count}")
print(f"Clean images detected: {clean_count}")

with open('scratch/audit_results.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2)

print("Saved scratch/audit_results.json")
