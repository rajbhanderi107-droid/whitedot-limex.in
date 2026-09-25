"""Photo-based visualization; proportions are not measured manufacturing dimensions."""
from pathlib import Path
import bpy, math
from mathutils import Vector, Matrix
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'outputs/toilet-brush-handle-40';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
mat=bpy.data.materials.new('Sky turquoise moulded polymer');mat.diffuse_color=(.10,.52,.48,1);mat.use_nodes=True
bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=mat.diffuse_color;bs.inputs['Roughness'].default_value=.34;bs.inputs['IOR'].default_value=1.47;bs.inputs['Coat Weight'].default_value=.1
parts=[]
def interp(y,pts):
 slopes=[(pts[i+1][1]-pts[i][1])/(pts[i+1][0]-pts[i][0]) for i in range(len(pts)-1)]
 def tangent(i):
  if i==0:return slopes[0]
  if i==len(pts)-1:return slopes[-1]
  a,b=slopes[i-1],slopes[i]
  return 0 if a*b<=0 else 2*a*b/(a+b)
 for i in range(len(pts)-1):
  a,b=pts[i],pts[i+1]
  if y<=b[0]:
   h=b[0]-a[0];t=max(0,min(1,(y-a[0])/h))
   return (2*t**3-3*t*t+1)*a[1]+(t**3-2*t*t+t)*h*tangent(i)+(-2*t**3+3*t*t)*b[1]+(t**3-t*t)*h*tangent(i+1)
 return pts[-1][1]
def width(y):
 if y>=388:
  return max(.12,12.0*math.sqrt(max(0,1-((y-388)/12)**2)))
 # The supplied part is approximately 30 mm across at the brush socket.
 # Width values are half-widths, so the lower housing stays near 15 mm
 # either side of centre before blending into the narrower shaft.
 w=interp(y,[(0,15),(5,15),(20,15),(65,15),(108,15),(124,15.2),(138,15.5),(153,16.2),(225,16.5),(292,15.2),(324,13.8),(334,13),(388,12)])
 if 336<y<384:w+=.38*math.sin(math.tau*(y-336)/11)
 return w

def center(y):return interp(y,[(0,12),(12,10),(42,3),(90,-1),(150,0),(245,7),(310,5),(365,-3),(400,-10)])
def depth(y):return interp(y,[(0,9),(6,10),(25,10),(68,8),(115,6),(139,5.1),(325,4.7),(388,5),(400,2.5)])
def front(y):return center(y)+depth(y)
N=600;K=52;vs=[];fs=[]
for i in range(N+1):
 y=400.0*i/N;w=width(y);d=depth(y);r=min(1.5,w*.3,d*.4)
 for corner in range(4):
  cx=(w-r)*(1 if corner in [0,3] else -1);cz=(d-r)*(1 if corner in [0,1] else -1)
  for j in range(13):
   a=corner*math.pi/2+j*math.pi/24
   vs.append(((cx+r*math.cos(a))*.001,y*.001,(center(y)+cz+r*math.sin(a))*.001))
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
def swept_cutter(name,y0,y1,halfwidth,zfunc,halfheight,corner=3.5,steps=160):
 vv=[];ff=[];k=32
 for i in range(steps+1):
  y=y0+(y1-y0)*i/steps;e=min(y-y0,y1-y);r=min(corner,(y1-y0)/2)
  edge=r-math.sqrt(max(0,r*r-(r-min(e,r))**2))
  w=(halfwidth(y) if callable(halfwidth) else halfwidth)-edge
  for j in range(k):
   a=math.tau*j/k;x=w*math.copysign(abs(math.cos(a))**.25,math.cos(a));z=zfunc(y)+(halfheight(y) if callable(halfheight) else halfheight)*math.copysign(abs(math.sin(a))**.25,math.sin(a))
   vv.append((x*.001,y*.001,z*.001))
 for i in range(steps):
  for j in range(k):ff.append((i*k+j,i*k+(j+1)%k,(i+1)*k+(j+1)%k,(i+1)*k+j))
 ff.append(tuple(reversed(range(k))));ff.append(tuple(steps*k+j for j in range(k)))
 m=bpy.data.meshes.new(name);m.from_pydata(vv,[],[tuple(reversed(f)) for f in ff]);m.update();o=bpy.data.objects.new(name,m);bpy.context.collection.objects.link(o);return o
# The side reference shows a long narrow opening beneath the curved nose lip.
cut(swept_cutter('Long open head socket',5,56,40,lambda y:front(y)-6.3,lambda y:max(.08,3.8*math.sqrt(max(0,1-((4-min(4,y-5,56-y))/4)**2))),3.6))
cut(swept_cutter('Large front recessed panel',65,133,11.7,lambda y:front(y)+3,6,3.2))
cut(swept_cutter('Small front recessed panel',139,170,10.8,lambda y:front(y)+3.2,6,2.8))
cut(swept_cutter('Rounded reverse reinforcement channel',183,317,lambda y:width(y)-3.1,lambda y:center(y)-depth(y)-3,6.7,3.8))
cut(swept_cutter('Reverse small rectangular pocket',147,176,12.8,lambda y:center(y)-depth(y)-3,5.0,2.2))
# Smaller horizontal oval eye with a rounded crown.
cut(rounded_box('Oval hanging eye',(0,394,center(394)),(13.5,6.4,38),2.9))
# Thumb grip is blended along the bowed face with a rounded lower end.
vv=[];ff=[];steps=150;k=32
for i in range(steps+1):
 y=323.6+(391-323.6)*i/steps
 if y<333:w=max(.12,math.sqrt(max(0,9.4**2-(y-333)**2)))
 elif y>388:w=6.4+math.sqrt(max(0,3**2-(y-388)**2))
 else:w=9.4
 for j in range(k):
  a=math.tau*j/k;x=w*math.copysign(abs(math.cos(a))**.25,math.cos(a));z=front(y)+.10+.85*math.copysign(abs(math.sin(a))**.25,math.sin(a))
  vv.append((x*.001,y*.001,z*.001))
for i in range(steps):
 for j in range(k):ff.append((i*k+j,i*k+(j+1)%k,(i+1)*k+(j+1)%k,(i+1)*k+j))
ff.append(tuple(reversed(range(k))));ff.append(tuple(steps*k+j for j in range(k)))
m=bpy.data.meshes.new('Conforming rounded thumb grip');m.from_pydata(vv,[],[tuple(reversed(f)) for f in ff]);m.update();o=bpy.data.objects.new('Conforming rounded thumb grip',m);bpy.context.collection.objects.link(o);o.data.materials.append(mat)
for f in m.polygons:f.use_smooth=True
parts.append(o)
# Preserve the shallow blank moulded plaque without the company lettering.
pad=swept_cutter('Blank moulded plaque',91,111,9.0,lambda y:front(y)-2.6,.55,1.8,60);pad.data.materials.append(mat);parts.append(pad)
for y in [40,180,334]:
 bpy.ops.mesh.primitive_torus_add(major_radius=.0035,minor_radius=.00016,major_segments=64,minor_segments=10,location=(0,y*.001,(front(y)-.04)*.001))
 o=bpy.context.object;o.name='Subtle moulded circular impression';o.rotation_euler.x=math.atan((front(y+.1)-front(y-.1))/.2);o.data.materials.append(mat);parts.append(o)
# Recalculate outward normals after boolean operations.
for o in parts:
 bpy.context.view_layer.objects.active=o;o.select_set(True)
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT');o.select_set(False)
for f in body.data.polygons:f.use_smooth=True
body.data.set_sharp_from_angle(angle=.55)
bpy.context.view_layer.objects.active=body
bev=body.modifiers.new('Soft moulded cavity edges','BEVEL');bev.width=.00035;bev.segments=3;bev.limit_method='ANGLE';bev.angle_limit=.55
wn=body.modifiers.new('Balanced surface normals','WEIGHTED_NORMAL');wn.keep_sharp=True;wn.weight=30
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
bpy.ops.object.camera_add(location=(.035,.18,.85));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=.455;aim(cam,(0,.2,.005));scene.camera=cam
scene.render.film_transparent=False
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'toilet-brush-handle-40.blend'))
scene.render.filepath=str(OUT/'toilet-brush-handle-40-front.png');bpy.ops.render.render(write_still=True)
cam.location=(.22,.15,-.8);aim(cam,(0,.2,.005));scene.render.filepath=str(OUT/'toilet-brush-handle-40-back.png');bpy.ops.render.render(write_still=True)
cam.location=(.8,.1,.13);aim(cam,(0,.2,.008));scene.render.filepath=str(OUT/'toilet-brush-handle-40-side.png');bpy.ops.render.render(write_still=True)
print('HANDLE_40_COMPLETE')
