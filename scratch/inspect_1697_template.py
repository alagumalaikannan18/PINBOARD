import cv2
import numpy as np

def measure_1697_mockup(img_path):
    img = cv2.imread(img_path)
    if img is None:
        return
    h, w, c = img.shape
    print(f"\n--- Measuring {img_path} ({w}x{h}) ---")
    
    # Let's inspect horizontal slice at y = 800 (mid y)
    slice_h = img[800, :, :]
    
    # In 1200x1697 mockup:
    # Wall on left, then white frame border, then poster artwork, then white frame border, then wall on right.
    # White frame border pixels have high brightness (R>200, G>200, B>200) or sharp edge transition.
    
    # Let's print BGR around x=200..320 and x=880..1000
    print("Left boundary region (y=800, x=220..300):")
    for x in range(220, 300, 5):
        print(f"x={x}: BGR={slice_h[x].tolist()}")

    print("Right boundary region (y=800, x=900..980):")
    for x in range(900, 980, 5):
        print(f"x={x}: BGR={slice_h[x].tolist()}")
        
    # Vertical slice at x = 600
    slice_v = img[:, 600, :]
    print("Top boundary region (x=600, y=260..340):")
    for y in range(260, 340, 5):
        print(f"y={y}: BGR={slice_v[y].tolist()}")

    print("Bottom boundary region (x=600, y=1200..1280):")
    for y in range(1200, 1280, 5):
        print(f"y={y}: BGR={slice_v[y].tolist()}")

measure_1697_mockup('poster/opt/1513633.webp')
measure_1697_mockup('poster/opt/1554018.webp')
measure_1697_mockup('poster/opt/1556445.webp')
