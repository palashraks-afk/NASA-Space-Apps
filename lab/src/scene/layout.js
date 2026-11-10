import * as THREE from "three";

// The command hub's floor plan, shared by the app and the Blender build (lab/blender/hub.py keeps
// the same numbers). A 12-sided drum: facet k sits at angle k * 30 deg, clockwise seen from above,
// starting at -z (towards Earth). Facets -1, 0, 1 are the observation gallery, 6 is the airlock.
export const N = 12;
export const A = 3.2;           // centre to wall face
export const FLOOR = -1.25;
export const CEIL = 1.6;         // the light well rises to 2.05
export const WINDOW = { w: 1.36, h: 1.62, y: 0.12, r: 0.2, glassZ: -0.265, facets: [-1, 0, 1] };

const STEP = (Math.PI * 2) / N;

// Facet frame: centre of the wall face at height y, `inward` points at the hub centre, `right` runs
// along the wall to the right as seen from the centre.
export function facet(k, y = 0) {
  const t = k * STEP;
  const inward = new THREE.Vector3(-Math.sin(t), 0, Math.cos(t));
  const right = new THREE.Vector3(Math.cos(t), 0, Math.sin(t));
  const centre = new THREE.Vector3(A * Math.sin(t), y, -A * Math.cos(t));
  return { t, inward, right, centre, rotY: -t };
}

// Where each wall station hangs: facet, height, and how far its origin sits off the wall (so the
// back of each housing clears the bay's backdrop panels).
export const BAYS = {
  medical: { k: -2, y: 0.05, off: 0.12, view: 1.4 },
  board: { k: -3, y: 0.04, off: 0.08, view: 2.0 },
  galley: { k: -4, y: 0.05, off: 0.12, view: 1.4 },
  radiation: { k: 2, y: 0.06, off: 0.12, view: 1.6 },
  clock: { k: 3, y: 0.08, off: 0.09, view: 1.6 },
  air: { k: 4, y: 0.08, off: 0.12, view: 1.38 },
};

// Free-standing pieces: the body hologram on the centre pedestal, the evidence chamber on its plinth
// beside the airlock (both plinths are part of the Blender model).
export const BODY = { pos: new THREE.Vector3(0, 0, 0) };
export const EVIDENCE = { pos: new THREE.Vector3(1.1, -0.04, 1.75) };

export function placeOnWall(group, name) {
  const b = BAYS[name];
  const f = facet(b.k, b.y);
  group.position.copy(f.centre).addScaledVector(f.inward, b.off);
  group.rotation.set(0, f.rotY, 0);
  return f;
}

// Turn a free-standing group so its front (local +z) faces the hub centre.
export function faceCentre(group) {
  group.rotation.set(0, Math.atan2(-group.position.x, -group.position.z), 0);
}

// Camera views: each wall station seen straight on from across the hub, the gallery from just
// behind the centre, and the overview as a cutaway from above (the ceiling hides once the camera
// rises through it; see station.js). `pivot` and `orbit` set what dragging rotates around and how
// far (cameraRig.js): stations and the evidence chamber swing round their front, the body hologram
// can be circled all the way, the window view looks around from where it stands, and the cutaway
// spins round the hub's axis but stays steep enough never to look past the drum's walls.
export function buildViews() {
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const views = {};
  for (const [name, b] of Object.entries(BAYS)) {
    const f = facet(b.k, b.y);
    const at = f.centre.clone().addScaledVector(f.inward, b.off);
    views[name] = {
      pos: at.clone().addScaledVector(f.inward, b.view).add(V(0, -0.03, 0)),
      look: at.clone().addScaledVector(f.inward, -0.3).add(V(0, -0.1, 0)),
      pivot: at.clone(),
      orbit: { yaw: 0.9, pitchUp: 0.5, pitchDown: 0.35, zoomIn: 0.6, zoomOut: 1.25 },
    };
  }
  const e = EVIDENCE.pos;
  const toCentre = V(-e.x, 0, -e.z).normalize();
  views.evidence = { pos: e.clone().addScaledVector(toCentre, 1.6).add(V(0, 0.08, 0)), look: e.clone().add(V(0, -0.16, 0)),
    pivot: e.clone(), orbit: { yaw: 1.3, pitchUp: 0.6, pitchDown: 0.3, zoomIn: 0.55, zoomOut: 1.2 } };
  views.body = { pos: V(0.95, 0.12, 1.05), look: V(0, -0.04, 0), pivot: V(0, -0.04, 0),
    orbit: { yaw: Infinity, pitchUp: 0.6, pitchDown: 0.3, zoomIn: 0.6, zoomOut: 1.3 } };
  views.window = { pos: V(0, 0.0, -1.55), look: V(0, -0.3, -6), pivot: V(0, 0.0, -1.55),
    orbit: { yaw: 1.1, pitchUp: 0.45, pitchDown: 0.35 } };
  views.overview = { pos: V(0, 5.0, 2.9), look: V(0, -1.0, -0.4), pivot: V(0, -1.0, 0),
    orbit: { yaw: Infinity, pitchUp: 0.42, pitchDown: 0.1, zoomIn: 0.5, zoomOut: 1.0 } };
  return views;
}

// Fit the cutaway to the stage: back the camera up along its sight line until the whole drum fits.
export function fitOverview(view, camera) {
  const halfV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const half = Math.min(halfV, halfV * camera.aspect);
  const dir = new THREE.Vector3(0, 6.0, 3.3).normalize();
  const d = THREE.MathUtils.clamp((A + 0.35) / half, 6.2, 7.4); // further back would leave the drum's footprint and show the outer hull
  view.pos.copy(view.look).addScaledVector(dir, d);
}

// Nav dot anchors, just in front of each piece.
export function anchor(name) {
  if (BAYS[name]) {
    const b = BAYS[name];
    const f = facet(b.k, b.y + 0.2);
    return f.centre.addScaledVector(f.inward, b.off + 0.15);
  }
  if (name === "evidence") return EVIDENCE.pos.clone().add(new THREE.Vector3(0, 0.55, 0));
  if (name === "body") return BODY.pos.clone().add(new THREE.Vector3(0, 0.75, 0));
  if (name === "window") return new THREE.Vector3(0, 0.2, -A + 0.2);
  return null;
}

// Plain stand-in hub (used only if the Blender model cannot be loaded): walls, floor, ceiling.
export function buildFallbackHub(mats) {
  const g = new THREE.Group();
  const r = A / Math.cos(Math.PI / N);
  const walls = new THREE.Mesh(new THREE.CylinderGeometry(r, r, CEIL - FLOOR, N, 1, true, Math.PI / N), mats.alu);
  walls.material = mats.alu.clone();
  walls.material.side = THREE.BackSide;
  walls.position.y = (CEIL + FLOOR) / 2;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(r, N, Math.PI / N), mats.graphite);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = FLOOR;
  const ceil = new THREE.Mesh(new THREE.CircleGeometry(r, N, Math.PI / N), mats.alu);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = CEIL;
  ceil.name = "HubCeiling";
  g.add(walls, floor, ceil, new THREE.HemisphereLight(0xdfe8ff, 0x303438, 1.2));
  return g;
}
