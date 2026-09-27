import cv2
import numpy as np

img = cv2.imread('New Project 22 [FA6B4A7].png')
h, w, c = img.shape

# Let's inspect intensity along rows near top and bottom of poster frame, and cols near left and right
# The frame is white mat border surrounding the poster.
# Let's sample horizontal slice across y = h//2 (y=800)
slice_h = img[800, :, :]
# Let's sample vertical slice across x = w//2 (x=600)
slice_v = img[:, 600, :]

# Print RGB along slice_h around expected frame left and right
# Print RGB along slice_v around expected frame top and bottom

# Let's find white frame pixels: white frame has high R, G, B (e.g. > 230 or high brightness relative to wall)
brightness_h = np.mean(slice_h, axis=1)
brightness_v = np.mean(slice_v, axis=1)

print("Horizontal brightness profile at y=800:")
for x in range(0, w, 50):
    print(f"x={x}: BGR={slice_h[x].tolist()}, mean={brightness_h[x]:.1f}")

print("\nVertical brightness profile at x=600:")
for y in range(0, h, 50):
    print(f"y={y}: BGR={slice_v[y].tolist()}, mean={brightness_v[y]:.1f}")
