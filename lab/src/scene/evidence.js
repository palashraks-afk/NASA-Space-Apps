import * as THREE from "three";
import { cholesky } from "../engine/linalg.js";
import { mulberry32, normal } from "../engine/rng.js";
import { plateMesh } from "./textures.js";

// Evidence chamber: each mote is one draw from the posterior over
//   x = effect (better to the right), y = day-to-day spread (up), z = weekly drift (depth).
// Draws use fixed per-mote random numbers (common random numbers), so when the posterior
// updates each mote moves smoothly to its new value instead of being re-sampled.
const N = 1600;
const R = 0.3, HGT = 0.8;
const XS = 0.25, YS = 0.34, ZS = 0.19;

export function buildEvidence(mats) {
  const group = new THREE.Group();
  group.name = "evidence";

  const base = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.05, R + 0.07, 0.07, 64), mats.graphite);
  base.position.y = -HGT / 2 - 0.035;
  const cap = base.clone();
  cap.position.y = HGT / 2 + 0.035;
  base.castShadow = cap.castShadow = true;
  group.add(base, cap);
  const ringGeo = new THREE.TorusGeometry(R + 0.055, 0.008, 12, 96);
  for (const y of [-HGT / 2 - 0.002, HGT / 2 + 0.002]) {
    const ring = new THREE.Mesh(ringGeo, mats.gold);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    group.add(ring);
  }
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(R, R, HGT, 72, 1, true), new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.03, metalness: 0, transmission: 0.96, thickness: 0.01, ior: 1.45, transparent: true, side: THREE.DoubleSide, envMapIntensity: 1.4, depthWrite: false,
  }));
  group.add(glass);
  const back = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.012, R - 0.012, HGT, 64, 1, true, Math.PI / 2, Math.PI), new THREE.MeshStandardMaterial({ color: 0x0b0f14, roughness: 0.9, metalness: 0.1, side: THREE.DoubleSide }));
  group.add(back);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(R - 0.01, 64), new THREE.MeshStandardMaterial({ color: 0x0b0f14, roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -HGT / 2 + 0.001;
  group.add(floor);
  const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.12), mats.graphite);
  bracket.name = "bracket";
  bracket.position.set(0, 0, -R - 0.08);
  group.add(bracket);

  const inner = new THREE.PointLight(0xcfe3ff, 0.35, 0.9, 2);
  inner.position.set(0, HGT / 2 - 0.05, 0.05);
  group.add(inner);
  const lamp = new THREE.Mesh(new THREE.TorusGeometry(R - 0.03, 0.004, 8, 96), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xcfe3ff, emissiveIntensity: 1.3 }));
  lamp.rotation.x = Math.PI / 2;
  lamp.position.y = HGT / 2 - 0.012;
  group.add(lamp);

  // Axes, faint etched lines.
  const axisMat = new THREE.LineBasicMaterial({ color: 0x8796a8, transparent: true, opacity: 0.55 });
  const axes = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-XS, -YS, 0), new THREE.Vector3(XS, -YS, 0),
    new THREE.Vector3(-XS, -YS, 0), new THREE.Vector3(-XS, YS, 0),
    new THREE.Vector3(-XS, -YS, -ZS), new THREE.Vector3(-XS, -YS, ZS),
  ]);
  group.add(new THREE.LineSegments(axes, axisMat));

  // Zero-effect plane and the band of "too small to matter".
  const zeroPlane = new THREE.Mesh(new THREE.PlaneGeometry(2 * ZS, 2 * YS), new THREE.MeshBasicMaterial({ color: 0x9fb7d6, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }));
  zeroPlane.rotation.y = Math.PI / 2;
  group.add(zeroPlane);
  const band = new THREE.Mesh(new THREE.BoxGeometry(1, 2 * YS, 2 * ZS), new THREE.MeshBasicMaterial({ color: 0xc9d1d8, transparent: true, opacity: 0.06, depthWrite: false }));
  group.add(band);
  const bandEdges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 2 * YS, 2 * ZS)), new THREE.LineBasicMaterial({ color: 0xc9d1d8, transparent: true, opacity: 0.25 }));
  group.add(bandEdges);

  const labels = [
    { text: "worse", x: -XS + 0.03 },
    { text: "too small to matter", x: 0 },
    { text: "better", x: XS - 0.03 },
  ].map((l, i) => {
    const t = plateMesh(l.text, { w: i === 1 ? 0.17 : 0.095, h: 0.03 });
    // follow the round plinth instead of floating flat in front of it
    const rb = R + 0.06, th = Math.asin(THREE.MathUtils.clamp(l.x / rb, -0.95, 0.95));
    t.position.set(rb * Math.sin(th), -HGT / 2 - 0.035, rb * Math.cos(th));
    t.rotation.y = th;
    group.add(t);
    return t;
  });
  // Every plate is riveted to the plinth: the spread plate on the base's left flank, the name on the cap.
  const mountOnRing = (plate, th, y) => {
    const rb = R + 0.06;
    plate.position.set(rb * Math.sin(th), y, rb * Math.cos(th));
    plate.rotation.y = th;
    group.add(plate);
    return plate;
  };
  const spreadLabel = mountOnRing(plateMesh("day-to-day spread", { w: 0.2, h: 0.03 }), -1.0, -HGT / 2 - 0.035);
  const nameTape = mountOnRing(plateMesh("Evidence chamber", { w: 0.2, h: 0.036 }), 0, HGT / 2 + 0.035);

  // Motes.
  const crn = mulberry32(2026);
  const Z = Array.from({ length: N }, () => [normal(crn), normal(crn), normal(crn), normal(crn), crn()]);
  const pos = new Float32Array(N * 3);
  const target = new Float32Array(N * 3);
  const vel = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const colTarget = new Float32Array(N * 3);
  const size = new Float32Array(N);
  for (let i = 0; i < N; i++) size[i] = 0.7 + crn() * 0.6;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.setAttribute("size", new THREE.BufferAttribute(size, 1));
  // Crisp, normally blended motes: colour carries meaning (blue = works, grey = too small to
  // matter, red = backfires), so dense regions must not wash out to white.
  const mat = new THREE.ShaderMaterial({
    uniforms: { uScale: { value: 11 * Math.min(window.devicePixelRatio, 1.75) }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute float size; attribute vec3 color; varying vec3 vColor; uniform float uScale;
      void main(){ vColor = color; vec4 mv = modelViewMatrix * vec4(position,1.0);
        gl_PointSize = size * uScale / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      void main(){ vec2 p = gl_PointCoord - 0.5; float d = length(p); if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.32, d); float rim = smoothstep(0.18, 0.0, d);
        gl_FragColor = vec4(vColor * (0.85 + 0.35 * rim), a * 0.85); }`,
    transparent: true, depthWrite: false, blending: THREE.NormalBlending,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.renderOrder = 10;
  glass.renderOrder = 5;
  group.add(points);

  const COL = { works: new THREE.Color(0x5b9cf0), harms: new THREE.Color(0xef5a4c), none: new THREE.Color(0xc4ccd3) };
  let range = { eff: 1, sig: 1, drift: 1, delta: 0.3 };

  function setRange({ delta, sd }) {
    range = { eff: Math.max(3 * delta, 2.6 * sd), sig: 2.4 * sd, drift: 0.8 * sd, delta };
    const w = (2 * delta / range.eff) * XS;
    band.scale.x = Math.max(0.002, w);
    bandEdges.scale.x = Math.max(0.002, w);
  }

  function setPosterior(post, { snap = false } = {}) {
    const comps = post.comps;
    const chol = comps.map((c) => cholesky(c.Vn));
    const cum = [];
    comps.reduce((a, c, i) => (cum[i] = a + c.w), 0);
    for (let i = 0; i < N; i++) {
      const [z1, z2, z3, z4, u] = Z[i];
      let ci = cum.findIndex((c) => u <= c);
      if (ci < 0) ci = comps.length - 1;
      const c = comps[ci], L = chol[ci];
      const k = c.an;
      const wh = 1 - 1 / (9 * k) + z4 * Math.sqrt(1 / (9 * k));
      const G = Math.max(1e-6, k * wh * wh * wh); // Wilson-Hilferty approximation to Gamma(k, 1)
      const sd = Math.sqrt(c.bn / G);
      const zz = [z1, z2, z3];
      const b = c.mn.map((m, r) => m + sd * L[r].reduce((s, l, q) => s + l * zz[q], 0));
      const eff = b[1], drift = b[2];
      target[3 * i] = THREE.MathUtils.clamp(eff / range.eff, -1, 1) * XS;
      target[3 * i + 1] = -YS + THREE.MathUtils.clamp(sd / range.sig, 0, 1) * 2 * YS;
      target[3 * i + 2] = THREE.MathUtils.clamp(drift / range.drift, -1, 1) * ZS;
      const cc = eff >= range.delta ? COL.works : eff <= -range.delta ? COL.harms : COL.none;
      colTarget[3 * i] = cc.r; colTarget[3 * i + 1] = cc.g; colTarget[3 * i + 2] = cc.b;
    }
    if (snap) { pos.set(target); col.set(colTarget); vel.fill(0); }
  }

  let stiffness = 26, damping = 7.5;
  function update(dt, time) {
    const h = Math.min(dt, 1 / 30);
    for (let i = 0; i < N * 3; i++) {
      const a = stiffness * (target[i] - pos[i]) - damping * vel[i];
      vel[i] += a * h;
      pos[i] += vel[i] * h;
      col[i] += (colTarget[i] - col[i]) * Math.min(1, h * 3);
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
    mat.uniforms.uTime.value = time;
  }

  return { group, setRange, setPosterior, update, labels, setMotion(reduced) { stiffness = reduced ? 400 : 26; damping = reduced ? 40 : 7.5; } };
}

export function priorAsPosterior(prior) {
  return { comps: [{ w: 1, mn: prior.m0.slice(), Vn: prior.V0.map((r) => r.slice()), an: prior.a0, bn: prior.b0 }] };
}
