"""Build WhiteDot Product 30: Woven Thread (a hank/skein of flat woven tape).

No reference photography or verified spec sheet exists yet, so this is an
honest unbranded procedural model of a typical textile "woven thread" hank:
a flattened coil of woven tape/ribbon (basket-weave surface pattern, distinct
from the round non-woven spool already used for Product 1 "Bobbin"), bound
at the middle with a thin tie strand. Replace geometry once caliper data or
supplier photography arrives.

Blender 5.1 headless usage:
  blender -b --factory-startup --python scripts/blender/build_woven_thread_product30.py
"""
import math
import os

import bpy
import numpy as np
from mathutils import Vector

MM = 0.001
REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_DIR = os.path.join(REPO, "public", "case-study", "model")
RENDER_DIR = os.path.join(REPO, "scripts", "blender", "renders", "product30-woven-thread")
GLB_PATH = os.path.join(MODEL_DIR, "product-30-woven-thread.glb")
BLEND_PATH = os.path.join(RENDER_DIR, "product-30-woven-thread.blend")
WEAVE_COLOR_PATH = os.path.join(MODEL_DIR, "woven-thread-color-2k.png")
WEAVE_ROUGH_PATH = os.path.join(MODEL_DIR, "woven-thread-roughness-2k.png")

COIL_OUTER_R = 68.0   # mm, outer radius of the hank
COIL_INNER_R = 22.0   # mm, inner opening
HANK_HEIGHT = 34.0    # mm, stacked loop height
TAPE_WIDTH = 9.0      # mm, flat woven tape width
TAPE_THICKNESS = 1.4  # mm
LOOPS = 26


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    os.makedirs(MODEL_DIR, exist_ok=True)
    os.makedirs(RENDER_DIR, exist_ok=True)


def save_texture(path, pixels, name):
    image = bpy.data.images.new(name, width=pixels.shape[1], height=pixels.shape[0], alpha=False)
    image.pixels.foreach_set(pixels.ravel())
    image.filepath_raw = path
    image.file_format = "PNG"
    image.save()
    return image


def make_weave_maps():
    """Bake a plain basket-weave colour + roughness map for the flat tape."""
    size = 2048
    if not os.path.exists(WEAVE_COLOR_PATH):
        y, x = np.mgrid[0:size, 0:size]
        warp = 0.5 + 0.5 * np.sin(x * 0.049 * math.tau)
        weft = 0.5 + 0.5 * np.sin(y * 0.049 * math.tau)
        weave = (warp ** 6) * 0.5 + (weft ** 6) * 0.5
        base = np.clip(0.86 - 0.10 * weave, 0.0, 1.0)
        colour = np.empty((size, size, 4), dtype=np.float32)
        colour[..., 0] = np.clip(base + 0.02, 0.0, 1.0)
        colour[..., 1] = np.clip(base + 0.005, 0.0, 1.0)
        colour[..., 2] = np.clip(base - 0.03, 0.0, 1.0)
        colour[..., 3] = 1.0
        save_texture(WEAVE_COLOR_PATH, colour, "Woven_Thread_Color_2K")
        roughness = np.empty((size, size, 4), dtype=np.float32)
        rough = np.clip(0.55 + 0.20 * weave, 0.0, 1.0)
        roughness[..., 0] = rough
        roughness[..., 1] = rough
        roughness[..., 2] = rough
        roughness[..., 3] = 1.0
        save_texture(WEAVE_ROUGH_PATH, roughness, "Woven_Thread_Roughness_2K")
    return (
        bpy.data.images.load(WEAVE_COLOR_PATH, check_existing=True),
        bpy.data.images.load(WEAVE_ROUGH_PATH, check_existing=True),
    )


def make_weave_material(color_image, roughness_image):
    mat = bpy.data.materials.new("Woven tape - basket weave PBR")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    for node in list(nodes):
        nodes.remove(node)
    out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    colour = nodes.new("ShaderNodeTexImage")
    roughness = nodes.new("ShaderNodeTexImage")
    colour.image = color_image
    roughness.image = roughness_image
    roughness.image.colorspace_settings.name = "Non-Color"
    bsdf.inputs["IOR"].default_value = 1.46
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.30
    links.new(colour.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(roughness.outputs["Color"], bsdf.inputs["Roughness"])
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def material(name, color, roughness):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    return mat


def make_tape_loop(name, radius, z, mat, uv_v):
    """One roughly-circular flattened loop of flat woven tape."""
    segments = 96
    verts, faces = [], []
    for i in range(segments):
        angle = math.tau * i / segments
        wobble = 1.0 + 0.045 * math.sin(angle * 5 + z * 3.1)
        r = radius * wobble
        cx, cy = r * math.cos(angle), r * math.sin(angle)
        outward = Vector((math.cos(angle), math.sin(angle), 0))
        up = Vector((0, 0, 1))
        for dz in (-TAPE_THICKNESS / 2, TAPE_THICKNESS / 2):
            for side in (-1, 1):
                point = Vector((cx, cy, z)) + outward * (side * 0) + up * dz
                # widen radially instead of vertically so the tape lies flat
                point = point + outward * (side * TAPE_WIDTH / 2)
                verts.append(tuple(v * MM for v in point))
    for i in range(segments):
        ni = (i + 1) % segments
        base, nbase = i * 4, ni * 4
        faces.extend([
            (base, base + 1, nbase + 1, nbase),
            (base + 2, nbase + 2, nbase + 3, base + 3),
            (base, nbase, nbase + 2, base + 2),
            (base + 1, base + 3, nbase + 3, nbase + 1),
        ])
    mesh = bpy.data.meshes.new(name + "-mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.materials.append(mat)
    mesh.update()
    uv = mesh.uv_layers.new(name="UVMap")
    for poly in mesh.polygons:
        for li in poly.loop_indices:
            vi = mesh.loops[li].vertex_index
            u = (vi // 4) / segments
            uv.data[li].uv = (u * 6.0, uv_v)
        poly.use_smooth = True
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def make_tie_strand(mat):
    """Thin binding cord wrapped twice around the hank's mid girth."""
    points = []
    turns = 2
    steps = 160
    for i in range(steps):
        t = i / (steps - 1)
        angle = math.tau * turns * t
        radius = (COIL_OUTER_R + COIL_INNER_R) / 2.0
        z = HANK_HEIGHT / 2.0 + 6.0 * math.sin(angle * 0.5)
        points.append(Vector((radius * math.cos(angle), radius * math.sin(angle), z)))
    width, thickness = 3.0, 3.0
    verts, faces = [], []
    for i, p in enumerate(points):
        tangent = (points[min(i + 1, steps - 1)] - points[max(i - 1, 0)]).normalized()
        side = tangent.cross(Vector((0, 0, 1)))
        if side.length == 0:
            side = Vector((1, 0, 0))
        side.normalize()
        for dz in (-thickness / 2, thickness / 2):
            for s in (-1, 1):
                v = p + side * (s * width / 2) + Vector((0, 0, dz))
                verts.append(tuple(c * MM for c in v))
    for i in range(steps - 1):
        base, nbase = i * 4, (i + 1) * 4
        faces.extend([
            (base, nbase, nbase + 1, base + 1),
            (base + 2, base + 3, nbase + 3, nbase + 2),
            (base, base + 2, nbase + 2, nbase),
            (base + 1, nbase + 1, nbase + 3, base + 3),
        ])
    mesh = bpy.data.meshes.new("binding-tie-mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.materials.append(mat)
    mesh.update()
    for poly in mesh.polygons:
        poly.use_smooth = True
    obj = bpy.data.objects.new("thin binding tie strand", mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def main():
    reset_scene()
    colour_image, roughness_image = make_weave_maps()
    weave_mat = make_weave_material(colour_image, roughness_image)
    tie_mat = material("charcoal binding tie", (0.05, 0.05, 0.05), 0.45)

    loop_objs = []
    for i in range(LOOPS):
        t = i / (LOOPS - 1)
        z = t * HANK_HEIGHT
        radius = COIL_OUTER_R - (COIL_OUTER_R - COIL_INNER_R) * 0.04 * math.sin(t * math.tau * 2)
        loop_objs.append(make_tape_loop("woven tape loop %02d" % i, radius, z, weave_mat, t))

    tie = make_tie_strand(tie_mat)

    bpy.ops.object.select_all(action='DESELECT')
    for obj in loop_objs:
        obj.select_set(True)
    tie.select_set(True)
    bpy.context.view_layer.objects.active = loop_objs[0]

    # QA studio (excluded from GLB).
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x = 1800
    scene.render.resolution_y = 1800
    scene.render.image_settings.file_format = 'PNG'
    scene.view_settings.look = 'AgX - Medium High Contrast'
    scene.view_settings.exposure = -1.0
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

    def area(name, location_mm, energy, size_mm, target=(0, 0, 17)):
        data = bpy.data.lights.new(name, 'AREA')
        data.energy = energy
        data.shape = 'DISK'
        data.size = size_mm * MM
        obj = bpy.data.objects.new(name, data)
        scene.collection.objects.link(obj)
        obj.location = tuple(v * MM for v in location_mm)
        obj.rotation_euler = (Vector(tuple(v * MM for v in target)) - obj.location).to_track_quat('-Z', 'Y').to_euler()
        return obj

    area("large left softbox", (-260, -320, 300), 18, 300)
    area("right fill", (260, -180, 190), 7, 240)
    area("top rim light", (30, 180, 340), 12, 220)

    bpy.ops.object.camera_add(location=(210 * MM, -320 * MM, 200 * MM))
    cam = bpy.context.object
    cam.name = "QA camera"
    cam.data.lens = 62
    cam.rotation_euler = (Vector((0, 0, 17 * MM)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    scene.camera = cam

    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)

    bpy.ops.object.select_all(action='DESELECT')
    for obj in loop_objs:
        obj.select_set(True)
    tie.select_set(True)
    bpy.context.view_layer.objects.active = loop_objs[0]
    bpy.ops.export_scene.gltf(
        filepath=GLB_PATH, export_format='GLB', export_yup=True, export_apply=True,
        export_materials='EXPORT', use_selection=True,
    )

    scene.render.filepath = os.path.join(RENDER_DIR, "product-30-woven-thread-three-quarter.png")
    bpy.ops.render.render(write_still=True)

    cam.location = (0, -6 * MM, 420 * MM)
    cam.rotation_euler = (Vector((0, 0, 0)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    scene.render.filepath = os.path.join(RENDER_DIR, "product-30-woven-thread-top.png")
    bpy.ops.render.render(write_still=True)

    print("WROTE", GLB_PATH)
    print("WROTE", BLEND_PATH)


if __name__ == "__main__":
    main()
