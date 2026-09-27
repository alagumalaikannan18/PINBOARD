import cv2
import numpy as np

def analyze_image_geometry(img_path):
    img = cv2.imread(img_path)
    if img is None:
        return
    h, w, c = img.shape
    print(f"\n--- Analyzing {img_path} ({w}x{h}) ---")
    
    # Let's inspect brightness across vertical middle line x = w // 2
    mid_x = w // 2
    v_line = img[:, mid_x] # shape (h, 3)
    v_gray = cv2.cvtColor(v_line.reshape(-1, 1, 3), cv2.COLOR_BGR2GRAY).flatten()
    
    # Let's inspect brightness across horizontal middle line y = h // 2
    mid_y = h // 2
    h_line = img[mid_y, :] # shape (w, 3)
    h_gray = cv2.cvtColor(h_line.reshape(-1, 1, 3), cv2.COLOR_BGR2GRAY).flatten()
    
    # White frame pixels have high brightness (R,G,B > 220)
    # Let's find white frame regions along v_gray and h_gray
    is_white_v = (v_line[:, 0] > 200) & (v_line[:, 1] > 200) & (v_line[:, 2] > 200)
    is_white_h = (h_line[:, 0] > 200) & (h_line[:, 1] > 200) & (h_line[:, 2] > 200)
    
    white_y_indices = np.where(is_white_v)[0]
    white_x_indices = np.where(is_white_h)[0]
    
    print(f"White y indices count: {len(white_y_indices)}")
    if len(white_y_indices) > 0:
        print(f"White y min: {white_y_indices.min()}, max: {white_y_indices.max()}")
    
    print(f"White x indices count: {len(white_x_indices)}")
    if len(white_x_indices) > 0:
        print(f"White x min: {white_x_indices.min()}, max: {white_x_indices.max()}")

analyze_image_geometry('New Project 22 [FA6B4A7].png')
analyze_image_geometry('New Project 22 [04889D2].png')
analyze_image_geometry('New Project 22 [27E5039].png')
analyze_image_geometry('New Project 22 [534B54A].png')
analyze_image_geometry('New Project 22 [D8D9C72].png')
