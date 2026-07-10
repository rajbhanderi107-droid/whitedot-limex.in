"""Convert the user-supplied product 09 GLB into the live WhiteDot asset.

The scan GLB is a single untextured mesh, so this script preserves the
uploaded geometry while applying the same colour/material grade used by the
previous live oil-can model:

* warm white HDPE body matched to the latest product photo
* natural yellow ribbed cap
* embedded 4K base-color and normal textures
* real 208 mm model height and centered base

Run:
  blender -b --python scripts/blender/convert_attached_oil_can_product9.py
"""

from __future__ import annotations

import math
import os
from array import array

import bpy
from mathutils import Vector


REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC_GLB = os.environ.get("OIL_USER_GLB", r"C:\Users\rbhan\Downloads\New_Project_752026 2.glb")
OUT_GLB = os.path.join(REPO, "public", "case-study", "model", "oil-bottle-procedural.glb")
DIST_GLB = os.path.join(REPO, "dist", "case-study", "model", "oil-bottle-procedural.glb")
RENDER_DIR = os.path.join(REPO, "scripts", "blender", "renders")

TARGET_HEIGHT_M = 0.208
TEXTURE_RES = int(os.environ.get("OIL_TEXTURE_RES", "4096"))


def srgb_to_linear(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def srgb8(r: int, g: int, b: int) -> tuple[float, float, float, float]:
    return (srgb_to_linear(r / 255), srgb_to_linear(g / 255), srgb_to_linear(b / 255), 1.0)


# Latest reference photo: the product is white. The beige/grey tone visible in
# the photo comes from soft indoor light, reflections, and shadow, so the albedo
# stays warm white and the viewer exposure carries the tonal match.
BODY = srgb8(238, 235, 226)
# Reference cap is a clean saturated lemon-yellow. Avoid mustard/orange.
# Reference-matched warm golden yellow: softer and less neon than the first pass.
CAP = srgb8(239, 198, 45)


def clean_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.images):
        for item in list(block):
            block.remove(item)


def hash01(x: int, y: int, seed: int = 17) -> float:
    n = (x * 374761393 + y * 668265263 + seed * 1442695041) & 0xFFFFFFFF
    n = (n ^ (n >> 13)) * 1274126177 & 0xFFFFFFFF
    return ((n ^ (n >> 16)) & 0xFFFFFF) / float(0xFFFFFF)


def make_texture(
    name: str,
    rgba: tuple[float, float, float, float],
    normal: bool = False,
    dirty: bool = False,
) -> bpy.types.Image:
    img = bpy.data.images.new(name, TEXTURE_RES, TEXTURE_RES, alpha=True, float_buffer=False)
    total = TEXTURE_RES * TEXTURE_RES * 4
    pix = array("f", [0.0]) * total
    r, g, b, a = rgba

    # Deterministic fine plastic grain plus low-frequency unevenness. The body
    # stays white; only faint rubbed dirt/scuffs are added like the real sample.
    for y in range(TEXTURE_RES):
        row = y * TEXTURE_RES * 4
        sy = math.sin(y * 0.031)
        for x in range(TEXTURE_RES):
            i = row + x * 4
            fine = math.sin(x * 0.071 + sy * 2.1) * math.sin((x + y) * 0.019)
            broad = math.sin(x * 0.0047 + y * 0.0029) * 0.5 + math.sin(x * 0.011 - y * 0.006) * 0.35
            dirt = 0.0
            if dirty:
                # Sparse grey specks and soft vertical smudges like the real
                # sample photo, but not a beige recolor.
                rnd = hash01(x // 11, y // 11, 29)
                if rnd > 0.989:
                    dirt -= 0.055 * (rnd - 0.989) / 0.011
                smudge = max(0.0, math.sin(x * 0.009 + 1.8) * math.sin(y * 0.005 - 0.7))
                dirt -= 0.014 * smudge
            if normal:
                pix[i] = 0.5 + fine * (0.010 if dirty else 0.014) + broad * 0.004
                pix[i + 1] = 0.5 + math.sin(y * 0.067) * (0.008 if dirty else 0.012)
                pix[i + 2] = 1.0
                pix[i + 3] = 1.0
            else:
                gain = 1.0 + fine * (0.018 if dirty else 0.022) + broad * (0.020 if dirty else 0.006) + dirt
                pix[i] = min(max(r * gain, 0.0), 1.0)
                pix[i + 1] = min(max(g * gain, 0.0), 1.0)
                pix[i + 2] = min(max(b * gain, 0.0), 1.0)
                pix[i + 3] = a
    img.pixels.foreach_set(pix)
    img.pack()
    if normal:
        img.colorspace_settings.name = "Non-Color"
    return img


def make_material(name: str, color: tuple[float, float, float, float], roughness: float) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes.get("Principled BSDF")

    dirty = "Body" in name
    base_img = make_texture(f"{name}_4K_BaseColor", color, normal=False, dirty=dirty)
    normal_img = make_texture(f"{name}_4K_Normal", color, normal=True, dirty=dirty)

    tex_base = nodes.new("ShaderNodeTexImage")
    tex_base.image = base_img
    tex_normal = nodes.new("ShaderNodeTexImage")
    tex_normal.image = normal_img
    normal_map = nodes.new("ShaderNodeNormalMap")
    normal_map.inputs["Strength"].default_value = 0.075 if "Body" in name else 0.055

    links.new(tex_base.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(tex_normal.outputs["Color"], normal_map.inputs["Color"])
    links.new(normal_map.outputs["Normal"], bsdf.inputs["Normal"])
    bsdf.inputs["Roughness"].default_value = roughness
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.42 if "Body" in name else 0.55
    bsdf.inputs["Metallic"].default_value = 0.0
    if "Alpha" in bsdf.inputs:
        bsdf.inputs["Alpha"].default_value = 1.0
    for coat_w, coat_r in (("Coat Weight", "Coat Roughness"), ("Clearcoat", "Clearcoat Roughness")):
        if coat_w in bsdf.inputs:
            bsdf.inputs[coat_w].default_value = 0.08 if "Body" in name else 0.18
            bsdf.inputs[coat_r].default_value = 0.38 if "Body" in name else 0.22
            break
    mat.diffuse_color = color
    return mat


def bbox_world(obj: bpy.types.Object) -> tuple[Vector, Vector]:
    pts = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    return (
        Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))),
        Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts))),
    )


def box_project_uv(obj: bpy.types.Object) -> None:
    me = obj.data
    if not me.uv_layers:
        me.uv_layers.new(name="UVMap")
    uv = me.uv_layers.active.data
    minv, maxv = bbox_world(obj)
    size = maxv - minv
    size.x = max(size.x, 1e-6)
    size.y = max(size.y, 1e-6)
    size.z = max(size.z, 1e-6)

    for poly in me.polygons:
        n = poly.normal
        axis = max(range(3), key=lambda idx: abs(n[idx]))
        for li in poly.loop_indices:
            co = obj.matrix_world @ me.vertices[me.loops[li].vertex_index].co
            if axis == 2:
                u, v = (co.x - minv.x) / size.x, (co.y - minv.y) / size.y
            elif axis == 1:
                u, v = (co.x - minv.x) / size.x, (co.z - minv.z) / size.z
            else:
                u, v = (co.y - minv.y) / size.y, (co.z - minv.z) / size.z
            uv[li].uv = (u, v)


def assign_cap_material(obj: bpy.types.Object) -> None:
    me = obj.data
    minv, maxv = bbox_world(obj)
    dims = maxv - minv

    # The cap is the compact cylindrical mass near the top on the left side of
    # the uploaded scan. This geometric mask deliberately includes the fluted
    # side faces and top face but leaves the shoulder/handle warm white.
    cap_center = Vector((
        minv.x + dims.x * 0.30,
        minv.y + dims.y * 0.51,
        minv.z + dims.z * 0.865,
    ))
    # Tight cap-only mask. The earlier mask reached into the shoulder and
    # spread yellow onto the body; keep the radius and lower bound confined to
    # the cylindrical yellow cap visible in the reference photos.
    rx = dims.x * 0.28
    ry = dims.y * 0.23
    z_min = minv.z + dims.z * 0.90

    cap_faces = 0
    for poly in me.polygons:
        center = obj.matrix_world @ poly.center
        radial = ((center.x - cap_center.x) / rx) ** 2 + ((center.y - cap_center.y) / ry) ** 2
        world_normal = obj.matrix_world.to_3x3() @ poly.normal
        cap_side = center.z >= z_min and abs(world_normal.z) < 0.45
        cap_top = center.z >= minv.z + dims.z * 0.96
        face_points = [obj.matrix_world @ me.vertices[me.loops[li].vertex_index].co for li in poly.loop_indices]
        face_inside = all(
            point.z >= z_min and
            ((point.x - cap_center.x) / rx) ** 2 + ((point.y - cap_center.y) / ry) ** 2 <= 1.35
            for point in face_points
        )
        is_cap = face_inside and (cap_side or cap_top)
        poly.material_index = 1 if is_cap else 0
        cap_faces += int(is_cap)
    print(f"Assigned cap material to {cap_faces} / {len(me.polygons)} faces")


def import_user_model() -> bpy.types.Object:
    bpy.ops.import_scene.gltf(filepath=SRC_GLB)
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    if not meshes:
        raise RuntimeError(f"No mesh found in {SRC_GLB}")
    for obj in meshes:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1:
        bpy.ops.object.join()
    obj = bpy.context.object
    obj.name = "FoodOilCan_UserGeometry"
    obj.data.name = "FoodOilCan_UserGeometryMesh"

    minv, maxv = bbox_world(obj)
    scale = TARGET_HEIGHT_M / (maxv.z - minv.z)
    obj.scale = (obj.scale.x * scale, obj.scale.y * scale, obj.scale.z * scale)
    bpy.context.view_layer.update()
    minv, maxv = bbox_world(obj)
    obj.location.x -= (minv.x + maxv.x) * 0.5
    obj.location.y -= (minv.y + maxv.y) * 0.5
    obj.location.z -= minv.z
    bpy.context.view_layer.update()
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    return obj


def setup_render(obj: bpy.types.Object) -> None:
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 96
    scene.view_settings.view_transform = "Filmic"
    scene.view_settings.look = "Medium High Contrast"
    scene.view_settings.exposure = 0
    scene.view_settings.gamma = 1
    scene.render.resolution_x = 1400
    scene.render.resolution_y = 1600
    scene.render.film_transparent = True

    bpy.ops.object.light_add(type="AREA", location=(-0.45, -0.65, 0.55))
    key = bpy.context.object
    key.name = "Key softbox"
    key.data.energy = 430
    key.data.size = 0.45
    bpy.ops.object.light_add(type="AREA", location=(0.55, 0.35, 0.35))
    rim = bpy.context.object
    rim.name = "Rim softbox"
    rim.data.energy = 70
    rim.data.size = 0.60

    bpy.ops.object.camera_add(location=(0.18, -0.36, 0.19), rotation=(math.radians(65), 0, math.radians(27)))
    cam = bpy.context.object
    scene.camera = cam
    direction = Vector((0, 0, 0.105)) - cam.location
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    cam.data.lens = 70


def main() -> None:
    clean_scene()
    obj = import_user_model()
    body_mat = make_material("OilCanBody_4K_PhotoWhite", BODY, 0.52)
    cap_mat = make_material("OilCanCap_4K_PhotoYellow", CAP, 0.28)
    obj.data.materials.append(body_mat)
    obj.data.materials.append(cap_mat)
    box_project_uv(obj)
    assign_cap_material(obj)

    os.makedirs(os.path.dirname(OUT_GLB), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=OUT_GLB,
        export_format="GLB",
        export_yup=True,
        export_apply=True,
        export_materials="EXPORT",
    )
    os.makedirs(os.path.dirname(DIST_GLB), exist_ok=True)
    with open(OUT_GLB, "rb") as src, open(DIST_GLB, "wb") as dst:
        dst.write(src.read())
    print(f"GLB written: {OUT_GLB} ({os.path.getsize(OUT_GLB) / 1e6:.2f} MB)")

    setup_render(obj)
    os.makedirs(RENDER_DIR, exist_ok=True)
    scene = bpy.context.scene
    scene.render.filepath = os.path.join(RENDER_DIR, "food-oil-can-user-model-old-grade.png")
    bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    main()
