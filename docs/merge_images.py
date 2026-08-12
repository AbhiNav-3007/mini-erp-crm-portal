import os
from PIL import Image

def merge_side_by_side(img1_path, img2_path, output_path):
    if not os.path.exists(img1_path) or not os.path.exists(img2_path):
        print(f"Skipping merge: one of the source images is missing. ({img1_path} or {img2_path})")
        return False
    
    img1 = Image.open(img1_path)
    img2 = Image.open(img2_path)
    
    # Resize to have the same height if they differ, keeping aspect ratios
    h = min(img1.height, img2.height)
    
    w1 = int(img1.width * (h / img1.height))
    w2 = int(img2.width * (h / img2.height))
    
    img1_resized = img1.resize((w1, h), Image.Resampling.LANCZOS)
    img2_resized = img2.resize((w2, h), Image.Resampling.LANCZOS)
    
    # Create combined canvas
    combined = Image.new("RGBA", (w1 + w2, h))
    combined.paste(img1_resized, (0, 0))
    combined.paste(img2_resized, (w1, 0))
    
    combined.save(output_path)
    print(f"Merged successfully: {output_path}")
    return True

if __name__ == "__main__":
    screenshots_dir = "docs/screenshots"
    
    # 1. Merge landing page (light and dark)
    merge_side_by_side(
        os.path.join(screenshots_dir, "landing_light.png"),
        os.path.join(screenshots_dir, "landing_dark.png"),
        os.path.join(screenshots_dir, "landing_combined.png")
    )
