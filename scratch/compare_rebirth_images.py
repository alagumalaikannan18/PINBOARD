import cv2
import numpy as np

img12 = cv2.imread('1553256_1.jpg.jpeg')
img54 = cv2.imread('poster/opt/1553256_1.webp')
img18 = cv2.imread('New Project 22 [DA2465C] (1).png')

print(f"ID 12 shape: {img12.shape if img12 is not None else None}")
print(f"ID 54 shape: {img54.shape if img54 is not None else None}")
print(f"ID 18 shape: {img18.shape if img18 is not None else None}")

# Compare img12 cropped vs img18 cropped
# Resize img18 to img12 shape and compute MSE
if img12 is not None and img18 is not None:
    img18_resized = cv2.resize(img18, (img12.shape[1], img12.shape[0]))
    diff = cv2.absdiff(img12, img18_resized)
    mse = np.mean(diff ** 2)
    print(f"MSE between ID 12 and ID 18: {mse:.2f}")

if img12 is not None and img54 is not None:
    img54_resized = cv2.resize(img54, (img12.shape[1], img12.shape[0]))
    diff = cv2.absdiff(img12, img54_resized)
    mse = np.mean(diff ** 2)
    print(f"MSE between ID 12 and ID 54: {mse:.2f}")
