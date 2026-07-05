"""
Color-grade the user-supplied AI-scanned jug mesh (New_Project_752026_2.glb)
to match the reference product photos, and render a 4K hero shot.

The source GLB is a bare, single-material-less mesh (no UVs, no vertex
colors, no material) straight out of an image-to-3D tool. Cap vs. body is
split by a geometric heuristic (top-left region of the mesh, verified
against a vertex-color preview render) since there is no other segmentation
data to go on. Materials/roughness/bump match the values already
established from the reference-photo sampling in
build_oil_bottle_product9.py (COL_BODY, COL_CAP).

Run:  python3 scripts/blender/colorgrade_scanned_jug.py
Out:  public/case-study/model/oil-jug-scanned-graded.glb
      scripts/blender/renders/scanned_hero_4k.png (3840x4800)
"""

import math
import os

import bpy
from mathutils import Vector

SRC_GLB = "/root/.claude/uploads/549b41fd-3266-5b59-aa30-a14054d32222/e9d2fa2a-New_Project_752026_2.glb"
REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GLB_OUT = os.path.join(REPO, "public", "case-study", "model", "oil-jug-scanned-graded.glb")
RENDER_DIR = os.path.join(REPO, "scripts", "blender", "renders")

# Same colors sampled from the reference photos, used in the procedural build
def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def srgb8(r, g, b):
    return (srgb_to_linear(r / 255), srgb_to_linear(g / 255), srgb_to_linear(b / 255), 1.0)


COL_BODY = srgb8(232, 224, 214)
COL_CAP = srgb8(207, 163, 47)


def make_material(name, rgba, rough):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = rgba
    bsdf.inputs["Roughness"].default_value = rough
    for coat_w, coat_r in (("Coat Weight", "Coat Roughness"), ("Clearcoat", "Clearcoat Roughness")):
        if coat_w in bsdf.inputs:
            bsdf.inputs[coat_w].default_value = 0.30
            bsdf.inputs[coat_r].default_value = 0.15
            break
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 900.0
    noise.inputs["Detail"].default_value = 2.0
    noise.inputs["Roughness"].default_value = 0.55
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.04
    bump.inputs["Distance"].default_value = 0.0004
    nt.links.new(noise.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


# ---------------------------------------------------------------- import
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
bpy.ops.import_scene.gltf(filepath=SRC_GLB)
obj = bpy.data.objects["geometry_0"]
mesh = obj.data
bpy.context.view_layer.objects.active = obj

# ---------------------------------------------------------------- cleanup
# Raw scan noise: merge doubles + a light Corrective Smooth pass to settle
# the stair-step high-frequency bumps without losing the real shape (the
# handle hole, ribs, cap thread all survive a mild smooth fine).
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.remove_doubles(threshold=0.0005)
bpy.ops.object.mode_set(mode="OBJECT")

smooth_mod = obj.modifiers.new("Smooth", "SMOOTH")
smooth_mod.factor = 0.5
smooth_mod.iterations = 3
dg = bpy.context.evaluated_depsgraph_get()
ev = obj.evaluated_get(dg)
mesh2 = bpy.data.meshes.new_from_object(ev)
old = obj.data
obj.modifiers.clear()
obj.data = mesh2
bpy.data.meshes.remove(old)
mesh = obj.data

for poly in mesh.polygons:
    poly.use_smooth = True

# ---------------------------------------------------------------- materials
mat_body = make_material("ScannedBody", COL_BODY, 0.34)
mat_cap = make_material("ScannedCap", COL_CAP, 0.28)
mesh.materials.append(mat_body)
mesh.materials.append(mat_cap)

# cap region heuristic, verified against a vertex-color preview render:
# top-left of the mesh (in Blender's imported Z-up frame)
CAP_Z_THRESHOLD = 0.80
CAP_X_THRESHOLD = -0.15
for poly in mesh.polygons:
    verts = [mesh.vertices[i].co for i in poly.vertices]
    cx = sum(v.x for v in verts) / len(verts)
    cz = sum(v.z for v in verts) / len(verts)
    poly.material_index = 1 if (cz > CAP_Z_THRESHOLD and cx < CAP_X_THRESHOLD) else 0

# ---------------------------------------------------------------- export GLB
os.makedirs(os.path.dirname(GLB_OUT), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=GLB_OUT,
    export_format="GLB",
    export_yup=True,
    export_apply=True,
    export_materials="EXPORT",
)
print(f"GLB written: {GLB_OUT} ({os.path.getsize(GLB_OUT) / 1e6:.2f} MB)")

# ---------------------------------------------------------------- 4K hero render
os.makedirs(RENDER_DIR, exist_ok=True)
scene.render.engine = "CYCLES"
scene.cycles.samples = int(os.environ.get("SCAN_SAMPLES", "200"))
scene.cycles.use_denoising = True
scene.cycles.denoiser = "OPENIMAGEDENOISE"
res_x = int(os.environ.get("SCAN_RES_X", "3840"))
scene.render.resolution_x, scene.render.resolution_y = res_x, int(res_x * 5 / 4)
scene.render.resolution_percentage = 100
# same color-grading look used across the procedural renders, so this
# matches the reference photos' tonality
scene.view_settings.view_transform = "Filmic"
scene.view_settings.look = "Medium Contrast"
scene.view_settings.exposure = 0.15

world = bpy.data.worlds.new("Studio")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.30, 0.31, 0.33, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 0.55
scene.world = world


def light(name, loc, energy, size, target=(0, 0, 0.05)):
    ld = bpy.data.lights.new(name, "AREA")
    ld.energy = energy
    ld.size = size
    lo = bpy.data.objects.new(name, ld)
    lo.location = loc
    lo.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    scene.collection.objects.link(lo)


dims = obj.dimensions
light("Key", (dims.x * 0.9, -dims.y * 3.0, dims.z * 0.55), 6.0, dims.x * 0.5)
light("Fill", (-dims.x * 1.3, -dims.y * 1.2, dims.z * 0.4), 1.3, dims.x * 1.3)
light("Rim", (0.0, dims.y * 3.0, dims.z * 0.45), 2.2, dims.x * 0.6)
light("Top", (0.0, 0.0, dims.z * 1.4), 1.6, dims.x * 1.0)

gbm_mesh = bpy.data.meshes.new("Ground")
gobj = bpy.data.objects.new("Ground", gbm_mesh)
scene.collection.objects.link(gobj)
import bmesh as _bmesh
_gb = _bmesh.new()
_bmesh.ops.create_grid(_gb, x_segments=1, y_segments=1, size=max(dims) * 3)
_gb.to_mesh(gbm_mesh)
_gb.free()
gmat = make_material("Ground", (0.045, 0.045, 0.05, 1), 0.55)
gobj.data.materials.append(gmat)
zmin = min(v.co.z for v in mesh.vertices)
gobj.location = (0, 0, zmin - 0.0005)

cam_data = bpy.data.cameras.new("Cam")
cam = bpy.data.objects.new("Cam", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam
maxdim = max(dims)
cam.location = (dims.x * 0.55, -maxdim * 1.55, dims.z * 0.05)
look = Vector((0, 0, dims.z * 0.02)) - Vector(cam.location)
cam.rotation_euler = look.to_track_quat("-Z", "Y").to_euler()

scene.render.filepath = os.path.join(RENDER_DIR, "scanned_hero_4k.png")
bpy.ops.render.render(write_still=True)
print("DONE — hero render written")
