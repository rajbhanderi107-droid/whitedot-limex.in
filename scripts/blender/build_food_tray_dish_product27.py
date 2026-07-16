"""Build WhiteDot Product 27: Food Tray Dish (three-compartment meal tray).

No reference photography or verified spec sheet exists yet, so this is an
honest unbranded procedural model of a typical Indian FMCG thermoformed
meal tray: 227 x 178 x 32 mm footprint, one large well plus two small wells,
soft radiused partitions and a flat perimeter flange. Replace dimensions
once caliper data or supplier drawings arrive.

Blender 5.1 headless usage:
  blender -b --factory-startup --python scripts/blender/build_food_tray_dish_product27.py
"""
import math
import os

import bpy
from mathutils import Vector


MM = 0.001
REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_DIR = os.path.join(REPO, "public", "case-study", "model")
RENDER_DIR = os.path.join(REPO, "scripts", "blender", "renders", "product27-food-tray-dish")
GLB_PATH = os.path.join(MODEL_DIR, "product-27-food-tray-dish.glb")
BLEND_PATH = os.path.join(RENDER_DIR, "product-27-food-tray-dish.blend")

TRAY_L = 227.0   # X
TRAY_W = 178.0   # Y
TRAY_H = 32.0    # Z
CORNER_R = 18.0
FLANGE = 9.0     # flat rim width
PARTITION = 6.0  # wall between wells
FLOOR = 2.4


def material(name, color, roughness):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    if "IOR" in bsdf.inputs:
        bsdf.inputs["IOR"].default_value = 1.47
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.34
    if "Subsurface Weight" in bsdf.inputs:
        bsdf.inputs["Subsurface Weight"].default_value = 0.02
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = 0.10
    if "Coat Roughness" in bsdf.inputs:
        bsdf.inputs["Coat Roughness"].default_value = 0.24
    return mat


def rounded_box(name, size_x, size_y, size_z, corner_r, z_bottom, mat=None,
                center=(0.0, 0.0), taper=0.0):
    """Manifold rounded-rectangle prism built from an extruded superellipse-ish
    outline: straight edges + circular corner arcs, optionally tapered so the
    bottom outline is inset by `taper` mm (draft angle look)."""
    arc_steps = 14
    hx, hy = size_x / 2.0 - corner_r, size_y / 2.0 - corner_r

    def ring(inset, z):
        r = corner_r - inset if corner_r - inset > 0.5 else 0.5
        pts = []
        centers = [(hx, hy, 0.0), (-hx, hy, 90.0), (-hx, -hy, 180.0), (hx, -hy, 270.0)]
        for cx, cy, start in centers:
            for i in range(arc_steps + 1):
                a = math.radians(start + 90.0 * i / arc_steps)
                pts.append(((center[0] + cx + r * math.cos(a)) * MM,
                            (center[1] + cy + r * math.sin(a)) * MM,
                            z * MM))
        return pts

    bottom = ring(taper, z_bottom)
    top = ring(0.0, z_bottom + size_z)
    n = len(bottom)
    verts = bottom + top
    faces = []
    for i in range(n):
        ni = (i + 1) % n
        faces.append((i, ni, n + ni, n + i))
    faces.append(tuple(range(n - 1, -1, -1)))          # bottom cap
    faces.append(tuple(range(n, 2 * n)))               # top cap
    mesh = bpy.data.meshes.new(name + " mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    if mat:
        obj.data.materials.append(mat)
    return obj


bpy.ops.wm.read_factory_settings(use_empty=True)
tray_mat = material("warm white matte polypropylene tray", (0.74, 0.70, 0.63), 0.30)

# Tray body: gentle draft so the sides read thermoformed, not machined.
body = rounded_box("Product 27 food tray dish", TRAY_L, TRAY_W, TRAY_H,
                   CORNER_R, 0.0, tray_mat, taper=7.0)

# Wells. Layout: one large left well + two stacked right wells.
inner_l = TRAY_L - 2 * FLANGE
inner_w = TRAY_W - 2 * FLANGE
big_w = inner_l * 0.60
small_w = inner_l - big_w - PARTITION
small_h = (inner_w - PARTITION) / 2.0
depth = TRAY_H - FLOOR
wells = [
    ("large well", big_w, inner_w, (-(inner_l / 2.0 - big_w / 2.0), 0.0)),
    ("small well upper", small_w, small_h,
     (inner_l / 2.0 - small_w / 2.0, (inner_w / 2.0 - small_h / 2.0))),
    ("small well lower", small_w, small_h,
     (inner_l / 2.0 - small_w / 2.0, -(inner_w / 2.0 - small_h / 2.0))),
]
for wname, wx, wy, wcenter in wells:
    cutter = rounded_box(wname + " cutter", wx, wy, depth + 6.0, 13.0,
                         FLOOR, center=wcenter, taper=8.0)
    mod = body.modifiers.new(wname, "BOOLEAN")
    mod.operation = 'DIFFERENCE'
    mod.solver = 'MANIFOLD'
    mod.object = cutter
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter, do_unlink=True)

# Soft molded edges everywhere the boolean left sharp corners, then smooth.
bev = body.modifiers.new("soft thermoformed edges", "BEVEL")
bev.width = 2.0 * MM
bev.segments = 4
bev.limit_method = 'ANGLE'
bev.angle_limit = math.radians(40)
bpy.context.view_layer.objects.active = body
bpy.ops.object.modifier_apply(modifier=bev.name)
for poly in body.data.polygons:
    poly.use_smooth = True
bpy.ops.object.select_all(action='DESELECT')
body.select_set(True)
bpy.context.view_layer.objects.active = body
bpy.ops.object.shade_smooth_by_angle(angle=math.radians(42))

# QA studio (excluded from GLB).
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = 1800
scene.render.resolution_y = 1800
scene.render.image_settings.file_format = 'PNG'
scene.view_settings.look = 'AgX - Medium High Contrast'
scene.view_settings.exposure = -1.1
world = bpy.data.worlds.new("neutral photo studio")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.055, 0.055, 0.052, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 0.10
scene.world = world

floor_mat = material("charcoal studio surface", (0.026, 0.025, 0.024), 0.56)
bpy.ops.mesh.primitive_plane_add(size=1.6, location=(0, 0, -0.5 * MM))
floor_obj = bpy.context.object
floor_obj.name = "QA studio floor - not exported"
floor_obj.data.materials.append(floor_mat)


def area(name, location_mm, energy, size_mm, target=(0, 0, 16)):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy = energy
    data.shape = 'DISK'
    data.size = size_mm * MM
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = tuple(v * MM for v in location_mm)
    obj.rotation_euler = (Vector(tuple(v * MM for v in target)) - obj.location).to_track_quat('-Z', 'Y').to_euler()
    return obj


area("large left softbox", (-300, -340, 320), 20, 300)
area("right fill", (280, -180, 190), 7, 240)
area("top rim light", (40, 190, 360), 14, 220)
area("front fill", (0, -420, 130), 6, 280)

bpy.ops.object.camera_add(location=(190 * MM, -330 * MM, 230 * MM))
cam = bpy.context.object
cam.name = "QA camera"
cam.data.lens = 62
cam.rotation_euler = (Vector((0, 0, 10 * MM)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
scene.camera = cam

os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(RENDER_DIR, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)

bpy.ops.object.select_all(action='DESELECT')
body.select_set(True)
bpy.context.view_layer.objects.active = body
bpy.ops.export_scene.gltf(
    filepath=GLB_PATH, export_format='GLB', export_yup=True, export_apply=True,
    export_materials='EXPORT', use_selection=True,
)

scene.render.filepath = os.path.join(RENDER_DIR, "product-27-food-tray-dish-three-quarter.png")
bpy.ops.render.render(write_still=True)

cam.location = (0, -6 * MM, 480 * MM)
cam.rotation_euler = (Vector((0, 0, 0)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
scene.render.filepath = os.path.join(RENDER_DIR, "product-27-food-tray-dish-top.png")
bpy.ops.render.render(write_still=True)

cam.location = (0, -430 * MM, 90 * MM)
cam.rotation_euler = (Vector((0, 0, 12 * MM)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
scene.render.filepath = os.path.join(RENDER_DIR, "product-27-food-tray-dish-front.png")
bpy.ops.render.render(write_still=True)

print("WROTE", GLB_PATH)
print("WROTE", BLEND_PATH)
