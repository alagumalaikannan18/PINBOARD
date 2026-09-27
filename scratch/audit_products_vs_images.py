import json

with open('scratch/universal_mockups_audit.json', 'r', encoding='utf-8') as f:
    audit_data = json.load(f)

with open('scratch/products_list.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

mockup_products = []
clean_products = []

for p in products:
    p_id = p['id']
    title = p['title']
    imgs = p.get('images', [])
    
    p_mockups = []
    p_cleans = []
    for img in imgs:
        info = audit_data.get(img, {})
        if info.get('is_mockup'):
            p_mockups.append((img, info.get('type')))
        else:
            p_cleans.append((img, info.get('type')))
            
    if p_mockups:
        mockup_products.append({
            'id': p_id,
            'title': title,
            'mockup_images': p_mockups,
            'clean_images': p_cleans
        })
    else:
        clean_products.append({
            'id': p_id,
            'title': title,
            'clean_images': p_cleans
        })

print(f"Total Products: {len(products)}")
print(f"Products with mockup images: {len(mockup_products)}")
print(f"Products with only clean images: {len(clean_products)}")

print("\n--- PRODUCTS WITH MOCKUP IMAGES ---")
for p in mockup_products:
    print(f"ID {p['id']:3d}: {p['title']}")
    for img, t in p['mockup_images']:
        print(f"         Mockup img: {img} ({t})")
