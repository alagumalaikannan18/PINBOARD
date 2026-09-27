import os
import json
import glob
import cv2

with open('scratch/repo_image_files.json', 'r', encoding='utf-8') as f:
    repo_images = json.load(f)

print(f"Total repo images: {len(repo_images)}")

# Group images by directory
dirs = {}
for img in repo_images:
    d = os.path.dirname(img) or '.'
    dirs[d] = dirs.get(d, 0) + 1

print("\nImage distribution across directories:")
for d, count in sorted(dirs.items()):
    print(f"  {d}: {count} images")

# Let's check poster/Posters and poster/drive
posters_dir_files = glob.glob('poster/Posters/**/*.*', recursive=True)
drive_dir_files = glob.glob('poster/drive/**/*.*', recursive=True)

print(f"\nposter/Posters files count: {len(posters_dir_files)}")
print(f"poster/drive files count: {len(drive_dir_files)}")

if posters_dir_files:
    print("Sample poster/Posters:", posters_dir_files[:5])
if drive_dir_files:
    print("Sample poster/drive:", drive_dir_files[:5])
