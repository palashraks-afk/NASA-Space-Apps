import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

// Blueprint viewer: an instrument's parts drawn as translucent solids with white outlines on a
// blueprint grid. A slider pulls the parts apart along their own directions (exploded view);
// labels are HTML, so the text is as sharp as the rest of the interface. Drag to orbit,
// scroll to zoom, click a part to select it.
const INK = 0xe8f1ff;

function geometryFor(p) {
  const s = p.size;
  switch (p.shape) {
    case "box": return new THREE.BoxGeometry(s[0], s[1], s[2]);
    case "cyl": case "tube": return p.shape === "tube" ? new THREE.CylinderGeometry(s[1], s[1], s[0], 16) : new THREE.CylinderGeometry(s[0], s[0], s[1], 32);
    case "cap": return new THREE.CapsuleGeometry(s[0], s[1], 6, 20);
    case "sph": return new THREE.SphereGeometry(s[0], 24, 16);
    case "torus": return new THREE.TorusGeometry(s[0], s[1], 12, 48);
    default: return new THREE.BoxGeometry(0.02, 0.02, 0.02);
  }
}

export function createBlueprint({ host, onSelect = () => {} }) {
  const el = document.createElement("div");
  el.className = "blueprint";
  el.hidden = true;
  el.innerHTML = `<div class="bp-bar"><b class="bp-name"></b><label class="bp-explode">Explode <input type="range" min="0" max="1" step="0.01" value="0"></label><button type="button" class="bp-btn" data-bp="auto">Animate</button><button type="button" class="bp-btn" data-bp="reset">Reset view</button></div>
    <div class="bp-stage"></div><div class="bp-note">Simplified diagram of how this class of device works; not an engineering drawing of the flight unit. Drag to rotate, scroll to zoom, click a part.</div>`;
  host.appendChild(el);
  const stage = el.querySelector(".bp-stage");
  const slider = el.querySelector("input[type=range]");

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  stage.appendChild(renderer.domElement);
  const labels = new CSS2DRenderer();
  labels.domElement.className = "bp-labels";
  stage.appendChild(labels.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.005, 10);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = 0.12;
  controls.maxDistance = 1.2;
  scene.add(new THREE.HemisphereLight(0xdfeaff, 0x0b2545, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(0.4, 0.6, 0.8);
  scene.add(key);
  const grid = new THREE.GridHelper(0.6, 24, 0x5c86c4, 0x2b4c80);
  grid.position.y = -0.14;
  scene.add(grid);

  let parts = [], selected = -1, explode = 0, autoT = null, current = null;
  const root = new THREE.Group();
  scene.add(root);

  function clear() {
    root.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose?.(); });
    for (const p of parts) p.label.element.remove();
    root.clear();
    parts = [];
  }

  function load(inst) {
    clear();
    current = inst;
    el.querySelector(".bp-name").textContent = inst.name;
    inst.parts.forEach((p, idx) => {
      const g = new THREE.Group();
      const n = p.count || 1;
      for (let c = 0; c < n; c++) {
        const geo = geometryFor(p);
        const color = new THREE.Color(p.color || "#9cc4ff");
        const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, transparent: true, opacity: p.screen ? 0.85 : 0.55, roughness: 0.5, metalness: 0.1, emissive: p.glow ? new THREE.Color(p.glow) : new THREE.Color(0x000000), emissiveIntensity: p.glow ? 0.8 : 0, depthWrite: false }));
        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.9 }));
        const sub = new THREE.Group();
        sub.add(mesh, edges);
        if (p.rot) sub.rotation.set(...p.rot);
        if (n > 1) sub.position.set((c - (n - 1) / 2) * 0.03, 0, 0);
        mesh.userData.part = idx;
        g.add(sub);
      }
      const base = new THREE.Vector3(...p.at);
      const dir = new THREE.Vector3(...p.dir).normalize();
      g.position.copy(base);
      const tag = document.createElement("button");
      tag.type = "button";
      tag.className = "bp-tag";
      tag.innerHTML = `<i>${idx + 1}</i>${p.name}`;
      tag.addEventListener("click", () => select(idx));
      const label = new CSS2DObject(tag);
      label.position.set(0, 0.025, 0);
      g.add(label);
      root.add(g);
      parts.push({ g, base, dir, label, meshes: g.children.map((s) => s.children[0]) });
    });
    // frame the assembly
    const box = new THREE.Box3().setFromObject(root);
    const c = box.getCenter(new THREE.Vector3());
    root.position.sub(c);
    resetView();
    setExplode(0);
    select(-1);
    animate(0.85);
  }
  function resetView() {
    camera.position.set(0.32, 0.22, 0.42);
    controls.target.set(0, 0, 0);
    controls.update();
  }
  function setExplode(v) {
    explode = v;
    slider.value = String(v);
    const k = 0.11 * v;
    for (const p of parts) p.g.position.copy(p.base).addScaledVector(p.dir, k);
    el.classList.toggle("exploded", v > 0.35);
  }
  function animate(to) {
    const from = explode, t0 = performance.now(), dur = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 900;
    cancelAnimationFrame(autoT);
    const step = (t) => {
      const f = dur ? Math.min(1, (t - t0) / dur) : 1;
      setExplode(from + (to - from) * (1 - Math.pow(1 - f, 3)));
      if (f < 1) autoT = requestAnimationFrame(step);
    };
    autoT = requestAnimationFrame(step);
  }
  function select(idx) {
    selected = idx;
    parts.forEach((p, k) => {
      const on = k === idx;
      p.label.element.classList.toggle("on", on);
      p.label.element.classList.toggle("dim", idx >= 0 && !on);
      for (const m of p.meshes) m.material.opacity = idx < 0 ? 0.55 : on ? 0.95 : 0.15;
    });
    onSelect(idx);
  }

  slider.addEventListener("input", () => setExplode(+slider.value));
  el.addEventListener("click", (e) => {
    const b = e.target.closest("[data-bp]");
    if (!b) return;
    if (b.dataset.bp === "auto") animate(explode > 0.5 ? 0 : 1);
    if (b.dataset.bp === "reset") resetView();
  });
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let down = null;
  renderer.domElement.addEventListener("pointerdown", (e) => (down = [e.clientX, e.clientY]));
  renderer.domElement.addEventListener("click", (e) => {
    if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 4) return;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(parts.flatMap((p) => p.meshes), false)[0];
    select(hit ? hit.object.userData.part : -1);
  });

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    labels.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage);

  function render() {
    if (el.hidden) return;
    controls.update();
    renderer.render(scene, camera);
    labels.render(scene, camera);
  }
  return {
    el, load, select, render,
    show(on) { el.hidden = !on; if (on) { resize(); if (current) animate(0.85); } },
    get selected() { return selected; },
  };
}
