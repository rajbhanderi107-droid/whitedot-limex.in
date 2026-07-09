"""
Product 10 — Dairy Products Container, photo-matched procedural model.

Headless Blender (bpy 5.1 LTS) build script. Reproduces a tapered round
dairy tub (curd/dahi-style cup) with a snap-fit lid and an integrated
tamper-seal pull tab, built from the 3 supplied reference photos:
  1. Front view — tapered round white tub, glossy body, small pull tab
     sticking up off the lid rim on the left side.
  2. Underside-of-lid view — circular lid with a recessed inner disc,
     embossed rim text/seal ring, and the tab hinge visible at the edge.
  3. Three-quarter tilted view — confirms the taper, the lid seam line,
     and a specular streak consistent with smooth glossy HDPE/PP.

No dimensions card was supplied with these photos (unlike product 09),
so all sizes below are proportional estimates read off the images, not
calipered measurements — do not treat the mm values as verified specs.

Run:  <blender>/blender.exe -b --python scripts/blender/build_dairy_container_product10.py
Out:  public/case-study/model/dairy-container-procedural.glb  (+ preview renders)
"""

import math
import os

import bpy
import bmesh
from mathutils import Matrix, Vector

MM = 0.001

# ---------------------------------------------------------------- parameters
TOP_R = 52.0          # tub top opening radius (under the lid rim)
BASE_R = 40.0         # tub base radius — pronounced taper per the 3/4-view photo
BODY_H = 70.0         # tub body height, base to top rim
WALL = 1.6            # shell wall thickness
COLLAR_R = 52.8       # subtle outward collar bulge right under the lid seam
COLLAR_H = 3.0

LID_R = 53.6          # lid outer radius — thin overhang over the collar
LID_SKIRT_H = 5.5     # lid skirt drop — thin, subtle seam per the front photo
LID_TOP_H = 2.0        # thin flat lid cap
LID_LIP_IN = 0.97      # inner disc scale — shallow, barely-stepped top surface
LID_LIP_DROP = 0.6     # shallow recess of the inner disc

TAB_W, TAB_L, TAB_TH = 19.0, 15.0, 1.5   # small tamper-seal pull tab, per photo
TAB_ANGLE = math.radians(165)            # azimuth on the lid rim (left side, per photo)
TAB_TILT = math.radians(13)              # tab lies almost flat against the lid, per photo
                                          # (only tips up slightly at the free end)

SEGS = 96

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GLB_OUT = os.path.join(REPO, "public", "case-study", "model", "dairy-container-procedural.glb")
RENDER_DIR = os.environ.get("DAIRY_RENDER_DIR", os.path.join(REPO, "scripts", "blender", "renders"))
DO_RENDER = os.environ.get("DAIRY_RENDER", "1") != "0"


def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def srgb8(r, g, b):
    return (srgb_to_linear(r / 255), srgb_to_linear(g / 255), srgb_to_linear(b / 255), 1.0)


# Soft satin warm-white HDPE/PP, matched to the front-view photo's body tone.
# The faint vertical banding in the reference is the striped backdrop
# reflecting off the surface, not ribbing molded into the part — but the
# reflection is soft/diffuse, not a sharp mirror streak, so roughness is
# raised (and clearcoat lowered) from the first pass to read as satin.
COL_BODY = srgb8(240, 238, 231)
COL_LID = srgb8(242, 240, 234)


def new_object(name, mesh, material):
    obj = bpy.data.objects.new(name, mesh)
    obj.data.materials.append(material)
    bpy.context.scene.collection.objects.link(obj)
    for poly in mesh.polygons:
        poly.use_smooth = True
    return obj


def make_material(name, rgba, rough):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = rgba
    bsdf.inputs["Roughness"].default_value = rough
    for coat_w, coat_r in (("Coat Weight", "Coat Roughness"), ("Clearcoat", "Clearcoat Roughness")):
        if coat_w in bsdf.inputs:
            bsdf.inputs[coat_w].default_value = 0.06
            bsdf.inputs[coat_r].default_value = 0.3
            break

    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 520.0
    noise.inputs["Detail"].default_value = 2.0
    noise.inputs["Roughness"].default_value = 0.5
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.05
    bump.inputs["Distance"].default_value = 0.0005
    nt.links.new(noise.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


def bridge_rings(bm, rings, close_top=False, close_bottom=False):
    n = len(rings[0])
    for ra, rb in zip(rings, rings[1:]):
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((ra[i], ra[j], rb[j], rb[i]))
    if close_bottom:
        bm.faces.new(tuple(reversed(rings[0])))
    if close_top:
        bm.faces.new(tuple(rings[-1]))


bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

mat_body = make_material("DairyBody", COL_BODY, 0.40)
mat_lid = make_material("DairyLid", COL_LID, 0.42)


# ---------------------------------------------------------------- 1. TUB BODY
def build_body():
    bm = bmesh.new()
    rings = []
    # profile: (radius, z) base -> top, with a gentle continuous taper and a
    # small outward collar bulge right below the lid seam
    profile = [
        (BASE_R * 0.96, 0.0),
        (BASE_R, 2.0),
        (BASE_R + (TOP_R - BASE_R) * 0.35, BODY_H * 0.35),
        (BASE_R + (TOP_R - BASE_R) * 0.72, BODY_H * 0.72),
        (TOP_R, BODY_H - COLLAR_H),
        (COLLAR_R, BODY_H - COLLAR_H * 0.4),
        (COLLAR_R, BODY_H),
    ]
    for r, z in profile:
        ring = []
        for i in range(SEGS):
            t = 2 * math.pi * i / SEGS
            x, y = r * math.cos(t), r * math.sin(t)
            ring.append(bm.verts.new((x * MM, y * MM, z * MM)))
        rings.append(ring)
    bridge_rings(bm, rings, close_bottom=True)
    mesh = bpy.data.meshes.new("TubBody")
    bm.to_mesh(mesh)
    bm.free()
    obj = new_object("TubBody", mesh, mat_body)
    solid = obj.modifiers.new("shell", "SOLIDIFY")
    solid.thickness = WALL * MM
    solid.offset = -1.0
    return obj


# ---------------------------------------------------------------- 2. LID
def build_lid():
    bm = bmesh.new()
    rings = []
    # skirt: drops down from the flat cap to wrap the collar seam
    # (lid sits on TOP of the tub, so every z here is offset by BODY_H)
    skirt_profile = [
        (LID_R, BODY_H + LID_TOP_H - LID_SKIRT_H),
        (LID_R, BODY_H + LID_TOP_H),
    ]
    for r, z in skirt_profile:
        ring = []
        for i in range(SEGS):
            t = 2 * math.pi * i / SEGS
            x, y = r * math.cos(t), r * math.sin(t)
            ring.append(bm.verts.new((x * MM, y * MM, z * MM)))
        rings.append(ring)
    # flat outer rim band on top, then step down into the recessed inner
    # disc (matches the stepped profile visible in the underside photo)
    top_profile = [
        (LID_R, BODY_H + LID_TOP_H),
        (LID_R * 0.985, BODY_H + LID_TOP_H),
        (LID_R * LID_LIP_IN, BODY_H + LID_TOP_H - LID_LIP_DROP),
        (LID_R * LID_LIP_IN * 0.9, BODY_H + LID_TOP_H - LID_LIP_DROP),
    ]
    for r, z in top_profile:
        ring = []
        for i in range(SEGS):
            t = 2 * math.pi * i / SEGS
            x, y = r * math.cos(t), r * math.sin(t)
            ring.append(bm.verts.new((x * MM, y * MM, z * MM)))
        rings.append(ring)
    bridge_rings(bm, rings, close_top=True)
    mesh = bpy.data.meshes.new("Lid")
    bm.to_mesh(mesh)
    bm.free()
    obj = new_object("Lid", mesh, mat_lid)
    solid = obj.modifiers.new("shell", "SOLIDIFY")
    solid.thickness = WALL * MM
    solid.offset = -1.0
    return obj


# ---------------------------------------------------------------- 3. PULL TAB
def build_tab():
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=2.0)
    for v in bm.verts:
        co = v.co.copy()
        # rounded outer end
        if co.y > 0.5:
            co.y *= 0.9
        v.co = co
    mesh = bpy.data.meshes.new("PullTab")
    bm.to_mesh(mesh)
    bm.free()
    obj = new_object("PullTab", mesh, mat_lid)
    obj.scale = (TAB_W / 2 * MM, TAB_L / 2 * MM, TAB_TH / 2 * MM)
    hinge_r = LID_R * 0.99
    hx, hy = hinge_r * math.cos(TAB_ANGLE), hinge_r * math.sin(TAB_ANGLE)
    hz = BODY_H + LID_TOP_H - LID_SKIRT_H * 0.3
    bpy.context.view_layer.update()
    outward = Vector((math.cos(TAB_ANGLE), math.sin(TAB_ANGLE), 0))
    tilt_axis = outward.cross(Vector((0, 0, 1)))
    rot = Matrix.Rotation(TAB_TILT, 4, tilt_axis) @ Matrix.Rotation(TAB_ANGLE - math.pi / 2, 4, "Z")
    obj.location = Vector((hx, hy, hz)) * MM + rot @ Vector((0, TAB_L / 2 * MM, 0))
    obj.rotation_euler = rot.to_euler()
    return obj


body = build_body()
lid = build_lid()
tab = build_tab()

dg = bpy.context.evaluated_depsgraph_get()
for obj in (body, lid):
    ev = obj.evaluated_get(dg)
    mesh = bpy.data.meshes.new_from_object(ev)
    old = obj.data
    obj.modifiers.clear()
    obj.data = mesh
    bpy.data.meshes.remove(old)
    for poly in obj.data.polygons:
        poly.use_smooth = True

# ---------------------------------------------------------------- export GLB
bpy.context.view_layer.objects.active = body
for o in bpy.context.scene.objects:
    o.select_set(True)
os.makedirs(os.path.dirname(GLB_OUT), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=GLB_OUT,
    export_format="GLB",
    export_yup=True,
    export_apply=True,
    export_materials="EXPORT",
)
print(f"GLB written: {GLB_OUT} ({os.path.getsize(GLB_OUT) / 1e6:.2f} MB)")

# ---------------------------------------------------------------- previews
if DO_RENDER:
    os.makedirs(RENDER_DIR, exist_ok=True)
    scene.render.engine = "CYCLES"
    scene.cycles.samples = int(os.environ.get("DAIRY_SAMPLES", "160"))
    scene.cycles.use_denoising = True
    scene.cycles.denoiser = "OPENIMAGEDENOISE"
    res_x = int(os.environ.get("DAIRY_RES_X", "2400"))
    scene.render.resolution_x, scene.render.resolution_y = res_x, int(res_x * 3 / 4)
    scene.render.resolution_percentage = 100
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.exposure = 0.0

    world = bpy.data.worlds.new("Studio")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.05, 0.05, 0.055, 1)
    world.node_tree.nodes["Background"].inputs[1].default_value = 0.5
    scene.world = world

    def light(name, loc, energy, size):
        ld = bpy.data.lights.new(name, "AREA")
        ld.energy = energy
        ld.size = size
        lo = bpy.data.objects.new(name, ld)
        lo.location = loc
        lo.rotation_euler = (Vector((0, 0, 0)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        scene.collection.objects.link(lo)

    # Soft diffuse indoor light, per the reference photos — a big soft key
    # and matching fill (large source keeps specular gentle without going dim).
    light("Key", (0.18, -0.30, 0.32), 2.6, 0.55)
    light("Fill", (-0.30, -0.10, 0.22), 1.6, 0.7)
    light("Rim", (0.0, 0.32, 0.28), 1.2, 0.4)
    light("Top", (0.0, 0.0, 0.45), 1.0, 0.5)
    light("Top", (0.0, 0.0, 0.45), 0.5, 0.45)

    gbm = bmesh.new()
    bmesh.ops.create_grid(gbm, x_segments=1, y_segments=1, size=0.6)
    gmesh = bpy.data.meshes.new("Ground")
    gbm.to_mesh(gmesh)
    gbm.free()
    gmat = make_material("Ground", (0.045, 0.045, 0.05, 1), 0.55)
    ground = new_object("Ground", gmesh, gmat)
    ground.location = (0, 0, -0.0005)

    cam_data = bpy.data.cameras.new("Cam")
    cam = bpy.data.objects.new("Cam", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam

    def shoot(name, loc, target_z):
        cam.location = loc
        look = Vector((0, 0, target_z)) - cam.location
        cam.rotation_euler = look.to_track_quat("-Z", "Y").to_euler()
        scene.render.filepath = os.path.join(RENDER_DIR, name)
        bpy.ops.render.render(write_still=True)
        print("rendered", name)

    shoot("dairy_front.png", Vector((0.0, -0.32, 0.06)), 0.035)
    shoot("dairy_three_quarter.png", Vector((0.24, -0.26, 0.10)), 0.04)
    shoot("dairy_top.png", Vector((0.0, -0.02, 0.30)), 0.02)

print("DONE")
