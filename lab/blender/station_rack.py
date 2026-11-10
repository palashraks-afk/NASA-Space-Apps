# ISS-style rack housing that frames every station in the app (replaces the flat slab each station
# used to have). Authored at 1.0 x 1.25 m; the app scales it to each station's rack size.
# Front face plate sits at z = +0.025 like the old slab, so every station's screens and props still
# mount on it. Run: blender -b --factory-startup -P lab/blender/station_rack.py
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import R, T, Builder, make_material  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.read_factory_settings(use_empty=True)

COLS = {
    "M_paint": ((0.8, 0.8, 0.78), 0.5, 0), "M_paintcool": ((0.66, 0.69, 0.72), 0.5, 0), "M_brushed": ((0.62, 0.63, 0.65), 0.35, 1),
    "M_polymer": ((0.05, 0.055, 0.06), 0.55, 0), "M_shell": ((0.16, 0.17, 0.18), 0.8, 0), "M_rubber": ((0.03, 0.03, 0.03), 0.8, 0),
    "M_cable_grey": ((0.3, 0.31, 0.32), 0.7, 0), "M_cable_blue": ((0.08, 0.2, 0.45), 0.6, 0), "M_handrail": ((0.22, 0.34, 0.52), 0.35, 0.6),
    "M_hazard_y": ((0.85, 0.62, 0.05), 0.5, 0),
}
mats = {k: make_material(k, *v) for k, v in COLS.items()}
mats["M_led_green"] = make_material("M_led_green", (0.02, 0.1, 0.03), 0.4, 0, (0.3, 1.0, 0.45), 6.0)
mats["M_led_amber"] = make_material("M_led_amber", (0.1, 0.06, 0.02), 0.4, 0, (1.0, 0.55, 0.15), 6.0)
B = Builder(list(mats))
I = T(0, 0, 0)

RW, RH = 1.0, 1.25
FW = 0.05  # frame post width
# back box so no gap shows the wall through the frame
B.box(T(0, 0, -0.045), (RW - 0.02, RH - 0.02, 0.07), "M_shell", bevel=0.006)
# face plate (stations mount on z = 0.025)
B.box(T(0, 0, 0.012), (RW - 2 * FW + 0.01, RH - 2 * FW + 0.01, 0.026), "M_paint", bevel=0.004, seg=2)
# side posts with seat track
for s in (-1, 1):
    x = s * (RW / 2 - FW / 2)
    B.box(T(x, 0, 0.0), (FW, RH, 0.075), "M_brushed", bevel=0.007, seg=3)
    B.box(T(x, 0, 0.038), (0.016, RH - 0.1, 0.004), "M_polymer", bevel=0.0015, seg=1)
    for k in range(int((RH - 0.12) / 0.0254)):
        y = -RH / 2 + 0.06 + k * 0.0254
        B.cyl(T(x, y, 0.0395), 0.0055, 0.003, "M_shell", seg=10)
# top / bottom rails
for s in (-1, 1):
    y = s * (RH / 2 - FW / 2)
    B.box(T(0, y, 0.0), (RW - 2 * FW, FW, 0.065), "M_paintcool", bevel=0.007, seg=3)
    B.box(T(0, y + s * 0.006, 0.0335), (RW - 2 * FW - 0.06, 0.012, 0.004), "M_polymer", bevel=0.0015, seg=1)
# corner gussets with bolts
for sx in (-1, 1):
    for sy in (-1, 1):
        cx, cy = sx * (RW / 2 - FW - 0.035), sy * (RH / 2 - FW - 0.035)
        B.box(T(cx, cy, 0.029) @ R("Z", 45 * sx * sy), (0.11, 0.035, 0.008), "M_paintcool", bevel=0.003, seg=2)
        for d in (-0.03, 0.03):
            a = math.radians(45 * sx * sy)
            B.cyl(T(cx + d * math.cos(a), cy + d * math.sin(a), 0.0345), 0.0055, 0.004, "M_brushed", seg=6, bevel=0.001)
# face-plate perimeter fasteners
nx, ny = 7, 9
for i in range(nx):
    x = -RW / 2 + FW + 0.06 + i * (RW - 2 * FW - 0.12) / (nx - 1)
    for s in (-1, 1):
        B.cyl(T(x, s * (RH / 2 - FW - 0.016), 0.0265), 0.0045, 0.003, "M_brushed", seg=10, bevel=0.001)
for i in range(ny):
    y = -RH / 2 + FW + 0.08 + i * (RH - 2 * FW - 0.16) / (ny - 1)
    for s in (-1, 1):
        B.cyl(T(s * (RW / 2 - FW - 0.016), y, 0.0265), 0.0045, 0.003, "M_brushed", seg=10, bevel=0.001)
# rack pivot fittings at the bottom corners and knee-brace lugs at the top
for s in (-1, 1):
    B.cyl(T(s * (RW / 2 - FW / 2), -RH / 2 + 0.03, 0.045) @ R("Y", 90), 0.016, 0.06, "M_brushed", seg=20, bevel=0.002)
    B.box(T(s * (RW / 2 - FW / 2), RH / 2 - 0.03, 0.045), (0.04, 0.04, 0.02), "M_paintcool", bevel=0.005, seg=2)
    B.cyl(T(s * (RW / 2 - FW / 2), RH / 2 - 0.03, 0.057), 0.009, 0.006, "M_hazard_y", seg=12)
# status strip on the bottom rail
for k, m in enumerate(["M_led_green", "M_led_green", "M_led_amber", "M_led_green"]):
    B.box(T(RW / 2 - FW - 0.12 + k * 0.022, -RH / 2 + FW / 2, 0.0335), (0.012, 0.005, 0.004), m, bevel=0.001, seg=1)
# utility harness: two cables out of the bottom rail, curving back to the wall
for k, (dx, mat, r) in enumerate([(-0.3, "M_cable_grey", 0.011), (-0.26, "M_cable_blue", 0.007), (0.32, "M_cable_grey", 0.009)]):
    pts = []
    for i in range(16):
        t = i / 15
        pts.append((dx + 0.03 * math.sin(t * 3 + k), -RH / 2 - 0.02 - 0.09 * math.sin(t * math.pi), 0.0 - 0.09 * t))
    B.tube(pts, r, mat, rseg=10)
    B.cyl(T(dx, -RH / 2 + 0.002, 0.0) @ R("X", 90), r * 1.7, 0.03, "M_brushed", seg=14, bevel=0.002)

ob = B.to_object("StationRack", mats, uv_scale=1 / 0.6)
bpy.ops.object.select_all(action="DESELECT")
ob.select_set(True)
bpy.context.view_layer.objects.active = ob
bpy.ops.export_scene.gltf(
    filepath=os.path.join(HERE, "..", "public", "models", "station_rack.glb"), export_format="GLB", use_selection=True,
    export_apply=True, export_materials="EXPORT", export_image_format="NONE",
    export_draco_mesh_compression_enable=True, export_draco_position_quantization=16,
)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "out", "station_rack.blend"))
print("station rack faces", len(B.f))
