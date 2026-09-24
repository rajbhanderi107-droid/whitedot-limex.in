"""Product 38: open thin-wall container reconstructed from the supplied photo.
All geometric dimensions are visualization assumptions, not measured part data.
Run: blender -b -t 4 --factory-startup --python this_file.py
"""
from pathlib import Path
import bpy, math
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'outputs/thin-wall-container-38'
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.unit_settings.system='METRIC'
mat=bpy.data.materials.new('Unbranded warm-white moulded polymer')
mat.diffuse_color=(.80,.79,.72,1)
mat.use_nodes=True
bs=mat.node_tree.nodes.get('Principled BSDF')
bs.inputs['Base Color'].default_value=mat.diffuse_color
bs.inputs['Roughness'].default_value=.31
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

# One continuous hollow shell, including the closed floor, inner wall and
# rolled snap rim. Open at the top; no lid, side ribs, labels or logos.
profile=[(0,1.0),(75,1.0),(78,.6),(80,.7),(81.6,1.4),(82.7,2.8),
 (83.4,4.5),(84.0,6.5),(96.8,59),(98.0,64.5),(98.3,65.7),
 (99.0,66.0),(100.2,66.4),(101.0,67.2),(101.25,68.2),
 (100.9,69.15),(100.1,69.7),(99.2,69.8),(98.45,69.35),
 (98.0,68.5),(97.9,67.0),(97.0,64),(95.7,59),(82.8,7.0),
 (82.1,5.4),(80.8,4.2),(79,3.45),(75,3.1),(0,3.1)]
lathe('Thin tapered container hollow shell and rolled lip',profile)

# Narrow reinforcing band immediately beneath the rolled lip.
lathe('Shallow circumferential rim skirt',[(96.9,58.5),(97.45,58.5),(99.1,65.8),(98.6,66.15),(96.9,58.5)])

# Sparse short moulded tabs visible below the rim. They do not extend down
# the main wall. Rounded ends keep the small details from looking like labels.
for j in range(6):
    a=math.tau*j/6+math.radians(12)
    bpy.ops.mesh.primitive_cube_add(location=(98.4*.001*math.cos(a),98.4*.001*math.sin(a),.0628),rotation=(0,0,a))
    o=bpy.context.object;o.name=f'Short rim tab {j+1}'
    o.scale=(.00115,.00072,.0037)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(mat)
    bevel=o.modifiers.new('Soft tab corners','BEVEL');bevel.width=.0005;bevel.segments=3
    parts.append(o)

root=bpy.data.objects.new('Product 38 unbranded thin wall container',None)
bpy.context.collection.objects.link(root)
root['geometry_basis']='Photo-based proportions; no measured dimensions supplied'
for o in parts:o.parent=root
bpy.ops.object.select_all(action='DESELECT')
for o in parts+[root]:o.select_set(True)
bpy.context.view_layer.objects.active=root
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/case-study/model/case-38-thin-wall-container.glb'),export_format='GLB',use_selection=True,export_apply=True)

scene.render.engine='BLENDER_EEVEE'
scene.render.threads_mode='FIXED';scene.render.threads=4
scene.render.resolution_x=1400;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.world=bpy.data.worlds.new('Neutral studio');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.06,.07,.08,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.35
scene.view_settings.view_transform='AgX'
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
bpy.ops.object.camera_add(location=(.12,-.40,.215));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=.245;aim(cam,(0,0,.035));scene.camera=cam
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'thin-wall-container-38.blend'))
scene.render.filepath=str(OUT/'thin-wall-container-38.png');bpy.ops.render.render(write_still=True)
cam.location=(.16,-.24,.39);aim(cam,(0,0,.025));scene.render.filepath=str(OUT/'thin-wall-container-38-interior.png');bpy.ops.render.render(write_still=True)
print('CONTAINER_38_COMPLETE')
