"""Photo-based visualization; proportions are not measured manufacturing dimensions."""
from pathlib import Path
import bpy, math
from mathutils import Vector, Matrix
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'outputs/toilet-brush-handle-40';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
mat=bpy.data.materials.new('Sky turquoise moulded polymer');mat.diffuse_color=(.035,.38,.36,1);mat.use_nodes=True
bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=mat.diffuse_color;bs.inputs['Roughness'].default_value=.29;bs.inputs['IOR'].default_value=1.47;bs.inputs['Coat Weight'].default_value=.1
parts=[]
def interp(y,pts):
 for i in range(len(pts)-1):
  a,b=pts[i],pts[i+1]
  if y<=b[0]:
   t=max(0,min(1,(y-a[0])/(b[0]-a[0])));t=t*t*(3-2*t)
   return a[1]*(1-t)+b[1]*t
 return pts[-1][1]
def width(y):
 w=interp(y,[(0,26),(6,28),(35,27),(90,25),(122,24),(138,19),(180,18),(260,15),(320,12),(331,12),(389,11),(393,10),(399,4),(400,0.4)])
 if 333<y<388:w+=.65*math.sin(math.tau*(y-333)/12)
 return w
def center(y):return interp(y,[(0,15),(22,6),(80,0),(150,0),(250,2),(320,6),(370,12),(400,16)])
def depth(y):return interp(y,[(0,8),(20,6),(100,5),(145,4.4),(325,4.8),(390,5.4),(400,3)])
N=400;K=24;vs=[];fs=[]
for i in range(N+1):
 y=float(i)
 for j in range(K):
  a=math.tau*j/K
  x=width(y)*math.copysign(abs(math.cos(a))**.30,math.cos(a))
  z=center(y)+depth(y)*math.copysign(abs(math.sin(a))**.30,math.sin(a))
  vs.append((x*.001,y*.001,z*.001))
for i in range(N):
 for j in range(K):fs.append((i*K+j,i*K+(j+1)%K,(i+1)*K+(j+1)%K,(i+1)*K+j))
fs.append(tuple(reversed(range(K))));fs.append(tuple(N*K+j for j in range(K)))
mesh=bpy.data.meshes.new('Curved tapered handle shell');mesh.from_pydata(vs,[],[tuple(reversed(f)) for f in fs]);mesh.update()
body=bpy.data.objects.new('Continuous curved toilet brush handle',mesh);bpy.context.collection.objects.link(body);body.data.materials.append(mat);parts.append(body)
for f in mesh.polygons:f.use_smooth=True

def rounded_box(name,loc,scale,r):
 bpy.ops.mesh.primitive_cube_add(size=1,location=tuple(v*.001 for v in loc));o=bpy.context.object;o.name=name;o.dimensions=tuple(v*.001 for v in scale)
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 b=o.modifiers.new('Rounded corners','BEVEL');b.width=r*.001;b.segments=5
 bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=b.name)
 return o

def cut(cutter):
 bpy.context.view_layer.objects.active=body
 m=body.modifiers.new('Moulded cavity','BOOLEAN');m.operation='DIFFERENCE';m.solver='EXACT';m.object=cutter
 bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(cutter,do_unlink=True)
# Deep, rounded oblong socket at the broad end, open through the curled end.
sv=[];sf=[];sn=38;sk=24
for i in range(sn+1):
 y=-2+30*i/sn;yy=max(0,y)
 for j in range(sk):
  a=math.tau*j/sk;x=(width(yy)-3.2)*math.copysign(abs(math.cos(a))**.30,math.cos(a));z=center(yy)+(depth(yy)-2.5)*math.copysign(abs(math.sin(a))**.30,math.sin(a))
  sv.append((x*.001,y*.001,z*.001))
for i in range(sn):
 for j in range(sk):sf.append((i*sk+j,i*sk+(j+1)%sk,(i+1)*sk+(j+1)%sk,(i+1)*sk+j))
sf.append(tuple(reversed(range(sk))));sf.append(tuple(sn*sk+j for j in range(sk)))
m=bpy.data.meshes.new('Curved socket cavity');m.from_pydata(sv,[],[tuple(reversed(f)) for f in sf]);m.update();o=bpy.data.objects.new('Curved socket cavity',m);bpy.context.collection.objects.link(o);cut(o)
# Two recessed panels visible on the flat front of the reference.
cut(rounded_box('Large recessed head panel',(0,84,7.9),(38,66,10),5))
cut(rounded_box('Small recessed panel',(0,140,7.7),(27,29,9),3.4))
# Reverse-side reinforcement channel follows the centerline and leaves edge rails.
cv=[];cf=[];nk=16;ny=150
for i in range(ny+1):
 y=164+160*i/ny
 taper=min(1,.15+i/7,.15+(ny-i)/7)
 for j in range(nk):
  a=math.tau*j/nk
  x=(width(y)-3.6)*taper*math.copysign(abs(math.cos(a))**.35,math.cos(a))
  z=center(y)-depth(y)-3+6*math.copysign(abs(math.sin(a))**.35,math.sin(a))
  cv.append((x*.001,y*.001,z*.001))
for i in range(ny):
 for j in range(nk):cf.append((i*nk+j,i*nk+(j+1)%nk,(i+1)*nk+(j+1)%nk,(i+1)*nk+j))
cf.append(tuple(reversed(range(nk))));cf.append(tuple(ny*nk+j for j in range(nk)))
m=bpy.data.meshes.new('Reverse channel cutter');m.from_pydata(cv,[],[tuple(reversed(f)) for f in cf]);m.update();o=bpy.data.objects.new('Reverse channel cutter',m);bpy.context.collection.objects.link(o);cut(o)
# Hanging eye at narrow grip end, through the shell.
cut(rounded_box('Hanging eye',(0,391,center(391)),(13,13,40),5))
# Inset elongated thumb pad and sparse circular mould impressions.
pad=rounded_box('Raised thumb grip',(0,357,center(357)+depth(357)+.55),(15,53,2.4),5)
pad.data.materials.append(mat);parts.append(pad)
for y in [37,169,333]:
 bpy.ops.mesh.primitive_torus_add(major_radius=.0034,minor_radius=.00023,major_segments=48,minor_segments=8,location=(0,y*.001,(center(y)+depth(y)-.08)*.001))
 o=bpy.context.object;o.name='Subtle moulded circular impression';o.data.materials.append(mat);parts.append(o)
# Recalculate outward normals after boolean operations.
for o in parts:
 bpy.context.view_layer.objects.active=o;o.select_set(True)
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT');o.select_set(False)
# Export Y-up directly: local mesh is long in Y with front facing +Z.
bpy.ops.object.select_all(action='DESELECT')
for o in parts:o.select_set(True)
bpy.context.view_layer.objects.active=body
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/case-study/model/case-40-toilet-brush-handle.glb'),export_format='GLB',use_selection=True,export_apply=True,export_yup=False)
scene.render.engine='BLENDER_EEVEE';scene.render.threads_mode='FIXED';scene.render.threads=4
scene.render.resolution_x=1000;scene.render.resolution_y=1500;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG'
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.045,.052,.06,1);scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.4
scene.view_settings.view_transform='Standard'
scene.view_settings.exposure=-1.5
def aim(o,target):
 d=(Vector(target)-o.location).normalized();right=d.cross(Vector((0,1,0))).normalized();up=right.cross(d).normalized();o.rotation_euler=Matrix((right,up,-d)).transposed().to_euler()
def light(loc,power,size):
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=size;aim(o,(0,.2,0))
light((-.2,.3,.45),6,.4);light((.22,.0,.3),3,.3);light((.05,.5,-.1),2,.2)
bpy.ops.object.camera_add(location=(.17,.18,.8));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=.455;aim(cam,(0,.2,.005));scene.camera=cam
scene.render.film_transparent=False
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'toilet-brush-handle-40.blend'))
scene.render.filepath=str(OUT/'toilet-brush-handle-40-front.png');bpy.ops.render.render(write_still=True)
cam.location=(.22,.15,-.8);aim(cam,(0,.2,.005));scene.render.filepath=str(OUT/'toilet-brush-handle-40-back.png');bpy.ops.render.render(write_still=True)
print('HANDLE_40_COMPLETE')
