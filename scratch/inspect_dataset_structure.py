import re

with open('js/products-data.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'PINBOARD_PRODUCTS' in line and '=' in line:
        print(f"Line {i+1}: {line.strip()[:100]}")
