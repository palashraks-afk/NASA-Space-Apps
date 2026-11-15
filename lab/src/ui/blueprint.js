import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

// Blueprint viewer: an instrument's parts as translucent solids with white outlines on a
// blueprint grid. Parts are given in metres at real size; the viewer scales the assembly to fit
// and draws a scale bar in real units. Parts built to a published dimension are outlined in green.
// A slider pulls the parts apart along their own directions (exploded view). Labels are HTML.
const INK = 0xe8f1ff, EXACT = 0x45ef74;
const FIT = 0.34; // assemblies are scaled so their largest size is about this many scene units

function geometryFor(p) {
  const s = p.size;
  switch (p.shape) {
    case "box": { const r = Math.min(s[0], s[1], s[2]) * 0.18; return r > 0.0004 ? new RoundedBoxGeometry(s[0], s[1], s[2], 3, r) : new THREE.BoxGeometry(s[0], s[1], s[2]); }
    case "rbox": return new RoundedBoxGeometry(s[0], s[1], s[2], 3, Math.min(s[3], Math.min(s[0], s[1], s[2]) / 2 - 1e-5));
    case "cyl": return new THREE.CylinderGeometry(s[0], s[2] ?? s[0], s[1], 56);
    case "tube": return new THREE.CylinderGeometry(s[1], s[1], s[0], 16);
    case "cone": { // apex at the centre, opening upward and downward: a double cone of particle paths
      const g = new THREE.CylinderGeometry(s[0], 0.0001, s[0] / Math.tan((62 * Math.PI) / 180), 40, 1, true);
      g.translate(0, (s[0] / Math.tan((62 * Math.PI) / 180)) / 2, 0);
      const g2 = g.clone().rotateX(Math.PI);
      return mergeTwo(g, g2);
    }
    case "ring": { // [outer radius, inner radius, height], axis y
      const [ro, ri, h] = s;
      const pts = [new THREE.Vector2(ri, -h / 2), new THREE.Vector2(ro, -h / 2), new THREE.Vector2(ro, h / 2), new THREE.Vector2(ri, h / 2), new THREE.Vector2(ri, -h / 2)];
      return new THREE.LatheGeometry(pts, 48);
    }
    case "cap": return new THREE.CapsuleGeometry(s[0], s[1], 6, 20);
    case "sph": return new THREE.SphereGeometry(s[0], 24, 16);
    case "torus": return new THREE.TorusGeometry(s[0], s[1], 12, 64, p.arc || Math.PI * 2);
    case "lathe": { // [[r, y] profile], depth scale
      const g = new THREE.LatheGeometry(s[0].map(([r, y]) => new THREE.Vector2(r, y)), 40);
      g.scale(1, 1, s[1] || 1);
      return g;
    }
    case "path": { // [[points], radius]
      const curve = new THREE.CatmullRomCurve3(s[0].map((q) => new THREE.Vector3(...q)));
      return new THREE.TubeGeometry(curve, 48, s[1], 10);
    }
    case "spring": { // [coil radius, length, turns]
      const [r, len, turns] = s, pts = [];
      for (let i = 0; i <= turns * 24; i++) { const a = (i / 24) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, (i / (turns * 24)) * len - len / 2, Math.sin(a) * r)); }
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), turns * 24, r * 0.12, 6);
    }
    case "grid": { // [side, cells]: a square of bump bonds
      const [side, n] = s, step = side / n, geos = [];
      const ball = new THREE.SphereGeometry(step * 0.28, 6, 4);
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) geos.push(ball.clone().translate((i + 0.5) * step - side / 2, 0, (j + 0.5) * step - side / 2));
      return mergeMany(geos);
    }
    case "slats": { // [length, width, count]: a slat belt
      const [len, w, n] = s, gap = len / n, geos = [];
      for (let i = 0; i < n; i++) geos.push(new THREE.BoxGeometry(gap * 0.82, 0.02, w).translate(i * gap - len / 2 + gap / 2, 0, 0));
      return mergeMany(geos);
    }
    default: return new THREE.BoxGeometry(0.02, 0.02, 0.02);
  }
}
function mergeMany(geos) {
  const pos = [], idx = [];
  let off = 0;
  for (const g of geos) {
    const gi = g.index ? g : g.toNonIndexed();
    const p = gi.attributes.position.array;
    for (let i = 0; i < p.length; i++) pos.push(p[i]);
    if (gi.index) for (const k of gi.index.array) idx.push(k + off);
    else for (let k = 0; k < p.length / 3; k++) idx.push(k + off);
    off += p.length / 3;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  out.setIndex(idx);
  out.computeVertexNormals();
  return out;
}
const mergeTwo = (a, b) => mergeMany([a, b]);

// A round number of metres for the scale bar, about a quarter of the assembly's size.
function niceLength(m) {
  const target = m / 4, pow = Math.pow(10, Math.floor(Math.log10(target)));
  const n = [1, 2, 5, 10].map((k) => k * pow).reduce((a, b) => (Math.abs(b - target) < Math.abs(a - target) ? b : a));
  const label = n >= 1 ? `${n} m` : n >= 0.01 ? `${Math.round(n * 100)} cm` : `${Math.round(n * 1000)} mm`;
  return { n, label };
}

export function createBlueprint({ host, onSelect = () => {} }) {
  const el = document.createElement("div");
  el.className = "blueprint";
  el.hidden = true;
  el.innerHTML = `<div class="bp-bar"><b class="bp-name"></b><label class="bp-explode">Explode <input type="range" min="0" max="1" step="0.01" value="0"></label><span class="bp-views" role="group" aria-label="View"><button type="button" class="bp-btn" data-bp="photo" aria-pressed="false">NASA photo</button><button type="button" class="bp-btn" data-bp="three" aria-pressed="true">3D: how it works</button></span><button type="button" class="bp-btn" data-bp="auto">Explode</button><button type="button" class="bp-btn" data-bp="xray" aria-pressed="false">X-ray</button><button type="button" class="bp-btn" data-bp="reset">Reset view</button></div>
    <div class="bp-stage"></div><figure class="bp-photo" hidden><img alt=""><figcaption></figcaption></figure><div class="bp-scale"><i></i><span></span></div><div class="bp-note"><span class="bp-key"><b></b>Built to a published dimension</span> Other parts show how the device works; sizes are approximate. Drag to rotate, scroll to zoom, click a part.</div>`;
  host.appendChild(el);
  const stage = el.querySelector(".bp-stage");
  const slider = el.querySelector("input[type=range]");
  const scaleBar = el.querySelector(".bp-scale");

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
  controls.maxDistance = 1.6;
  // Studio lighting: an environment map for real reflections on metal and glossy plastic.
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.9;
  renderer.toneMapping = THREE.AgXToneMapping;
  scene.add(new THREE.HemisphereLight(0xdfeaff, 0x0b2545, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(0.4, 0.6, 0.8);
  scene.add(key);
  const grid = new THREE.GridHelper(0.8, 32, 0x5c86c4, 0x2b4c80);
  grid.position.y = -0.2;
  scene.add(grid);

  let xray = false;
  let parts = [], selected = -1, explode = 0, autoT = null, current = null, fit = 1, size = 0.3, barLen = 0.1;
  const pa = new THREE.Vector3(), pb = new THREE.Vector3(), right = new THREE.Vector3();
  const root = new THREE.Group();
  scene.add(root);

  function clear() {
    root.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose?.(); });
    for (const p of parts) p.label.element.remove();
    root.clear();
    root.scale.setScalar(1);
    root.position.set(0, 0, 0);
    parts = [];
  }

  const photoEl = el.querySelector(".bp-photo");
  let mode = "three";
  function setMode(m) {
    mode = current && current.photo ? m : "three";
    photoEl.hidden = mode !== "photo";
    el.classList.toggle("photo-mode", mode === "photo");
    el.querySelector('[data-bp="photo"]').setAttribute("aria-pressed", String(mode === "photo"));
    el.querySelector('[data-bp="three"]').setAttribute("aria-pressed", String(mode === "three"));
    el.querySelector('[data-bp="photo"]').hidden = !(current && current.photo);
  }
  function load(inst) {
    clear();
    current = inst;
    if (inst.photo) {
      photoEl.querySelector("img").src = `${import.meta.env.BASE_URL}${inst.photo.src}`;
      photoEl.querySelector("img").alt = inst.photo.caption;
      photoEl.querySelector("figcaption").textContent = `${inst.photo.caption}. NASA ${inst.photo.id}`;
    }
    el.querySelector(".bp-name").textContent = inst.name;
    inst.parts.forEach((p, idx) => {
      const g = new THREE.Group();
      const meshes = [];
      if (p.build) {
        // A hand-modelled part: its own materials (cloned so selecting one part does not dim
        // another), no wireframe edges.
        const sub = p.build();
        if (p.scaleZ) sub.scale.z = p.scaleZ;
        sub.traverse((o) => {
          if (!o.isMesh) return;
          o.material = o.material.clone();
          o.material.userData.baseOpacity = o.material.transparent ? o.material.opacity : 1;
          o.userData.part = idx;
          meshes.push(o);
        });
        g.add(sub);
      }
      const n = p.build ? 0 : p.count || 1;
      const geo = p.build ? null : geometryFor(p);
      for (let c = 0; c < n; c++) {
        const color = new THREE.Color(p.color || "#9cc4ff");
        // Solid, physically lit parts: grey and pale parts read as brushed metal, coloured ones as
        // plastic or fabric, screens as dark glass. Ghost parts (housings, the body) stay see-through.
        const hsl = color.getHSL({});
        const metal = p.metal ?? (hsl.s < 0.15 ? 0.85 : 0.05);
        const mat = new THREE.MeshPhysicalMaterial({
          color: p.screen ? new THREE.Color(0x0b131d) : color,
          metalness: p.screen ? 0.2 : metal, roughness: p.screen ? 0.08 : metal > 0.5 ? 0.32 : 0.55,
          clearcoat: p.screen ? 1 : 0.25, clearcoatRoughness: 0.15,
          emissive: p.glow ? new THREE.Color(p.glow) : p.screen ? new THREE.Color(0x2a6fb0) : new THREE.Color(0x000000),
          emissiveIntensity: p.glow ? 0.9 : p.screen ? 0.35 : 0,
          transparent: !!p.ghost, opacity: p.ghost ? 0.14 : 1, depthWrite: !p.ghost, side: p.ghost ? THREE.DoubleSide : THREE.FrontSide,
        });
        const mesh = new THREE.Mesh(geo, mat);
        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), new THREE.LineBasicMaterial({ color: p.exact ? EXACT : INK, transparent: true, opacity: p.ghost ? 0.3 : p.exact ? 0.55 : 0.12 }));
        edges.userData.base = edges.material.opacity;
        const sub = new THREE.Group();
        sub.add(mesh, edges);
        if (p.rot) sub.rotation.set(...p.rot);
        if (p.scaleZ) sub.scale.z = p.scaleZ;
        if (n > 1) {
          if (p.ring) { const a = (c / n) * Math.PI * 2 + Math.PI / 4; sub.position.set(Math.cos(a) * p.ring, 0, Math.sin(a) * p.ring); }
          else { const st = p.step || [0.03, 0, 0]; sub.position.set(...st.map((v) => (c - (n - 1) / 2) * v)); }
        }
        mesh.userData.part = idx;
        meshes.push(mesh);
        g.add(sub);
      }
      const base = new THREE.Vector3(...p.at);
      const dir = new THREE.Vector3(...p.dir);
      if (dir.lengthSq() > 0) dir.normalize();
      g.position.copy(base);
      const tag = document.createElement("button");
      tag.type = "button";
      tag.className = "bp-tag" + (p.exact ? " exact" : "");
      tag.innerHTML = `<i>${idx + 1}</i>${p.name}`;
      tag.addEventListener("click", () => select(idx));
      const label = new CSS2DObject(tag);
      g.add(label);
      root.add(g);
      parts.push({ g, base, dir, label, meshes });
    });
    // Fit: scale the real-size assembly to the stage and remember the real size for the scale bar.
    const box = new THREE.Box3().setFromObject(root);
    const sz = box.getSize(new THREE.Vector3());
    size = Math.max(sz.x, sz.y, sz.z) || 0.1;
    fit = FIT / size;
    root.scale.setScalar(fit);
    root.position.copy(box.getCenter(new THREE.Vector3()).multiplyScalar(-fit));
    for (const p of parts) p.label.position.set(0, (0.018 / fit), 0);
    const nl = niceLength(size);
    barLen = nl.n * fit;
    scaleBar.querySelector("span").textContent = nl.label;
    resetView();
    setExplode(0); // assembled: parts separate only when the viewer presses Explode
    select(-1);
    setMode(inst.photo ? "photo" : "three");
  }
  function resetView() {
    camera.position.set(0.46, 0.3, 0.6);
    controls.target.set(0, 0, 0);
    controls.update();
  }
  function setExplode(v) {
    explode = v;
    const ab = el.querySelector('[data-bp="auto"]');
    if (ab) ab.textContent = v > 0.5 ? "Assemble" : "Explode";
    slider.value = String(v);
    const k = 0.28 * size * v; // in real metres, so every device explodes in proportion
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
      const ghost = current.parts[k].ghost;
      p.label.element.classList.toggle("on", on);
      p.label.element.classList.toggle("dim", idx >= 0 && !on);
      for (const m of p.meshes) {
        const own = m.material.userData.baseOpacity ?? 1;
        const base = ghost ? Math.min(own, 0.3) : xray ? 0.45 : own;
        const op = idx < 0 ? base : on ? Math.max(base, 0.95) : xray ? 0.08 : ghost ? 0.06 : 0.25;
        m.material.opacity = op;
        m.material.transparent = op < 1;
        m.material.depthWrite = op >= 1;
        m.material.needsUpdate = true;
      }
    });
    onSelect(idx);
  }

  slider.addEventListener("input", () => { if (mode !== "three") setMode("three"); setExplode(+slider.value); });
  el.addEventListener("click", (e) => {
    const b = e.target.closest("[data-bp]");
    if (!b) return;
    if (b.dataset.bp === "auto") { if (mode !== "three") setMode("three"); animate(explode > 0.5 ? 0 : 1); b.textContent = explode > 0.5 ? "Explode" : "Assemble"; }
    if (b.dataset.bp === "photo") setMode("photo");
    if (b.dataset.bp === "three") setMode("three");
    if (b.dataset.bp === "reset") resetView();
    if (b.dataset.bp === "xray") {
      xray = !xray;
      b.setAttribute("aria-pressed", String(xray));
      root.traverse((o) => { if (o.isLineSegments) o.material.opacity = xray ? Math.max(0.8, o.userData.base) : o.userData.base; });
      select(selected);
    }
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
    // Scale bar: the on-screen length of barLen at the orbit target, measured every frame.
    right.setFromMatrixColumn(camera.matrixWorld, 0);
    pa.copy(controls.target).project(camera);
    pb.copy(controls.target).addScaledVector(right, barLen).project(camera);
    const px = Math.abs(pb.x - pa.x) * 0.5 * stage.clientWidth;
    scaleBar.querySelector("i").style.width = `${Math.round(px)}px`;
  }
  return {
    el, load, select, render,
    show(on) { el.hidden = !on; if (on) resize(); },
    get selected() { return selected; },
  };
}
