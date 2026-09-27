import json

with open('scratch/crop_test_results.json', 'r', encoding='utf-8') as f:
    results = json.load(f)

mockups = [r for r in results if r.get('status') == 'MOCKUP']
cleans = [r for r in results if r.get('status') == 'CLEAN']
missing = [r for r in results if r.get('status') == 'MISSING']

print(f"Total entries: {len(results)}")
print(f"Mockups count: {len(mockups)}")
print(f"Cleans count: {len(cleans)}")
print(f"Missing count: {len(missing)}")

print("\n--- ALL MOCKUP IMAGES DETECTED ---")
for idx, m in enumerate(mockups, 1):
    print(f"{idx:2d}. {m['imgPath']} ({m['type']})")

print("\n--- SAMPLE CLEAN IMAGES ---")
for idx, c in enumerate(cleans[:20], 1):
    print(f"{idx:2d}. {c['imgPath']} ({c['type']})")
