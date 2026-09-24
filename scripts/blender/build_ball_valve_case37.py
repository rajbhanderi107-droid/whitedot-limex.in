"""Build an unbranded photo-matched white vertical ball valve visualization.

The supplied photograph controls the exterior silhouette, ribs and side actuator.
Unseen sockets and internal parts are simplified illustrative geometry. All scale, hidden internals and dimensions are visual assumptions, not production specifications.

Blender 5.1 headless usage:
  blender -b --factory-startup --python scripts/blender/build_ball_valve_case37.py
"""

import math
import os

import bpy
from mathutils import Vector


MM = 0.001
SEGMENTS = 192
RENDER_SIZE = int(os.environ.get("PVC_VALVE_RENDER_SIZE", "1200"))
REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT_DIR = os.path.join(REPO, "outputs", "ball-valve-37")
os.makedirs(OUT_DIR, exist_ok=True)
BLEND_PATH = os.path.join(OUT_DIR, "unbranded-white-pvc-ball-valve-photo-match.blend")
GLB_PATH = os.path.join(REPO, "public", "case-study", "model", "case-37-ball-valve.glb")
HERO_PATH = os.path.join(OUT_DIR, "unbranded-white-pvc-ball-valve-hero.png")
BORE_PATH = os.path.join(OUT_DIR, "unbranded-white-pvc-ball-valve-bore.png")


def make_material(name, color, roughness, coat=0.0, micro=0.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["IOR"].default_value = 1.48
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.32
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = coat
        bsdf.inputs["Coat Roughness"].default_value = 0.22
    if micro:
        noise = nodes.new("ShaderNodeTexNoise")
        noise.name = "fine molded PVC grain"
        noise.inputs["Scale"].default_value = 920.0
        noise.inputs["Detail"].default_value = 2.2
        noise.inputs["Roughness"].default_value = 0.58
        bump = nodes.new("ShaderNodeBump")
        bump.name = "restrained molding microtexture"
        bump.inputs["Strength"].default_value = micro
        bump.inputs["Distance"].default_value = 0.000006
        links.new(noise.outputs["Fac"], bump.inputs["Height"])
        links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


def lathe(name, profile, mat, bevel_mm=0.16, segments=SEGMENTS):
    verts = []
    for radius, z in profile:
        for i in range(segments):
            a = math.tau * i / segments
            verts.append((radius * math.cos(a) * MM,
                          radius * math.sin(a) * MM,
                          z * MM))
    faces = []
    rings = len(profile)
    for ring in range(rings):
        nxt = (ring + 1) % rings
        for i in range(segments):
            ni = (i + 1) % segments
            faces.append((ring * segments + i, ring * segments + ni,
                          nxt * segments + ni, nxt * segments + i))
    mesh = bpy.data.meshes.new(name + " mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    if bevel_mm:
        mod = obj.modifiers.new("molded edge softening", "BEVEL")
        mod.width = bevel_mm * MM
        mod.segments = 3
        mod.limit_method = 'ANGLE'
    return obj


def cylinder(name, radius_mm, depth_mm, xyz_mm, mat, rotation=(0, 0, 0),
             vertices=128, bevel_mm=0.18):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,
                                       radius=radius_mm * MM,
                                       depth=depth_mm * MM,
                                       location=tuple(v * MM for v in xyz_mm),
                                       rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    if bevel_mm:
        mod = obj.modifiers.new("rounded molded edge", "BEVEL")
        mod.width = bevel_mm * MM
        mod.segments = 3
        mod.limit_method = 'ANGLE'
    return obj


def torus(name, major_mm, minor_mm, z_mm, mat, major_segments=SEGMENTS):
    bpy.ops.mesh.primitive_torus_add(major_segments=major_segments,
                                    minor_segments=16,
                                    major_radius=major_mm * MM,
                                    minor_radius=minor_mm * MM,
                                    location=(0, 0, z_mm * MM))
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj


def helical_thread(name, radius_mm, start_z_mm, end_z_mm, turns, mat,
                   tube_mm=0.48, points_per_turn=56):
    """Create a true continuous internal thread instead of stacked rings."""
    count = int(turns * points_per_turn) + 1
    curve_data = bpy.data.curves.new(name + " curve", type='CURVE')
    curve_data.dimensions = '3D'
    curve_data.resolution_u = 1
    curve_data.bevel_depth = tube_mm * MM
    curve_data.bevel_resolution = 2
    spline = curve_data.splines.new('POLY')
    spline.points.add(count - 1)
    for i in range(count):
        t = i / (count - 1)
        angle = math.tau * turns * t
        z = start_z_mm + (end_z_mm - start_z_mm) * t
        spline.points[i].co = (radius_mm * math.cos(angle) * MM,
                               radius_mm * math.sin(angle) * MM,
                               z * MM, 1.0)
    obj = bpy.data.objects.new(name, curve_data)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.convert(target='MESH')
    return bpy.context.object


def rib(name, angle, z_mm, height_mm, mat, radius=43.0):
    """Broad vertical external rib matching the photographed molded fins."""
    bpy.ops.mesh.primitive_cube_add(location=(radius * math.cos(angle) * MM,
                                             radius * math.sin(angle) * MM,
                                             z_mm * MM),
                                    rotation=(0, 0, angle))
    obj = bpy.context.object
    obj.name = name
    obj.scale = (1.15 * MM, 4.6 * MM, height_mm * 0.5 * MM)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    mod = obj.modifiers.new("rib edge radius", "BEVEL")
    mod.width = 1.0 * MM
    mod.segments = 4
    return obj


def bevelled_box(name, xyz_mm, dims_mm, mat, bevel_mm=1.5):
    bpy.ops.mesh.primitive_cube_add(location=tuple(v * MM for v in xyz_mm))
    obj = bpy.context.object
    obj.name = name
    obj.scale = tuple(v * 0.5 * MM for v in dims_mm)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    mod = obj.modifiers.new("soft actuator corners", "BEVEL")
    mod.width = bevel_mm * MM
    mod.segments = 3
    return obj


def aim(obj, target_mm):
    target = Vector(tuple(v * MM for v in target_mm))
    obj.rotation_euler = (target - obj.location).to_track_quat('-Z', 'Y').to_euler()


def area(name, xyz_mm, energy, size_mm, target=(0, 0, 82), color=(1, 1, 1)):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy = energy
    data.shape = 'DISK'
    data.size = size_mm * MM
    data.color = color
    obj = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = tuple(v * MM for v in xyz_mm)
    aim(obj, target)
    return obj


bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.length_unit = 'MILLIMETERS'

white_pvc = make_material("warm off-white rigid PVC housing",
                          (0.78, 0.755, 0.68), 0.34, coat=0.11, micro=0.055)
white_edge = make_material("soft white PVC edge highlights",
                           (0.82, 0.795, 0.72), 0.31, coat=0.10, micro=0.032)
black_liner = make_material("black ribbed internal liner",
                            (0.004, 0.0045, 0.005), 0.48, coat=0.035, micro=0.048)
black_ball = make_material("black internal ball dome",
                           (0.003, 0.0035, 0.004), 0.31, coat=0.14, micro=0.035)
black_actuator = make_material("black square actuator plastic",
                               (0.001, 0.0012, 0.0014), 0.66, coat=0.008, micro=0.065)
for dark_material in (black_liner, black_ball, black_actuator):
    dark_bsdf = dark_material.node_tree.nodes.get("Principled BSDF")
    if "Specular IOR Level" in dark_bsdf.inputs:
        dark_bsdf.inputs["Specular IOR Level"].default_value = 0.14
black_actuator.node_tree.nodes.get("Principled BSDF").inputs["Specular IOR Level"].default_value = 0.06

# Visualization proportions reconstructed from the single supplied photo.
# No measured engineering dimensions have been supplied.
housing_profile = [
    (40, 0), (40, 46), (41, 51), (44, 57), (47, 65),
    (48, 72), (48, 85), (47, 92), (45, 99), (43, 108),
    (43, 165), (37.5, 165), (37.5, 110), (38, 100),
    (40, 88), (40, 72), (37, 60), (34.5, 50), (34.5, 0),
]
housing = lathe("Unbranded smooth valve housing", housing_profile, white_pvc, bevel_mm=0.35)
housing["reference_authority"] = "supplied photo; unmeasured visualization"
housing["branding"] = "none"

# The photographed joint has two restrained concentric molding/seam bands.
torus("upper central molding seam", 47.7, 0.65, 85.5, white_edge)
torus("lower central molding seam", 48.0, 0.55, 74.5, white_edge)

# User correction: smooth socket exteriors, with no raised vertical ribs.

# Slightly rounded end lips frame the open black insert.
torus("upper white socket lip", 40.2, 2.45, 164.0, white_edge)
torus("lower white socket lip", 37.2, 2.35, 1.0, white_edge)

# Black internal liner and repeated circular thread ribs. These are deliberately
# recessed so the white PVC lip remains the exterior silhouette.
upper_liner_profile = [
    (37.4, 111.0), (37.4, 157.0), (34.5, 157.0), (34.5, 116.0),
]
lower_liner_profile = [
    (34.4, 7.0), (34.4, 52.0), (32.0, 48.0), (32.0, 7.0),
]
lathe("black upper internal threaded liner", upper_liner_profile, black_liner, 0.08, 160)
lathe("black lower internal threaded liner", lower_liner_profile, black_liner, 0.08, 160)
helical_thread("continuous upper internal PVC thread", 34.2, 118.0, 156.0,
               11.5, black_liner, tube_mm=0.60)
helical_thread("continuous lower internal PVC thread", 31.7, 8.0, 48.0,
               11.0, black_liner, tube_mm=0.58)

# Simplified inferred internal ball for the rotatable visualization.
# No sectional drawing or measured internal geometry was supplied.
bpy.ops.mesh.primitive_uv_sphere_add(segments=128, ring_count=64,
                                    radius=36.0 * MM,
                                    location=(0, 0, 90.0 * MM))
ball = bpy.context.object
ball.name = "black internal spherical valve element"
ball.data.materials.append(black_ball)
for poly in ball.data.polygons:
    poly.use_smooth = True
torus("upper black valve seat ring", 34.0, 1.15, 111.0, black_liner, 128)
torus("lower black valve seat ring", 32.0, 1.10, 53.0, black_liner, 128)

# Side port on +X: white circular boss/collar and short black square actuator.
cylinder("white side port base flange", 22.0, 10.0, (49.5, 0, 82),
         white_pvc, rotation=(0, math.pi / 2, 0), bevel_mm=0.45)
cylinder("white side port retaining collar", 17.2, 14.0, (58, 0, 82),
         white_edge, rotation=(0, math.pi / 2, 0), bevel_mm=0.55)
cylinder("black actuator round root", 13.6, 12.0, (66, 0, 82),
         black_actuator, rotation=(0, math.pi / 2, 0), bevel_mm=0.35)
actuator = bevelled_box("short black square side actuator", (80, 0, 82),
                       (24.0, 23.5, 23.5), black_actuator, bevel_mm=2.2)
actuator["function"] = "side operating interface"
cylinder("actuator central fastener recess", 2.8, 0.8, (92.15, 0, 82),
         black_liner, rotation=(0, math.pi / 2, 0), vertices=48, bevel_mm=0.10)

# Small molded witness on the front seam, visible in the real side photograph.
cylinder("central seam molding witness", 2.15, 1.25, (0, -48.1, 80),
         white_edge, rotation=(math.pi / 2, 0, 0), vertices=48, bevel_mm=0.22)

# Clean export hierarchy. No text, logo, marking, label or tag object is made.
product_objects = [obj for obj in scene.objects if obj.type == 'MESH']
root = bpy.data.objects.new("Plain White PVC Ball Valve Assembly", None)
scene.collection.objects.link(root)
root["product"] = "white PVC vertical plastic ball valve"
root["branding"] = "none"
root["visible_materials"] = "warm-white PVC and black polymer"
for obj in product_objects:
    obj.parent = root
root.rotation_euler.z = math.pi

# Dark neutral studio emphasizes the off-white PVC contour and the deep bore.
bpy.ops.mesh.primitive_plane_add(size=1.1, location=(0, 0, -0.004))
floor = bpy.context.object
floor.name = "studio floor - not exported"
floor.data.materials.append(make_material("slate studio floor", (0.018, 0.022, 0.030), 0.29, micro=0.015))

world = bpy.data.worlds.new("neutral valve studio")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.015, 0.019, 0.027, 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.10
scene.world = world
area("left softbox", (-250, -280, 280), 6, 190, color=(1.0, 0.93, 0.86))
area("right rim light", (220, -100, 220), 5, 150, color=(0.86, 0.93, 1.0))
area("top bore light", (-40, 60, 350), 5, 130, target=(0, 0, 105))
area("focused bore reveal", (-18, -12, 220), 4, 24, target=(0, 0, 94))
area("front fill", (0, -330, 100), 2.5, 150, color=(1.0, 0.88, 0.80))

camera_data = bpy.data.cameras.new("product camera")
camera = bpy.data.objects.new("product camera", camera_data)
scene.collection.objects.link(camera)
scene.camera = camera
camera.data.sensor_width = 36

scene.render.engine = 'BLENDER_EEVEE'
scene.render.threads_mode = 'FIXED'
scene.render.threads = 4
scene.render.resolution_x = RENDER_SIZE
scene.render.resolution_y = RENDER_SIZE
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.color_depth = '8'
scene.render.film_transparent = False
scene.view_settings.look = 'AgX - Medium High Contrast'
scene.view_settings.exposure = 0.0

# Hero: side actuator and rib layout are both clearly readable.
camera.location = (-80 * MM, -420 * MM, 195 * MM)
camera.data.lens = 62
aim(camera, (5, 0, 84))
scene.render.filepath = HERO_PATH
bpy.ops.render.render(write_still=True)

# Elevated close view verifies the white lip, black thread liner and ball dome.
camera.location = (88 * MM, -108 * MM, 365 * MM)
camera.data.lens = 72
aim(camera, (0, 0, 104))
scene.render.filepath = BORE_PATH
bpy.ops.render.render(write_still=True)

# Restore hero and save editable production source.
camera.location = (-80 * MM, -420 * MM, 195 * MM)
camera.data.lens = 62
aim(camera, (5, 0, 84))
bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)

# Product-only GLB export.
bpy.ops.object.select_all(action='DESELECT')
root.select_set(True)
for obj in root.children_recursive:
    if obj.type == 'MESH':
        obj.select_set(True)
bpy.context.view_layer.objects.active = root
bpy.ops.export_scene.gltf(filepath=GLB_PATH,
                          export_format='GLB',
                          use_selection=True,
                          export_apply=True,
                          export_yup=True,
                          export_materials='EXPORT')

print("PVC_VALVE_BUILD_COMPLETE")
print(BLEND_PATH)
print(GLB_PATH)
print(HERO_PATH)
print(BORE_PATH)
