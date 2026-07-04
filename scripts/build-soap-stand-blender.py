"""
WhiteDot Product 08 - soap stand procedural Blender model.

Run:
  "C:/Program Files/Blender Foundation/Blender 5.1/blender.exe" -b -P scripts/build-soap-stand-blender.py

Outputs:
  public/case-study/model/soap-stand-procedural.glb
  preview-soap-stand-front.png
  preview-soap-stand-top.png
  preview-soap-stand-exploded.png
"""

import math
import os

import bpy
from mathutils import Vector

ROOT = r"C:\WHITEDOT CRM"
OUT_DIR = os.path.join(ROOT, "public", "case-study", "model")
os.makedirs(OUT_DIR, exist_ok=True)

EXPORT_GLB = True
RENDER_PREVIEWS = True
SAMPLES = 32

CREAM = (0.875, 0.840, 0.745, 1.0)
CREAM_SHADOW = (0.610, 0.560, 0.455, 1.0)
SAGE = (0.470, 0.620, 0.410, 1.0)
DARK_SAGE = (0.165, 0.305, 0.175, 1.0)
SLOT_DARK = (0.075, 0.120, 0.075, 1.0)
RED_INK = (0.730, 0.035, 0.095, 1.0)


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    scene = bpy.context.scene
    scene.render.resolution_x = 1100
    scene.render.resolution_y = 820
    scene.frame_start = 1
    scene.frame_end = 150
    for engine in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
        try:
            scene.render.engine = engine
            break
        except Exception:
            continue
    else:
        scene.render.engine = "BLENDER_WORKBENCH"
    scene.view_settings.view_transform = "Filmic"
    scene.view_settings.look = "Medium High Contrast"
    scene.view_settings.exposure = -0.18
    scene.view_settings.gamma = 1.0
    return scene


def material(name, rgba, roughness=0.56, coat=0.08, bump=False):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = rgba
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = 0
        if "Coat Weight" in bsdf.inputs:
            bsdf.inputs["Coat Weight"].default_value = coat
        if "Coat Roughness" in bsdf.inputs:
            bsdf.inputs["Coat Roughness"].default_value = 0.36
        if bump:
            nodes = mat.node_tree.nodes
            links = mat.node_tree.links
            noise = nodes.new("ShaderNodeTexNoise")
            noise.inputs["Scale"].default_value = 180
            noise.inputs["Detail"].default_value = 9
            noise.inputs["Roughness"].default_value = 0.58
            bump_node = nodes.new("ShaderNodeBump")
            bump_node.inputs["Strength"].default_value = 0.11
            bump_node.inputs["Distance"].default_value = 0.010
            links.new(noise.outputs["Fac"], bump_node.inputs["Height"])
            links.new(bump_node.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


def shade(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    try:
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(42))
    except Exception:
        bpy.ops.object.shade_smooth()
    obj.select_set(False)
    return obj


def rounded_box(name, loc, scale, mat, bevel=0.08, segments=10):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    mod = obj.modifiers.new("soft molded radii", "BEVEL")
    mod.width = bevel
    mod.segments = segments
    mod.affect = "EDGES"
    obj.modifiers.new("weighted normals", "WEIGHTED_NORMAL")
    obj.data.materials.append(mat)
    return shade(obj)


def wavy_curve_loop(name, pts, z_base, amp, cycles, bevel_depth, mat, phase=0.0):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 3
    curve.bevel_depth = bevel_depth
    curve.bevel_resolution = 5
    poly = curve.splines.new("POLY")
    poly.points.add(len(pts))
    closed = pts + [pts[0]]
    for i, (p, (x, y)) in enumerate(zip(poly.points, closed)):
        z = z_base + amp * math.sin(phase + (i / max(1, len(pts))) * math.pi * 2 * cycles)
        p.co = (x, y, z, 1)
    obj = bpy.data.objects.new(name, curve)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(mat)
    return obj


def superellipse_xy(w, l, r, n=4.0, count=160):
    pts = []
    a = w / 2 - r
    b = l / 2 - r
    for i in range(count):
        t = 2 * math.pi * i / count
        ct = math.cos(t)
        st = math.sin(t)
        x = math.copysign(abs(ct) ** (2 / n), ct) * a + math.cos(t) * r
        y = math.copysign(abs(st) ** (2 / n), st) * b + math.sin(t) * r
        pts.append((x, y))
    return pts


def pillow_lid(mat, shadow_mat):
    rows = 32
    cols = 44
    w = 2.18
    l = 1.46
    verts = []
    faces = []
    for iy in range(rows + 1):
        y = -l / 2 + l * iy / rows
        for ix in range(cols + 1):
            x = -w / 2 + w * ix / cols
            nx = abs(x) / (w / 2)
            ny = abs(y) / (l / 2)
            edge = max(nx, ny)
            dome = 0.16 * max(0, 1 - 0.72 * (nx ** 2 + ny ** 2))
            lip_drop = -0.030 * max(0, edge - 0.78) / 0.22
            verts.append((x, y, 0.89 + dome + lip_drop))
    for iy in range(rows):
        for ix in range(cols):
            a = iy * (cols + 1) + ix
            faces.append((a, a + 1, a + cols + 2, a + cols + 1))
    mesh = bpy.data.meshes.new("soap-lid-pillow-mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new("soap-stand-cream-domed-lid", mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(mat)
    obj.modifiers.new("weighted normals", "WEIGHTED_NORMAL")
    shade(obj)

    skirt_pts = superellipse_xy(2.24, 1.52, 0.20, count=180)
    skirt = wavy_curve_loop("soap-lid-continuous-wavy-cream-skirt", skirt_pts, 0.815, 0.020, 18, 0.026, mat, phase=0.25)
    skirt.parent = obj
    skirt_shadow = wavy_curve_loop("soap-lid-lower-cream-skirt-shadow", skirt_pts, 0.786, 0.012, 18, 0.012, shadow_mat, phase=0.85)
    skirt_shadow.parent = obj
    return obj


def add_grain(name, x, y, z, angle, mat, parent):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=0.035, location=(x, y, z))
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (1.42, 0.44, 0.20)
    obj.rotation_euler = (0.12, 0.0, angle)
    obj.data.materials.append(mat)
    shade(obj)
    obj.parent = parent
    return obj


def add_lid_pattern(lid, mat):
    idx = 0
    for row, y in enumerate([v * 0.115 for v in range(-5, 6)]):
        x_positions = [v * 0.145 for v in range(-6, 7)]
        for col, x in enumerate(x_positions):
            if (abs(x) / 1.05) ** 4 + (abs(y) / 0.65) ** 4 > 0.92:
                continue
            dome_z = 1.050 - 0.055 * ((abs(x) / 1.1) ** 2 + (abs(y) / 0.73) ** 2)
            angle = math.radians(34 if (col + row) % 2 == 0 else -34)
            add_grain(f"soap-lid-raised-rice-grain-{idx:03d}", x, y, dome_z + 0.018, angle, mat, lid)
            idx += 1
    # Centerline pinched grains make the chevron/rice pattern read more like the photos.
    for y in [v * 0.118 for v in range(-5, 6)]:
        add_grain(f"soap-lid-center-knit-{idx:03d}", -0.038, y, 1.070, math.radians(28), mat, lid)
        idx += 1
        add_grain(f"soap-lid-center-knit-{idx:03d}", 0.038, y, 1.070, math.radians(-28), mat, lid)
        idx += 1


def add_bow(parent, mat):
    for sx in (-1, 1):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=0.18, location=(sx * 0.18, -0.02, 1.185))
        lobe = bpy.context.active_object
        lobe.name = f"soap-lid-bow-lobe-{sx}"
        lobe.scale = (1.35, 0.78, 0.28)
        lobe.rotation_euler.z = math.radians(-16 * sx)
        lobe.data.materials.append(mat)
        shade(lobe)
        lobe.parent = parent
    knot = rounded_box("soap-lid-bow-center-knot", (0, -0.02, 1.195), (0.16, 0.20, 0.105), mat, bevel=0.035, segments=8)
    knot.parent = parent
    for sx in (-1, 1):
        tail = rounded_box(f"soap-lid-bow-tail-{sx}", (sx * 0.115, -0.205, 1.125), (0.13, 0.32, 0.055), mat, bevel=0.025, segments=6)
        tail.rotation_euler.z = math.radians(12 * sx)
        tail.parent = parent


def add_wavy_strip(parent, mat_dark):
    # Uneven lower dark green strip: continuous, slightly imperfect molded wave
    # visible below the sage tray rim in the side reference.
    pts = superellipse_xy(2.30, 1.58, 0.20, count=180)
    strip = wavy_curve_loop("soap-base-continuous-uneven-dark-green-strip", pts, 0.505, 0.034, 18, 0.022, mat_dark, phase=0.35)
    strip.parent = parent
    shadow = wavy_curve_loop("soap-base-lower-dark-green-shadow-lip", pts, 0.458, 0.020, 18, 0.014, mat_dark, phase=1.2)
    shadow.parent = parent


def build_base(cream_mat, sage_mat, dark_mat):
    base = rounded_box("soap-stand-cream-lower-dish-body", (0, 0, 0.245), (2.34, 1.62, 0.44), cream_mat, bevel=0.17, segments=14)
    shadow = rounded_box("soap-stand-lower-cream-recess-shadow", (0, 0, 0.455), (2.04, 1.31, 0.050), dark_mat, bevel=0.11, segments=8)
    shadow.parent = base
    green_rim = rounded_box("soap-stand-sage-middle-tray-rim", (0, 0, 0.615), (2.37, 1.65, 0.205), sage_mat, bevel=0.16, segments=14)
    green_rim.parent = base
    add_wavy_strip(base, dark_mat)
    rim_pts = superellipse_xy(2.29, 1.57, 0.18, count=180)
    scallop = wavy_curve_loop("soap-base-continuous-scalloped-sage-rim", rim_pts, 0.745, 0.020, 18, 0.026, sage_mat, phase=0.1)
    scallop.parent = base
    inner_scallop = wavy_curve_loop("soap-base-inner-sage-rim-line", superellipse_xy(2.05, 1.33, 0.14, count=160), 0.812, 0.010, 18, 0.014, sage_mat, phase=0.6)
    inner_scallop.parent = base
    return base


def build_insert(mat, dark_mat):
    insert = rounded_box("soap-stand-sage-slotted-drain-insert", (0, 0, 0.785), (1.92, 1.20, 0.075), mat, bevel=0.105, segments=10)
    border = rounded_box("soap-stand-insert-raised-border", (0, 0, 0.845), (1.79, 1.07, 0.036), mat, bevel=0.080, segments=8)
    border.parent = insert
    # The reference has long vertical rounded slots, many of them, with
    # alternating raised ribs between the cut-outs.
    slot_xs = [-0.66, -0.50, -0.34, -0.18, -0.02, 0.14, 0.30, 0.46, 0.62]
    idx = 0
    for x in slot_xs:
        slot = rounded_box(f"soap-stand-long-vertical-drain-slot-{idx:02d}", (x, 0.0, 0.888), (0.060, 0.72, 0.018), dark_mat, bevel=0.030, segments=8)
        slot.parent = insert
        idx += 1
    for x in [-0.58, -0.42, -0.26, -0.10, 0.06, 0.22, 0.38, 0.54]:
        rib = rounded_box(f"soap-stand-raised-sage-drain-rib-{idx:02d}", (x, 0.0, 0.905), (0.045, 0.74, 0.030), mat, bevel=0.022, segments=6)
        rib.parent = insert
        idx += 1
    return insert


def add_red_marking(name, text, loc, rot, size, mat):
    font_curve = bpy.data.curves.new(name, "FONT")
    font_curve.body = text
    font_curve.align_x = "CENTER"
    font_curve.align_y = "CENTER"
    font_curve.size = size
    font_curve.extrude = 0.002
    obj = bpy.data.objects.new(name, font_curve)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = loc
    obj.rotation_euler = rot
    obj.data.materials.append(mat)
    return obj


def animate(obj, loc1, loc2, rot1=(0, 0, 0), rot2=(0, 0, 0)):
    for frame, loc, rot in ((1, loc1, rot1), (42, loc1, rot1), (92, loc2, rot2), (132, loc2, rot2), (150, loc1, rot1)):
        bpy.context.scene.frame_set(frame)
        obj.location = loc
        obj.rotation_euler = rot
        obj.keyframe_insert(data_path="location")
        obj.keyframe_insert(data_path="rotation_euler")


def assign_nla_clip(objects, clip_name):
    for obj in objects:
        if not obj.animation_data or not obj.animation_data.action:
            continue
        action = obj.animation_data.action
        action.name = f"{clip_name}_{obj.name}"
        track = obj.animation_data.nla_tracks.new()
        track.name = clip_name
        strip = track.strips.new(clip_name, int(action.frame_range[0]), action)
        strip.name = clip_name
        obj.animation_data.action = None


def add_stage(scene):
    world = bpy.data.worlds.new("soap soft studio world")
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.78, 0.78, 0.74, 1)
        bg.inputs[1].default_value = 0.58
    scene.world = world
    for name, loc, energy, size in (
        ("large softbox left", (-3.0, -4.5, 4.0), 430, 3.8),
        ("rim softbox right", (3.8, -2.0, 2.5), 160, 2.8),
        ("top wash", (0, -1.2, 5.2), 120, 4.0),
    ):
        data = bpy.data.lights.new(name, "AREA")
        data.energy = energy
        data.size = size
        obj = bpy.data.objects.new(name, data)
        obj.location = loc
        obj.rotation_euler = (Vector((0, 0, 0.7)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        scene.collection.objects.link(obj)
    floor_mat = material("warm grey studio floor", (0.62, 0.62, 0.58, 1), roughness=0.82)
    bpy.ops.mesh.primitive_plane_add(size=10, location=(0, 0, -0.006))
    floor = bpy.context.active_object
    floor.name = "soap-stand-studio-floor"
    floor.data.materials.append(floor_mat)
    cam_data = bpy.data.cameras.new("soap product camera")
    cam = bpy.data.objects.new("soap product camera", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    return cam


def set_camera(cam, loc, target, lens=48):
    cam.location = loc
    cam.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    cam.data.lens = lens


def render(scene, path):
    if not RENDER_PREVIEWS:
        return
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print("RENDERED", path)


def export_glb(path, objects):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
        for child in obj.children_recursive:
            child.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=False,
        export_animations=True,
        export_animation_mode="NLA_TRACKS",
        export_merge_animation="NLA_TRACK",
        export_nla_strips_merged_animation_name="Explode",
    )
    print("EXPORTED", path)


def main():
    scene = reset_scene()
    cream = material("warm cream LIMEX matte", CREAM, roughness=0.62, coat=0.05, bump=True)
    cream_shadow = material("cream recessed shadow", CREAM_SHADOW, roughness=0.70)
    sage = material("sage green LIMEX matte", SAGE, roughness=0.54, coat=0.10, bump=True)
    dark = material("uneven dark green recessed strip", DARK_SAGE, roughness=0.62, coat=0.04, bump=True)
    slot_dark = material("deep drain slot shadow", SLOT_DARK, roughness=0.75)

    red = material("red marker writing", RED_INK, roughness=0.68, coat=0.0)

    base = build_base(cream, sage, dark)
    insert = build_insert(sage, slot_dark)
    lid = pillow_lid(cream, cream_shadow)
    add_lid_pattern(lid, cream)
    add_bow(lid, cream)
    # Small red marker traces visible in the supplied photos.
    lid_text = add_red_marking("soap-lid-inner-red-15-percent-limex", "15% limest", (0.0, -0.33, 0.785), (math.radians(8), 0, math.radians(-8)), 0.145, red)
    lid_text.parent = lid
    insert_text = add_red_marking("soap-insert-faint-red-writing", "15", (0.56, -0.06, 0.913), (0, 0, math.radians(82)), 0.18, red)
    insert_text.parent = insert

    animate(base, (0, 0, 0), (0, 0, 0))
    animate(insert, (0, 0, 0), (0.0, 0.0, 0.50), (0, 0, 0), (0, 0, math.radians(2)))
    animate(lid, (0, 0, 0), (-0.22, -0.18, 0.92), (0, 0, 0), (math.radians(-16), math.radians(-6), math.radians(-8)))
    assign_nla_clip([base, insert, lid], "Explode")

    cam = add_stage(scene)
    set_camera(cam, (0, -4.1, 1.42), (0, 0, 0.72), lens=56)
    scene.frame_set(1)
    render(scene, os.path.join(ROOT, "preview-soap-stand-front.png"))
    set_camera(cam, (0, -0.25, 4.2), (0, 0, 0.72), lens=62)
    render(scene, os.path.join(ROOT, "preview-soap-stand-top.png"))
    scene.frame_set(92)
    set_camera(cam, (2.25, -3.5, 2.15), (0, 0, 0.95), lens=48)
    render(scene, os.path.join(ROOT, "preview-soap-stand-exploded.png"))

    if EXPORT_GLB:
        scene.frame_set(1)
        export_glb(os.path.join(OUT_DIR, "soap-stand-procedural.glb"), [base, insert, lid])
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, "soap-stand-blender-mcp.blend"))
    print("DONE - Product 08 soap stand model exported.")


if __name__ == "__main__":
    main()
