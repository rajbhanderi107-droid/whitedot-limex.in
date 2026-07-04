"""WhiteDot LIMEX faceted pump-bottle — parametric Blender build.

Builds the diamond-quilted (origami) LIMEX dispenser bottle photographed for
the brand: faceted body, ribbed black locking collar, riser stem and angled
dispenser head. Produces:

  * Cycles studio renders (hero duo, solo white, solo green, facet detail)
  * Baked 2K base-color + roughness textures
  * GLB exports (white + green) sized in real-world meters, origin at base

Run headless with the bpy PyPI wheel (Blender 4.5 LTS):

    python3 scripts/blender/build_limex_bottle.py --out /path/to/out [--quick]

Regenerating the asset after tweaking any parameter below is the intended
workflow — geometry, materials and shots are all driven from this file.
"""

from __future__ import annotations

import argparse
import math
import os
import sys

import bpy
import bmesh
from mathutils import Vector

TAU = math.tau

# ---------------------------------------------------------------- parameters

SEGMENTS = 24              # diamond columns around the body

# (z, profile radius, quilt depth) — faceted region rings, base to shoulder.
# Diamonds span two consecutive bands (rhombille tiling); each diamond's
# center vertex is inset by the row's depth to carve the quilted facets.
# Dense stack of elongated diamonds (~37mm tall x ~15mm wide, ratio 2.5:1)
# so the pattern tiles the whole body with no blank surface, like the
# reference mould; boundary bands read as base pleats and shoulder crown.
FACET_RINGS = [
    (0.0060, 0.0458, 0.0020),
    (0.0247, 0.0530, 0.0028),
    (0.0433, 0.0556, 0.0030),
    (0.0620, 0.0558, 0.0030),
    (0.0807, 0.0525, 0.0028),
    (0.0993, 0.0445, 0.0024),
    (0.1180, 0.0250, 0.0014),   # shoulder spikes end here
]
BOTTOM_RING = (0.0, 0.0400)          # smooth contact ring
NECK_RINGS = [(0.121, 0.0224), (0.132, 0.0212)]  # smooth neck to collar seat

COLLAR_Z = (0.132, 0.156)
COLLAR_R = (0.0236, 0.0222)          # bottom, top (slight taper)
COLLAR_RIBS = 44
COLLAR_RIB_DEPTH = 0.00055

STEM_R = 0.0068
STEM_Z = (0.156, 0.186)

# dispenser head loft sections: (x, half_y, z_bottom, z_top)
HEAD_SECTIONS = [
    (-0.019, 0.0092, 0.1832, 0.1952),
    (0.004, 0.0100, 0.1832, 0.1960),
    (0.026, 0.0092, 0.1836, 0.1938),
    (0.042, 0.0074, 0.1840, 0.1906),
    (0.052, 0.0054, 0.1844, 0.1878),
]
NOZZLE = (0.046, 0.0038, 0.1800, 0.1846)  # x, radius, z_bottom, z_top

BLACK = (0.013, 0.013, 0.015, 1.0)

BODY_FINISH = {
    # chalky matte off-white, near-ceramic diffuse
    "white": dict(color=(0.800, 0.788, 0.762, 1.0), rough_lo=0.46,
                  rough_hi=0.60, wave_bump=0.10, grain_bump=0.020,
                  sheen=0.10, sss=0.020),
    # rich vivid green, glossier with visible mold waviness
    "green": dict(color=(0.214, 0.673, 0.012, 1.0), rough_lo=0.26,
                  rough_hi=0.40, wave_bump=0.22, grain_bump=0.025,
                  sheen=0.15, sss=0.045),
}

BAKE_COLOR_RES = 2048
BAKE_ROUGH_RES = 1024
BAKE_NORMAL_RES = 1024   # keeps the GLB web-friendly; facets are geometric


# ------------------------------------------------------------------ helpers

def reset_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)


def new_object(name: str, bm: bmesh.types.BMesh) -> bpy.types.Object:
    mesh = bpy.data.meshes.new(name)
    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def ring_verts(bm, z: float, radius: float, phase: float, count: int = SEGMENTS):
    step = TAU / count
    return [
        bm.verts.new((radius * math.cos(step * (j + phase)),
                      radius * math.sin(step * (j + phase)), z))
        for j in range(count)
    ]


def bridge_quads(bm, lower, upper, smooth: bool):
    n = len(lower)
    for j in range(n):
        f = bm.faces.new((lower[j], lower[(j + 1) % n],
                          upper[(j + 1) % n], upper[j]))
        f.smooth = smooth


def quilt_facets(bm, rings, ring_specs):
    """Rhombille diamond quilt over the ring stack.

    Ring i vertices sit at angle step*(j + 0.5*(i % 2)).  Each diamond spans
    rings (r, r+1, r+2) with its vertical diagonal on the shared phase and a
    center vertex inset below the surface, split into four flat triangles.
    Boundary half-bands (very bottom / very top) are filled with plain
    triangles, which reads as the base pleats and shoulder spikes.
    """
    n = SEGMENTS
    step = TAU / n
    last = len(rings) - 1

    def tri(a, b, c):
        bm.faces.new((a, b, c)).smooth = False

    for r in range(last - 1):
        lo, mid, hi = rings[r], rings[r + 1], rings[r + 2]
        z_lo, rad_lo, _ = ring_specs[r]
        z_mid, rad_mid, depth = ring_specs[r + 1]
        z_hi, rad_hi, _ = ring_specs[r + 2]
        for j in range(n):
            bottom, top = lo[j], hi[j]
            if r % 2 == 0:  # mid ring phase +0.5: sides at j-1 and j
                left, right = mid[(j - 1) % n], mid[j]
            else:           # mid ring phase 0: sides at j and j+1
                left, right = mid[j], mid[(j + 1) % n]
            angle = step * (j + 0.5 * (r % 2))
            r_center = (rad_lo + rad_hi + 2 * rad_mid) / 4 - depth
            center = bm.verts.new((r_center * math.cos(angle),
                                   r_center * math.sin(angle), z_mid))
            tri(bottom, right, center)
            tri(right, top, center)
            tri(top, left, center)
            tri(left, bottom, center)

    # boundary fills: half-diamond triangles not owned by any full diamond
    lo, hi = rings[0], rings[1]
    for j in range(n):  # base pleats (ring0 phase 0, ring1 phase 0.5)
        tri(lo[j], lo[(j + 1) % n], hi[j])

    band = last - 1
    lo, hi = rings[band], rings[band + 1]
    for j in range(n):  # shoulder spikes
        if band % 2 == 0:  # hi ring phase 0.5: flanking verts j-1, j
            tri(lo[j], hi[j], hi[(j - 1) % n])
        else:              # hi ring phase 0: flanking verts j, j+1
            tri(lo[j], hi[(j + 1) % n], hi[j])


def fan_cap(bm, ring, center_co, smooth: bool, up: bool):
    center = bm.verts.new(center_co)
    n = len(ring)
    for j in range(n):
        a, b = ring[j], ring[(j + 1) % n]
        face = bm.faces.new((a, b, center) if up else (b, a, center))
        face.smooth = smooth
    return center


def look_at(obj: bpy.types.Object, target: Vector) -> None:
    direction = target - obj.location
    obj.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()


# ----------------------------------------------------------------- geometry

def build_body(name: str) -> bpy.types.Object:
    bm = bmesh.new()

    bottom = ring_verts(bm, BOTTOM_RING[0], BOTTOM_RING[1], phase=0.0)
    fan_cap(bm, bottom, (0, 0, 0.0035), smooth=True, up=False)  # concave base

    facet_rings = [ring_verts(bm, z, r, phase=0.5 * (i % 2))
                   for i, (z, r, _) in enumerate(FACET_RINGS)]

    bridge_quads(bm, bottom, facet_rings[0], smooth=True)
    quilt_facets(bm, facet_rings, FACET_RINGS)

    neck_phase = 0.5 * ((len(FACET_RINGS) - 1) % 2)
    prev = facet_rings[-1]
    for z, r in NECK_RINGS:
        ring = ring_verts(bm, z, r, phase=neck_phase)
        bridge_quads(bm, prev, ring, smooth=True)
        prev = ring
    fan_cap(bm, prev, (0, 0, NECK_RINGS[-1][0]), smooth=True, up=True)

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    obj = new_object(name, bm)

    bevel = obj.modifiers.new("edge-polish", 'BEVEL')
    bevel.width = 0.0006
    bevel.segments = 1
    bevel.limit_method = 'ANGLE'
    bevel.angle_limit = math.radians(18)
    return obj


def build_pump(name: str) -> bpy.types.Object:
    bm = bmesh.new()

    # knurled locking collar
    rib_count = COLLAR_RIBS * 2
    step = TAU / rib_count
    rings = []
    for z, base_r in zip(COLLAR_Z, COLLAR_R):
        ring = []
        for j in range(rib_count):
            r = base_r + (COLLAR_RIB_DEPTH if j % 2 == 0 else -COLLAR_RIB_DEPTH)
            ring.append(bm.verts.new((r * math.cos(step * j),
                                      r * math.sin(step * j), z)))
        rings.append(ring)
    n = rib_count
    for j in range(n):
        bm.faces.new((rings[0][j], rings[0][(j + 1) % n],
                      rings[1][(j + 1) % n], rings[1][j])).smooth = False
    fan_cap(bm, rings[0], (0, 0, COLLAR_Z[0]), smooth=True, up=False)
    fan_cap(bm, rings[1], (0, 0, COLLAR_Z[1]), smooth=True, up=True)

    # riser stem
    stem_lo = ring_verts(bm, STEM_Z[0], STEM_R, phase=0.0, count=32)
    stem_hi = ring_verts(bm, STEM_Z[1], STEM_R, phase=0.0, count=32)
    bridge_quads(bm, stem_lo, stem_hi, smooth=True)
    fan_cap(bm, stem_hi, (0, 0, STEM_Z[1]), smooth=True, up=True)

    # dispenser head — lofted paddle with drooping spout tip
    sections = []
    for x, hy, zb, zt in HEAD_SECTIONS:
        sections.append([
            bm.verts.new((x, -hy, zb)),
            bm.verts.new((x, hy, zb)),
            bm.verts.new((x, hy, zt)),
            bm.verts.new((x, -hy, zt)),
        ])
    for a, b in zip(sections, sections[1:]):
        for k in range(4):
            bm.faces.new((a[k], a[(k + 1) % 4],
                          b[(k + 1) % 4], b[k])).smooth = True
    bm.faces.new(tuple(reversed(sections[0]))).smooth = True
    bm.faces.new(tuple(sections[-1])).smooth = True

    # nozzle stub under the spout tip
    nx, nr, nzb, nzt = NOZZLE
    noz_lo = [bm.verts.new((nx + nr * math.cos(TAU * j / 20),
                            nr * math.sin(TAU * j / 20), nzb)) for j in range(20)]
    noz_hi = [bm.verts.new((nx + nr * math.cos(TAU * j / 20),
                            nr * math.sin(TAU * j / 20), nzt)) for j in range(20)]
    bridge_quads(bm, noz_lo, noz_hi, smooth=True)
    fan_cap(bm, noz_lo, (nx, 0, nzb), smooth=True, up=False)

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    obj = new_object(name, bm)

    bevel = obj.modifiers.new("edge-polish", 'BEVEL')
    bevel.width = 0.0011
    bevel.segments = 2
    bevel.limit_method = 'ANGLE'
    bevel.angle_limit = math.radians(38)
    return obj


# ---------------------------------------------------------------- materials

def principled(mat: bpy.types.Material) -> bpy.types.ShaderNode:
    mat.use_nodes = True
    return mat.node_tree.nodes["Principled BSDF"]


def make_body_material(name: str, spec: dict) -> bpy.types.Material:
    """Blow-molded plastic matched to the reference photos.

    Two surface scales drive both roughness and bump: a low-frequency mold
    waviness (the soft uneven highlights on the green bottle) and a fine
    injection grain. The white bottle is chalkier/more diffuse, the green
    waxier and glossier.
    """
    mat = bpy.data.materials.new(name)
    bsdf = principled(mat)
    nodes, links = mat.node_tree.nodes, mat.node_tree.links

    bsdf.inputs["Base Color"].default_value = spec["color"]
    bsdf.inputs["IOR"].default_value = 1.45
    bsdf.inputs["Sheen Weight"].default_value = spec["sheen"]
    bsdf.inputs["Subsurface Weight"].default_value = spec["sss"]
    bsdf.inputs["Subsurface Radius"].default_value = (0.004, 0.004, 0.003)

    wave = nodes.new("ShaderNodeTexNoise")
    wave.inputs["Scale"].default_value = 55.0
    wave.inputs["Detail"].default_value = 4.0
    wave.inputs["Distortion"].default_value = 1.1

    grain = nodes.new("ShaderNodeTexNoise")
    grain.inputs["Scale"].default_value = 900.0
    grain.inputs["Detail"].default_value = 3.0

    ramp = nodes.new("ShaderNodeMapRange")
    ramp.inputs["To Min"].default_value = spec["rough_lo"]
    ramp.inputs["To Max"].default_value = spec["rough_hi"]
    links.new(wave.outputs["Fac"], ramp.inputs["Value"])
    links.new(ramp.outputs["Result"], bsdf.inputs["Roughness"])

    bump_wave = nodes.new("ShaderNodeBump")
    bump_wave.inputs["Strength"].default_value = spec["wave_bump"]
    bump_wave.inputs["Distance"].default_value = 0.0015
    links.new(wave.outputs["Fac"], bump_wave.inputs["Height"])

    bump_grain = nodes.new("ShaderNodeBump")
    bump_grain.inputs["Strength"].default_value = spec["grain_bump"]
    links.new(grain.outputs["Fac"], bump_grain.inputs["Height"])
    links.new(bump_wave.outputs["Normal"], bump_grain.inputs["Normal"])
    links.new(bump_grain.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


def make_pump_material() -> bpy.types.Material:
    mat = bpy.data.materials.new("limex-pump-black")
    bsdf = principled(mat)
    bsdf.inputs["Base Color"].default_value = BLACK
    bsdf.inputs["Roughness"].default_value = 0.45
    bsdf.inputs["Specular IOR Level"].default_value = 0.25
    return mat


# ---------------------------------------------------------- bottle assembly

def build_bottle(variant: str) -> bpy.types.Object:
    name = f"LimexBottle{variant.capitalize()}"

    body = build_body(f"{name}-body")
    pump = build_pump(f"{name}-pump")
    body.data.materials.append(
        make_body_material(f"limex-body-{variant}", BODY_FINISH[variant]))
    pump.data.materials.append(make_pump_material())

    bpy.ops.object.select_all(action='DESELECT')
    for obj in (body, pump):
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier="edge-polish")
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.join()
    bottle = bpy.context.view_layer.objects.active
    bottle.name = name

    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.003)
    bpy.ops.object.mode_set(mode='OBJECT')
    return bottle


# ------------------------------------------------------------------- studio

def build_studio() -> None:
    # cyclorama: floor + back wall, dark satin
    mat = bpy.data.materials.new("studio-dark")
    bsdf = principled(mat)
    bsdf.inputs["Base Color"].default_value = (0.030, 0.031, 0.034, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.32

    bpy.ops.mesh.primitive_plane_add(size=4.0, location=(0, 0, 0))
    floor = bpy.context.active_object
    floor.name = "studio-floor"
    floor.data.materials.append(mat)

    bpy.ops.mesh.primitive_plane_add(size=4.0, location=(0, 0.55, 1.9),
                                     rotation=(math.radians(90), 0, 0))
    wall = bpy.context.active_object
    wall.name = "studio-wall"
    wall.data.materials.append(mat)

    world = bpy.data.worlds.new("studio-world")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.012, 0.013, 0.015, 1.0)
    bg.inputs["Strength"].default_value = 1.0

    def area_light(name, loc, size, power, color=(1.0, 1.0, 1.0)):
        data = bpy.data.lights.new(name, 'AREA')
        data.size = size
        data.energy = power
        data.color = color
        light = bpy.data.objects.new(name, data)
        light.location = loc
        bpy.context.collection.objects.link(light)
        look_at(light, Vector((0, 0, 0.09)))
        return light

    area_light("key", (-0.38, -0.34, 0.42), 0.40, 24.0, (1.0, 0.972, 0.930))
    area_light("fill", (0.52, -0.42, 0.22), 0.90, 8.0, (0.90, 0.94, 1.0))
    area_light("rim", (0.16, 0.46, 0.34), 0.28, 28.0, (1.0, 1.0, 1.0))
    area_light("top", (0.0, -0.05, 0.75), 0.50, 8.0, (1.0, 0.99, 0.97))


def add_camera(name: str, loc, target, lens: float,
               fstop: float | None = None) -> bpy.types.Object:
    data = bpy.data.cameras.new(name)
    data.lens = lens
    data.sensor_width = 36.0
    if fstop is not None:
        data.dof.use_dof = True
        data.dof.aperture_fstop = fstop
    cam = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(cam)
    aim(cam, loc, target)
    return cam


def aim(cam: bpy.types.Object, loc, target) -> None:
    cam.location = loc
    look_at(cam, Vector(target))
    if cam.data.dof.use_dof:
        cam.data.dof.focus_distance = (Vector(loc) - Vector(target)).length


def configure_render(quick: bool) -> None:
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 40 if quick else 160
    scene.cycles.use_denoising = True
    scene.render.image_settings.file_format = 'WEBP'
    scene.render.image_settings.quality = 92
    scene.render.image_settings.color_mode = 'RGB'
    # PBR Neutral keeps product colors faithful (AgX desaturates the lime)
    try:
        scene.view_settings.view_transform = 'Khronos PBR Neutral'
    except TypeError:
        scene.view_settings.view_transform = 'AgX'
        try:
            scene.view_settings.look = 'AgX - Punchy'
        except TypeError:
            pass


def render_shot(cam, path: str, width: int, height: int, quick: bool) -> None:
    scene = bpy.context.scene
    scale = 0.5 if quick else 1.0
    scene.camera = cam
    scene.render.resolution_x = int(width * scale)
    scene.render.resolution_y = int(height * scale)
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print(f"[render] {path}")


# ------------------------------------------------------------ bake + export

def bake_and_export(bottle: bpy.types.Object, variant: str, models_dir: str,
                    textures_dir: str) -> None:
    scene = bpy.context.scene
    prev_samples = scene.cycles.samples
    scene.cycles.samples = 4

    color_img = bpy.data.images.new(f"limex-bottle-{variant}-basecolor",
                                    BAKE_COLOR_RES, BAKE_COLOR_RES)
    rough_img = bpy.data.images.new(f"limex-bottle-{variant}-roughness",
                                    BAKE_ROUGH_RES, BAKE_ROUGH_RES)
    rough_img.colorspace_settings.name = 'Non-Color'
    normal_img = bpy.data.images.new(f"limex-bottle-{variant}-normal",
                                     BAKE_NORMAL_RES, BAKE_NORMAL_RES)
    normal_img.colorspace_settings.name = 'Non-Color'

    bpy.ops.object.select_all(action='DESELECT')
    bottle.select_set(True)
    bpy.context.view_layer.objects.active = bottle

    def bake_into(image, bake_type, pass_filter=None):
        for slot in bottle.material_slots:
            nodes = slot.material.node_tree.nodes
            node = nodes.new("ShaderNodeTexImage")
            node.name = "bake-target"
            node.image = image
            nodes.active = node
        kwargs = dict(type=bake_type, margin=8, use_clear=True)
        if pass_filter:
            kwargs["pass_filter"] = pass_filter
        bpy.ops.object.bake(**kwargs)
        for slot in bottle.material_slots:
            nodes = slot.material.node_tree.nodes
            nodes.remove(nodes["bake-target"])

    bake_into(color_img, 'DIFFUSE', {'COLOR'})
    bake_into(rough_img, 'ROUGHNESS')
    bake_into(normal_img, 'NORMAL')   # carries the mold-texture bump
    scene.cycles.samples = prev_samples

    for img, suffix in ((color_img, "basecolor"), (rough_img, "roughness"),
                        (normal_img, "normal")):
        img.filepath_raw = os.path.join(
            textures_dir, f"limex-bottle-{variant}-{suffix}.png")
        img.file_format = 'PNG'
        img.save()

    # single clean export material driven by the baked maps
    mat = bpy.data.materials.new(f"limex-bottle-{variant}")
    bsdf = principled(mat)
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    tex_c = nodes.new("ShaderNodeTexImage")
    tex_c.image = color_img
    tex_r = nodes.new("ShaderNodeTexImage")
    tex_r.image = rough_img
    tex_n = nodes.new("ShaderNodeTexImage")
    tex_n.image = normal_img
    normal_map = nodes.new("ShaderNodeNormalMap")
    links.new(tex_c.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(tex_r.outputs["Color"], bsdf.inputs["Roughness"])
    links.new(tex_n.outputs["Color"], normal_map.inputs["Color"])
    links.new(normal_map.outputs["Normal"], bsdf.inputs["Normal"])

    render_mats = [slot.material for slot in bottle.material_slots]
    bottle.data.materials.clear()
    bottle.data.materials.append(mat)

    transform = (bottle.location.copy(), bottle.rotation_euler.copy())
    bottle.location = (0, 0, 0)
    bottle.rotation_euler = (0, 0, 0)
    path = os.path.join(models_dir, f"limex-bottle-{variant}.glb")
    bpy.ops.export_scene.gltf(filepath=path, use_selection=True,
                              export_format='GLB', export_yup=True)
    print(f"[export] {path}")
    bottle.location, bottle.rotation_euler = transform

    # restore procedural materials for any later renders
    bottle.data.materials.clear()
    for m in render_mats:
        bottle.data.materials.append(m)


# --------------------------------------------------------------------- main

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", required=True)
    parser.add_argument("--quick", action="store_true",
                        help="low samples + half resolution for iteration")
    parser.add_argument("--skip-renders", action="store_true")
    parser.add_argument("--skip-export", action="store_true")
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:]
                             if "--" in sys.argv else sys.argv[1:])

    renders_dir = os.path.join(args.out, "renders")
    models_dir = os.path.join(args.out, "models")
    textures_dir = os.path.join(args.out, "textures")
    for d in (renders_dir, models_dir, textures_dir):
        os.makedirs(d, exist_ok=True)

    reset_scene()
    configure_render(args.quick)

    white = build_bottle("white")
    green = build_bottle("green")
    white.location = (-0.078, 0, 0)
    white.rotation_euler = (0, 0, math.radians(168))
    green.location = (0.078, 0, 0)
    green.rotation_euler = (0, 0, math.radians(196))

    build_studio()

    if not args.skip_renders:
        hero = add_camera("cam-hero", (0, -0.60, 0.13), (0, 0, 0.096), 64, 8.0)
        solo = add_camera("cam-solo", (-0.135, -0.44, 0.15),
                          (-0.078, 0, 0.096), 70, 5.6)
        detail = add_camera("cam-detail", (0.02, -0.30, 0.11),
                            (0.075, -0.035, 0.072), 90, 5.6)

        render_shot(hero, os.path.join(renders_dir, "limex-bottles-hero.webp"),
                    1920, 1440, args.quick)

        green.hide_render = True
        render_shot(solo, os.path.join(renders_dir, "limex-bottle-white.webp"),
                    1400, 1750, args.quick)
        green.hide_render = False

        white.hide_render = True
        aim(solo, (0.135, -0.44, 0.15), (0.078, 0, 0.096))
        render_shot(solo, os.path.join(renders_dir, "limex-bottle-green.webp"),
                    1400, 1750, args.quick)
        white.hide_render = False

        render_shot(detail, os.path.join(renders_dir, "limex-facet-detail.webp"),
                    1600, 1200, args.quick)

    if not args.skip_export:
        bake_and_export(white, "white", models_dir, textures_dir)
        bake_and_export(green, "green", models_dir, textures_dir)

    print("[done] limex bottle build complete")


if __name__ == "__main__":
    main()
