import json

with open('scratch/audit_results.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for img, info in data.items():
    if info.get('status') == 'MOCKUP' or info.get('is_bottom_wall') == True or info.get('is_warm_beige') == True:
        print(f"File: {img}")
        print(f"  Status: {info.get('status')}, WarmBeige: {info.get('is_warm_beige')}, BottomWall: {info.get('is_bottom_wall')}")
        print(f"  Products: {info.get('products')}")
