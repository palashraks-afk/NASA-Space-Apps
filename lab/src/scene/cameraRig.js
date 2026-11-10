import * as THREE from "three";
import gsap from "gsap";

// Camera glides between stations with an ease-in-out move. Reduced motion: jumps instead of glides.
// Drag to orbit (mouse, pen or one finger) and scroll or pinch to zoom. Each view orbits its `pivot`
// (default: the point it looks at) within its own limits; going to another view eases the orbit
// back to that view's framing.
const DEFAULT_LIMITS = { yaw: 1.0, pitchUp: 0.45, pitchDown: 0.45, zoomIn: 0.55, zoomOut: 1.35 };

export function createCameraRig(camera, dom, views) {
  const basePos = camera.position.clone(); // where the view puts the camera before orbiting
  const target = new THREE.Vector3();
  const look = new THREE.Vector3();
  const pivot = new THREE.Vector3();
  const orbit = { yaw: 0, pitch: 0, zoom: 1 };
  let current = null, busy = false, reduced = false;
  const limits = () => ({ ...DEFAULT_LIMITS, ...(views[current]?.orbit || {}) });

  function go(name, { duration = 2.1, onDone } = {}) {
    const v = views[name];
    if (!v) return;
    current = name;
    gsap.killTweensOf(basePos);
    gsap.killTweensOf(target);
    gsap.killTweensOf(pivot);
    gsap.killTweensOf(orbit);
    const pv = v.pivot || v.look;
    if (reduced || duration === 0 || window.__solInstant) {
      basePos.copy(v.pos);
      target.copy(v.look);
      pivot.copy(pv);
      Object.assign(orbit, { yaw: 0, pitch: 0, zoom: 1 });
      onDone && onDone();
      return;
    }
    busy = true;
    const tl = gsap.timeline({ onComplete: () => { busy = false; onDone && onDone(); } });
    tl.to(basePos, { x: v.pos.x, y: v.pos.y, z: v.pos.z, duration, ease: "power2.inOut" }, 0);
    tl.to(target, { x: v.look.x, y: v.look.y, z: v.look.z, duration: duration * 0.9, ease: "power2.inOut" }, 0);
    tl.to(pivot, { x: pv.x, y: pv.y, z: pv.z, duration, ease: "power2.inOut" }, 0);
    tl.to(orbit, { yaw: 0, pitch: 0, zoom: 1, duration: duration * 0.8, ease: "power2.inOut" }, 0);
  }

  // ---- pointer input -------------------------------------------------------------------------
  const pointers = new Map();
  let pinch = 0;
  dom.style.cursor = "grab";
  dom.style.touchAction = "none";
  const clamp = THREE.MathUtils.clamp;
  function applyLimits() {
    const L = limits();
    if (Number.isFinite(L.yaw)) orbit.yaw = clamp(orbit.yaw, -L.yaw, L.yaw);
    orbit.pitch = clamp(orbit.pitch, -L.pitchDown, L.pitchUp);
    orbit.zoom = clamp(orbit.zoom, L.zoomIn, L.zoomOut);
  }
  dom.addEventListener("pointerdown", (e) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dom.setPointerCapture(e.pointerId);
    gsap.killTweensOf(orbit); // take over from a glide that is still easing the orbit back
    if (pointers.size === 1) dom.style.cursor = "grabbing";
  });
  dom.addEventListener("pointermove", (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (pointers.size === 1) {
      const k = 3.2 / Math.max(dom.clientHeight, 1);
      orbit.yaw -= dx * k;
      orbit.pitch += dy * k;
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch) orbit.zoom *= pinch / d;
      pinch = d;
    }
    applyLimits();
  });
  const up = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = 0;
    if (!pointers.size) dom.style.cursor = "grab";
  };
  dom.addEventListener("pointerup", up);
  dom.addEventListener("pointercancel", up);
  dom.addEventListener("wheel", (e) => {
    e.preventDefault();
    orbit.zoom *= Math.exp(e.deltaY * 0.0012);
    applyLimits();
  }, { passive: false });

  // ---- per-frame -----------------------------------------------------------------------------
  const off = new THREE.Vector3(), lookOff = new THREE.Vector3(), right = new THREE.Vector3();
  const qYaw = new THREE.Quaternion(), qPitch = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0);
  function update() {
    // The glide moves basePos; the orbit is applied on top of it every frame.
    off.subVectors(basePos, pivot);
    lookOff.subVectors(target, pivot);
    qYaw.setFromAxisAngle(Y, orbit.yaw);
    off.applyQuaternion(qYaw);
    lookOff.applyQuaternion(qYaw);
    right.crossVectors(Y, off).normalize();
    if (right.lengthSq() > 0) {
      qPitch.setFromAxisAngle(right, -orbit.pitch);
      off.applyQuaternion(qPitch);
      lookOff.applyQuaternion(qPitch);
    }
    off.multiplyScalar(orbit.zoom);
    camera.position.copy(pivot).add(off);
    look.copy(pivot).add(lookOff);
    camera.lookAt(look);
  }

  return { go, update, get current() { return current; }, get busy() { return busy; }, setReduced(v) { reduced = v; } };
}
