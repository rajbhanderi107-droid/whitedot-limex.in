"""Concealed conduit pipe -- parametric Blender build.

Builds a black rigid electrical conduit pipe segment matched to the supplied
reference photos: a hollow tube with sawn flat ends exposing the wall
thickness, a flat printed blue stripe running the pipe's length, and an
embossed ISI-style "0090 M" size/batch marking flanked by directional arrows
near one end.

No verified LIMEX composition data exists for this product -- the numbers
below are geometry/proportion parameters read off the reference photography,
not supplier or material-composition claims.

Run headless with the bpy PyPI wheel (Blender 4.5 LTS):

    python3 scripts/blender/build_consile_pipe.py --out public/case-study/model/consile-pipe-procedural.glb
"""

from __future__ import annotations

import argparse
import math
import os
import sys

import bpy
import bmesh
from mathutils import Matrix, Vector

TAU = math.tau

# ---------------------------------------------------------------- parameters
# Pipe lies along Blender's default cylinder axis (Z); circumference is in
# the XY plane. Reference photos, two angles, same pipe -- proportions only.

LENGTH = 1.00                          # full pipe length
OUTER_R = 0.023                        # outer radius
WALL_FRAC = 0.14                       # wall thickness as fraction of OD
SEGMENTS = 64

STRIPE_ANGLE = 0.0                     # stripe generatrix at theta = 0
STRIPE_HALF_ANGLE = math.radians(16)   # flat printed band, +-16 deg -- NOT raised

MARK_ANGLE = -math.radians(30)         # marking sits just below the stripe, same face
MARK_ALONG = LENGTH * 0.30             # off-center toward one cut end (matches photos)
MARK_TEXT = "0090   M"
MARK_SIZE = 0.028
MARK_EXTRUDE = 0.0008                  # raised/embossed, small bevel for a domed stamp look
MARK_BEVEL = 0.00012

ARROW_GAP = 0.052                      # each arrow's offset from the text center
ARROW_LENGTH = 0.020
ARROW_WIDTH = 0.010
ARROW_DEPTH = 0.0007

TILT_DEG = 60                          # tip from vertical (as-built) toward diagonal/horizontal

BLACK = (0.012, 0.012, 0.013, 1.0)     # matte conduit body
BLUE = (0.09, 0.20, 0.62, 1.0)         # printed stripe
SILVER = (0.60, 0.59, 0.56, 1.0)       # embossed ISI-style marking


def reset_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)


def make_material(name: str, color, roughness: float, metallic: float = 0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    return mat


def surface_frame(along: float, angle: float):
    """World position + (tangent, up, radial) basis for a point on the tube's
    outer surface. 'up' runs along the pipe's length (Blender Z) -- markings
    read along 'up', matching pipes stamped lengthwise in the reference
    photos. 'tangent' runs along the circumference, 'radial' points straight
    out of the pipe (the emboss/extrude direction)."""
    radial = Vector((math.cos(angle), math.sin(angle), 0.0))
    up = Vector((0.0, 0.0, 1.0))
    tangent = up.cross(radial).normalized()
    pos = radial * OUTER_R + Vector((0.0, 0.0, along))
    return pos, tangent, up, radial


def surface_matrix(along: float, angle: float) -> Matrix:
    pos, tangent, up, radial = surface_frame(along, angle)
    rot = Matrix((up, tangent, radial)).transposed().to_4x4()
    return Matrix.Translation(pos) @ rot


def build_tube(black_mat, blue_mat):
    inner_r = OUTER_R * (1 - 2 * WALL_FRAC)

    bpy.ops.mesh.primitive_cylinder_add(
        radius=OUTER_R, depth=LENGTH, vertices=SEGMENTS, location=(0, 0, 0))
    outer = bpy.context.active_object
    outer.name = "pipe-outer"

    bpy.ops.mesh.primitive_cylinder_add(
        radius=inner_r, depth=LENGTH * 1.2, vertices=SEGMENTS, location=(0, 0, 0))
    cutter = bpy.context.active_object
    cutter.name = "pipe-bore-cutter"

    boolean = outer.modifiers.new("hollow-bore", "BOOLEAN")
    boolean.operation = "DIFFERENCE"
    boolean.object = cutter
    bpy.context.view_layer.objects.active = outer
    bpy.ops.object.modifier_apply(modifier=boolean.name)
    bpy.data.objects.remove(cutter, do_unlink=True)

    outer.data.materials.append(black_mat)
    outer.data.materials.append(blue_mat)
    for poly in outer.data.polygons:
        cx, cy, _ = poly.center
        theta = math.atan2(cy, cx)
        delta = (theta - STRIPE_ANGLE + math.pi) % TAU - math.pi
        poly.material_index = 1 if abs(delta) <= STRIPE_HALF_ANGLE else 0

    return outer


def build_marking(silver_mat):
    curve = bpy.data.curves.new("mark-text", type="FONT")
    curve.body = MARK_TEXT
    curve.size = MARK_SIZE
    curve.extrude = MARK_EXTRUDE
    curve.bevel_depth = MARK_BEVEL
    curve.align_x = "CENTER"
    curve.align_y = "CENTER"
    obj = bpy.data.objects.new("mark-text", curve)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    obj.data.materials.append(silver_mat)
    obj.matrix_world = surface_matrix(MARK_ALONG, MARK_ANGLE)
    return obj


def build_arrow(name: str, along_offset: float, silver_mat):
    """Small flat triangular arrow glyph on the tube surface, pointing away
    from the text along the pipe's length -- matches the ISI-style stamp."""
    bm = bmesh.new()
    direction = 1.0 if along_offset > 0 else -1.0
    tip = Vector((direction * ARROW_LENGTH, 0.0, ARROW_DEPTH))
    base_l = Vector((0.0, -ARROW_WIDTH / 2, ARROW_DEPTH))
    base_r = Vector((0.0, ARROW_WIDTH / 2, ARROW_DEPTH))
    back_tip = tip - Vector((0, 0, ARROW_DEPTH * 2))
    back_l = base_l - Vector((0, 0, ARROW_DEPTH * 2))
    back_r = base_r - Vector((0, 0, ARROW_DEPTH * 2))

    v_tip, v_l, v_r, v_btip, v_bl, v_br = (
        bm.verts.new(p) for p in (tip, base_l, base_r, back_tip, back_l, back_r)
    )
    bm.faces.new((v_l, v_r, v_tip))
    bm.faces.new((v_br, v_bl, v_btip))
    bm.faces.new((v_l, v_tip, v_btip, v_bl))
    bm.faces.new((v_r, v_br, v_btip, v_tip))
    bm.faces.new((v_l, v_bl, v_br, v_r))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])

    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(silver_mat)
    obj.matrix_world = surface_matrix(MARK_ALONG + along_offset, MARK_ANGLE)
    return obj


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", required=True)
    args = parser.parse_args(
        sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    )

    reset_scene()

    black_mat = make_material("pipe-black", BLACK, roughness=0.68)
    blue_mat = make_material("pipe-blue-stripe", BLUE, roughness=0.35)
    silver_mat = make_material("pipe-emboss-silver", SILVER, roughness=0.32, metallic=0.25)

    tube = build_tube(black_mat, blue_mat)
    marking = build_marking(silver_mat)
    arrow_l = build_arrow("arrow-left", -ARROW_GAP, silver_mat)
    arrow_r = build_arrow("arrow-right", ARROW_GAP, silver_mat)

    # As-built, the pipe's long axis is Blender Z, which export_yup maps to
    # the glTF/model-viewer vertical (Y) axis -- a tall vertical sliver in
    # the site's square viewports, and model-viewer's camera-orbit has no
    # roll to fix that after the fact. Tip the whole assembly around
    # Blender's Y axis (which maps to a horizontal glTF axis) so the pipe
    # reads diagonally by default.
    tilt = Matrix.Rotation(math.radians(TILT_DEG), 4, "Y")
    for obj in (tube, marking, arrow_l, arrow_r):
        obj.matrix_world = tilt @ obj.matrix_world

    bpy.ops.object.select_all(action="DESELECT")
    for obj in (tube, marking, arrow_l, arrow_r):
        obj.select_set(True)

    out_path = os.path.abspath(args.out)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=out_path, use_selection=True, export_format="GLB", export_yup=True
    )
    print(f"[export] {out_path}")


if __name__ == "__main__":
    main()
