import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mulberry32 } from "../engine/rng.js";
import { tapeMesh } from "./textures.js";

// Galley: food warmer, potable water dispenser, a Velcro tray of food pouches and cans, and
// a screen with the selected crew member's meals for the day against NASA nutrition targets.
export function buildGalley(mats) {
  const group = new THREE.Group();
  group.name = "galley";

  const rack = new THREE.Mesh(new RoundedBoxGeometry(1.05, 1.25, 0.05, 3, 0.015), new THREE.MeshStandardMaterial({ color: 0xe8e6e1, roughness: 0.7, metalness: 0.08 }));
  rack.receiveShadow = true;
  group.add(rack);

  // Food warmer (briefcase-style) with a handle.
  const warmer = new THREE.Mesh(new RoundedBoxGeometry(0.36, 0.22, 0.14, 3, 0.02), mats.aluCool);
  warmer.position.set(-0.28, 0.3, 0.1);
  warmer.castShadow = true;
  group.add(warmer);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.008, 8, 24, Math.PI), mats.graphite);
  handle.position.set(-0.28, 0.42, 0.1);
  group.add(handle);
  const warmLight = new THREE.Mesh(new THREE.CircleGeometry(0.008, 16), new THREE.MeshStandardMaterial({ color: 0xffa040, emissive: 0xffa040, emissiveIntensity: 3 }));
  warmLight.position.set(-0.16, 0.33, 0.171);
  group.add(warmLight);
  const wTag = tapeMesh("Food warmer", { w: 0.17, h: 0.04, fontSize: 60, seed: 1001 });
  wTag.position.set(-0.3, 0.3, 0.172);
  group.add(wTag);

  // Potable water dispenser.
  const disp = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.3, 0.12, 3, 0.02), mats.aluBright);
  disp.position.set(0.3, 0.3, 0.09);
  disp.castShadow = true;
  group.add(disp);
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.05, 12), mats.graphite);
  nozzle.position.set(0.3, 0.13, 0.13);
  group.add(nozzle);
  const dTag = tapeMesh("Water: hot / ambient", { w: 0.19, h: 0.04, fontSize: 54, seed: 1002 });
  dTag.position.set(0.3, 0.38, 0.152);
  group.add(dTag);

  // Velcro tray with pouches and cans.
  const tray = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.3, 0.02, 2, 0.01), mats.velcro);
  tray.position.set(0, -0.2, 0.04);
  group.add(tray);
  const r = mulberry32(55);
  const pouchMat = [mats.aluWarm, mats.fabricTan, mats.aluBright];
  const labels = ["Shrimp cocktail", "Mac & cheese", "Tortillas", "Oatmeal", "Brisket", "Apricots"];
  labels.forEach((t, i) => {
    const x = -0.22 + (i % 3) * 0.22, y = -0.13 - Math.floor(i / 3) * 0.14;
    const isCan = i % 3 === 1;
    const item = isCan
      ? new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.06, 24), mats.aluCool)
      : new THREE.Mesh(new RoundedBoxGeometry(0.15, 0.1, 0.025, 2, 0.01), pouchMat[i % 3]);
    if (isCan) item.rotation.x = Math.PI / 2;
    item.position.set(x, y, 0.07);
    item.rotation.z = (r() - 0.5) * 0.2;
    item.castShadow = true;
    group.add(item);
    const lt = tapeMesh(t, { w: 0.12, h: 0.032, fontSize: 56, seed: 1100 + i });
    lt.position.set(x, y, isCan ? 0.101 : 0.084);
    lt.rotation.z = item.rotation.z;
    group.add(lt);
  });
  const name = tapeMesh("Galley", { w: 0.18, h: 0.055, fontSize: 70, seed: 1003 });
  name.position.set(0, 0.55, 0.03);
  group.add(name);

  // Menu screen.
  const canvas = document.createElement("canvas");
  const RES = 2;
  canvas.width = 900 * RES; canvas.height = 520 * RES;
  const ctx = canvas.getContext("2d");
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.243), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  screen.position.set(0.0, -0.47, 0.035);
  const frame = new THREE.Mesh(new RoundedBoxGeometry(0.45, 0.27, 0.02, 2, 0.01), mats.graphite);
  frame.position.set(0.0, -0.47, 0.02);
  group.add(frame, screen);

  let last = null;
  function draw(info) {
    ctx.setTransform(RES, 0, 0, RES, 0, 0);
    ctx.fillStyle = "#0b131d"; ctx.fillRect(0, 0, 900, 520);
    ctx.fillStyle = "#a9b8c8"; ctx.font = "700 34px Archivo, sans-serif";
    ctx.fillText(`Crew ${info.id}    Day ${info.day}`, 30, 56);
    ctx.fillStyle = "#e9edf2"; ctx.font = "800 64px Archivo, sans-serif";
    ctx.fillText(`${Math.round(info.meal.kcal)}`, 30, 140);
    let w = ctx.measureText(`${Math.round(info.meal.kcal)}`).width;
    ctx.fillStyle = "#a9b8c8"; ctx.font = "700 30px Archivo, sans-serif"; ctx.fillText("kcal", 42 + w, 140);
    ctx.fillStyle = "#e9edf2"; ctx.font = "800 64px Archivo, sans-serif"; ctx.fillText(`${Math.round(info.meal.protein_g)}`, 330, 140);
    w = ctx.measureText(`${Math.round(info.meal.protein_g)}`).width;
    ctx.fillStyle = "#a9b8c8"; ctx.font = "700 30px Archivo, sans-serif"; ctx.fillText("g protein", 342 + w, 140);
    const bar = (y, label, value, target) => {
      ctx.fillStyle = "#a9b8c8"; ctx.font = "700 30px Archivo, sans-serif"; ctx.fillText(label, 30, y);
      const x0 = 260, bw = 600, frac = Math.min(1.3, value / target);
      ctx.fillStyle = "#1b2a3b"; ctx.fillRect(x0, y - 30, bw, 36);
      ctx.fillStyle = frac >= 1 ? "#7fd1b9" : "#f0c27a"; ctx.fillRect(x0, y - 30, (bw * frac) / 1.3, 36);
      ctx.fillStyle = "#e9edf2"; ctx.fillRect(x0 + bw / 1.3, y - 38, 4, 52);
    };
    bar(250, "Vitamin D", info.meal.vitamin_d_IU, 1000);
    bar(340, "Calcium", info.meal.calcium_mg, 1000);
    bar(430, "Sodium", info.meal.sodium_mg, 2300);
    tex.needsUpdate = true;
  }
  let drawT = 1; // real seconds since the screen texture was last re-uploaded
  function update(dt, info) {
    drawT += dt;
    if (info && (!last || info.day !== last.day || info.id !== last.id) && (drawT >= 0.5 || !last || info.id !== last.id)) { drawT = 0; last = info; draw(info); }
    warmLight.material.emissiveIntensity = 2 + Math.sin(performance.now() / 600) * 0.6;
  }
  // Live-data parts stay visible when a loaded model replaces the built-in props.
  screen.userData.data = true;
  return { group, update };
}
