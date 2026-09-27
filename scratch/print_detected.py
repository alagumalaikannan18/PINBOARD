import json

with open('d:/PINBOARD-GIT/scratch/detected_entities.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

detected_count = 0
for item in data:
    if item['detectedCategory']:
        detected_count += 1
        print(f"[{item['index']:03d}] {item['filename']} -> {item['detectedCategory']} | {item['detectedSubject']} | {item['detectedSubcategory']}")

print(f"\nTotal detected: {detected_count} / {len(data)}")
