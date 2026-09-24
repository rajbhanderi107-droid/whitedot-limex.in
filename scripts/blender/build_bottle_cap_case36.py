"""Photo-based bottle cap visualization. Dimensions are inferred, not production CAD.
Run with Blender -b --factory-startup --python this_file.py.
"""
import bpy, math, os
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public/case-study/model'
PROOF = ROOT / 'outputs/bottle-cap-36'
OUT.mkdir(parents=True, exist_ok=True)
PROOF.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
mat = bpy.data.materials.new('Unbranded warm ivory moulded polymer')
mat.diffuse_color = (0.84, 0.825, 0.73, 1)
mat.use_nodes = True
bs = mat.node_tree.nodes.get('Principled BSDF')
bs.inputs['Base Color'].default_value = mat.diffuse_color
bs.inputs['Roughness'].default_value = 0.34
bs.inputs['IOR'].default_value = 1.47
bs.inputs['Coat Weight'].default_value = 0.06

parts=[]
def mesh_obj(name, verts, faces):
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata(verts,[],faces); mesh.update()
    obj=bpy.data.objects.new(name,mesh); bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    for p in mesh.polygons: p.use_smooth=True
    parts.append(obj)
    return obj

# Closed radial section: smooth exterior crown, fluted skirt, rolled mouth,
# recessed interior floor. Fine grip ribs are actual geometry, not a texture.
profile=[(0,0,0),(44,0,0),(47.8,0.1,0),(49,0.4,0),(49.65,1.1,0),
 (49.8,1.8,0),(49.8,2.25,0.2),(49.8,2.65,1),(49.8,16.4,1),
 (49.8,16.85,0.25),(49.7,17.2,0),(49.45,17.7,0),(48.9,18,0),
 (47.9,18.05,0),(47.2,17.8,0),(46.85,17.3,0),(46.7,16.5,0),
 (46.5,6.0,0),(46.2,4.5,0),(45.5,3.35,0),(44.5,2.9,0),
 (40,2.65,0),(10,2.65,0),(0,2.65,0)]
N=1536
verts=[]
for r,z,rib in profile:
    for j in range(N):
        a=math.tau*j/N
        # 128 rounded vertical ribs, with soft valleys and flat-ish crests.
        ridge=((1+math.cos(128*a))/2)**2
        rr=(r+0.60*rib*ridge)*.001
        verts.append((rr*math.cos(a),rr*math.sin(a),z*.001))
faces=[]
for i in range(len(profile)-1):
    for j in range(N):
        k=(j+1)%N
        faces.append((i*N+j,i*N+k,(i+1)*N+k,(i+1)*N+j))
shell=mesh_obj('Cap continuous crown rim and 128 fine grip ribs',verts,faces)

def lathe(name, prof, n=512):
    vs=[(r*.001*math.cos(math.tau*j/n),r*.001*math.sin(math.tau*j/n),z*.001) for r,z in prof for j in range(n)]
    fs=[(i*n+j,i*n+(j+1)%n,((i+1)%len(prof))*n+(j+1)%n,((i+1)%len(prof))*n+j) for i in range(len(prof)) for j in range(n)]
    return mesh_obj(name,vs,fs)

# Subtle concentric sealing bead visible around the recessed floor.
lathe('Interior annular sealing bead',[(43.7,2.7),(43.85,3.4),(44.15,3.8),(44.6,3.8),(44.95,3.4),(45,2.8)])
# Two shallow internal thread turns. Pitch inferred from the photograph.
vs=[];fs=[];steps=960;cross=10
for i in range(steps+1):
    t=i/steps; a=math.tau*2.05*t+.5
    fade=min(1,t*35,(1-t)*35)
    for k in range(cross):
        b=math.tau*k/cross
        r=(46.4-0.8*fade+0.9*fade*math.cos(b))*.001
        z=(6.6+7.2*t+0.52*fade*math.sin(b))*.001
        vs.append((r*math.cos(a),r*math.sin(a),z))
for i in range(steps):
    for k in range(cross): fs.append((i*cross+k,i*cross+(k+1)%cross,(i+1)*cross+(k+1)%cross,(i+1)*cross+k))
mesh_obj('Shallow internal helical closure ridge',vs,fs)
bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=16,location=(0,0,.00265))
gate=bpy.context.object;gate.name='Subtle central injection gate witness';gate.scale=(.0015,.0015,.00025)
gate.data.materials.append(mat);parts.append(gate)
for p in gate.data.polygons:p.use_smooth=True

# Stand on the rim, presenting the open interior like the supplied photograph.
root=bpy.data.objects.new('Bottle Cap 36 photo visualization',None)
bpy.context.collection.objects.link(root)
for obj in parts: obj.parent=root
root.rotation_euler=(math.radians(90),0,math.radians(-8))
root.location=(0,0,.0504)
# User-marked revision: deepen only the sidewall, retaining the crown thickness,
# diameter, rim section and central gate. Shift the mouth 6 mm farther out.
for obj in parts:
    if obj.type == 'MESH' and obj != gate:
        for v in obj.data.vertices:
            z = v.co.z
            v.co.z += .006 * max(0, min(1, (z - .0038) / (.0164 - .0038)))
bpy.context.view_layer.update()
bpy.ops.object.select_all(action='DESELECT')
for obj in parts+[root]:obj.select_set(True)
bpy.context.view_layer.objects.active=shell
bpy.ops.export_scene.gltf(filepath=str(OUT/'case-36-bottle-cap.glb'),export_format='GLB',use_selection=True,export_apply=True,export_yup=True)

scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=20
scene.render.threads_mode='FIXED';scene.render.threads=4
scene.cycles.use_denoising=True
scene.render.resolution_x=1200;scene.render.resolution_y=1200;scene.render.resolution_percentage=100
scene.world.color=(.22,.22,.22)
scene.view_settings.view_transform='AgX'
def area(name,loc,power,size):
    bpy.ops.object.light_add(type='AREA',location=loc)
    light=bpy.context.object;light.name=name;light.data.energy=power;light.data.shape='DISK';light.data.size=size
    light.rotation_euler=(Vector((0,0,.05))-light.location).to_track_quat('-Z','Y').to_euler()
area('Softbox left',(-.12,-.15,.23),6,.18)
area('Rim light',(.12,.03,.17),4,.12)
area('Front fill',(.06,-.20,.07),1,.16)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.0005))
floor=bpy.context.object;floor.name='Studio floor render only'
fm=bpy.data.materials.new('Charcoal studio');fm.diffuse_color=(.045,.05,.055,1);fm.use_nodes=True
fm.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=fm.diffuse_color
fm.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.82
floor.data.materials.append(fm)
bpy.ops.object.camera_add(location=(.145,-.265,.14))
cam=bpy.context.object;cam.rotation_euler=(Vector((0,-.007,.05))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.type='ORTHO';cam.data.ortho_scale=.132;scene.camera=cam
bpy.ops.wm.save_as_mainfile(filepath=str(PROOF/'bottle-cap-36.blend'))
scene.render.filepath=str(PROOF/'bottle-cap-36.png');bpy.ops.render.render(write_still=True)
cam.location=(-.12,.23,.14);cam.rotation_euler=(Vector((0,-.007,.05))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(PROOF/'bottle-cap-36-exterior.png');bpy.ops.render.render(write_still=True)
print('CAP_COMPLETE',OUT/'case-36-bottle-cap.glb')
