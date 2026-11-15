import * as THREE from "three";
import { gltfLoader } from "./gltf.js";

// Clickable body figure: a holographic crew member floating above a projector pad.
//
// Proportions: segment lengths as fractions of stature H after Contini, Drillis & Bluestein
// (Human Factors, 1963), the classic anthropometric proportions (shoulder 0.818 H, hip joint 0.53 H, knee 0.285 H, upper arm 0.186 H,
// forearm 0.146 H, thigh 0.245 H, shank 0.246 H, foot 0.152 H, shoulder breadth 0.259 H, ...).
// Posture: the weightless "neutral body posture" the body drifts into when relaxed in orbit
// (NASA-STD-3000; re-measured on ISS crew by Kim, Young & Rajulu, NASA JSC, 2019): head and neck
// bent forward, torso slightly crouched, arms raised forward with bent elbows, hips and knees
// flexed. Angles below are approximate (the published figure labels its angles A to L).
// Organs sit at their usual adult positions and approximate sizes; the body's left is +x.
//
// Every clickable region is a mesh named "part:<key>"; its colour shows the worst level among
// the indicators linked to it (see sim/bodyParts.js). The skin is a see-through shell that
// is not clickable, so a click lands on the organ or bone inside.
const COLORS = { ok: 0x7fd1b9, watch: 0xe0b25a, surgeon: 0xef8a6c, none: 0x8fb4e6 };
const H = 1; // build at unit stature, then fit to the pad
const D2R = Math.PI / 180;
export const POSTURE = { neck: 24, trunk: 8, shoulderFlex: 36, shoulderAbd: 14, elbow: 80, hip: 50, knee: 48, ankle: 25 };

export function buildBody(mats) {
  const group = new THREE.Group();
  group.name = "body";

  const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.03, 48), mats.graphite);
  pad.position.y = -0.62;
  group.add(pad);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.005, 8, 64), new THREE.MeshBasicMaterial({ color: 0x8fc4ff, toneMapped: false }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.6;
  group.add(ring);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.2, 1.2, 48, 1, true), new THREE.MeshBasicMaterial({ color: 0x6fa8f5, transparent: true, opacity: 0.025, side: THREE.DoubleSide, depthWrite: false }));
  beam.position.y = -0.02;
  group.add(beam);

  // Hologram look: edges glow (fresnel rim), centres stay see-through, faint scanlines drift.
  const holoTime = { value: 0 };
  const holo = (m, rimBoost = 1.4) => {
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uHoloTime = holoTime;
      sh.fragmentShader = "uniform float uHoloTime;\n" + sh.fragmentShader.replace("#include <dithering_fragment>", `#include <dithering_fragment>
        float rim = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.2);
        float scan = 0.82 + 0.18 * sin(vViewPosition.y * 260.0 - uHoloTime * 3.0);
        gl_FragColor.rgb += diffuseColor.rgb * rim * ${rimBoost.toFixed(2)};
        gl_FragColor.a = clamp(gl_FragColor.a * (0.28 + rim * 1.3) * scan, 0.0, 1.0);`);
    };
    return m;
  };
  const partMat = () => holo(new THREE.MeshStandardMaterial({ color: COLORS.none, emissive: COLORS.none, emissiveIntensity: 0.35, transparent: true, opacity: 0.55, roughness: 0.4, depthWrite: false }));
  const skinMat = holo(new THREE.MeshStandardMaterial({ color: 0x9cc4ff, emissive: 0x6fa8f5, emissiveIntensity: 0.25, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.FrontSide }), 1.1);

  const figure = new THREE.Group(); // fitted to the pad below
  group.add(figure);
  const parts = {};
  const skin = [];

  function part(key, geo, parent, pos = [0, 0, 0], rot = [0, 0, 0]) {
    if (!parts[key]) { const m0 = partMat(); parts[key] = { material: m0, materials: [m0], meshes: [] }; }
    const m = new THREE.Mesh(geo, parts[key].material);
    m.position.set(...pos);
    m.rotation.set(...rot);
    m.name = `part:${key}`;
    m.renderOrder = 2;
    parent.add(m);
    parts[key].meshes.push(m);
    return m;
  }
  function shell(geo, parent, pos = [0, 0, 0], rot = [0, 0, 0]) {
    const m = new THREE.Mesh(geo, skinMat);
    m.position.set(...pos);
    m.rotation.set(...rot);
    m.renderOrder = 3;
    parent.add(m);
    skin.push(m);
    return m;
  }
  const ellip = (rx, ry, rz, seg = 24) => new THREE.SphereGeometry(1, seg, Math.round(seg * 0.75)).scale(rx, ry, rz);
  // A limb segment hanging down its joint's -y axis: tapered, with rounded ends.
  function segment(len, r1, r2, steps = 10) {
    const pts = [];
    for (let i = 0; i <= steps; i++) { const a = -Math.PI / 2 + (i / steps) * (Math.PI / 2); pts.push(new THREE.Vector2(Math.cos(a) * r1, Math.sin(a) * r1)); }
    for (let i = 1; i <= 6; i++) { const t = i / 6; pts.push(new THREE.Vector2(r1 + (r2 - r1) * t, len * t)); }
    for (let i = 1; i <= steps; i++) { const a = (i / steps) * (Math.PI / 2); pts.push(new THREE.Vector2(Math.cos(a) * r2, len + Math.sin(a) * r2)); }
    const g = new THREE.LatheGeometry(pts, 20);
    g.rotateX(Math.PI); // run from the joint downwards
    return g;
  }
  const joint = (parent, pos, rot = [0, 0, 0]) => { const g = new THREE.Group(); g.position.set(...pos); g.rotation.set(...rot); parent.add(g); return g; };

  // ----- pelvis and trunk (origin at the hip-joint level, 0.53 H) -----
  const P = POSTURE;
  const pelvis = joint(figure, [0, 0, 0]);
  const trunk = joint(pelvis, [0, 0.02 * H, 0], [P.trunk * D2R, 0, 0]);
  // Torso skin: a lathe profile (half-breadth by height), flattened front to back.
  const prof = [[-0.04, 0.0], [-0.035, 0.085], [0.0, 0.098], [0.05, 0.088], [0.1, 0.075], [0.15, 0.084], [0.2, 0.092], [0.25, 0.098], [0.28, 0.1], [0.295, 0.085], [0.305, 0.05], [0.315, 0.036], [0.35, 0.034], [0.36, 0.0]];
  shell(new THREE.LatheGeometry(prof.map(([y, r]) => new THREE.Vector2(r * H, y * H)), 32).scale(1, 1, 0.68), trunk);

  // Skeleton: 24 vertebrae, sacrum, rib cage, sternum, clavicles, pelvis.
  for (let i = 0; i < 24; i++) {
    const y = (0.02 + i * 0.0125) * H, cervical = i >= 17;
    part("bones", new THREE.CylinderGeometry((cervical ? 0.008 : 0.011) * H, (cervical ? 0.008 : 0.012) * H, 0.0085 * H, 10), trunk, [0, y, -0.048 * H - (i > 4 && i < 17 ? 0.006 * Math.sin(((i - 5) / 12) * Math.PI) * H : 0)]);
  }
  part("bones", new THREE.ConeGeometry(0.02 * H, 0.05 * H, 10), trunk, [0, -0.01 * H, -0.05 * H], [Math.PI, 0, 0]);
  for (let i = 0; i < 10; i++) {
    const y = (0.15 + i * 0.013) * H, w = (0.078 + 0.012 * Math.sin((i / 9) * Math.PI)) * H;
    const rib = new THREE.TorusGeometry(1, 0.0035 * H / w, 5, 28, Math.PI * 1.55);
    rib.scale(w, w * 0.7, 1);
    part("bones", rib, trunk, [0, y, -0.004 * H], [Math.PI / 2 + 0.25, 0, Math.PI * 0.725]);
  }
  part("bones", new THREE.BoxGeometry(0.018 * H, 0.1 * H, 0.008 * H), trunk, [0, 0.235 * H, 0.06 * H], [-0.12, 0, 0]);
  for (const s of [-1, 1]) {
    part("bones", segment(0.085 * H, 0.004 * H, 0.004 * H), trunk, [s * 0.015 * H, 0.29 * H, 0.045 * H], [0, 0, s * (Math.PI / 2 - 0.12)]);
    const wing = new THREE.TorusGeometry(0.05 * H, 0.008 * H, 6, 16, Math.PI * 0.9);
    wing.scale(1, 1, 0.6);
    part("bones", wing, pelvis, [s * 0.05 * H, 0.03 * H, -0.01 * H], [0.2, s * 0.6, s * 0.4]);
  }

  // Organs (trunk coordinates: y up from hip level, z forward).
  part("lungs", ellip(0.042, 0.078, 0.05), trunk, [-0.05 * H, 0.21 * H, -0.005 * H]); // right lung, larger (3 lobes)
  part("lungs", ellip(0.037, 0.072, 0.048), trunk, [0.052 * H, 0.215 * H, -0.01 * H]); // left lung, heart notch side
  for (const s of [-1, 1]) part("lungs", segment(0.05 * H, 0.004 * H, 0.004 * H), trunk, [s * 0.012 * H, 0.27 * H, 0.0], [0, 0, s * 0.45]); // main bronchi
  part("lungs", segment(0.06 * H, 0.0055 * H, 0.0055 * H), trunk, [0, 0.33 * H, 0.008 * H]); // trachea
  const heart = part("heart", ellip(0.032, 0.04, 0.03), trunk, [0.016 * H, 0.18 * H, 0.025 * H], [0.3, 0, -0.5]);
  const arch = new THREE.CatmullRomCurve3([[0.008, 0.2, 0.02], [0.0, 0.245, 0.01], [-0.004, 0.25, -0.015], [0.0, 0.23, -0.035], [0.004, 0.15, -0.035], [0.004, 0.02, -0.03]].map(([x, y, z]) => new THREE.Vector3(x * H, y * H, z * H)));
  part("heart", new THREE.TubeGeometry(arch, 40, 0.0055 * H, 8), trunk); // aorta
  part("heart", new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[-0.012, 0.2, 0.015], [-0.014, 0.12, -0.01], [-0.012, 0.02, -0.02]].map(([x, y, z]) => new THREE.Vector3(x * H, y * H, z * H))), 24, 0.0065 * H, 8), trunk); // inferior vena cava
  part("gut", ellip(0.07, 0.034, 0.045), trunk, [-0.03 * H, 0.125 * H, 0.012 * H], [0, 0, 0.18]); // liver
  part("gut", ellip(0.034, 0.042, 0.024), trunk, [0.042 * H, 0.115 * H, 0.025 * H], [0, 0, -0.5]); // stomach
  for (const s of [-1, 1]) part("gut", ellip(0.016, 0.03, 0.014), trunk, [s * 0.042 * H, 0.085 * H, -0.04 * H], [0, 0, s * 0.2]); // kidneys
  const small = new THREE.TorusKnotGeometry(0.03 * H, 0.0075 * H, 140, 8, 3, 7);
  small.scale(1, 0.85, 0.55);
  part("gut", small, trunk, [0, 0.035 * H, 0.025 * H]); // small intestine
  part("gut", new THREE.TorusGeometry(0.05 * H, 0.0085 * H, 8, 40, Math.PI * 1.5), trunk, [0, 0.04 * H, 0.012 * H], [0, 0, -Math.PI * 0.25]); // colon
  part("immune", ellip(0.012, 0.022, 0.01), trunk, [0.07 * H, 0.13 * H, -0.03 * H], [0, 0, -0.4]); // spleen
  part("immune", ellip(0.014, 0.018, 0.008), trunk, [0, 0.265 * H, 0.04 * H]); // thymus
  for (const [x, y, z] of [[-0.03, 0.32, 0.01], [0.03, 0.32, 0.01], [-0.095, 0.255, 0.0], [0.095, 0.255, 0.0], [-0.06, -0.01, 0.045], [0.06, -0.01, 0.045]]) {
    for (let k = 0; k < 3; k++) part("immune", new THREE.SphereGeometry(0.0045 * H, 8, 6), trunk, [(x + (k - 1) * 0.006) * H, (y + k * 0.006) * H, z * H]); // lymph nodes
  }

  // ----- neck and head (head 0.13 H tall, 0.089 H wide, 0.111 H long) -----
  const neck = joint(trunk, [0, 0.31 * H, 0], [P.neck * D2R, 0, 0]);
  const head = joint(neck, [0, 0.085 * H, 0.008 * H]);
  shell(ellip(0.046, 0.065, 0.056), head);
  part("brain", ellip(0.039, 0.034, 0.05), head, [0, 0.022 * H, -0.004 * H]);
  part("brain", ellip(0.024, 0.014, 0.02), head, [0, -0.006 * H, -0.032 * H]); // cerebellum
  for (const s of [-1, 1]) part("eyes", new THREE.SphereGeometry(0.0069 * H, 16, 12), head, [s * 0.017 * H, 0.004 * H, 0.046 * H]);

  // ----- arms (shoulder joints 0.818 H high, half the 0.259 H shoulder breadth out) -----
  for (const s of [-1, 1]) {
    const sh = joint(trunk, [s * 0.112 * H, 0.27 * H, -0.005 * H], [-P.shoulderFlex * D2R, 0, s * P.shoulderAbd * D2R]);
    shell(segment(0.186 * H, 0.03 * H, 0.024 * H), sh);
    part("muscles", segment(0.15 * H, 0.022 * H, 0.016 * H), sh, [0, -0.015 * H, 0.004 * H]); // biceps and triceps
    part("bones", segment(0.18 * H, 0.0065 * H, 0.006 * H), sh); // humerus
    const el = joint(sh, [0, -0.186 * H, 0], [-P.elbow * D2R, 0, 0]);
    shell(segment(0.146 * H, 0.023 * H, 0.017 * H), el);
    part("bones", segment(0.14 * H, 0.005 * H, 0.004 * H), el, [0.004 * H, 0, 0]); // radius and ulna
    part("bones", segment(0.14 * H, 0.004 * H, 0.004 * H), el, [-0.006 * H, 0, 0]);
    const wr = joint(el, [0, -0.146 * H, 0], [-0.15, 0, 0]);
    shell(ellip(0.024, 0.05, 0.011).translate(0, -0.05 * H, 0), wr);
  }

  // ----- legs (hip joints about 0.08 H either side of the midline) -----
  for (const s of [-1, 1]) {
    const hip = joint(pelvis, [s * 0.082 * H, 0, 0], [-P.hip * D2R, 0, s * 0.04]);
    shell(segment(0.245 * H, 0.052 * H, 0.032 * H), hip);
    part("muscles", segment(0.2 * H, 0.043 * H, 0.025 * H), hip, [0, -0.02 * H, 0.006 * H]); // quadriceps and hamstrings
    part("bones", segment(0.24 * H, 0.008 * H, 0.007 * H), hip); // femur
    const kn = joint(hip, [0, -0.245 * H, 0], [P.knee * D2R, 0, 0]);
    shell(segment(0.246 * H, 0.033 * H, 0.02 * H), kn);
    part("muscles", segment(0.13 * H, 0.025 * H, 0.016 * H), kn, [0, -0.02 * H, -0.01 * H]); // calf
    part("bones", segment(0.24 * H, 0.0065 * H, 0.0055 * H), kn, [0.002 * H, 0, 0.004 * H]); // tibia
    part("bones", segment(0.235 * H, 0.0035 * H, 0.0035 * H), kn, [s * 0.012 * H, 0, -0.004 * H]); // fibula
    const an = joint(kn, [0, -0.246 * H, 0], [P.ankle * D2R, 0, 0]);
    shell(ellip(0.026, 0.02, 0.076).translate(0, -0.015 * H, 0.05 * H), an); // foot, 0.152 H long
  }

  // Fit to the pad: about 1.04 units tall, toes just above the pad, centred.
  figure.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(figure), size = box.getSize(new THREE.Vector3()), mid = box.getCenter(new THREE.Vector3());
  const fit = 1.04 / size.y;
  figure.scale.setScalar(fit);
  const baseY = -0.56 - box.min.y * fit;
  figure.position.set(-mid.x * fit, baseY, -mid.z * fit);

  // ---------- real anatomy ----------
  // The hand-built figure above is only a fallback. The real body is BodyParts3D anatomy (DBCLS,
  // CC BY 4.0) via open-anatomy-3d (CC BY 4.0): each structure is mapped to one of Sol Lab's body
  // systems and merged into one mesh per system, so the figure costs about 10 draw calls.
  const SYSTEM_OF = {};
  const assign = (key, names) => names.forEach((n) => (SYSTEM_OF[n] = key));
  assign("brain", ["brain", "brainstem", "cerebellum", "pituitary", "spinal_cord", "cranial_nerves"]);
  assign("eyes", ["eye_l", "eye_r"]);
  assign("heart", ["heart", "aorta", "coronary_arteries", "vena_cava_inferior", "vena_cava_superior", "carotid_l", "carotid_r"]);
  assign("lungs", ["lung_l", "lung_r", "bronchi", "trachea", "larynx", "diaphragm"]);
  assign("gut", ["liver", "stomach", "small_intestine", "colon", "appendix", "gallbladder", "pancreas", "esophagus", "kidney_l", "kidney_r", "adrenal_l", "adrenal_r", "ureter_l", "ureter_r", "bladder"]);
  assign("muscles", ["quadriceps_l", "quadriceps_r", "hamstrings_l", "hamstrings_r", "calf_l", "calf_r", "back_muscles_l", "back_muscles_r"]);
  assign("immune", ["spleen", "thymus"]);
  const real = new THREE.Group();
  real.visible = false;
  group.add(real);
  let realHeart = null;
  const v3 = new THREE.Vector3(), n3 = new THREE.Vector3(), nm = new THREE.Matrix3();
  function bake(list) { // merge meshes into one float geometry in model space
    let nv = 0, ni = 0;
    for (const m of list) { nv += m.geometry.attributes.position.count; ni += m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count; }
    const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), idx = new Uint32Array(ni);
    let ov = 0, oi = 0;
    for (const m of list) {
      const g = m.geometry, P = g.attributes.position, N = g.attributes.normal;
      nm.getNormalMatrix(m.matrixWorld);
      for (let i = 0; i < P.count; i++) {
        v3.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld);
        pos.set([v3.x, v3.y, v3.z], (ov + i) * 3);
        if (N) { n3.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nor.set([n3.x, n3.y, n3.z], (ov + i) * 3); }
      }
      if (g.index) for (let i = 0; i < g.index.count; i++) idx[oi + i] = g.index.getX(i) + ov;
      else for (let i = 0; i < P.count; i++) idx[oi + i] = i + ov;
      ov += P.count; oi += g.index ? g.index.count : P.count;
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    out.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
    out.setIndex(new THREE.BufferAttribute(idx, 1));
    if (!list.every((m) => m.geometry.attributes.normal)) out.computeVertexNormals();
    return out;
  }
  gltfLoader().load(`${import.meta.env.BASE_URL}models/anatomy/anatomy-male.glb`, (gltf) => {
    const root = gltf.scene;
    root.updateMatrixWorld(true);
    const groups = {}, skinList = [];
    root.traverse((o) => {
      if (!o.isMesh) return;
      const sys = o.parent && o.parent.name;
      if (o.name === "skin" || sys === "skin") skinList.push(o);
      else if (sys === "skeleton") (groups.bones ||= []).push(o);
      else if (SYSTEM_OF[o.name]) (groups[SYSTEM_OF[o.name]] ||= []).push(o);
    });
    const holder = new THREE.Group();
    if (skinList.length) { const sk = new THREE.Mesh(bake(skinList), skinMat); sk.renderOrder = 3; holder.add(sk); }
    for (const [key, list] of Object.entries(groups)) {
      const geo = bake(list);
      geo.computeBoundingBox();
      const c = geo.boundingBox.getCenter(new THREE.Vector3());
      geo.translate(-c.x, -c.y, -c.z);
      const mesh = new THREE.Mesh(geo, parts[key].material);
      mesh.position.copy(c);
      mesh.name = `part:${key}`;
      mesh.renderOrder = 2;
      holder.add(mesh);
      parts[key].meshes = [mesh];
      if (key === "heart") realHeart = mesh;
    }
    // Fit like the fallback figure: about 1.04 units tall, feet just above the pad, centred.
    const box = new THREE.Box3().setFromObject(holder), size = box.getSize(new THREE.Vector3()), mid = box.getCenter(new THREE.Vector3());
    const k = 1.04 / size.y;
    holder.scale.setScalar(k);
    holder.position.set(-mid.x * k, -0.56 - box.min.y * k, -mid.z * k);
    real.add(holder);
    real.visible = true;
    figure.visible = false;
    gltf.scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
  }, undefined, (err) => console.warn("Anatomy model not loaded; using the built-in figure.", err && err.message));

  let selected = null, t = 0;
  function setStatus(map) {
    for (const [key, p] of Object.entries(parts)) {
      const c = COLORS[map[key] || "none"];
      for (const mt of p.materials) { mt.color.setHex(c); if (mt.emissive) mt.emissive.setHex(c); }
    }
  }
  function select(key) { selected = key; }
  function update(dt, reduced) {
    if (!reduced) holoTime.value += dt;
    t += dt;
    if (!reduced) {
      figure.rotation.y = real.rotation.y = Math.sin(t * 0.35) * 0.5;
      figure.position.y = baseY + 0.012 * Math.sin(t * 0.8); // drifting, as a relaxed body does in orbit
    }
    for (const [key, p] of Object.entries(parts)) {
      const on = key === selected;
      for (const mt of p.materials) {
        mt.opacity = selected ? (on ? 0.95 : 0.4) : 0.7;
        if (mt.emissive) mt.emissiveIntensity = on ? 1.0 + (reduced ? 0 : 0.25 * Math.sin(t * 4)) : 0.5;
      }
    }
    if (!reduced) (realHeart || heart).scale.setScalar(1 + 0.05 * Math.max(0, Math.sin(t * 7)));
  }
  const shown = (o) => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
  const pickables = () => Object.values(parts).flatMap((p) => p.meshes).filter(shown);
  // A loaded model's named mesh takes over a part (see models.js).
  function adopt(key, mesh) {
    if (!parts[key]) return;
    if (!parts[key].adopted) { parts[key].adopted = true; parts[key].meshes = []; parts[key].materials = []; }
    parts[key].meshes.push(mesh);
    parts[key].materials.push(mesh.material);
  }
  // A loaded model without named parts: keep the built-in organs visible inside it.
  function showOrgans() { figure.visible = true; for (const m of skin) m.visible = false; }
  return { group, update, setStatus, select, pickables, adopt, showOrgans };
}
