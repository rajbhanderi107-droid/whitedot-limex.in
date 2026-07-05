"""
Product 09 — LIMEX Lubricant/Oil Jug, photo-matched procedural model.

Headless Blender (bpy 5.0 PyPI wheel) build script. Reproduces the squat
HDPE lubricant jug from the supplied sample photos: a wide tapered
rounded-rectangle body, an asymmetric top with the fluted screw cap offset
to one end and a thick moulded slab handle (big oval finger hole through
the depth axis) occupying the other, plus three lens-shaped grip ribs on
each narrow side face.

CRITICAL ORIENTATION NOTE (this cost several wrong drafts): the jug is
SHORT and WIDE — height ~= 1.45 x width — not a tall bottle.
  - IMG_2609 / IMG_2611 (3/4 views) show the WIDE face: cap at the left
    end, handle slab filling the right, big tilted oval hole through it.
  - IMG_2610 (dead-on) is the NARROW SIDE face, not the front: that's why
    its silhouette measures 2.17 taller than wide (height / DEPTH). The
    cap appears centred there because it sits at the depth midline, and
    the handle is invisible because its 35mm-wide strap hides entirely
    inside the projected cap/collar/plateau column. The grip ribs live on
    this narrow face.
  - IMG_2612 (top-down) shows the cap circle at one end and the handle
    strap as the long ridge (with transverse tick nubs) running to the
    other.

Dimensions: width 145mm (card literal, wide face), depth 96mm (card's two
readings said 98 and ~90; split), height 208mm (photo ratio height/depth
2.167 x 96). The card's "4L" title is nominal only — at these measured
proportions the real capacity is ~2L; the photos win over the card's
garbled/contradictory text (heights given as "93km"/"~1.5m", scrambled
tolerances), from which only the internally consistent numbers were used:
145mm W, ~96mm D, 45mm cap dia, R8/R5 corner radii, 35mm grip width,
30mm finger clearance, 2.5mm thread pitch, 0.5mm gate mark, 2mm wall.

Side-view silhouette (edge-tracked off IMG_2610, scaled to depth): the
body tapers from its widest just above the base to ~86% at the shoulder
start, then a near-straight trapezoid ramp converges to the cap plateau.

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

TOTAL_H = 208.0                      # cap top (= hump top zone) height

# Body — rounded-rectangle cross-section (true circular-arc corners),
# X = width (145mm face), Y = depth (96mm face), tapering toward the top
BODY_A_BASE, BODY_A_TOP = 72.5, 68.0   # half-width at base / at shoulder start
BODY_B_BASE, BODY_B_TOP = 48.0, 41.5   # half-depth (0.865 taper per side view)
BODY_CORNER_R = 13.0                   # visual corner radius (card's R8 is the
                                       # internal/mould figure; the moulded
                                       # outside reads rounder in the photos)
BODY_Z0, BODY_Z1 = 5.0, 150.0          # base-fillet top / shoulder start
BODY_BASE_SCALE = 0.965                # slight pull-in right at the base

BASE_PROFILE = [  # (scale, z_mm) — bottom to BODY_Z0 (card R5.0 base fillet)
    (0.90, 0.0),
    (0.945, 1.6),
    (0.985, 3.4),
    (1.0, BODY_Z0),
]


def body_half_widths(z):
    """Tapered half-width/half-depth of the body wall at height z (mm)."""
    k = min(max((z - BODY_Z0) / (BODY_Z1 - BODY_Z0), 0.0), 1.0)
    return (lerp(BODY_A_BASE, BODY_A_TOP, k), lerp(BODY_B_BASE, BODY_B_TOP, k))


# Top wedge — asymmetric shoulder loft from the full body ring up to a small
# square-ish cap plateau whose centre sits toward the cap end (x-).
WEDGE_Z0, WEDGE_Z1 = BODY_Z1, 184.0
PLATEAU_CX = -32.0                   # plateau (and cap) centre, x offset
PLATEAU_A, PLATEAU_B = 28.0, 28.0    # plateau half-extents
PLATEAU_CORNER_R = 10.0

# Collar + cap (cap dia 45mm per card), centred on the plateau
NECK_R = 20.0
COLLAR_Z0, COLLAR_Z1 = WEDGE_Z1, 189.0
COLLAR_FLARE = 6.0                   # mid-collar bulge beyond NECK_R
CAP_R0, CAP_R1 = 22.5, 21.8
CAP_Z0, CAP_Z1 = COLLAR_Z1, TOTAL_H
CAP_FLUTES = 22
CAP_FLUTE_DEPTH = 2.5   # card literal: "Cap Thread Pitch 2.5mm, 60 deg"
CAP_FLUTE_Z0_FRAC = 0.10
CAP_TOP_ROUND = 2.6

# Handle — a thick slab (strap) lying in the X-Z plane, 35mm wide in Y (card
# Grip Width), occupying the right end of the top; big tilted oval finger
# hole punched through along Y. Outline is a closed (x, z) polyline.
# From the narrow-side view the strap (y +-17.5) hides entirely inside the
# projected cap/collar/plateau column (y +-22.5/28), which is exactly why
# IMG_2610 shows no handle at all.
HANDLE_OUTLINE = [  # (x, z) mm, clockwise; x+ = away from the cap
    (-10.0, 186.0),  # front-lower attach — buried in the collar base
    (-8.0, 198.0),   # rises just behind the cap
    (2.0, 204.0),
    (14.0, 207.0),   # hump apex zone (~= cap-top height)
    (26.0, 207.0),
    (36.0, 203.0),
    (46.0, 196.0),   # outer edge curving down
    (55.0, 186.0),
    (60.0, 172.0),
    (61.0, 158.0),
    (58.0, 148.0),   # buried into the body's top-right corner
    (48.0, 154.0),   # bottom edge — tracks ~5mm inside the wedge top
    (34.0, 161.0),   # (wedge top line runs (-4,184)->(68,150))
    (20.0, 168.0),
    (6.0, 175.0),
    (-4.0, 181.0),
]
HANDLE_HALF_T = 17.5      # strap half-thickness in Y (35mm card grip width)
HANDLE_EDGE_ROUND = 0.22  # rim slices pull toward the centroid (pillowed edge)
HANDLE_HOLE_CX, HANDLE_HOLE_CZ = 22.0, 183.0   # hole centre (x, z)
HANDLE_HOLE_RX, HANDLE_HOLE_RZ = 17.0, 11.0    # half-axes (x, z)
HANDLE_HOLE_TILT = math.radians(-12)  # long axis parallels the falling top ridge

# Tick-mark nubs across the handle strap's top ridge (top-down photo) —
# kept subtle: barely-proud bumps, not teeth
STRAP_TICKS_XZ = ((0.0, 202.6), (12.0, 205.8), (24.0, 206.2), (36.0, 202.2))
STRAP_TICK = (1.1, 12.5, 0.6)         # half-extents mm: X, Y(across strap), Z
STRAP_TICK_PROUD = 0.15               # how far above the ridge they poke

# Recessed label panel on each wide face — the reference close-up shows a
# closed panel with a step border: near-vertical left edge (cap side),
# horizontal bottom edge, and the signature big arc sweeping from the
# panel's TOP-LEFT corner down to its bottom-right (an earlier draft ran
# the arc the mirrored/wrong way, lower-left to upper-right). The front
# wall is a flat tilted plane (linear taper), so a straight prism cutter
# along the face normal produces the correct uniform-depth recess.
PANEL_OUTLINE_XZ = [  # closed, clockwise
    (-52.0, 12.0),   # bottom-left corner
    (-52.0, 60.0),   # left edge, near-vertical, parallel to the body edge
    (-50.0, 106.0),
    (-46.0, 136.0),
    (-40.0, 148.0),  # top-left corner — the arc starts here
    (-22.0, 140.0),  # sweeping arc: down-right, convex toward the handle
    (2.0, 122.0),
    (22.0, 96.0),
    (34.0, 64.0),
    (41.0, 32.0),    # arc lands at the bottom-right corner
    (38.0, 14.0),
    (0.0, 11.0),     # bottom edge, just above the base fillet
]
PANEL_RECESS_DEPTH = 1.2              # mm below the surrounding face

# Grip ribs — 3 pointed lens shapes on EACH narrow side face (+-X), running
# along Y; grid-measured off the side photo: z 28/45/63mm from the base,
# longest at the bottom
GRIP_RIBS = [
    dict(z=28.0, half_len=25.0, half_h=5.0),
    dict(z=45.0, half_len=20.0, half_h=4.5),
    dict(z=63.0, half_len=13.0, half_h=3.8),
]
GRIP_RIB_DEPTH = 2.8   # mm raised proud of the side face
GRIP_RIB_THICK = 2.2   # mm half-thickness (X) of the lens before pinch-taper

# ---------------------------------------------------------------- materials
def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def srgb8(r, g, b):
    return (srgb_to_linear(r / 255), srgb_to_linear(g / 255), srgb_to_linear(b / 255), 1.0)


COL_BODY = srgb8(236, 231, 221)   # warm eggshell-white HDPE, sampled off reference photo
COL_CAP = srgb8(255, 196, 18)     # saturated egg-yolk yellow; keep the cap visibly yellow in model-viewer

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GLB_OUT = os.path.join(REPO, "public", "case-study", "model", "oil-bottle-procedural.glb")
RENDER_DIR = os.environ.get("OIL_RENDER_DIR", os.path.join(REPO, "scripts", "blender", "renders"))
DO_RENDER = os.environ.get("OIL_RENDER", "1") != "0"


# ---------------------------------------------------------------- helpers
def lerp(a, b, k):
    return a + (b - a) * k


def smoothstep(k):
    k = min(max(k, 0.0), 1.0)
    return k * k * (3 - 2 * k)


def rounded_rect(t, a, b, r):
    """A literal rounded rectangle — straight walls meeting true circular-arc
    corners of radius r — sampled by casting a ray from the origin at angle t
    to the boundary. Degenerates to an ellipse/circle when r >= min(a, b)."""
    r = max(0.0, min(r, a, b))
    c, s = math.cos(t), math.sin(t)
    if r <= 1e-9:
        if abs(c) < 1e-9:
            return 0.0, math.copysign(b, s)
        if abs(s) < 1e-9:
            return math.copysign(a, c), 0.0
        k = min(a / abs(c), b / abs(s))
        return k * c, k * s
    ax, ay = a - r, b - r
    if abs(c) > 1e-9:
        k_edge = a / abs(c)
        y_at = k_edge * s
        if abs(y_at) <= ay + 1e-9:
            return k_edge * c, y_at
    if abs(s) > 1e-9:
        k_edge = b / abs(s)
        x_at = k_edge * c
        if abs(x_at) <= ax + 1e-9:
            return x_at, k_edge * s
    cx, cy = math.copysign(ax, c or 1.0), math.copysign(ay, s or 1.0)
    bcoef = -2.0 * (c * cx + s * cy)
    ccoef = cx * cx + cy * cy - r * r
    disc = max(bcoef * bcoef - 4.0 * ccoef, 0.0)
    k = (-bcoef + math.sqrt(disc)) / 2.0
    return k * c, k * s


def new_object(name, mesh, material):
    obj = bpy.data.objects.new(name, mesh)
    obj.data.materials.append(material)
    bpy.context.scene.collection.objects.link(obj)
    for poly in mesh.polygons:
        poly.use_smooth = True
    return obj


def make_material(name, rgba, rough):
    """Semi-gloss blow-moulded HDPE: lowish roughness + faint orange-peel
    micro-bump, matching the soft specular sheen on the real sample."""
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


def closed_catmull_2d(points, n_samples):
    """Smooth a CLOSED 2D polyline (list of (u, v)) into n_samples points
    with a centripetal Catmull-Rom (wrap-around indexing)."""
    n = len(points)
    pts = [Vector((p[0], p[1], 0.0)) for p in points]
    out = []
    for i in range(n_samples):
        u = i / n_samples * n
        seg = int(u) % n
        frac = u - int(u)
        p0 = pts[(seg - 1) % n]
        p1 = pts[seg]
        p2 = pts[(seg + 1) % n]
        p3 = pts[(seg + 2) % n]
        t0 = 0.0
        t1 = t0 + max((p1 - p0).length, 1e-6) ** 0.5
        t2 = t1 + max((p2 - p1).length, 1e-6) ** 0.5
        t3 = t2 + max((p3 - p2).length, 1e-6) ** 0.5
        t = t1 + frac * (t2 - t1)
        a1 = p0 * ((t1 - t) / (t1 - t0)) + p1 * ((t - t0) / (t1 - t0))
        a2 = p1 * ((t2 - t) / (t2 - t1)) + p2 * ((t - t1) / (t2 - t1))
        a3 = p2 * ((t3 - t) / (t3 - t2)) + p3 * ((t - t2) / (t3 - t2))
        b1 = a1 * ((t2 - t) / (t2 - t0)) + a2 * ((t - t0) / (t2 - t0))
        b2 = a2 * ((t3 - t) / (t3 - t1)) + a3 * ((t - t1) / (t3 - t1))
        c = b1 * ((t2 - t) / (t2 - t1)) + b2 * ((t - t1) / (t2 - t1))
        out.append((c.x, c.y))
    return out


def apply_boolean_and_bake(obj, cutter):
    """DIFFERENCE-boolean `cutter` out of `obj` and bake to a static mesh."""
    boolmod = obj.modifiers.new("cut", "BOOLEAN")
    boolmod.operation = "DIFFERENCE"
    boolmod.object = cutter
    # Blender 5.1's EXACT solver silently returns an empty mesh for this
    # slab+cylinder cut; MANIFOLD (new in 5.x) handles it. Keep EXACT as
    # the fallback for the bpy 5.0 wheel, which has no MANIFOLD enum.
    try:
        boolmod.solver = "MANIFOLD"
    except TypeError:
        boolmod.solver = "EXACT"
    cutter.hide_render = True
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    ev = obj.evaluated_get(dg)
    mesh2 = bpy.data.meshes.new_from_object(ev)
    old = obj.data
    obj.modifiers.clear()
    obj.data = mesh2
    bpy.data.meshes.remove(old)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    bpy.data.objects.remove(cutter, do_unlink=True)


# ---------------------------------------------------------------- 1. BODY
def build_body():
    bm = bmesh.new()
    rings = []
    for scale, z in BASE_PROFILE:
        a, b = body_half_widths(z)
        ring = []
        for i in range(SEGS):
            t = 2 * math.pi * i / SEGS
            x, y = rounded_rect(t, a, b, BODY_CORNER_R)
            ring.append(bm.verts.new((x * scale * BODY_BASE_SCALE * MM,
                                       y * scale * BODY_BASE_SCALE * MM, z * MM)))
        rings.append(ring)
    N_WALL = 8
    for j in range(N_WALL + 1):
        z = lerp(BODY_Z0, BODY_Z1, j / N_WALL)
        scale = BODY_BASE_SCALE if j == 0 else 1.0
        a, b = body_half_widths(z)
        ring = []
        for i in range(SEGS):
            t = 2 * math.pi * i / SEGS
            x, y = rounded_rect(t, a, b, BODY_CORNER_R)
            ring.append(bm.verts.new((x * scale * MM, y * scale * MM, z * MM)))
        rings.append(ring)
    bridge_rings(bm, rings, close_bottom=True)
    mesh = bpy.data.meshes.new("Body")
    bm.to_mesh(mesh)
    bm.free()
    return new_object("Body", mesh, mat_body)


def build_gate_mark():
    """Card QC literal: "Gate Mark — 0.5mm Diameter" at the base centre."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=16,
                          radius1=0.35 * MM, radius2=0.0, depth=0.5 * MM)
    for v in bm.verts:
        v.co.z += 0.25 * MM
    mesh = bpy.data.meshes.new("GateMark")
    bm.to_mesh(mesh)
    bm.free()
    return new_object("GateMark", mesh, mat_body)


# ---------------------------------------------------------------- 2. TOP WEDGE
def build_wedge():
    """Asymmetric shoulder: loft from the full body-top ring to the small
    cap plateau ring offset toward x-. Blend is mostly linear — the side
    photo shows a near-straight trapezoid ramp, not an S-curve."""
    bm = bmesh.new()
    rings = []
    N = 18
    for j in range(N + 1):
        k = j / N
        ks = 0.7 * k + 0.3 * smoothstep(k)
        a = lerp(BODY_A_TOP, PLATEAU_A, ks)
        b = lerp(BODY_B_TOP, PLATEAU_B, ks)
        r_c = lerp(BODY_CORNER_R, PLATEAU_CORNER_R, ks)
        cx = lerp(0.0, PLATEAU_CX, ks)
        z = lerp(WEDGE_Z0, WEDGE_Z1, k)
        ring = []
        for i in range(SEGS):
            t = 2 * math.pi * i / SEGS
            x, y = rounded_rect(t, a, b, r_c)
            ring.append(bm.verts.new(((x + cx) * MM, y * MM, z * MM)))
        rings.append(ring)
    bridge_rings(bm, rings, close_top=True)
    mesh = bpy.data.meshes.new("TopWedge")
    bm.to_mesh(mesh)
    bm.free()
    return new_object("TopWedge", mesh, mat_body)


# ---------------------------------------------------------------- 3. COLLAR + CAP
def build_collar():
    profile = [
        (COLLAR_Z0, NECK_R),
        (COLLAR_Z0 + 0.5 * (COLLAR_Z1 - COLLAR_Z0), NECK_R + COLLAR_FLARE),
        (COLLAR_Z1, CAP_R0),
    ]
    bm = bmesh.new()
    rings = []
    for z, r in profile:
        ring = []
        for i in range(SEGS):
            t = 2 * math.pi * i / SEGS
            ring.append(bm.verts.new(((math.cos(t) * r + PLATEAU_CX) * MM,
                                       math.sin(t) * r * MM, z * MM)))
        rings.append(ring)
    bridge_rings(bm, rings)
    mesh = bpy.data.meshes.new("Collar")
    bm.to_mesh(mesh)
    bm.free()
    return new_object("Collar", mesh, mat_cap)


def build_cap():
    bm = bmesh.new()
    rings = []
    profile = [  # (radius, z, fluted)
        (CAP_R0, CAP_Z0, False),  # smooth at the seam — matches the collar ring
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
            ring.append(bm.verts.new(((math.cos(t) * rr + PLATEAU_CX) * MM,
                                       math.sin(t) * rr * MM, z * MM)))
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

    for side in (-1.0, 1.0):
        for rib in GRIP_RIBS:
            z = rib["z"]
            a, _ = body_half_widths(z)
            fx = side * (a + GRIP_RIB_DEPTH * 0.5 - 1.2)
            verts = []
            for co in proto_data:
                c = co.copy()
                # pinch the +/-Y (long-axis) ends to points (lens silhouette)
                w = 1.0 - 0.62 * abs(c.y)
                c.x *= w
                c.z *= w
                m = (
                    Matrix.Translation(Vector((fx, 0.0, z)) * MM)
                    @ Matrix.Diagonal(Vector((GRIP_RIB_THICK, rib["half_len"],
                                              rib["half_h"])) * MM).to_4x4()
                )
                verts.append(bm.verts.new(m @ c))
            for f in proto_faces:
                bm.faces.new([verts[i] for i in f])
    mesh = bpy.data.meshes.new("GripRibs")
    bm.to_mesh(mesh)
    bm.free()
    return new_object("GripRibs", mesh, mat_body)


# ---------------------------------------------------------------- 5. HANDLE
def build_handle():
    """Thick slab strap in the X-Z plane (see HANDLE_OUTLINE notes): smooth
    the closed outline, extrude +-HANDLE_HALF_T in Y as pillowed slices, cap
    the faces, then punch the tilted oval finger hole through along Y."""
    outline = closed_catmull_2d(HANDLE_OUTLINE, 96)
    cx = sum(p[0] for p in outline) / len(outline)
    cz = sum(p[1] for p in outline) / len(outline)

    bm = bmesh.new()
    slices = (-1.0, -0.72, -0.30, 0.30, 0.72, 1.0)
    rings = []
    for s in slices:
        y = HANDLE_HALF_T * s
        inset = 1.0 - HANDLE_EDGE_ROUND * (abs(s) ** 2.5)
        ring = []
        for (x, z) in outline:
            xx = cx + (x - cx) * inset
            zz = cz + (z - cz) * inset
            ring.append(bm.verts.new((xx * MM, y * MM, zz * MM)))
        rings.append(ring)
    bridge_rings(bm, rings)
    f0 = bm.faces.new(tuple(reversed(rings[0])))
    f1 = bm.faces.new(tuple(rings[-1]))
    bmesh.ops.triangulate(bm, faces=[f0, f1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new("Handle")
    bm.to_mesh(mesh)
    bm.free()
    obj = new_object("Handle", mesh, mat_body)

    # tilted oval hole cutter along Y. R_x(90) maps local (x, y, z) ->
    # (x, -z, y): local z (the cylinder axis) lands on world Y, local x
    # stays on world X (RX), local y lands on world -Z (RZ).
    cbm = bmesh.new()
    bmesh.ops.create_cone(cbm, cap_ends=True, segments=48,
                          radius1=1.0, radius2=1.0, depth=2.0)
    m = (
        Matrix.Translation(Vector((HANDLE_HOLE_CX, 0.0, HANDLE_HOLE_CZ)) * MM)
        @ Matrix.Rotation(HANDLE_HOLE_TILT, 4, "Y")  # tilt long axis in X-Z
        @ Matrix.Rotation(math.pi / 2, 4, "X")
        @ Matrix.Diagonal(Vector((HANDLE_HOLE_RX * MM, HANDLE_HOLE_RZ * MM,
                                   HANDLE_HALF_T * 2.5 * MM))).to_4x4()
    )
    for v in cbm.verts:
        v.co = m @ v.co
    cmesh = bpy.data.meshes.new("HandleHoleCutter")
    cbm.to_mesh(cmesh)
    cbm.free()
    cutter = bpy.data.objects.new("HandleHoleCutter", cmesh)
    bpy.context.scene.collection.objects.link(cutter)
    apply_boolean_and_bake(obj, cutter)
    return obj


def build_strap_ticks():
    """Small transverse tick nubs across the handle strap's top ridge —
    the top-down reference shows them crossing the ridge."""
    bm = bmesh.new()
    for (x, z) in STRAP_TICKS_XZ:
        tmp = bmesh.new()
        bmesh.ops.create_uvsphere(tmp, u_segments=10, v_segments=6, radius=1.0)
        m = (
            Matrix.Translation(Vector((x, 0.0, z + STRAP_TICK_PROUD)) * MM)
            @ Matrix.Diagonal(Vector(STRAP_TICK) * MM).to_4x4()
        )
        vmap = {v: bm.verts.new(m @ v.co) for v in tmp.verts}
        for f in tmp.faces:
            bm.faces.new([vmap[v] for v in f.verts])
        tmp.free()
    mesh = bpy.data.meshes.new("StrapTicks")
    bm.to_mesh(mesh)
    bm.free()
    return new_object("StrapTicks", mesh, mat_body)


def build_panel_creases():
    """Fine raised piping tracing the label-panel's signature sweeping arc
    on BOTH wide faces (a boolean-cut recess was tried first — the EXACT
    solver produced jagged, z-fighting stair-steps on this tapered/curved
    surface, so a swept tube laid directly on the wall is the robust
    choice instead). Arc runs top-left corner of the panel down to its
    bottom-right, convex toward the handle side, per the close-up photo."""
    arc = [(-40.0, 148.0), (-22.0, 140.0), (2.0, 122.0),
           (22.0, 96.0), (34.0, 64.0), (41.0, 32.0)]
    smoothed = []
    N_SAMP = 64
    for i in range(N_SAMP + 1):
        u = i / N_SAMP * (len(arc) - 1)
        seg = min(int(u), len(arc) - 2)
        t = u - seg
        p0 = Vector((*arc[max(seg - 1, 0)], 0))
        p1 = Vector((*arc[seg], 0))
        p2 = Vector((*arc[seg + 1], 0))
        p3 = Vector((*arc[min(seg + 2, len(arc) - 1)], 0))
        c = 0.5 * ((2 * p1) + (-p0 + p2) * t
                   + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t
                   + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3)
        smoothed.append((c.x, c.y))

    bm = bmesh.new()
    n_ring = 10
    r = 0.8
    for side in (-1.0, 1.0):
        rings = []
        for idx, (x, z) in enumerate(smoothed):
            _, b = body_half_widths(z)
            fy = side * (b - r * 0.4)  # embedded, thin line proud of the wall
            if idx == 0:
                tx, tz = (smoothed[1][0] - x, smoothed[1][1] - z)
            elif idx == len(smoothed) - 1:
                tx, tz = (x - smoothed[-2][0], z - smoothed[-2][1])
            else:
                tx, tz = (smoothed[idx + 1][0] - smoothed[idx - 1][0],
                          smoothed[idx + 1][1] - smoothed[idx - 1][1])
            tl = math.hypot(tx, tz) or 1.0
            tx, tz = tx / tl, tz / tl
            nx, nz = -tz, tx
            ring = []
            for i in range(n_ring):
                a = 2 * math.pi * i / n_ring
                off_n = math.cos(a) * r
                off_y = math.sin(a) * r
                ring.append(bm.verts.new(((x + nx * off_n) * MM,
                                           (fy + side * off_y) * MM,
                                           (z + nz * off_n) * MM)))
            rings.append(ring)
        bridge_rings(bm, rings, close_top=True, close_bottom=True)
    mesh = bpy.data.meshes.new("PanelCreases")
    bm.to_mesh(mesh)
    bm.free()
    return new_object("PanelCreases", mesh, mat_body)


# ---------------------------------------------------------------- build all
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

mat_body = make_material("OilBottleBody", COL_BODY, 0.27)
mat_cap = make_material("OilBottleCap", COL_CAP, 0.16)

body = build_body()
wedge = build_wedge()
collar = build_collar()
cap = build_cap()
ribs = build_grip_ribs()
handle = build_handle()
ticks = build_strap_ticks()
creases = build_panel_creases()
gate_mark = build_gate_mark()

root = bpy.data.objects.new("OilBottle", None)
bpy.context.scene.collection.objects.link(root)
for part in (body, wedge, collar, cap, ribs, handle, ticks, creases, gate_mark):
    part.parent = root

# ---------------------------------------------------------------- bake real image textures
# Blender's procedural noise->bump chain is Blender-only: the glTF exporter
# drops it (no Image Texture node = nothing to reference), which is why the
# exported GLB previously looked flat/textureless in model-viewer. Bake it to
# real base-color + tangent-space normal images per part so the exported
# glTF carries genuine baseColorTexture / normalTexture maps.
DO_BAKE = os.environ.get("OIL_BAKE", "0") != "0"
BAKE_RES = int(os.environ.get("OIL_BAKE_RES", "2048"))
TEXTURED_PARTS = (body, wedge, collar, cap, ribs, handle, ticks, creases)

scene.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons.get("cycles")
try:
    scene.cycles.device = "GPU" if prefs and prefs.preferences.compute_device_type != "NONE" else "CPU"
except Exception:
    scene.cycles.device = "CPU"
scene.cycles.samples = 48
scene.render.bake.use_pass_direct = False
scene.render.bake.use_pass_indirect = False
scene.render.bake.use_pass_color = True
scene.render.bake.margin = 4


def box_project_uv(obj):
    """Headless-safe UV unwrap: 6-cell box projection (3 dominant axes x 2
    signs, each cell its own 1/6 tile of UV space, normalized to the mesh
    bbox). No overlapping texels between opposing faces, no bpy.ops, works
    identically in -b background mode. Seams are irrelevant here — the baked
    detail is isotropic orange-peel noise."""
    mesh = obj.data
    if not mesh.uv_layers:
        mesh.uv_layers.new(name="UVMap")
    uv = mesh.uv_layers.active.data
    lo = [min(v.co[i] for v in mesh.vertices) for i in range(3)]
    hi = [max(v.co[i] for v in mesh.vertices) for i in range(3)]
    span = [max(hi[i] - lo[i], 1e-9) for i in range(3)]
    PAD = 0.01
    for poly in mesh.polygons:
        n = poly.normal
        ax = max(range(3), key=lambda i: abs(n[i]))
        sign_cell = 0 if n[ax] >= 0 else 1
        ua, va = ((1, 2), (0, 2), (0, 1))[ax]
        cell = ax * 2 + sign_cell          # 0..5
        col, row = cell % 3, cell // 3     # 3 x 2 grid
        for li in poly.loop_indices:
            co = mesh.vertices[mesh.loops[li].vertex_index].co
            u = (co[ua] - lo[ua]) / span[ua]
            v = (co[va] - lo[va]) / span[va]
            u = PAD + u * (1 / 3 - 2 * PAD) + col / 3
            v = PAD + v * (1 / 2 - 2 * PAD) + row / 2
            uv[li].uv = (u, v)


def bake_part_textures(obj):
    src_mat = obj.data.materials[0]
    mat = src_mat.copy()
    mat.name = f"{obj.name}_Baked"
    obj.data.materials[0] = mat
    nt = mat.node_tree
    bsdf = nt.nodes["Principled BSDF"]

    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    box_project_uv(obj)

    img_col = bpy.data.images.new(f"{obj.name}_BaseColor", BAKE_RES, BAKE_RES)
    img_nrm = bpy.data.images.new(f"{obj.name}_Normal", BAKE_RES, BAKE_RES)
    img_nrm.colorspace_settings.name = "Non-Color"

    tex_col = nt.nodes.new("ShaderNodeTexImage")
    tex_col.image = img_col
    tex_nrm = nt.nodes.new("ShaderNodeTexImage")
    tex_nrm.image = img_nrm

    for n in nt.nodes:
        n.select = False
    tex_col.select = True
    nt.nodes.active = tex_col
    scene.cycles.bake_type = "DIFFUSE"
    bpy.ops.object.bake(type="DIFFUSE")

    for n in nt.nodes:
        n.select = False
    tex_nrm.select = True
    nt.nodes.active = tex_nrm
    scene.cycles.bake_type = "NORMAL"
    bpy.ops.object.bake(type="NORMAL")

    nrm_map_node = nt.nodes.new("ShaderNodeNormalMap")
    nt.links.new(tex_nrm.outputs["Color"], nrm_map_node.inputs["Color"])
    nt.links.new(nrm_map_node.outputs["Normal"], bsdf.inputs["Normal"])
    nt.links.new(tex_col.outputs["Color"], bsdf.inputs["Base Color"])
    img_col.pack()
    img_nrm.pack()


if DO_BAKE:
    for part in TEXTURED_PARTS:
        bake_part_textures(part)

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

    light("Key", (0.28, -0.42, 0.50), 6.0, 0.20)
    light("Fill", (-0.40, -0.15, 0.32), 1.2, 0.9)
    light("Rim", (0.0, 0.45, 0.36), 2.2, 0.35)
    light("Top", (0.0, 0.0, 0.60), 1.6, 0.6)

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

    # "front" = the wide 145mm face (cap left, handle right);
    # "side" = the narrow face (matches reference IMG_2610)
    shoot("front.png", Vector((0.0, -0.44, 0.104)), 0.104)
    shoot("three_quarter_front.png", Vector((0.30, -0.34, 0.13)), 0.104)
    shoot("three_quarter_back.png", Vector((-0.30, -0.34, 0.13)), 0.104)
    shoot("side.png", Vector((0.44, 0.0, 0.104)), 0.104)
    shoot("top.png", Vector((0.02, -0.10, 0.42)), 0.10)

print("DONE")
