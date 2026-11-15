# Builds the Sol Lab command hub and saves lab/blender/out/hub.blend.
# Run: blender -b --factory-startup -P lab/blender/hub.py   (then bake.py lights, bakes and exports it)
#
# The hub is a 12-sided drum, 6.4 m across, floor to ceiling 2.85 m, with a raised light well in the
# ceiling. Facing Earth (-z) is a three-pane observation gallery over a long console; the other
# facets are station bays (kick panel, backdrop, cabinet row, lit soffit with the bay's name) and an
# airlock opposite the windows. The body hologram stands on a pedestal in the middle and the
# evidence chamber on a plinth toward the airlock.
#
# Layout contract with the app (lab/src/scene/layout.js): N, A, FLOOR, CEIL, WELL, the BAYS table,
# the window opening and the two pedestals must match there.
import math
import os
import random
import sys

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import R, T, Builder, circle, frame, make_material, rounded_rect  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out")
os.makedirs(OUT, exist_ok=True)
rng = random.Random(7)

N, A = 12, 3.2                     # facets, apothem (centre to wall face)
FLOOR, CEIL, WELL = -1.25, 1.6, 2.05
STEP = 360 / N
FW = 2 * A * math.tan(math.pi / N)  # facet width, 1.715 m
RV = A / math.cos(math.pi / N)      # centre to the corner ribs
RIBW = 0.22
BW = FW - RIBW                      # usable bay width between ribs
WIN_W, WIN_H, WIN_Y, WIN_R = 1.36, 1.62, 0.12, 0.2
HATCH_R, HATCH_Y = 0.95, -0.05
BODY_TOP = -0.637                   # body pad sits at -0.62 (pad half height 0.015)
EVID = (1.1, 1.75)                  # evidence chamber plinth (x, z), off the airlock axis; base underside at y -0.51
EVID_TOP = -0.513

BAYS = {0: "window", 1: "window", -1: "window", -2: "medical", 2: "radiation", -3: "board", 3: "clock",
        -4: "galley", 4: "air", -5: "stow", 5: "equip", 6: "hatch"}
TITLES = {"medical": "VITALS", "radiation": "RADIATION", "board": "EXPERIMENTS", "clock": "BODY CLOCK",
          "galley": "GALLEY", "air": "LIFE SUPPORT", "stow": "STOWAGE", "equip": "EQUIPMENT", "hatch": "AIRLOCK"}
STATION_BAYS = {"medical", "radiation", "board", "clock", "galley", "air"}

# ---------------------------------------------------------------- scene + materials
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

MATS = {
    "M_shell": ((0.16, 0.17, 0.18), 0.8, 0.0),
    "M_paint": ((0.70, 0.70, 0.69), 0.5, 0.0),
    "M_paintcool": ((0.55, 0.58, 0.61), 0.5, 0.0),
    "M_graphite": ((0.045, 0.05, 0.056), 0.45, 0.2),
    "M_floor": ((0.085, 0.09, 0.095), 0.6, 0.0),
    "M_brushed": ((0.62, 0.63, 0.65), 0.35, 1.0),
    "M_rubber": ((0.03, 0.03, 0.03), 0.8, 0.0),
    "M_polymer": ((0.05, 0.055, 0.06), 0.55, 0.0),
    "M_vent": ((0.5, 0.52, 0.55), 0.5, 0.6),
    "M_fabric": ((0.78, 0.74, 0.66), 0.95, 0.0),
    "M_strap": ((0.12, 0.14, 0.18), 0.9, 0.0),
    "M_handrail": ((0.22, 0.34, 0.52), 0.35, 0.6),
    "M_hazard_y": ((0.85, 0.62, 0.05), 0.5, 0.0),
    "M_hazard_k": ((0.03, 0.03, 0.03), 0.5, 0.0),
    "M_label": ((0.02, 0.02, 0.025), 0.6, 0.0),
    "M_labeltext": ((0.9, 0.9, 0.88), 0.6, 0.0),
    "M_glass_dark": ((0.01, 0.015, 0.02), 0.05, 0.0),
    "M_cable_blue": ((0.08, 0.2, 0.45), 0.6, 0.0),
    "M_cable_grey": ((0.3, 0.31, 0.32), 0.7, 0.0),
    "M_gold": ((0.9, 0.62, 0.22), 0.25, 1.0),
    "M_red": ((0.6, 0.05, 0.04), 0.5, 0.0),
}
mats = {k: make_material(k, *v) for k, v in MATS.items()}
mats["M_led_warm"] = make_material("M_led_warm", (1, 1, 1), 0.4, 0, (1.0, 0.84, 0.66), 9.0)
mats["M_led_cool"] = make_material("M_led_cool", (1, 1, 1), 0.4, 0, (0.75, 0.88, 1.0), 4.0)
mats["M_led_dim"] = make_material("M_led_dim", (1, 1, 1), 0.4, 0, (1.0, 0.8, 0.6), 2.5)
mats["M_led_accent"] = make_material("M_led_accent", (1, 1, 1), 0.4, 0, (0.25, 0.8, 1.0), 5.0)
mats["M_led_green"] = make_material("M_led_green", (0.02, 0.1, 0.03), 0.4, 0, (0.3, 1.0, 0.45), 6.0)
mats["M_led_amber"] = make_material("M_led_amber", (0.1, 0.06, 0.02), 0.4, 0, (1.0, 0.55, 0.15), 6.0)
mats["M_screen"] = make_material("M_screen", (0.01, 0.02, 0.03), 0.3, 0, (0.3, 0.6, 0.9), 1.6)
# nameplates: brushed steel with dark engraved lettering (added last so older material slots keep their index)
mats["M_plate"] = make_material("M_plate", (0.62, 0.64, 0.66), 0.4, 1.0)
mats["M_engrave"] = make_material("M_engrave", (0.02, 0.022, 0.026), 0.5, 0.0)
NAMES = list(mats)

main = Builder(NAMES)    # walls, floor, pedestals: lightmapped
detail = Builder(NAMES)  # small parts: lit by the reflection probe only
ceil = Builder(NAMES)    # ceiling: lightmapped, hidden by the app in the cutaway overview
ceil_d = Builder(NAMES)  # ceiling small parts


# ---------------------------------------------------------------- frames + helpers
def facet_frame(k, d=0.0):
    """Facet k (angle k*30 deg from -z, clockwise from above): x along the wall to the right as seen
    from the centre, y up, z towards the centre. Origin on the wall face at y = 0."""
    t = math.radians(k * STEP)
    ez = Vector((-math.sin(t), 0, math.cos(t)))
    ex = Vector((math.cos(t), 0, math.sin(t)))
    o = Vector((A * math.sin(t), 0, -A * math.cos(t))) + ez * d
    return frame(o, ex, (0, 1, 0), ez)


def rib_frame(k):
    t = math.radians((k + 0.5) * STEP)
    u = Vector((math.sin(t), 0, -math.cos(t)))
    return frame(u * RV, (math.cos(t), 0, math.sin(t)), (0, 1, 0), -u)


def poly_pt(apothem, k, ang):
    """Point on the 12-gon of the given apothem, on facet k, at polar angle ang (deg)."""
    t = math.radians(ang)
    r = apothem / math.cos(math.radians(ang - k * STEP))
    return (r * math.sin(t), -r * math.cos(t))


def prism(B, poly, y0, y1, mat):
    n = len(poly)
    verts = [(x, y0, z) for x, z in poly] + [(x, y1, z) for x, z in poly]
    faces = [tuple(range(n)), tuple(range(n, 2 * n))] + [(i, (i + 1) % n, (i + 1) % n + n, i + n) for i in range(n)]
    B.add_raw(verts, faces, Matrix(), mat, closed=True)


def plate(B, k, a0, a1, ang0, ang1, y0, y1, mat, gap=0.005):
    """Trapezoid slab on facet k between two apothems and two polar angles."""
    da = math.degrees(gap / ((a0 + a1) / 2))
    pts = [poly_pt(a0 + gap, k, ang0 + da), poly_pt(a0 + gap, k, ang1 - da), poly_pt(a1 - gap, k, ang1 - da), poly_pt(a1 - gap, k, ang0 + da)]
    prism(B, pts, y0, y1, mat)


def extrude(B, M, profile, x0, x1, mat):
    """Prism along local x from a closed (z, y) profile."""
    n = len(profile)
    verts = [(x0, y, z) for z, y in profile] + [(x1, y, z) for z, y in profile]
    faces = [tuple(range(n)), tuple(range(n, 2 * n))] + [(i, (i + 1) % n, (i + 1) % n + n, i + n) for i in range(n)]
    B.add_raw(verts, faces, M, mat, closed=True)


def plate_with_hole(B, M, hole, cx, cy, x0, x1, y0, y1, mat):
    """Wall plate (local z = 0, facing +z) over a rectangle with a hole; hole points around (cx, cy)."""
    verts, faces = [], []
    for hx, hy in hole:
        d = Vector((hx - cx, hy - cy)).normalized()
        ts = []
        if d.x > 1e-9:
            ts.append((x1 - cx) / d.x)
        if d.x < -1e-9:
            ts.append((x0 - cx) / d.x)
        if d.y > 1e-9:
            ts.append((y1 - cy) / d.y)
        if d.y < -1e-9:
            ts.append((y0 - cy) / d.y)
        t = min(ts)
        verts += [(hx, hy, 0), (cx + d.x * t, cy + d.y * t, 0)]
    n = len(hole)
    for i in range(n):
        i2 = (i + 1) % n
        faces.append((i * 2, i * 2 + 1, i2 * 2 + 1, i2 * 2))
    start = len(B.f)
    B.add_raw(verts, faces, M, mat)
    nz = M.to_3x3() @ Vector((0, 0, 1))
    B.orient(start, lambda c: nz)
    # the plate corners the rays never reach (rectangle corners) are covered by the ribs / soffit


def handrail(B, M, length, z0=0.03):
    zb = z0 + 0.055
    B.cyl(M @ T(0, 0, zb) @ R("Y", 90), 0.0155, length - 0.06, "M_handrail", seg=20)
    for s in (-1, 1):
        B.cyl(M @ T(s * (length / 2 - 0.03), 0, zb) @ R("Y", 90), 0.0155, 0.03, "M_handrail", seg=20, r2=0.0125)
        x = s * (length / 2 - 0.07)
        B.cyl(M @ T(x, 0, z0 + 0.03), 0.013, 0.05, "M_handrail", seg=16, r2=0.011)
        B.box(M @ T(x, 0, z0 + 0.004), (0.05, 0.034, 0.008), "M_handrail", bevel=0.003)


def fastener(B, M, x, y, z):
    B.cyl(M @ T(x, y, z), 0.0075, 0.005, "M_polymer", seg=14, bevel=0.0015)
    B.box(M @ T(x, y, z + 0.0026) @ R("Z", rng.uniform(0, 180)), (0.011, 0.0018, 0.0012), "M_label")


def placard(B, M, x, y, z, text, size=0.013, w=None):
    """Brushed-steel nameplate (z = its back face) with the lettering stamped on it in dark ink."""
    w = w or (len(text) * size * 0.62 + 0.02)
    B.box(M @ T(x, y, z + 0.0008), (w, size * 1.7, 0.0016), "M_plate", bevel=0.0006, seg=1)
    for sx in (-1, 1):
        B.cyl(M @ T(x + sx * (w / 2 - size * 0.45), y, z + 0.0019), size * 0.11, 0.0007, "M_plate", seg=10, bevel=0.0002)  # low-key rivet
    B.text(M @ T(x, y, z + 0.0018), text, size, "M_engrave")


LOCKER_LABELS = ["SPARE FILTERS", "HYGIENE", "CABLE STOW", "SAMPLE BAGS", "EAR PLUGS", "WIPES", "LENSES",
                 "BATTERIES", "CREW PREF", "IFM TOOLS", "FOOD WK3", "RETURN", "MEDS B", "SOCKS", "O2 MASKS", "SPARES"]


def locker(M, x, y, w, h, mat="M_paint"):
    main.box(M @ T(x, y, 0.038), (w, h, 0.028), mat, bevel=0.006, seg=3)
    main.box(M @ T(x, y, 0.0525), (w - 0.07, h - 0.07, 0.004), mat, bevel=0.0018, seg=1)
    hx = x + w / 2 - 0.045
    detail.box(M @ T(hx, y, 0.0535), (0.03, 0.085, 0.004), "M_polymer", bevel=0.0012, seg=1)
    detail.box(M @ T(hx, y, 0.0585), (0.011, 0.065, 0.007), "M_brushed", bevel=0.0028, seg=2)
    for sy in (-1, 1):
        fastener(detail, M, x - w / 2 + 0.028, y + sy * (h / 2 - 0.03), 0.0545)
    if rng.random() < 0.6:
        placard(detail, M, x - 0.02, y + h / 2 - 0.05, 0.0555, rng.choice(LOCKER_LABELS))
    led = "M_led_amber" if rng.random() < 0.2 else "M_led_green"
    detail.cyl(M @ T(x - w / 2 + 0.03, y - h / 2 + 0.03, 0.0545), 0.0035, 0.004, led, seg=10)


def vent_panel(M, x, y, w, h):
    main.box(M @ T(x, y, 0.036), (w, h, 0.024), "M_paintcool", bevel=0.005, seg=2)
    main.box(M @ T(x, y, 0.049), (w - 0.05, h - 0.05, 0.004), "M_vent", bevel=0.0015, seg=1)
    for sx in (-1, 1):
        for sy in (-1, 1):
            fastener(detail, M, x + sx * (w / 2 - 0.014), y + sy * (h / 2 - 0.014), 0.049)


def connector_strip(M, x, y, w, h=0.14):
    main.box(M @ T(x, y, 0.036), (w, h, 0.024), "M_paintcool", bevel=0.005, seg=2)
    n = 5
    for i in range(n):
        cx = x - w / 2 + 0.07 + i * (w - 0.2) / (n - 1)
        detail.cyl(M @ T(cx, y + 0.012, 0.056), 0.019, 0.018, "M_brushed", seg=20, bevel=0.002)
        detail.cyl(M @ T(cx, y + 0.012, 0.064), 0.012, 0.004, "M_polymer", seg=16)
        detail.cyl(M @ T(cx, y + 0.012, 0.0665), 0.004, 0.003, "M_gold", seg=8)
        placard(detail, M, cx, y - 0.04, 0.0485, f"J{i + 1}", size=0.01)


# ---------------------------------------------------------------- cargo bags (cloth sim)
def make_bags():
    out = []
    scene.gravity = (0, 0, 0)
    for k, (bw, bh, bd) in enumerate([(0.42, 0.26, 0.2), (0.34, 0.22, 0.16), (0.28, 0.3, 0.17)]):
        bpy.ops.mesh.primitive_cube_add(size=1)
        ob = bpy.context.active_object
        ob.scale = (bw * 0.94, bh * 0.94, bd * 0.94)
        bpy.ops.object.transform_apply(scale=True)
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.bevel(offset=0.025, segments=3, affect="EDGES")
        bpy.ops.mesh.subdivide(number_cuts=6)
        bpy.ops.object.mode_set(mode="OBJECT")
        cl = ob.modifiers.new("cloth", "CLOTH")
        st = cl.settings
        st.quality = 6
        st.mass = 0.2
        st.use_pressure = True
        st.uniform_pressure_force = 6 + k * 2
        st.shrink_min = 0.06
        st.tension_stiffness = 8
        st.compression_stiffness = 8
        st.bending_stiffness = 0.6
        st.effector_weights.gravity = 0
        cl.point_cache.frame_start = 1
        cl.point_cache.frame_end = 30
        for f in range(1, 31):
            scene.frame_set(f)
        dg = bpy.context.evaluated_depsgraph_get()
        me = ob.evaluated_get(dg).to_mesh()
        out.append(([tuple(v.co) for v in me.vertices], [tuple(p.vertices) for p in me.polygons], (bw, bh, bd)))
        ob.evaluated_get(dg).to_mesh_clear()
        bpy.data.objects.remove(ob)
    scene.frame_set(1)
    return out


BAGS = make_bags()


def bag(M, x, y, k, tilt=0.0):
    verts, faces, (bw, bh, bd) = BAGS[k]
    zmin = min(v[2] for v in verts)
    Mb = M @ T(x, y, 0.03) @ R("Z", tilt)
    main.add_raw([(vx, vy, vz - zmin) for vx, vy, vz in verts], faces, Mb, "M_fabric")
    for sx in (-0.28, 0.28):
        main.box(Mb @ T(sx * bw, 0, bd * 0.5), (0.032, bh * 1.02, bd * 1.04), "M_strap", bevel=0.01, seg=2)
    detail.tube([(-0.05, bh / 2 * 0.9, bd * 0.6), (-0.04, bh / 2 + 0.03, bd * 0.6), (0.04, bh / 2 + 0.03, bd * 0.6), (0.05, bh / 2 * 0.9, bd * 0.6)],
                0.006, "M_strap", rseg=8, M=Mb)
    if rng.random() < 0.7:
        placard(detail, Mb, -bw * 0.1, bh * 0.15, bd * 0.98 + 0.002, rng.choice(["CTB 1.0", "CTB 0.5", "FOOD", "SPARES", "STOW AFT", "CREW B"]))
    return bd


# ---------------------------------------------------------------- bay parts (facet-local)
KICK_TOP = FLOOR + 0.42
MID0, MID1 = -0.8, 0.8
UP0, UP1 = 0.84, 1.40
SOFF = 1.42


def shell(M):
    main.box(M @ T(0, (FLOOR + CEIL) / 2, -0.03), (FW + 0.02, CEIL - FLOOR, 0.02), "M_shell")


def kick(M, w=BW):
    main.box(M @ T(0, FLOOR + 0.24, 0.025), (w, 0.36, 0.05), "M_paintcool", bevel=0.006, seg=2)
    main.box(M @ T(0, FLOOR + 0.26, 0.051), (w - 0.36, 0.16, 0.004), "M_vent", bevel=0.0015, seg=1)
    # toe recess with a cool strip washing the floor
    main.box(M @ T(0, FLOOR + 0.03, 0.01), (w, 0.06, 0.02), "M_graphite")
    main.box(M @ T(0, FLOOR + 0.062, 0.046), (w - 0.04, 0.008, 0.012), "M_led_cool", bevel=0.002, seg=1)
    for sx in (-1, 1):
        for y in (FLOOR + 0.1, FLOOR + 0.38):
            fastener(detail, M, sx * (w / 2 - 0.03), y, 0.052)


def soffit(M, title=None):
    main.box(M @ T(0, (SOFF + CEIL) / 2, 0.12), (BW, CEIL - SOFF, 0.24), "M_paintcool", bevel=0.01, seg=3)
    main.box(M @ T(0, SOFF - 0.004, 0.05), (BW - 0.08, 0.008, 0.045), "M_led_warm", bevel=0.002, seg=1)
    if title:
        pw = len(title) * 0.032 * 0.62 + 0.09
        placard(detail, M, -BW / 2 + 0.06 + pw / 2, SOFF + 0.09, 0.24, title, size=0.032, w=pw)
        detail.cyl(M @ T(BW / 2 - 0.07, SOFF + 0.09, 0.2435), 0.006, 0.004, "M_led_accent", seg=12)


def upper(M):
    main.box(M @ T(0, (UP0 + UP1) / 2, 0.012), (BW, UP1 - UP0 + 0.02, 0.024), "M_graphite", bevel=0.003, seg=1)
    lw = BW / 2 - 0.012
    for j in (-1, 1):
        locker(M, j * (lw / 2 + 0.006), (UP0 + UP1) / 2, lw, UP1 - UP0 - 0.02, "M_paint" if rng.random() < 0.8 else "M_paintcool")


def backdrop(M):
    main.box(M @ T(0, 0, 0.012), (BW, MID1 - MID0, 0.024), "M_graphite", bevel=0.004, seg=2)
    # raised closeout panels in a 2 x 3 grid with shadow gaps
    pw, ph_ = (BW - 0.1) / 2, (MID1 - MID0 - 0.08) / 3
    for i in range(2):
        for j in range(3):
            x, y = -BW / 2 + 0.05 + pw * (i + 0.5), MID0 + 0.04 + ph_ * (j + 0.5)
            main.box(M @ T(x, y, 0.028), (pw - 0.014, ph_ - 0.014, 0.01), "M_graphite", bevel=0.003, seg=2)
            for sx in (-1, 1):
                for sy in (-1, 1):
                    fastener(detail, M, x + sx * (pw / 2 - 0.03), y + sy * (ph_ / 2 - 0.03), 0.0335)
    for sx in (-1, 1):
        main.box(M @ T(sx * (BW / 2 - 0.02), 0, 0.034), (0.012, MID1 - MID0 - 0.06, 0.008), "M_paintcool", bevel=0.002, seg=1)
        for y in (MID0 + 0.05, 0, MID1 - 0.05):
            fastener(detail, M, sx * (BW / 2 - 0.05), y, 0.032)


def mid_closeout(M):
    main.box(M @ T(0, 0, 0.015), (BW, MID1 - MID0, 0.03), "M_paint", bevel=0.004, seg=2)


# ---------------------------------------------------------------- bays
for k, kind in BAYS.items():
    M = facet_frame(k)
    if kind == "window":
        # wall plate around the opening, deep reveal, raised frame, seal, bolts
        hp, hn = rounded_rect(WIN_W, WIN_H, WIN_R, seg=10)
        hp = [(x, y + WIN_Y) for x, y in hp]
        plate_with_hole(main, M, hp, 0, WIN_Y, -FW / 2 - 0.01, FW / 2 + 0.01, FLOOR, CEIL, "M_paintcool")
        Mw = M @ T(0, WIN_Y, 0)
        hp0, hn0 = rounded_rect(WIN_W, WIN_H, WIN_R, seg=10)
        main.sweep(hp0, hn0, [(-0.02, -0.02), (-0.02, -0.32), (0.04, -0.32), (0.04, 0.0), (0.0, 0.0)], Mw, "M_graphite")
        main.sweep(hp0, hn0, [(-0.05, 0.0), (0.12, 0.0), (0.12, 0.025), (0.08, 0.055), (-0.035, 0.055), (-0.05, 0.035)], Mw, "M_paintcool")
        main.sweep(hp0, hn0, [(-0.02, -0.25), (-0.05, -0.25), (-0.05, -0.28), (-0.02, -0.28)], Mw, "M_rubber")
        # bolts around the frame
        per = sum(math.dist(hp0[i], hp0[(i + 1) % len(hp0)]) for i in range(len(hp0)))
        acc, step = 0.0, per / 28
        for i in range(len(hp0)):
            p0, p1 = hp0[i], hp0[(i + 1) % len(hp0)]
            seg_len = math.dist(p0, p1)
            while acc <= seg_len:
                t = acc / seg_len if seg_len else 0
                nx, ny = hn0[i]
                x, y = p0[0] + (p1[0] - p0[0]) * t + nx * 0.065, p0[1] + (p1[1] - p0[1]) * t + ny * 0.065
                detail.cyl(Mw @ T(x, y, 0.058), 0.009, 0.008, "M_brushed", seg=6, bevel=0.0015)
                acc += step
            acc -= seg_len
        # console under the windows: sloped desk with dim screens and switch banks
        prof = [(0.0, FLOOR), (0.44, FLOOR), (0.44, -0.9), (0.52, -0.86), (0.52, -0.82), (0.1, -0.71), (0.0, -0.71)]
        extrude(main, M, prof, -FW / 2 - 0.02, FW / 2 + 0.02, "M_paintcool")
        extrude(main, M, [(0.42, FLOOR), (0.47, FLOOR), (0.47, FLOOR + 0.06), (0.42, FLOOR + 0.06)], -FW / 2 - 0.02, FW / 2 + 0.02, "M_graphite")
        main.box(M @ T(0, FLOOR + 0.07, 0.442), (FW - 0.1, 0.008, 0.012), "M_led_cool", bevel=0.002, seg=1)
        sl = Vector((-0.42, 0.11)).normalized()          # (dz, dy) up the slope towards the wall
        nrm = Vector((0, 0.42, 0.11)).normalized()
        Ms = M @ frame((0, -0.765, 0.31), (1, 0, 0), (0, sl.y, sl.x), (0, nrm.y, nrm.z))
        main.box(Ms @ T(0, 0, 0.004), (FW - 0.06, 0.4, 0.008), "M_graphite", bevel=0.003, seg=1)
        for sx in (-0.42, 0.0, 0.42):
            main.box(Ms @ T(sx, 0.04, 0.01), (0.3, 0.17, 0.006), "M_polymer", bevel=0.004, seg=2)
            main.box(Ms @ T(sx, 0.04, 0.0135), (0.27, 0.145, 0.002), "M_screen")
        for sx in (-0.21, 0.21):
            for i in range(6):
                for j in range(2):
                    led = "M_led_amber" if rng.random() < 0.15 else "M_led_green" if rng.random() < 0.5 else "M_polymer"
                    detail.box(Ms @ T(sx - 0.06 + i * 0.024, -0.03 + j * 0.03, 0.012), (0.016, 0.016, 0.008), led, bevel=0.002, seg=1)
                    if led == "M_polymer":
                        detail.box(Ms @ T(sx - 0.06 + i * 0.024, -0.03 + j * 0.03, 0.017), (0.012, 0.012, 0.004), "M_brushed", bevel=0.0015, seg=1)
        for sx in (-0.7, 0.7):
            detail.cyl(Ms @ T(sx, 0.06, 0.018), 0.02, 0.022, "M_brushed", seg=24, bevel=0.003)
        handrail(main, M @ T(0, -0.66, 0.06), FW - 0.4, z0=0.0)
        soffit(M, "OBSERVATION" if k == 0 else None)
    elif kind == "hatch":
        hole = [(HATCH_R * math.cos(math.tau * i / 96), HATCH_Y + HATCH_R * math.sin(math.tau * i / 96)) for i in range(96)]
        plate_with_hole(main, M, hole, 0, HATCH_Y, -FW / 2 - 0.01, FW / 2 + 0.01, FLOOR, CEIL, "M_paintcool")
        Mh = M @ T(0, HATCH_Y, 0)
        main.lathe(Mh, [(0.95, 0.0), (1.06, 0.0), (1.06, 0.04), (1.0, 0.085), (0.84, 0.085), (0.8, 0.05), (0.8, -0.08), (0.95, -0.08)], "M_paintcool", seg=128)
        nseg = 40
        for i in range(nseg):
            a0, a1 = math.tau * i / nseg, math.tau * (i + 1) / nseg
            verts = [(0.85 * math.cos(a0), 0.85 * math.sin(a0), 0.0865), (0.99 * math.cos(a0), 0.99 * math.sin(a0), 0.0865),
                     (0.99 * math.cos(a1), 0.99 * math.sin(a1), 0.0865), (0.85 * math.cos(a1), 0.85 * math.sin(a1), 0.0865)]
            start = len(main.f)
            main.add_raw(verts, [(0, 1, 2, 3)], Mh, "M_hazard_y" if i % 2 else "M_hazard_k")
            nz = Mh.to_3x3() @ Vector((0, 0, 1))
            main.orient(start, lambda c, nz=nz: nz)
        main.torus(Mh @ T(0, 0, 0.03), 1.1, 0.012, "M_led_accent", seg=128, rseg=8)
        main.cyl(Mh @ T(0, 0, -0.07), 0.8, 0.03, "M_paint", seg=96, bevel=0.006)
        for i in range(6):
            main.box(Mh @ R("Z", 30 + i * 60) @ T(0.45, 0, -0.045), (0.62, 0.06, 0.03), "M_paint", bevel=0.008, seg=2)
        main.cyl(Mh @ T(0, 0, -0.03), 0.16, 0.05, "M_paintcool", seg=48, bevel=0.01)
        main.torus(Mh @ T(0, 0, 0.04), 0.24, 0.018, "M_brushed", seg=64, rseg=10)
        for i in range(3):
            main.box(Mh @ R("Z", 90 + i * 120) @ T(0.12, 0, 0.03), (0.24, 0.022, 0.016), "M_brushed", bevel=0.005, seg=2)
        main.cyl(Mh @ T(0, 0, 0.035), 0.05, 0.04, "M_brushed", seg=24, bevel=0.005)
        main.lathe(Mh @ T(0.42, 0.38, -0.055), [(0.1, 0.0), (0.1, 0.02), (0.085, 0.03), (0.07, 0.03), (0.065, 0.0)], "M_polymer", seg=48)
        main.cyl(Mh @ T(0.42, 0.38, -0.05), 0.066, 0.004, "M_glass_dark", seg=48)
        detail.cyl(Mh @ T(-0.5, 0.5, -0.04), 0.035, 0.04, "M_red", seg=6, bevel=0.003)
        placard(detail, Mh, 0, 0.6, -0.054, "AIRLOCK A1", size=0.03)
        placard(detail, Mh, 0, -0.55, -0.054, "CHECK DELTA-P BEFORE OPENING", size=0.014)
        for s in (-1, 1):
            handrail(main, M @ T(s * 0.68, HATCH_Y, 0.0) @ R("Z", 90), 0.6, z0=0.0)
        main.box(M @ T(0, (FLOOR + CEIL) / 2, -0.4), (FW + 0.02, CEIL - FLOOR, 0.02), "M_shell")
        kick(M)
        soffit(M, TITLES[kind])
    else:
        shell(M)
        kick(M)
        upper(M)
        soffit(M, TITLES[kind])
        if kind in STATION_BAYS:
            backdrop(M)
            if kind != "board":
                handrail(main, M @ T(0, MID0 + 0.03, 0.03), 0.9, z0=0.0)
        elif kind == "stow":
            mid_closeout(M)
            depth = 0
            for (x, y) in [(-0.35, 0.38), (0.32, 0.4), (-0.3, -0.32), (0.34, -0.36)]:
                depth = max(depth, bag(M, x + rng.uniform(-0.04, 0.04), y, rng.randrange(3), rng.uniform(-8, 8)))
            for yy in (0.52, -0.2):
                pts = [(x, yy + 0.012 * math.sin(x * 9), 0.05 + (depth + 0.01) * (math.exp(-(((x + 0.33) / 0.2) ** 4)) + math.exp(-(((x - 0.33) / 0.2) ** 4)))) for x in [i * 0.04 - 0.72 for i in range(37)]]
                detail.tube(pts, 0.0045, "M_cable_blue", rseg=6, M=M)
                for x in (-0.73, 0.73):
                    detail.box(M @ T(x, yy, 0.045), (0.02, 0.03, 0.02), "M_polymer", bevel=0.004)
            handrail(main, M @ T(0, MID0 + 0.03, 0.03), 0.9, z0=0.0)
        elif kind == "equip":
            main.box(M @ T(0, 0, 0.012), (BW, MID1 - MID0, 0.024), "M_graphite", bevel=0.003, seg=1)
            vent_panel(M, 0, MID1 - 0.2, BW - 0.04, 0.36)
            connector_strip(M, 0, MID1 - 0.48, BW - 0.04)
            lh = (MID1 - MID0 - 0.6) / 2
            for i in range(2):
                for j in (-1, 1):
                    locker(M, j * (BW / 4), MID0 + 0.02 + lh * (i + 0.5), BW / 2 - 0.02, lh - 0.012)

# ---------------------------------------------------------------- corner ribs (and window mullions)
for k in range(N):
    Mr = rib_frame(k)
    main.box(Mr @ T(0, (FLOOR + CEIL) / 2, 0.05), (RIBW, CEIL - FLOOR, 0.3), "M_graphite", bevel=0.012, seg=3)
    main.box(Mr @ T(0, 0.2, 0.2), (0.07, 2.1, 0.012), "M_polymer", bevel=0.003, seg=1)
    main.box(Mr @ T(0, 0.2, 0.205), (0.022, 2.04, 0.008), "M_led_accent", bevel=0.002, seg=1)
    for y in (FLOOR + 0.12, CEIL - 0.12):
        main.box(Mr @ T(0, y, 0.205), (RIBW + 0.03, 0.16, 0.04), "M_brushed", bevel=0.008, seg=2)
        for sx in (-1, 1):
            for sy in (-1, 1):
                detail.cyl(Mr @ T(sx * 0.08, y + sy * 0.05, 0.226), 0.008, 0.006, "M_polymer", seg=6, bevel=0.0015)

# ---------------------------------------------------------------- floor
prism(main, [poly_pt(A + 0.3, k, (k + 0.5) * STEP) for k in range(N)], FLOOR - 0.09, FLOOR - 0.05, "M_shell")
for k in range(N):
    t = k * STEP
    for a0, a1 in ((1.55, 2.35), (2.35, A + 0.02)):
        for ang0, ang1 in ((t - STEP / 2, t), (t, t + STEP / 2)):
            plate(main, k, a0, a1, ang0, ang1, FLOOR - 0.04, FLOOR, "M_floor")
    # anti-slip inset strips across each outer plate
    for ang in (t - STEP / 4, t + STEP / 4):
        for a in (2.6, 2.95):
            tt = math.radians(ang)
            p = Vector(poly_pt(a, k, ang))
            Mf = frame((p.x, FLOOR + 0.002, p.y), (math.cos(tt), 0, math.sin(tt)), (0, 0, 1), (0, 1, 0))
            detail.box(Mf, (0.5, 0.04, 0.004), "M_polymer", bevel=0.001, seg=1)
    # grating ring and its light line
    plate(main, k, 1.05, 1.53, t - STEP / 2, t + STEP / 2, FLOOR - 0.035, FLOOR - 0.01, "M_vent", gap=0.003)
    plate(main, k, 1.53, 1.56, t - STEP / 2, t + STEP / 2, FLOOR - 0.04, FLOOR + 0.002, "M_led_accent", gap=0.0)
# central platform and body pedestal
main.lathe(T(0, FLOOR, 0) @ R("X", -90), [(0.0, 0.0), (1.05, 0.0), (1.05, 0.05), (1.03, 0.07), (0.0, 0.07)], "M_paintcool", seg=96)
main.lathe(T(0, FLOOR, 0) @ R("X", -90), [(0.99, 0.07), (1.0, 0.07), (1.0, 0.075), (0.99, 0.075)], "M_led_cool", seg=96)
main.lathe(T(0, FLOOR, 0) @ R("X", -90), [(0.0, 0.07), (0.6, 0.07), (0.6, 0.075), (0.0, 0.075)], "M_graphite", seg=96)
ph = BODY_TOP - (FLOOR + 0.075)
main.lathe(T(0, FLOOR + 0.075, 0) @ R("X", -90),
           [(0.0, 0.0), (0.4, 0.0), (0.4, 0.04), (0.3, 0.09), (0.25, ph * 0.5), (0.27, ph - 0.06), (0.3, ph - 0.03), (0.3, ph), (0.0, ph)],
           "M_graphite", seg=96)
for f in (0.3, 0.5, 0.7):
    main.lathe(T(0, FLOOR + 0.075, 0) @ R("X", -90), [(0.24, ph * f), (0.265, ph * f), (0.265, ph * f + 0.01), (0.24, ph * f + 0.01)], "M_led_accent", seg=96)
main.torus(T(0, BODY_TOP + 0.002, 0) @ R("X", 90), 0.28, 0.008, "M_brushed", seg=96, rseg=8)
# evidence plinth with a spine up to the ceiling behind the chamber
ex, ez = EVID
eh = EVID_TOP - FLOOR
main.lathe(T(ex, FLOOR, ez) @ R("X", -90),
           [(0.0, 0.0), (0.46, 0.0), (0.46, 0.05), (0.36, 0.1), (0.3, eh * 0.5), (0.36, eh - 0.04), (0.38, eh), (0.0, eh)], "M_graphite", seg=96)
for f in (0.4, 0.62):
    main.lathe(T(ex, FLOOR, ez) @ R("X", -90), [(0.33, eh * f), (0.345, eh * f), (0.345, eh * f + 0.012), (0.33, eh * f + 0.012)], "M_led_accent", seg=96)

# ---------------------------------------------------------------- ceiling (separate objects)
for k in range(N):
    t = k * STEP
    for ang0, ang1 in ((t - STEP / 2, t), (t, t + STEP / 2)):
        plate(ceil, k, 2.0, A + 0.05, ang0, ang1, CEIL, CEIL + 0.04, "M_paint" if (k % 2) else "M_paintcool")
    # recessed downlight over each bay
    p = Vector(poly_pt(2.55, k, t))
    ceil.cyl(T(p.x, CEIL - 0.004, p.y) @ R("X", 90), 0.075, 0.012, "M_brushed", seg=32, bevel=0.003)
    ceil.cyl(T(p.x, CEIL - 0.011, p.y) @ R("X", 90), 0.055, 0.004, "M_led_warm", seg=32)
    # radial beam from the corner rib to the light well
    tr = math.radians((k + 0.5) * STEP)
    u = Vector((math.sin(tr), 0, -math.cos(tr)))
    r0, r1 = 2.0 / math.cos(math.pi / N), RV - 0.2
    Mb = frame(u * ((r0 + r1) / 2) + Vector((0, CEIL - 0.07, 0)), (math.cos(tr), 0, math.sin(tr)), (0, 1, 0), u)
    ceil.box(Mb, (0.14, 0.14, r1 - r0), "M_graphite", bevel=0.01, seg=2)
    ceil.box(Mb @ T(0, -0.071, 0), (0.03, 0.004, r1 - r0 - 0.1), "M_led_accent", bevel=0.001, seg=1)
    for d in (-0.4, 0.0, 0.4):
        ceil_d.cyl(Mb @ T(0.071, 0, d) @ R("Y", 90), 0.009, 0.006, "M_brushed", seg=6)
    # light well: wall, cove ledge with uplight, top
    plate(ceil, k, 1.95, 2.0, t - STEP / 2, t + STEP / 2, CEIL - 0.02, WELL, "M_paintcool", gap=0.0)
    plate(ceil, k, 1.72, 2.0, t - STEP / 2, t + STEP / 2, CEIL - 0.1, CEIL - 0.04, "M_paintcool", gap=0.0)
    plate(ceil, k, 1.76, 1.8, t - STEP / 2, t + STEP / 2, CEIL - 0.04, CEIL - 0.03, "M_led_warm", gap=0.0)
    for ang0, ang1 in ((t - STEP / 2, t), (t, t + STEP / 2)):
        plate(ceil, k, 1.2, 1.97, ang0, ang1, WELL, WELL + 0.04, "M_paint", gap=0.004)
    Mb2 = frame(u * 1.62 + Vector((0, WELL - 0.05, 0)), (math.cos(tr), 0, math.sin(tr)), (0, 1, 0), u)
    ceil.box(Mb2, (0.1, 0.1, 0.8), "M_paintcool", bevel=0.008, seg=2)
Mc = T(0, WELL, 0) @ R("X", 90)
ceil.lathe(Mc, [(0.82, -0.04), (1.22, -0.04), (1.22, 0.05), (1.17, 0.055), (1.17, 0.035), (0.87, 0.035), (0.87, 0.055), (0.82, 0.05)], "M_brushed", seg=128)
ceil.lathe(Mc, [(0.87, 0.03), (1.17, 0.03), (1.17, 0.04), (0.87, 0.04)], "M_led_warm", seg=128)
ceil.cyl(T(0, WELL + 0.0, 0) @ R("X", 90), 0.84, 0.03, "M_graphite", seg=96)
ceil.cyl(T(0, WELL - 0.03, 0) @ R("X", 90), 0.55, 0.03, "M_vent", seg=96, bevel=0.004)
ceil.cyl(T(0, WELL - 0.06, 0) @ R("X", 90), 0.12, 0.05, "M_brushed", seg=48, bevel=0.01)
for i in range(12):
    ceil.box(T(0, WELL - 0.05, 0) @ R("Y", i * 30) @ T(0.0, 0, 0.34), (0.02, 0.03, 0.42), "M_graphite", bevel=0.004, seg=1)

# ---------------------------------------------------------------- objects
col = bpy.data.collections.new("Hub")
scene.collection.children.link(col)
main.to_object("HubMain", mats, collection=col)
detail.to_object("HubDetail", mats, collection=col)
ceil.to_object("HubCeiling", mats, collection=col)
ceil_d.to_object("HubCeilingDetail", mats, collection=col)
print("faces main", len(main.f), "detail", len(detail.f), "ceiling", len(ceil.f))
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "hub.blend"))
print("saved")
