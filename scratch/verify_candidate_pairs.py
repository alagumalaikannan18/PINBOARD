import os
import json
from PIL import Image
import numpy as np

poster_dir = 'all_new_poster_no_repeated_poster'

def eval_js_products():
    with open('js/products-data.js', 'r', encoding='utf-8') as f:
        content = f.read()
    # parse simple json array from PINBOARD_PRODUCTS = [...]
    start = content.find('globalScope.PINBOARD_PRODUCTS = [')
    if start == -1:
        start = content.find('PINBOARD_PRODUCTS = [')
    sub = content[content.find('[', start):]
    # find ending bracket
    end = sub.rfind('];')
    json_str = sub[:end+1]
    return json.loads(json_str)

products = eval_js_products()
file_to_product = {}
for p in products:
    img = p['images'][0] if 'images' in p else p.get('image', '')
    fname = os.path.basename(img)
    file_to_product[fname] = p

candidate_pairs = [
    ("1513642.png", "1554029.png"),
    ("1514179.png", "A4 Posters [55573EA].png"),
    ("1554029.png", "1555762.png"),
    ("1554532.png", "1555986.png"),
    ("1555899.png", "A4 Posters [5FE0EB5].png"),
    ("1556996.png", "file_00000000d1a482118837991a9779439a.png"),
    ("1557084.png", "A4 Posters [697243A].png")
]

for f1, f2 in candidate_pairs:
    p1 = os.path.join(poster_dir, f1)
    p2 = os.path.join(poster_dir, f2)
    img1 = Image.open(p1).convert('RGB')
    img2 = Image.open(p2).convert('RGB')
    
    # compare at 128x128 resolution
    i1 = img1.resize((128, 128))
    i2 = img2.resize((128, 128))
    arr1 = np.array(i1, dtype=float)
    arr2 = np.array(i2, dtype=float)
    diff = np.mean(np.abs(arr1 - arr2))
    
    prod1 = file_to_product.get(f1, {})
    prod2 = file_to_product.get(f2, {})
    
    print(f"\n==========================================")
    print(f"PAIR: {f1}  <===>  {f2}")
    print(f"Mean RGB Diff: {diff:.2f}")
    print(f"Product 1 (ID {prod1.get('id')}): \"{prod1.get('title')}\"")
    print(f"Product 2 (ID {prod2.get('id')}): \"{prod2.get('title')}\"")
    if diff < 5.0:
        print(">>> STATUS: CONFIRMED VISUAL DUPLICATE (Identical poster artwork!)")
    else:
        print(">>> STATUS: DIFFERENT ARTWORK (Distinct visual posters with similar composition/colors)")
