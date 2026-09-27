import json
import os

with open('d:/PINBOARD-GIT/scratch/parsed_build_catalog.json', 'r', encoding='utf-8') as f:
    curated_catalog = json.load(f)

poster_dir = r"d:\PINBOARD-GIT\all_new_poster_no_repeated_poster"
new_files = sorted([f for f in os.listdir(poster_dir) if not f.startswith('.')])

print(f"Curated catalog entries count: {len(curated_catalog)}")
print(f"New poster files count        : {len(new_files)}")

# Map curated catalog by filename base (e.g. 1513605.png -> 1513605)
curated_map = {}
for item in curated_catalog:
    base = os.path.splitext(item['file'])[0]
    curated_map[base] = item
    curated_map[item['file']] = item

matched = []
unmatched = []

for f in new_files:
    base = os.path.splitext(f)[0]
    if f in curated_map:
        matched.append((f, curated_map[f]))
    elif base in curated_map:
        matched.append((f, curated_map[base]))
    else:
        unmatched.append(f)

print(f"\nMatched new files to curated metadata: {len(matched)} / {len(new_files)}")
print(f"Unmatched new files                   : {len(unmatched)}")

if unmatched:
    print("\nUnmatched new files list:")
    for uf in unmatched:
        print("  -", uf)
