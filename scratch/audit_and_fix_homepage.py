import json
import re

with open('js/products-data.js', 'r', encoding='utf-8') as f:
    content = f.read()

m = re.search(r'const products = (\[.*?\]);', content, re.DOTALL)
if not m:
    print("Could not parse products array")
    exit(1)

products = json.loads(m.group(1))
prod_map = {p['id']: p for p in products}

print(f"Total products loaded: {len(products)}")

# Verify specific key products
hero_ids = [55, 123, 70, 109]
col_ids = [27, 48, 114, 51, 91, 104]
bestseller_ids = [17, 20, 47, 29]
space3d_ids = [1, 34, 33, 39, 44]

all_home_ids = hero_ids + col_ids + bestseller_ids + space3d_ids
print(f"Total Home Product IDs: {len(all_home_ids)}")
unique_home_ids = set(all_home_ids)
print(f"Unique Home Product IDs: {len(unique_home_ids)}")

if len(all_home_ids) != len(unique_home_ids):
    print("ERROR: Duplicate IDs found in Home sections!")
else:
    print("✔ PASS: Zero duplicate IDs across Home sections!")

for pid in all_home_ids:
    p = prod_map.get(pid)
    if not p:
        print(f"ERROR: Product #{pid} missing from catalog!")
    else:
        print(f"  ID #{p['id']}: {p['title']} | Cat: {p['category']} | Img: {p['images'][0]}")
