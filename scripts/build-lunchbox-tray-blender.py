"""
WhiteDot - 3-compartment lunchbox tray procedural model (photo-match rebuild).

Run:
  "C:/Program Files/Blender Foundation/Blender 5.1/blender.exe" -b -P scripts/build-lunchbox-tray-blender.py

Outputs:
  public/case-study/model/lunchbox-tray-navy.glb
  public/case-study/model/lunchbox-tray-white.glb
  public/case-study/model/lunchbox-tray-coral.glb
  public/case-study/model/lunchbox-tray-green.glb
  public/case-study/model/lunchbox-tray-four-color-lineup.glb
  preview-lunchbox-front.png / preview-lunchbox-back.png / preview-lunchbox-closeup.png
"""

import math
import os

import bmesh
import bpy
from mathutils import Vector

ROOT = r"C:\WHITEDOT CRM"
OUT_DIR = os.path.join(ROOT, "public", "case-study", "model")
os.makedirs(OUT_DIR, exist_ok=True)

RENDER_PREVIEWS = True
EXPORT_GLB = True
SAMPLES = 128

COLORS = {
    "navy": {
        "base": (0.014, 0.027, 0.095, 1.0),
        "shadow": (0.005, 0.009, 0.036, 1.0),
    },
    "white": {
        "base": (0.855, 0.815, 0.730, 1.0),
        "shadow": (0.560, 0.525, 0.462, 1.0),
    },
    "coral": {
        "base": (0.800, 0.150, 0.078, 1.0),
        "shadow": (0.430, 0.068, 0.034, 1.0),
    },
    "green": {
        "base": (0.365, 0.625, 0.410, 1.0),
        "shadow": (0.180, 0.350, 0.215, 1.0),
    },
}

# Blender units: 1 unit = 100 mm.
W = 1.70          # outer width at the rim
L = 2.42          # outer length at the rim
H = 0.68          # tray depth
R_OUT = 0.11      # outer corner radius
RIM = 0.135       # rim/wall width at the top
DIVIDER = 0.13    # divider width between pockets
FLOOR_Z = 0.05    # pocket floor thickness
POCKET_R = 0.11   # pocket corner radius
BODY_TAPER = 0.90     # outer footprint shrink at the base
POCKET_TAPER = 0.74   # pocket floor size relative to its opening
LEAN_X = math.radians(80)   # standing pose, leaning back ~10 deg


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for collection in (
        bpy.data.meshes,
        bpy.data.curves,
        bpy.data.materials,
        bpy.data.lights,
        bpy.data.cameras,
        bpy.data.worlds,
    ):
        for datablock in list(collection):
            if datablock.users == 0:
                collection.remove(datablock)
    scene = bpy.context.scene
    scene.render.resolution_x = 1200
    scene.render.resolution_y = 900
    try:
        scene.view_settings.view_transform = "Filmic"
        scene.view_settings.look = "Medium High Contrast"
    except Exception:
        pass
    scene.view_settings.exposure = -0.12
    scene.view_settings.gamma = 1.0
    try:
        scene.render.engine = "CYCLES"
        scene.cycles.samples = SAMPLES
        scene.cycles.use_denoising = True
    except Exception:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    return scene


def rounded_rect_points(w, h, r, seg=14):
    hw = w / 2
    hh = h / 2
    r = min(r, hw * 0.98, hh * 0.98)
    centers = [
        (hw - r, hh - r, 0.0),
        (-hw + r, hh - r, math.pi / 2),
        (-hw + r, -hh + r, math.pi),
        (hw - r, -hh + r, math.pi * 1.5),
    ]
    pts = []
    for cx, cy, start in centers:
        for i in range(seg + 1):
            a = start + (i / seg) * math.pi / 2
            pts.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
    return pts


def curve_loop(name, pts, z, bevel_depth, material, loc=(0, 0, 0)):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 2
    curve.bevel_depth = bevel_depth
    curve.bevel_resolution = 6
    poly = curve.splines.new("POLY")
    poly.points.add(len(pts))
    for p, (x, y) in zip(poly.points, pts + [pts[0]]):
        p.co = (x + loc[0], y + loc[1], z + loc[2], 1)
    obj = bpy.data.objects.new(name, curve)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(material)
    return obj


def apply_object_modifiers(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    for mod in list(obj.modifiers):
        try:
            bpy.ops.object.modifier_apply(modifier=mod.name)
        except RuntimeError:
            pass
    obj.select_set(False)


def shade_smooth(obj, angle=math.radians(38)):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    try:
        bpy.ops.object.shade_smooth_by_angle(angle=angle)
    except Exception:
        try:
            bpy.ops.object.shade_auto_smooth(angle=angle)
        except Exception:
            bpy.ops.object.shade_smooth()
    obj.select_set(False)


def add_tapered_rounded_box(name, size, radius, taper, loc, material, segments=6):
    """A rounded box whose bottom footprint is scaled by `taper` (molding draft)."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if taper != 1.0:
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        for v in bm.verts:
            if v.co.z < 0:
                v.co.x *= taper
                v.co.y *= taper
        bm.to_mesh(obj.data)
        bm.free()
    bev = obj.modifiers.new("molded radii", "BEVEL")
    bev.width = radius
    bev.segments = segments
    bev.affect = "EDGES"
    obj.modifiers.new("weighted normals", "WEIGHTED_NORMAL")
    if material is not None:
        obj.data.materials.append(material)
    return obj


def add_cylinder(name, radius, depth, loc, material, vertices=48, bevel=0.005):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.data.materials.append(material)
    if bevel:
        mod = obj.modifiers.new("soft bevel", "BEVEL")
        mod.width = min(radius * 0.3, bevel)
        mod.segments = 3
    obj.modifiers.new("weighted normals", "WEIGHTED_NORMAL")
    return obj


def make_material(name, spec):
    """Satin molded-pulp plastic: matte with fine speckle bump, barely any coat."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")

    def set_input(key, value):
        if bsdf and key in bsdf.inputs:
            bsdf.inputs[key].default_value = value

    set_input("Base Color", spec["base"])
    set_input("Roughness", 0.40)
    set_input("Metallic", 0.0)
    set_input("IOR", 1.45)
    set_input("Coat Weight", 0.16)
    set_input("Coat Roughness", 0.22)
    if bsdf:
        nodes = mat.node_tree.nodes
        links = mat.node_tree.links
        noise = nodes.new("ShaderNodeTexNoise")
        noise.inputs["Scale"].default_value = 190
        noise.inputs["Detail"].default_value = 10
        noise.inputs["Roughness"].default_value = 0.60
        bump = nodes.new("ShaderNodeBump")
        bump.inputs["Strength"].default_value = 0.32
        bump.inputs["Distance"].default_value = 0.016
        links.new(noise.outputs["Fac"], bump.inputs["Height"])
        links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
        # subtle roughness variation so highlights break up like molded pulp
        rnoise = nodes.new("ShaderNodeTexNoise")
        rnoise.inputs["Scale"].default_value = 90
        rnoise.inputs["Detail"].default_value = 6
        ramp = nodes.new("ShaderNodeMapRange")
        ramp.inputs["From Min"].default_value = 0.0
        ramp.inputs["From Max"].default_value = 1.0
        ramp.inputs["To Min"].default_value = 0.40
        ramp.inputs["To Max"].default_value = 0.58
        links.new(rnoise.outputs["Fac"], ramp.inputs["Value"])
        links.new(ramp.outputs["Result"], bsdf.inputs["Roughness"])
    return mat


def make_flat_material(name, rgba, roughness=0.5):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = rgba
        bsdf.inputs["Roughness"].default_value = roughness
    return mat


def cut_pocket(body, name, cx, cy, w, l):
    """Boolean-cut a tapered pocket (opening w x l at the rim, smaller floor)."""
    depth = H - FLOOR_Z + 0.06
    cutter = add_tapered_rounded_box(
        f"{name}-cutter",
        (w, l, depth),
        POCKET_R,
        POCKET_TAPER,
        (cx, cy, FLOOR_Z + depth / 2),
        None,
        segments=5,
    )
    apply_object_modifiers(cutter)
    boolean = body.modifiers.new(f"{name}-pocket", "BOOLEAN")
    boolean.operation = "DIFFERENCE"
    boolean.object = cutter
    try:
        boolean.solver = "EXACT"
    except Exception:
        pass
    bpy.context.view_layer.objects.active = body
    body.select_set(True)
    bpy.ops.object.modifier_apply(modifier=boolean.name)
    body.select_set(False)
    bpy.data.objects.remove(cutter, do_unlink=True)


def add_underside_details(color_name, inner_w, big_cy, big_l, small_cy, small_w, small_l, small_offset, mat, shadow_mat):
    """Back-of-tray details from reference photo 1."""
    parts = []
    z = -0.035

    # Two raised square pads behind the small compartments, each with two small holes.
    pad_w = small_w * 0.62
    pad_l = small_l * 0.62
    for sx in (-1, 1):
        px = sx * small_offset
        parts.append(add_tapered_rounded_box(
            f"lunchbox-tray-{color_name}-underside-pad-{sx}",
            (pad_w, pad_l, 0.070),
            0.045,
            1.0,
            (px, small_cy, z),
            mat,
        ))
        for oy in (-0.115, 0.115):
            parts.append(add_cylinder(
                f"lunchbox-tray-{color_name}-underside-hole-{sx}-{oy:.2f}",
                0.016,
                0.012,
                (px, small_cy + oy, z - 0.040),
                shadow_mat,
                vertices=24,
                bevel=0.0,
            ))

    # One large raised plate behind the big compartment, with four round feet.
    parts.append(add_tapered_rounded_box(
        f"lunchbox-tray-{color_name}-underside-plate",
        (inner_w * 0.84, big_l * 0.74, 0.055),
        0.075,
        1.0,
        (0, big_cy, z),
        mat,
    ))
    for x in (-inner_w * 0.30, inner_w * 0.30):
        for y in (big_cy - big_l * 0.24, big_cy + big_l * 0.24):
            parts.append(add_cylinder(
                f"lunchbox-tray-{color_name}-foot-{x:.2f}-{y:.2f}",
                0.045,
                0.055,
                (x, y, z - 0.048),
                mat,
                vertices=40,
            ))

    # Short molded segment breaks along the outer side walls (flush with the
    # tapered wall: half-width shrinks from W/2*BODY_TAPER at z=0 to W/2 at z=H).
    z_groove = H * 0.55
    hw = (W / 2) * (BODY_TAPER + (1 - BODY_TAPER) * (z_groove / H))
    for sx in (-1, 1):
        for i, y in enumerate((-0.82, -0.44, -0.06, 0.34, 0.74)):
            parts.append(add_tapered_rounded_box(
                f"lunchbox-tray-{color_name}-side-groove-{sx}-{i}",
                (0.010, 0.008, 0.26),
                0.003,
                1.0,
                (sx * (hw - 0.001), y, z_groove),
                shadow_mat,
                segments=2,
            ))
    return parts


def build_tray(color_name, loc=(0, 0, 0), rotate_z=0.0, lean_x=LEAN_X):
    spec = COLORS[color_name]
    mat = make_material(f"limex tray {color_name}", spec)
    shadow = make_flat_material(f"tray recess {color_name}", spec["shadow"], roughness=0.55)

    # Outer body with molding draft, pockets boolean-cut, then one rounding
    # bevel pass so every rim reads as a rolled lip.
    body = add_tapered_rounded_box(
        f"lunchbox-tray-{color_name}-body",
        (W, L, H),
        R_OUT,
        BODY_TAPER,
        (0, 0, H / 2),
        mat,
    )
    apply_object_modifiers(body)

    inner_w = W - 2 * RIM
    inner_l = L - 2 * RIM
    big_l = inner_l * 0.515
    small_l = inner_l - big_l - DIVIDER
    small_w = (inner_w - DIVIDER) / 2
    y_lo = -L / 2 + RIM
    y_hi = L / 2 - RIM
    big_cy = y_lo + big_l / 2
    small_cy = y_hi - small_l / 2
    small_offset = (inner_w - small_w) / 2

    cut_pocket(body, "big", 0, big_cy, inner_w, big_l)
    cut_pocket(body, "left", -small_offset, small_cy, small_w, small_l)
    cut_pocket(body, "right", small_offset, small_cy, small_w, small_l)

    lip = body.modifiers.new("rolled lip", "BEVEL")
    lip.width = 0.016
    lip.segments = 3
    lip.limit_method = "ANGLE"
    lip.angle_limit = math.radians(40)
    body.modifiers.new("weighted normals", "WEIGHTED_NORMAL")
    apply_object_modifiers(body)
    shade_smooth(body)
    parts = [body]

    # Ejector-pin dimple on each pocket floor.
    floor_scale = (1 + POCKET_TAPER) / 2  # pocket floor sits mid-taper visually
    for pname, cx, cy in (
        ("big", 0, big_cy),
        ("left", -small_offset, small_cy),
        ("right", small_offset, small_cy),
    ):
        parts.append(add_cylinder(
            f"lunchbox-tray-{color_name}-{pname}-ejector-dimple",
            0.040,
            0.010,
            (cx, cy, FLOOR_Z + 0.004),
            mat,
            vertices=48,
        ))

    # Rolled outer lip band hugging the beveled top shoulder, plus molded
    # segment tick marks crossing the lip (both visible in the references).
    # The body's top-edge bevel (radius R_OUT) means the outer surface at
    # height z = H - 0.03 sits at half-width W/2 - R_OUT + sqrt(R^2 - (R-0.03)^2).
    drop = 0.03
    shoulder = R_OUT - math.sqrt(max(R_OUT**2 - (R_OUT - drop) ** 2, 0.0))
    lip_pts = rounded_rect_points(W - 2 * shoulder, L - 2 * shoulder, R_OUT * 0.9)
    parts.append(curve_loop(f"lunchbox-tray-{color_name}-rolled-outer-lip", lip_pts, H - drop, 0.013, mat))
    tick_hx = W / 2 - shoulder
    tick_hy = L / 2 - shoulder
    tick_idx = 0
    for y in (-0.95, -0.30, 0.35, 0.95):
        for sx in (-1, 1):
            tick_idx += 1
            parts.append(add_tapered_rounded_box(
                f"lunchbox-tray-{color_name}-rim-tick-{tick_idx}",
                (0.030, 0.0055, 0.018),
                0.002, 1.0,
                (sx * tick_hx, y, H - drop),
                mat, segments=2,
            ))
    for x in (-0.42, 0.0, 0.42):
        for sy in (-1, 1):
            tick_idx += 1
            parts.append(add_tapered_rounded_box(
                f"lunchbox-tray-{color_name}-rim-tick-{tick_idx}",
                (0.0055, 0.030, 0.018),
                0.002, 1.0,
                (x, sy * tick_hy, H - drop),
                mat, segments=2,
            ))

    parts += add_underside_details(
        color_name, inner_w, big_cy, big_l, small_cy, small_w, small_l, small_offset, mat, shadow
    )

    empty = bpy.data.objects.new(f"lunchbox-tray-{color_name}", None)
    bpy.context.scene.collection.objects.link(empty)
    empty.location = loc
    empty.rotation_euler.x = lean_x
    empty.rotation_euler.z = rotate_z
    for p in parts:
        p.parent = empty
    return empty, parts


def raise_to_ground(empty, ground_z=0.0):
    bpy.context.view_layer.update()
    min_z = min(
        (empty.matrix_world @ Vector(corner)).z
        for child in empty.children_recursive
        for corner in child.bound_box
    )
    empty.location.z += ground_z - min_z


def add_stage(scene):
    world = bpy.data.worlds.new("soft studio world")
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.72, 0.72, 0.70, 1.0)
        bg.inputs[1].default_value = 0.55
    scene.world = world

    grey = make_flat_material("plinth grey", (0.560, 0.575, 0.590, 1.0), roughness=0.35)
    wall = make_flat_material("backdrop grey", (0.610, 0.615, 0.610, 1.0), roughness=0.85)
    # mottled backdrop like the reference wall
    bsdf = wall.node_tree.nodes.get("Principled BSDF")
    nodes = wall.node_tree.nodes
    links = wall.node_tree.links
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 3.2
    noise.inputs["Detail"].default_value = 8
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.30
    ramp.color_ramp.elements[0].color = (0.545, 0.555, 0.560, 1.0)
    ramp.color_ramp.elements[1].position = 0.85
    ramp.color_ramp.elements[1].color = (0.680, 0.685, 0.675, 1.0)
    links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    if bsdf:
        links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])

    # Plinth: top surface at z = 0, front edge visible to camera.
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0.9, -0.55))
    plinth = bpy.context.active_object
    plinth.name = "studio plinth"
    plinth.dimensions = (14.0, 5.2, 1.1)
    plinth.data.materials.append(grey)

    # Lower front apron under the plinth (dark step seen in the reference).
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 1.15, -1.45))
    apron = bpy.context.active_object
    apron.name = "plinth apron"
    apron.dimensions = (14.0, 4.7, 0.7)
    apron.data.materials.append(make_flat_material("apron", (0.32, 0.33, 0.35, 1.0), roughness=0.5))

    # Backdrop wall.
    bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 4.2, 4.0), rotation=(math.radians(90), 0, 0))
    bpy.context.active_object.name = "backdrop wall"
    bpy.context.active_object.data.materials.append(wall)

    lights = [
        ("key soft left", (-3.4, -4.6, 3.4), 480, 3.2),
        ("fill right", (3.2, -4.2, 2.2), 250, 2.6),
        ("top soft", (0.0, -0.8, 5.2), 210, 4.5),
    ]
    for name, loc, energy, size in lights:
        data = bpy.data.lights.new(name, "AREA")
        data.energy = energy
        data.size = size
        obj = bpy.data.objects.new(name, data)
        obj.location = loc
        obj.rotation_euler = (Vector((0, 0.4, 1.2)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        scene.collection.objects.link(obj)

    cam_data = bpy.data.cameras.new("product camera")
    cam = bpy.data.objects.new("product camera", cam_data)
    scene.collection.objects.link(cam)
    cam.location = (0.0, -9.6, 1.55)
    target = Vector((0.0, 0.0, 1.15))
    cam.rotation_euler = (target - Vector(cam.location)).to_track_quat("-Z", "Y").to_euler()
    cam_data.lens = 33
    cam_data.dof.use_dof = True
    cam_data.dof.focus_distance = 9.6
    cam_data.dof.aperture_fstop = 5.0
    scene.camera = cam
    return cam


def export_selected(filepath, objects):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
        for child in obj.children_recursive:
            child.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=True,
    )
    print(f"EXPORTED {filepath}")


def render_preview(scene, filepath):
    if not RENDER_PREVIEWS:
        print(f"SKIPPED RENDER {filepath}")
        return
    scene.render.filepath = filepath
    bpy.ops.render.render(write_still=True)
    print(f"RENDERED {filepath}")


def main():
    scene = reset_scene()
    cam = add_stage(scene)

    lineup = []
    placements = {
        "navy": (-3.30, 0.00, math.radians(7)),
        "white": (-1.10, 0.03, math.radians(2)),
        "coral": (1.10, 0.03, math.radians(-2)),
        "green": (3.30, 0.00, math.radians(-6)),
    }
    for color in ("navy", "white", "coral", "green"):
        x, y, rz = placements[color]
        empty, _parts = build_tray(color, loc=(x, y, 0), rotate_z=rz)
        raise_to_ground(empty, ground_z=-0.045)
        lineup.append(empty)

    if EXPORT_GLB:
        for empty in lineup:
            original = empty.location.copy()
            original_rot = empty.rotation_euler.z
            empty.location = (0, 0, 0)
            empty.rotation_euler.z = 0
            raise_to_ground(empty, ground_z=0.0)
            bpy.context.view_layer.update()
            color = empty.name.replace("lunchbox-tray-", "")
            export_selected(os.path.join(OUT_DIR, f"lunchbox-tray-{color}.glb"), [empty])
            empty.location = original
            empty.rotation_euler.z = original_rot
        bpy.context.view_layer.update()
        export_selected(os.path.join(OUT_DIR, "lunchbox-tray-four-color-lineup.glb"), lineup)

    # Front hero view (reference photo 2).
    render_preview(scene, os.path.join(ROOT, "preview-lunchbox-front.png"))

    # Back view (reference photo 1): physically turn each tray around (yaw 180),
    # so the underside faces the camera with the top edge still at the top.
    for empty in lineup:
        empty.rotation_euler.z += math.pi
        raise_to_ground(empty, ground_z=-0.045)
    render_preview(scene, os.path.join(ROOT, "preview-lunchbox-back.png"))
    for empty in lineup:
        empty.rotation_euler.z -= math.pi
        raise_to_ground(empty, ground_z=-0.045)

    # Close-up on the coral tray rim (reference photo 3).
    cam.location = (1.35, -3.1, 1.35)
    target = Vector((1.10, 0.0, 1.00))
    cam.rotation_euler = (target - Vector(cam.location)).to_track_quat("-Z", "Y").to_euler()
    render_preview(scene, os.path.join(ROOT, "preview-lunchbox-closeup.png"))

    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, "lunchbox-tray-blender-mcp.blend"))
    print("DONE - lunchbox tray model assets exported.")


if __name__ == "__main__":
    main()
