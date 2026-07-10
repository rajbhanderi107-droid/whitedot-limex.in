from __future__ import annotations

import os
import shutil

import bpy


REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PUBLIC = os.path.join(REPO, "public", "case-study", "model")
DIST = os.path.join(REPO, "dist", "case-study", "model")
SOURCE = os.path.join(PUBLIC, "oil-bottle-procedural.glb")


def export_variant(filename: str, texture_size: int) -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=SOURCE)
    for image in bpy.data.images:
        if image.size[0] > texture_size or image.size[1] > texture_size:
            image.scale(texture_size, texture_size)
            image.pack()

    out = os.path.join(PUBLIC, filename)
    bpy.ops.export_scene.gltf(
        filepath=out,
        export_format="GLB",
        export_yup=True,
        export_apply=True,
        export_materials="EXPORT",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=8,
    )
    shutil.copyfile(out, os.path.join(DIST, filename))
    print(f"{filename}: {os.path.getsize(out)} bytes")


# The detail page retains crisp material texture while reducing its 52 MB load.
export_variant("oil-bottle-procedural-fast.glb", 2048)
# The card uses the same real model at a deliberately small texture budget.
export_variant("oil-bottle-card.glb", 512)
