import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mulberry32 } from "../engine/rng.js";
import { hazardStripes, tapeMesh } from "./textures.js";

// Station module interior, built procedurally. Coordinates in metres: the module runs
// along z from -5 (window end) to +5 (hatch end); walls at x = +/-W, deck/overhead at y = +/-H.
export const W = 1.15, H = 1.08, ZMIN = -5, ZMAX = 5, CH = 0.32;

export function buildModule(mats) {
  const g = new THREE.Group();
  g.name = "module";
  const r = mulberry32(42);

  // Shell: an open octagonal tube (side faces only, no end caps, so the window stays open).
  const pts = [
    [-W + CH, -H - 0.06], [W - CH, -H - 0.06], [W + 0.06, -H + CH], [W + 0.06, H - CH],
    [W - CH, H + 0.06], [-W + CH, H + 0.06], [-W - 0.06, H - CH], [-W - 0.06, -H + CH],
  ];
  const shellMat = new THREE.MeshStandardMaterial({ color: 0xb9c1c8, roughness: 0.85, side: THREE.BackSide });
  pts.forEach((a, i) => {
    const b = pts[(i + 1) % pts.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const side = new THREE.Mesh(new THREE.PlaneGeometry(len, ZMAX - ZMIN), shellMat);
    side.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0);
    side.rotation.set(0, 0, Math.atan2(b[1] - a[1], b[0] - a[0]));
    side.rotateX(Math.PI / 2);
    side.receiveShadow = true;
    g.add(side);
  });

  // Rack faces: rows of panels with lockers, latches and handrails.
  const faces = [
    { name: "port", pos: (z) => [-W, 0, z], rot: [0, Math.PI / 2, 0], span: 2 * H - 2 * CH + 0.1 },
    { name: "starboard", pos: (z) => [W, 0, z], rot: [0, -Math.PI / 2, 0], span: 2 * H - 2 * CH + 0.1 },
    { name: "deck", pos: (z) => [0, -H, z], rot: [-Math.PI / 2, 0, 0], span: 2 * W - 2 * CH + 0.1 },
    { name: "overhead", pos: (z) => [0, H, z], rot: [Math.PI / 2, 0, 0], span: 2 * W - 2 * CH + 0.1 },
  ];
  const panelGeoCache = new Map();
  const panelGeo = (w, h, d, rad) => {
    const k = `${w}|${h}|${d}|${rad}`;
    if (!panelGeoCache.has(k)) panelGeoCache.set(k, new RoundedBoxGeometry(w, h, d, 3, rad));
    return panelGeoCache.get(k);
  };
  const knobGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.025, 12);
  for (const f of faces) {
    for (let z = ZMIN + 0.55; z < ZMAX - 0.4; z += 1.0) {
      const rack = new THREE.Group();
      rack.position.set(...f.pos(z));
      rack.rotation.set(...f.rot);
      const back = new THREE.Mesh(panelGeo(0.96, f.span, 0.04, 0.012), mats.aluPanel);
      back.receiveShadow = true;
      rack.add(back);
      // lockers in a 2 x n grid
      const rows = f.name === "port" || f.name === "starboard" ? 3 : 2;
      const lh = (f.span - 0.08) / rows;
      for (let i = 0; i < rows; i++) for (let j = 0; j < 2; j++) {
        if (r() < 0.12) continue;
        const lw = 0.44;
        const pick = r();
        const locker = new THREE.Mesh(panelGeo(lw, lh - 0.04, 0.035, 0.01), pick < 0.45 ? mats.alu : pick < 0.7 ? mats.aluWarm : pick < 0.88 ? mats.aluCool : mats.aluBright);
        locker.position.set(-0.235 + j * 0.47, -f.span / 2 + 0.04 + lh * (i + 0.5), 0.03);
        locker.castShadow = locker.receiveShadow = true;
        rack.add(locker);
        const knob = new THREE.Mesh(knobGeo, mats.graphite);
        knob.rotation.x = Math.PI / 2;
        knob.position.set(locker.position.x + lw / 2 - 0.05, locker.position.y, 0.06);
        rack.add(knob);
        if (r() < 0.18) {
          const label = tapeMesh(["Spare filters", "Hygiene kit", "Cable stow", "Sample bags", "Ear plugs", "Wipes", "Spare lenses", "Batteries"][Math.floor(r() * 8)], { w: 0.2, h: 0.05, fontSize: 56, seed: Math.floor(r() * 1e6) });
          label.position.set(locker.position.x - 0.08, locker.position.y + lh / 2 - 0.08, 0.052);
          label.rotation.z = (r() - 0.5) * 0.08;
          rack.add(label);
        }
      }
      // Clutter: strapped cargo bags, vent grilles and warning tags, seeded so the layout is stable.
      // Keep wall racks behind a station clear of clutter (stations at these z positions).
      const busy = [0.05, 0.55, -2.45, 2.8, -1.9, 1.95, 3.7].every((sz) => Math.abs(z - sz) > 0.85);
      if (busy && r() < 0.55) {
        const bw = 0.26 + r() * 0.16, bh = 0.18 + r() * 0.14, bd = 0.1 + r() * 0.07;
        const bagMat = [mats.fabric, mats.fabricBlue, mats.fabricTan][Math.floor(r() * 3)];
        const bag = new THREE.Mesh(panelGeo(bw, bh, bd, 0.035), bagMat);
        bag.position.set((r() - 0.5) * 0.4, (r() - 0.5) * (f.span - bh - 0.1), bd / 2 + 0.05);
        bag.rotation.z = (r() - 0.5) * 0.12;
        bag.castShadow = bag.receiveShadow = true;
        rack.add(bag);
        const strap = new THREE.Mesh(new THREE.BoxGeometry(0.035, bh + 0.05, bd + 0.012), mats.strap);
        strap.position.copy(bag.position);
        strap.rotation.z = bag.rotation.z;
        rack.add(strap);
        if (r() < 0.6) {
          const lt = tapeMesh(["CTB 1.0", "Food, week 3", "Crew pref", "Return", "Stow aft", "Spares"][Math.floor(r() * 6)], { w: 0.14, h: 0.04, fontSize: 60, seed: Math.floor(r() * 1e6) });
          lt.position.set(bag.position.x - bw / 4, bag.position.y + bh / 4, bag.position.z + bd / 2 + 0.002);
          lt.rotation.z = bag.rotation.z + (r() - 0.5) * 0.1;
          rack.add(lt);
        }
      }
      if (busy && r() < 0.3) {
        const vent = new THREE.Group();
        const vb = new THREE.Mesh(panelGeo(0.26, 0.16, 0.02, 0.008), mats.vent);
        vent.add(vb);
        for (let k = 0; k < 7; k++) {
          const slat = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.006, 0.012), mats.graphiteMatte);
          slat.position.set(0, -0.06 + k * 0.02, 0.012);
          vent.add(slat);
        }
        vent.position.set((r() - 0.5) * 0.5, (r() - 0.5) * (f.span - 0.3), 0.06);
        rack.add(vent);
      }
      if (r() < 0.12) {
        const tagMesh = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.12, 0.003), r() < 0.5 ? mats.tag : mats.yellow);
        tagMesh.position.set((r() - 0.5) * 0.7, (r() - 0.5) * (f.span - 0.3), 0.07);
        tagMesh.rotation.z = (r() - 0.5) * 0.5;
        rack.add(tagMesh);
      }
      // handrail on wall racks
      if (f.name === "port" || f.name === "starboard") {
        const rail = handrail(0.7, mats.graphite);
        rail.position.set(0, -f.span / 2 + 0.12, 0.05);
        rack.add(rail);
      }
      g.add(rack);
    }
  }

  // Corner light strips: emissive LED bars and matching rect-area lights.
  const lightGroup = new THREE.Group();
  const corners = [
    { x: W - CH / 2, y: H - CH / 2, rz: Math.PI / 4 },
    { x: -W + CH / 2, y: H - CH / 2, rz: -Math.PI / 4 },
    { x: W - CH / 2, y: -H + CH / 2, rz: (3 * Math.PI) / 4 },
    { x: -W + CH / 2, y: -H + CH / 2, rz: (-3 * Math.PI) / 4 },
  ];
  corners.forEach((c, idx) => {
    for (let z = ZMIN + 0.7; z < ZMAX - 0.5; z += 1.2) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.012, 0.85), idx < 2 ? mats.led : mats.ledCool);
      bar.position.set(c.x * 1.02, c.y * 1.02, z);
      bar.rotation.z = c.rz;
      g.add(bar);
    }
    if (idx < 2) {
      const ra = new THREE.RectAreaLight(0xfff1de, 2.2, 0.12, ZMAX - ZMIN - 1);
      ra.position.set(c.x, c.y, 0);
      ra.lookAt(0, 0, 0);
      ra.rotateX(0);
      lightGroup.add(ra);
    }
  });
  g.add(lightGroup);
  const hemi = new THREE.HemisphereLight(0xf2f0ea, 0x6f7880, 0.22);
  g.add(hemi);

  // Shadow-casting key lights over the stations.
  const key = (x, y, z, tx, ty, tz) => {
    const s = new THREE.SpotLight(0xfff1e0, 3.2, 4.5, Math.PI / 3.2, 0.85, 1.6);
    s.position.set(x, y, z);
    s.target.position.set(tx, ty, tz);
    s.castShadow = true;
    s.shadow.mapSize.set(1024, 1024);
    s.shadow.bias = -0.0004;
    s.shadow.radius = 4;
    g.add(s, s.target);
  };
  key(0.45, 0.95, 0.9, -1.1, -0.1, 0.55);
  key(-0.2, 0.9, -1.9, 1.1, 0, -1.9);

  // Cables along two corners for density.
  for (const side of [-1, 1]) {
    const curve = new THREE.CatmullRomCurve3(Array.from({ length: 9 }, (_, i) => new THREE.Vector3(side * (W - 0.05), -H + 0.07 + Math.sin(i * 1.3) * 0.02, ZMIN + 0.4 + i * 1.15)));
    const cable = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.011, 8), mats.graphiteMatte);
    cable.castShadow = true;
    g.add(cable);
  }

  // Window end wall with a circular opening.
  const endShape = new THREE.Shape();
  endShape.moveTo(...pts[0]);
  pts.slice(1).forEach((p) => endShape.lineTo(...p));
  endShape.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0.02, 0.62, 0, Math.PI * 2, true);
  endShape.holes.push(hole);
  const endWall = new THREE.Mesh(new THREE.ShapeGeometry(endShape, 48), mats.aluPanel);
  endWall.position.z = ZMIN + 0.001;
  endWall.receiveShadow = true;
  g.add(endWall);
  const frame = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.045, 24, 96), mats.graphite);
  frame.position.set(0, 0.02, ZMIN + 0.03);
  g.add(frame);
  const bolts = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 10), mats.alu, 24);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    m4.compose(new THREE.Vector3(Math.cos(a) * 0.72, 0.02 + Math.sin(a) * 0.72, ZMIN + 0.02), q, new THREE.Vector3(1, 1, 1));
    bolts.setMatrixAt(i, m4);
  }
  g.add(bolts);
  const pane = new THREE.Mesh(new THREE.CircleGeometry(0.62, 64), new THREE.MeshStandardMaterial({ color: 0xcfe0f2, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.05, envMapIntensity: 0.5, depthWrite: false }));
  pane.position.set(0, 0.02, ZMIN - 0.01);
  g.add(pane);

  // Hatch end: closed hatch with hazard rim and handle.
  const hatchWall = new THREE.Mesh(new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); s.moveTo(...pts[0]); pts.slice(1).forEach((p) => s.lineTo(...p)); s.closePath(); return s; })()), mats.aluPanel);
  hatchWall.position.z = ZMAX - 0.001;
  hatchWall.rotation.y = Math.PI;
  g.add(hatchWall);
  const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.05, 64), mats.alu);
  hatch.rotation.x = Math.PI / 2;
  hatch.position.set(0, 0, ZMAX - 0.03);
  g.add(hatch);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.03, 12, 96), new THREE.MeshStandardMaterial({ map: hazardStripes(), roughness: 0.6 }));
  rim.position.set(0, 0, ZMAX - 0.05);
  g.add(rim);
  const handle = handrail(0.36, mats.graphite);
  handle.rotation.z = Math.PI / 2;
  handle.rotation.y = Math.PI;
  handle.position.set(0.32, 0, ZMAX - 0.08);
  g.add(handle);
  const hatchTape = tapeMesh("Node 2 this way", { w: 0.36, h: 0.08, fontSize: 60, seed: 77 });
  hatchTape.position.set(-0.2, 0.32, ZMAX - 0.06);
  hatchTape.rotation.y = Math.PI;
  g.add(hatchTape);

  return g;
}

function screenTexture(seed) {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 320;
  const x = c.getContext("2d");
  const rr = mulberry32(seed);
  x.fillStyle = "#0d1a2b"; x.fillRect(0, 0, 512, 320);
  x.strokeStyle = "rgba(111,168,245,0.25)";
  for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(0, 30 + i * 36); x.lineTo(512, 30 + i * 36); x.stroke(); }
  x.strokeStyle = "#6fa8f5"; x.lineWidth = 3; x.beginPath();
  let y = 170;
  for (let i = 0; i <= 512; i += 8) { y += (rr() - 0.5) * 26; y = Math.max(60, Math.min(280, y)); i ? x.lineTo(i, y) : x.moveTo(i, y); }
  x.stroke();
  x.fillStyle = "#c9d6e6"; x.font = "600 26px Archivo, sans-serif"; x.fillText("ECLSS  cabin air", 20, 34);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function handrail(len, mat) {
  const g = new THREE.Group();
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, len, 16), mat);
  bar.rotation.z = Math.PI / 2;
  bar.position.z = 0.06;
  bar.castShadow = true;
  g.add(bar);
  for (const s of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.018, 0.07, 12), mat);
    post.rotation.x = Math.PI / 2;
    post.position.set((s * len) / 2.2, 0, 0.03);
    post.castShadow = true;
    g.add(post);
  }
  return g;
}

// Floating clutter that drifts in microgravity: a pen, a drink pouch, a carabiner.
export function buildFloaters(mats) {
  const g = new THREE.Group();
  const r = mulberry32(8);
  const items = [];
  const make = (geo, mat) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.position.set((r() - 0.5) * 1.2, (r() - 0.5) * 0.9, -4 + r() * 8);
    m.rotation.set(r() * 6, r() * 6, r() * 6);
    m.userData.v = new THREE.Vector3((r() - 0.5) * 0.04, (r() - 0.5) * 0.03, (r() - 0.5) * 0.05);
    m.userData.w = new THREE.Vector3((r() - 0.5) * 0.4, (r() - 0.5) * 0.4, (r() - 0.5) * 0.4);
    g.add(m);
    items.push(m);
  };
  make(new THREE.CylinderGeometry(0.006, 0.006, 0.14, 8), mats.ink);
  make(new RoundedBoxGeometry(0.09, 0.13, 0.02, 2, 0.01), mats.aluBright);
  make(new THREE.TorusGeometry(0.03, 0.006, 8, 24), mats.gold);
  make(new RoundedBoxGeometry(0.16, 0.1, 0.06, 2, 0.02), mats.fabric);
  make(new THREE.CylinderGeometry(0.006, 0.006, 0.14, 8), mats.tag);
  return {
    group: g,
    update(dt) {
      for (const m of items) {
        m.position.addScaledVector(m.userData.v, dt);
        m.rotation.x += m.userData.w.x * dt;
        m.rotation.y += m.userData.w.y * dt;
        m.rotation.z += m.userData.w.z * dt;
        // soft bounce off the walls
        if (Math.abs(m.position.x) > W - 0.25) m.userData.v.x *= -1;
        if (Math.abs(m.position.y) > H - 0.25) m.userData.v.y *= -1;
        if (m.position.z < ZMIN + 0.8 || m.position.z > ZMAX - 0.6) m.userData.v.z *= -1;
      }
    },
  };
}
