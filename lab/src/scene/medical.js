import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { tapeMesh } from "./textures.js";

// Medical station (crew health care rack): a monitor showing the selected crew member's
// daily measures, with a blood-pressure cuff, pulse oximeter, forehead temperature sensor
// and a medical kit strapped to the rack. The scrolling pulse trace is illustrative only.
export function buildMedical(mats) {
  const group = new THREE.Group();
  group.name = "medical";

  const rack = new THREE.Mesh(new RoundedBoxGeometry(1.0, 1.25, 0.05, 3, 0.015), new THREE.MeshStandardMaterial({ color: 0xe6e9eb, roughness: 0.7, metalness: 0.1 }));
  rack.receiveShadow = true;
  group.add(rack);

  const bezel = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.42, 0.04, 3, 0.015), mats.graphite);
  bezel.position.set(0, 0.22, 0.04);
  bezel.castShadow = true;
  group.add(bezel);
  const canvas = document.createElement("canvas");
  const RES = 1.5; // drawn at 1.5x for sharp text up close
  canvas.width = 1024 * RES; canvas.height = 680 * RES;
  const ctx = canvas.getContext("2d");
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.385), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  screen.position.set(0, 0.22, 0.061);
  group.add(screen);

  // Blood-pressure cuff: a fabric band with a hose to a small gauge.
  const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.025, 12, 32), mats.fabricBlue);
  cuff.position.set(-0.33, -0.25, 0.07);
  cuff.scale.set(1, 0.55, 1);
  group.add(cuff);
  const hose = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-0.3, -0.27, 0.07), new THREE.Vector3(-0.22, -0.36, 0.09), new THREE.Vector3(-0.14, -0.3, 0.07)]), 24, 0.005, 6), mats.graphiteMatte);
  group.add(hose);
  const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.015, 24), mats.aluBright);
  gauge.rotation.x = Math.PI / 2;
  gauge.position.set(-0.13, -0.3, 0.07);
  group.add(gauge);
  // Pulse oximeter with a red sensor light.
  const ox = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.035, 0.03, 2, 0.008), mats.aluBright);
  ox.position.set(0.02, -0.28, 0.065);
  group.add(ox);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.004, 8, 8), new THREE.MeshStandardMaterial({ color: 0xff3020, emissive: 0xff3020, emissiveIntensity: 3 }));
  led.position.set(0.02, -0.268, 0.082);
  group.add(led);
  // Forehead temperature sensor patch.
  const patch = new THREE.Mesh(new RoundedBoxGeometry(0.045, 0.03, 0.006, 2, 0.004), mats.aluWarm);
  patch.position.set(0.12, -0.28, 0.06);
  group.add(patch);
  // Medical kit, strapped on.
  const kit = new THREE.Mesh(new RoundedBoxGeometry(0.28, 0.18, 0.1, 3, 0.03), mats.fabric);
  kit.position.set(0.3, -0.36, 0.08);
  kit.castShadow = true;
  group.add(kit);
  const strap = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.2, 0.11), mats.strap);
  strap.position.copy(kit.position);
  group.add(strap);
  const kitTag = tapeMesh("Medical kit", { w: 0.15, h: 0.04, fontSize: 60, seed: 801 });
  kitTag.position.set(0.25, -0.32, 0.131);
  group.add(kitTag);
  const name = tapeMesh("Crew medical", { w: 0.26, h: 0.055, fontSize: 70, seed: 802 });
  name.position.set(0, 0.52, 0.03);
  group.add(name);

  let pulseT = 0, last = null, acc = 0;
  function draw(info) {
    const W = 1024;
    ctx.setTransform(RES, 0, 0, RES, 0, 0);
    ctx.fillStyle = "#0b131d"; ctx.fillRect(0, 0, 1024, 680);
    ctx.fillStyle = "#8fa3b8"; ctx.font = "700 34px Archivo, sans-serif";
    ctx.fillText(`Crew ${info.id}    Day ${info.day}`, 36, 54);
    const tile = (x, y, label, value, unit, color, note) => {
      ctx.fillStyle = note ? "#2a2416" : "#13202f"; ctx.fillRect(x, y, 300, 150);
      ctx.fillStyle = "#a9b8c8"; ctx.font = "700 28px Archivo, sans-serif"; ctx.fillText(label, x + 18, y + 40);
      ctx.fillStyle = note ? "#f0c27a" : color; ctx.font = "800 76px Archivo, sans-serif"; ctx.fillText(value, x + 18, y + 120);
      const vw = ctx.measureText(value).width;
      ctx.fillStyle = "#a9b8c8"; ctx.font = "700 28px Archivo, sans-serif"; ctx.fillText(unit, x + 28 + vw, y + 120);
    };
    tile(36, 80, "Heart rate", info.hr.toFixed(0), "bpm", "#7fd1b9", info.hrNote);
    tile(358, 80, "HRV", info.rmssd.toFixed(0), "ms", "#9cc4ff", info.rmssdNote);
    tile(680, 80, "Temp", info.temp.toFixed(1), "°C", "#9cc4ff", "");
    tile(36, 250, "Sleep", info.sleep.toFixed(1), "h", "#c7b8f2", info.sleepNote);
    tile(358, 250, "To sleep", info.latency.toFixed(0), "min", "#c7b8f2", "");
    tile(680, 250, "Efficiency", info.eff.toFixed(0), "%", "#c7b8f2", "");
    // Illustrative pulse trace at the current heart rate.
    ctx.strokeStyle = "#7fd1b9"; ctx.lineWidth = 3; ctx.beginPath();
    const period = 60 / info.hr;
    for (let x = 0; x <= W - 72; x += 3) {
      const t = pulseT + x / 320;
      const ph = (t % period) / period;
      let y = 0;
      if (ph < 0.06) y = Math.sin((ph / 0.06) * Math.PI) * 0.18;
      else if (ph > 0.12 && ph < 0.16) y = -Math.sin(((ph - 0.12) / 0.04) * Math.PI) * 0.25;
      else if (ph >= 0.16 && ph < 0.2) y = Math.sin(((ph - 0.16) / 0.04) * Math.PI) * 1.0;
      else if (ph >= 0.2 && ph < 0.24) y = -Math.sin(((ph - 0.2) / 0.04) * Math.PI) * 0.35;
      else if (ph > 0.4 && ph < 0.55) y = Math.sin(((ph - 0.4) / 0.15) * Math.PI) * 0.3;
      const py = 520 - y * 90;
      x ? ctx.lineTo(36 + x, py) : ctx.moveTo(36, py);
    }
    ctx.stroke();
    tex.needsUpdate = true;
  }

  function update(dt, info) {
    if (!info) return;
    pulseT += dt;
    led.material.emissiveIntensity = 1.5 + 1.5 * Math.max(0, Math.sin((pulseT * info.hr) / 60 * Math.PI * 2));
    acc += dt;
    // Redraw ~12 times a second for the pulse trace, or at once when the day or crew changes.
    const key = `${info.id}|${info.day}`;
    if (acc > 1 / 12 || key !== last) { acc = 0; last = key; draw(info); }
  }
  // Live-data parts stay visible when a loaded model replaces the built-in props.
  screen.userData.data = true;
  return { group, update };
}
