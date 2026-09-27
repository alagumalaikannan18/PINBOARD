import sys
sys.stdout.reconfigure(encoding='utf-8')
import os
import json
import easyocr

print("Initializing EasyOCR reader...")
reader = easyocr.Reader(['en'], gpu=False)

poster_dir = r"d:\PINBOARD-GIT\all_new_poster_no_repeated_poster"
files = sorted([f for f in os.listdir(poster_dir) if not f.startswith('.')])

with open('d:/PINBOARD-GIT/scratch/parsed_build_catalog.json', 'r', encoding='utf-8') as f:
    curated_catalog = json.load(f)

curated_map = {}
for item in curated_catalog:
    base = os.path.splitext(item['file'])[0]
    curated_map[base] = item
    curated_map[item['file']] = item

ocr_results = []

for idx, fname in enumerate(files):
    fpath = os.path.join(poster_dir, fname)
    base = os.path.splitext(fname)[0]
    
    curated_item = curated_map.get(fname) or curated_map.get(base)
    
    try:
        results = reader.readtext(fpath, detail=0)
        extracted_text = " ".join(results)
    except Exception as e:
        extracted_text = ""

    ocr_results.append({
        "index": idx + 1,
        "filename": fname,
        "ocrText": extracted_text,
        "curated": curated_item
    })
    title = curated_item['title'] if curated_item else 'UNMAPPED'
    print(f"[{idx+1:03d}/156] {fname} | Title: {title} | OCR: '{extracted_text[:60]}...'")

with open('d:/PINBOARD-GIT/scratch/ocr_results.json', 'w', encoding='utf-8') as f:
    json.dump(ocr_results, f, indent=2)

print("\nOCR text extraction complete.")
