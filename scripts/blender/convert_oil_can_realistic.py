"""Convert the user-supplied Product 09 GLB into the live WhiteDot asset.

Improvements over the previous version:
* Pure bright white HDPE body (no warm/yellowish tint)
* Vivid red cap matching common Indian oil can packaging
* Realistic HDPE plastic texture with micro-grain, mold marks, and subtle
  surface imperfections instead of flat procedural look
* Subsurface scattering for translucent plastic appearance
* Better clearcoat for realistic plastic sheen
* Higher quality normal maps for mold-line details

Run:
  blender -b --python scripts/blender/convert_oil_can_realistic.py
"""

from __future__ import annotations

import math
import os
import random
from array import array

import bpy
from mathutils import Vector


REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC_GLB = os.environ.get("OIL_USER_GLB", r"C:\Users\rbhan\Downloads\New_Project_752026 2.glb")
OUT_GLB = os.path.join(REPO, "public", "case-study", "model", "oil-bottle-procedural.glb")
DIST_GLB = os.path.join(REPO, "dist", "case-study", "model", "oil-bottle-procedural.glb")

TARGET_HEIGHT_M = 0.208
TEXTURE_RES = int(os.environ.get("OIL_TEXTURE_RES", "2048"))


def srgb_to_linear(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def srgb8(r: int, g: int, b: int) -> tuple[float, float, float, float]:
    return (srgb_to_linear(r / 255), srgb_to_linear(g / 255), srgb_to_linear(b / 255), 1.0)


# Pure bright white body — clean opaque HDPE white matching the product photo.
BODY_COLOR = srgb8(250, 248, 244)
# Golden yellow cap — matching the real product photo
CAP_COLOR = srgb8(235, 190, 20)
# Collar/ring piece — slightly off-white to differentiate from body
COLLAR_COLOR = srgb8(245, 242, 235)


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


def make_basecolor_texture(
    name: str,
    rgba: tuple[float, float, float, float],
    is_body: bool = False,
) -> bpy.types.Image:
    """Generate a realistic base color texture with subtle plastic surface variation."""
    img = bpy.data.images.new(name, TEXTURE_RES, TEXTURE_RES, alpha=True, float_buffer=False)
    total = TEXTURE_RES * TEXTURE_RES * 4
    pix = array("f", [0.0]) * total
    r, g, b, a = rgba

    for y in range(TEXTURE_RES):
        row = y * TEXTURE_RES * 4
        for x in range(TEXTURE_RES):
            i = row + x * 4

            # Micro-grain: very fine injection mold surface texture
            fine = math.sin(x * 0.137 + y * 0.091) * math.sin(x * 0.061 - y * 0.043) * 0.008

            # Medium-scale mold flow lines (directional streaks)
            flow = math.sin(y * 0.017 + math.sin(x * 0.009) * 3.5) * 0.005

            # Very subtle broad color variation (plastic density variation)
            broad = (math.sin(x * 0.0037 + y * 0.0021) * 0.5 +
                     math.sin(x * 0.0051 - y * 0.0033) * 0.3) * 0.004

            if is_body:
                # Sparse tiny scuff marks on the white body
                rnd = hash01(x // 7, y // 7, 41)
                scuff = -0.012 * max(0.0, rnd - 0.993) / 0.007 if rnd > 0.993 else 0.0

                # Very faint vertical mold seam lines
                seam = 0.0
                nx = x / TEXTURE_RES
                for sx in (0.25, 0.75):
                    dist = abs(nx - sx)
                    if dist < 0.003:
                        seam = -0.008 * (1.0 - dist / 0.003)
            else:
                scuff = 0.0
                seam = 0.0

            gain = 1.0 + fine + flow + broad + scuff + seam
            pix[i] = min(max(r * gain, 0.0), 1.0)
            pix[i + 1] = min(max(g * gain, 0.0), 1.0)
            pix[i + 2] = min(max(b * gain, 0.0), 1.0)
            pix[i + 3] = a

    img.pixels.foreach_set(pix)
    img.pack()
    return img


def make_normal_texture(name: str, is_body: bool = False) -> bpy.types.Image:
    """Generate a realistic normal map with plastic injection mold micro-detail."""
    img = bpy.data.images.new(name, TEXTURE_RES, TEXTURE_RES, alpha=True, float_buffer=False)
    total = TEXTURE_RES * TEXTURE_RES * 4
    pix = array("f", [0.0]) * total

    for y in range(TEXTURE_RES):
        row = y * TEXTURE_RES * 4
        for x in range(TEXTURE_RES):
            i = row + x * 4

            # Fine plastic grain bumps
            nx = math.sin(x * 0.197 + y * 0.123) * math.cos(x * 0.083 - y * 0.057)
            ny = math.cos(x * 0.111 + y * 0.171) * math.sin(x * 0.067 - y * 0.091)

            # Mold texture: slightly directional
            nx += math.sin(y * 0.047 + math.sin(x * 0.013) * 2.0) * 0.15
            ny += math.cos(x * 0.031 + y * 0.019) * 0.08

            if is_body:
                # Injection gate ripple marks near bottom
                ny_norm = y / TEXTURE_RES
                if ny_norm < 0.15:
                    gate = math.sin(x * 0.23 + y * 0.31) * 0.2 * (0.15 - ny_norm) / 0.15
                    nx += gate
                # Parting line detail
                nx_norm = x / TEXTURE_RES
                for sx in (0.25, 0.75):
                    dist = abs(nx_norm - sx)
                    if dist < 0.005:
                        nx += 0.25 * (1.0 - dist / 0.005) * (1 if nx_norm > sx else -1)

            strength = 0.012 if is_body else 0.018
            pix[i] = 0.5 + nx * strength
            pix[i + 1] = 0.5 + ny * strength
            pix[i + 2] = 1.0
            pix[i + 3] = 1.0

    img.pixels.foreach_set(pix)
    img.pack()
    img.colorspace_settings.name = "Non-Color"
    return img


def make_roughness_texture(name: str, base_roughness: float, is_body: bool = False) -> bpy.types.Image:
    """Generate a roughness map with realistic wear variation."""
    img = bpy.data.images.new(name, TEXTURE_RES, TEXTURE_RES, alpha=True, float_buffer=False)
    total = TEXTURE_RES * TEXTURE_RES * 4
    pix = array("f", [0.0]) * total

    for y in range(TEXTURE_RES):
        row = y * TEXTURE_RES * 4
        for x in range(TEXTURE_RES):
            i = row + x * 4

            # Base roughness with micro-variation
            variation = math.sin(x * 0.073 + y * 0.051) * math.sin(x * 0.031 - y * 0.019) * 0.04

            # Broad roughness variation (handling wear)
            wear = math.sin(x * 0.007 + y * 0.005) * 0.02

            if is_body:
                # Slightly smoother on flat faces, rougher on grip areas
                grip = max(0.0, math.sin(x * 0.015) * math.sin(y * 0.011)) * 0.03
                val = base_roughness + variation + wear + grip
            else:
                # Cap has more uniform roughness with slight ribbing pattern
                rib = abs(math.sin(y * 0.3)) * 0.02
                val = base_roughness + variation + rib

            val = min(max(val, 0.0), 1.0)
            pix[i] = val
            pix[i + 1] = val
            pix[i + 2] = val
            pix[i + 3] = 1.0

    img.pixels.foreach_set(pix)
    img.pack()
    img.colorspace_settings.name = "Non-Color"
    return img


def make_material(
    name: str,
    color: tuple[float, float, float, float],
    roughness: float,
    is_body: bool = False,
) -> bpy.types.Material:
    """Create a realistic HDPE plastic material with proper PBR setup."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes.get("Principled BSDF")

    # Base color texture
    base_img = make_basecolor_texture(f"{name}_BaseColor", color, is_body=is_body)
    tex_base = nodes.new("ShaderNodeTexImage")
    tex_base.image = base_img
    links.new(tex_base.outputs["Color"], bsdf.inputs["Base Color"])

    # Normal map texture
    normal_img = make_normal_texture(f"{name}_Normal", is_body=is_body)
    tex_normal = nodes.new("ShaderNodeTexImage")
    tex_normal.image = normal_img
    normal_map = nodes.new("ShaderNodeNormalMap")
    normal_map.inputs["Strength"].default_value = 0.10 if is_body else 0.08
    links.new(tex_normal.outputs["Color"], normal_map.inputs["Color"])
    links.new(normal_map.outputs["Normal"], bsdf.inputs["Normal"])

    # Roughness map texture
    rough_img = make_roughness_texture(f"{name}_Roughness", roughness, is_body=is_body)
    tex_rough = nodes.new("ShaderNodeTexImage")
    tex_rough.image = rough_img
    tex_rough.image.colorspace_settings.name = "Non-Color"
    links.new(tex_rough.outputs["Color"], bsdf.inputs["Roughness"])

    # Metallic = 0 for plastic
    bsdf.inputs["Metallic"].default_value = 0.0

    # Specular / IOR for HDPE plastic (IOR ~1.54)
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.50
    elif "Specular" in bsdf.inputs:
        bsdf.inputs["Specular"].default_value = 0.50

    # Subsurface scattering for translucent plastic look
    if "Subsurface Weight" in bsdf.inputs:
        bsdf.inputs["Subsurface Weight"].default_value = 0.04 if is_body else 0.02
        if "Subsurface Radius" in bsdf.inputs:
            bsdf.inputs["Subsurface Radius"].default_value = (0.8, 0.6, 0.4)
    elif "Subsurface" in bsdf.inputs:
        bsdf.inputs["Subsurface"].default_value = 0.04 if is_body else 0.02

    # Clearcoat for plastic sheen
    for coat_w, coat_r in (("Coat Weight", "Coat Roughness"), ("Clearcoat", "Clearcoat Roughness")):
        if coat_w in bsdf.inputs:
            bsdf.inputs[coat_w].default_value = 0.12 if is_body else 0.25
            bsdf.inputs[coat_r].default_value = 0.30 if is_body else 0.18
            break

    # Alpha
    if "Alpha" in bsdf.inputs:
        bsdf.inputs["Alpha"].default_value = 1.0

    mat.diffuse_color = color
    return mat


def bbox_world(obj: bpy.types.Object) -> tuple[Vector, Vector]:
    pts = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    return (
        Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))),
        Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts))),
    )


def box_project_uv(obj: bpy.types.Object) -> None:
    """Apply box projection UVs for proper texture mapping."""
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
    """Assign cap material to the top cylindrical region of the model."""
    me = obj.data
    minv, maxv = bbox_world(obj)
    dims = maxv - minv

    # The cap is the compact cylindrical mass near the top. On the user's
    # uploaded scan, it's offset to one side near the handle opening.
    cap_center = Vector((
        minv.x + dims.x * 0.30,
        minv.y + dims.y * 0.51,
        minv.z + dims.z * 0.865,
    ))
    rx = dims.x * 0.19
    ry = dims.y * 0.25
    z_min = minv.z + dims.z * 0.76

    cap_faces = 0
    for poly in me.polygons:
        center = obj.matrix_world @ poly.center
        radial = ((center.x - cap_center.x) / rx) ** 2 + ((center.y - cap_center.y) / ry) ** 2
        is_cap = center.z >= z_min and radial <= 1.30
        poly.material_index = 1 if is_cap else 0
        cap_faces += int(is_cap)
    print(f"Assigned cap material to {cap_faces} / {len(me.polygons)} faces")


def import_user_model() -> bpy.types.Object:
    """Import user GLB, remove stray objects, scale to real size, center."""
    bpy.ops.import_scene.gltf(filepath=SRC_GLB)

    # Remove stray Cube or non-product meshes
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    product_meshes = []
    for obj in meshes:
        if obj.name.lower() == "cube" and len(obj.data.vertices) <= 8:
            bpy.data.objects.remove(obj, do_unlink=True)
        else:
            product_meshes.append(obj)

    if not product_meshes:
        raise RuntimeError(f"No product mesh found in {SRC_GLB}")

    for obj in product_meshes:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = product_meshes[0]
    if len(product_meshes) > 1:
        bpy.ops.object.join()
    obj = bpy.context.object
    obj.name = "FoodOilCan_Product09"
    obj.data.name = "FoodOilCan_Product09_Mesh"

    # Clear existing materials
    obj.data.materials.clear()

    # Scale to real-world size
    minv, maxv = bbox_world(obj)
    height = maxv.z - minv.z
    if height > 0:
        scale = TARGET_HEIGHT_M / height
        obj.scale = (obj.scale.x * scale, obj.scale.y * scale, obj.scale.z * scale)
        bpy.context.view_layer.update()

    # Center on XY, base at Z=0
    minv, maxv = bbox_world(obj)
    obj.location.x -= (minv.x + maxv.x) * 0.5
    obj.location.y -= (minv.y + maxv.y) * 0.5
    obj.location.z -= minv.z
    bpy.context.view_layer.update()
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    # Smooth shading with auto-smooth normals
    bpy.ops.object.shade_smooth()

    return obj


def main() -> None:
    clean_scene()
    obj = import_user_model()

    # Create realistic materials
    body_mat = make_material(
        "OilCan_Body_BrightWhite",
        BODY_COLOR,
        roughness=0.42,
        is_body=True,
    )
    cap_mat = make_material(
        "OilCan_Cap_Red",
        CAP_COLOR,
        roughness=0.25,
        is_body=False,
    )

    # Assign materials
    obj.data.materials.append(body_mat)
    obj.data.materials.append(cap_mat)

    # UV project and assign cap region
    box_project_uv(obj)
    assign_cap_material(obj)

    # Export GLB
    os.makedirs(os.path.dirname(OUT_GLB), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=OUT_GLB,
        export_format="GLB",
        export_yup=True,
        export_apply=True,
        export_materials="EXPORT",
        export_image_format="JPEG",
        export_image_quality=85,
    )

    # Copy to dist
    os.makedirs(os.path.dirname(DIST_GLB), exist_ok=True)
    with open(OUT_GLB, "rb") as src, open(DIST_GLB, "wb") as dst:
        dst.write(src.read())

    size_mb = os.path.getsize(OUT_GLB) / 1e6
    print(f"GLB written: {OUT_GLB} ({size_mb:.2f} MB)")
    print(f"GLB copied:  {DIST_GLB}")
    print(f"Vertices: {len(obj.data.vertices)}, Faces: {len(obj.data.polygons)}")
    print(f"Materials: {[m.name for m in obj.data.materials]}")


if __name__ == "__main__":
    main()
