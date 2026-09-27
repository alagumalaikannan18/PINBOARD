import json

with open('scratch/artwork_groups.json', 'r', encoding='utf-8') as f:
    groups = json.load(f)

with open('scratch/products_list.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

product_map = {p['id']: p for p in products}

print(f"Total groups: {len(groups)}")

duplicate_count = 0
for idx, g in enumerate(groups, 1):
    if len(g) > 1:
        duplicate_count += 1
        print(f"\nDuplicate Group {duplicate_count} (IDs: {g}):")
        for pid in g:
            p = product_map.get(pid, {})
            print(f"  ID {p.get('id'):3d}: '{p.get('title')}' | Image: {p.get('images', [''])[0]}")
