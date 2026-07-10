from __future__ import annotations

import os
import shutil

import bpy
from mathutils import Vector


REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(REPO, "public", "case-study", "model", "oil-bottle-procedural.glb")
TMP = os.path.join(REPO, "public", "case-study", "model", "oil-bottle-procedural-fixed.glb")
DIST = os.path.join(REPO, "dist", "case-study", "model", "oil-bottle-procedural.glb")

bpy.ops.import_scene.gltf(filepath=SRC)
obj = max((o for o in bpy.context.scene.objects if o.type == "MESH"), key=lambda o: len(o.data.polygons))
me = obj.data
verts = [obj.matrix_world @ v.co for v in me.vertices]
minv = Vector((min(v.x for v in verts), min(v.y for v in verts), min(v.z for v in verts)))
maxv = Vector((max(v.x for v in verts), max(v.y for v in verts), max(v.z for v in verts)))
dims = maxv - minv
cap_center = Vector((minv.x + dims.x * 0.30, minv.y + dims.y * 0.51, minv.z + dims.z * 0.865))
rx, ry = dims.x * 0.28, dims.y * 0.23
z_min = minv.z + dims.z * 0.90

changed = 0
for poly in me.polygons:
    center = obj.matrix_world @ poly.center
    radial = ((center.x - cap_center.x) / rx) ** 2 + ((center.y - cap_center.y) / ry) ** 2
    normal = obj.matrix_world.to_3x3() @ poly.normal
    cap_side = center.z >= z_min and abs(normal.z) < 0.45
    cap_top = center.z >= minv.z + dims.z * 0.96 and radial <= 0.55
    points = [obj.matrix_world @ me.vertices[me.loops[i].vertex_index].co for i in poly.loop_indices]
    inside = all(
        p.z >= z_min and ((p.x - cap_center.x) / rx) ** 2 + ((p.y - cap_center.y) / ry) ** 2 <= 1.35
        for p in points
    )
    is_cap = inside and (cap_side or cap_top)
    poly.material_index = 1 if is_cap else 0
    changed += int(is_cap)

bpy.ops.export_scene.gltf(filepath=TMP, export_format="GLB", export_yup=True, export_apply=True, export_materials="EXPORT")
shutil.copyfile(TMP, SRC)
shutil.copyfile(TMP, DIST)
os.remove(TMP)
print(f"Recolored cap faces: {changed}")
