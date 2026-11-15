import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

// Hand-modelled instruments, built to look like the real hardware: proportions, colours and
// recognisable features follow NASA photos where they exist (ARED, T2, CDRA, MCA, Bio-Monitor,
// cardiovascular cuffs) and standard designs otherwise (fingertip oximeter, glucose meter, cuff
// monitor, DOSTEL, the USB Timepix monitor). Units are metres. Each part is still a separate
// group, so the exploded view, picking and the parts list work as before.

// ---------------------------------------------------------------- toolkit
const MAT = {};
function mat(name) {
  if (MAT[name]) return MAT[name];
  const P = (o) => new THREE.MeshPhysicalMaterial(o);
  const m = {
    blueAnod: () => P({ color: 0x1e6fd6, metalness: 0.55, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.2 }),
    gold: () => P({ color: 0xc9a14a, metalness: 0.85, roughness: 0.3 }),
    steel: () => P({ color: 0xc3c9cf, metalness: 0.95, roughness: 0.28 }),
    alu: () => P({ color: 0xd2d6da, metalness: 0.8, roughness: 0.42 }),
    blackAnod: () => P({ color: 0x1a1d21, metalness: 0.55, roughness: 0.4, clearcoat: 0.3 }),
    black: () => P({ color: 0x141619, metalness: 0.05, roughness: 0.62 }),
    white: () => P({ color: 0xe9ecef, metalness: 0.0, roughness: 0.5, clearcoat: 0.3 }),
    grey: () => P({ color: 0x8b9298, metalness: 0.2, roughness: 0.55 }),
    olive: () => P({ color: 0x5d6448, metalness: 0.1, roughness: 0.7 }),
    rubberGreen: () => P({ color: 0x6c8a3a, metalness: 0, roughness: 0.85 }),
    orange: () => P({ color: 0xe0702a, metalness: 0, roughness: 0.55 }),
    purple: () => P({ color: 0x8a55d6, metalness: 0.7, roughness: 0.3 }),
    yellow: () => P({ color: 0xf2c23a, metalness: 0, roughness: 0.5 }),
    copper: () => P({ color: 0xb8733a, metalness: 0.9, roughness: 0.35 }),
    pcb: () => P({ color: 0x1f6b3f, metalness: 0.1, roughness: 0.5 }),
    silicon: () => P({ color: 0x3b4a66, metalness: 0.6, roughness: 0.15, clearcoat: 1, iridescence: 0.6 }),
    fabricBlack: () => P({ color: 0x0e1013, metalness: 0, roughness: 0.9, sheen: 0.4, sheenColor: new THREE.Color(0x2c3238) }),
    fabricBlue: () => P({ color: 0x2c4f9a, metalness: 0, roughness: 0.9, sheen: 1, sheenColor: new THREE.Color(0x6f8fd6) }),
    skin: () => P({ color: 0xd9a48a, metalness: 0, roughness: 0.6, transparent: true, opacity: 0.35, depthWrite: false }),
    glass: () => P({ color: 0x0b131d, metalness: 0.2, roughness: 0.06, clearcoat: 1 }),
    led: () => new THREE.MeshStandardMaterial({ color: 0xff3b30, emissive: 0xff3b30, emissiveIntensity: 2 }),
    ledGreen: () => new THREE.MeshStandardMaterial({ color: 0x45ef74, emissive: 0x45ef74, emissiveIntensity: 1.6 }),
    ledIr: () => new THREE.MeshStandardMaterial({ color: 0x8a2030, emissive: 0x8a2030, emissiveIntensity: 1.2 }),
  }[name]();
  MAT[name] = m;
  return m;
}
const mesh = (geo, m) => new THREE.Mesh(geo, typeof m === "string" ? mat(m) : m);
const at = (o, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { o.position.set(x, y, z); o.rotation.set(rx, ry, rz); return o; };
const grp = (...kids) => { const g = new THREE.Group(); kids.forEach((k) => k && g.add(k)); return g; };
const rbox = (w, h, d, r, m) => mesh(new RoundedBoxGeometry(w, h, d, 4, Math.min(r, Math.min(w, h, d) / 2 - 1e-5)), m);
const cyl = (r, h, m, seg = 48, r2 = r) => mesh(new THREE.CylinderGeometry(r, r2, h, seg), m);
const cylX = (r, h, m, seg = 48) => { const c = cyl(r, h, m, seg); c.rotation.z = Math.PI / 2; return grp(c); };
const cylZ = (r, h, m, seg = 48) => { const c = cyl(r, h, m, seg); c.rotation.x = Math.PI / 2; return grp(c); };
const tube = (pts, r, m, seg = 64) => mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), seg, r, 12), m);
const torus = (R, r, m, arc = Math.PI * 2) => mesh(new THREE.TorusGeometry(R, r, 16, 64, arc), m);
// A capped drum with a rim on each end (canisters, cylinders).
function drum(r, len, body, ends, axis = "x") {
  const g = grp(cyl(r, len, body, 56), at(cyl(r * 1.03, len * 0.06, ends, 56), 0, len / 2, 0), at(cyl(r * 1.03, len * 0.06, ends, 56), 0, -len / 2, 0),
    at(cyl(r * 0.55, len * 0.03, ends, 40), 0, len / 2 + len * 0.03, 0));
  if (axis === "x") g.rotation.z = Math.PI / 2; else if (axis === "z") g.rotation.x = Math.PI / 2;
  return grp(g);
}
// Text label or screen drawn on a canvas, applied to a thin plane.
function decal(w, h, draw, { glow = false, px = 512 } = {}) {
  const c = document.createElement("canvas");
  c.width = px; c.height = Math.round((px * h) / w);
  const x = c.getContext("2d");
  draw(x, c.width, c.height);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const m = glow ? new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }) : new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
  return mesh(new THREE.PlaneGeometry(w, h), m);
}
const label = (w, h, text, { bg = "#f2c23a", fg = "#111", font = 600 } = {}) => decal(w, h, (x, W, H) => {
  x.fillStyle = bg; x.fillRect(0, 0, W, H); x.fillStyle = fg;
  x.font = `${font} ${Math.round(H * 0.56)}px Barlow, Arial, sans-serif`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, W / 2, H / 2 + 2);
});
const screen = (w, h, lines, color = "#9fe8ff") => decal(w, h, (x, W, H) => {
  x.fillStyle = "#06121c"; x.fillRect(0, 0, W, H);
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "rgba(120,190,255,0.08)"); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, W, H);
  lines.forEach(([t, size, col, y, align = "left"]) => { x.fillStyle = col || color; x.font = `600 ${Math.round(H * size)}px Barlow, Arial, sans-serif`; x.textAlign = align; x.fillText(t, align === "center" ? W / 2 : align === "right" ? W * 0.94 : W * 0.06, H * y); });
}, { glow: true });
const bolts = (n, r, rad, m = "steel") => { const g = grp(); for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; g.add(at(cyl(r, r * 0.8, m, 12), Math.cos(a) * rad, 0, Math.sin(a) * rad)); } return g; };
function fanGrille(r, m = "grey") { // radial vanes inside a ring, as on the MCA panel
  const g = grp(torus(r, r * 0.05, m));
  for (let i = 0; i < 24; i++) { const v = mesh(new THREE.BoxGeometry(r * 0.9, r * 0.02, r * 0.12), m); v.position.set(Math.cos((i / 24) * Math.PI * 2) * r * 0.5, Math.sin((i / 24) * Math.PI * 2) * r * 0.5, 0); v.rotation.z = (i / 24) * Math.PI * 2 + 0.5; g.add(v); }
  g.add(cylZ(r * 0.2, r * 0.15, "black"));
  return g;
}
function spring(r, len, turns, wire, m = "steel") {
  const pts = [];
  for (let i = 0; i <= turns * 24; i++) { const a = (i / 24) * Math.PI * 2; pts.push([Math.cos(a) * r, (i / (turns * 24)) * len - len / 2, Math.sin(a) * r]); }
  return tube(pts, wire, m, turns * 24);
}
const handle = (w, m = "alu") => tube([[-w / 2, 0, 0], [-w / 2, 0, 0.03], [w / 2, 0, 0.03], [w / 2, 0, 0]], 0.006, m, 24);
const connector = (r = 0.008, m = "alu") => grp(cylZ(r, r * 1.6, m, 24), at(cylZ(r * 0.75, r * 0.6, "black", 24), 0, 0, r));

// ---------------------------------------------------------------- devices
// Each entry: [name, does, at, dir, build, options]; options: { exact, note }.
const P = (name, does, pos, dir, build, opt = {}) => ({ name, does, at: pos, dir, build, ...opt });

export const MODEL_PARTS = {
  dosimeter: [
    P("Detector head", "Aluminium cylinder holding the silicon telescope; a thin foil window lets particles in", [0, 0.045, 0], [0, 1, 0], () => grp(
      cyl(0.03, 0.035, "alu"), at(cyl(0.031, 0.004, "blackAnod"), 0, 0.019, 0), at(cyl(0.02, 0.0008, "gold"), 0, 0.0215, 0), at(bolts(6, 0.0018, 0.026), 0, 0.019, 0))),
    P("Upper PIPS detector", "154 µm silicon disc, 6.93 cm²: first hit of each particle", [0, 0.052, 0], [0, 1.9, 0.4], () => grp(cyl(0.01485, 0.0006, "silicon"), torus(0.0158, 0.0012, "gold")), { exact: true, note: "thickness drawn 4x" }),
    P("Lower PIPS detector", "315 µm silicon disc, 6.93 cm²: a matching hit marks a particle crossing the telescope", [0, 0.036, 0], [0, 1.5, 0.8], () => grp(cyl(0.01485, 0.0012, "silicon"), torus(0.0158, 0.0012, "gold")), { exact: true, note: "thickness drawn 4x" }),
    P("PIN diodes", "Two 300 µm diodes, 2.31 cm², at right angles: particles from the side", [0.035, 0.045, 0], [1, 0.4, 0.4], () => grp(at(rbox(0.0152, 0.0152, 0.0012, 0.0004, "silicon"), 0, 0, 0, 0, Math.PI / 2, 0), at(rbox(0.0152, 0.0152, 0.0012, 0.0004, "silicon"), -0.01, 0, 0.012)), { exact: true }),
    P("Electronics box", "Charge amplifiers and pulse-height analyser; dose = energy deposited / detector mass", [0, 0, 0], [0, -1, 0], () => grp(
      rbox(0.14, 0.05, 0.1, 0.006, "alu"), at(label(0.06, 0.012, "DOSTEL", { bg: "#1a1d21", fg: "#e9ecef" }), -0.02, 0.006, 0.0505), at(label(0.025, 0.012, "DLR", { bg: "#1a1d21", fg: "#9cc4ff" }), 0.045, 0.006, 0.0505),
      at(connector(), -0.045, -0.006, 0.05), at(connector(), -0.02, -0.006, 0.05), at(rbox(0.012, 0.004, 0.002, 0.001, "ledGreen"), 0.05, -0.012, 0.0505),
      ...[-0.06, 0.06].flatMap((x) => [-0.04, 0.04].map((z) => at(cyl(0.0035, 0.004, "steel", 12), x, 0.026, z))))),
    P("Data cable", "Power and data to the Columbus module", [-0.03, -0.006, 0.07], [-0.6, -0.4, 1], () => tube([[0, 0, 0], [0, -0.01, 0.04], [-0.05, -0.03, 0.08], [-0.12, -0.03, 0.09]], 0.004, "black")),
  ],
  rem: [
    P("Enclosure", "Black anodised aluminium case, the size of a large USB stick", [0, 0, 0], [0, -1, 0], () => grp(
      rbox(0.11, 0.02, 0.034, 0.004, "blackAnod"), at(label(0.05, 0.008, "REM · Timepix", { bg: "#1a1d21", fg: "#e9ecef" }), 0.01, 0.0101, 0, -Math.PI / 2, 0, 0),
      at(rbox(0.006, 0.0022, 0.003, 0.0006, "ledGreen"), 0.045, 0.0101, 0.011))),
    P("Sensor window", "Thin aluminised window over the silicon sensor", [-0.03, 0.011, 0], [0, 1, 0], () => at(rbox(0.018, 0.0008, 0.018, 0.0003, "alu"), 0, 0, 0)),
    P("Silicon sensor", "14.08 mm square: particles free charge as they cross", [-0.03, 0.006, 0], [0, 2.2, 0.3], () => rbox(0.01408, 0.0006, 0.01408, 0.0002, "silicon"), { exact: true }),
    P("Timepix chip", "65,536 pixels, 55 µm pitch, bump-bonded under the sensor", [-0.03, 0.004, 0], [0, 1.6, -0.6], () => grp(rbox(0.01408, 0.0007, 0.0161, 0.0002, "grey"), at(rbox(0.012, 0.0002, 0.012, 0.0001, "copper"), 0, 0.0005, 0)), { exact: true }),
    P("Readout board", "Powers the chip and streams pixel hits over USB", [0, 0.001, 0], [0, 0.5, -1], () => grp(rbox(0.1, 0.0016, 0.03, 0.0005, "pcb"), ...[0.01, 0.025, 0.04].map((x) => at(rbox(0.008, 0.0015, 0.006, 0.0005, "black"), x, 0.0015, 0)))),
    P("USB plug", "Plugs into a station laptop", [0.065, 0, 0], [1, 0, 0], () => grp(rbox(0.012, 0.0045, 0.012, 0.0005, "steel"), at(rbox(0.009, 0.0012, 0.01, 0.0003, "white"), 0.001, 0, 0))),
  ],
  cdra: [
    P("Rack rails", "Black frame that slides into the Atmosphere Revitalization rack", [0, -0.21, 0], [0, -1, 0], () => grp(
      ...[-0.18, 0.18].map((z) => at(rbox(0.95, 0.04, 0.04, 0.004, "blackAnod"), 0, 0, z)), ...[-0.42, 0.42].map((x) => at(rbox(0.04, 0.04, 0.4, 0.004, "blackAnod"), x, 0, 0)),
      ...[-0.3, 0.3].map((x) => at(cyl(0.015, 0.42, "blueAnod", 20), x, 0.21, -0.2)))),
    P("CO2 bed 1 (adsorbing)", "Black drum of zeolite: traps CO2 from the dried air", [0.18, 0.02, -0.08], [0.6, 1, -0.6], () => grp(drum(0.12, 0.42, "black", "grey"), at(label(0.14, 0.035, "CO2 SORBENT BED 1"), 0, 0.12, 0.05, -1.1, 0, 0))),
    P("CO2 bed 2 (desorbing)", "Second drum: heated and opened to space vacuum to release its CO2", [0.18, -0.08, 0.14], [0.6, -0.6, 1], () => grp(drum(0.12, 0.42, "black", "grey"), at(label(0.14, 0.035, "CO2 SORBENT BED 2"), 0, 0.12, 0.05, -1.1, 0, 0))),
    P("Kapton heaters", "Film heaters wrapped round the CO2 drums", [0.18, -0.08, 0.14], [0.2, -1.2, 1.4], () => grp(...[-0.12, 0, 0.12].map((x) => at(torus(0.123, 0.004, "copper"), x, 0, 0, 0, Math.PI / 2, 0)))),
    P("Desiccant bed 1", "Silver canister of desiccant: dries incoming air, gives the water back on the way out", [-0.24, 0.06, -0.08], [-1, 1, -0.4], () => grp(drum(0.07, 0.3, "steel", "alu"), at(label(0.1, 0.025, "DESICCANT 1"), 0, 0.072, 0, -Math.PI / 2, 0, 0))),
    P("Desiccant bed 2", "The other half-cycle's desiccant canister", [-0.24, -0.06, 0.12], [-1, -0.6, 1], () => grp(drum(0.07, 0.3, "steel", "alu"), at(label(0.1, 0.025, "DESICCANT 2"), 0, 0.072, 0, -Math.PI / 2, 0, 0))),
    P("Blower", "115,000 to 120,000 RPM; 39 to 42.7 kg of air an hour", [-0.05, 0.13, 0.12], [-0.3, 1, 0.6], () => grp(cylZ(0.045, 0.07, "alu"), at(cylZ(0.035, 0.02, "black"), 0, 0, 0.045), at(bolts(6, 0.003, 0.04), 0, 0, 0.036))),
    P("Precooler", "Water-cooled heat exchanger: colder air lets the zeolite hold more CO2", [0.05, 0.14, -0.12], [0.3, 1, -0.6], () => grp(rbox(0.14, 0.07, 0.08, 0.006, "alu"), ...Array.from({ length: 9 }, (_, i) => at(new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.06, 0.07), mat("steel")), -0.06 + i * 0.015, 0, 0)))),
    P("Air selector valves 101 to 106", "Six valves (purple fittings) swap the bed pairs every 144 minutes", [-0.02, 0.06, 0.02], [0, 1.4, 0.2], () => grp(...Array.from({ length: 6 }, (_, i) => at(grp(cyl(0.016, 0.03, "purple", 24), at(cyl(0.008, 0.025, "steel", 16), 0, 0.025, 0), at(label(0.022, 0.01, String(101 + i), { bg: "#e9ecef" }), 0, 0, 0.0165)), -0.13 + i * 0.052, 0, 0)))),
    P("Air-save pump", "First 15 minutes of each half-cycle: pumps trapped cabin air back", [-0.36, -0.1, 0.02], [-1, -0.6, 0.3], () => grp(cylX(0.04, 0.09, "alu"), at(cylX(0.03, 0.02, "black"), 0.055, 0, 0), at(connector(0.007), -0.05, 0, 0.04))),
    P("Vent to space", "Orange flex hose: CO2 goes overboard or to the Sabatier reactor", [0.38, 0.08, 0], [1, 0.8, 0], () => grp(tube([[0, 0, 0], [0.03, 0.08, 0], [0.02, 0.2, -0.02], [0.06, 0.32, -0.03]], 0.014, "orange"), at(cyl(0.02, 0.025, "purple", 24), 0.06, 0.33, -0.03))),
  ],
  mca: [
    P("Front panel", "Grey-olive faceplate with the cooling-fan grille", [0, 0, 0.11], [0, 0, 1], () => grp(rbox(0.42, 0.3, 0.02, 0.006, "olive"), at(fanGrille(0.07, "grey"), 0.09, 0.02, 0.012), at(label(0.3, 0.03, "MCA  MAJOR CONSTITUENT ANALYZER", { bg: "#e9ecef" }), -0.03, 0.11, 0.0105), ...[-0.16, 0.16].map((x) => at(handle(0.08), x, -0.12, 0.012, Math.PI / 2, 0, 0)))),
    P("Mass spectrometer (ORU 02)", "Magnetic sector analyser: the technological core", [-0.07, 0, 0], [-0.8, 0.6, 0.4], () => grp(rbox(0.16, 0.14, 0.16, 0.008, "alu"), at(label(0.08, 0.02, "ORU 02", { bg: "#1a1d21", fg: "#f2c23a" }), 0, 0.03, 0.0805), at(handle(0.08), 0, 0.071, 0.02, -Math.PI / 2, 0, 0))),
    P("Magnet", "Bends the ions: light gases curve more, heavy ones less", [-0.07, 0.02, -0.02], [-1.2, 1.4, -0.4], () => grp(at(rbox(0.06, 0.08, 0.025, 0.005, "blackAnod"), 0, 0, 0.022), at(rbox(0.06, 0.08, 0.025, 0.005, "blackAnod"), 0, 0, -0.022), at(rbox(0.06, 0.02, 0.07, 0.004, "blackAnod"), 0, -0.05, 0))),
    P("Ion source (2 filaments)", "Hot filaments ionise the sampled gas", [-0.13, 0.03, 0.02], [-1, 0.4, 0.6], () => grp(cylX(0.012, 0.03, "steel"), at(cylX(0.004, 0.012, "led"), -0.02, 0, 0))),
    P("Six electrometers", "One detector per gas: N2, O2, H2, CH4, H2O, CO2", [0.0, -0.035, 0.02], [0.6, -1, 0.6], () => grp(...["N2", "O2", "H2", "CH4", "H2O", "CO2"].map((g, i) => at(grp(rbox(0.012, 0.03, 0.014, 0.002, "copper"), at(label(0.012, 0.006, g, { bg: "#1a1d21", fg: "#e9ecef" }), 0, 0.02, 0.0071)), -0.03 + i * 0.014, 0, 0))), { exact: true }),
    P("Ion pump", "4 L/s: keeps the analyser at high vacuum", [0.08, -0.03, -0.02], [1, -0.4, -0.6], () => grp(cyl(0.035, 0.08, "steel"), ...Array.from({ length: 6 }, (_, i) => at(cyl(0.04, 0.004, "alu"), 0, -0.03 + i * 0.012, 0)))),
    P("Verification gas (ORU 08)", "A bottle of known gas mix to check calibration", [0.14, -0.06, 0.03], [1, -1, 0.6], () => grp(cap(0.022, 0.08, "blueAnod"), at(cyl(0.008, 0.02, "steel", 16), 0, 0.065, 0))),
    P("Electronics drawer", "Turns six ion currents into partial pressures", [0, -0.13, 0], [0, -1, 0], () => grp(rbox(0.4, 0.04, 0.2, 0.004, "alu"), ...Array.from({ length: 4 }, (_, i) => at(rbox(0.07, 0.002, 0.15, 0.001, "pcb"), -0.13 + i * 0.085, 0.022, 0)))),
  ],
  wearable: [
    P("Smart shirt", "Snug black compression shirt with built-in sensors", [0, 0, 0], [0, 0, -1], () => grp(shirt()),),
    P("ECG electrodes", "Three textile-backed metal pads pick up the heart's electrical signal", [0, 0.06, 0.135], [0, 0.4, 1], () => grp(...[[-0.05, 0.02], [0.05, 0.02], [0.0, -0.06]].map(([x, y]) => at(grp(cylZ(0.014, 0.003, "steel", 32), at(cylZ(0.018, 0.001, "fabricBlack", 32), 0, 0, -0.002)), x, y, 0)))),
    P("Chest breathing band", "Woven stretch sensor following rib-cage movement", [0, 0.06, 0], [-1, 0.4, 0], () => at(torus(0.15, 0.007, "steel"), 0, 0, 0, Math.PI / 2, 0, 0), { scaleZ: 0.82 }),
    P("Abdominal breathing band", "Second band: together they give breathing rate and volume", [0, -0.1, 0], [-1, -0.4, 0], () => at(torus(0.145, 0.007, "steel"), 0, 0, 0, Math.PI / 2, 0, 0), { scaleZ: 0.82 }),
    P("Adjustable straps", "Keep the electrodes pressed to the skin", [0, 0.02, 0.13], [1, 0, 0.6], () => grp(...[-0.08, 0.08].map((x) => at(rbox(0.022, 0.3, 0.004, 0.002, "fabricBlue"), x, 0, 0)))),
    P("Headband", "Black band with a forehead sensor pod: oxygen saturation and temperature", [0, 0.36, 0], [0, 1, 0], () => grp(at(torus(0.085, 0.012, "fabricBlack"), 0, 0, 0, Math.PI / 2, 0, 0), at(rbox(0.04, 0.022, 0.012, 0.004, "black"), 0, 0, 0.088), at(rbox(0.006, 0.004, 0.002, 0.001, "led"), -0.01, 0, 0.095), at(rbox(0.006, 0.004, 0.002, 0.001, "ledIr"), 0.01, 0, 0.095))),
    P("Battery and recorder", "Unplugs and docks in the base to send data to Earth", [0.05, -0.17, 0.14], [0.6, -0.8, 1], () => grp(rbox(0.07, 0.045, 0.018, 0.008, "black"), at(rbox(0.01, 0.004, 0.002, 0.001, "ledGreen"), 0.022, 0.012, 0.0095), at(label(0.04, 0.01, "BIO-MONITOR", { bg: "#141619", fg: "#9cc4ff" }), -0.008, -0.008, 0.0092))),
  ],
};

function cap(r, len, m) { return mesh(new THREE.CapsuleGeometry(r, len, 8, 24), m); }
function shirt() { // torso-shaped lathe: shoulders, chest, waist
  const prof = [[0.0, -0.24], [0.15, -0.24], [0.155, -0.12], [0.145, 0.0], [0.155, 0.1], [0.17, 0.17], [0.12, 0.21], [0.06, 0.22], [0.0, 0.22]];
  const g = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 64);
  g.scale(1, 1, 0.82);
  const body = mesh(g, "fabricBlack");
  const sleeves = [-1, 1].map((s) => at(mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.12, 32), "fabricBlack"), s * 0.19, 0.13, 0, 0, 0, s * 1.1));
  const collar = at(torus(0.07, 0.008, "fabricBlue"), 0, 0.215, 0, Math.PI / 2, 0, 0);
  return grp(body, ...sleeves, collar);
}

export { mat as instMat, rbox, cyl, cylX, cylZ, tube, torus, drum, decal, label, screen, bolts, spring, handle, connector, grp, at, mesh, cap, P };
