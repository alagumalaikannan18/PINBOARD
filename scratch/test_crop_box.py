import cv2
import os

img = cv2.imread('New Project 22 [FA6B4A7].png')
h, w, _ = img.shape
print(f"Image shape: w={w}, h={h}")

# Let's try several candidate bounding boxes for the poster inside the mockup template:
# Template canvas is 1200 x 1600.
# Poster artwork is centered inside the white frame.

# Test candidate crops:
# Candidate A: [250:1230, 250:950]  (width=700, height=980, aspect=0.714 = 3:4.2)
# Candidate B: [260:1220, 255:945]
# Candidate C: [300:1200, 270:930]

os.makedirs('scratch/preview', exist_ok=True)

# Let's save a cropped section around top-left of poster frame to locate exact top-left corner
# Top-left of poster frame is somewhere around x=240..280, y=240..320
crop_tl = img[200:400, 200:400]
cv2.imwrite('scratch/preview/tl_corner.png', crop_tl)

# Let's save a cropped section around bottom-right of poster frame to locate exact bottom-right corner
crop_br = img[1100:1300, 800:1000]
cv2.imwrite('scratch/preview/br_corner.png', crop_br)

print("Saved tl_corner.png and br_corner.png")
