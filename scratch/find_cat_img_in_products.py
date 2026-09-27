import json

with open('scratch/products_list.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

for p in products:
    for img in p.get('images', []):
        if 'cat_' in img:
            print(f"Product ID {p['id']}: {p['title']} has cat_ image: {img}")
