import bpy, bmesh, math, os
from math import sin, cos, radians, exp, pi
from mathutils import Vector

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(REPO, "public", "case-study", "model")
RENDER_DIR = os.path.join(REPO, "scripts", "blender", "renders", "product13-d500")
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ============ DIMENSIONS (mm) — matched to annotated photo silhouette ============
# Ø127 flange / Ø120 rim band / near-straight wall to Ø106 foot / Ø105 base,
# foot step ~10mm up, step line ~12mm below rim, 4 short rim ticks,
# H 68, wall 1.2, standing ring + recessed base with markings + gate outside.
NSEG = 512
N_TICKS = 4
TICK_AMP = 0.45
TICK_SIGMA = radians(1.6)

def wall_r(z):        # main wall: r53.0 @ z10.3 -> r58.8 @ z56
    return 53.0 + 5.8 * (z - 10.3) / 45.7

profile = []  # (r, z, tick_fade)
# --- underside: gate, dome, grooves, flat marking zone ---
profile += [(1.25,2.20,0),(1.25,2.60,0),(2.5,2.72,0),(6,2.75,0),(10,2.68,0),(14,2.55,0),
            (17.4,2.42,0),(18.0,2.12,0),(18.6,2.40,0),          # groove r18
            (25.4,2.28,0),(26.0,1.98,0),(26.6,2.26,0),          # groove r26
            (30,2.15,0),(35,2.05,0),(40,2.0,0),(44,2.0,0),
            (45.0,1.2,0),(45.6,0.3,0),(46.2,0.0,0),             # recess wall
            (48.5,0.0,0),(51.0,0.0,0)]                          # standing ring
# --- tight bottom corner + short vertical foot band ---
profile += [(51.7,0.2,0),(52.2,0.8,0),(52.45,1.8,0),(52.5,2.6,0),
            (52.55,6.0,0),(52.6,9.4,0)]
# --- small foot step out to main wall ---
profile += [(52.75,9.7,0),(53.0,10.3,0)]
# --- near-straight tapered wall ---
for z in (16, 22, 28, 34, 40, 46, 51, 56):
    profile.append((wall_r(z), z, 0))
# --- step line, rim band (tick ridges), flange ---
profile += [(59.35,56.3,0),(59.6,56.9,0),
            (59.65,58,0.5),(59.75,60,1),(59.85,62,1),(59.95,64,1),(60.0,65.4,0.6),(60.0,66.0,0),
            (61.5,66.5,0),(62.9,66.9,0),(63.5,67.2,0),(63.5,67.7,0),
            (63.2,68.0,0),(61.5,68.0,0),(59.9,68.0,0),(59.3,68.0,0),
            (59.0,67.5,0),(58.9,66.6,0)]
# --- inner rim band + inner step ---
profile += [(58.8,65,0),(58.7,63,0),(58.6,60,0),(58.5,57.5,0),(58.0,56.6,0),(57.55,56.0,0)]
# --- inner wall (1.25 offset) ---
for z in (50, 44, 36, 28, 22, 18.5):
    profile.append((wall_r(z) - 1.25, z, 0))
# --- internal stack-stop ridge (2.5mm step) ---
profile += [(51.4,16.2,0),(51.3,15.5,0),(51.3,13.8,0),(51.2,12.5,0)]
# --- inner bottom corner + base panel (1.2 above underside) ---
profile += [(50.6,9.5,0),(49.6,6.8,0),(47.9,4.8,0),(45.5,3.7,0),(42.5,3.3,0),(40,3.2,0),
            (32,3.2,0),(24,3.2,0),(14,3.2,0),(6,3.2,0),
            (2.0,3.25,0),(1.0,3.45,0),(0.5,3.55,0)]

tick_centres = [2*pi*i/N_TICKS + radians(12) for i in range(N_TICKS)]
def tick(th):
    d = min(abs((th - c + pi) % (2*pi) - pi) for c in tick_centres)
    return TICK_AMP * exp(-(d/TICK_SIGMA)**2)

verts, faces = [], []
verts.append((0.0, 0.0, 2.20))
for (r, z, f) in profile:
    for k in range(NSEG):
        th = 2*pi*k/NSEG
        rr = r + f*tick(th)
        verts.append((rr*cos(th), rr*sin(th), z))
verts.append((0.0, 0.0, 3.60))

nrings = len(profile)
def vid(ring, k): return 1 + ring*NSEG + (k % NSEG)
for k in range(NSEG):
    faces.append((0, vid(0, k+1), vid(0, k)))
for i in range(nrings-1):
    for k in range(NSEG):
        faces.append((vid(i,k), vid(i,k+1), vid(i+1,k+1), vid(i+1,k)))
top_c = len(verts)-1
for k in range(NSEG):
    faces.append((top_c, vid(nrings-1, k), vid(nrings-1, k+1)))

mesh = bpy.data.meshes.new("D500")
mesh.from_pydata(verts, [], faces)
mesh.validate(); mesh.update()
bowl = bpy.data.objects.new("D500_Bowl", mesh)
scene.collection.objects.link(bowl)

# ---------- glossy white food-grade PP ----------
mat = bpy.data.materials.new("PP_White")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.93, 0.93, 0.925, 1.0)
bsdf.inputs["Roughness"].default_value = 0.12
try:
    bsdf.inputs["Coat Weight"].default_value = 0.4
    bsdf.inputs["Coat Roughness"].default_value = 0.08
except Exception: pass
bowl.data.materials.append(mat)

mat_mark = bpy.data.materials.new("PP_Marking")
mat_mark.use_nodes = True
mb2 = mat_mark.node_tree.nodes["Principled BSDF"]
mb2.inputs["Base Color"].default_value = (0.80, 0.81, 0.82, 1.0)
mb2.inputs["Roughness"].default_value = 0.08

bpy.context.view_layer.objects.active = bowl
bowl.select_set(True)
bpy.ops.object.shade_auto_smooth(angle=radians(38))

# ---------- moulded markings on OUTSIDE bottom ----------
marking_objs = []
def make_text(body, size, loc, extrude=0.15, on_curve=None):
    tc = bpy.data.curves.new("t", type='FONT')
    tc.body = body; tc.size = size; tc.extrude = extrude
    tc.align_x = 'LEFT' if on_curve is not None else 'CENTER'
    tc.align_y = 'CENTER'
    ob = bpy.data.objects.new("txt", tc)
    scene.collection.objects.link(ob)
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True); bpy.context.view_layer.objects.active = ob
    bpy.ops.object.convert(target='MESH')
    ob = bpy.context.view_layer.objects.active
    if on_curve is not None:
        cm = ob.modifiers.new("bend", 'CURVE')
        cm.object = on_curve; cm.deform_axis = 'POS_X'
        bpy.ops.object.modifier_apply(modifier=cm.name)
    ob.rotation_euler = (pi, 0, 0)
    ob.location = loc
    ob.data.materials.append(mat_mark)
    marking_objs.append(ob)
    return ob

bpy.ops.curve.primitive_bezier_circle_add(radius=36.5, location=(0,0,0))
circle_ob = bpy.context.view_layer.objects.active
make_text("D-500  •  500 ml  •  FOOD GRADE PP", 3.4, (0,0,2.02), on_curve=circle_ob)
bpy.data.objects.remove(circle_ob)

tri_cx, tri_cy, Ro, Ri = 0.0, 31.0, 5.0, 3.2
z0, z1 = 1.88, 2.14
tv, tf = [], []
for R in (Ro, Ri):
    for j in range(3):
        a = radians(90 + j*120)
        for z in (z0, z1):
            tv.append((tri_cx + R*cos(a), tri_cy + R*sin(a), z))
def P(ring, j, top): return ring*6 + j*2 + top
for j in range(3):
    jn = (j+1) % 3
    tf.append((P(0,j,0), P(0,jn,0), P(1,jn,0), P(1,j,0)))
    tf.append((P(1,j,1), P(1,jn,1), P(0,jn,1), P(0,j,1)))
    tf.append((P(0,j,1), P(0,jn,1), P(0,jn,0), P(0,j,0)))
    tf.append((P(1,j,0), P(1,jn,0), P(1,jn,1), P(1,j,1)))
tm = bpy.data.meshes.new("tri"); tm.from_pydata(tv, [], tf); tm.validate()
tri = bpy.data.objects.new("PP5_Triangle", tm)
scene.collection.objects.link(tri); tri.data.materials.append(mat_mark)
marking_objs.append(tri)

make_text("5", 3.6, (tri_cx, tri_cy - 0.4, 2.02))
make_text("PP", 2.2, (tri_cx, tri_cy - 8.0, 2.02))

# gate cross '+' at centre of underside
for (sx, sy) in ((2.4, 0.5), (0.5, 2.4)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 2.15))
    c = bpy.context.view_layer.objects.active
    c.scale = (sx, sy, 0.35)
    bpy.ops.object.transform_apply(scale=True)
    c.data.materials.append(mat_mark)
    marking_objs.append(c)

# ---------- pristine manifold copy for section ----------
sec = bowl.copy(); sec.data = bowl.data.copy(); sec.name = "Section"
scene.collection.objects.link(sec)
sec.scale = (0.001, 0.001, 0.001)

# ---------- join + scale mm -> m ----------
bpy.ops.object.select_all(action='DESELECT')
bowl.select_set(True)
for ob in marking_objs: ob.select_set(True)
bpy.context.view_layer.objects.active = bowl
bpy.ops.object.join()
bowl = bpy.context.view_layer.objects.active
bowl.scale = (0.001, 0.001, 0.001)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

os.makedirs(OUT, exist_ok=True)
os.makedirs(RENDER_DIR, exist_ok=True)
glb = os.path.join(OUT, "D500_Bowl.glb")
bpy.ops.object.select_all(action='DESELECT'); bowl.select_set(True)
bpy.ops.export_scene.gltf(filepath=glb, use_selection=True, export_format='GLB', export_apply=True)
print("GLB_OK", glb)

# ---------- section cut ----------
bpy.ops.object.select_all(action='DESELECT')
sec.select_set(True); bpy.context.view_layer.objects.active = sec
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -0.15, 0.05))
cut = bpy.context.view_layer.objects.active
cut.scale = (0.4, 0.3, 0.4); cut.hide_render = True
mb = sec.modifiers.new("cut", 'BOOLEAN')
mb.operation = 'DIFFERENCE'; mb.object = cut; mb.solver = 'MANIFOLD'
sec.hide_render = True

# ---------- studio ----------
world = bpy.data.worlds.new("W"); scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.02, 0.022, 0.025, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 1.0

bpy.ops.mesh.primitive_plane_add(size=4, location=(0, 0, 0))
floor = bpy.context.view_layer.objects.active
fm = bpy.data.materials.new("Floor"); fm.use_nodes = True
fb = fm.node_tree.nodes["Principled BSDF"]
fb.inputs["Base Color"].default_value = (0.055, 0.06, 0.068, 1)
fb.inputs["Roughness"].default_value = 0.45
floor.data.materials.append(fm)

def area(loc, rot, e, size):
    ld = bpy.data.lights.new("L", 'AREA'); ld.energy = e; ld.size = size
    lo = bpy.data.objects.new("L", ld); scene.collection.objects.link(lo)
    lo.location = loc; lo.rotation_euler = rot
    return lo
area((0.35, -0.35, 0.55), (radians(40), 0, radians(45)), 22, 0.6)
area((-0.45, 0.1, 0.35), (radians(60), 0, radians(-100)), 8, 0.8)
area((0.0, 0.5, 0.3), (radians(70), 0, radians(180)), 14, 0.5)

cam_d = bpy.data.cameras.new("C"); cam = bpy.data.objects.new("Cam", cam_d)
scene.collection.objects.link(cam); scene.camera = cam
def aim(loc, target):
    cam.location = loc
    d = Vector(target) - Vector(loc)
    cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()

scene.render.engine = 'CYCLES'
scene.cycles.samples = 96
scene.cycles.use_denoising = True
scene.render.resolution_x = 1280; scene.render.resolution_y = 960

def shot(name, loc, target, lens=60):
    cam_d.lens = lens
    aim(loc, target)
    scene.render.filepath = os.path.join(RENDER_DIR, name)
    bpy.ops.render.render(write_still=True)
    print("RENDER_OK", name)

shot("d500_hero.png", (0.26, -0.30, 0.22), (0, 0, 0.035), 70)
shot("d500_side.png", (0.0, -0.42, 0.045), (0, 0, 0.036), 85)

sun_d = bpy.data.lights.new("Sun", 'SUN'); sun_d.energy = 3.0; sun_d.angle = radians(2)
sun = bpy.data.objects.new("Sun", sun_d); scene.collection.objects.link(sun)
sun.rotation_euler = (radians(125), 0, radians(35))
floor.hide_render = True
shot("d500_bottom.png", (0.02, -0.02, -0.40), (0, 0, 0.002), 60)
floor.hide_render = False
bpy.data.objects.remove(sun)

bowl.hide_render = True; sec.hide_render = False
shot("d500_section.png", (0.24, -0.28, 0.24), (0, 0.02, 0.035), 70)
bowl.hide_render = False; sec.hide_render = True

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(RENDER_DIR, "D500_Bowl.blend"))
print("ALL_DONE")
