# Geometry kit shared by the Blender build scripts. Everything is authored in three.js
# coordinates (x right, y up, z towards the hatch) and rotated to Blender's Z-up at the end,
# so the exported glTF lands exactly where the app expects it.
import math
import bmesh
import bpy
from mathutils import Matrix, Vector

TAU = math.tau


class Builder:
    """Collects primitives into flat vertex/face lists (fast), one material index per face."""

    def __init__(self, materials):
        self.mats = {m: i for i, m in enumerate(materials)}
        self.names = list(materials)
        self.v, self.f, self.fm = [], [], []

    # -- low level ---------------------------------------------------------------------------
    def add_bm(self, bm, M, mat):
        bm.verts.ensure_lookup_table()
        base = len(self.v)
        for v in bm.verts:
            self.v.append(tuple(M @ v.co))
        mi = self.mats[mat]
        for f in bm.faces:
            self.f.append(tuple(base + v.index for v in f.verts))
            self.fm.append(mi)
        bm.free()

    def add_raw(self, verts, faces, M, mat, closed=False):
        if closed:
            bm = bmesh.new()
            vs = [bm.verts.new(p) for p in verts]
            for f in faces:
                try:
                    bm.faces.new([vs[i] for i in f])
                except ValueError:
                    pass
            bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
            return self.add_bm(bm, M, mat)
        base = len(self.v)
        for p in verts:
            self.v.append(tuple(M @ Vector(p)))
        mi = self.mats[mat] if isinstance(mat, str) else None
        for k, f in enumerate(faces):
            self.f.append(tuple(base + i for i in f))
            self.fm.append(mi if mi is not None else self.mats[mat[k]])

    def orient(self, start, fn):
        """Flip faces added since `start` whose normal points away from fn(centre)."""
        for k in range(start, len(self.f)):
            f = self.f[k]
            pts = [Vector(self.v[i]) for i in f]
            n = Vector((0, 0, 0))
            for a, b in zip(pts, pts[1:] + pts[:1]):
                n += Vector(((a.y - b.y) * (a.z + b.z), (a.z - b.z) * (a.x + b.x), (a.x - b.x) * (a.y + b.y)))
            c = sum(pts, Vector()) / len(pts)
            if n.dot(fn(c)) < 0:
                self.f[k] = tuple(reversed(f))

    # -- primitives ----------------------------------------------------------------------------
    def box(self, M, size, mat, bevel=0.0, seg=2):
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=1.0)
        bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
        if bevel > 0:
            bmesh.ops.bevel(bm, geom=list(bm.edges), offset=min(bevel, min(size) * 0.45), offset_type="OFFSET",
                            segments=seg, profile=0.5, affect="EDGES", clamp_overlap=True)
        self.add_bm(bm, M, mat)

    def cyl(self, M, r, h, mat, seg=24, bevel=0.0, r2=None, cap=True):
        """Cylinder along local Z, centred."""
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=cap, cap_tris=False, segments=seg, radius1=r,
                              radius2=r if r2 is None else r2, depth=h)
        if bevel > 0 and cap:
            bm.normal_update()
            rim = [e for e in bm.edges if len(e.link_faces) == 2 and
                   e.link_faces[0].normal.angle(e.link_faces[1].normal) > 1.0]
            bmesh.ops.bevel(bm, geom=rim, offset=bevel, offset_type="OFFSET", segments=2,
                            profile=0.5, affect="EDGES", clamp_overlap=True)
        self.add_bm(bm, M, mat)

    def torus(self, M, R, r, mat, seg=48, rseg=10, arc=TAU):
        verts, faces = [], []
        closed = abs(arc - TAU) < 1e-6
        n = seg if closed else seg + 1
        for i in range(n):
            a = arc * i / seg
            c, s = math.cos(a), math.sin(a)
            for j in range(rseg):
                b = TAU * j / rseg
                rr = R + r * math.cos(b)
                verts.append((rr * c, rr * s, r * math.sin(b)))
        for i in range(seg):
            i2 = (i + 1) % n
            for j in range(rseg):
                j2 = (j + 1) % rseg
                faces.append((i * rseg + j, i2 * rseg + j, i2 * rseg + j2, i * rseg + j2))
        self.add_raw(verts, faces, M, mat, closed=True)

    def tube(self, pts, r, mat, rseg=10, M=Matrix()):
        """Tube along a polyline (list of Vector), parallel-transport frames, open ends capped."""
        pts = [Vector(p) for p in pts]
        n = len(pts)
        tang = []
        for i in range(n):
            a = pts[max(i - 1, 0)]
            b = pts[min(i + 1, n - 1)]
            tang.append((b - a).normalized())
        ref = Vector((0, 1, 0)) if abs(tang[0].y) < 0.9 else Vector((1, 0, 0))
        nrm = tang[0].cross(ref).normalized()
        verts, faces = [], []
        for i in range(n):
            if i > 0:
                axis = tang[i - 1].cross(tang[i])
                if axis.length > 1e-6:
                    ang = tang[i - 1].angle(tang[i])
                    nrm = (Matrix.Rotation(ang, 3, axis.normalized()) @ nrm).normalized()
            bin_ = tang[i].cross(nrm)
            for j in range(rseg):
                b = TAU * j / rseg
                verts.append(tuple(pts[i] + (nrm * math.cos(b) + bin_ * math.sin(b)) * r))
        for i in range(n - 1):
            for j in range(rseg):
                j2 = (j + 1) % rseg
                faces.append((i * rseg + j, (i + 1) * rseg + j, (i + 1) * rseg + j2, i * rseg + j2))
        faces.append(tuple(range(rseg))[::-1])
        faces.append(tuple((n - 1) * rseg + j for j in range(rseg)))
        self.add_raw(verts, faces, M, mat, closed=True)

    def lathe(self, M, profile, mat, seg=96):
        """Revolve a (radius, z) profile around local Z."""
        profile = list(profile) + [profile[0]]
        out2 = _profile_out(profile)
        verts, faces, want = [], [], []
        m = len(profile)
        for i in range(seg):
            a = TAU * i / seg
            for r, z in profile:
                verts.append((r * math.cos(a), r * math.sin(a), z))
        for i in range(seg):
            i2 = (i + 1) % seg
            a = TAU * (i + 0.5) / seg
            for j in range(m - 1):
                faces.append((i * m + j, i2 * m + j, i2 * m + j + 1, i * m + j + 1))
                od, oz = out2[j]
                want.append(M.to_3x3() @ Vector((math.cos(a) * od, math.sin(a) * od, oz)))
        start = len(self.f)
        self.add_raw(verts, faces, M, mat)
        self._orient_list(start, want)

    def sweep(self, path, normals, profile, M, mat, closed=True):
        """Sweep a 2D profile (d outward along normal, z) along a closed planar path in local XY."""
        profile = list(profile) + [profile[0]]
        out2 = _profile_out(profile)
        verts, faces, want = [], [], []
        m = len(profile)
        n = len(path)
        for p, nn in zip(path, normals):
            for d, z in profile:
                verts.append((p[0] + nn[0] * d, p[1] + nn[1] * d, z))
        for i in range(n if closed else n - 1):
            i2 = (i + 1) % n
            nx, ny = (normals[i][0] + normals[i2][0]), (normals[i][1] + normals[i2][1])
            for j in range(m - 1):
                faces.append((i * m + j, i2 * m + j, i2 * m + j + 1, i * m + j + 1))
                od, oz = out2[j]
                want.append(M.to_3x3() @ Vector((nx * od, ny * od, oz)))
        start = len(self.f)
        self.add_raw(verts, faces, M, mat)
        self._orient_list(start, want)

    def _orient_list(self, start, want):
        for k, w in enumerate(want):
            f = self.f[start + k]
            pts = [Vector(self.v[i]) for i in f]
            n = (pts[1] - pts[0]).cross(pts[2] - pts[0])
            if n.length < 1e-12:
                n = (pts[2] - pts[0]).cross(pts[3] - pts[0]) if len(pts) > 3 else n
            if n.dot(w) < 0:
                self.f[start + k] = tuple(reversed(f))

    def text(self, M, body, size, mat, align="CENTER"):
        cu = bpy.data.curves.new("txt", "FONT")
        cu.body = body
        cu.size = size
        cu.align_x = align
        cu.align_y = "CENTER"
        ob = bpy.data.objects.new("txt", cu)
        bpy.context.scene.collection.objects.link(ob)
        dg = bpy.context.evaluated_depsgraph_get()
        ev = ob.evaluated_get(dg)
        me = ev.to_mesh()
        verts = [tuple(v.co) for v in me.vertices]
        faces = [tuple(p.vertices) for p in me.polygons]
        ev.to_mesh_clear()
        bpy.data.objects.remove(ob)
        bpy.data.curves.remove(cu)
        self.add_raw(verts, faces, M, mat)

    # -- output --------------------------------------------------------------------------------
    def to_object(self, name, materials, uv_scale=1 / 0.6, collection=None):
        me = bpy.data.meshes.new(name)
        me.from_pydata(self.v, [], self.f)
        me.update(calc_edges=True)
        for mname in self.names:
            me.materials.append(materials[mname])
        me.polygons.foreach_set("material_index", self.fm)
        # UV0: box projection in metres (world-scale tiling textures)
        bm = bmesh.new()
        bm.from_mesh(me)
        uv = bm.loops.layers.uv.new("UVMap")
        for f in bm.faces:
            n = f.normal
            ax = max(range(3), key=lambda k: abs(n[k]))
            for lo in f.loops:
                c = lo.vert.co
                if ax == 0:
                    u, v = c.z * (1 if n.x < 0 else -1), c.y
                elif ax == 1:
                    u, v = c.x, c.z * (1 if n.y < 0 else -1)
                else:
                    u, v = c.x * (1 if n.z > 0 else -1), c.y
                lo[uv].uv = (u * uv_scale, v * uv_scale)
        # three.js coords -> Blender Z-up
        bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=Matrix.Rotation(math.radians(90), 3, "X"), verts=bm.verts)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
        bm.to_mesh(me)
        bm.free()
        for p in me.polygons:
            p.use_smooth = True
        me.set_sharp_from_angle(angle=math.radians(48))
        ob = bpy.data.objects.new(name, me)
        (collection or bpy.context.scene.collection).objects.link(ob)
        wn = ob.modifiers.new("wn", "WEIGHTED_NORMAL")
        wn.keep_sharp = True
        wn.weight = 50
        return ob


def _profile_out(profile):
    """Outward 2D normal (d, z) of each segment of a closed profile polygon."""
    area = sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(profile, profile[1:]))
    out = []
    for a, b in zip(profile, profile[1:]):
        dd, dz = b[0] - a[0], b[1] - a[1]
        out.append((dz, -dd) if area > 0 else (-dz, dd))
    return out


def frame(origin, ex, ey, ez):
    """4x4 from an origin and three basis vectors (columns)."""
    M = Matrix.Identity(4)
    for i in range(3):
        M[i][0], M[i][1], M[i][2] = ex[i], ey[i], ez[i]
        M[i][3] = origin[i]
    return M


def T(x, y, z):
    return Matrix.Translation((x, y, z))


def R(axis, deg):
    return Matrix.Rotation(math.radians(deg), 4, axis)


def S(x, y=None, z=None):
    return Matrix.Diagonal((x, x if y is None else y, x if z is None else z, 1))


def rounded_rect(w, h, r, seg=6):
    """Closed path (counter-clockwise) and outward normals for a rounded rectangle."""
    pts, nrm = [], []
    cs = [(w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90), (-w / 2 + r, -h / 2 + r, 180), (w / 2 - r, -h / 2 + r, 270)]
    for cx, cy, a0 in cs:
        for k in range(seg + 1):
            a = math.radians(a0 + 90 * k / seg)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
            nrm.append((math.cos(a), math.sin(a)))
    return pts, nrm


def circle(r, seg=96, cx=0.0, cy=0.0):
    pts = [(cx + r * math.cos(TAU * i / seg), cy + r * math.sin(TAU * i / seg)) for i in range(seg)]
    nrm = [(math.cos(TAU * i / seg), math.sin(TAU * i / seg)) for i in range(seg)]
    return pts, nrm


def make_material(name, color, rough=0.5, metal=0.0, emit=None, strength=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal
    if emit:
        bsdf.inputs["Emission Color"].default_value = (*emit, 1)
        bsdf.inputs["Emission Strength"].default_value = strength
    return m
