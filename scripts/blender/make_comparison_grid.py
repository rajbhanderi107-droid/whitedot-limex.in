"""Build a side-by-side reference-vs-render comparison grid for Product 10."""
import os
from PIL import Image, ImageDraw, ImageFont

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOADS = "/root/.claude/uploads/9fa1c79b-adb0-5977-9056-bab16fec3d46"
RENDERS = os.path.join(REPO, "scripts", "blender", "renders")
OUT = os.path.join(REPO, "scripts", "blender", "renders", "comparison_grid.png")

pairs = [
    ("Reference: front", os.path.join(UPLOADS, "aebac863-IMG_2613.jpeg")),
    ("Render: front", os.path.join(RENDERS, "front.png")),
    ("Reference: top (lid)", os.path.join(UPLOADS, "5f097528-IMG_2614.jpeg")),
    ("Render: top (lid)", os.path.join(RENDERS, "top.png")),
    ("Reference: 3/4", os.path.join(UPLOADS, "cf561da9-IMG_2615.jpeg")),
    ("Render: 3/4", os.path.join(RENDERS, "three_quarter.png")),
]

CELL_W, CELL_H = 640, 480
LABEL_H = 36
cols, rows = 2, 3
grid_w = CELL_W * cols
grid_h = (CELL_H + LABEL_H) * rows

grid = Image.new("RGB", (grid_w, grid_h), (30, 31, 34))
draw = ImageDraw.Draw(grid)
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22)
except Exception:
    font = ImageFont.load_default()

for i, (label, path) in enumerate(pairs):
    col = i % cols
    row = i // cols
    x0 = col * CELL_W
    y0 = row * (CELL_H + LABEL_H)
    img = Image.open(path).convert("RGB")
    img.thumbnail((CELL_W - 20, CELL_H - 20))
    px = x0 + (CELL_W - img.width) // 2
    py = y0 + LABEL_H + (CELL_H - img.height) // 2
    grid.paste(img, (px, py))
    draw.text((x0 + 10, y0 + 6), label, fill=(255, 255, 255), font=font)

grid.save(OUT)
print(f"Saved {OUT}")
