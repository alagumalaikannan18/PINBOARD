import cv2
import numpy as np

tl = cv2.imread('scratch/preview/tl_corner.png')
# tl corresponds to img[200:400, 200:400]
# local coordinate (lx, ly) maps to global (200 + lx, 200 + ly)

print("--- Top Left Corner Search (Global x=200..400, y=200..400) ---")
# White frame has high brightness (R,G,B > 240)
for ly in range(0, 200, 10):
    row_str = ""
    for lx in range(0, 200, 10):
        b, g, r = tl[ly, lx]
        if r > 240 and g > 240 and b > 240:
            row_str += "W "
        elif r > 180 and g > 170 and b > 160: # Wall
            row_str += ". "
        else: # Poster content or shadow
            row_str += "# "
    print(f"y={200+ly}: {row_str}")

br = cv2.imread('scratch/preview/br_corner.png')
# br corresponds to img[1100:1300, 800:1000]
# local coordinate (lx, ly) maps to global (800 + lx, 1100 + ly)

print("\n--- Bottom Right Corner Search (Global x=800..1000, y=1100..1300) ---")
for ly in range(0, 200, 10):
    row_str = ""
    for lx in range(0, 200, 10):
        b, g, r = br[ly, lx]
        if r > 240 and g > 240 and b > 240:
            row_str += "W "
        elif r > 180 and g > 170 and b > 160: # Wall
            row_str += ". "
        else: # Poster content or shadow
            row_str += "# "
    print(f"y={1100+ly}: {row_str}")
