import json
import os
import cv2
import numpy as np
import re

with open('scratch/products_list.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

print(f"Total product records in catalog: {len(products)}")

# Helper to normalize image path to base key (e.g. "1553256_1" or "stay-hard")
def normalize_image_key(img_path):
    if not img_path:
        return ""
    base = os.path.basename(img_path)
    # Strip extension
    base = re.sub(r'\.(png|jpe?g|webp|avif)$', '', base, flags=re.IGNORECASE)
    base = re.sub(r'\.jpg$', '', base, flags=re.IGNORECASE)
    base = re.sub(r'-thumb$', '', base, flags=re.IGNORECASE)
    base = re.sub(r'^poster/opt/', '', base)
    base = re.sub(r'^poster/Posters/', '', base)
    return base.strip().lower()

# Map products by normalized image key
image_key_to_products = {}
for p in products:
    p_id = p['id']
    title = p['title']
    imgs = p.get('images', [])
    primary_img = imgs[0] if imgs else ""
    norm_key = normalize_image_key(primary_img)
    
    if norm_key not in image_key_to_products:
        image_key_to_products[norm_key] = []
    image_key_to_products[norm_key].append(p)

print(f"\nUnique normalized image keys: {len(image_key_to_products)}")

# Check perceptual image similarity / MSE for images across products
image_fingerprints = {}
for p in products:
    p_id = p['id']
    imgs = p.get('images', [])
    if not imgs:
        continue
    img_path = imgs[0]
    if not os.path.exists(img_path):
        continue
    img = cv2.imread(img_path)
    if img is None:
        continue
    # Resize to standard 100x140 for fast hash/fingerprint comparison
    resized = cv2.resize(img, (100, 140))
    # Convert to grayscale
    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
    image_fingerprints[p_id] = gray

# Pairwise MSE comparison to group identical artworks
artwork_groups = []
visited = set()
product_map = {p['id']: p for p in products}
all_pids = sorted(list(product_map.keys()))

for i in range(len(all_pids)):
    pid1 = all_pids[i]
    if pid1 in visited:
        continue
    group = [pid1]
    visited.add(pid1)
    
    gray1 = image_fingerprints.get(pid1)
    norm_key1 = normalize_image_key(product_map[pid1].get('images', [''])[0])
    
    for j in range(i+1, len(all_pids)):
        pid2 = all_pids[j]
        if pid2 in visited:
            continue
            
        norm_key2 = normalize_image_key(product_map[pid2].get('images', [''])[0])
        gray2 = image_fingerprints.get(pid2)
        
        is_duplicate = False
        
        # Rule 1: Exact normalized image key match
        if norm_key1 and norm_key1 == norm_key2:
            is_duplicate = True
            
        # Rule 2: Visual MSE match if both images exist
        elif gray1 is not None and gray2 is not None:
            mse = np.mean((gray1.astype(float) - gray2.astype(float)) ** 2)
            if mse < 250: # Very low MSE threshold => identical artwork
                is_duplicate = True
                
        if is_duplicate:
            group.append(pid2)
            visited.add(pid2)
            
    artwork_groups.append(group)

print(f"\nTotal unique artwork groups detected: {len(artwork_groups)}")
duplicate_groups = [g for g in artwork_groups if len(g) > 1]
print(f"Artwork groups with duplicates: {len(duplicate_groups)}")

print("\n--- SAMPLE DUPLICATE ARTWORK GROUPS ---")
for idx, g in enumerate(duplicate_groups, 1):
    prods = [product_map[pid] for pid in g]
    print(f"\nGroup {idx}: {len(g)} duplicate products:")
    for p in prods:
        print(f"  ID {p['id']:3d}: {p['title']} (img: {p.get('images', [''])[0]})")

with open('scratch/artwork_groups.json', 'w', encoding='utf-8') as f:
    json.dump(artwork_groups, f, indent=2)

print("\nSaved scratch/artwork_groups.json")
