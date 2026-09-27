import cv2
import numpy as np

img = cv2.imread('New Project 22 [FA6B4A7].png')

# Print slice at y = 500 across x from 200 to 1000 in steps of 20
print("--- Slice at y=500 ---")
for x in range(200, 1000, 20):
    b, g, r = img[500, x]
    print(f"x={x:3d}: R={r:3d}, G={g:3d}, B={b:3d}")

print("\n--- Slice at x=500 ---")
for y in range(200, 1400, 20):
    b, g, r = img[y, 500]
    print(f"y={y:4d}: R={r:3d}, G={g:3d}, B={b:3d}")
