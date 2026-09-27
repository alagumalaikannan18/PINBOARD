import os
import json
from PIL import Image
import numpy as np

poster_dir = 'all_new_poster_no_repeated_poster'

def eval_js_products():
    with open('js/products-data.js', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    # find lines inside PINBOARD_PRODUCTS array
    json_lines = []
    recording = False
    for line in lines:
        if 'PINBOARD_PRODUCTS = [' in line or 'globalScope.PINBOARD_PRODUCTS = [' in line:
            recording = True
            json_lines.append('[\n')
            continue
        if recording:
            if line.strip() == '];':
                json_lines.append(']')
                break
            json_lines.append(line)
    return json.loads(''.join(json_lines))

products = eval_js_products()
print(f"Loaded {len(products)} products from products-data.js")

# Map product ID to image file
prod_by_id = {p['id']: p for p in products}

# Let's inspect images for each product and check for visual similarity
images_data = []
for p in products:
    img_path = p['images'][0] if 'images' in p else p.get('image', '')
    fname = os.path.basename(img_path)
    full_p = os.path.join(poster_dir, fname)
    if os.path.exists(full_p):
        im = Image.open(full_p).convert('RGB')
        # resize for fingerprint
        im_low = im.resize((64, 64), Image.Resampling.LANCZOS)
        arr = np.array(im_low, dtype=float)
        images_data.append({
            'id': p['id'],
            'title': p['title'],
            'category': p['category'],
            'fname': fname,
            'size': im.size,
            'arr': arr
        })
    else:
        print(f"File missing for ID {p['id']}: {fname}")

print(f"Processed {len(images_data)} product images.")

# Check all pairs for visual similarity score
duplicates = []
for i in range(len(images_data)):
    for j in range(i + 1, len(images_data)):
        item1 = images_data[i]
        item2 = images_data[j]
        diff = np.mean(np.abs(item1['arr'] - item2['arr']))
        if diff < 10.0:
            duplicates.append({
                'id1': item1['id'],
                'title1': item1['title'],
                'fname1': item1['fname'],
                'id2': item2['id'],
                'title2': item2['title'],
                'fname2': item2['fname'],
                'diff': diff
            })

print(f"\nFound {len(duplicates)} duplicate/similar visual poster pairs (diff < 10.0):")
for d in duplicates:
    print(f"\n--- DUPLICATE GROUP (Diff: {d['diff']:.2f}) ---")
    print(f"  Product {d['id1']}: \"{d['title1']}\" | Image: {d['fname1']}")
    print(f"  Product {d['id2']}: \"{d['title2']}\" | Image: {d['fname2']}")
