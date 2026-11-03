import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { tapeMesh } from "./textures.js";

// Radiation station: a globe projected above a rack, coloured by the dose rate the DOSTEL-1
// detector on the ISS actually measured over each patch of Earth (NASA OSDR RadLab, 2022).
// A marker flies one real day of the station's track, coloured by the reading at each
// moment, so the South Atlantic Anomaly lights up as the station passes through it.
const R = 0.24;

function rateColor(rate, out) {
  // log scale: 2 uGy/h (quiet) -> 300+ (deep in the anomaly)
  const t = Math.min(1, Math.max(0, Math.log10(Math.max(rate, 1) / 2) / Math.log10(150)));
  const stops = [[0.0, [0.35, 0.62, 0.95]], [0.35, [0.5, 0.82, 0.72]], [0.65, [0.94, 0.76, 0.35]], [1.0, [0.94, 0.42, 0.36]]];
  let k = 0;
  while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
  const [t0, c0] = stops[k], [t1, c1] = stops[k + 1];
  const f = (t - t0) / (t1 - t0);
  out.setRGB(c0[0] + (c1[0] - c0[0]) * f, c0[1] + (c1[1] - c0[1]) * f, c0[2] + (c1[2] - c0[2]) * f);
  return t;
}

// lat/lon (deg) to a point on a three.js SphereGeometry with an equirectangular texture.
function llToVec(lat, lon, r, v = new THREE.Vector3()) {
  const u = (lon + 180) / 360, phi = (lat * Math.PI) / 180;
  return v.set(-Math.cos(u * 2 * Math.PI) * Math.cos(phi) * r, Math.sin(phi) * r, Math.sin(u * 2 * Math.PI) * Math.cos(phi) * r);
}

export function buildRadiation(mats, { earthDay, data }) {
  const group = new THREE.Group();
  group.name = "radiation";

  const rack = new THREE.Mesh(new RoundedBoxGeometry(1.0, 1.25, 0.05, 3, 0.015), new THREE.MeshStandardMaterial({ color: 0xe3e6e9, roughness: 0.7, metalness: 0.1 }));
  rack.receiveShadow = true;
  group.add(rack);
  const name = tapeMesh("Radiation", { w: 0.2, h: 0.055, fontSize: 70, seed: 1201 });
  name.position.set(-0.32, 0.55, 0.03);
  group.add(name);

  // Projector base and arm holding the globe away from the wall.
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.04, 48), mats.graphite);
  base.rotation.x = Math.PI / 2;
  base.position.set(0, -0.38, 0.05);
  group.add(base);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.006, 8, 64), new THREE.MeshBasicMaterial({ color: 0x8fc4ff, toneMapped: false }));
  ring.position.set(0, -0.38, 0.072);
  group.add(ring);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.36, 12), mats.aluBright);
  arm.rotation.x = Math.PI / 2;
  arm.position.set(0, -0.38, 0.22);
  group.add(arm);

  const globe = new THREE.Group();
  globe.position.set(0, 0.05, 0.42);
  globe.rotation.z = (23.4 * Math.PI) / 180 * 0.4;
  group.add(globe);
  const earth = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 48), new THREE.MeshStandardMaterial({ map: earthDay, roughness: 0.85, metalness: 0, color: 0xc8d0d8 }));
  globe.add(earth);

  // Dose map: equirectangular canvas from the measured grid.
  const cv = document.createElement("canvas");
  cv.width = 720; cv.height = 360;
  const ctx = cv.getContext("2d");
  const c = new THREE.Color();
  const cell = 6 * 2;
  for (const [lat, lon, rate] of data.grid) {
    const t = rateColor(rate, c);
    ctx.fillStyle = `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${(0.18 + 0.7 * t).toFixed(2)})`;
    ctx.fillRect(((lon + 180) / 360) * 720 - cell / 2, ((90 - lat) / 180) * 360 - cell / 2, cell, cell);
  }
  // soften the cell edges
  const soft = document.createElement("canvas");
  soft.width = 720; soft.height = 360;
  const sctx = soft.getContext("2d");
  sctx.filter = "blur(6px)";
  sctx.drawImage(cv, 0, 0);
  const doseTex = new THREE.CanvasTexture(soft);
  doseTex.colorSpace = THREE.SRGBColorSpace;
  const overlay = new THREE.Mesh(new THREE.SphereGeometry(R * 1.004, 64, 48), new THREE.MeshBasicMaterial({ map: doseTex, transparent: true, depthWrite: false, toneMapped: false, opacity: 0.85 }));
  globe.add(overlay);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.09, 48, 32), new THREE.MeshBasicMaterial({ color: 0x6fa8f5, transparent: true, opacity: 0.06, side: THREE.BackSide, depthWrite: false }));
  globe.add(halo);

  // Real track: one day of readings. The last orbit behind the marker is drawn as a trail
  // coloured by dose rate.
  const tr = data.track;
  const alt = R * (6371 + 420) / 6371;
  const tPos = new Float32Array(tr.length * 3), tCol = new Float32Array(tr.length * 3);
  const v = new THREE.Vector3();
  tr.forEach(([, lat, lon, rate], k) => {
    llToVec(lat, lon, alt, v).toArray(tPos, k * 3);
    rateColor(rate, c);
    tCol.set([c.r, c.g, c.b], k * 3);
  });
  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute("position", new THREE.BufferAttribute(tPos, 3));
  trailGeo.setAttribute("color", new THREE.BufferAttribute(tCol, 3));
  const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9, toneMapped: false }));
  globe.add(trail);
  const marker = new THREE.Mesh(new THREE.SphereGeometry(0.009, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }));
  globe.add(marker);

  // Dosimeter box and readout.
  const box = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.12, 0.08, 3, 0.012), mats.aluCool);
  box.position.set(0.32, -0.38, 0.06);
  box.castShadow = true;
  group.add(box);
  const led = new THREE.Mesh(new THREE.CircleGeometry(0.008, 16), new THREE.MeshBasicMaterial({ color: 0x7fd1b9, toneMapped: false }));
  led.position.set(0.39, -0.35, 0.101);
  group.add(led);
  const boxTag = tapeMesh("Dosimeter", { w: 0.13, h: 0.035, fontSize: 60, seed: 1202 });
  boxTag.position.set(0.3, -0.4, 0.101);
  group.add(boxTag);

  const scv = document.createElement("canvas");
  scv.width = 640; scv.height = 300;
  const sx = scv.getContext("2d");
  const stex = new THREE.CanvasTexture(scv);
  stex.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.14), new THREE.MeshBasicMaterial({ map: stex, toneMapped: false }));
  screen.position.set(0.3, 0.42, 0.035);
  const frame = new THREE.Mesh(new RoundedBoxGeometry(0.32, 0.16, 0.02, 2, 0.01), mats.graphite);
  frame.position.set(0.3, 0.42, 0.022);
  group.add(frame, screen);

  let hours = 0, k = 0, lastDraw = -1, info = null;
  function draw(rate) {
    sx.fillStyle = "#0b131d"; sx.fillRect(0, 0, 640, 300);
    sx.fillStyle = "#8fa3b8"; sx.font = "600 24px Archivo, sans-serif";
    sx.fillText(`Dose rate now (track ${data.track_date})`, 24, 40);
    rateColor(rate, c);
    sx.fillStyle = `#${c.getHexString()}`; sx.font = "800 84px Archivo, sans-serif";
    sx.fillText(rate.toFixed(1), 24, 140);
    const w = sx.measureText(rate.toFixed(1)).width;
    sx.fillStyle = "#8fa3b8"; sx.font = "600 26px Archivo, sans-serif";
    sx.fillText("µGy per hour", 24 + w + 16, 136);
    if (info) sx.fillText(`Today ${Math.round(info.today)} µGy, mission ${(info.total / 1000).toFixed(1)} mGy`, 24, 200);
    sx.fillStyle = "#5f7186"; sx.font = "600 20px Archivo, sans-serif";
    sx.fillText("DOSTEL-1 readings, NASA OSDR RadLab", 24, 270);
    stex.needsUpdate = true;
  }

  function update(dt, next) {
    if (next) info = next;
    // About one orbit every 12 seconds along the real track.
    hours = (hours + dt * 0.13) % 24;
    while (k < tr.length - 1 && tr[k + 1][0] <= hours) k++;
    if (tr[k][0] > hours) k = 0;
    const [, lat, lon, rate] = tr[k];
    llToVec(lat, lon, alt, marker.position);
    // Show only the last ~90 minutes of track behind the marker: about one orbit.
    let j = k;
    while (j > 0 && hours - tr[j][0] < 1.5) j--;
    trailGeo.setDrawRange(j, k - j + 1);
    rateColor(rate, marker.material.color);
    globe.rotation.y += dt * 0.05;
    led.material.color.copy(marker.material.color);
    if (Math.floor(hours * 60) !== lastDraw) { lastDraw = Math.floor(hours * 60); draw(rate); }
  }
  // Live-data parts stay visible when a loaded model replaces the built-in props.
  globe.userData.data = true;
  screen.userData.data = true;
  return { group, update, rateAt: () => tr[k][3] };
}
