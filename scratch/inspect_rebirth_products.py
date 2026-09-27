import json
import cv2
import numpy as np

with open('scratch/products_list.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

rebirth_prods = [p for p in products if 'rebirth' in (p.get('title', '') + p.get('keywords', '') + ' '.join(p.get('tags', []))).lower()]

print(f"Products matching 'rebirth': {len(rebirth_prods)}")
for p in rebirth_prods:
    print(f"\nID {p['id']}: {p['title']}")
    print(f"  Category: {p.get('category')}, Collection: {p.get('collection')}")
    print(f"  Images: {p.get('images')}")
    print(f"  Tags: {p.get('tags')[:5]}")
