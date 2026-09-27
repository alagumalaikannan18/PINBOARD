import json
import os

filepath = 'd:/PINBOARD-GIT/scratch/ocr_results.json'
if os.path.exists(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"OCR results currently saved: {len(data)} items")
    except Exception as e:
        print("Error reading json:", e)
else:
    print("File not yet created")
