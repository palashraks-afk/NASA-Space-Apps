import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// Merge a static group's meshes into one mesh per material, so the GPU gets a few large
// draw calls instead of hundreds of small ones. The module shell, lockers, rails and fittings
// never move, so nothing is lost. Meshes are left alone when they are transparent, instanced,
// animated, picked by name, or marked userData.keep.
export function mergeStatic(root) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const groups = new Map();
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || o.userData.keep || Array.isArray(o.material)) return;
    if (o.material.transparent || o.name || !o.visible) return;
    const g = o.geometry;
    const sig = [o.material.uuid, o.castShadow, o.receiveShadow, g.index ? "i" : "n", Object.keys(g.attributes).sort().join(",")].join("|");
    if (!groups.has(sig)) groups.set(sig, []);
    groups.get(sig).push(o);
  });
  let before = 0, after = 0;
  const m = new THREE.Matrix4();
  for (const list of groups.values()) {
    before += list.length;
    if (list.length < 2) { after += list.length; continue; }
    const geos = list.map((o) => { m.multiplyMatrices(inv, o.matrixWorld); return o.geometry.clone().applyMatrix4(m); });
    const merged = mergeGeometries(geos, false);
    geos.forEach((g) => g.dispose());
    if (!merged) { after += list.length; continue; }
    const mesh = new THREE.Mesh(merged, list[0].material);
    mesh.castShadow = list[0].castShadow;
    mesh.receiveShadow = list[0].receiveShadow;
    root.add(mesh);
    for (const o of list) o.parent.remove(o);
    after++;
  }
  return { before, after };
}

// Pack every printed label (tapeMesh: one canvas texture and one draw call each) into shared
// atlas pages and merge them into one mesh per page. About 80 labels became a couple of
// draw calls, and roughly 80 MB of separate label textures became two 2048 px pages.
// Labels are static; they keep their exact world position.
export function atlasLabels(scene, { page = 2048, cellW = 512, cellH = 128 } = {}) {
  scene.updateMatrixWorld(true);
  const labels = [];
  scene.traverse((o) => { if (o.isMesh && o.userData.tape && !o.userData.keep && o.visible) labels.push(o); });
  if (!labels.length) return 0;
  const cols = page / cellW, rows = page / cellH, perPage = cols * rows;
  let count = 0;
  for (let p0 = 0; p0 < labels.length; p0 += perPage) {
    const batch = labels.slice(p0, p0 + perPage);
    const cv = document.createElement("canvas");
    cv.width = page; cv.height = page;
    const g = cv.getContext("2d");
    const geos = [];
    batch.forEach((o, k) => {
      const cx = (k % cols) * cellW, cy = Math.floor(k / cols) * cellH;
      const img = o.material.map.image;
      g.drawImage(img, cx + 2, cy + 2, cellW - 4, cellH - 4);
      const geo = o.geometry.clone().applyMatrix4(o.matrixWorld);
      const uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) {
        uv.setXY(i, (cx + 2 + uv.getX(i) * (cellW - 4)) / page, 1 - (cy + 2 + (1 - uv.getY(i)) * (cellH - 4)) / page);
      }
      geos.push(geo);
      o.material.map.dispose();
      o.material.dispose();
      o.parent.remove(o);
    });
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 16;
    const mesh = new THREE.Mesh(mergeGeometries(geos, false), new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, roughness: 0.85, metalness: 0 }));
    mesh.name = "labels";
    geos.forEach((x) => x.dispose());
    scene.add(mesh);
    count += batch.length;
  }
  return count;
}
