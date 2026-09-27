import json
import os
import cv2
import numpy as np

with open('scratch/audit_results.json', 'r', encoding='utf-8') as f:
    results = json.load(f)

# Let's inspect all results, especially ones classified as CLEAN, to check if any mockups were missed
clean_images = [img for img, res in results.items() if res.get('status') == 'CLEAN']
mockup_images = [img for img, res in results.items() if res.get('status') == 'MOCKUP']

print(f"Mockup images ({len(mockup_images)}):")
for img in mockup_images:
    print(f"  {img} -> products: {results[img]['products']}")

print(f"\nChecking clean images for potential missed mockups...")

# Create directory to save small thumbnails of all images to visually verify if needed
os.makedirs('scratch/thumbnails', exist_ok=True)

potential_missed = []
for img_path in clean_images:
    if not os.path.exists(img_path):
        continue
    img = cv2.imread(img_path)
    if img is None:
        continue
    
    h, w, c = img.shape
    
    # Save thumbnail
    thumb = cv2.resize(img, (150, 200))
    fname = img_path.replace('/', '_').replace('\\', '_') + '.jpg'
    cv2.imwrite(os.path.join('scratch/thumbnails', fname), thumb)
    
    # Check if image has aspect ratio != 0.707 (A-series 3:4 or 1:sqrt(2)) or has white borders or shadows
    # Most clean poster images are either ~0.707 or ~0.75 ratio
    # Let's check if the image has a white border box inside it
    # Check middle top (y=0.1*h, x=0.5*w) vs top-left (x=0, y=0)
    top_left_bgr = img[10, 10].tolist()
    center_bgr = img[h//2, w//2].tolist()
    
    # Check if top-left is beige / neutral wall-like color (R>150, G>140, B>130)
    b, g, r = top_left_bgr
    if (120 <= b <= 220) and (120 <= g <= 225) and (140 <= r <= 235) and (r >= b):
        potential_missed.append({
            'path': img_path,
            'top_left_bgr': top_left_bgr,
            'shape': (w, h),
            'products': results[img_path]['products']
        })

print(f"Potential missed mockup candidates by top-left pixel color: {len(potential_missed)}")
for pm in potential_missed:
    print(pm)
