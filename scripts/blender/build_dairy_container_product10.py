"""
Product 10 — Dairy Products Container, photo-matched procedural model.

Headless Blender (bpy 5.0 PyPI wheel) build script. Reproduces the squat
white sample tub from the 3 supplied reference photos (IMG_2613 front,
IMG_2614 top-down on the lid's outer face, IMG_2615 3/4 tilted):

  - IMG_2613: near-square silhouette (height roughly = max diameter),
    tapered body slightly wider under the cap than at the base, a
    twist/snap cap sitting over the rim with a visible horizontal parting
    groove partway down its skirt, and a small tab flap poking out to one
    side.
  - IMG_2614: looking straight down at the cap's top face — a recessed
    field carrying embossed "ALVA TECHNOPACK" + a small logo roundel
    centred, and curved instructional text "BREAK TAB AT SLOT BELOW TO
    OPEN LID" following the inner rim, plus the tamper break-tab hinge.
  - IMG_2615: confirms the cap's skirt overlaps the body shoulder with a
    visible step, and the body wall reads faintly translucent white.

DIMENSIONS: taken directly from the user-supplied "3D Modeling Specification
Sheet" (IMG_2849), which gives precise millimeter values measured off the
reference photos:
  - Total height with lid: 68.5mm; max width at lid: 82.5mm
  - Body: frustum, top outer dia 75.0mm, bottom outer dia 64.0mm, body
    height (base to rim) 66.0mm, wall ~1.5mm, base edge fillet R1.5mm
  - Lid: outer dia 82.5mm, inner seal ring dia 74.8mm, flat top dia
    66.0mm, total lid thickness 6.5mm, rim/skirt height 5.0mm
  - Tamper tab: 10mm wide x 5mm tall, protrudes 6mm; small 3x4mm security
    lock nub on the container rim below it
  - Lid top text: "ALIM" arced top-left + small "QUALITY PACK" roundel,
    and "BREAK TAB AT SLOT BELOW. ARROW TO OPEN LID" arced along the
    bottom, per the spec sheet's image_0 layout

Per docs/products/RULE.md this stays `status: "pending"` with
`composition: null` — geometry now matches the supplied spec sheet, but
no verified LIMEX composition/CO2/supplier data exists for this product
yet. The lid's moulded text is the physical sample's own identification
marking (reproduced for visual fidelity only), not a White Dot/LIMEX
brand claim.

Run:  python3 scripts/blender/build_dairy_container_product10.py
Out:  public/case-study/model/dairy-container-procedural.glb (+ preview renders)
"""

import math
import os

import bpy
import bmesh
from mathutils import Vector, Matrix

MM = 0.001
SEGS = 128

# ---------------------------------------------------------------- dimensions (mm, from spec sheet)
BASE_R = 32.0             # bottom outer radius (64.0mm dia)
TOP_OUTER_R = 37.5        # body top outer radius / rim (75.0mm dia)
BODY_H = 66.0             # body height, base to rim
BASE_FILLET_R = 1.5

LID_OUTER_R = 41.25       # lid overall outer radius (82.5mm dia)
LID_SEAL_R = 37.4         # inner seal ring radius (74.8mm dia) — engages the body rim
LID_TOP_R = 33.0          # flat top surface radius (66.0mm dia)
LID_SKIRT_H = 5.0         # rim/side-wall height (skirt drop over the body rim)
LID_THICK = 6.5           # total lid thickness, bottom of skirt to top surface
LID_Z0 = BODY_H - LID_SKIRT_H          # world z where the lid's outer skirt starts (61.0mm)
LID_Z1 = LID_Z0 + LID_THICK            # world z of the flat top surface (67.5mm, ~= 68.5mm spec)

TAB_ANGLE_DEG = 200.0     # tab position around the rim
TAB_W, TAB_H, TAB_PROTRUDE = 10.0, 5.0, 6.0
LOCK_W, LOCK_H, LOCK_D = 3.0, 4.0, 1.5   # security-lock nub on the body rim

FPS = 30
F_END = 120
LID_RISE = 95.0


# ---------------------------------------------------------------- colors
def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def srgb8(r, g, b):
    return (srgb_to_linear(r / 255), srgb_to_linear(g / 255), srgb_to_linear(b / 255), 1.0)


COL_BODY = srgb8(245, 244, 240)   # faintly translucent white sample-cup plastic
COL_CAP = srgb8(248, 247, 244)    # matching white cap, slightly brighter/matte
COL_TEXT = srgb8(225, 224, 220)   # emboss reads as same-color raised plastic, not printed ink

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GLB_OUT = os.path.join(REPO, "public", "case-study", "model", "dairy-container-procedural.glb")
RENDER_DIR = os.environ.get("DAIRY_RENDER_DIR", os.path.join(REPO, "scripts", "blender", "renders"))
DO_RENDER = os.environ.get("DAIRY_RENDER", "1") != "0"


# ---------------------------------------------------------------- helpers
def lerp(a, b, k):
    return a + (b - a) * k


def new_object(name, mesh, material):
    obj = bpy.data.objects.new(name, mesh)
    obj.data.materials.append(material)
    bpy.context.scene.collection.objects.link(obj)
    for poly in mesh.polygons:
        poly.use_smooth = True
    return obj


def make_material(name, rgba, rough, alpha=1.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = rgba
    bsdf.inputs["Roughness"].default_value = rough
    for coat_w, coat_r in (("Coat Weight", "Coat Roughness"), ("Clearcoat", "Clearcoat Roughness")):
        if coat_w in bsdf.inputs:
            bsdf.inputs[coat_w].default_value = 0.25
            bsdf.inputs[coat_r].default_value = 0.15
            break
    if alpha < 1.0 and "Alpha" in bsdf.inputs:
        bsdf.inputs["Alpha"].default_value = alpha
        mat.blend_method = "BLEND"
        if hasattr(mat, "show_transparent_back"):
            mat.show_transparent_back = False
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 380.0
    noise.inputs["Detail"].default_value = 2.0
    noise.inputs["Roughness"].default_value = 0.5
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.035
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


def ring_at(bm, r, z, wobble=None):
    ring = []
    for i in range(SEGS):
        t = 2 * math.pi * i / SEGS
        rr = r + (wobble(t) if wobble else 0.0)
        ring.append(bm.verts.new((rr * math.cos(t) * MM, rr * math.sin(t) * MM, z * MM)))
    return ring


def make_bent_text(text, size_mm, radius_mm, z_mm, thickness_mm, flip=False):
    """Small raised emboss text, bent to follow a circle of the given radius.

    Built directly in mm units (curve.size = size_mm, no MM factor yet), then
    each mesh vertex is remapped from flat (x, y) text-space onto a circle of
    the given radius in the XY plane — baseline sits at radius_mm, character
    height extends outward (or inward if flip). Local Z (the curve's extrude
    thickness) maps straight through to world Z, so the emboss simply sits
    proud of the flat lid-top plane with no extra rotation needed. Manual
    remap avoids the SIMPLE_DEFORM Bend modifier's axis-convention ambiguity,
    which previously sent the mesh curling in the wrong plane.
    """
    curve = bpy.data.curves.new(f"Txt_{text[:8]}", type='FONT')
    curve.body = text
    curve.size = size_mm
    curve.align_x = 'CENTER'
    curve.align_y = 'CENTER'
    curve.extrude = thickness_mm * 0.5
    obj = bpy.data.objects.new(f"Txt_{text[:8]}", curve)
    bpy.context.scene.collection.objects.link(obj)

    dg = bpy.context.evaluated_depsgraph_get()
    mesh = bpy.data.meshes.new_from_object(obj.evaluated_get(dg))
    bpy.data.objects.remove(obj, do_unlink=True)

    sign = -1.0 if flip else 1.0
    for v in mesh.vertices:
        x, y, z = v.co
        angle = sign * x / radius_mm
        eff_r = radius_mm + y
        v.co.x = eff_r * math.sin(angle)
        v.co.y = eff_r * math.cos(angle)
        v.co.z = z
    mesh.transform(Matrix.Scale(MM, 4))

    txt_obj = bpy.data.objects.new(f"Emboss_{text[:8]}", mesh)
    bpy.context.scene.collection.objects.link(txt_obj)
    txt_obj.location = (0, 0, z_mm * MM)
    for poly in mesh.polygons:
        poly.use_smooth = True
    return txt_obj


# ---------------------------------------------------------------- body
def build_body():
    bm = bmesh.new()
    rings = []
    # base edge fillet (R1.5) then straight taper up to the rim
    rings.append(ring_at(bm, BASE_R - BASE_FILLET_R * 0.3, 0.0))
    rings.append(ring_at(bm, BASE_R, BASE_FILLET_R))

    N = 18
    for k in range(1, N + 1):
        u = k / N
        z = lerp(BASE_FILLET_R, BODY_H, u)
        r = lerp(BASE_R, TOP_OUTER_R, u)
        rings.append(ring_at(bm, r, z))

    bridge_rings(bm, rings, close_bottom=True)
    mesh = bpy.data.meshes.new("DairyBody")
    bm.to_mesh(mesh)
    bm.free()
    return new_object("DairyBody", mesh, mat_body)


def build_lock_nub():
    """Small integrated security-lock nub on the body rim, below the tab."""
    bm = bmesh.new()
    ang = math.radians(TAB_ANGLE_DEG)
    cx, cy = (TOP_OUTER_R - 0.5) * math.cos(ang), (TOP_OUTER_R - 0.5) * math.sin(ang)
    ox, oy = math.cos(ang), math.sin(ang)
    tx, ty = -oy, ox
    z0, z1 = BODY_H - LOCK_H, BODY_H
    rings = []
    for z in (z0, z1):
        ring = []
        for (du, dv) in ((-LOCK_W / 2, 0.0), (-LOCK_W / 2, LOCK_D), (LOCK_W / 2, LOCK_D), (LOCK_W / 2, 0.0)):
            x = cx + tx * du + ox * dv
            y = cy + ty * du + oy * dv
            ring.append(bm.verts.new((x * MM, y * MM, z * MM)))
        rings.append(ring)
    bridge_rings(bm, rings, close_top=True, close_bottom=True)
    mesh = bpy.data.meshes.new("LockNub")
    bm.to_mesh(mesh)
    bm.free()
    return new_object("LockNub", mesh, mat_body)


# ---------------------------------------------------------------- cap: skirt + top
def build_cap_skirt():
    bm = bmesh.new()
    rings = []
    rings.append(ring_at(bm, LID_OUTER_R, LID_Z0))
    rings.append(ring_at(bm, LID_OUTER_R, LID_Z0 + LID_SKIRT_H * 0.55))
    rings.append(ring_at(bm, LID_OUTER_R - 1.3, BODY_H - 0.4))
    rings.append(ring_at(bm, LID_SEAL_R + 0.8, BODY_H + 0.2))
    rings.append(ring_at(bm, LID_SEAL_R, BODY_H + 0.6))
    bridge_rings(bm, rings)
    mesh = bpy.data.meshes.new("CapSkirt")
    bm.to_mesh(mesh)
    bm.free()
    return new_object("CapSkirt", mesh, mat_cap)


def build_cap_top():
    bm = bmesh.new()
    rings = []
    field_z0 = BODY_H + 0.6
    rings.append(ring_at(bm, LID_SEAL_R, field_z0))
    rings.append(ring_at(bm, LID_TOP_R + 1.5, field_z0 + 0.5))
    rings.append(ring_at(bm, LID_TOP_R, LID_Z1 - 0.6))
    # shallow recessed field, then a gentle near-flat top to the centre
    N_DOME = 14
    for k in range(1, N_DOME + 1):
        s = 1.0 - k / N_DOME
        z = (LID_Z1 - 0.6) + (LID_Z1 - (LID_Z1 - 0.6)) * (1 - s ** 2)
        r = LID_TOP_R * s if k < N_DOME else LID_TOP_R * 0.03
        rings.append(ring_at(bm, r, z))
    bridge_rings(bm, rings, close_top=True)
    mesh = bpy.data.meshes.new("CapTop")
    bm.to_mesh(mesh)
    bm.free()
    return new_object("CapTop", mesh, mat_cap)


def build_tab():
    bm = bmesh.new()
    ang = math.radians(TAB_ANGLE_DEG)
    cx, cy = LID_OUTER_R * math.cos(ang), LID_OUTER_R * math.sin(ang)
    ox, oy = math.cos(ang), math.sin(ang)   # outward normal
    tx, ty = -oy, ox                        # tangent
    z0, z1 = LID_Z0, LID_Z0 + TAB_H
    rings = []
    for z in (z0, z1):
        ring = []
        for (du, dv) in ((-TAB_W / 2, 0.0), (-TAB_W / 2, TAB_PROTRUDE), (TAB_W / 2, TAB_PROTRUDE), (TAB_W / 2, 0.0)):
            x = cx + tx * du + ox * dv
            y = cy + ty * du + oy * dv
            ring.append(bm.verts.new((x * MM, y * MM, z * MM)))
        rings.append(ring)
    bridge_rings(bm, rings, close_top=True, close_bottom=True)
    mesh = bpy.data.meshes.new("Tab")
    bm.to_mesh(mesh)
    bm.free()
    return new_object("Tab", mesh, mat_cap)


# ---------------------------------------------------------------- build all
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = FPS
scene.frame_start, scene.frame_end = 1, F_END

mat_body = make_material("DairyBody", COL_BODY, 0.30, alpha=0.94)
mat_cap = make_material("DairyCap", COL_CAP, 0.26)
mat_text = make_material("DairyText", COL_TEXT, 0.22)

body = build_body()
lock_nub = build_lock_nub()
cap_skirt = build_cap_skirt()
cap_top = build_cap_top()
tab = build_tab()

# "ALIM" arced top-left of the recessed field, per spec sheet image_0 layout
def dome_surface_z(r_mm):
    """Height of the CapTop dome surface at a given radius (see build_cap_top)."""
    frac = 1.0 - (min(r_mm, LID_TOP_R) / LID_TOP_R) ** 2
    return (LID_Z1 - 0.6) + 0.6 * frac


TEXT_CLEARANCE = 0.35   # sit proud of the dome surface by this much

logo_r = 14.0
logo_text = make_bent_text("ALIM", 2.0, logo_r, dome_surface_z(logo_r) + TEXT_CLEARANCE, 0.5)
logo_text.rotation_euler.z = math.radians(70)
logo_text.data.materials.append(mat_text)
# small "QUALITY PACK" roundel beside it
roundel_r = 9.0
roundel_text = make_bent_text("QUALITY PACK", 1.3, roundel_r,
                               dome_surface_z(roundel_r) + TEXT_CLEARANCE, 0.4)
roundel_text.rotation_euler.z = math.radians(20)
roundel_text.data.materials.append(mat_text)
# "BREAK TAB AT SLOT BELOW. ARROW TO OPEN LID" arced along the bottom
rim_r = 28.5
rim_text = make_bent_text("BREAK TAB AT SLOT BELOW. ARROW TO OPEN LID", 1.9, rim_r,
                           dome_surface_z(rim_r) + TEXT_CLEARANCE, 0.4)
rim_text.rotation_euler.z = math.radians(-90)
rim_text.data.materials.append(mat_text)

cap_root = bpy.data.objects.new("Cap", None)
bpy.context.scene.collection.objects.link(cap_root)
for part in (cap_skirt, cap_top, tab, logo_text, roundel_text, rim_text):
    part.parent = cap_root

root = bpy.data.objects.new("DairyContainer", None)
bpy.context.scene.collection.objects.link(root)
body.parent = root
lock_nub.parent = root
cap_root.parent = root

# ---------------------------------------------------------------- animation
closed_loc = Vector((0, 0, 0))
open_loc = Vector((0, 0, LID_RISE * MM))

for f, loc in ((1, closed_loc), (28, closed_loc), (60, open_loc), (90, open_loc), (F_END, closed_loc)):
    cap_root.location = loc
    cap_root.keyframe_insert("location", frame=f)

act = cap_root.animation_data.action
act.name = "Explode_Cap"
track = cap_root.animation_data.nla_tracks.new()
track.name = "Explode"
track.strips.new(act.name, 1, act)
cap_root.animation_data.action = None

# ---------------------------------------------------------------- export GLB
os.makedirs(os.path.dirname(GLB_OUT), exist_ok=True)
for o in bpy.context.scene.objects:
    o.select_set(True)
bpy.context.view_layer.objects.active = body
bpy.ops.export_scene.gltf(
    filepath=GLB_OUT,
    export_format="GLB",
    export_yup=True,
    export_apply=True,
    export_animation_mode="NLA_TRACKS",
    export_materials="EXPORT",
)
print(f"GLB written: {GLB_OUT} ({os.path.getsize(GLB_OUT) / 1e6:.2f} MB)")

# ---------------------------------------------------------------- previews
if DO_RENDER:
    os.makedirs(RENDER_DIR, exist_ok=True)
    scene.render.engine = "CYCLES"
    prefs = bpy.context.preferences.addons.get("cycles")
    try:
        scene.cycles.device = "GPU" if prefs and prefs.preferences.compute_device_type != "NONE" else "CPU"
    except Exception:
        scene.cycles.device = "CPU"
    scene.cycles.samples = int(os.environ.get("DAIRY_SAMPLES", "128"))
    scene.cycles.use_denoising = True
    scene.cycles.denoiser = "OPENIMAGEDENOISE"
    res_x = int(os.environ.get("DAIRY_RES_X", "2000"))
    scene.render.resolution_x, scene.render.resolution_y = res_x, int(res_x * 3 / 4)
    scene.render.resolution_percentage = 100
    scene.view_settings.view_transform = "Filmic"
    scene.view_settings.look = "Medium Contrast"
    scene.view_settings.exposure = 0.15

    world = bpy.data.worlds.new("Studio")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.30, 0.31, 0.33, 1)
    world.node_tree.nodes["Background"].inputs[1].default_value = 0.55
    scene.world = world

    def light(name, loc, energy, size):
        ld = bpy.data.lights.new(name, "AREA")
        ld.energy = energy
        ld.size = size
        lo = bpy.data.objects.new(name, ld)
        lo.location = loc
        lo.rotation_euler = (Vector((0, 0, 0.05)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        scene.collection.objects.link(lo)

    light("Key", (0.22, -0.30, 0.32), 6.0, 0.20)
    light("Fill", (-0.32, -0.14, 0.24), 1.2, 0.9)
    light("Rim", (0.0, 0.32, 0.28), 2.2, 0.35)
    light("Top", (0.0, 0.0, 0.55), 1.6, 0.6)

    gbm = bmesh.new()
    bmesh.ops.create_grid(gbm, x_segments=1, y_segments=1, size=0.5)
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

    only = os.environ.get("DAIRY_ONLY")

    def shoot(name, loc, target_z):
        if only and name not in only.split(","):
            return
        cam.location = loc
        look = Vector((0, 0, target_z)) - cam.location
        cam.rotation_euler = look.to_track_quat("-Z", "Y").to_euler()
        scene.render.filepath = os.path.join(RENDER_DIR, name)
        bpy.ops.render.render(write_still=True)
        print("rendered", name)

    shoot("front.png", Vector((0.0, -0.24, 0.034)), 0.034)
    shoot("three_quarter.png", Vector((0.17, -0.19, 0.055)), 0.034)
    shoot("top.png", Vector((0.02, -0.04, 0.26)), 0.028)

print("DONE")
