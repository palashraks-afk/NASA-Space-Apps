# Tileable PBR textures for the module, generated in Blender's Python (numpy ships with Blender).
# Run: blender -b -P lab/blender/textures.py
# Every map is built from FFT-filtered noise, which is periodic, so each tile wraps seamlessly.
# Writes lab/public/textures/pbr/<name>_{col,rough,nor}.jpg
import os
import numpy as np
import bpy

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "textures", "pbr")
N = 1024
rng = np.random.default_rng(7)
fx = np.fft.fftfreq(N)[None, :]
fy = np.fft.fftfreq(N)[:, None]


def noise(scale_px, aniso=(1.0, 1.0), seed=None):
    """Periodic gaussian-filtered noise, normalised to 0..1. scale_px ~ feature size in pixels."""
    g = np.random.default_rng(seed) if seed is not None else rng
    w = g.standard_normal((N, N))
    s = scale_px / (2 * np.pi)
    filt = np.exp(-0.5 * ((fx * N / N * s * aniso[0] * 2 * np.pi) ** 2 + (fy * s * aniso[1] * 2 * np.pi) ** 2))
    f = np.real(np.fft.ifft2(np.fft.fft2(w) * filt))
    f -= f.min()
    return f / max(f.max(), 1e-9)


def fbm(base_px, octaves=5, gain=0.5, seed=0):
    out = np.zeros((N, N))
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        out += amp * noise(base_px / (2 ** o), seed=seed + o)
        tot += amp
        amp *= gain
    return out / tot


def blur(img, px):
    s = px / (2 * np.pi)
    filt = np.exp(-0.5 * ((fx * s * 2 * np.pi) ** 2 + (fy * s * 2 * np.pi) ** 2))
    return np.real(np.fft.ifft2(np.fft.fft2(img) * filt))


def scratches(count, length=(20, 160), width=1.0, seed=1, angle=None):
    """Thin wrapping line segments, as a 0..1 mask."""
    g = np.random.default_rng(seed)
    m = np.zeros((N, N))
    for _ in range(count):
        x, y = g.uniform(0, N, 2)
        a = g.uniform(0, np.pi) if angle is None else angle + g.normal(0, 0.05)
        L = g.uniform(*length)
        k = int(L)
        t = np.linspace(0, 1, k)
        xs = (x + np.cos(a) * L * t + g.normal(0, 0.4, k).cumsum() * 0.15).astype(int) % N
        ys = (y + np.sin(a) * L * t + g.normal(0, 0.4, k).cumsum() * 0.15).astype(int) % N
        m[ys, xs] = np.maximum(m[ys, xs], g.uniform(0.3, 1.0))
    return np.clip(blur(m, width * 2.2) * 3.0, 0, 1)


def smudges(count, seed=3):
    """Soft elliptical fingerprints / wipe marks."""
    g = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:N, 0:N]
    m = np.zeros((N, N))
    for _ in range(count):
        cx, cy = g.uniform(0, N, 2)
        rx, ry = g.uniform(12, 60), g.uniform(8, 40)
        a = g.uniform(0, np.pi)
        dx = (xx - cx + N / 2) % N - N / 2
        dy = (yy - cy + N / 2) % N - N / 2
        u = (dx * np.cos(a) + dy * np.sin(a)) / rx
        v = (-dx * np.sin(a) + dy * np.cos(a)) / ry
        ring = np.exp(-(u * u + v * v) * 1.5) * (0.85 + 0.15 * np.sin(np.sqrt(u * u + v * v) * 18) ** 2)
        m = np.maximum(m, ring * g.uniform(0.3, 1.0))
    return m


def height_to_normal(h, strength):
    dx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * 0.5
    dy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * 0.5
    # OpenGL convention (green up), image row 0 at the top
    n = np.stack([-dx * strength, dy * strength, np.ones_like(h)], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    return n * 0.5 + 0.5


def save(name, arr, srgb=True, quality=92):
    """arr: HxW or HxWx3 in 0..1, row 0 = top of image."""
    if arr.ndim == 2:
        arr = np.repeat(arr[..., None], 3, -1)
    arr = np.clip(arr, 0, 1)
    if srgb:
        arr = np.where(arr <= 0.0031308, arr * 12.92, 1.055 * np.power(arr, 1 / 2.4) - 0.055)
    rgba = np.concatenate([arr, np.ones((N, N, 1))], -1)[::-1].astype(np.float32)  # Blender rows go bottom-up
    img = bpy.data.images.new(name, N, N, alpha=False, float_buffer=False)
    img.colorspace_settings.name = "Non-Color"  # we already encoded; write values as-is
    img.pixels.foreach_set(rgba.ravel())
    path = os.path.join(OUT, name + ".jpg")
    scn = bpy.context.scene
    scn.render.image_settings.file_format = "JPEG"
    scn.render.image_settings.quality = quality
    scn.render.image_settings.color_management = "OVERRIDE"
    scn.view_settings.view_transform = "Standard"
    scn.render.image_settings.view_settings.view_transform = "Standard"
    scn.render.image_settings.display_settings.display_device = "sRGB"
    img.save_render(path, scene=scn)
    bpy.data.images.remove(img)
    print("wrote", path)


# ---------------- painted aluminium (rack panels, lockers, walls) ----------------
def painted(name, tint, seed):
    grime = fbm(420, 4, 0.55, seed)
    mott = fbm(90, 3, 0.5, seed + 10)
    sm = smudges(26, seed + 20)
    sc = scratches(70, (6, 50), 0.5, seed + 30) * 0.7
    sc_big = scratches(5, (60, 220), 0.8, seed + 31) * 0.6
    col = np.array(tint)[None, None, :] * (0.93 + 0.07 * grime[..., None]) * (0.985 + 0.03 * mott[..., None])
    col *= (1 - 0.06 * sm[..., None])
    col = col * (1 - 0.05 * sc[..., None]) + 0.02 * sc_big[..., None]
    save(f"{name}_col", col)
    rough = 0.52 + 0.10 * (mott - 0.5) - 0.12 * sm + 0.07 * sc - 0.06 * sc_big + 0.05 * (grime - 0.5)
    save(f"{name}_rough", rough, srgb=False)
    peel = noise(3.0, seed=seed + 40)  # orange-peel paint texture
    h = 0.35 * peel - 0.45 * sc - 0.8 * sc_big + 0.25 * fbm(40, 3, 0.5, seed + 41)
    save(f"{name}_nor", height_to_normal(h, 2.2), srgb=False)


painted("paint", (0.80, 0.80, 0.78), 100)        # warm off-white panels
painted("paintcool", (0.70, 0.73, 0.76), 200)    # cooler grey-blue trim panels

# ---------------- brushed / anodised aluminium (rails, frames, seat tracks) ----------------
streak = noise(1.2, aniso=(60, 1), seed=300)
streak2 = noise(4.0, aniso=(30, 1), seed=301)
pits = (noise(1.0, seed=302) > 0.83).astype(float)
grime = fbm(300, 4, 0.5, 303)
col = (0.62 + 0.10 * streak2 + 0.05 * streak)[..., None] * np.array([0.96, 0.98, 1.0]) * (0.9 + 0.1 * grime[..., None])
save("brushed_col", col)
save("brushed_rough", 0.30 + 0.16 * streak + 0.06 * streak2 + 0.08 * (1 - grime), srgb=False)
save("brushed_nor", height_to_normal(0.6 * streak + 0.3 * streak2 - 0.4 * pits, 1.6), srgb=False)

# ---------------- rubber seals, gaskets, cable jackets ----------------
r1 = fbm(60, 4, 0.55, 400)
fine = noise(1.5, seed=401)
save("rubber_col", (0.035 + 0.02 * r1)[..., None] * np.array([1.0, 1.0, 1.02]))
save("rubber_rough", 0.72 + 0.12 * r1 + 0.05 * fine, srgb=False)
save("rubber_nor", height_to_normal(0.6 * fine + 0.8 * r1, 1.2), srgb=False)

# ---------------- matte graphite polymer (bezels, latches, handles) ----------------
g1 = fbm(80, 4, 0.5, 500)
gs = scratches(50, (6, 40), 0.5, 501) * 0.7
save("polymer_col", (0.06 + 0.02 * g1 + 0.04 * gs)[..., None] * np.array([0.95, 1.0, 1.05]))
save("polymer_rough", 0.55 + 0.1 * g1 - 0.12 * gs + 0.04 * noise(1.2, seed=502), srgb=False)
save("polymer_nor", height_to_normal(0.5 * noise(2.0, seed=503) - 0.6 * gs, 1.4), srgb=False)

# ---------------- perforated vent grille (alpha-free: dark holes in the colour, dents in normal) -------
yy, xx = np.mgrid[0:N, 0:N]
pitch = 32
d = np.hypot((xx % pitch) - pitch / 2, (yy % pitch) - pitch / 2)
hole = np.clip((9 - d) / 2.0, 0, 1)
save("vent_col", (0.55 * (1 - hole) + 0.02 * hole)[..., None] * np.array([0.92, 0.94, 0.97]))
save("vent_rough", 0.45 + 0.4 * hole, srgb=False)
save("vent_nor", height_to_normal(-blur(hole, 2.0) * 3.0, 3.0), srgb=False)

print("textures done")
