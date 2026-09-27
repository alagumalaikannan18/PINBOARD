import re
import json

with open('js/products-data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all JSON object blocks inside PINBOARD_PRODUCTS
# Each product has "id": X
matches = list(re.finditer(r'\{\s*"id":\s*(\d+)[\s\S]*?\n  \}', content))

print(f"Found {len(matches)} raw product matches.")

products_by_id = {}

for m in matches:
    raw_obj = m.group(0)
    try:
        obj = json.loads(raw_obj)
        pid = obj['id']
        if pid not in products_by_id:
            products_by_id[pid] = obj
    except Exception as e:
        # Retry with looser parse if needed
        pass

print(f"Extracted {len(products_by_id)} unique products (IDs: {min(products_by_id.keys())} to {max(products_by_id.keys())})")

# Ensure products 1 to 158 are all present
sorted_products = [products_by_id[pid] for pid in sorted(products_by_id.keys())]

# Serialize array cleanly
formatted_array = json.dumps(sorted_products, indent=2)

# Now locate the start of PINBOARD_PRODUCTS and end of PINBOARD_PRODUCTS
start_idx = content.find('var PINBOARD_PRODUCTS = [')
end_idx = content.find('function getSaleableProducts')
last_close = content.rfind('];', start_idx, end_idx)

if start_idx == -1 or end_idx == -1 or last_close == -1:
    print("CRITICAL: Failed to locate array boundaries.")
    exit(1)

new_content = content[:start_idx] + 'var PINBOARD_PRODUCTS = ' + formatted_array + ';\n\n' + content[end_idx:]

with open('js/products-data.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"SUCCESS: Rewrote PINBOARD_PRODUCTS in js/products-data.js with {len(sorted_products)} clean unique products!")
