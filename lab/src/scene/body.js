import * as THREE from "three";

// Clickable body figure: a holographic crew member above a projector pad. Each region is
// its own mesh named "part:<key>" so a click can be traced back to it; its colour shows the
// worst level among the indicators linked to it (see BODY_PARTS in main.js). Built from
// simple shapes so a detailed model can replace it later without changing the picking.
const COLORS = { ok: 0x7fd1b9, watch: 0xe0b25a, surgeon: 0xef8a6c, none: 0x8fb4e6 };

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

  const figure = new THREE.Group();
  group.add(figure);
  const parts = {};
  // Hologram look: edges glow (fresnel rim), centres stay see-through, faint scanlines drift
  // upward. Built on the standard material so status colours and lighting still apply.
  const holoTime = { value: 0 };
  const holo = (m) => {
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uHoloTime = holoTime;
      sh.fragmentShader = "uniform float uHoloTime;\n" + sh.fragmentShader.replace("#include <dithering_fragment>", `#include <dithering_fragment>
        float rim = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.2);
        float scan = 0.82 + 0.18 * sin(vViewPosition.y * 260.0 - uHoloTime * 3.0);
        gl_FragColor.rgb += diffuseColor.rgb * rim * 1.4;
        gl_FragColor.a = clamp(gl_FragColor.a * (0.28 + rim * 1.3) * scan, 0.0, 1.0);`);
    };
    return m;
  };
  const mat = (key) => holo(new THREE.MeshStandardMaterial({ color: COLORS.none, emissive: COLORS.none, emissiveIntensity: 0.35, transparent: true, opacity: 0.55, roughness: 0.4, depthWrite: false }));
  function add(key, geo, x, y, z, rx = 0, rz = 0) {
    const m = new THREE.Mesh(geo, parts[key]?.material || mat(key));
    m.position.set(x, y, z);
    m.rotation.set(rx, 0, rz);
    m.name = `part:${key}`;
    m.renderOrder = 2;
    figure.add(m);
    parts[key] = parts[key] || { material: m.material, materials: [m.material], meshes: [] };
    parts[key].meshes.push(m);
    return m;
  }
  const cap = (r, h) => new THREE.CapsuleGeometry(r, h, 6, 16);
  // head (brain), eyes, torso shell (muscles), heart, lungs, gut, spine and limbs (bones/muscles)
  add("brain", new THREE.SphereGeometry(0.075, 32, 24), 0, 0.42, 0);
  add("eyes", new THREE.SphereGeometry(0.013, 16, 12), -0.025, 0.425, 0.066);
  add("eyes", new THREE.SphereGeometry(0.013, 16, 12), 0.025, 0.425, 0.066);
  add("lungs", new THREE.SphereGeometry(0.05, 24, 16).scale(0.8, 1.3, 0.7), -0.045, 0.2, 0.0);
  add("lungs", new THREE.SphereGeometry(0.05, 24, 16).scale(0.8, 1.3, 0.7), 0.05, 0.2, 0.0);
  add("heart", new THREE.SphereGeometry(0.032, 24, 16), 0.015, 0.17, 0.03);
  add("gut", new THREE.SphereGeometry(0.075, 24, 16).scale(1, 0.75, 0.6), 0, 0.02, 0.01);
  add("bones", cap(0.012, 0.42), 0, 0.12, -0.04);              // spine
  add("bones", new THREE.TorusGeometry(0.06, 0.012, 8, 24, Math.PI), 0, -0.07, -0.01, Math.PI / 2, Math.PI); // pelvis
  add("muscles", cap(0.035, 0.26), -0.065, -0.27, 0);           // thighs and shins
  add("muscles", cap(0.035, 0.26), 0.065, -0.27, 0);
  add("bones", cap(0.018, 0.2), -0.065, -0.5, 0);
  add("bones", cap(0.018, 0.2), 0.065, -0.5, 0);
  add("immune", cap(0.024, 0.22), -0.16, 0.12, 0, 0, 0.18);     // arms carry the blood draws
  add("immune", cap(0.024, 0.22), 0.16, 0.12, 0, 0, -0.18);
  // translucent torso shell so the organs read as inside a body
  const shell = new THREE.Mesh(cap(0.11, 0.2), holo(new THREE.MeshStandardMaterial({ color: 0x9cc4ff, emissive: 0x6fa8f5, emissiveIntensity: 0.3, transparent: true, opacity: 0.35, depthWrite: false })));
  shell.position.y = 0.12;
  figure.add(shell);
  const neck = new THREE.Mesh(cap(0.025, 0.04), shell.material);
  neck.position.y = 0.32;
  figure.add(neck);

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
    if (!reduced) figure.rotation.y = Math.sin(t * 0.35) * 0.5;
    for (const [key, p] of Object.entries(parts)) {
      const on = key === selected;
      for (const mt of p.materials) {
        mt.opacity = selected ? (on ? 0.95 : 0.55) : 0.75;
        if (mt.emissive) mt.emissiveIntensity = on ? 1.0 + (reduced ? 0 : 0.25 * Math.sin(t * 4)) : 0.5;
      }
    }
    if (parts.heart && !reduced) parts.heart.meshes[0].scale.setScalar(1 + 0.08 * Math.max(0, Math.sin(t * 7)));
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
  function showOrgans() { figure.visible = true; shell.visible = false; neck.visible = false; }
  return { group, update, setStatus, select, pickables, adopt, showOrgans };
}
