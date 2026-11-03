import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mulberry32 } from "../engine/rng.js";
import { tapeMesh } from "./textures.js";

// Air station (life support): carbon dioxide scrubber cabinet, a cabin fan behind an intake
// grille, ducting, and visible airflow. Cabin air drifts toward the intake and speeds up as
// it is drawn in; the fan runs faster when CO2 is higher. Particle tint shifts slightly warm
// as CO2 rises. A panel shows today's cabin air readings.
export function buildAir(mats) {
  const group = new THREE.Group();
  group.name = "air";

  const rack = new THREE.Mesh(new RoundedBoxGeometry(1.0, 1.3, 0.05, 3, 0.015), new THREE.MeshStandardMaterial({ color: 0xe1e5e8, roughness: 0.7, metalness: 0.12 }));
  rack.receiveShadow = true;
  group.add(rack);

  // Scrubber cabinet with vent slats.
  const cab = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.5, 0.18, 3, 0.02), mats.aluCool);
  cab.position.set(-0.24, -0.3, 0.11);
  cab.castShadow = true;
  group.add(cab);
  for (let k = 0; k < 8; k++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.008, 0.01), mats.graphiteMatte);
    slat.position.set(-0.24, -0.45 + k * 0.035, 0.205);
    group.add(slat);
  }
  const cabTag = tapeMesh("CO2 scrubber", { w: 0.2, h: 0.045, fontSize: 64, seed: 901 });
  cabTag.position.set(-0.24, -0.05, 0.204);
  group.add(cabTag);

  // Fan housing, blades and intake grille.
  const fanC = new THREE.Vector3(0.24, 0.12, 0.07);
  const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 48, 1, true), mats.graphite);
  housing.rotation.x = Math.PI / 2;
  housing.position.copy(fanC);
  group.add(housing);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 24), mats.aluBright);
  hub.rotation.x = Math.PI / 2;
  hub.position.copy(fanC);
  group.add(hub);
  const rotor = new THREE.Group();
  rotor.position.copy(fanC);
  for (let b = 0; b < 7; b++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.045, 0.006), mats.aluCool);
    blade.position.x = 0.1;
    const holder = new THREE.Group();
    holder.rotation.z = (b / 7) * Math.PI * 2;
    blade.rotation.x = 0.5;
    holder.add(blade);
    rotor.add(holder);
  }
  group.add(rotor);
  const grille = new THREE.Group();
  for (let r = 1; r <= 4; r++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.05 * r, 0.004, 6, 64), mats.graphiteMatte);
    grille.add(ring);
  }
  for (let k = 0; k < 4; k++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.006, 0.006), mats.graphiteMatte);
    spoke.rotation.z = (k / 4) * Math.PI;
    grille.add(spoke);
  }
  grille.position.set(fanC.x, fanC.y, fanC.z + 0.045);
  group.add(grille);
  const fanTag = tapeMesh("Cabin fan intake", { w: 0.24, h: 0.045, fontSize: 60, seed: 902 });
  fanTag.position.set(fanC.x, fanC.y - 0.26, 0.04);
  group.add(fanTag);

  // Duct from the rack along the overhead.
  const duct = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.24, 0.35, 0.02), new THREE.Vector3(0.24, 0.62, 0.05), new THREE.Vector3(0.1, 0.75, 0.25), new THREE.Vector3(-0.4, 0.8, 0.4),
  ]), 40, 0.06, 16), mats.aluWarm);
  duct.castShadow = true;
  group.add(duct);

  // Readout panel.
  const canvas = document.createElement("canvas");
  canvas.width = 640; canvas.height = 400;
  const ctx = canvas.getContext("2d");
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.212), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  panel.position.set(-0.24, 0.2, 0.03);
  group.add(panel);
  const panelFrame = new THREE.Mesh(new RoundedBoxGeometry(0.37, 0.24, 0.02, 2, 0.01), mats.graphite);
  panelFrame.position.set(-0.24, 0.2, 0.018);
  group.add(panelFrame);

  // Airflow particles in front of the intake (local space, in front of the rack).
  const N = 260;
  const rng = mulberry32(77);
  const pos = new Float32Array(N * 3), seeds = new Float32Array(N * 4), col = new Float32Array(N * 3);
  const respawn = (i) => {
    const r = 0.12 + rng() * 0.3, a = rng() * Math.PI * 2;
    seeds.set([fanC.x + Math.cos(a) * r, fanC.y + Math.sin(a) * r * 0.8, 0.2 + rng() * 0.35, rng()], i * 4);
    pos.set([seeds[i * 4], seeds[i * 4 + 1], seeds[i * 4 + 2]], i * 3);
  };
  for (let i = 0; i < N; i++) respawn(i);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.005, vertexColors: true, transparent: true, opacity: 0.45, depthWrite: false }));
  pts.frustumCulled = false;
  group.add(pts);

  let co2 = 2.2, fanSpeed = 1;
  function draw(env) {
    ctx.fillStyle = "#0b131d"; ctx.fillRect(0, 0, 640, 400);
    ctx.fillStyle = "#8fa3b8"; ctx.font = "600 24px Archivo, sans-serif";
    ctx.fillText("Cabin air", 26, 40);
    ctx.fillStyle = env.co2 > 3 ? "#f0c27a" : "#e9edf2"; ctx.font = "800 72px Archivo, sans-serif";
    ctx.fillText(env.co2.toFixed(1), 26, 130);
    ctx.fillStyle = "#8fa3b8"; ctx.font = "600 24px Archivo, sans-serif";
    ctx.fillText("mmHg CO2", 180, 128);
    ctx.fillText(`7-day average ${env.co2_7d.toFixed(2)} mmHg`, 26, 180);
    ctx.fillText(`Temperature ${env.temp.toFixed(1)} °C   Humidity ${env.rh.toFixed(0)} %`, 26, 222);
    ctx.fillText(`Peak 1-hour CO2 ${env.peak1h.toFixed(1)} mmHg`, 26, 264);
    ctx.fillStyle = "#5f7186"; ctx.font = "600 20px Archivo, sans-serif";
    ctx.fillText(env.date ? `ISS telemetry ${env.date} (${env.mission}), NASA OSDR` : "Simulated", 26, 360);
    tex.needsUpdate = true;
  }

  const warm = new THREE.Color(0xf0c27a), cool = new THREE.Color(0xdfe8f2), tmp = new THREE.Color();
  let lastEnv = null;
  function update(dt, env) {
    if (env && (!lastEnv || env.day !== lastEnv.day)) { lastEnv = env; co2 = env.co2; draw(env); }
    const targetSpeed = 0.8 + 0.6 * Math.min(1, Math.max(0, (co2 - 2) / 1.8));
    fanSpeed += (targetSpeed - fanSpeed) * Math.min(1, dt);
    rotor.rotation.z -= dt * 14 * fanSpeed;
    tmp.copy(cool).lerp(warm, Math.min(1, Math.max(0, (co2 - 2.2) / 1.6)) * 0.6);
    for (let i = 0; i < N; i++) {
      const ix = i * 3;
      const dx = fanC.x - pos[ix], dy = fanC.y - pos[ix + 1], dz = fanC.z + 0.05 - pos[ix + 2];
      const d = Math.hypot(dx, dy, dz) + 1e-3;
      const v = (0.06 + 0.12 / (d + 0.15)) * fanSpeed;
      pos[ix] += (dx / d) * v * dt;
      pos[ix + 1] += (dy / d) * v * dt + Math.sin(seeds[i * 4 + 3] * 40 + pos[ix + 2] * 8) * 0.004 * dt;
      pos[ix + 2] += (dz / d) * v * dt;
      if (d < 0.06) respawn(i);
      const fade = Math.min(1, d * 3);
      col[ix] = tmp.r * fade; col[ix + 1] = tmp.g * fade; col[ix + 2] = tmp.b * fade;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
  }
  // Live-data parts stay visible when a loaded model replaces the built-in props.
  panel.userData.data = true;
  pts.userData.data = true;
  rotor.userData.data = true;
  return { group, update };
}
