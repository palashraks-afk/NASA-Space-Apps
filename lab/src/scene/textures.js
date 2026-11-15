import * as THREE from "three";
import { mulberry32 } from "../engine/rng.js";

const canvas = (w, h) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")];
};

const asColorTex = (c, repeat = [1, 1]) => {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 8;
  return t;
};
const asDataTex = (c, repeat = [1, 1]) => {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 8;
  return t;
};

// Brushed anodized aluminium: fine horizontal streaks for roughness variation.
export function brushedRoughness(seed = 1) {
  const [c, g] = canvas(512, 512);
  const r = mulberry32(seed);
  g.fillStyle = "rgb(150,150,150)";
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2400; i++) {
    const y = r() * 512, v = 120 + r() * 70;
    g.strokeStyle = `rgba(${v},${v},${v},0.35)`;
    g.lineWidth = r() * 1.4;
    g.beginPath();
    g.moveTo(r() * 512 - 80, y);
    g.lineTo(r() * 512 + 80, y + (r() - 0.5) * 2);
    g.stroke();
  }
  return asDataTex(c, [2, 2]);
}

// Height canvas -> tangent-space normal map (Sobel, wrapping at the edges so it tiles).
function heightToNormal(src, strength) {
  const w = src.width, h = src.height;
  const px = src.getContext("2d").getImageData(0, 0, w, h).data;
  const hv = (x, y) => px[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  const [c, g] = canvas(w, h);
  const out = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = hv(x + 1, y - 1) + 2 * hv(x + 1, y) + hv(x + 1, y + 1) - hv(x - 1, y - 1) - 2 * hv(x - 1, y) - hv(x - 1, y + 1);
    const dy = hv(x - 1, y + 1) + 2 * hv(x, y + 1) + hv(x + 1, y + 1) - hv(x - 1, y - 1) - 2 * hv(x, y - 1) - hv(x + 1, y - 1);
    let nx = -dx * strength, ny = dy * strength, nz = 1;
    const l = Math.hypot(nx, ny, nz);
    nx /= l; ny /= l; nz /= l;
    const i = (y * w + x) * 4;
    out.data[i] = (nx * 0.5 + 0.5) * 255;
    out.data[i + 1] = (ny * 0.5 + 0.5) * 255;
    out.data[i + 2] = (nz * 0.5 + 0.5) * 255;
    out.data[i + 3] = 255;
  }
  g.putImageData(out, 0, 0);
  return c;
}

// Surface relief for anodized aluminium panels: brushed grain, fine pitting and a few
// hairline scratches. Returns a normal map.
export function aluNormal(seed = 21) {
  const [c, g] = canvas(512, 512);
  const r = mulberry32(seed);
  g.fillStyle = "rgb(128,128,128)";
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 3200; i++) {
    const y = r() * 512, v = 90 + r() * 90;
    g.strokeStyle = `rgba(${v},${v},${v},0.3)`;
    g.lineWidth = 0.4 + r() * 1.1;
    g.beginPath();
    const x0 = r() * 512;
    g.moveTo(x0, y);
    g.lineTo(x0 + 30 + r() * 140, y + (r() - 0.5) * 1.5);
    g.stroke();
  }
  for (let i = 0; i < 1400; i++) {
    const v = 100 + r() * 60;
    g.fillStyle = `rgba(${v},${v},${v},0.35)`;
    g.fillRect(r() * 512, r() * 512, 1 + r() * 1.5, 1 + r() * 1.5);
  }
  for (let i = 0; i < 26; i++) {
    const x = r() * 512, y = r() * 512, a = r() * Math.PI, len = 30 + r() * 120;
    g.strokeStyle = `rgba(${r() < 0.5 ? 235 : 40},${r() < 0.5 ? 235 : 40},${r() < 0.5 ? 235 : 40},0.55)`;
    g.lineWidth = 0.7;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    g.stroke();
  }
  return asDataTex(heightToNormal(c, 1.6), [2, 2]);
}

// Wear and grime as a near-white colour map multiplied into the panel colour: darker,
// slightly warm dirt along the panel edges, soft smudges, and short scuffs. Not repeated,
// so the edge dirt lands on each panel's actual edges.
export function aluWear(seed = 22) {
  const [c, g] = canvas(512, 512);
  const r = mulberry32(seed);
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, 512, 512);
  const edge = (x0, y0, x1, y1) => {
    const grd = g.createLinearGradient(x0, y0, x1, y1);
    grd.addColorStop(0, "rgba(140,132,118,0.26)");
    grd.addColorStop(1, "rgba(140,132,118,0)");
    return grd;
  };
  g.fillStyle = edge(0, 0, 26, 0); g.fillRect(0, 0, 26, 512);
  g.fillStyle = edge(512, 0, 486, 0); g.fillRect(486, 0, 26, 512);
  g.fillStyle = edge(0, 0, 0, 26); g.fillRect(0, 0, 512, 26);
  g.fillStyle = edge(0, 512, 0, 486); g.fillRect(0, 486, 512, 26);
  for (let i = 0; i < 38; i++) {
    const x = r() * 512, y = r() * 512, s = 20 + r() * 70;
    const grd = g.createRadialGradient(x, y, 0, x, y, s);
    const a = 0.015 + r() * 0.035;
    grd.addColorStop(0, `rgba(120,112,98,${a})`);
    grd.addColorStop(1, "rgba(120,112,98,0)");
    g.fillStyle = grd;
    g.fillRect(x - s, y - s, s * 2, s * 2);
  }
  for (let i = 0; i < 70; i++) {
    const x = r() * 512, y = r() * 512, a = r() * Math.PI, len = 6 + r() * 26;
    const v = r() < 0.7 ? 90 : 255;
    g.strokeStyle = `rgba(${v},${v},${v - 6},${0.05 + r() * 0.09})`;
    g.lineWidth = 0.8 + r() * 1.6;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    g.stroke();
  }
  return asColorTex(c, [1, 1]);
}

// Printed rack identification plate: white label, black sans text, a small barcode and a
// caution triangle. Cached by text so repeated ids share one texture.
const placardCache = new Map();
export function placardTexture(text) {
  if (placardCache.has(text)) return placardCache.get(text);
  const [c, g] = canvas(256, 64);
  g.fillStyle = "#e9ebea";
  g.fillRect(0, 0, 256, 64);
  g.strokeStyle = "#1b1d20";
  g.lineWidth = 2;
  g.strokeRect(2, 2, 252, 60);
  g.fillStyle = "#1b1d20";
  g.font = "700 26px Archivo, sans-serif";
  g.textBaseline = "middle";
  g.fillText(text, 12, 22);
  const r = mulberry32([...text].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) >>> 0);
  let x = 12;
  while (x < 168) {
    const w = 1 + Math.floor(r() * 3);
    g.fillRect(x, 40, w, 16);
    x += w + 1 + Math.floor(r() * 3);
  }
  g.fillStyle = "#e6b422";
  g.beginPath();
  g.moveTo(222, 14); g.lineTo(246, 54); g.lineTo(198, 54);
  g.closePath(); g.fill();
  g.stroke();
  g.fillStyle = "#1b1d20";
  g.fillRect(220, 28, 4, 14);
  g.fillRect(220, 46, 4, 4);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  placardCache.set(text, t);
  return t;
}

// Beta cloth / Nomex weave for cargo bags and wall padding.
export function weave(seed = 2, base = [236, 236, 230]) {
  const [c, g] = canvas(256, 256);
  const r = mulberry32(seed);
  g.fillStyle = `rgb(${base.join(",")})`;
  g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 4) for (let x = 0; x < 256; x += 4) {
    const v = ((x / 4 + y / 4) % 2 ? -10 : 6) + (r() - 0.5) * 8;
    g.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v) / 120})`;
    g.fillRect(x, y, 4, 4);
  }
  return asColorTex(c, [3, 3]);
}

// Velcro hook patch: dense dark loops.
export function velcro(seed = 3) {
  const [c, g] = canvas(128, 128);
  const r = mulberry32(seed);
  // mid-grey loop fabric: dark enough to read as velcro, light enough not to crush to black under the
  // baked cabin light
  g.fillStyle = "#6a7077";
  g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 1600; i++) {
    const v = 78 + r() * 70;
    g.fillStyle = `rgb(${v},${v + 3},${v + 6})`;
    g.beginPath();
    g.arc(r() * 128, r() * 128, 0.6 + r() * 1.1, 0, Math.PI * 2);
    g.fill();
  }
  return asColorTex(c, [1, 1]);
}

// Crinkled gold Kapton foil, as a normal-ish bump map.
export function kaptonBump(seed = 4) {
  const [c, g] = canvas(512, 512);
  const r = mulberry32(seed);
  g.fillStyle = "rgb(128,128,128)";
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++) {
    const x = r() * 512, y = r() * 512, s = 10 + r() * 60, a = r() * Math.PI;
    const v = 80 + r() * 100;
    g.fillStyle = `rgba(${v},${v},${v},0.25)`;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s);
    g.lineTo(x + Math.cos(a + 2) * s * 0.7, y + Math.sin(a + 2) * s * 0.7);
    g.closePath();
    g.fill();
  }
  return asDataTex(c, [1, 1]);
}

// Engraved metal nameplate: a thin brushed-steel plate with two rivets and the label stamped into it.
// The plate sizes itself to its text and never exceeds `w` metres: long text wraps to two lines first,
// then the whole plate is scaled down to fit. `h` is the height of a one-line plate. `round` makes a
// small round tab (single letters). Back face sits at z = 0, the engraved face about 4 mm in front.
const PLATE_H = 160; // texture px for one line
function plateShape(w, h, r) {
  const s = new THREE.Shape();
  if (r >= Math.min(w, h) / 2 - 1e-6) { s.absarc(0, 0, Math.min(w, h) / 2, 0, Math.PI * 2, false); return s; }
  const x = w / 2, y = h / 2;
  s.moveTo(-x + r, -y);
  s.lineTo(x - r, -y); s.absarc(x - r, -y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x, y - r); s.absarc(x - r, y - r, r, 0, Math.PI / 2, false);
  s.lineTo(-x + r, y); s.absarc(-x + r, y - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(-x, -y + r); s.absarc(-x + r, -y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

export function plateMesh(text, { w = 0.3, h = 0.04, round = false } = {}) {
  const label = String(text).toUpperCase();
  const [mc, mg] = canvas(8, 8);
  const fontPx = PLATE_H * 0.4;
  const font = `700 ${fontPx}px Archivo, "Segoe UI", Arial, sans-serif`;
  const track = round ? 0 : fontPx * 0.09;
  const measure = (s) => { mg.font = font; if ("letterSpacing" in mg) mg.letterSpacing = `${track}px`; return mg.measureText(s).width; };
  const SCREW = round ? 0 : PLATE_H * 0.95; // each end: screw plus breathing room
  let lines = [label];
  let textW = measure(label);
  let wPx = round ? PLATE_H : textW + 2 * SCREW;
  let hPx = PLATE_H;
  const mPerPx = h / PLATE_H;
  if (!round && wPx * mPerPx > w && label.includes(" ")) {
    // wrap at the space nearest the middle
    const mid = label.length / 2;
    let cut = -1;
    for (let i = 0; i < label.length; i++) if (label[i] === " " && (cut < 0 || Math.abs(i - mid) < Math.abs(cut - mid))) cut = i;
    lines = [label.slice(0, cut), label.slice(cut + 1)];
    textW = Math.max(measure(lines[0]), measure(lines[1]));
    wPx = textW + 2 * SCREW;
    hPx = PLATE_H * 1.55;
  }
  let scale = 1;
  if (wPx * mPerPx > w) scale = w / (wPx * mPerPx);
  const Wm = wPx * mPerPx * scale, Hm = hPx * mPerPx * scale;

  const seed = [...label].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const r = mulberry32(seed);
  const [c, g] = canvas(Math.ceil(wPx), Math.ceil(hPx));
  const [bc, bg] = canvas(c.width, c.height);
  const rad = round ? c.width / 2 : PLATE_H * 0.16;
  const rr = (ctx, inset) => {
    ctx.beginPath();
    if (round) ctx.arc(c.width / 2, c.height / 2, c.width / 2 - inset, 0, Math.PI * 2);
    else ctx.roundRect(inset, inset, c.width - 2 * inset, c.height - 2 * inset, Math.max(rad - inset, 1));
  };
  // brushed steel
  const base = g.createLinearGradient(0, 0, c.width * 0.6, c.height);
  base.addColorStop(0, "#c4c8cc"); base.addColorStop(0.5, "#aeb2b7"); base.addColorStop(1, "#9a9ea4");
  g.fillStyle = base; g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < c.height * 3; i++) {
    const y = r() * c.height, a = 0.04 + r() * 0.09;
    g.fillStyle = r() < 0.5 ? `rgba(255,255,255,${a})` : `rgba(40,44,50,${a})`;
    g.fillRect(0, y, c.width, 0.6 + r() * 1.2);
  }
  bg.fillStyle = "rgb(150,150,150)"; bg.fillRect(0, 0, c.width, c.height);
  // pressed rim: light top-left edge, dark bottom-right edge
  g.lineWidth = 5; rr(g, 6); g.strokeStyle = "rgba(255,255,255,0.45)"; g.stroke();
  g.lineWidth = 3; rr(g, 11); g.strokeStyle = "rgba(30,34,40,0.35)"; g.stroke();
  bg.lineWidth = 6; rr(bg, 8); bg.strokeStyle = "rgb(210,210,210)"; bg.stroke();
  // low-key rivets at each end: a shallow dome with a soft highlight, no slot
  if (!round) {
    for (const sx of [SCREW * 0.5, c.width - SCREW * 0.5]) {
      const sy = c.height / 2, sr = PLATE_H * 0.09;
      g.fillStyle = "rgba(30,34,40,0.3)"; g.beginPath(); g.arc(sx + 1.5, sy + 2, sr * 1.12, 0, Math.PI * 2); g.fill();
      const sg = g.createRadialGradient(sx - sr * 0.35, sy - sr * 0.4, 1, sx, sy, sr);
      sg.addColorStop(0, "#d4d7db"); sg.addColorStop(1, "#8d9197");
      g.fillStyle = sg; g.beginPath(); g.arc(sx, sy, sr, 0, Math.PI * 2); g.fill();
      bg.fillStyle = "rgb(205,205,205)"; bg.beginPath(); bg.arc(sx, sy, sr, 0, Math.PI * 2); bg.fill();
    }
  }
  // engraving
  const lh = PLATE_H;
  g.font = font; bg.font = font;
  if ("letterSpacing" in g) { g.letterSpacing = `${track}px`; bg.letterSpacing = `${track}px`; }
  g.textAlign = bg.textAlign = "center"; g.textBaseline = bg.textBaseline = "middle";
  lines.forEach((line, i) => {
    const cx = c.width / 2 + track / 2, cy = c.height / 2 + (i - (lines.length - 1) / 2) * lh * 0.78 + PLATE_H * 0.02;
    g.fillStyle = "rgba(255,255,255,0.6)"; g.fillText(line, cx + 1.5, cy + 2.5);   // light catching the lower lip
    g.fillStyle = "#24272c"; g.fillText(line, cx, cy);
    g.fillStyle = "rgba(0,0,0,0.35)"; g.fillText(line, cx - 0.8, cy - 1);           // shadowed upper wall
    bg.fillStyle = "rgb(20,20,20)"; bg.fillText(line, cx, cy);
  });
  const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
  const bump = new THREE.CanvasTexture(bc); bump.anisotropy = 8;
  const mat = new THREE.MeshStandardMaterial({ map, bumpMap: bump, bumpScale: 2.2, metalness: 0.7, roughness: 0.4 });
  const bev = 0.0006;
  const geo = new THREE.ExtrudeGeometry(plateShape(Wm - 2 * bev, Hm - 2 * bev, round ? Hm : Math.min(0.006 * scale + 0.002, Hm / 2)), {
    depth: 0.003, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 1, curveSegments: round ? 20 : 4,
  });
  geo.translate(0, 0, bev);
  const uv = geo.attributes.uv, pos = geo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / Wm + 0.5, pos.getY(i) / Hm + 0.5);
  const m = new THREE.Mesh(geo, mat);
  m.userData.plate = true;
  m.castShadow = false;
  return m;
}

// A clean hazard stripe band for the hatch rim.
export function hazardStripes() {
  const [c, g] = canvas(256, 32);
  g.fillStyle = "#f2c230";
  g.fillRect(0, 0, 256, 32);
  g.fillStyle = "#1b1d20";
  for (let x = -32; x < 288; x += 32) {
    g.beginPath();
    g.moveTo(x, 32); g.lineTo(x + 16, 32); g.lineTo(x + 32, 0); g.lineTo(x + 16, 0);
    g.closePath(); g.fill();
  }
  return asColorTex(c, [8, 1]);
}

export function glowSprite() {
  const [c, g] = canvas(64, 64);
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.35, "rgba(255,255,255,0.55)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
