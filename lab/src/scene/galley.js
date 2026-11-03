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
  canvas.width = 900; canvas.height = 520;
  const ctx = canvas.getContext("2d");
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.243), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  screen.position.set(0.0, -0.47, 0.035);
  const frame = new THREE.Mesh(new RoundedBoxGeometry(0.45, 0.27, 0.02, 2, 0.01), mats.graphite);
  frame.position.set(0.0, -0.47, 0.02);
  group.add(frame, screen);

  let last = null;
  function draw(info) {
    ctx.fillStyle = "#0b131d"; ctx.fillRect(0, 0, 900, 520);
    ctx.fillStyle = "#8fa3b8"; ctx.font = "600 26px Archivo, sans-serif";
    ctx.fillText(`Crew ${info.id}, day ${info.day}: ${Math.round(info.meal.kcal)} kcal, ${Math.round(info.meal.protein_g)} g protein`, 26, 42);
    const bar = (y, label, value, target, unit) => {
      ctx.fillStyle = "#8fa3b8"; ctx.font = "600 24px Archivo, sans-serif"; ctx.fillText(label, 26, y);
      const w = 520, frac = Math.min(1.3, value / target);
      ctx.fillStyle = "#1b2a3b"; ctx.fillRect(230, y - 22, w, 26);
      ctx.fillStyle = frac >= 1 ? "#7fd1b9" : "#f0c27a"; ctx.fillRect(230, y - 22, Math.min(w, (w * frac) / 1.3), 26);
      ctx.fillStyle = "#e9edf2"; ctx.fillRect(230 + w / 1.3, y - 28, 3, 38);
      ctx.fillStyle = "#e9edf2"; ctx.font = "700 24px Archivo, sans-serif"; ctx.fillText(`${Math.round(value)} ${unit}`, 765, y);
    };
    bar(110, "Vitamin D", info.meal.vitamin_d_IU, 1000, "IU");
    bar(170, "Calcium", info.meal.calcium_mg, 1000, "mg");
    bar(230, "Sodium", info.meal.sodium_mg, 2300, "mg");
    ctx.fillStyle = "#8fa3b8"; ctx.font = "600 22px Archivo, sans-serif";
    const items = info.meal.items;
    ctx.fillText(items.slice(0, 5).join(", "), 26, 300);
    ctx.fillText(items.slice(5, 10).join(", "), 26, 336);
    ctx.fillText(items.slice(10).join(", "), 26, 372);
    ctx.fillStyle = "#5f7186"; ctx.font = "600 20px Archivo, sans-serif";
    ctx.fillText("White line: NASA target (sodium: upper limit). USDA nutrient values; menu simulated.", 26, 480);
    tex.needsUpdate = true;
  }
  function update(dt, info) {
    if (info && (!last || info.day !== last.day || info.id !== last.id)) { last = info; draw(info); }
    warmLight.material.emissiveIntensity = 2 + Math.sin(performance.now() / 600) * 0.6;
  }
  // Live-data parts stay visible when a loaded model replaces the built-in props.
  screen.userData.data = true;
  return { group, update };
}
