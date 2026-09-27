import json

with open('d:/PINBOARD-GIT/scratch/extracted_keywords.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for item in data:
    if item['matches']:
        print(f"[{item['index']:03d}] {item['filename']} -> Matches: {item['matches']}")
    else:
        print(f"[{item['index']:03d}] {item['filename']} -> NO DIRECT MATCH")
