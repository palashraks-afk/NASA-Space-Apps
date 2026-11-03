import * as THREE from "three";

// Navigation layer over the 3D view: a dot on each stop, edge arrows naming the neighbouring
// stops, and the keyboard (Left/Right to step along the stops, Escape to go home).
// `stops` are listed left to right as they sit in the room, each with its own camera view and the
// 3D point its dot hangs at. Everything funnels through goTo(view), so mouse, dots and keys agree.
export function createNav({ root, camera, stops, home, getCurrent, goTo, blocked = () => false }) {
  const order = stops.map((s) => s.view);
  const label = Object.fromEntries(stops.map((s) => [s.view, s.label]));

  root.innerHTML = `
    <button type="button" class="nav-arrow prev" aria-keyshortcuts="ArrowLeft"><span class="chev" aria-hidden="true">‹</span><span class="to"></span></button>
    <button type="button" class="nav-arrow next" aria-keyshortcuts="ArrowRight"><span class="to"></span><span class="chev" aria-hidden="true">›</span></button>
    <div class="nav-hint" aria-hidden="true"><kbd>←</kbd> <kbd>→</kbd> move between stations <span>·</span> <kbd>Esc</kbd> back to overview</div>`;
  const prev = root.querySelector(".prev"), next = root.querySelector(".next");
  const dotted = stops.filter((s) => s.anchor); // the home stop is reached by arrows and Escape, no dot
  const dots = dotted.map(({ view, label: text }) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "nav-dot"; b.dataset.view = view;
    b.setAttribute("aria-label", `Go to ${text}`);
    b.innerHTML = `<span class="ring"></span><span class="core"></span><span class="tag">${text}</span>`;
    root.appendChild(b);
    return b;
  });

  const step = (d) => order[(order.indexOf(getCurrent()) + d + order.length) % order.length];
  const v = new THREE.Vector3();
  let shown = null;

  function sync() {
    const cur = getCurrent();
    if (cur === shown) return;
    shown = cur;
    const p = step(-1), n = step(1);
    prev.querySelector(".to").textContent = label[p];
    next.querySelector(".to").textContent = label[n];
    prev.setAttribute("aria-label", `Previous station: ${label[p]}`);
    next.setAttribute("aria-label", `Next station: ${label[n]}`);
  }

  // Call once per frame, after the camera has been aimed.
  function update() {
    sync();
    const cur = getCurrent(), w = root.clientWidth, h = root.clientHeight;
    camera.updateMatrixWorld();
    dotted.forEach(({ view, anchor }, i) => {
      v.copy(anchor).project(camera);
      const on = view !== cur && v.z < 1 && Math.abs(v.x) < 0.94 && Math.abs(v.y) < 0.92;
      const b = dots[i];
      b.classList.toggle("off", !on);
      b.tabIndex = on ? 0 : -1;
      if (on) b.style.transform = `translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px)`;
    });
  }

  root.addEventListener("click", (e) => {
    const a = e.target.closest(".nav-arrow");
    if (a) return goTo(step(a === prev ? -1 : 1));
    const b = e.target.closest(".nav-dot");
    if (b) goTo(b.dataset.view);
  });

  window.addEventListener("keydown", (e) => {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || blocked()) return;
    const t = e.target instanceof Element ? e.target : null;
    if (t && (t.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName))) return; // those own the arrow keys and Escape
    if (e.key === "ArrowLeft") goTo(step(-1));
    else if (e.key === "ArrowRight") goTo(step(1));
    else if (e.key === "Escape") goTo(home); // goTo ignores it when already home
    else return;
    e.preventDefault();
  });

  return { update };
}
