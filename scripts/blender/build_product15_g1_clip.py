import bpy
import math
import os
from mathutils import Vector

ROOT = r"C:\Users\rbhan\Documents\whitedot"
OUT_BLEND = os.path.join(ROOT, "public", "case-study", "model", "product-15-g1-clip.blend")
OUT_GLB = os.path.join(ROOT, "public", "case-study", "model", "product-15-g1-clip.glb")
OUT_PNG = os.path.join(ROOT, "public", "case-study", "model", "product-15-g1-clip-preview.png")

MM = 0.001
# The photographed FDM prototype reads substantially chunkier than the nominal
# metal analysis card; use its visible printed wall thickness for the match.
THICKNESS = 2.35 * MM
TOTAL_WIDTH = 19.0 * MM

bpy.ops.wm.read_factory_settings(use_empty=True)


def mat(name, rgba, metallic=0.0, roughness=0.42):
    m = bpy.data.materials.new(name)
    m.diffuse_color = rgba
    m.use_nodes = True
    p = m.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value = rgba
    p.inputs["Roughness"].default_value = roughness
    p.inputs["Metallic"].default_value = metallic
    return m


part_mat = mat("Warm ivory printed plastic", (0.72, 0.66, 0.57, 1), 0.0, 0.34)
part_bsdf = part_mat.node_tree.nodes.get("Principled BSDF")
if "IOR" in part_bsdf.inputs:
    part_bsdf.inputs["IOR"].default_value = 1.46
if "Subsurface Weight" in part_bsdf.inputs:
    part_bsdf.inputs["Subsurface Weight"].default_value = 0.075
if "Coat Weight" in part_bsdf.inputs:
    part_bsdf.inputs["Coat Weight"].default_value = 0.10
if "Coat Roughness" in part_bsdf.inputs:
    part_bsdf.inputs["Coat Roughness"].default_value = 0.24
dark_mat = mat("Display plinth", (0.016, 0.019, 0.022, 1), 0.08, 0.25)


def catmull(points, samples_per_span=16):
    pts = [Vector((x * MM, z * MM)) for x, z in points]
    out = []
    for i in range(len(pts) - 1):
        p0 = pts[max(0, i - 1)]
        p1 = pts[i]
        p2 = pts[i + 1]
        p3 = pts[min(len(pts) - 1, i + 2)]
        for j in range(samples_per_span):
            t = j / samples_per_span
            t2, t3 = t * t, t * t * t
            q = 0.5 * ((2 * p1) + (-p0 + p2) * t +
                       (2*p0 - 5*p1 + 4*p2 - p3) * t2 +
                       (-p0 + 3*p1 - 3*p2 + p3) * t3)
            out.append(q)
    out.append(pts[-1])
    return out


# Developed side profile reconstructed from the photo and supplied 90/120-degree bend cards.
# Short raised terminal curls avoid sharp tips and reproduce the prototype's hooked ends.
PATH = catmull([
    (0.0, 7.0), (1.2, 8.1), (3.6, 7.5),
    (13.0, 2.0), (17.0, 0.0), (20.0, 1.0),
    (28.5, 12.8), (31.5, 14.2), (34.5, 12.4),
    (44.5, 2.2), (48.5, 0.8), (50.0, 2.1),
], 16)


def nearest_index(x_mm):
    x = x_mm * MM
    return min(range(len(PATH)), key=lambda i: abs(PATH[i].x - x))


def ribbon(name, y0_mm, y1_mm, x0_mm, x1_mm):
    a, b = nearest_index(x0_mm), nearest_index(x1_mm)
    if a > b:
        a, b = b, a
    path = PATH[a:b+1]
    verts, faces = [], []
    y0, y1 = y0_mm * MM, y1_mm * MM
    for i, p in enumerate(path):
        prev = path[max(0, i-1)]
        nxt = path[min(len(path)-1, i+1)]
        tangent = (nxt - prev).normalized()
        normal = Vector((-tangent.y, tangent.x))
        lo = p - normal * (THICKNESS * 0.5)
        hi = p + normal * (THICKNESS * 0.5)
        verts += [(lo.x, y0, lo.y), (lo.x, y1, lo.y),
                  (hi.x, y0, hi.y), (hi.x, y1, hi.y)]
    for i in range(len(path)-1):
        n, q = i*4, (i+1)*4
        faces += [(n, q, q+1, n+1), (n+2, n+3, q+3, q+2),
                  (n, n+2, q+2, q), (n+1, q+1, q+3, n+3)]
    faces += [(0, 1, 3, 2)]
    e = (len(path)-1)*4
    faces += [(e, e+2, e+3, e+1)]
    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(part_mat)
    bevel = obj.modifiers.new("Edge softening R0.20mm", "BEVEL")
    bevel.width = 0.55 * MM
    bevel.segments = 5
    bevel.limit_method = 'NONE'
    return obj


# Full-width bridge and three separate prongs at either end. Slot width = 4 mm,
# slot centers = 8 mm; nominal prong bands are 3.5 / 4 / 3.5 mm.
ribbon("G1_Central_Bridge", -9.5, 9.5, 8.3, 41.7)
bands = [(-9.5, -6.0), (-2.0, 2.0), (6.0, 9.5)]
for side, xa, xb in (("Left", 0.0, 9.0), ("Right", 41.0, 50.0)):
    for idx, (y0, y1) in enumerate(bands, 1):
        ribbon(f"G1_{side}_Prong_{idx}", y0, y1, xa, xb)

# Presentation plinth (not exported).
bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=0.050, depth=0.003, location=(0.025, 0, -0.0032))
plinth = bpy.context.object
plinth.name = "Preview_Plinth_NOT_EXPORTED"
plinth.scale.y = 0.62
plinth.data.materials.append(dark_mat)
bevel = plinth.modifiers.new("Soft rim", "BEVEL")
bevel.width = 0.002
bevel.segments = 5

# Camera / studio lighting.
bpy.ops.object.camera_add(location=(0.105, -0.130, 0.085))
cam = bpy.context.object
cam.name = "Product15_Preview_Camera"
bpy.context.scene.camera = cam


def point_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat('-Z', 'Y').to_euler()


point_at(cam, (0.025, 0, 0.0065))
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 0.082

for name, loc, energy, size, color in [
    ("Key", (0.018, -0.045, 0.085), 1.6, 0.045, (1.0, 0.91, 0.78)),
    ("Fill", (0.075, 0.035, 0.050), 0.9, 0.035, (0.72, 0.84, 1.0)),
    ("Rim", (-0.025, 0.010, 0.060), 1.2, 0.030, (1.0, 0.72, 0.50)),
]:
    bpy.ops.object.light_add(type='AREA', location=loc)
    light = bpy.context.object
    light.name = name
    light.data.energy = energy
    light.data.shape = 'DISK'
    light.data.size = size
    light.data.color = color
    point_at(light, (0.025, 0, 0.008))

scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = 7680
scene.render.resolution_y = 4320
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = OUT_PNG
scene.render.film_transparent = False
scene.world = bpy.data.worlds.new("Product15 Studio World")
scene.world.color = (0.006, 0.008, 0.011)
scene.view_settings.look = 'AgX - Medium High Contrast'

os.makedirs(os.path.dirname(OUT_GLB), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)

# Export only product geometry + marking, excluding preview lights/plinth/camera.
bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.context.scene.objects:
    if obj.name.startswith("G1_"):
        obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT_GLB, export_format='GLB', use_selection=True,
                          export_apply=True, export_yup=True)
bpy.ops.render.render(write_still=True)
print("PRODUCT15_OUTPUT", OUT_BLEND, OUT_GLB, OUT_PNG, sep="\n")
