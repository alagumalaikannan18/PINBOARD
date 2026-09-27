import cv2
import numpy as np
import glob
import os

def detect_poster_rect(img):
    h, w, _ = img.shape
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # In mockups, the frame/poster is a prominent rectangle near the center.
    # The frame border is white/light or high contrast edge against beige wall.
    # Let's perform adaptive thresholding / Canny / Otsu or color segmentation.
    
    # Method 1: Edge detection with Otsu thresholding on horizontal & vertical projection
    # Or find contours of thresholded image
    
    # Blurred grayscale to reduce noise
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Compute Canny edges with hysteresis
    edges = cv2.Canny(blurred, 30, 100)
    
    # Morphological closing to join close edge lines
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    closed = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)
    
    contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # We want a large rectangular contour located towards the center of the image
    candidates = []
    for cnt in contours:
        x, y, cw, ch = cv2.boundingRect(cnt)
        area = cw * ch
        # Must be substantial (e.g. area between 15% and 85% of total image area)
        if 0.15 * w * h < area < 0.90 * w * h:
            # Check aspect ratio of rect (poster ratio is typically ~0.65 to 0.85)
            rect_aspect = cw / ch
            if 0.5 <= rect_aspect <= 1.0:
                # Check center position
                cx = x + cw / 2
                cy = y + ch / 2
                if abs(cx - w/2) < w * 0.2 and abs(cy - h/2) < h * 0.25:
                    candidates.append((x, y, cw, ch, area))
    
    if candidates:
        # Sort by area descending
        candidates.sort(key=lambda item: item[4], reverse=True)
        return candidates[0][:4]
    
    return None

# Test on New Project files and poster/ files
test_files = [
    'New Project 22 [FA6B4A7].png',
    'New Project 22 [04889D2].png',
    'New Project 22 [27E5039].png',
    'New Project 22 [534B54A].png',
    'New Project 22 [D8D9C72].png',
    '1553031.webp',
    '1553164.webp',
    '1554016.webp'
]

for tf in test_files:
    if os.path.exists(tf):
        img = cv2.imread(tf)
        rect = detect_poster_rect(img)
        print(f"File: {tf} -> Detected Rect: {rect}")
