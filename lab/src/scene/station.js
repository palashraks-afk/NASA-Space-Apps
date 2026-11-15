import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { BAYS, BODY, EVIDENCE, WINDOW, facet } from "./layout.js";

// The command hub modelled, lit and baked in Blender (lab/blender/hub.py and bake.py):
//   models/hub.glb            geometry, UV0 for world-scale tiling textures, UV1 for the lightmap
//   textures/hub_lightmap     Cycles diffuse irradiance (sRGB-encoded, scaled by hub_lightmap.json)
//   textures/pbr/*            tileable PBR sets generated in Blender (fabric from Poly Haven, CC0)
// Materials are matched by name. Lightmapped surfaces take their diffuse light only from the bake and
// their reflections from the cabin probe, so live lights never double-light the walls.

// One exposure for the whole hub: Blender light units -> the app's exposure.
export const CABIN_EXPOSURE = 0.36;

const PBR = ["paint", "paintcool", "brushed", "rubber", "polymer", "vent", "fabric"];

export async function loadStationModule({ base, renderer }) {
  const tl = new THREE.TextureLoader();
  const aniso = renderer.capabilities.getMaxAnisotropy();
  const tex = (url, srgb) => new Promise((res) => tl.load(url, (t) => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = aniso;
    t.flipY = false;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    res(t);
  }, undefined, () => res(null)));
  const sets = {};
  await Promise.all(PBR.map(async (k) => {
    const [map, rough, nor] = await Promise.all([
      tex(`${base}textures/pbr/${k === "fabric" ? "fabric_diff" : k + "_col"}.jpg`, true),
      tex(`${base}textures/pbr/${k === "fabric" ? "fabric_rough" : k + "_rough"}.jpg`),
      tex(`${base}textures/pbr/${k === "fabric" ? "fabric_nor_gl" : k + "_nor"}.jpg`),
    ]);
    sets[k] = { map, roughnessMap: rough, normalMap: nor };
  }));
  // The fabric photo set tiles at ~0.5 m in the source; cargo bags read better a little finer.
  for (const t of Object.values(sets.fabric)) if (t) t.repeat.set(1.6, 1.6);

  const [lightMap, lmInfo] = await Promise.all([
    tex(`${base}textures/hub_lightmap.jpg`, true),
    fetch(`${base}textures/hub_lightmap.json`).then((r) => r.json()).catch(() => ({ scale: 1 })),
  ]);
  if (lightMap) { lightMap.wrapS = lightMap.wrapT = THREE.ClampToEdgeWrapping; lightMap.channel = 1; }

  // DRACOLoader brings its own decoder (bundled by Vite from three/examples/jsm/libs/draco).
  const draco = new DRACOLoader();
  const loader = new GLTFLoader().setDRACOLoader(draco);
  const gltf = await loader.loadAsync(`${base}models/hub.glb`);

  const std = (o) => new THREE.MeshStandardMaterial(o);
  const ns = (s) => new THREE.Vector2(s, s);
  const recipes = {
    M_graphite: () => std({ color: 0x5a6068, roughness: 1, metalness: 0.15, normalMap: sets.paint.normalMap, roughnessMap: sets.polymer.roughnessMap, normalScale: ns(0.5) }),
    M_floor: () => std({ color: 0x2e3236, roughness: 1, metalness: 0.1, normalMap: sets.polymer.normalMap, roughnessMap: sets.brushed.roughnessMap, normalScale: ns(0.8) }),
    M_screen: () => new THREE.MeshBasicMaterial({ color: new THREE.Color(0.18, 0.42, 0.7).multiplyScalar(0.9) }),
    M_led_accent: () => new THREE.MeshBasicMaterial({ color: new THREE.Color(0.25, 0.8, 1.0).multiplyScalar(2.2) }),
    M_shell: () => std({ color: 0x2c3036, roughness: 0.85, ...sets.paintcool, normalScale: ns(0.5) }),
    M_paint: () => std({ color: 0xffffff, roughness: 1, metalness: 0, ...sets.paint, normalScale: ns(0.6) }),
    M_paintcool: () => std({ color: 0xffffff, roughness: 1, metalness: 0, ...sets.paintcool, normalScale: ns(0.6) }),
    M_brushed: () => std({ color: 0xffffff, roughness: 1, metalness: 1, ...sets.brushed, normalScale: ns(0.4) }),
    M_rubber: () => std({ color: 0xffffff, roughness: 1, ...sets.rubber }),
    M_polymer: () => std({ color: 0xffffff, roughness: 1, ...sets.polymer }),
    M_vent: () => std({ color: 0xffffff, roughness: 1, metalness: 0.5, ...sets.vent }),
    M_fabric: () => std({ color: 0xf2efe6, roughness: 1, ...sets.fabric }),
    M_duct: () => std({ color: 0xdfe1e2, roughness: 0.9, normalMap: sets.fabric.normalMap, normalScale: ns(0.8) }),
    M_strap: () => std({ color: 0x27313f, roughness: 1, ...sets.fabric, map: null }),
    M_handrail: () => std({ color: 0x3d6596, roughness: 0.42, metalness: 0.75, normalMap: sets.brushed.normalMap, roughnessMap: sets.brushed.roughnessMap, normalScale: ns(0.3) }),
    M_hazard_y: () => std({ color: 0xf0b21c, roughness: 0.55, normalMap: sets.paint.normalMap, roughnessMap: sets.paint.roughnessMap }),
    M_hazard_k: () => std({ color: 0x111214, roughness: 0.55, normalMap: sets.paint.normalMap, roughnessMap: sets.paint.roughnessMap }),
    M_plate: () => std({ color: 0xb9bdc2, roughness: 1, metalness: 0.8, normalMap: sets.brushed.normalMap, roughnessMap: sets.brushed.roughnessMap, normalScale: ns(0.2) }),
    M_engrave: () => std({ color: 0x15171a, roughness: 0.55 }),
    M_label: () => std({ color: 0x0c0d10, roughness: 0.6 }),
    M_labeltext: () => std({ color: 0xe8e6df, roughness: 0.7 }),
    M_glass_dark: () => std({ color: 0x020305, roughness: 0.04, metalness: 0 }),
    M_cable_blue: () => std({ color: 0x1d3f7a, roughness: 0.55, normalMap: sets.rubber.normalMap }),
    M_cable_grey: () => std({ color: 0x5b5f64, roughness: 0.65, normalMap: sets.rubber.normalMap }),
    M_gold: () => std({ color: 0xe7a54a, roughness: 0.28, metalness: 1 }),
    M_red: () => std({ color: 0xb3150f, roughness: 0.45 }),
    M_led_warm: () => new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.86, 0.7).multiplyScalar(5.5) }),
    M_led_cool: () => new THREE.MeshBasicMaterial({ color: new THREE.Color(0.7, 0.84, 1.0).multiplyScalar(1.5) }),
    M_led_dim: () => new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.8, 0.6).multiplyScalar(0.9) }),
    M_led_green: () => new THREE.MeshBasicMaterial({ color: new THREE.Color(0.3, 1, 0.45).multiplyScalar(4) }),
    M_led_amber: () => new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.55, 0.15).multiplyScalar(4) }),
  };

  // Baked surfaces: no live direct light and no probe irradiance (the lightmap already holds both);
  // probe-only surfaces (small hardware): no live direct light either, the probe is their light.
  // (three swaps the NUM_*_LIGHTS tokens for numbers after this hook, so the direct-light branches
  // are switched off by rewriting their guards in an inlined copy of the chunk.)
  const lightsNoDirect = THREE.ShaderChunk.lights_fragment_begin
    .replaceAll("defined( RE_Direct )", "0")
    .replaceAll("defined( RE_Direct_RectArea )", "0");
  const noDirect = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace("#include <lights_fragment_begin>", lightsNoDirect);
  };
  const lmIntensity = Math.PI * (lmInfo.scale || 1) * CABIN_EXPOSURE;
  const cache = new Map();
  const material = (name, baked, lit = false) => {
    const key = `${name}|${baked}|${lit}`;
    if (cache.has(key)) return cache.get(key);
    const make = recipes[name];
    const m = make ? make() : std({ color: 0x888888, roughness: 0.6 });
    m.name = name;
    if (m.isMeshStandardMaterial) {
      if (baked && lightMap) {
        m.lightMap = lightMap;
        m.lightMapIntensity = lmIntensity;
        m.onBeforeCompile = (shader) => {
          noDirect(shader);
          shader.fragmentShader = shader.fragmentShader.replace("#include <lights_fragment_maps>",
            THREE.ShaderChunk.lights_fragment_maps.replace("iblIrradiance += getIBLIrradiance( geometryNormal );", ""));
        };
        m.customProgramCacheKey = () => "baked";
      } else if (!lit) {
        m.onBeforeCompile = noDirect;
        m.customProgramCacheKey = () => "probe";
      }
    }
    cache.set(key, m);
    return m;
  };

  const group = new THREE.Group();
  group.name = "hub";
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    const baked = !!o.geometry.attributes.uv1;
    o.material = material(o.material.name, baked);
    o.receiveShadow = false;
    o.castShadow = false;
    o.matrixAutoUpdate = false;
    o.updateMatrix();
  });
  group.add(gltf.scene);

  // Gallery panes: reflections only (black diffuse, added on top), smudged by a roughness map, so the
  // view outside stays clear while the glass still catches the hub lights.
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x000000, roughness: 0.06, metalness: 0, roughnessMap: sets.paint.roughnessMap, envMapIntensity: 0.38,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  glassMat.onBeforeCompile = noDirect;
  const pane = new THREE.Shape();
  {
    const w = WINDOW.w / 2 - 0.04, h = WINDOW.h / 2 - 0.04, r = WINDOW.r - 0.03;
    pane.moveTo(-w + r, -h);
    pane.lineTo(w - r, -h); pane.quadraticCurveTo(w, -h, w, -h + r);
    pane.lineTo(w, h - r); pane.quadraticCurveTo(w, h, w - r, h);
    pane.lineTo(-w + r, h); pane.quadraticCurveTo(-w, h, -w, h - r);
    pane.lineTo(-w, -h + r); pane.quadraticCurveTo(-w, -h, -w + r, -h);
  }
  const paneGeo = new THREE.ShapeGeometry(pane, 8);
  const glass = new THREE.Group();
  for (const k of WINDOW.facets) {
    const f = facet(k, WINDOW.y);
    const g = new THREE.Mesh(paneGeo, glassMat);
    g.position.copy(f.centre).addScaledVector(f.inward, WINDOW.glassZ);
    g.rotation.y = f.rotY;
    g.renderOrder = 3;
    glass.add(g);
  }
  group.add(glass);
  // The ceiling meshes, hidden by the app while the camera is above them (cutaway overview).
  const ceiling = [];
  gltf.scene.traverse((o) => { if (o.name.startsWith("HubCeiling")) ceiling.push(o); });

  // Station housing: one Blender model, cloned and scaled onto each station's rack (lit live, since
  // stations are dynamic and cast shadows).
  let rackTemplate = null;
  try {
    const rg = await loader.loadAsync(`${base}models/station_rack.glb`);
    rg.scene.traverse((o) => { if (o.isMesh) { o.material = material(o.material.name, false, true); o.castShadow = o.receiveShadow = true; } });
    rackTemplate = rg.scene;
  } catch (err) {
    console.warn(`Station rack model not loaded: ${err.message}`);
  }
  draco.dispose();

  return { group, glass, sets, rackTemplate, ceiling };
}

// Replace each station's flat rack slab (mesh named "rack") with the Blender housing.
export function dressStations(stations, template) {
  if (!template) return;
  for (const st of stations) {
    const slab = st.group.getObjectByName("rack");
    if (!slab) continue;
    const p = slab.geometry.parameters || {};
    const housing = template.clone(true);
    housing.scale.set((p.width || 1) / 1.0, (p.height || 1.25) / 1.25, 1);
    housing.position.copy(slab.position);
    housing.name = "rackHousing";
    slab.visible = false;
    st.group.add(housing);
  }
}

// Screens get a sheet of glass: reflections only, added over the live canvas, so monitors catch the
// cabin lights like real displays while the data stays perfectly readable.
export function glazeScreens(root) {
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.12, metalness: 0, envMapIntensity: 0.35, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const screens = [];
  root.traverse((o) => {
    if (o.isMesh && o.material && o.material.isMeshBasicMaterial && o.material.map && o.material.map.isCanvasTexture && o.geometry.type === "PlaneGeometry") screens.push(o);
  });
  for (const s of screens) {
    const g = new THREE.Mesh(s.geometry, glassMat);
    g.position.z = 0.0015;
    g.renderOrder = 2;
    g.raycast = () => {};
    s.add(g);
  }
  return screens.length;
}

// Give the shared station materials (materials.js) the Blender-made PBR sets.
export function texturizeMaterials(mats, sets) {
  const apply = (m, set, { keepMap = true, normal = 0.6 } = {}) => {
    if (!m || !set) return;
    if (keepMap && set.map) m.map = set.map; else if (!keepMap) m.map = null;
    if (set.roughnessMap) { m.roughnessMap = set.roughnessMap; m.roughness = 1; }
    if (set.normalMap) { m.normalMap = set.normalMap; m.normalScale = new THREE.Vector2(normal, normal); }
    m.needsUpdate = true;
  };
  for (const k of ["alu", "aluPanel", "aluBright", "aluWarm", "aluCool"]) apply(mats[k], sets.paint);
  for (const k of ["graphite", "graphiteMatte", "vent"]) apply(mats[k], sets.polymer, { keepMap: false });
  for (const k of ["rail", "screw"]) apply(mats[k], sets.brushed, { normal: 0.3 });
  apply(mats.rubber, sets.rubber);
  apply(mats.fabric, sets.fabric);
  for (const k of ["fabricBlue", "fabricTan", "strap"]) apply(mats[k], { normalMap: sets.fabric.normalMap, roughnessMap: sets.fabric.roughnessMap }, { keepMap: true });
}

// Live light for the dynamic pieces only (the baked hub ignores it, see above): a soft key spot from
// the ceiling onto each wall station, plus the centre pedestal and the evidence plinth.
// Shadows only on the stations with props that stand off their racks.
const SHADOWED = new Set(["medical", "galley", "air", "board"]);
export function stationLights() {
  const g = new THREE.Group();
  const spot = (pos, target, intensity, shadow) => {
    const s = new THREE.SpotLight(0xfff0dc, intensity, 5, Math.PI / 4.2, 0.85, 1.4);
    s.position.copy(pos);
    s.target.position.copy(target);
    if (shadow) {
      s.castShadow = true;
      s.shadow.mapSize.set(1024, 1024);
      s.shadow.bias = -0.0004;
      s.shadow.normalBias = 0.01;
      s.shadow.radius = 5;
    }
    g.add(s, s.target);
  };
  for (const [name, b] of Object.entries(BAYS)) {
    const f = facet(b.k, b.y);
    const at = f.centre.clone().addScaledVector(f.inward, b.off);
    const from = at.clone().addScaledVector(f.inward, 1.15);
    from.y = 1.45;
    spot(from, at, 2.6, SHADOWED.has(name));
  }
  spot(new THREE.Vector3(0.3, 1.5, 0.4), BODY.pos.clone().add(new THREE.Vector3(0, -0.3, 0)), 1.2, false);
  spot(EVIDENCE.pos.clone().add(new THREE.Vector3(-0.4, 1.5, -0.5)), EVIDENCE.pos, 1.6, false);
  return g;
}
