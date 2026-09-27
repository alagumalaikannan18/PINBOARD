import json

with open('d:/PINBOARD-GIT/scratch/parsed_build_catalog.json', 'r', encoding='utf-8') as f:
    catalog = json.load(f)

print(f"Total curated entries: {len(catalog)}")

cat_counts = {}
for p in catalog:
    cat = p.get('category', 'Unassigned')
    cat_counts[cat] = cat_counts.get(cat, 0) + 1

print("Categories in curated catalog:", cat_counts)
