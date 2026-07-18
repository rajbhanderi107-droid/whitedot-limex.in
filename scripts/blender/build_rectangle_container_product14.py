"""Product 14 — D-250 rectangular container, Blender 5.1.

Photo- and blueprint-matched editable model. The 250 x 190 mm lid drawing and
the supplied photographs are treated as authoritative where the base sheet's
200 x 200 outline conflicts with the photographed rectangular proportions.
"""
import math
import os

import bpy
from mathutils import Vector

MM = 0.001
REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(REPO, "public", "case-study", "model", "rectangle-container-d250.glb")
RENDER_DIR = os.path.join(REPO, "scripts", "blender", "renders", "product14-d250")
BLEND_OUT = os.path.join(RENDER_DIR, "rectangle-container-d250.blend")

# Verified / photo-derived envelope in millimetres.
LID_W, LID_D = 250.0, 190.0
BODY_TOP_W, BODY_TOP_D = 232.0, 172.0
BODY_BOTTOM_W, BODY_BOTTOM_D = 224.0, 164.0
BODY_H = 65.0
WALL = 1.0
CORNER_R = 15.0
LID_H = 7.72


def material(name, rgb, roughness=0.32):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*rgb, 1.0)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*rgb, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    if "IOR" in bsdf.inputs:
        bsdf.inputs["IOR"].default_value = 1.46
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.38
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = 0.34
    if "Coat Roughness" in bsdf.inputs:
        bsdf.inputs["Coat Roughness"].default_value = 0.12
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = 0.18
    return mat


def rounded_box(name, size_mm, loc_mm, mat, radius_mm=2.0, parent=None):
    bpy.ops.mesh.primitive_cube_add(location=tuple(v * MM for v in loc_mm))
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = tuple(v * MM for v in size_mm)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bevel = obj.modifiers.new("injection moulded radius", "BEVEL")
    bevel.width = radius_mm * MM
    bevel.segments = 8
    bevel.limit_method = "ANGLE"
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    obj.data.materials.append(mat)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    normal = obj.modifiers.new("polished molded surface normals", "WEIGHTED_NORMAL")
    normal.keep_sharp = True
    obj.parent = parent
    return obj


def tapered_box(name, top, bottom, height, z0, mat, radius_mm, parent=None):
    bpy.ops.mesh.primitive_cube_add(location=(0, 0, (z0 + height / 2) * MM))
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = (top[0] * MM, top[1] * MM, height * MM)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    sx, sy = bottom[0] / top[0], bottom[1] / top[1]
    for vertex in obj.data.vertices:
        if vertex.co.z < 0:
            vertex.co.x *= sx
            vertex.co.y *= sy
    bevel = obj.modifiers.new("5 degree draft rounded mould", "BEVEL")
    bevel.width = radius_mm * MM
    bevel.segments = 8
    bevel.limit_method = "ANGLE"
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    obj.data.materials.append(mat)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    normal = obj.modifiers.new("polished tapered surface normals", "WEIGHTED_NORMAL")
    normal.keep_sharp = True
    obj.parent = parent
    return obj


def ring(name, width, depth, z, thickness, height, radius, mat, parent=None):
    outer = rounded_box(name, (width, depth, height), (0, 0, z), mat, radius, parent)
    cutter = rounded_box(
        name + " temporary centre cutter",
        (width - 2 * thickness, depth - 2 * thickness, height + 2),
        (0, 0, z),
        mat,
        max(0.2, radius - thickness),
    )
    boolean = outer.modifiers.new("continuous rounded moulding", "BOOLEAN")
    boolean.operation = "DIFFERENCE"
    boolean.solver = "EXACT"
    boolean.object = cutter
    bpy.context.view_layer.objects.active = outer
    bpy.ops.object.modifier_apply(modifier=boolean.name)
    bpy.data.objects.remove(cutter, do_unlink=True)
    for poly in outer.data.polygons:
        poly.use_smooth = True
    normal = outer.modifiers.new("polished continuous ring normals", "WEIGHTED_NORMAL")
    normal.keep_sharp = True
    return [outer]


def molded_text(body, name, loc, size, extrude, mat, parent=None):
    bpy.ops.object.text_add(location=(loc[0] * MM, loc[1] * MM, loc[2] * MM))
    obj = bpy.context.object
    obj.name = name
    obj.data.body = body
    obj.data.align_x = "CENTER"
    obj.data.align_y = "CENTER"
    obj.data.size = size * MM
    obj.data.extrude = extrude * MM
    obj.data.bevel_depth = 0.06 * MM
    obj.data.materials.append(mat)
    obj.parent = parent
    return obj


bpy.ops.wm.read_factory_settings(use_empty=True)
white = material("polished warm white food contact polypropylene", (0.76, 0.735, 0.69), 0.20)
mark = material("subtle polished embossed marking", (0.68, 0.655, 0.61), 0.28)
dark = material("matte charcoal studio floor", (0.014, 0.012, 0.011), 0.58)

body_root = bpy.data.objects.new("D-250 One-Piece Container", None)
bpy.context.scene.collection.objects.link(body_root)

# One-piece tapered body with a genuine open cavity and 1 mm nominal walls.
body = tapered_box(
    "D-250 tapered container shell",
    (BODY_TOP_W, BODY_TOP_D),
    (BODY_BOTTOM_W, BODY_BOTTOM_D),
    BODY_H,
    0,
    white,
    10.0,
    body_root,
)
cavity = tapered_box(
    "temporary 1 mm wall cavity",
    (BODY_TOP_W - 2 * WALL, BODY_TOP_D - 2 * WALL),
    (BODY_BOTTOM_W - 2 * WALL, BODY_BOTTOM_D - 2 * WALL),
    BODY_H - 2.2,
    2.2,
    white,
    9.0,
)
cut = body.modifiers.new("open food container cavity", "BOOLEAN")
cut.operation = "DIFFERENCE"
cut.solver = "EXACT"
cut.object = cavity
bpy.context.view_layer.objects.active = body
bpy.ops.object.modifier_apply(modifier=cut.name)
bpy.data.objects.remove(cavity, do_unlink=True)

# Single continuous filled flange: the previous stacked rings created visible
# seam gaps at the corners. Its 8 mm land overlaps the 1 mm shell wall and
# its opening is aligned directly to the boolean cavity.
ring("continuous filled top flange", 246, 186, 64.5, 10.0, 5.4, 14, white, body_root)

# Interior base details: central injection point, two ejector circles, markings.
for x in (-60, 60):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=10 * MM,
        minor_radius=0.48 * MM,
        major_segments=40,
        minor_segments=8,
        location=(x * MM, 0, 3.05 * MM),
    )
    ejector = bpy.context.object
    ejector.name = "20 mm ejector tool mark"
    ejector.data.materials.append(mark)
    ejector.parent = body_root
bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=1.25 * MM, location=(0, 0, 3.0 * MM))
injection = bpy.context.object
injection.name = "2.5 mm central injection point"
injection.scale.z = 0.16
injection.data.materials.append(mark)
injection.parent = body_root
molded_text("PP 5     FOOD SAFE     *", "interior food safe symbols", (0, 24, 3.0), 5.2, 0.24, mark, body_root)
molded_text("REUSABLE", "interior reusable marking", (0, 12, 3.0), 5.4, 0.24, mark, body_root)
molded_text("D-250", "interior part number", (0, -18, 3.0), 5.2, 0.24, mark, body_root)
# This is a one-piece container: the photographed "lid" artwork is actually
# molded into the interior base. Add its shallow recessed panel boundary and
# keep all branding on the floor of the container.
ring("interior recessed base panel boundary", 194, 142, 3.35, 1.0, 0.55, 10, white, body_root)
bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end = 1
bpy.context.scene.frame_set(1)

# Premium neutral studio, camera, and QA renders.
scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 3840
scene.render.resolution_y = 2160
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.view_settings.exposure = -1.65
scene.world = bpy.data.worlds.new("soft charcoal studio")
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs[0].default_value = (0.015, 0.014, 0.013, 1)
scene.world.node_tree.nodes["Background"].inputs[1].default_value = 0.25

def area(name, loc, energy, size):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = energy
    data.shape = "DISK"
    data.size = size * MM
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = tuple(v * MM for v in loc)
    obj.rotation_euler = (Vector((0, 0, 35 * MM)) - obj.location).to_track_quat("-Z", "Y").to_euler()

area("large soft key", (-300, -350, 400), 42, 260)
area("cool fill", (310, -80, 220), 16, 220)
area("rear rim", (0, 300, 300), 28, 180)
bpy.ops.mesh.primitive_plane_add(size=2.0, location=(0, 0, -1.2 * MM))
floor = bpy.context.object
floor.name = "studio floor (not exported)"
floor.data.materials.append(dark)
bpy.ops.object.camera_add(location=(330 * MM, -390 * MM, 245 * MM))
camera = bpy.context.object
camera.data.lens = 70
scene.camera = camera

def point_camera(target_mm):
    target = Vector(tuple(v * MM for v in target_mm))
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()

os.makedirs(os.path.dirname(OUT), exist_ok=True)
os.makedirs(RENDER_DIR, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=BLEND_OUT)

# Export only the one-piece product hierarchy.
bpy.ops.object.select_all(action="DESELECT")
body_root.select_set(True)
for child in body_root.children_recursive:
    child.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format="GLB",
    export_yup=True,
    export_apply=True,
    export_materials="EXPORT",
    use_selection=True,
    export_animations=False,
)

scene.frame_set(1)
point_camera((0, 0, 34))
scene.render.filepath = os.path.join(RENDER_DIR, "d250-closed-three-quarter.png")
bpy.ops.render.render(write_still=True)

camera.location = (315 * MM, -405 * MM, 300 * MM)
scene.frame_set(1)
point_camera((0, 0, 27))
scene.render.filepath = os.path.join(RENDER_DIR, "d250-interior-three-quarter.png")
bpy.ops.render.render(write_still=True)

scene.frame_set(1)
camera.location = (0, -530 * MM, 110 * MM)
point_camera((0, 0, 35))
scene.render.filepath = os.path.join(RENDER_DIR, "d250-front.png")
bpy.ops.render.render(write_still=True)

camera.location = (0, -1 * MM, 570 * MM)
point_camera((0, 0, 33))
scene.render.filepath = os.path.join(RENDER_DIR, "d250-top.png")
bpy.ops.render.render(write_still=True)
print("WROTE", OUT)
print("WROTE", BLEND_OUT)
