import cv2

img = cv2.imread('New Project 22 [FA6B4A7].png')

# Box coordinates: x1=255, y1=285, x2=945, y2=1205 (w=690, h=920 => 3:4 aspect ratio 0.75)
crop = img[285:1205, 255:945]

cv2.imwrite('scratch/preview/cropped_rebirth.png', crop)
print(f"Cropped image shape: {crop.shape}")
