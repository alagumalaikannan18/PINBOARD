import cv2
import numpy as np

img = cv2.imread('New Project 22 [FA6B4A7].png')
h, w, c = img.shape

# Let's inspect the white border frame.
# In the mockup, there is a inner poster area surrounded by a thin white line/border.
# Let's compute gradients in x and y
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
gx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
gy = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)

# Sum magnitude along columns (x) to find vertical edges (left & right borders of poster frame)
# Sum magnitude along rows (y) to find horizontal edges (top & bottom borders of poster frame)
mag_x = np.abs(gx).sum(axis=0) # array of length w
mag_y = np.abs(gy).sum(axis=1) # array of length h

# Let's print top 10 peaks in mag_x and mag_y
top_x_peaks = np.argsort(mag_x)[::-1]
top_y_peaks = np.argsort(mag_y)[::-1]

print("Top 10 x gradient peaks:", top_x_peaks[:10])
print("Top 10 y gradient peaks:", top_y_peaks[:10])

# Let's find vertical lines near x in [200..400] (left) and [800..1000] (right)
left_x = [x for x in top_x_peaks if 200 <= x <= 450]
right_x = [x for x in top_x_peaks if 750 <= x <= 1000]
top_y = [y for y in top_y_peaks if 150 <= y <= 450]
bottom_y = [y for y in top_y_peaks if 1100 <= y <= 1450]

print("Left x candidate:", left_x[:5])
print("Right x candidate:", right_x[:5])
print("Top y candidate:", top_y[:5])
print("Bottom y candidate:", bottom_y[:5])
