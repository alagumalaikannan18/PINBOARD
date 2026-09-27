import os
import glob
from PIL import Image, ImageStat
import json

poster_dir = r"d:\PINBOARD-GIT\all_new_poster_no_repeated_poster"
files = sorted([f for f in os.listdir(poster_dir) if not f.startswith('.')])

print(f"Total files to analyze: {len(files)}")

analysis_results = []

for idx, fname in enumerate(files):
    fpath = os.path.join(poster_dir, fname)
    try:
        with Image.open(fpath) as img:
            width, height = img.size
            mode = img.mode
            format_name = img.format
            info = img.info
            
            # Extract text metadata if present in PNG/JPEG
            text_metadata = {}
            for k, v in info.items():
                if isinstance(v, (str, int, float)):
                    text_metadata[k] = str(v)

            # Calculate average RGB
            stat = ImageStat.Stat(img.convert('RGB'))
            mean_color = [round(c, 1) for c in stat.mean]

            analysis_results.append({
                "index": idx + 1,
                "filename": fname,
                "format": format_name,
                "width": width,
                "height": height,
                "aspectRatio": round(width / height, 3),
                "mode": mode,
                "meanColorRGB": mean_color,
                "metadata": text_metadata
            })
    except Exception as e:
        print(f"Error opening {fname}: {e}")

output_path = r"d:\PINBOARD-GIT\scratch\image_analysis.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(analysis_results, f, indent=2)

print(f"Analysis saved to {output_path}")
