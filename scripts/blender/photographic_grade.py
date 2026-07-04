"""Photographic grade for the LIMEX bottle renders.

Layers a subtle "shot on camera" look over the clean Cycles output so the
renders sit next to the original product photos: warm white balance, gentle
film S-curve, fine luminance grain and a soft vignette.

    python3 scripts/blender/photographic_grade.py <in_dir> <out_dir>

Kept as a standalone step so it can be replaced by an Adobe pipeline
(auto tone / color temperature / grain) without touching the render script.
"""

from __future__ import annotations

import os
import sys

import numpy as np
from PIL import Image

WARMTH = (1.030, 1.004, 0.962)   # RGB white-balance gains toward tungsten
BLACK_LIFT = 0.012               # filmic shadow lift
S_CURVE = 0.14                   # contrast strength
SATURATION = 1.05
GRAIN = 2.2 / 255.0              # fine luminance grain
VIGNETTE = 0.10                  # corner falloff


def grade(src: str, dst: str) -> None:
    img = np.asarray(Image.open(src).convert("RGB")).astype(np.float32) / 255.0

    img *= np.array(WARMTH, dtype=np.float32)

    img = BLACK_LIFT + (1.0 - BLACK_LIFT) * img
    img = img + S_CURVE * (img - 0.5) * (1.0 - np.abs(2.0 * img - 1.0))

    luma = img @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    img = luma[..., None] + SATURATION * (img - luma[..., None])

    h, w = img.shape[:2]
    rng = np.random.default_rng(7)
    img += rng.normal(0.0, GRAIN, size=(h, w, 1)).astype(np.float32)

    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    r2 = ((xx / w - 0.5) ** 2 + (yy / h - 0.5) ** 2) / 0.5
    img *= (1.0 - VIGNETTE * r2 * r2)[..., None]

    out = Image.fromarray((np.clip(img, 0.0, 1.0) * 255.0 + 0.5).astype(np.uint8))
    out.save(dst, quality=92, method=4)
    print(f"[grade] {dst}")


def main() -> None:
    in_dir, out_dir = sys.argv[1], sys.argv[2]
    os.makedirs(out_dir, exist_ok=True)
    for name in sorted(os.listdir(in_dir)):
        if name.endswith((".webp", ".png", ".jpg")):
            grade(os.path.join(in_dir, name), os.path.join(out_dir, name))


if __name__ == "__main__":
    main()
