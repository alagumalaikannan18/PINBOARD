import json

with open('js/products-data.js', 'r', encoding='utf-8') as f:
    code = f.read()

start_marker = 'var PINBOARD_PRODUCTS = '
end_marker = ';\n\n// ---------- COLLECTION PROFILES'

start_idx = code.find(start_marker)
end_idx = code.find(end_marker)

raw_json = code[start_idx + len(start_marker):end_idx]
products = json.loads(raw_json)

for p in products:
    if p['id'] == 15:
        p['images'] = ['poster/opt/1513632.webp']
        print("Updated Product ID 15 images to poster/opt/1513632.webp")

new_json = json.dumps(products, indent=2)
new_code = code[:start_idx + len(start_marker)] + new_json + code[end_idx:]

with open('js/products-data.js', 'w', encoding='utf-8') as f:
    f.write(new_code)

print("Saved updated js/products-data.js")
