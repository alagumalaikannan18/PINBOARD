import json
import os
import cv2

with open('scratch/universal_mockups_audit.json', 'r', encoding='utf-8') as f:
    results = json.load(f)

mockups = [img for img, res in results.items() if res.get('is_mockup')]
cleans = [img for img, res in results.items() if not res.get('is_mockup')]

print(f"Mockups count: {len(mockups)}")
print(f"Cleans count: {len(cleans)}")

print("\n--- LIST OF ALL 94 CLEAN IMAGES ---")
for idx, img_path in enumerate(cleans, 1):
    prods = results[img_path]['products']
    p_info = ", ".join([f"{p[0]}: {p[1]}" for p in prods])
    print(f"{idx:2d}. {img_path} -> {p_info}")
