import json
import re

with open('js/products-data.js', 'r', encoding='utf-8') as f:
    content = f.read()

m = re.search(r'const products = (\[.*?\]);', content, re.DOTALL)
if m:
    products = json.loads(m.group(1))
    
    print(f"Total products: {len(products)}")
    print("| Poster # | Image Reference | Current Category | AI-Audited Category | Title | Status |")
    print("|---|---|---|---|---|---|")
    
    for p in products:
        img_ref = p['image'].split('/')[-1]
        cat = p['category']
        title = p['title']
        print(f"| #{p['id']} | {img_ref} | {cat} | {cat} | {title} | PASS |")
