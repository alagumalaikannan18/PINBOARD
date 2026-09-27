import cv2
import numpy as np

def check_img(path):
    img = cv2.imread(path)
    if img is None:
        print(f"CANNOT READ: {path}")
        return
    h, w, c = img.shape
    tl = img[10, 10].tolist()
    tr = img[10, w-10].tolist()
    bl = img[h-10, 10].tolist()
    br = img[h-10, w-10].tolist()
    bottom_center = img[int(h*0.88):int(h*0.95), int(w*0.3):int(w*0.7)]
    bc_bgr = np.mean(bottom_center, axis=(0,1)).tolist()
    print(f"\n--- {path} ({w}x{h}) ---")
    print(f"TL: {tl}, TR: {tr}, BL: {bl}, BR: {br}")
    print(f"Bottom Center BGR: {[round(x, 1) for x in bc_bgr]}")

check_img('1553031.webp')
check_img('1553031.jpg.jpeg')
check_img('1553164.jpg.jpeg')
check_img('1553164.webp')
check_img('1553256_1.jpg.jpeg')
check_img('1551192.png')
