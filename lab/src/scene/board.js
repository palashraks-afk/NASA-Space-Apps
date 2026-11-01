import * as THREE from "three";
import * as CANNON from "cannon-es";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mulberry32 } from "../engine/rng.js";
import { tapeMesh } from "./textures.js";

// Procedure board: one Velcro patch per mission day (rows are weeks). When the schedule is
// randomized, tokens leave the cargo bag and drift across the cabin in zero gravity
// (cannon-es, no gravity, light damping), bump into each other, and are pulled onto their
// patch by a spring until they stick. Tokens can be poked while they float.
const COLS = 7, ROWS = 8;
const PW = 0.12, PH = 0.085, GX = 0.155, GY = 0.112;
const TOKEN_R = 0.04;

export function buildBoard(mats) {
  const group = new THREE.Group();
  group.name = "board";
  const BW = COLS * GX + 0.2, BH = ROWS * GY + 0.22;

  const panel = new THREE.Mesh(new RoundedBoxGeometry(BW, BH, 0.03, 3, 0.012), new THREE.MeshStandardMaterial({ color: 0xe2e5e7, roughness: 0.8, metalness: 0.05 }));
  panel.position.z = -0.015;
  panel.receiveShadow = true;
  group.add(panel);
  const frame = new THREE.Mesh(new RoundedBoxGeometry(BW + 0.04, BH + 0.04, 0.02, 3, 0.012), mats.graphite);
  frame.position.z = -0.03;
  group.add(frame);

  const origin = new THREE.Vector2(-((COLS - 1) * GX) / 2 + 0.04, ((ROWS - 1) * GY) / 2 - 0.03);
  const patchPos = (day) => new THREE.Vector3(origin.x + (day % COLS) * GX, origin.y - Math.floor(day / COLS) * GY, 0.004);
  const patchGeo = new THREE.PlaneGeometry(PW, PH);
  const patches = [];
  for (let d = 0; d < COLS * ROWS; d++) {
    const p = new THREE.Mesh(patchGeo, mats.velcro.clone());
    p.position.copy(patchPos(d));
    p.receiveShadow = true;
    group.add(p);
    patches.push(p);
  }
  for (let w = 0; w < ROWS; w++) {
    const t = tapeMesh(`week ${w + 1}`, { w: 0.1, h: 0.032, width: 320, height: 112, fontSize: 64, seed: 600 + w });
    t.position.set(origin.x - 0.13, origin.y - w * GY, 0.006);
    group.add(t);
  }
  const title = tapeMesh("Procedure board", { w: 0.34, h: 0.065, fontSize: 72, seed: 620 });
  title.position.set(-0.1, BH / 2 + 0.01, 0.01);
  title.rotation.z = 0.015;
  group.add(title);

  const bag = new THREE.Mesh(new RoundedBoxGeometry(0.26, 0.2, 0.16, 4, 0.04), mats.fabricBlue);
  bag.position.set(BW / 2 + 0.2, -BH / 2 + 0.12, 0.1);
  bag.castShadow = true;
  group.add(bag);
  const bagTape = tapeMesh("Schedule tokens", { w: 0.2, h: 0.045, fontSize: 60, seed: 630 });
  bagTape.position.set(bag.position.x, bag.position.y + 0.02, bag.position.z + 0.081);
  group.add(bagTape);

  // current-day marker
  const marker = new THREE.Mesh(new THREE.RingGeometry(0.066, 0.074, 48), new THREE.MeshBasicMaterial({ color: 0xffd28a }));
  marker.visible = false;
  group.add(marker);

  // Token visuals: a puck with a hand-lettered top. A = usual routine, B = the change.
  const tokenSide = { A: mats.aluBright, B: mats.ink, W: mats.aluBright };
  const topMat = (letter, bg, ink) => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    g.fillStyle = bg; g.fillRect(0, 0, 128, 128);
    g.fillStyle = ink; g.textAlign = "center"; g.textBaseline = "middle";
    g.font = letter.length > 1 ? '800 34px "Archivo"' : '800 70px "Archivo"';
    g.fillText(letter, 64, 68);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.center.set(0.5, 0.5);
    tex.rotation = Math.PI / 2; // the cylinder cap's UVs are turned a quarter relative to the board
    return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
  };
  const tops = { A: topMat("A", "#eef1f3", "#16181b"), B: topMat("B", "#1d3f72", "#f6f6f1"), W: topMat("wait", "#f6f6f1", "#d6342a") };
  const tokenGeo = new THREE.CylinderGeometry(TOKEN_R, TOKEN_R, 0.018, 32);
  tokenGeo.rotateX(Math.PI / 2);

  // Physics world in board-local coordinates.
  const world = new CANNON.World({ gravity: new CANNON.Vec3(0, 0, 0) });
  world.defaultContactMaterial.restitution = 0.45;
  world.defaultContactMaterial.friction = 0.1;
  const wall = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
  world.addBody(wall); // plane at z = 0 facing +z: the board surface

  let tokens = [];
  const clearTokens = () => {
    for (const t of tokens) { group.remove(t.mesh); if (t.body) world.removeBody(t.body); }
    tokens = [];
  };

  function randomize(schedule, { onDone, instant = false } = {}) {
    clearTokens();
    const r = mulberry32(schedule.length * 31 + schedule.reduce((a, s, i) => a + s.arm * (i + 1), 0));
    schedule.slice(0, COLS * ROWS).forEach((s, day) => {
      const kind = s.washout ? "W" : s.arm ? "B" : "A";
      const mesh = new THREE.Mesh(tokenGeo, [tokenSide[kind], tops[kind], tokenSide[kind]]);
      mesh.castShadow = true;
      const target = patchPos(day).add(new THREE.Vector3(0, 0, 0.011));
      const tok = { mesh, target, day, kind, state: "waiting", delay: instant ? 0 : day * 0.035, age: 0, body: null };
      if (instant) {
        tok.state = "stuck";
        mesh.position.copy(target);
        mesh.rotation.set(0, 0, 0);
      } else {
        mesh.visible = false;
      }
      group.add(mesh);
      tokens.push(tok);
    });
    tokens._onDone = onDone;
    tokens._rng = r;
    if (instant && onDone) onDone();
  }

  function launch(tok, r) {
    const body = new CANNON.Body({ mass: 0.04, shape: new CANNON.Sphere(TOKEN_R), linearDamping: 0.18, angularDamping: 0.25 });
    body.position.set(bag.position.x - 0.05 + (r() - 0.5) * 0.05, bag.position.y + 0.08, bag.position.z + 0.04);
    body.velocity.set(-0.25 - r() * 0.55, 0.15 + r() * 0.45, 0.05 + r() * 0.25);
    body.angularVelocity.set((r() - 0.5) * 12, (r() - 0.5) * 12, (r() - 0.5) * 12);
    world.addBody(body);
    tok.body = body;
    tok.state = "floating";
    tok.mesh.visible = true;
  }

  const tmp = new CANNON.Vec3();
  function update(dt) {
    if (!tokens.length) return;
    const h = Math.min(dt, 1 / 30);
    let pending = 0;
    for (const t of tokens) {
      if (t.state === "waiting") {
        t.delay -= h;
        if (t.delay <= 0) launch(t, tokens._rng);
        pending++;
        continue;
      }
      if (t.state !== "floating") continue;
      pending++;
      t.age += h;
      // spring toward the patch, ramping up so tokens drift and tumble first
      const k = Math.min(1, Math.max(0, (t.age - 0.6) / 1.4)) * 1.6;
      const b = t.body;
      // spring toward a point just in front of the patch (the token then presses onto it)
      tmp.set(t.target.x - b.position.x, t.target.y - b.position.y, t.target.z + 0.03 - b.position.z);
      b.applyForce(new CANNON.Vec3(tmp.x * k * 0.3 - b.velocity.x * k * 0.16, tmp.y * k * 0.3 - b.velocity.y * k * 0.16, tmp.z * k * 0.3 - b.velocity.z * k * 0.16));
      const dist = Math.hypot(tmp.x, tmp.y, tmp.z);
      if ((t.age > 1.2 && dist < 0.03 && b.velocity.length() < 0.3) || t.age > 7) {
        world.removeBody(b);
        t.body = null;
        t.state = "sticking";
        t.stickT = 0;
        t.from = t.mesh.position.clone();
        t.fromQ = t.mesh.quaternion.clone();
      }
    }
    world.step(1 / 120, h, 4);
    for (const t of tokens) {
      if (t.state === "floating") {
        t.mesh.position.set(t.body.position.x, t.body.position.y, t.body.position.z);
        t.mesh.quaternion.set(t.body.quaternion.x, t.body.quaternion.y, t.body.quaternion.z, t.body.quaternion.w);
      } else if (t.state === "sticking") {
        pending++;
        t.stickT = Math.min(1, t.stickT + h * 5);
        const e = 1 - Math.pow(1 - t.stickT, 3);
        t.mesh.position.lerpVectors(t.from, t.target, e);
        t.mesh.quaternion.slerpQuaternions(t.fromQ, new THREE.Quaternion(), e);
        const pop = 1 + Math.sin(t.stickT * Math.PI) * 0.18;
        t.mesh.scale.setScalar(pop);
        if (t.stickT >= 1) { t.state = "stuck"; t.mesh.scale.setScalar(1); }
      }
    }
    if (pending === 0 && tokens._onDone) { const f = tokens._onDone; tokens._onDone = null; f(); }
  }

  function poke(mesh, dir) {
    const t = tokens.find((k) => k.mesh === mesh && k.state === "floating");
    if (!t) return false;
    t.body.applyImpulse(new CANNON.Vec3(dir.x * 0.012, dir.y * 0.012, dir.z * 0.012));
    t.age = Math.min(t.age, 0.4);
    return true;
  }

  function highlightDay(day) {
    if (day == null || day < 0 || day >= COLS * ROWS) { marker.visible = false; return; }
    marker.visible = true;
    marker.position.copy(patchPos(day)).add(new THREE.Vector3(0, 0, 0.03));
    patches.forEach((p, i) => { p.material.color.setHex(i < day ? 0xbfc6cc : 0xffffff); });
  }

  return { group, randomize, update, poke, highlightDay, tokenMeshes: () => tokens.filter((t) => t.state === "floating").map((t) => t.mesh), clear: clearTokens, settled: () => tokens.every((t) => t.state === "stuck"), stats: () => tokens.reduce((a, t) => ((a[t.state] = (a[t.state] || 0) + 1), a), {}) };
}
