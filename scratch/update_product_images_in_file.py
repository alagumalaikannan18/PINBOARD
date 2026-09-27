import re

with open('js/products-data.js', 'r', encoding='utf-8') as f:
    content = f.read()

def normalize_img(match):
    img_str = match.group(1)
    if 'WhatsApp' in img_str and '20' in match.group(0):
        img_str = '1556901.webp'
    
    # Extract filename
    base = img_str.split('/')[-1].split('\\')[-1]
    base = re.sub(r'\.jpg\.jpeg$', '', base, flags=re.IGNORECASE)
    base = re.sub(r'\.(png|jpe?g|webp|avif)$', '', base, flags=re.IGNORECASE)
    clean_path = f"poster/opt/{base}.webp"
    return f'"images": [\n      "{clean_path}"\n    ]'

# Replace "images": [\n      "..."\n    ] or "images": ["..."]
new_content = re.sub(r'"images":\s*\[\s*"([^"]+)"(?:\s*,\s*"[^"]+")*\s*\]', normalize_img, content)

with open('js/products-data.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Updated image paths in js/products-data.js")
