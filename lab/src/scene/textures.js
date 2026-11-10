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

// White tape with a hand-written marker label. Edges are torn, the tape is slightly
// translucent at the ends, and the text sits a little off-straight, like a real label.
export function tapeLabel(text, { width = 512, height = 128, fontSize = 64, seed = 5, ink = "#16181b", tape = "#f6f6f1", align = "center" } = {}) {
  const [c, g] = canvas(width, height);
  const r = mulberry32(seed);
  g.clearRect(0, 0, width, height);
  g.beginPath();
  const torn = (x0, y0, y1) => {
    const steps = 10;
    for (let i = 0; i <= steps; i++) g.lineTo(x0 + (r() - 0.5) * 10, y0 + ((y1 - y0) * i) / steps);
  };
  g.moveTo(6, 8);
  g.lineTo(width - 8, 6);
  torn(width - 8, 6, height - 8);
  g.lineTo(8, height - 6);
  torn(6, height - 6, 8);
  g.closePath();
  g.fillStyle = tape;
  g.shadowColor = "rgba(0,0,0,0.18)";
  g.shadowBlur = 6;
  g.fill();
  g.shadowBlur = 0;
  g.fillStyle = ink;
  g.font = `${fontSize}px "Permanent Marker"`;
  g.textBaseline = "middle";
  g.textAlign = align;
  g.save();
  g.translate(align === "center" ? width / 2 : 24, height / 2 + 4);
  g.rotate((r() - 0.5) * 0.04);
  g.fillText(text, 0, 0, width - 48);
  g.restore();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function tapeMesh(text, { w = 0.3, h = 0.075, ...opts } = {}) {
  const tex = tapeLabel(text, opts);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.85, metalness: 0 }));
  m.userData.tape = true;
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
