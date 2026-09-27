import os
import glob
from PIL import Image

poster_dir = r"d:\PINBOARD-GIT\all_new_poster_no_repeated_poster"
output_thumb_dir = r"d:\PINBOARD-GIT\scratch\thumbs"
os.makedirs(output_thumb_dir, exist_ok=True)

files = sorted([f for f in os.listdir(poster_dir) if not f.startswith('.')])

html_items = []

for idx, fname in enumerate(files):
    fpath = os.path.join(poster_dir, fname)
    thumb_path = os.path.join(output_thumb_dir, f"thumb_{idx+1:03d}.webp")
    
    if not os.path.exists(thumb_path):
        try:
            with Image.open(fpath) as img:
                img.thumbnail((200, 300))
                img.save(thumb_path, "WEBP", quality=60)
        except Exception as e:
            print(f"Error thumbnailing {fname}: {e}")

    html_items.append(f'''
    <div style="border: 1px solid #ccc; padding: 8px; border-radius: 6px; text-align: center; background: #fff;">
        <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">#{idx+1:03d}</div>
        <img src="thumbs/thumb_{idx+1:03d}.webp" style="max-width: 180px; height: 240px; object-fit: contain; background: #f0f0f0;" />
        <div style="font-size: 11px; color: #555; margin-top: 4px; word-break: break-all;">{fname}</div>
    </div>
    ''')

html_content = f'''<!DOCTYPE html>
<html>
<head>
    <title>PINBOARD 156 Poster Contact Sheet</title>
    <style>
        body {{ font-family: sans-serif; background: #f7f7f7; margin: 20px; }}
        .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }}
    </style>
</head>
<body>
    <h2>PINBOARD 156 Poster Visual Contact Sheet</h2>
    <div class="grid">
        {"".join(html_items)}
    </div>
</body>
</html>
'''

with open(r"d:\PINBOARD-GIT\scratch\contact_sheet.html", "w", encoding="utf-8") as f:
    f.write(html_content)

print("Contact sheet created at d:\\PINBOARD-GIT\\scratch\\contact_sheet.html")
