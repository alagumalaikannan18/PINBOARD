import json

with open('js/products-data.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Extract JSON array
start_idx = text.find('globalScope.PINBOARD_PRODUCTS = [')
if start_idx == -1:
    start_idx = text.find('PINBOARD_PRODUCTS = [')

arr_start = text.find('[', start_idx)
arr_end = text.find('];\n\nif (typeof module', arr_start)
if arr_end == -1:
    arr_end = text.find('];', arr_start)

json_str = text[arr_start:arr_end+1]
products = json.loads(json_str)

print(f"Loaded {len(products)} products via python JSON parser!")

# Let's save clean products JSON
with open('scratch/products_clean.json', 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2)

print("Saved clean products JSON to scratch/products_clean.json")
