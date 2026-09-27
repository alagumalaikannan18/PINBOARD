with open('js/products-data.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if '"id": 151' in l or '"id": 152' in l or '"id": 153' in l or '"id": 1' in l:
        print(f"Line {i+1}: {l.strip()}")
