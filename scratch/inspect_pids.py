import json

with open('scratch/products_list.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

print(f"Total products: {len(products)}")
ids = [p['id'] for p in products]
print(f"Unique IDs: {len(set(ids))}")
print(f"Min ID: {min(ids)}, Max ID: {max(ids)}")
missing_ids = [i for i in range(1, 153) if i not in ids]
print(f"Missing IDs in range 1..152: {missing_ids}")
