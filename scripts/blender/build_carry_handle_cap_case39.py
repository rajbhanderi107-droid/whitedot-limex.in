"""Product 39: orange jar cap and hinged carry handle reconstructed from the supplied photo.
All geometric dimensions are visualization assumptions, not measured part data.
Run: blender -b -t 4 --factory-startup --python this_file.py
"""
from pathlib import Path
import bpy, math
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'outputs/carry-handle-cap-39'
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.unit_settings.system='METRIC'
mat=bpy.data.materials.new('Orange moulded polymer')
mat.diffuse_color=(.82,.105,.002,1)
mat.use_nodes=True
bs=mat.node_tree.nodes.get('Principled BSDF')
bs.inputs['Base Color'].default_value=mat.diffuse_color
bs.inputs['Roughness'].default_value=.24
bs.inputs['IOR'].default_value=1.47
bs.inputs['Coat Weight'].default_value=.08
parts=[]
def lathe(name,profile,n=512):
    vs=[];rings=[];fs=[]
    for r,z in profile:
        if r==0:
            rings.append([len(vs)]);vs.append((0,0,z*.001))
        else:
            rings.append(list(range(len(vs),len(vs)+n)))
            for j in range(n):
                a=math.tau*j/n;vs.append((r*.001*math.cos(a),r*.001*math.sin(a),z*.001))
    for i in range(len(rings)-1):
        a,b=rings[i],rings[i+1]
        for j in range(n):
            k=(j+1)%n
            if len(a)==1: fs.append((a[0],b[k],b[j]))
            elif len(b)==1: fs.append((a[j],a[k],b[0]))
            else: fs.append((a[j],a[k],b[k],b[j]))
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(vs,[],fs);mesh.update()
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    for p in mesh.polygons:p.use_smooth=True
    parts.append(obj);return obj

# Closed upper disk, smooth skirt, hollow underside and inner sealing land.
lathe('Cap shell smooth skirt and raised top',[(0,19.1),(47.8,19.1),(48.4,18.9),(48.8,18.5),(49,17.8),(49,3.0),(49.5,1.2),(50.3,.5),(56.0,.5),(56.7,.9),(57,1.5),(57,18.3),(56.8,19.2),(56,19.8),(51.4,19.8),(51.0,20.4),(50.8,24.4),(50.4,25.1),(49.6,25.5),(0,25.5)])
lathe('Inner sealing ring',[(46.9,18.9),(46.9,13.8),(47.2,13.4),(47.6,13.8),(47.6,18.9),(46.9,18.9)])
lathe('Recessed concentric top detail',[(44,25.48),(44,25.8),(44.5,26),(45,25.8),(45,25.48),(44,25.48)])
# Subtle thread lands inside the skirt, no exterior ribs.
for z in [5.5,10.8]:
    lathe('Interior thread land',[(49.05,z),(48.2,z+.55),(48.15,z+1),(49.05,z+1.8),(49.05,z)])
# Hinged flat strap: rounded rectangular cross-section swept as a semicircle.
# The visible pose is raised, tilted back 15 degrees from vertical.
verts=[];faces=[];N=160;K=12;tilt=math.radians(15)
for i in range(N+1):
    a=math.pi*i/N
    for j in range(K):
        b=math.tau*j/K
        # superellipse makes a broad, flat moulded strap with rounded edges
        radial=2.8*math.copysign(abs(math.cos(b))**.45,math.cos(b))
        depth=1.75*math.copysign(abs(math.sin(b))**.45,math.sin(b))
        x=(53.0+radial)*math.cos(a);h=(53.0+radial)*math.sin(a)
        y=h*math.sin(tilt)+depth*math.cos(tilt)
        z=22.5+h*math.cos(tilt)-depth*math.sin(tilt)
        verts.append((x*.001,y*.001,z*.001))
for i in range(N):
    for j in range(K):faces.append((i*K+j,i*K+(j+1)%K,(i+1)*K+(j+1)%K,(i+1)*K+j))
faces.append(tuple(reversed(range(K))));faces.append(tuple(N*K+j for j in range(K)))
mesh=bpy.data.meshes.new('Carry handle rounded strap');mesh.from_pydata(verts,[],faces);mesh.update()
o=bpy.data.objects.new('Raised folding semicircular carry handle',mesh);bpy.context.collection.objects.link(o);o.data.materials.append(mat)
for p in mesh.polygons:p.use_smooth=True
parts.append(o)
for sign in [-1,1]:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=24,location=(sign*.0516,0,.0225))
    o=bpy.context.object;o.name='Moulded handle pivot';o.scale=(.0048,.0042,.0036);o.data.materials.append(mat);parts.append(o)
    for p in o.data.polygons:p.use_smooth=True
root=bpy.data.objects.new('Product 39 unbranded carry handle cap',None)
bpy.context.collection.objects.link(root)
root['geometry_basis']='Photo-based proportions; no measured dimensions supplied'
for o in parts:o.parent=root
bpy.ops.object.select_all(action='DESELECT')
for o in parts+[root]:o.select_set(True)
bpy.context.view_layer.objects.active=root
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/case-study/model/case-39-carry-handle-cap.glb'),export_format='GLB',use_selection=True,export_apply=True)

scene.render.engine='BLENDER_EEVEE'
scene.render.threads_mode='FIXED';scene.render.threads=4
scene.render.resolution_x=1400;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.world=bpy.data.worlds.new('Neutral studio');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.06,.07,.08,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.35
scene.view_settings.view_transform='Standard'
scene.view_settings.exposure=-1.7
def aim(o,target):o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
def area(name,loc,energy,size):
    bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=energy;o.data.shape='DISK';o.data.size=size;aim(o,(0,0,.03))
area('Large softbox',(-.2,-.25,.4),12,.3)
area('Right edge light',(.25,.12,.3),7,.22)
area('Front fill',(.06,-.35,.12),2,.25)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,0))
floor=bpy.context.object;fm=bpy.data.materials.new('Charcoal floor');fm.use_nodes=True
fm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.025,.032,.032,1)
fm.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.8
floor.data.materials.append(fm)
bpy.ops.object.camera_add(location=(.17,-.32,.205));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=.165;aim(cam,(0,0,.036));scene.camera=cam
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'carry-handle-cap-39.blend'))
scene.render.filepath=str(OUT/'carry-handle-cap-39.png');bpy.ops.render.render(write_still=True)
print('CAP_39_COMPLETE')
