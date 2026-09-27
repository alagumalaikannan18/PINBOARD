import cv2
import numpy as np

def test_wall_segmentation(img_path):
    img = cv2.imread(img_path)
    if img is None:
        return
    h, w, c = img.shape
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    
    # Sample corner pixels (which are on the wall)
    corner_pixels = np.vstack([
        hsv[:50, :50].reshape(-1, 3),
        hsv[:50, -50:].reshape(-1, 3),
        hsv[-50:, :50].reshape(-1, 3),
        hsv[-50:, -50:].reshape(-1, 3)
    ])
    
    h_min, s_min, v_min = [int(x) for x in corner_pixels.min(axis=0)]
    h_max, s_max, v_max = [int(x) for x in corner_pixels.max(axis=0)]
    
    print(f"\nImage: {img_path} ({w}x{h})")
    print(f"Wall HSV range: H=[{h_min}..{h_max}], S=[{s_min}..{s_max}], V=[{v_min}..{v_max}]")
    
    # Create mask for wall pixels
    lower_wall = np.array([max(0, h_min - 5), max(0, s_min - 15), max(0, v_min - 25)], dtype=np.uint8)
    upper_wall = np.array([min(179, h_max + 5), min(255, s_max + 15), min(255, v_max + 25)], dtype=np.uint8)
    
    wall_mask = cv2.inRange(hsv, lower_wall, upper_wall)
    
    # Non-wall mask (frame + poster artwork)
    non_wall = cv2.bitwise_not(wall_mask)
    
    # Find bounding box of non-wall region around center
    contours, _ = cv2.findContours(non_wall, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    boxes = []
    for cnt in contours:
        x, y, cw, ch = cv2.boundingRect(cnt)
        if cw * ch > (w * h * 0.1): # Area > 10%
            boxes.append((x, y, cw, ch, cw * ch))
    
    boxes.sort(key=lambda b: b[4], reverse=True)
    if boxes:
        x, y, cw, ch, _ = boxes[0]
        print(f"Non-wall bounding box: x={x}, y={y}, w={cw}, h={ch} (aspect: {cw/ch:.3f})")
    else:
        print("No non-wall bounding box found.")

test_wall_segmentation('New Project 22 [FA6B4A7].png')
test_wall_segmentation('New Project 22 [04889D2].png')
test_wall_segmentation('New Project 22 [27E5039].png')
test_wall_segmentation('New Project 22 [534B54A].png')
test_wall_segmentation('New Project 22 [D8D9C72].png')
test_wall_segmentation('1553031.webp')
test_wall_segmentation('1554016.webp')
