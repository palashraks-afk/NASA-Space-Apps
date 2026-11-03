import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// Drop-in 3D models. Put .glb files in lab/public/models/ and list them in
// lab/public/models/models.json (see docs/MODELS.md). Each entry either:
//   replaces a station's built-in props ("replace": "medical" | "air" | "galley" |
//   "radiation" | "body" | "clock" | "evidence" | "board"), keeping the parts that show live
//   data (screens, globe, airflow), or
//   adds decoration anywhere in the module ("replace" omitted, "position" in module space).
// A missing or broken file never stops the app: it logs a warning and keeps the built-in shapes.
const PART_KEYS = ["brain", "eyes", "heart", "lungs", "gut", "bones", "muscles", "immune"];

export async function loadModels({ base, scene, stations, body }) {
  let list;
  try {
    const r = await fetch(`${base}models/models.json`);
    if (!r.ok) return [];
    list = await r.json();
  } catch { return []; }
  const loader = new GLTFLoader();
  const loaded = [];
  for (const m of list.models || []) {
    try {
      const gltf = await loader.loadAsync(`${base}models/${m.file}`);
      const obj = gltf.scene;
      obj.traverse((o) => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } });
      if (m.scale) obj.scale.setScalar(m.scale);
      if (m.position) obj.position.set(...m.position);
      if (m.rotationY) obj.rotation.y = m.rotationY;
      const target = m.replace && stations[m.replace];
      if (target) {
        // hide built-in props, keep anything that shows live data
        for (const child of target.group.children) if (!child.userData.data) child.visible = false;
        target.group.add(obj);
        if (m.replace === "body") adoptBodyParts(obj, body);
      } else {
        scene.add(obj);
      }
      loaded.push(m.file);
    } catch (err) {
      console.warn(`Model ${m.file} not loaded: ${err.message}. Using the built-in shapes.`);
    }
  }
  return loaded;
}

// If the body model names its parts (any node whose name contains brain, heart, ... ), those
// meshes become clickable and take the status colours; otherwise the built-in organs stay
// visible inside the new figure.
function adoptBodyParts(obj, body) {
  let found = 0;
  obj.traverse((o) => {
    if (!o.isMesh) return;
    const key = PART_KEYS.find((k) => o.name.toLowerCase().includes(k) || o.parent?.name.toLowerCase().includes(k));
    if (!key) return;
    o.name = `part:${key}`;
    o.material = o.material.clone();
    o.material.transparent = true;
    body.adopt(key, o);
    found++;
  });
  if (!found) {
    obj.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.35; o.material.depthWrite = false; } });
    body.showOrgans();
  }
}
