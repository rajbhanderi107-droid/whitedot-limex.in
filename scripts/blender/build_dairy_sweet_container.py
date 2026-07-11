"""Photo-matched rectangular sweet container, Blender 5.1.

Blueprint-driven D-500 container model, refined against the supplied photos.
Primary envelope follows the supplied technical data sheet: 370 x 255 x 75 mm.
"""
import math, os
import bpy
from mathutils import Vector

MM = 0.001
REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(REPO, "public", "case-study", "model", "dairy-sweet-container-procedural.glb")
RENDER_DIR = os.path.join(REPO, "scripts", "blender", "renders")

W, D, H = 250.0, 150.0, 56.0
R = 5.0
WALL = 1.8
CAVITY_DEPTH = 50.0
CAVITY_FLOOR = 6.0
INTERNAL_BASE_L = 120.0
INTERNAL_BASE_W = 120.0
LID_OVERHANG = 10.0
LID_H = 7.0

def mat(name, color, rough=0.34):
    m = bpy.data.materials.new(name); m.diffuse_color = (*color, 1); m.use_nodes = True
    bs = m.node_tree.nodes.get("Principled BSDF")
    bs.inputs["Base Color"].default_value = (*color, 1)
    bs.inputs["Roughness"].default_value = rough
    if "Coat Weight" in bs.inputs: bs.inputs["Coat Weight"].default_value = 0.12
    return m

def rounded_box(name, size, loc, material, bevel=3.0):
    bpy.ops.mesh.primitive_cube_add(location=tuple(v*MM for v in loc))
    o = bpy.context.object; o.name = name; o.dimensions = tuple(v*MM for v in size)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    b = o.modifiers.new("molded rounded corners", "BEVEL"); b.width=bevel*MM; b.segments=6
    b.limit_method='ANGLE'
    bpy.context.view_layer.objects.active=o; bpy.ops.object.modifier_apply(modifier=b.name)
    o.data.materials.append(material)
    for p in o.data.polygons: p.use_smooth=True
    return o

def tapered_box(name, size, loc, material, bevel=3.0, bottom_scale=0.90):
    bpy.ops.mesh.primitive_cube_add(location=tuple(v*MM for v in loc))
    o = bpy.context.object; o.name = name; o.dimensions = tuple(v*MM for v in size)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    sx, sy = (bottom_scale, bottom_scale) if isinstance(bottom_scale, (int, float)) else bottom_scale
    for v in o.data.vertices:
        if v.co.z < 0:
            v.co.x *= sx; v.co.y *= sy
    b = o.modifiers.new("molded tapered rounded corners", "BEVEL"); b.width=bevel*MM; b.segments=8; b.limit_method='ANGLE'
    bpy.context.view_layer.objects.active=o; bpy.ops.object.modifier_apply(modifier=b.name)
    o.data.materials.append(material)
    for p in o.data.polygons: p.use_smooth=True
    return o

def torus_rect(name, size, z, material, thickness=2.0, bevel=2.0):
    # Four rounded bars make the rectangular sealing/recess geometry visible.
    w,d=size
    parts=[]
    parts.append(rounded_box(name+" front", (w, thickness, thickness), (0,-d/2,z), material, bevel))
    parts.append(rounded_box(name+" back", (w, thickness, thickness), (0,d/2,z), material, bevel))
    parts.append(rounded_box(name+" left", (thickness, d, thickness), (-w/2,0,z), material, bevel))
    parts.append(rounded_box(name+" right", (thickness, d, thickness), (w/2,0,z), material, bevel))
    return parts

def text_marking(text, loc, scale=1.0):
    bpy.ops.object.text_add(location=tuple(v*MM for v in loc), rotation=(0,0,0))
    o=bpy.context.object; o.name="subtle molded brand marking"; o.data.body=text; o.data.align_x='CENTER'; o.data.align_y='CENTER'
    o.data.size=6*scale*MM; o.data.extrude=0.30*MM; o.data.bevel_depth=0.08*MM; o.data.materials.append(mark_mat)
    try: o.visible_shadow = False
    except AttributeError: pass
    return o

bpy.ops.wm.read_factory_settings(use_empty=True)
body_mat = mat("neutral bright white food grade PP", (0.20, 0.20, 0.20), 0.44)
lid_mat = mat("neutral bright white PP lid", (0.30, 0.30, 0.30), 0.40)
mark_mat = mat("visible molded marking", (0.14, 0.13, 0.12), 0.50)
body=tapered_box("tapered rectangular container body", (W,D,H), (0,0,H/2), body_mat, R, 0.96)
# Dimensioned D-500 interior: 50 mm usable depth and a 120 x 120 mm base.
cavity=tapered_box("dimensioned interior cavity cutter", (W-WALL*2,D-WALL*2,CAVITY_DEPTH+2), (0,0,CAVITY_FLOOR+(CAVITY_DEPTH+2)/2), body_mat, 5, (INTERNAL_BASE_L/(W-WALL*2), INTERNAL_BASE_W/(D-WALL*2)))
boolean=body.modifiers.new("hollow food container cavity", "BOOLEAN"); boolean.operation='DIFFERENCE'; boolean.solver='EXACT'; boolean.object=cavity
bpy.context.view_layer.objects.active=body; bpy.ops.object.modifier_apply(modifier=boolean.name)
bpy.data.objects.remove(cavity, do_unlink=True)
# Photo-matched lid: a narrower snap skirt beneath a thin, flat outer plate.
lid=rounded_box("narrow snap fit lid skirt", (W+8,D+8,4.0), (0,0,H+2.0), lid_mat, 2.0)
rounded_box("thin flat outer lid plate", (W+LID_OVERHANG*2,D+LID_OVERHANG*2,2.0), (0,0,H+5.0), lid_mat, 2.2)
lid_top = H + 6.0
rounded_box("flat shallow recessed lid panel", (W-26,D-26,0.55), (0,0,lid_top-0.42), lid_mat, 4)
torus_rect("thin lid cavity perimeter rim", (W-22,D-22), lid_top+0.05, lid_mat, 0.55, 0.4)
# Two fine seam lines visible in the supplied front photo.
torus_rect("thin lower lid seam", (W+4,D+4), H+1.1, lid_mat, 0.65, 0.4)
torus_rect("thin body collar", (W-4,D-6), H-1.5, body_mat, 0.75, 0.45)
text_marking("HAVMOR PLAST PVT LTD.", (0,22,CAVITY_FLOOR+0.60), 0.82)
text_marking("D-500", (0,8,CAVITY_FLOOR+0.60), 0.82)
text_marking("REUSABLE", (0,-6,CAVITY_FLOOR+0.60), 0.82)
text_marking("FOOD SAFE   PP5   FREEZER SAFE", (0,-21,CAVITY_FLOOR+0.60), 0.62)
torus_rect("internal stiffening rib", (W-32,D-32), H+0.30, body_mat, 1.0, 0.7)
torus_rect("fine R3 edge rib", (W-18,D-18), H+0.65, body_mat, 0.8, 0.5)

# studio setup
scene=bpy.context.scene; scene.render.engine='BLENDER_EEVEE'; scene.render.resolution_x=3840; scene.render.resolution_y=2160; scene.render.resolution_percentage=100
scene.view_settings.view_transform='Standard'; scene.view_settings.look='Medium High Contrast'; scene.view_settings.exposure=-1.8
scene.world=bpy.data.worlds.new('soft studio'); scene.world.use_nodes=True; scene.world.node_tree.nodes['Background'].inputs[0].default_value=(0.018,0.016,0.014,1); scene.world.node_tree.nodes['Background'].inputs[1].default_value=0.08
def area(name, loc, energy, size):
    d=bpy.data.lights.new(name,'AREA'); d.energy=energy; d.shape='DISK'; d.size=size*MM
    o=bpy.data.objects.new(name,d); scene.collection.objects.link(o); o.location=tuple(v*MM for v in loc); o.rotation_euler=(Vector((0,0,25*MM))-o.location).to_track_quat('-Z','Y').to_euler()
area('large soft key',(-260,-300,330),28,260); area('fill',(280,-100,180),10,220); area('rim',(0,240,260),14,180); area('front soft fill',(0,-600,180),14,400)
bpy.ops.mesh.primitive_plane_add(size=2, location=(0,0,-2*MM)); ground=bpy.context.object; ground.data.materials.append(mat('black cloth',(.025,.022,.02),.55))
bpy.ops.object.camera_add(location=(0,-600*MM,95*MM)); cam=bpy.context.object; cam.data.lens=65; cam.rotation_euler=(Vector((0,0,34*MM))-cam.location).to_track_quat('-Z','Y').to_euler(); scene.camera=cam
os.makedirs(os.path.dirname(OUT),exist_ok=True)
os.makedirs(RENDER_DIR,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(RENDER_DIR,'dairy-sweet-container.blend'))
for o in bpy.context.scene.objects:
    o.select_set(o.type in {'MESH', 'FONT'} and o.name != 'Plane')
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_yup=True, export_apply=True, export_materials='EXPORT', use_selection=True)
scene.render.filepath=os.path.join(RENDER_DIR,'dairy-sweet-container-front.png'); bpy.ops.render.render(write_still=True)
cam.location=(0,600*MM,95*MM); cam.rotation_euler=(Vector((0,0,34*MM))-cam.location).to_track_quat('-Z','Y').to_euler(); scene.render.filepath=os.path.join(RENDER_DIR,'dairy-sweet-container-rear.png'); bpy.ops.render.render(write_still=True)
cam.location=(-600*MM,0,95*MM); cam.rotation_euler=(Vector((0,0,34*MM))-cam.location).to_track_quat('-Z','Y').to_euler(); scene.render.filepath=os.path.join(RENDER_DIR,'dairy-sweet-container-left.png'); bpy.ops.render.render(write_still=True)
cam.location=(600*MM,0,95*MM); cam.rotation_euler=(Vector((0,0,34*MM))-cam.location).to_track_quat('-Z','Y').to_euler(); scene.render.filepath=os.path.join(RENDER_DIR,'dairy-sweet-container-right.png'); bpy.ops.render.render(write_still=True)
# Open-state QA render: lift the lid assembly to expose the boolean-cut cavity.
raised=[]
for o in bpy.context.scene.objects:
    if o.type in {'MESH','FONT'} and o.location.z > H*MM:
        o.location.z += 28*MM; raised.append(o)
scene.view_settings.exposure=-2.0; cam.location=(0,-600*MM,95*MM); cam.rotation_euler=(Vector((0,0,34*MM))-cam.location).to_track_quat('-Z','Y').to_euler(); scene.render.filepath=os.path.join(RENDER_DIR,'dairy-sweet-container-open.png'); bpy.ops.render.render(write_still=True)
for o in raised: o.location.z -= 28*MM
for light_name in ('large soft key', 'fill', 'rim', 'front soft fill'):
    bpy.data.lights[light_name].energy = 0
area('top cavity inspection light',(0,0,420),80,400)
scene.view_settings.exposure=-5.0; cam.location=(0,-1*MM,600*MM); cam.rotation_euler=(Vector((0,0,32*MM))-cam.location).to_track_quat('-Z','Y').to_euler(); scene.render.filepath=os.path.join(RENDER_DIR,'dairy-sweet-container-top.png'); bpy.ops.render.render(write_still=True)
area('underside validation fill',(0,0,-220),12,180)
ground.hide_render=True
scene.view_settings.exposure=-3.5; cam.location=(0,1*MM,-560*MM); cam.rotation_euler=(Vector((0,0,18*MM))-cam.location).to_track_quat('-Z','Y').to_euler(); scene.render.filepath=os.path.join(RENDER_DIR,'dairy-sweet-container-underside.png'); bpy.ops.render.render(write_still=True)
print('WROTE', OUT)
