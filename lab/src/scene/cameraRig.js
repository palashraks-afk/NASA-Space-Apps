import * as THREE from "three";
import gsap from "gsap";

// Camera glides between stations with an ease-in-out move, then holds still. Reduced motion:
// jumps instead of glides.
export function createCameraRig(camera, dom, views) {
  const target = new THREE.Vector3();
  const look = new THREE.Vector3();
  let current = null, busy = false, reduced = false;


  function go(name, { duration = 2.1, onDone } = {}) {
    const v = views[name];
    if (!v) return;
    current = name;
    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(target);
    if (reduced || duration === 0 || window.__solInstant) {
      camera.position.copy(v.pos);
      target.copy(v.look);
      onDone && onDone();
      return;
    }
    busy = true;
    const tl = gsap.timeline({ onComplete: () => { busy = false; onDone && onDone(); } });
    tl.to(camera.position, { x: v.pos.x, y: v.pos.y, z: v.pos.z, duration, ease: "power2.inOut" }, 0);
    tl.to(target, { x: v.look.x, y: v.look.y, z: v.look.z, duration: duration * 0.9, ease: "power2.inOut" }, 0);
  }

  // Steady camera: no pointer drift, bob or roll. Movement only when changing station.
  function update() {
    look.copy(target);
    camera.lookAt(look);
  }

  return { go, update, get current() { return current; }, get busy() { return busy; }, setReduced(v) { reduced = v; } };
}
