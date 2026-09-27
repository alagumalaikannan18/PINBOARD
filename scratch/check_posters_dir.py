import cv2
import glob

files = sorted(glob.glob('poster/Posters/*.png'))
print(f"Total files in poster/Posters: {len(files)}")

# Check 1513633.png, 1514079.png, 1554016.png etc.
for f in files[:10]:
    img = cv2.imread(f)
    if img is None:
        continue
    h, w, c = img.shape
    # sample corner
    corner = img[100, 100].tolist()
    print(f"File: {f} -> shape: {w}x{h}, corner: {corner}")
