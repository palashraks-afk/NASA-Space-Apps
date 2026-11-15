# Lights, bakes and exports the hub built by hub.py.
# Run: blender -b lab/blender/out/hub.blend -P lab/blender/bake.py -- [preview] [bake] [probe] [export]
#   preview  Cycles renders from a few app camera positions -> lab/blender/out/preview_*.png
#   bake     lightmap UVs (UV1, one atlas for walls + ceiling) + Cycles diffuse bake -> public/textures/hub_lightmap.jpg
#   probe    equirectangular HDR from the hub centre -> public/textures/hub_probe.hdr
#   export   Draco glTF -> public/models/hub.glb (UV0 tiling, UV1 lightmap; materials by name)
import math
import os
import sys

import bpy
import numpy as np
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out")
PUB = os.path.join(HERE, "..", "public")
steps = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else ["preview"]
scene = bpy.context.scene
BAKED = [bpy.data.objects["HubMain"], bpy.data.objects["HubCeiling"]]
DETAIL = [bpy.data.objects["HubDetail"], bpy.data.objects["HubCeilingDetail"]]
main = BAKED[0]
LM_SIZE = 4096
A, N = 3.2, 12


def b(x, y, z):
    """three.js coords -> Blender Z-up."""
    return Vector((x, -z, y))


def gpu():
    scene.render.engine = "CYCLES"
    prefs = bpy.context.preferences.addons["cycles"].preferences
    for kind in ("OPTIX", "CUDA"):
        try:
            prefs.compute_device_type = kind
            prefs.get_devices()
            devs = [d for d in prefs.devices if d.type == kind]
            if devs:
                for d in prefs.devices:
                    d.use = d.type == kind
                scene.cycles.device = "GPU"
                print("cycles device:", kind, [d.name for d in devs])
                return kind
        except TypeError:
            continue
    print("cycles device: CPU")
    return "CPU"


def lights():
    w = scene.world or bpy.data.worlds.new("World")
    scene.world = w
    w.use_nodes = True
    bg = next(n for n in w.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs["Color"].default_value = (0, 0, 0, 1)
    # Earthshine through the three gallery windows: soft blue-white panels outside each pane, tipped
    # up a little because Earth fills the lower half of the view.
    for k in (-1, 0, 1):
        name = f"Earthshine{k}"
        if name in bpy.data.objects:
            continue
        ld = bpy.data.lights.new(name, "AREA")
        ld.shape = "RECTANGLE"
        ld.size, ld.size_y = 1.3, 1.5
        ld.energy = 520 if k == 0 else 420
        ld.color = (0.55, 0.74, 1.0)
        ob = bpy.data.objects.new(name, ld)
        scene.collection.objects.link(ob)
        t = math.radians(k * 30)
        out = Vector((math.sin(t), 0, -math.cos(t)))
        p = out * (A + 0.7) + Vector((0, -0.2, 0))
        ob.location = b(*p)
        d = -out + Vector((0, 0.35, 0))
        ob.rotation_euler = b(*d).to_track_quat("-Z", "Y").to_euler()
    scene.cycles.samples = 256


def camera(pos, look, fov=56, name="Cam"):
    cam = bpy.data.objects.get(name)
    if not cam:
        cd = bpy.data.cameras.new(name)
        cam = bpy.data.objects.new(name, cd)
        scene.collection.objects.link(cam)
    cam.data.sensor_fit = "VERTICAL"
    cam.data.angle = math.radians(fov)
    cam.data.clip_start = 0.02
    p, t = b(*pos), b(*look)
    cam.location = p
    cam.rotation_euler = (t - p).to_track_quat("-Z", "Y").to_euler()
    scene.camera = cam
    return cam


def preview():
    scene.render.resolution_x, scene.render.resolution_y = 1280, 720
    scene.cycles.samples = 160
    scene.cycles.use_denoising = True
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.exposure = 0.0
    shots = {
        "cutaway": ((0, 5.6, 2.3), (0, -1.0, -0.4)),
        "window": ((0, 0.0, -1.5), (0, -0.3, -6)),
        "hatch": ((0, 0.1, 0.4), (0, -0.1, 4)),
        "wall": ((-1.25, 0.05, -0.5), (-2.9, -0.05, -1.2)),
        "eye": ((1.2, 0.3, 1.6), (-0.6, -0.2, -1.6)),
    }
    only = [s for s in steps if s.startswith("shot=")]
    ceiling = [o for o in bpy.data.objects if o.name.startswith("HubCeiling")]
    for name, (pos, look) in shots.items():
        if only and f"shot={name}" not in only:
            continue
        for o in ceiling:
            o.hide_render = name == "cutaway"
        camera(pos, look)
        scene.render.filepath = os.path.join(OUT, f"preview_{name}.png")
        bpy.ops.render.render(write_still=True)
        print("rendered", name)


def lightmap_uvs():
    import bmesh
    bpy.ops.object.select_all(action="DESELECT")
    for o in BAKED:
        me = o.data
        if "Lightmap" not in me.uv_layers:
            me.uv_layers.new(name="Lightmap")
        me.uv_layers.active = me.uv_layers["Lightmap"]
        o.select_set(True)
    bpy.context.view_layer.objects.active = main
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.0, area_weight=0.0, correct_aspect=True, scale_to_bounds=False)
    # Hidden shell faces get a quarter of the texel density.
    for o in BAKED:
        me = o.data
        bm = bmesh.from_edit_mesh(me)
        uvl = bm.loops.layers.uv["Lightmap"]
        low = [i for i, m in enumerate(me.materials) if m.name == "M_shell"]
        for f in bm.faces:
            if f.material_index in low:
                for lo in f.loops:
                    lo[uvl].uv *= 0.25
        bmesh.update_edit_mesh(me)
    bpy.ops.uv.pack_islands(rotate=True, margin_method="FRACTION", margin=0.0012)
    bpy.ops.object.mode_set(mode="OBJECT")
    for o in BAKED:
        o.data.uv_layers["UVMap"].active_render = True


def bake():
    lightmap_uvs()
    img = bpy.data.images.get("Lightmap") or bpy.data.images.new("Lightmap", LM_SIZE, LM_SIZE, float_buffer=True)
    junk = bpy.data.images.get("LMJunk") or bpy.data.images.new("LMJunk", 64, 64, float_buffer=True)
    for m in main.data.materials:
        nt = m.node_tree
        node = nt.nodes.get("LMBake") or nt.nodes.new("ShaderNodeTexImage")
        node.name = "LMBake"
        # emitters are drawn unlit in the app; keep them out of the lightmap and its exposure
        node.image = junk if m.name.startswith("M_led") else img
        uvn = nt.nodes.get("LMUV") or nt.nodes.new("ShaderNodeUVMap")
        uvn.name = "LMUV"
        uvn.uv_map = "Lightmap"
        nt.links.new(uvn.outputs["UV"], node.inputs["Vector"])
        for n in nt.nodes:
            n.select = False
        node.select = True
        nt.nodes.active = node
    for o in BAKED:
        o.data.uv_layers.active = o.data.uv_layers["Lightmap"]
        o.hide_render = False
    for o in DETAIL:
        o.hide_render = False
    scene.cycles.samples = int(next((s.split("=")[1] for s in steps if s.startswith("samples=")), 512))
    scene.render.bake.margin = 6
    scene.render.bake.use_clear = True
    bpy.ops.object.select_all(action="DESELECT")
    for o in BAKED:
        o.select_set(True)
    bpy.context.view_layer.objects.active = main
    bpy.ops.object.bake(type="DIFFUSE", pass_filter={"DIRECT", "INDIRECT"}, margin=6, use_clear=True, target="IMAGE_TEXTURES")
    px = np.array(img.pixels[:], dtype=np.float32).reshape(LM_SIZE, LM_SIZE, 4)
    rgb = px[..., :3]
    # Light dilation-aware denoise: blur only within covered texels (alpha>0), then re-fill margins.
    cov = (px[..., 3] > 0.5).astype(np.float32)[..., None]
    def box(a, r):
        k = 2 * r + 1
        c = np.cumsum(np.cumsum(np.pad(a, ((r + 1, r), (r + 1, r), (0, 0)), mode="edge"), 0), 1)
        return (c[k:, k:] - c[:-k, k:] - c[k:, :-k] + c[:-k, :-k]) / (k * k)
    num = box(rgb * cov, 1)
    den = box(cov, 1)
    sm = np.where(den > 1e-4, num / np.maximum(den, 1e-4), rgb)
    rgb = sm * cov + rgb * (1 - cov)
    np.save(os.path.join(OUT, "lightmap_raw.npy"), rgb.astype(np.float16))
    hi = float(np.percentile(rgb[cov[..., 0] > 0].max(-1), 99.5))
    print("lightmap p99.7 =", hi)
    scale = hi
    enc = np.clip(rgb / scale, 0, 1)
    enc = np.where(enc <= 0.0031308, enc * 12.92, 1.055 * np.power(enc, 1 / 2.4) - 0.055)
    out = bpy.data.images.new("LMOut", LM_SIZE, LM_SIZE, alpha=False)
    out.colorspace_settings.name = "Non-Color"
    out.pixels.foreach_set(np.concatenate([enc, np.ones_like(enc[..., :1])], -1).astype(np.float32).ravel())
    s = scene.render.image_settings
    s.file_format = "JPEG"
    s.quality = 90
    s.color_management = "OVERRIDE"
    s.view_settings.view_transform = "Standard"
    out.save_render(os.path.join(PUB, "textures", "hub_lightmap.jpg"), scene=scene)
    with open(os.path.join(PUB, "textures", "hub_lightmap.json"), "w") as f:
        f.write('{"scale": %.5f}\n' % scale)
    for m in main.data.materials:
        nt = m.node_tree
        for k in ("LMBake", "LMUV"):
            if k in nt.nodes:
                nt.nodes.remove(nt.nodes[k])
    bpy.ops.wm.save_mainfile()
    print("baked, scale", scale)


def probe():
    for o in bpy.data.objects:
        if o.name.startswith("HubCeiling"):
            o.hide_render = False
    scene.render.resolution_x, scene.render.resolution_y = 1024, 512
    scene.cycles.samples = 256
    scene.cycles.use_denoising = True
    cam = camera((0, 0, 0), (1, 0, 0), name="Probe")
    cam.data.type = "PANO"
    cam.data.panorama_type = "EQUIRECTANGULAR"
    cam.rotation_euler = (math.radians(90), 0, math.radians(-90))
    scene.view_settings.view_transform = "Standard"
    s = scene.render.image_settings
    s.file_format = "HDR"
    scene.render.filepath = os.path.join(PUB, "textures", "hub_probe.hdr")
    bpy.ops.render.render(write_still=True)
    print("probe written")


def export():
    for o in BAKED:
        o.data.uv_layers["UVMap"].active_render = True
    bpy.ops.object.select_all(action="DESELECT")
    for o in BAKED + DETAIL:
        o.select_set(True)
    bpy.context.view_layer.objects.active = main
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(PUB, "models", "hub.glb"), export_format="GLB", use_selection=True,
        export_apply=True, export_texcoords=True, export_normals=True, export_tangents=False,
        export_materials="EXPORT", export_image_format="NONE", export_lights=False, export_cameras=False,
        export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
        export_draco_position_quantization=16, export_draco_normal_quantization=10, export_draco_texcoord_quantization=14,
    )
    print("exported")


gpu()
lights()
if "preview" in steps:
    preview()
if "bake" in steps:
    bake()
if "probe" in steps:
    probe()
if "export" in steps:
    export()
