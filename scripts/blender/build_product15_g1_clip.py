import bpy
import math
import os
from mathutils import Vector

ROOT = r"C:\Users\rbhan\Documents\whitedot"
OUT_BLEND = os.path.join(ROOT, "public", "case-study", "model", "product-15-g1-clip.blend")
OUT_GLB = os.path.join(ROOT, "public", "case-study", "model", "product-15-g1-clip.glb")
OUT_PNG = os.path.join(ROOT, "public", "case-study", "model", "product-15-g1-clip-preview.png")
MM = 0.001
THICKNESS = 2.35 * MM

bpy.ops.wm.read_factory_settings(use_empty=True)

def mat(name, rgba, metallic=0.0, roughness=0.42):
    m = bpy.data.materials.new(name); m.diffuse_color = rgba; m.use_nodes = True
    p = m.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value = rgba; p.inputs["Roughness"].default_value = roughness; p.inputs["Metallic"].default_value = metallic
    return m

part_mat = mat("Warm ivory printed plastic", (0.72, 0.66, 0.57, 1), 0.0, 0.34)
part_bsdf = part_mat.node_tree.nodes.get("Principled BSDF")
if "IOR" in part_bsdf.inputs: part_bsdf.inputs["IOR"].default_value = 1.46
if "Subsurface Weight" in part_bsdf.inputs: part_bsdf.inputs["Subsurface Weight"].default_value = 0.075
if "Coat Weight" in part_bsdf.inputs: part_bsdf.inputs["Coat Weight"].default_value = 0.10
if "Coat Roughness" in part_bsdf.inputs: part_bsdf.inputs["Coat Roughness"].default_value = 0.24
dark_mat = mat("Display plinth", (0.016, 0.019, 0.022, 1), 0.08, 0.25)

def catmull(points, samples_per_span=16):
    pts = [Vector((x * MM, z * MM)) for x, z in points]; out = []
    for i in range(len(pts) - 1):
        p0 = pts[max(0, i - 1)]; p1 = pts[i]; p2 = pts[i + 1]; p3 = pts[min(len(pts) - 1, i + 2)]
        for j in range(samples_per_span):
            t = j / samples_per_span; t2, t3 = t*t, t*t*t
            out.append(0.5 * ((2*p1) + (-p0+p2)*t + (2*p0-5*p1+4*p2-p3)*t2 + (-p0+3*p1-3*p2+p3)*t3))
    out.append(pts[-1]); return out

PATH = catmull([(0.0, 7.4), (1.8, 7.4), (3.6, 7.4), (13.0, 2.0), (17.0, 0.0), (20.0, 1.0), (28.5, 12.8), (31.5, 14.2), (34.5, 12.4), (44.5, 2.2), (48.5, 0.8), (50.0, 2.1)], 16)

def nearest_index(x_mm):
    x = x_mm * MM; return min(range(len(PATH)), key=lambda i: abs(PATH[i].x - x))

def add_bevel(obj):
    bevel = obj.modifiers.new("Edge softening R0.20mm", "BEVEL"); bevel.width = 0.55 * MM; bevel.segments = 5; bevel.limit_method = 'NONE'

def ribbon(name, y0_mm, y1_mm, x0_mm, x1_mm, taper_tip_mm=0.0, taper_at='none'):
    a, b = nearest_index(x0_mm), nearest_index(x1_mm); path = PATH[min(a,b):max(a,b)+1]; verts=[]; faces=[]
    n = len(path)
    y0, y1 = y0_mm*MM, y1_mm*MM
    ycenter, yhalf = (y0+y1)*0.5, (y1-y0)*0.5
    cum=[0.0]
    for i in range(1,n): cum.append(cum[-1] + (path[i]-path[i-1]).length)
    total_len = cum[-1] if cum[-1] > 0 else 1.0
    for i,p in enumerate(path):
        tangent=(path[min(len(path)-1,i+1)]-path[max(0,i-1)]).normalized(); normal=Vector((-tangent.y,tangent.x)); lo=p-normal*(THICKNESS*.5); hi=p+normal*(THICKNESS*.5)
        scale = 1.0
        if taper_tip_mm > 0:
            if taper_at == 'end':
                dist_mm = (total_len - cum[i]) / MM
                if dist_mm < taper_tip_mm: scale = max(0.12, dist_mm / taper_tip_mm)
            elif taper_at == 'start':
                dist_mm = cum[i] / MM
                if dist_mm < taper_tip_mm: scale = max(0.12, dist_mm / taper_tip_mm)
        ya, yb = ycenter - yhalf*scale, ycenter + yhalf*scale
        verts += [(lo.x,ya,lo.y),(lo.x,yb,lo.y),(hi.x,ya,hi.y),(hi.x,yb,hi.y)]
    for i in range(len(path)-1):
        n2,q=i*4,(i+1)*4; faces += [(n2,q,q+1,n2+1),(n2+2,n2+3,q+3,q+2),(n2,n2+2,q+2,q),(n2+1,q+1,q+3,n2+3)]
    faces += [(0,1,3,2)]; e=(len(path)-1)*4; faces += [(e,e+2,e+3,e+1)]
    mesh=bpy.data.meshes.new(name+"_Mesh"); mesh.from_pydata(verts,[],faces); mesh.update(); obj=bpy.data.objects.new(name,mesh); bpy.context.collection.objects.link(obj); obj.data.materials.append(part_mat); add_bevel(obj); return obj

def angled_local_notch(obj, center_mm, y_center_mm, width_mm=3.25, depth_mm=1.45, y_width_mm=3.6, angle_deg=14.0):
    idx=nearest_index(center_mm); p=PATH[idx]; tangent=(PATH[min(len(PATH)-1,idx+1)]-PATH[max(0,idx-1)]).normalized(); normal=Vector((-tangent.y,tangent.x)); center=p+normal*((THICKNESS*.5)+(depth_mm*MM*.5))
    bpy.ops.mesh.primitive_cube_add(size=1, location=(center.x,y_center_mm*MM,center.y)); cutter=bpy.context.object; cutter.name=obj.name+"_LOCAL_ANGLED_NOTCH_CUTTER"; cutter.dimensions=(width_mm*MM,y_width_mm*MM,depth_mm*MM); cutter.rotation_euler[1]=-math.atan2(tangent.y,tangent.x)+math.radians(angle_deg); bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    for modifier in list(obj.modifiers):
        if modifier.type=='BEVEL': obj.modifiers.remove(modifier)
    bpy.context.view_layer.objects.active=obj; mod=obj.modifiers.new("Angled local notch","BOOLEAN"); mod.operation='DIFFERENCE'; mod.solver='EXACT'; mod.object=cutter; bpy.ops.object.modifier_apply(modifier=mod.name); bpy.data.objects.remove(cutter,do_unlink=True); add_bevel(obj)

ribbon("G1_Central_Bridge", -9.5, 9.5, 8.3, 41.7)
# Right side reads trident-like in the reference: tines a bit wider than the
# left side, tapering to a point near the tip instead of a blunt rounded end.
LEFT_BANDS = [(-9.5,-6.0),(-2.0,2.0),(6.0,9.5)]
RIGHT_BANDS = [(-9.9,-5.7),(-2.3,2.3),(5.7,9.9)]
for side, xa, xb, bands, taper_at in (
    ("Left", 0.0, 9.0, LEFT_BANDS, 'none'),
    ("Right", 41.0, 50.0, RIGHT_BANDS, 'end'),
):
    for idx,(y0,y1) in enumerate(bands,1):
        prong=ribbon(f"G1_{side}_Prong_{idx}",y0,y1,xa,xb, taper_tip_mm=(3.5 if taper_at=='end' else 0.0), taper_at=taper_at)
        if idx==2: angled_local_notch(prong, xa+2.6 if side=="Left" else xb-2.6, (y0+y1)*.5)

bpy.ops.mesh.primitive_cylinder_add(vertices=96,radius=.050,depth=.003,location=(.025,0,-.0032)); plinth=bpy.context.object; plinth.name="Preview_Plinth_NOT_EXPORTED"; plinth.scale.y=.62; plinth.data.materials.append(dark_mat); bevel=plinth.modifiers.new("Soft rim","BEVEL"); bevel.width=.002; bevel.segments=5
bpy.ops.object.camera_add(location=(.105,-.130,.085)); cam=bpy.context.object; cam.name="Product15_Preview_Camera"; bpy.context.scene.camera=cam
def point_at(obj,target): obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
point_at(cam,(.025,0,.0065)); cam.data.type='ORTHO'; cam.data.ortho_scale=.082
for name,loc,energy,size,color in [("Key",(.018,-.045,.085),1.6,.045,(1,.91,.78)),("Fill",(.075,.035,.050),.9,.035,(.72,.84,1)),("Rim",(-.025,.010,.060),1.2,.030,(1,.72,.50))]:
    bpy.ops.object.light_add(type='AREA',location=loc); light=bpy.context.object; light.name=name; light.data.energy=energy; light.data.shape='DISK'; light.data.size=size; light.data.color=color; point_at(light,(.025,0,.008))
scene=bpy.context.scene; scene.render.engine='BLENDER_EEVEE'; scene.render.resolution_x=1600; scene.render.resolution_y=900; scene.render.resolution_percentage=100; scene.render.image_settings.file_format='PNG'; scene.render.filepath=OUT_PNG; scene.render.film_transparent=False; scene.world=bpy.data.worlds.new("Product15 Studio World"); scene.world.color=(.006,.008,.011); scene.view_settings.look='AgX - Medium High Contrast'
os.makedirs(os.path.dirname(OUT_GLB),exist_ok=True); bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.context.scene.objects:
    if obj.name.startswith("G1_"): obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT_GLB,export_format='GLB',use_selection=True,export_apply=True,export_yup=True); bpy.ops.render.render(write_still=True); print("PRODUCT15_OUTPUT",OUT_BLEND,OUT_GLB,OUT_PNG,sep='\n')
