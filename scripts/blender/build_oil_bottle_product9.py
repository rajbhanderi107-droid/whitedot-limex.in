"""
Product 09 — LIMEX Lubricant/Oil Bottle, photo-matched procedural model.

Headless Blender (bpy 5.0 PyPI wheel) build script. Reproduces the 1L-class
HDPE lubricant/top-up-oil bottle from the supplied sample photos: a
rounded-rectangle (superellipse) body, a faceted shoulder that ramps up to an
off-centre neck, a fluted screw cap, a back-mounted integrated arch handle,
and three lens-shaped horizontal grip ribs on the front face.

Reference: supplied sample photos IMG_2609 (3/4 front-left, cap + handle),
IMG_2610 (straight front — no handle visible, confirms it is mounted on the
back shoulder), IMG_2611 (3/4 rotated, handle dominant), IMG_2612 (top-down,
shoulder ridge + handle wings). Pencil marks visible on the IMG_2609/2610
sample surface are hand-drawn measurement annotations on the physical
sample, not moulded features, and are not reproduced.

Estimated dimensions (no scale reference in the photos; sized to the
proportions measured off the photos and to a plausible ~1 L HDPE bottle):
234 x 94 x 64 mm (H x W x D), consistent with the bobbin/hand-wash-bottle/
soap-stand case-study family already in this repo.

Key derived facts (why the shoulder/handle are built the way they are):
  - IMG_2610 (dead-on front) shows a completely clean, uninterrupted
    shoulder-to-neck silhouette with NO handle gap visible at all — so the
    handle must live entirely on the back (+Y) half of the shoulder, with
    both its legs attached there, arcing up and slightly forward over the
    top so its underside gap is hidden behind the (comparatively wide)
    neck/shoulder mass at 0 deg azimuth.
  - IMG_2609 and IMG_2611 (two different 3/4 rotations) each show the loop
    hole clearly and from different apparent angles — consistent with a
    back-mounted arch whose gap is revealed as soon as the camera moves off
    dead-front, exactly as it disappears again in IMG_2610.
  - The two straight diagonal fold lines flanking the cap in every front-ish
    shot are the shoulder's front ridge: a shallow "pitched roof" crease
    that grows from flat (at the body top) to a sharp peak at the neck
    base, carrying a few small raised tick-mark nubs along its seam
    (visible in IMG_2612) that break up the mould parting line.

Run:  python3 scripts/blender/build_oil_bottle_product9.py
Out:  public/case-study/model/oil-bottle-procedural.glb  (+ preview renders)
"""

import math
import os

import bpy
import bmesh
from mathutils import Matrix, Vector

# ---------------------------------------------------------------- parameters
MM = 0.001  # build in metres; all sizes below are mm * MM

SEGS = 128  # perimeter segments for all swept rings

# Body (superellipse cross-section, rounded-rectangle)
BODY_A, BODY_B = 47.0, 32.0        # half-width / half-depth at max girth
BODY_N = 4.4                        # superellipse exponent — softly rounded corners
BODY_Z0, BODY_Z1 = 8.0, 172.0        # straight-wall span (above the base fillet)
BODY_BASE_SCALE = 0.965             # very slight inward draft toward the base
BODY_TOP_FLARE = 1.012              # very slight outward flare toward the shoulder

# Base fillet (wall -> flat bottom)
BASE_PROFILE = [  # (scale, z_mm) — bottom to BODY_Z0
    (0.90, 0.0),
    (0.945, 1.6),
    (0.985, 4.2),
    (1.0, BODY_Z0),
]

# Shoulder loft: body-top ring -> small neck-base ring, with a growing front
# ridge crease. NECK_Y offsets the neck slightly forward of the body centroid.
SHOULDER_Z1 = 197.0                 # neck-base height
NECK_Y = -5.0                       # neck centre, mm forward of body centroid
RIDGE_AMP_MAX = 3.0                 # extra mm of front-ridge rise at the neck base —
                                     # the reference shows only a soft, barely-raised
                                     # crease, not a pointed tent
RIDGE_HALFWIDTH = 0.55               # ridge fades to 0 by |x_norm| > this fraction

# Neck + cap — the reference photos show the cap sitting almost directly on
# the shoulder peak, with only a very short white collar visible below the
# threads, not a long cylindrical neck
NECK_R = 17.0
NECK_Z0, NECK_Z1 = SHOULDER_Z1, 204.0
CAP_R0, CAP_R1 = 19.2, 18.6          # cap radius: base, top (very slight taper)
CAP_Z0, CAP_Z1 = NECK_Z1, 225.0
CAP_FLUTES = 22
CAP_FLUTE_DEPTH = 0.55
CAP_FLUTE_Z0_FRAC = 0.10             # flutes start a little above the cap base
CAP_TOP_ROUND = 2.2                  # mm — small rounded/beveled top edge

TOTAL_H = CAP_Z1

# Front-seam tick-mark nubs (small ribs breaking up the mould parting line)
SEAM_NUBS_Z = (150.0, 163.0, 177.0, 188.0)
SEAM_NUB = (1.6, 3.4, 1.0)            # half-extents mm: X, Y(depth), Z

# Grip ribs — 3 pointed lens shapes on the front (−Y) face, bottom to top
GRIP_RIBS = [
    dict(z=36.0, half_len=34.0, half_h=4.6),
    dict(z=55.0, half_len=29.0, half_h=4.2),
    dict(z=74.0, half_len=19.0, half_h=3.6),
]
GRIP_RIB_DEPTH = 2.6   # mm raised proud of the front face
GRIP_RIB_THICK = 2.0   # mm half-thickness (Y) of the lens before pinch-taper

# Handle — a two-rail bail (bucket-handle topology): both rails plant into
# the back shoulder near x = +-RAIL_X, rise, and are bridged by a single arch
# over the top. The X-separation is what clears the cap cylinder (radius
# ~19mm centred at x=0) — a single centreline path at x=0 was tried first and
# it clipped straight through the cap in every version that closed the loop
# in the Y-Z plane alone, since no Y-offset alone gave enough clearance
# without the loop reading as a small closed-off back hump instead of the
# big see-through oval the reference photos show. Half-path below runs from
# the left foot to the shared apex; build_handle() mirrors it for the right
# rail so the whole assembly is exact X=0 symmetric.
HANDLE_HALF_PATH = [
    (-18.0, 12.0, 158.0),   # foot — buried well inside the straight body wall
    (-24.0, 18.0, 178.0),   # rising out through the shoulder surface
    (-25.0, 24.0, 198.0),
    (-22.0, 22.0, 220.0),   # dist to cap-centre (0,-5,z) stays > cap radius + tube half-width
    (-14.0, 12.0, 238.0),   # clear of the cap top (234) already
    (0.0, 4.0, 248.0),      # apex — shared centre point, above cap-top height
]
HANDLE_W, HANDLE_T = 20.0, 15.0        # per-rail cross-section: local width, thickness
HANDLE_SEGMENTS = 48                   # samples along each half (smoothed)

# ---------------------------------------------------------------- materials
def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def srgb8(r, g, b):
    return (srgb_to_linear(r / 255), srgb_to_linear(g / 255), srgb_to_linear(b / 255), 1.0)


# Colors calibrated from sampled photo pixels (sRGB 0-255 -> linear)
COL_BODY = srgb8(232, 224, 214)   # off-white HDPE body, sampled off a lit flat panel
COL_CAP = srgb8(207, 163, 47)     # mustard-yellow ribbed screw cap

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GLB_OUT = os.path.join(REPO, "public", "case-study", "model", "oil-bottle-procedural.glb")
RENDER_DIR = os.environ.get("OIL_RENDER_DIR", os.path.join(REPO, "scripts", "blender", "renders"))
DO_RENDER = os.environ.get("OIL_RENDER", "1") != "0"


# ---------------------------------------------------------------- helpers
def superellipse(t, a, b, n):
    c, s = math.cos(t), math.sin(t)
    x = a * math.copysign(abs(c) ** (2.0 / n), c)
    y = b * math.copysign(abs(s) ** (2.0 / n), s)
    return x, y


def lerp(a, b, k):
    return a + (b - a) * k


def smoothstep(k):
    k = min(max(k, 0.0), 1.0)
    return k * k * (3 - 2 * k)


def new_object(name, mesh, material):
    obj = bpy.data.objects.new(name, mesh)
    obj.data.materials.append(material)
    bpy.context.scene.collection.objects.link(obj)
    for poly in mesh.polygons:
        poly.use_smooth = True
    return obj


def make_material(name, rgba, rough):
    """Semi-gloss injection/blow-moulded HDPE: lowish roughness + a faint
    procedural orange-peel micro-bump, matching the soft specular sheen on
    the real sample."""
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
    noise.inputs["Scale"].default_value = 420.0
    noise.inputs["Detail"].default_value = 2.0
    noise.inputs["Roughness"].default_value = 0.55
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.05
    bump.inputs["Distance"].default_value = 0.0006
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


# ---------------------------------------------------------------- 1. BODY + BASE
def build_body():
    bm = bmesh.new()
    rings = []
    for scale, z in BASE_PROFILE:
        ring = []
        for i in range(SEGS):
            t = 2 * math.pi * i / SEGS
            x, y = superellipse(t, BODY_A, BODY_B, BODY_N)
            ring.append(bm.verts.new((x * scale * BODY_BASE_SCALE * MM,
                                       y * scale * BODY_BASE_SCALE * MM, z * MM)))
        rings.append(ring)
    # straight wall, very slight flare up to the shoulder start
    for z, scale in ((BODY_Z0, BODY_BASE_SCALE), (BODY_Z1, BODY_TOP_FLARE)):
        ring = []
        for i in range(SEGS):
            t = 2 * math.pi * i / SEGS
            x, y = superellipse(t, BODY_A, BODY_B, BODY_N)
            ring.append(bm.verts.new((x * scale * MM, y * scale * MM, z * MM)))
        rings.append(ring)
    bridge_rings(bm, rings, close_bottom=True)
    mesh = bpy.data.meshes.new("Body")
    bm.to_mesh(mesh)
    bm.free()
    return new_object("Body", mesh, mat_body)


# ---------------------------------------------------------------- 2. SHOULDER
def ridge_envelope(k, peak_k=0.78):
    """0 at k=0, rises to 1 at k=peak_k, back down to 0 at k=1 — the ridge
    must return to exactly zero at the neck boundary (k=1) or the shoulder's
    last ring stops being planar while the neck cylinder's first ring is
    flat, opening a real seam/crease between the two meshes."""
    if k <= peak_k:
        return smoothstep(k / peak_k)
    return 1.0 - smoothstep((k - peak_k) / (1.0 - peak_k))


def ridge_bump(x_norm, y_norm, k):
    """Extra +Z rise on the front (y<0) half only, peaking at x=0, fading to
    zero by |x_norm| > RIDGE_HALFWIDTH and following ridge_envelope(k) up the
    shoulder loft (0 at body-top AND at neck-base, peak in between). Uses a
    raised-cosine profile (zero slope at the crest) rather than a linear tent
    — a linear tent has a sharp corner at x=0 that reads as a pointed ridge
    even at a small amplitude; the reference shows only a soft, rounded
    crease."""
    if y_norm >= 0:
        return 0.0
    if abs(x_norm) >= RIDGE_HALFWIDTH:
        return 0.0
    bump = 0.5 * (1.0 + math.cos(math.pi * x_norm / RIDGE_HALFWIDTH))
    return RIDGE_AMP_MAX * ridge_envelope(k) * bump


def build_shoulder():
    bm = bmesh.new()
    rings = []
    N_SHOULDER = 22
    for j in range(N_SHOULDER + 1):
        k = j / N_SHOULDER
        ks = smoothstep(k)
        a = lerp(BODY_A * BODY_TOP_FLARE, NECK_R, ks)
        b = lerp(BODY_B * BODY_TOP_FLARE, NECK_R, ks)
        n_exp = lerp(BODY_N, 2.0, ks)
        cy = lerp(0.0, NECK_Y, ks)  # ring centre drifts forward toward the neck
        z0 = lerp(BODY_Z1, SHOULDER_Z1, k)
        ring = []
        for i in range(SEGS):
            t = 2 * math.pi * i / SEGS
            x, y = superellipse(t, a, b, n_exp)
            x_norm = x / max(a, 1e-6)
            y_norm = y / max(b, 1e-6)
            z = z0 + ridge_bump(x_norm, y_norm, k)
            ring.append(bm.verts.new((x * MM, (y + cy) * MM, z * MM)))
        rings.append(ring)
    bridge_rings(bm, rings)
    mesh = bpy.data.meshes.new("Shoulder")
    bm.to_mesh(mesh)
    bm.free()
    return new_object("Shoulder", mesh, mat_body)


def build_seam_nubs():
    """Small raised nubs along the front ridge seam line (visible in the
    top-down reference as tick marks breaking up the mould parting line)."""
    bm = bmesh.new()
    for z in SEAM_NUBS_Z:
        tmp = bmesh.new()
        bmesh.ops.create_uvsphere(tmp, u_segments=10, v_segments=6, radius=1.0)
        # find the shoulder front-edge y at this height for placement
        k = (z - BODY_Z1) / (SHOULDER_Z1 - BODY_Z1)
        k = min(max(k, 0.0), 1.0)
        ks = smoothstep(k)
        b = lerp(BODY_B * BODY_TOP_FLARE, NECK_R, ks)
        cy = lerp(0.0, NECK_Y, ks)
        front_y = -b + cy + 1.2
        m = (
            Matrix.Translation(Vector((0.0, front_y, z)) * MM)
            @ Matrix.Diagonal(Vector((SEAM_NUB[0], SEAM_NUB[1], SEAM_NUB[2])) * MM).to_4x4()
        )
        vmap = {v: bm.verts.new(m @ v.co) for v in tmp.verts}
        for f in tmp.faces:
            bm.faces.new([vmap[v] for v in f.verts])
        tmp.free()
    mesh = bpy.data.meshes.new("SeamNubs")
    bm.to_mesh(mesh)
    bm.free()
    return new_object("SeamNubs", mesh, mat_body)


# ---------------------------------------------------------------- 3. NECK + CAP
def build_neck():
    bm = bmesh.new()
    rings = []
    for z in (NECK_Z0, NECK_Z1):
        ring = []
        for i in range(SEGS):
            t = 2 * math.pi * i / SEGS
            x, y = math.cos(t) * NECK_R, math.sin(t) * NECK_R
            ring.append(bm.verts.new((x * MM, (y + NECK_Y) * MM, z * MM)))
        rings.append(ring)
    bridge_rings(bm, rings)
    mesh = bpy.data.meshes.new("Neck")
    bm.to_mesh(mesh)
    bm.free()
    return new_object("Neck", mesh, mat_body)


def build_cap():
    bm = bmesh.new()
    rings = []
    profile = [  # (radius, z, fluted)
        (CAP_R0, CAP_Z0, False),  # smooth at the seam — must match the plain neck ring exactly
        (CAP_R0, CAP_Z0 + (CAP_Z1 - CAP_Z0) * CAP_FLUTE_Z0_FRAC, True),
        (CAP_R0 * 0.995, CAP_Z1 - CAP_TOP_ROUND, True),
        (CAP_R1, CAP_Z1 - CAP_TOP_ROUND * 0.3, False),
        (CAP_R1 * 0.55, CAP_Z1, False),
    ]
    for radius, z, fluted in profile:
        ring = []
        for i in range(SEGS):
            t = 2 * math.pi * i / SEGS
            rr = radius
            if fluted:
                rr -= CAP_FLUTE_DEPTH * (0.5 + 0.5 * math.cos(CAP_FLUTES * t))
            x, y = math.cos(t) * rr, math.sin(t) * rr
            ring.append(bm.verts.new((x * MM, (y + NECK_Y) * MM, z * MM)))
        rings.append(ring)
    bridge_rings(bm, rings, close_top=True)
    mesh = bpy.data.meshes.new("Cap")
    bm.to_mesh(mesh)
    bm.free()
    return new_object("Cap", mesh, mat_cap)


# ---------------------------------------------------------------- 4. GRIP RIBS
def build_grip_ribs():
    bm = bmesh.new()
    proto = bmesh.new()
    bmesh.ops.create_uvsphere(proto, u_segments=20, v_segments=10, radius=1.0)
    proto_data = [v.co.copy() for v in proto.verts]
    proto_faces = [[v.index for v in f.verts] for f in proto.faces]
    proto.free()

    front_y_at = lambda z: -BODY_B * BODY_BASE_SCALE if z < BODY_Z0 else -BODY_B

    for rib in GRIP_RIBS:
        z = rib["z"]
        half_len = rib["half_len"]
        half_h = rib["half_h"]
        fy = front_y_at(z) - GRIP_RIB_DEPTH * 0.5
        verts = []
        for co in proto_data:
            c = co.copy()
            # pinch the +/-X ends to a sharp point (lens/vesica silhouette)
            w = 1.0 - 0.62 * abs(c.x)
            c.y *= w
            c.z *= w
            m = (
                Matrix.Translation(Vector((0.0, fy, z)) * MM)
                @ Matrix.Diagonal(Vector((half_len, GRIP_RIB_THICK, half_h)) * MM).to_4x4()
            )
            verts.append(bm.verts.new(m @ c))
        for f in proto_faces:
            bm.faces.new([verts[i] for i in f])
    mesh = bpy.data.meshes.new("GripRibs")
    bm.to_mesh(mesh)
    bm.free()
    return new_object("GripRibs", mesh, mat_body)


# ---------------------------------------------------------------- 5. HANDLE
def catmull_rom_3d(points, n_samples):
    """Smooth a coarse 3D polyline into n_samples points."""
    pts = [points[0]] + list(points) + [points[-1]]
    out = []
    segs = len(points) - 1
    for i in range(n_samples):
        u = i / (n_samples - 1) * segs
        seg = min(int(u), segs - 1)
        t = u - seg
        p0, p1, p2, p3 = (Vector(pts[seg]), Vector(pts[seg + 1]),
                          Vector(pts[seg + 2]), Vector(pts[seg + 3]))
        out.append(0.5 * ((2 * p1) + (-p0 + p2) * t
                           + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t
                           + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    return out


def build_handle():
    # mirror the half path (drop the shared apex from the mirrored half so
    # it isn't duplicated) to get one continuous left-to-right 3D route
    right_half = [(-x, y, z) for (x, y, z) in reversed(HANDLE_HALF_PATH[:-1])]
    control = HANDLE_HALF_PATH + right_half
    path = catmull_rom_3d(control, HANDLE_SEGMENTS * 2)

    bm = bmesh.new()
    rings = []
    n_ring = 14
    n = len(path)

    # Precompute tangents, then propagate a rotation-minimizing frame by
    # projecting the previous ring's "right" vector onto each new tangent
    # plane rather than re-deriving it from a fixed world axis — using a
    # world-space reference (switched by tangent.z) flips discontinuously
    # right where the path crosses the switch threshold, which is exactly
    # what carved a visible pinch/notch partway up the rising leg.
    tangents = []
    for idx in range(n):
        prev_p = path[idx - 1] if idx > 0 else path[0]
        next_p = path[idx + 1] if idx < n - 1 else path[-1]
        t = Vector(next_p) - Vector(prev_p)
        if t.length < 1e-6:
            t = Vector((1, 0, 0))
        tangents.append(t.normalized())

    world_up = Vector((0, 0, 1)) if abs(tangents[0].z) < 0.9 else Vector((0, 1, 0))
    right0 = tangents[0].cross(world_up)
    if right0.length < 1e-6:
        right0 = Vector((1, 0, 0))
    right0.normalize()
    rights = [right0]
    for idx in range(1, n):
        prev_right = rights[-1]
        t = tangents[idx]
        r = prev_right - t * prev_right.dot(t)
        if r.length < 1e-6:
            r = prev_right
        rights.append(r.normalized())

    for idx, p in enumerate(path):
        right = rights[idx]
        up = right.cross(tangents[idx]).normalized()

        # taper: bulge at the two feet so it reads as fused/moulded into the
        # shoulder rather than a free-floating wire
        s = idx / (n - 1)
        root_bulge = 1.0 + 0.4 * (max(0.0, 1 - abs(s - 0.02) * 14) + max(0.0, 1 - abs(s - 0.98) * 14))
        half_w = HANDLE_W * 0.5 * root_bulge
        half_t = HANDLE_T * 0.5 * root_bulge

        ring = []
        for i in range(n_ring):
            a = 2 * math.pi * i / n_ring
            cx, cn = superellipse(a, half_w, half_t, 3.2)
            pos = Vector(p) + right * cx + up * cn
            ring.append(bm.verts.new((pos.x * MM, pos.y * MM, pos.z * MM)))
        rings.append(ring)
    bridge_rings(bm, rings, close_top=True, close_bottom=True)
    mesh = bpy.data.meshes.new("Handle")
    bm.to_mesh(mesh)
    bm.free()
    return new_object("Handle", mesh, mat_body)


# ---------------------------------------------------------------- build all
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

mat_body = make_material("OilBottleBody", COL_BODY, 0.34)
mat_cap = make_material("OilBottleCap", COL_CAP, 0.28)

body = build_body()
shoulder = build_shoulder()
nubs = build_seam_nubs()
neck = build_neck()
cap = build_cap()
ribs = build_grip_ribs()
handle = build_handle()

root = bpy.data.objects.new("OilBottle", None)
bpy.context.scene.collection.objects.link(root)
for part in (body, shoulder, nubs, neck, cap, ribs, handle):
    part.parent = root

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

# ---------------------------------------------------------------- previews
if DO_RENDER:
    os.makedirs(RENDER_DIR, exist_ok=True)
    scene.render.engine = "CYCLES"
    scene.cycles.samples = int(os.environ.get("OIL_SAMPLES", "160"))
    scene.cycles.use_denoising = True
    scene.cycles.denoiser = "OPENIMAGEDENOISE"
    res_x = int(os.environ.get("OIL_RES_X", "2400"))
    scene.render.resolution_x, scene.render.resolution_y = res_x, int(res_x * 4 / 3)
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
        lo.rotation_euler = (Vector((0, 0, 0.10)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        scene.collection.objects.link(lo)

    light("Key", (0.28, -0.42, 0.55), 6.0, 0.20)
    light("Fill", (-0.40, -0.15, 0.35), 1.2, 0.9)
    light("Rim", (0.0, 0.45, 0.40), 2.2, 0.35)
    light("Top", (0.0, 0.0, 0.65), 1.6, 0.6)

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

    only = os.environ.get("OIL_ONLY")

    def shoot(name, loc, target_z):
        if only and name not in only.split(","):
            return
        cam.location = loc
        look = Vector((0, 0, target_z)) - cam.location
        cam.rotation_euler = look.to_track_quat("-Z", "Y").to_euler()
        scene.render.filepath = os.path.join(RENDER_DIR, name)
        bpy.ops.render.render(write_still=True)
        print("rendered", name)

    # framed generously enough to keep the full assembly (base to handle
    # apex, ~250mm) in frame with margin, matching the reference photos'
    # composition — the earlier tighter framing was clipping the cap/handle
    shoot("front.png", Vector((0.0, -0.46, 0.125)), 0.125)
    shoot("three_quarter_front.png", Vector((0.30, -0.36, 0.145)), 0.125)
    shoot("three_quarter_back.png", Vector((0.30, 0.36, 0.155)), 0.13)
    shoot("side.png", Vector((0.46, 0.0, 0.125)), 0.125)
    shoot("top.png", Vector((0.06, -0.12, 0.48)), 0.17)

print("DONE")
