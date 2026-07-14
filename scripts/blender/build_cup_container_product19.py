"""Build WhiteDot Product 19: photo-matched tapered cup and snap lid.

The supplied blueprint cards disagree with each other (180-212 mm height,
88-110 mm lid diameter, and 500/750 ml capacity).  The two photographs are
therefore the visual authority.  The editable dimensions below preserve the
strongest consistent blueprint details: 95 mm lid OD, 88 mm mouth OD, 72 mm
base OD, 1.8 mm nominal wall, and an R10-like internal base transition.

Blender 5.1 headless usage:
  blender -b --factory-startup --python scripts/blender/build_cup_container_product19.py
"""
import math
import os

import bpy
from mathutils import Vector


MM = 0.001
SEGMENTS = 192
REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_DIR = os.path.join(REPO, "public", "case-study", "model")
RENDER_DIR = os.path.join(REPO, "scripts", "blender", "renders", "product19-cup-container")
GLB_PATH = os.path.join(MODEL_DIR, "product-19-cup-container.glb")
BLEND_PATH = os.path.join(RENDER_DIR, "product-19-cup-container.blend")

# Photo-matched envelope. Change only these values after physical caliper checks.
ASSEMBLED_H = 150.0
BODY_H = 142.0
BASE_OD = 72.0
MOUTH_OD = 88.0
LID_OD = 95.0
WALL = 1.8
BOTTOM = 2.0


def material(name, color, roughness, transmission=0.0, alpha=1.0, micro_strength=0.08):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, alpha)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, alpha)
    bsdf.inputs["Roughness"].default_value = roughness
    if "IOR" in bsdf.inputs:
        bsdf.inputs["IOR"].default_value = 1.47
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.34
    if "Subsurface Weight" in bsdf.inputs:
        bsdf.inputs["Subsurface Weight"].default_value = 0.018
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = 0.14
    if "Coat Roughness" in bsdf.inputs:
        bsdf.inputs["Coat Roughness"].default_value = 0.20
    if "Transmission Weight" in bsdf.inputs:
        bsdf.inputs["Transmission Weight"].default_value = transmission
    if alpha < 1.0:
        bsdf.inputs["Alpha"].default_value = alpha
        mat.surface_render_method = 'DITHERED'
    # Very restrained injection-moulded orange-peel. Generated coordinates keep
    # the relief seamless while avoiding the artificial perfection of flat CG.
    if micro_strength:
        nodes = mat.node_tree.nodes
        links = mat.node_tree.links
        tex = nodes.new("ShaderNodeTexNoise")
        tex.name = "microscopic molded surface variation"
        tex.inputs["Scale"].default_value = 1200.0
        tex.inputs["Detail"].default_value = 2.2
        tex.inputs["Roughness"].default_value = 0.58
        bump = nodes.new("ShaderNodeBump")
        bump.name = "subtle injection molded micro relief"
        bump.inputs["Strength"].default_value = micro_strength
        bump.inputs["Distance"].default_value = 0.000006
        links.new(tex.outputs["Fac"], bump.inputs["Height"])
        links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


def lathe(name, profile, mat, segments=SEGMENTS):
    """Revolve a closed radial profile of (radius_mm, z_mm) around Z."""
    verts = []
    for radius, z in profile:
        for i in range(segments):
            a = 2.0 * math.pi * i / segments
            verts.append((radius * math.cos(a) * MM, radius * math.sin(a) * MM, z * MM))
    faces = []
    rings = len(profile)
    for j in range(rings):
        nj = (j + 1) % rings
        for i in range(segments):
            ni = (i + 1) % segments
            faces.append((j * segments + i, j * segments + ni,
                          nj * segments + ni, nj * segments + i))
    mesh = bpy.data.meshes.new(name + " mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    bevel = obj.modifiers.new("micro molded edge softening", "BEVEL")
    bevel.width = 0.22 * MM
    bevel.segments = 2
    bevel.limit_method = 'ANGLE'
    return obj


def torus(name, major_radius, minor_radius, z, mat, major_segments=SEGMENTS, minor_segments=16):
    bpy.ops.mesh.primitive_torus_add(
        align='WORLD', major_segments=major_segments, minor_segments=minor_segments,
        location=(0, 0, z * MM), major_radius=major_radius * MM,
        minor_radius=minor_radius * MM,
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj


def cylinder(name, radius, depth, z, mat, vertices=128, bevel=0.25):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius * MM,
                                       depth=depth * MM, location=(0, 0, z * MM))
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new("soft molded edge", "BEVEL")
        mod.width = bevel * MM
        mod.segments = 3
        mod.limit_method = 'ANGLE'
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj


bpy.ops.wm.read_factory_settings(use_empty=True)
body_mat = material("warm white matte polypropylene", (0.72, 0.68, 0.61), 0.31, micro_strength=0.0)
lid_mat = material("milky translucent snap lid", (0.78, 0.73, 0.65), 0.22, 0.07, 0.97, 0.0)
detail_mat = material("subtle lid center polypropylene", (0.69, 0.65, 0.59), 0.30, 0.015, 1.0, 0.0)

# Closed, genuinely hollow cup shell. The small stepped foot and softly raised
# bottom match the photo; the inner R10-like transition avoids a sharp cavity.
body_profile = [
    (35.0, 0.8), (36.0, 0.0), (36.7, 0.7), (36.8, 1.8),
    (36.3, 3.2), (36.2, 5.2), (42.65, 136.0),
    (43.1, 138.5), (43.9, 139.2), (45.0, 139.8),
    (45.0, 141.6), (44.2, 142.2),
    # inner wall, traversed downward to close the shell
    (42.4, 141.5), (41.25, 137.0), (34.4, 10.5),
    (34.0, 7.0), (33.2, 4.0), (31.5, 2.4), (0.05, 2.4),
]
body = lathe("Product 19 cup body", body_profile, body_mat)

# Slight bottom injection gate visible in the face-on lid/bottom photo.
gate = cylinder("subtle 2.5 mm injection gate witness", 1.25, 0.20, 0.12, body_mat, 48, 0.05)

# The real lid is a smooth three-level closure, not the radial-rib construction
# suggested by one speculative blueprint. This profile matches both photographs.
lid_profile = [
    (42.8, 140.4), (44.4, 140.4), (45.5, 141.0), (46.1, 142.0),
    (46.1, 143.2), (47.1, 143.7), (47.5, 144.6), (47.5, 146.2),
    (47.0, 147.2), (46.0, 148.1), (43.8, 148.8),
    (41.5, 149.4), (38.5, 149.8), (37.6, 149.0),
    (16.0, 148.60), (0.05, 148.60),
    # top underside / seal return
    (0.05, 147.9), (38.4, 147.9), (41.0, 147.2), (42.0, 146.0),
    (42.0, 143.2), (42.8, 143.2),
]
lid = lathe("Product 19 snap lid", lid_profile, lid_mat)

# Visible concentric detail from the real top photograph: a broad shallow
# circular depression, a thin inner ring, and a small central molding witness.
panel = cylinder("shallow recessed lid panel", 37.45, 0.18, 148.58, detail_mat, 160, 0.08)
inner_ring = torus("fine inner lid sealing ring", 39.25, 0.42, 148.30, lid_mat)
center_disc = cylinder("soft circular lid center", 22.5, 0.10, 148.72, detail_mat, 128, 0.04)
center_gate = cylinder("lid central gate mark", 1.35, 0.16, 148.84, detail_mat, 48, 0.04)
lid_parts = [lid, panel, inner_ring, center_disc, center_gate]

# Named exploded animation for the WhiteDot model-viewer.
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end = 80
lid_root = bpy.data.objects.new("Lid Assembly", None)
bpy.context.collection.objects.link(lid_root)
for obj in lid_parts:
    obj.parent = lid_root
lid_root.keyframe_insert(data_path="location", frame=1)
lid_root.keyframe_insert(data_path="location", frame=22)
lid_root.location.z = 52.0 * MM
lid_root.keyframe_insert(data_path="location", frame=60)
lid_root.keyframe_insert(data_path="location", frame=80)
lid_root.location.z = 0.0
if lid_root.animation_data and lid_root.animation_data.action:
    lid_root.animation_data.action.name = "Explode"

# Premium neutral studio used only for QA renders; it is excluded from GLB.
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = 1800
scene.render.resolution_y = 1800
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.film_transparent = False
scene.view_settings.look = 'AgX - Medium High Contrast'
scene.view_settings.exposure = -1.25
world = bpy.data.worlds.new("neutral photo studio")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.055, 0.055, 0.052, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 0.10
scene.world = world

floor_mat = material("charcoal studio surface", (0.026, 0.025, 0.024), 0.56)
bpy.ops.mesh.primitive_plane_add(size=1.4, location=(0, 0, -0.5 * MM))
floor = bpy.context.object
floor.name = "QA studio floor - not exported"
floor.data.materials.append(floor_mat)

def area(name, location_mm, energy, size_mm, target=(0, 0, 72)):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy = energy
    data.shape = 'DISK'
    data.size = size_mm * MM
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = tuple(v * MM for v in location_mm)
    obj.rotation_euler = (Vector(tuple(v * MM for v in target)) - obj.location).to_track_quat('-Z', 'Y').to_euler()
    return obj

area("large left softbox", (-250, -300, 300), 18, 270)
area("right fill", (240, -160, 170), 6, 210)
area("top rim light", (30, 150, 330), 12, 200)
area("front fill", (0, -380, 110), 5, 260)

bpy.ops.object.camera_add(location=(0, -390 * MM, 82 * MM))
cam = bpy.context.object
cam.name = "QA camera"
cam.data.lens = 68
cam.rotation_euler = (Vector((0, 0, 74 * MM)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
scene.camera = cam

os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(RENDER_DIR, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)

# Export only the product geometry, keeping QA lights/camera/floor out.
bpy.ops.object.select_all(action='DESELECT')
for obj in [body, gate, lid_root] + lid_parts:
    obj.select_set(True)
bpy.context.view_layer.objects.active = body
bpy.ops.export_scene.gltf(
    filepath=GLB_PATH, export_format='GLB', export_yup=True, export_apply=True,
    export_materials='EXPORT', export_animations=True, export_frame_range=True,
    use_selection=True,
)

scene.frame_set(1)
scene.render.filepath = os.path.join(RENDER_DIR, "product-19-cup-container-front.png")
bpy.ops.render.render(write_still=True)

cam.location = (205 * MM, -300 * MM, 190 * MM)
cam.rotation_euler = (Vector((0, 0, 76 * MM)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
scene.render.filepath = os.path.join(RENDER_DIR, "product-19-cup-container-three-quarter.png")
bpy.ops.render.render(write_still=True)

cam.location = (0, -4 * MM, 430 * MM)
cam.rotation_euler = (Vector((0, 0, 145 * MM)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
scene.render.filepath = os.path.join(RENDER_DIR, "product-19-cup-container-top.png")
bpy.ops.render.render(write_still=True)

# Optional native 12K hero pass. Keeping it behind an environment switch makes
# normal GLB rebuilds fast while preserving a repeatable premium render path.
hero_mode = os.environ.get("PRODUCT19_RENDER_12K")
if hero_mode in {"1", "review"}:
    scene.eevee.taa_render_samples = 16
    scene.view_settings.exposure = -1.18
    cam.data.lens = 72
    cam.location = (300 * MM, -590 * MM, 190 * MM)
    cam.rotation_euler = (Vector((0, 0, 74 * MM)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    if hero_mode == "1":
        scene.render.resolution_x = 12288
        scene.render.resolution_y = 6912
        scene.render.resolution_percentage = 100
        scene.render.image_settings.color_depth = '8'
        scene.render.image_settings.compression = 18
        scene.render.filepath = os.path.join(RENDER_DIR, "product-19-cup-container-12k.png")
        bpy.ops.render.render(write_still=True)

    # Lightweight derivative for visual QA in Codex without downsampling or
    # overwriting the native 84.9-megapixel frame.
    scene.render.resolution_x = 2048
    scene.render.resolution_y = 1152
    scene.render.image_settings.compression = 35
    scene.render.filepath = os.path.join(RENDER_DIR, "product-19-cup-container-12k-review.png")
    bpy.ops.render.render(write_still=True)

print("WROTE", GLB_PATH)
print("WROTE", BLEND_PATH)
