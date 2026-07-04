"""
Product 08 — LIMEX Soap Stand (15% LIMEX sample), photo-matched procedural model.

Headless Blender (bpy 4.5 LTS) build script. Reproduces the 3-part soap dish:
  1. Cream pillow-domed lid with knit "rice grain" emboss + sculpted bow + wavy skirt
  2. Sage-green base tray with scalloped (wavy) rim
  3. Sage-green drain insert with 13 drainage slots

Reference: supplied sample photos IMG_2604 (front), IMG_2605 (top), IMG_2606 (open,
"15% Limex" handwritten on lid interior). Estimated dimensions 120 x 90 x 65 mm.

Run:  <venv>/bin/python scripts/blender/soap_stand_product8.py
Out:  public/case-study/model/soap-stand-procedural.glb  (+ preview renders)
"""

import math
import os
import sys

import bpy
import bmesh
from mathutils import Euler, Matrix, Vector

# ---------------------------------------------------------------- parameters
MM = 0.001  # build in metres; all sizes below are mm * MM

# Lid
LID_A, LID_B = 59.0, 44.0          # footprint half length / half width
LID_N = 5.2                        # superellipse exponent — rectangular body with
                                   # tight curved corners, not an oval/pillow blob
DOME_H = 22.0                      # dome height above skirt top — flatter, lower profile
DOME_P, DOME_Q = 4.2, 0.55         # pillow profile z = H*(1-s^P)^Q — wide flat plateau,
                                   # curvature pushed hard toward the outer edge
SKIRT_H = 6.0                      # skirt band below dome edge
SKIRT_WAVES, SKIRT_WAVE_A = 22, 0.0  # flat/straight — only the green base rim is
                                     # scalloped in the reference photo; a wavy
                                     # cream edge on top of that doubled the wave
LID_Z = 27.0                       # skirt TOP height above ground when closed
                                   # (skirt bottom sits flush with the tray rim,
                                   # so the wavy green trim peeks through the gaps)

# Knit grains
GRAIN_COL_STEP, GRAIN_ROW_STEP = 6.8, 5.2
GRAIN_LEN, GRAIN_WID, GRAIN_TH = 2.15, 1.05, 0.85   # half-extents of one grain
GRAIN_PAIR_GAP, GRAIN_TILT = 1.7, math.radians(29)
GRAIN_S_MAX = 0.97                 # grains run almost to the dome edge (per top photo)

# Bow (centred on dome apex)
BOW_LOBE = (13.0, 13.0, 9.0)       # half-extents of each lobe — round balloon
                                   # shape (per top-view photo), roughly equal
                                   # X/Y; measured tip height ~17mm above dome apex
BOW_LOBE_X = 14.5                  # lobe centre offset from knot — more separation
BOW_LOBE_TILT = math.radians(5)    # lie almost flat — no upward wing lift
KNOT = (7.0, 5.0, 6.5)             # narrow waist so the two lobes read as distinct
TAIL_LEN, TAIL_WID, TAIL_TH = 20.0, 7.0, 1.5

# Base tray
BASE_A, BASE_B = 62.0, 47.0
BASE_N = 5.2                        # rectangular body, tight curved corners (matches lid)
BASE_H = 21.0                      # tub wall top (hidden behind the band)
BASE_WALL = 2.2
BASE_WAVES = 28                    # measured: ~15.5mm wave pitch around the perimeter
BASE_FLARE = 1.06                  # rim flares slightly outward

# Darker sage scalloped rim trim around the base top — thin wavy piping
# (the "dark green strip, uneven but in pattern" seen right below the lid)
BAND_Z0, BAND_Z1 = 16.5, BASE_H    # thin band bottom / top, flush with wall top
BAND_WAVE_A = 1.15                 # measured: peak-to-trough ~2.3mm off the photo
BAND_FLARE = 1.06                  # a visible lip from the front, not a thick frame from above

# Drain insert — a separate elevated green tray with its own scalloped rim,
# sitting inside the pale base with a gap below its floor. Measured from the
# open-view photo: the slotted floor sits proud of the pale tub's own floor,
# and the cuts cast a soft shadow / reveal the paler tub through each slot.
INS_A, INS_B = 53.0, 38.5
INS_TH = 2.6
INS_Z = 6.0                        # plate top height inside base — sits deep in the
                                   # tub so the explode reveal reads as rising out of
                                   # a real cavity, not lifting off a shallow surface
INS_BORDER_H, INS_BORDER_W = 3.2, 3.0
N_SLOTS = 13                       # measured: width:pitch ratio ~0.6, length ~70% of short axis
SLOT_HALF_L, SLOT_R = 27.0, 2.1    # slot half length (Y) and half width
SLOT_BEVEL = 0.35                  # mm — soft rounded edge on the slot cut, per photo

# Explode animation (30 fps)
FPS = 30
F_END = 150
LID_RISE, LID_TILT = 62.0, math.radians(9)
INS_RISE = 30.0

def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def srgb8(r, g, b):
    return (srgb_to_linear(r / 255), srgb_to_linear(g / 255), srgb_to_linear(b / 255), 1.0)


# Colors calibrated from sampled photo pixels (sRGB 0-255 -> linear for Blender)
COL_CREAM = srgb8(219, 216, 207)       # measured off the lid, even top-view light
COL_SAGE = srgb8(151, 147, 133)        # insert + band base tone (lit floor sample)
COL_SAGE_DEEP = srgb8(82, 98, 62)      # darker scalloped band (shadowed wall sample)
COL_TUB = srgb8(214, 217, 204)         # pale green-white tub body — brighter still

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GLB_OUT = os.path.join(REPO, "public", "case-study", "model", "soap-stand-procedural.glb")
RENDER_DIR = os.environ.get("SOAP_RENDER_DIR", os.path.join(REPO, "scripts", "blender", "renders"))
DO_RENDER = os.environ.get("SOAP_RENDER", "1") != "0"


# ---------------------------------------------------------------- helpers
def superellipse(t, a, b, n):
    c, s = math.cos(t), math.sin(t)
    x = a * math.copysign(abs(c) ** (2.0 / n), c)
    y = b * math.copysign(abs(s) ** (2.0 / n), s)
    return x, y


def scallop_wave(theta, n_waves):
    """Smooth, near-symmetric ripple — measured directly off the photo's rim
    edge, which is a gentle regular sine, not a sharp shell/zigzag shape."""
    return math.sin(n_waves * theta)


class EdgeRadius:
    """Star-shaped radius lookup r(phi) for a superellipse (for dome height math)."""

    def __init__(self, a, b, n, samples=720):
        self.table = []
        for i in range(samples):
            t = 2 * math.pi * i / samples
            x, y = superellipse(t, a, b, n)
            self.table.append((math.atan2(y, x) % (2 * math.pi), math.hypot(x, y)))
        self.table.sort()

    def __call__(self, phi):
        phi %= 2 * math.pi
        tb = self.table
        lo, hi = 0, len(tb)
        while lo < hi:
            mid = (lo + hi) // 2
            if tb[mid][0] < phi:
                lo = mid + 1
            else:
                hi = mid
        a1, r1 = tb[lo - 1] if lo > 0 else (tb[-1][0] - 2 * math.pi, tb[-1][1])
        a2, r2 = tb[lo] if lo < len(tb) else (tb[0][0] + 2 * math.pi, tb[0][1])
        w = 0.0 if a2 == a1 else (phi - a1) / (a2 - a1)
        return r1 + (r2 - r1) * w


LID_EDGE = EdgeRadius(LID_A, LID_B, LID_N)


def dome_s(x, y):
    """Radial fraction 0..1 of (x, y) inside the lid footprint."""
    r = math.hypot(x, y)
    if r < 1e-9:
        return 0.0
    return r / LID_EDGE(math.atan2(y, x))


def dome_z(x, y):
    s = min(dome_s(x, y), 1.0)
    return DOME_H * (1.0 - s ** DOME_P) ** DOME_Q


def dome_normal(x, y, eps=0.35):
    dzdx = (dome_z(x + eps, y) - dome_z(x - eps, y)) / (2 * eps)
    dzdy = (dome_z(x, y + eps) - dome_z(x, y - eps)) / (2 * eps)
    n = Vector((-dzdx, -dzdy, 1.0))
    n.normalize()
    return n


def new_object(name, mesh, material):
    obj = bpy.data.objects.new(name, mesh)
    obj.data.materials.append(material)
    bpy.context.scene.collection.objects.link(obj)
    for poly in mesh.polygons:
        poly.use_smooth = True
    return obj


def make_material(name, rgba, rough):
    """Semi-gloss injection-moulded plastic: lowish roughness + a thin
    clearcoat, a faint procedural "orange peel" micro-bump (real moulded
    plastic is never perfectly smooth), matching the crisp specular streaks
    visible on the real sample."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = rgba
    bsdf.inputs["Roughness"].default_value = rough
    for coat_w, coat_r in (("Coat Weight", "Coat Roughness"), ("Clearcoat", "Clearcoat Roughness")):
        if coat_w in bsdf.inputs:
            bsdf.inputs[coat_w].default_value = 0.35
            bsdf.inputs[coat_r].default_value = 0.12
            break

    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 480.0
    noise.inputs["Detail"].default_value = 2.0
    noise.inputs["Roughness"].default_value = 0.55
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.06
    bump.inputs["Distance"].default_value = 0.0006
    nt.links.new(noise.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


def bridge_rings(bm, rings, close_top=False, close_bottom=False):
    """Create faces between consecutive vertex rings (all same length, closed loops)."""
    n = len(rings[0])
    for ra, rb in zip(rings, rings[1:]):
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((ra[i], ra[j], rb[j], rb[i]))
    if close_bottom:
        bm.faces.new(tuple(reversed(rings[0])))
    if close_top:
        bm.faces.new(tuple(rings[-1]))


# ---------------------------------------------------------------- scene reset
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = FPS
scene.frame_start, scene.frame_end = 1, F_END

mat_cream = make_material("LimexCream", COL_CREAM, 0.32)
mat_sage = make_material("LimexSage", COL_SAGE, 0.28)
mat_sage_deep = make_material("LimexSageDeep", COL_SAGE_DEEP, 0.26)
mat_tub = make_material("LimexTub", COL_TUB, 0.34)

SEGS = 112  # perimeter segments for all swept parts


# ---------------------------------------------------------------- 1. LID
def build_lid():
    bm = bmesh.new()
    rings = []
    # wavy skirt lower edge -> skirt top (z relative to skirt top = 0)
    for z_lo in (True, False):
        ring = []
        for i in range(SEGS):
            t = 2 * math.pi * i / SEGS
            x, y = superellipse(t, LID_A, LID_B, LID_N)
            phi = math.atan2(y, x)
            z = -SKIRT_H + SKIRT_WAVE_A * math.sin(SKIRT_WAVES * phi) if z_lo else 0.0
            ring.append(bm.verts.new((x * MM, y * MM, z * MM)))
        rings.append(ring)
    # dome rings shrink towards apex
    N_DOME = 26
    for k in range(1, N_DOME + 1):
        s = 1.0 - k / N_DOME
        srad = s ** 0.92  # slightly denser near edge
        ring = []
        z = DOME_H * (1.0 - srad ** DOME_P) ** DOME_Q
        for i in range(SEGS):
            t = 2 * math.pi * i / SEGS
            x, y = superellipse(t, LID_A, LID_B, LID_N)
            if k == N_DOME:  # collapse to tiny apex ring, not a point (cleaner shading)
                srad = 0.02
            ring.append(bm.verts.new((x * srad * MM, y * srad * MM, z * MM)))
        rings.append(ring)
    bridge_rings(bm, rings, close_top=True, close_bottom=False)
    # close the skirt rim underside with a small inward lip
    lip = []
    for i in range(SEGS):
        t = 2 * math.pi * i / SEGS
        x, y = superellipse(t, LID_A, LID_B, LID_N)
        phi = math.atan2(y, x)
        z = -SKIRT_H + SKIRT_WAVE_A * math.sin(SKIRT_WAVES * phi)
        lip.append(bm.verts.new((x * 0.94 * MM, y * 0.94 * MM, (z + 0.8) * MM)))
    n = SEGS
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((rings[0][j], rings[0][i], lip[i], lip[j]))

    mesh = bpy.data.meshes.new("LidShell")
    bm.to_mesh(mesh)
    bm.free()
    return new_object("LidShell", mesh, mat_cream)


def grain_positions():
    """Knit pattern: paired tilted grains in columns, skipping the bow zone."""
    out = []
    x = -math.floor(LID_A / GRAIN_COL_STEP) * GRAIN_COL_STEP
    row_flip = False
    while x <= LID_A:
        y = -math.floor(LID_B / GRAIN_ROW_STEP) * GRAIN_ROW_STEP
        y += GRAIN_ROW_STEP * 0.5 if row_flip else 0.0
        while y <= LID_B:
            if dome_s(x, y) <= GRAIN_S_MAX:
                # bow exclusion ellipse (bow + tails footprint)
                if (x / 32.0) ** 2 + (y / 18.0) ** 2 > 1.0:
                    out.append((x - GRAIN_PAIR_GAP, y, +GRAIN_TILT))
                    out.append((x + GRAIN_PAIR_GAP, y, -GRAIN_TILT))
            y += GRAIN_ROW_STEP
        row_flip = not row_flip
        x += GRAIN_COL_STEP
    return out


def build_grains():
    bm = bmesh.new()
    proto = bmesh.new()
    bmesh.ops.create_uvsphere(proto, u_segments=8, v_segments=5, radius=1.0)
    proto_data = [(v.co.copy()) for v in proto.verts]
    proto_faces = [[v.index for v in f.verts] for f in proto.faces]
    proto.verts.ensure_lookup_table()
    proto.free()

    for gx, gy, tilt in grain_positions():
        z = dome_z(gx, gy)
        nrm = dome_normal(gx, gy)
        rot_to_n = nrm.to_track_quat("Z", "Y").to_matrix().to_4x4()
        m = (
            Matrix.Translation(Vector((gx * MM, gy * MM, z * MM)))
            @ rot_to_n
            @ Matrix.Rotation(tilt, 4, "Z")
            @ Matrix.Diagonal(Vector((GRAIN_WID * MM, GRAIN_LEN * MM, GRAIN_TH * MM))).to_4x4()
        )
        vmap = [bm.verts.new(m @ co) for co in proto_data]
        for f in proto_faces:
            bm.faces.new([vmap[i] for i in f])

    mesh = bpy.data.meshes.new("LidGrains")
    bm.to_mesh(mesh)
    bm.free()
    return new_object("LidGrains", mesh, mat_cream)


def build_bow():
    bm = bmesh.new()
    apex_z = dome_z(0, 0)

    def add_sphere(center_mm, scale_mm, rot=None, pinch=None):
        tmp = bmesh.new()
        bmesh.ops.create_uvsphere(tmp, u_segments=18, v_segments=12, radius=1.0)
        rot = rot or Matrix.Identity(4)
        m = (
            Matrix.Translation(Vector(center_mm) * MM)
            @ rot
            @ Matrix.Diagonal(Vector(scale_mm) * MM).to_4x4()
        )
        for v in tmp.verts:
            co = v.co.copy()
            if pinch:  # taper towards the knot for bow lobes
                w = 0.55 + 0.45 * (co.x * pinch + 1.0) * 0.5
                co.y *= w
                co.z *= w
            v.co = m @ co
        vmap = {v: bm.verts.new(v.co) for v in tmp.verts}
        for f in tmp.faces:
            bm.faces.new([vmap[v] for v in f.verts])
        tmp.free()

    rot_l = Matrix.Rotation(math.radians(6), 4, "Z") @ Matrix.Rotation(+BOW_LOBE_TILT, 4, "Y")
    rot_r = Matrix.Rotation(math.radians(-6), 4, "Z") @ Matrix.Rotation(-BOW_LOBE_TILT, 4, "Y")
    add_sphere((-BOW_LOBE_X, 0, apex_z + 6.5), BOW_LOBE, rot_l, pinch=+1.0)
    add_sphere((+BOW_LOBE_X, 0, apex_z + 6.5), BOW_LOBE, rot_r, pinch=-1.0)
    add_sphere((0, 0, apex_z + 6.8), KNOT)  # knot

    # ribbon tails: flat tapered boxes draped diagonally down-out from the knot
    for sx in (-1, 1):
        tmp = bmesh.new()
        bmesh.ops.create_cube(tmp, size=2.0)
        for v in tmp.verts:
            co = v.co.copy()
            w = 1.0 - 0.28 * (co.x + 1.0) * 0.5  # taper
            co.y *= w
            # V-notch at the far end
            if co.x > 0.99:
                co.x -= 0.6 * (1.0 - abs(co.y))
            v.co = co
        ang = math.radians(38)
        cx, cy = sx * 9.0, -11.0
        zc = dome_z(cx, cy) + 0.6
        tilt = dome_normal(cx, cy).to_track_quat("Z", "Y").to_matrix().to_4x4()
        m = (
            Matrix.Translation(Vector((cx, cy, zc)) * MM)
            @ tilt
            @ Matrix.Rotation(sx * (math.pi / 2 + ang), 4, "Z")
            @ Matrix.Diagonal(Vector((TAIL_LEN / 2 * MM, TAIL_WID / 2 * MM, TAIL_TH / 2 * MM))).to_4x4()
        )
        vmap = {v: bm.verts.new(m @ v.co) for v in tmp.verts}
        for f in tmp.faces:
            bm.faces.new([vmap[v] for v in f.verts])
        tmp.free()

    mesh = bpy.data.meshes.new("LidBow")
    bm.to_mesh(mesh)
    bm.free()
    return new_object("LidBow", mesh, mat_cream)


# ---------------------------------------------------------------- 2. BASE
def build_base():
    # pale green-white tub body (band is a separate darker part)
    bm = bmesh.new()
    rings = []
    profile = [  # (scale, z_mm)
        (0.90, 0.0),
        (0.985, 3.0),
        (1.0, 8.0),
        (1.0, BASE_H),
    ]
    for scale, z0 in profile:
        ring = []
        for i in range(SEGS):
            t = 2 * math.pi * i / SEGS
            x, y = superellipse(t, BASE_A, BASE_B, BASE_N)
            ring.append(bm.verts.new((x * scale * MM, y * scale * MM, z0 * MM)))
        rings.append(ring)
    bridge_rings(bm, rings, close_bottom=True)
    mesh = bpy.data.meshes.new("BaseTray")
    bm.to_mesh(mesh)
    bm.free()
    obj = new_object("BaseTray", mesh, mat_tub)
    obj.data.materials.append(mat_sage_deep)
    solid = obj.modifiers.new("shell", "SOLIDIFY")
    solid.thickness = BASE_WALL * MM
    solid.offset = -1.0
    # Outside stays pale (matches the closed-view photo); the solidify-
    # generated inner surface — the cavity floor/walls revealed once the
    # insert lifts — is pushed to the dark-green material slot instead.
    solid.material_offset = 1
    solid.material_offset_rim = 1
    return obj


def build_base_band():
    """Thin darker-sage scalloped rim trim — a single wavy piping course
    sitting right at the top of the tub wall, distinct from the pale body."""
    bm = bmesh.new()
    rings = []
    profile = [  # (scale, z_mm)
        (1.005, BAND_Z0),                # base of the trim (flush with wall)
        (BAND_FLARE, BAND_Z0 + 1.4),     # flares out slightly
        (BAND_FLARE, BAND_Z1),           # wavy top edge
    ]
    for scale, z0 in profile:
        ring = []
        for i in range(SEGS):
            t = 2 * math.pi * i / SEGS
            x, y = superellipse(t, BASE_A, BASE_B, BASE_N)
            phi = math.atan2(y, x)
            z = z0 + BAND_WAVE_A * scallop_wave(phi, BASE_WAVES)
            ring.append(bm.verts.new((x * scale * MM, y * scale * MM, z * MM)))
        rings.append(ring)
    bridge_rings(bm, rings, close_top=True)
    mesh = bpy.data.meshes.new("BaseBand")
    bm.to_mesh(mesh)
    bm.free()
    obj = new_object("BaseBand", mesh, mat_sage_deep)
    solid = obj.modifiers.new("shell", "SOLIDIFY")
    solid.thickness = 1.3 * MM
    solid.offset = -1.0
    return obj


# ---------------------------------------------------------------- 3. INSERT
def build_insert():
    bm = bmesh.new()
    # plate as a swept rounded-rect slab
    rings = []
    for z0 in (0.0, INS_TH):
        ring = []
        for i in range(SEGS):
            t = 2 * math.pi * i / SEGS
            x, y = superellipse(t, INS_A, INS_B, BASE_N)
            ring.append(bm.verts.new((x * MM, y * MM, z0 * MM)))
        rings.append(ring)
    bridge_rings(bm, rings, close_top=True, close_bottom=True)
    # raised border band
    border = []
    for scale, z0 in ((0.945, INS_TH), (0.945, INS_TH + INS_BORDER_H), (1.0, INS_TH + INS_BORDER_H), (1.0, INS_TH)):
        ring = []
        for i in range(SEGS):
            t = 2 * math.pi * i / SEGS
            x, y = superellipse(t, INS_A, INS_B, BASE_N)
            ring.append(bm.verts.new((x * scale * MM, y * scale * MM, z0 * MM)))
        border.append(ring)
    bridge_rings(bm, border)
    mesh = bpy.data.meshes.new("DrainInsert")
    bm.to_mesh(mesh)
    bm.free()
    obj = new_object("DrainInsert", mesh, mat_sage)

    # 13 slot cutters (elongated 16-gon prisms), one boolean union then difference
    cutter_bm = bmesh.new()
    span = INS_A * 2 * 0.78
    step = span / (N_SLOTS - 1)
    for k in range(N_SLOTS):
        cx = -span / 2 + k * step
        tmp = bmesh.new()
        bmesh.ops.create_cone(  # cylinder = cone with equal radii
            tmp, cap_ends=True, segments=16,
            radius1=1.0, radius2=1.0, depth=2.0,
        )
        m = (
            Matrix.Translation(Vector((cx, 0, INS_TH * 0.5)) * MM)
            @ Matrix.Diagonal(Vector((SLOT_R * MM, SLOT_HALF_L * MM, (INS_TH + 4) * MM))).to_4x4()
        )
        vmap = {v: cutter_bm.verts.new(m @ v.co) for v in tmp.verts}
        for f in tmp.faces:
            cutter_bm.faces.new([vmap[v] for v in f.verts])
        tmp.free()
    cmesh = bpy.data.meshes.new("SlotCutters")
    cutter_bm.to_mesh(cmesh)
    cutter_bm.free()
    cutter = bpy.data.objects.new("SlotCutters", cmesh)
    bpy.context.scene.collection.objects.link(cutter)
    boolmod = obj.modifiers.new("slots", "BOOLEAN")
    boolmod.operation = "DIFFERENCE"
    boolmod.object = cutter
    boolmod.solver = "EXACT"
    cutter.hide_render = True
    bevel = obj.modifiers.new("edge_soften", "BEVEL")
    bevel.width = SLOT_BEVEL * MM
    bevel.segments = 2
    bevel.limit_method = "ANGLE"
    bevel.angle_limit = math.radians(35)
    return obj, cutter


# ---------------------------------------------------------------- build all
lid_shell = build_lid()
lid_grains = build_grains()
lid_bow = build_bow()
base = build_base()
band = build_base_band()
insert, cutter = build_insert()

# apply modifiers so the GLB carries clean static meshes
dg = bpy.context.evaluated_depsgraph_get()
for obj in (base, band, insert):
    ev = obj.evaluated_get(dg)
    mesh = bpy.data.meshes.new_from_object(ev)
    old = obj.data
    obj.modifiers.clear()
    obj.data = mesh
    bpy.data.meshes.remove(old)
    for poly in obj.data.polygons:
        poly.use_smooth = True
bpy.data.objects.remove(cutter, do_unlink=True)

# group lid parts under one animated parent
lid_root = bpy.data.objects.new("Lid", None)
bpy.context.scene.collection.objects.link(lid_root)
for part in (lid_shell, lid_grains, lid_bow):
    part.parent = lid_root
lid_root.location = (0, 0, LID_Z * MM)
insert.location = (0, 0, (INS_Z - INS_TH) * MM)

# ---------------------------------------------------------------- animation
def key_xform(obj, frame, loc=None, rot=None):
    if loc is not None:
        obj.location = loc
        obj.keyframe_insert("location", frame=frame)
    if rot is not None:
        obj.rotation_euler = rot
        obj.keyframe_insert("rotation_euler", frame=frame)


closed_loc = Vector((0, 0, LID_Z * MM))
open_loc = Vector((6 * MM, 0, (LID_Z + LID_RISE) * MM))
ins_lo = Vector((0, 0, (INS_Z - INS_TH) * MM))
ins_hi = Vector((0, 0, (INS_Z - INS_TH + INS_RISE) * MM))
zero_rot = Euler((0, 0, 0))
open_rot = Euler((0, LID_TILT, 0))

for f, lo, ro in ((1, closed_loc, zero_rot), (32, closed_loc, zero_rot),
                  (70, open_loc, open_rot), (104, open_loc, open_rot),
                  (142, closed_loc, zero_rot), (F_END, closed_loc, zero_rot)):
    key_xform(lid_root, f, lo, ro)
for f, lo in ((1, ins_lo), (44, ins_lo), (80, ins_hi), (104, ins_hi), (142, ins_lo), (F_END, ins_lo)):
    key_xform(insert, f, lo)

# name the glTF animation "Explode" via same-named NLA tracks
for obj in (lid_root, insert):
    act = obj.animation_data.action
    act.name = f"Explode_{obj.name}"
    track = obj.animation_data.nla_tracks.new()
    track.name = "Explode"
    track.strips.new(act.name, 1, act)
    obj.animation_data.action = None

# ---------------------------------------------------------------- export GLB
os.makedirs(os.path.dirname(GLB_OUT), exist_ok=True)
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
    scene.cycles.samples = int(os.environ.get("SOAP_SAMPLES", "160"))
    scene.cycles.use_denoising = True
    scene.cycles.denoiser = "OPENIMAGEDENOISE"
    # 4K UHD-class output at the same 4:3 framing as the earlier previews
    # (SOAP_RES_X env override lets iteration renders run at a cheaper size)
    res_x = int(os.environ.get("SOAP_RES_X", "3840"))
    scene.render.resolution_x, scene.render.resolution_y = res_x, int(res_x * 2880 / 3840)
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = False
    scene.view_settings.view_transform = "Filmic"  # soft highlight rolloff, keeps hue
    scene.view_settings.look = "Medium Contrast"
    scene.view_settings.exposure = 0.15

    # ---- compositor color grade: subtle bloom + warm-highlight/cool-shadow
    # split-tone + gentle sharpen, the standard "clean product shot" grade ----
    scene.use_nodes = True
    ct = scene.node_tree
    ct.nodes.clear()
    rl = ct.nodes.new("CompositorNodeRLayers")
    glare = ct.nodes.new("CompositorNodeGlare")
    glare.glare_type = "FOG_GLOW"
    glare.quality = "HIGH"
    glare.threshold = 1.05
    glare.mix = -0.6  # mostly the sharp base image, just a whisper of bloom
    balance = ct.nodes.new("CompositorNodeColorBalance")
    balance.correction_method = "LIFT_GAMMA_GAIN"
    balance.lift = (0.985, 0.99, 1.01)     # faint cool lift in the shadows
    balance.gamma = (1.0, 1.0, 1.0)
    balance.gain = (1.02, 1.008, 0.985)    # faint warm gain in the highlights
    sharpen = ct.nodes.new("CompositorNodeFilter")
    sharpen.filter_type = "SHARPEN"
    sharpen_mix = ct.nodes.new("CompositorNodeMixRGB")
    sharpen_mix.blend_type = "MIX"
    sharpen_mix.inputs["Fac"].default_value = 0.25
    composite = ct.nodes.new("CompositorNodeComposite")
    ct.links.new(rl.outputs["Image"], glare.inputs["Image"])
    ct.links.new(glare.outputs["Image"], balance.inputs["Image"])
    ct.links.new(balance.outputs["Image"], sharpen_mix.inputs[1])
    ct.links.new(balance.outputs["Image"], sharpen.inputs["Image"])
    ct.links.new(sharpen.outputs["Image"], sharpen_mix.inputs[2])
    ct.links.new(sharpen_mix.outputs["Image"], composite.inputs["Image"])

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
        lo.rotation_euler = (Vector((0, 0, 0)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        scene.collection.objects.link(lo)

    # Small, bright key light -> crisp specular streak on the glossy plastic,
    # like the highlight visible along the rim/wall in the reference photos.
    light("Key", (0.22, -0.32, 0.42), 5.5, 0.16)
    light("Fill", (-0.32, -0.12, 0.28), 1.1, 0.7)
    light("Rim", (0.0, 0.38, 0.34), 2.0, 0.3)
    light("Top", (0.0, 0.0, 0.55), 1.6, 0.5)
    light("Basin", (0.0, -0.05, 0.30), 1.8, 0.55)  # extra fill so the recessed
                                                    # interior doesn't read dark/over-saturated

    # ground plane — dark satin surface (like the photos' black cloth) with a
    # touch of gloss so it picks up a faint contact reflection
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

    only = os.environ.get("SOAP_ONLY")  # comma-separated shot names, for quick iteration

    def shoot(name, loc, target_z, frame):
        if only and name not in only.split(","):
            return
        scene.frame_set(frame)
        cam.location = loc
        look = Vector((0, 0, target_z)) - cam.location
        cam.rotation_euler = look.to_track_quat("-Z", "Y").to_euler()
        scene.render.filepath = os.path.join(RENDER_DIR, name)
        bpy.ops.render.render(write_still=True)
        print("rendered", name)

    shoot("front_closed.png", Vector((0.0, -0.34, 0.10)), 0.035, 1)
    shoot("top_closed.png", Vector((0.0, -0.02, 0.42)), 0.02, 1)
    shoot("three_quarter_open.png", Vector((0.26, -0.27, 0.22)), 0.05, 88)

print("DONE")
