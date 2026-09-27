import cv2
import numpy as np

img_path = 'New Project 22 [FA6B4A7].png'
img = cv2.imread(img_path)
h, w, c = img.shape
print(f"Image shape: w={w}, h={h}, c={c}")

# Let's find white frame or inner artwork rectangle.
# Convert to grayscale
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# The white frame around the poster artwork in the mockup is high brightness white.
# Let's inspect intensity along horizontal and vertical lines through center.
center_x = w // 2
center_y = h // 2

col_profile = gray[:, center_x]
row_profile = gray[center_y, :]

print("Column profile min/max:", col_profile.min(), col_profile.max())
print("Row profile min/max:", row_profile.min(), row_profile.max())

# Let's search for contours of rectangles
# Thresholding for bright white frame or poster edges
edges = cv2.Canny(gray, 50, 150)
contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

rectangles = []
for cnt in contours:
    peri = cv2.arcLength(cnt, True)
    approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
    if len(approx) == 4:
        x, y, rw, rh = cv2.boundingRect(approx)
        # We look for rectangles of substantial size, e.g. area > 10% of image
        if rw * rh > (w * h * 0.1) and rw < w * 0.95 and rh < h * 0.95:
            rectangles.append((x, y, rw, rh, rw * rh))

rectangles.sort(key=lambda item: item[4], reverse=True)
print(f"Found {len(rectangles)} large candidate rectangles:")
for r in rectangles[:10]:
    print(r)
