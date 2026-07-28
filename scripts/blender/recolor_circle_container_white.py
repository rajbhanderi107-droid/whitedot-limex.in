"""Product 38 Circle Container — recolour the container body bright white.

The photo-matched source .blend has a pale-blush body, a warm-white rim and a
milky interior. Raj asked for a bright white container with the lid left
exactly as it is, so this touches only the three body-side materials and never
the two red ones ('glossy saturated red lid and handle polypropylene',
'red molded recess detail').

Base colours are LINEAR (that is what Principled BSDF stores); 0.90 linear is
roughly sRGB 245, i.e. bright white that still takes shading rather than
clipping to a flat silhouette.

Run:
  blender -b --factory-startup --python scripts/blender/recolor_circle_container_white.py
"""

import bpy
import os

SRC = r"C:\Users\rbhan\Documents\whitedot\public\case-study\model\pink-red-3l-bucket\pink-red-3l-bucket-photo-match.blend"
OUT = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "public", "case-study", "model", "product-38-circle-container.glb",
)

# material name -> (new linear base colour, new name)
RECOLOR = {
    "pale blush semi-gloss polypropylene body": ((0.90, 0.90, 0.90, 1.0), "bright white semi-gloss polypropylene body"),
    "warm white locking rim polypropylene":     ((0.88, 0.88, 0.88, 1.0), "bright white locking rim polypropylene"),
    "milky pale interior polypropylene":        ((0.84, 0.84, 0.84, 1.0), "bright white interior polypropylene"),
}
KEEP = {
    "glossy saturated red lid and handle polypropylene",
    "red molded recess detail",
}

bpy.ops.wm.open_mainfile(filepath=SRC)

for name, (rgba, new_name) in RECOLOR.items():
    mat = bpy.data.materials.get(name)
    if not mat:
        raise SystemExit("missing material: %s" % name)
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if not bsdf:
        raise SystemExit("no Principled BSDF on: %s" % name)
    if bsdf.inputs["Base Color"].is_linked:
        raise SystemExit("base colour is texture-linked on: %s" % name)
    before = [round(c, 4) for c in bsdf.inputs["Base Color"].default_value]
    bsdf.inputs["Base Color"].default_value = rgba
    mat.name = new_name
    print("RECOLOR %-46s %s -> %s" % (name, before, list(rgba)))

for name in KEEP:
    mat = bpy.data.materials.get(name)
    if not mat:
        raise SystemExit("lid material vanished: %s" % name)
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    print("KEEP    %-46s %s" % (name, [round(c, 4) for c in bsdf.inputs["Base Color"].default_value]))

# The .blend also holds a studio backdrop, four lights and a camera for the
# validation renders. The backdrop is literally named "... - not exported";
# a whole-scene export drags it in and the product viewer then shows a huge
# grey plane behind the bucket. Export the bucket meshes only.
bpy.ops.object.select_all(action="DESELECT")
exported = []
for obj in bpy.context.scene.objects:
    if obj.type != "MESH" or "not exported" in obj.name:
        continue
    obj.select_set(True)
    exported.append(obj.name)
print("EXPORTING %d meshes" % len(exported))
assert len(exported) == 22, "expected the 22 bucket meshes, got %d" % len(exported)

bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format="GLB",
    export_apply=True,
    export_yup=True,
    use_selection=True,
)
print("WROTE", OUT, os.path.getsize(OUT))
