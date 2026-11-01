import * as THREE from "three";
import gsap from "gsap";

// Camera glides between stations like a crew member pulling themselves along handrails:
// ease-in-out with a slight roll, then a gentle microgravity float while idle. Pointer
// movement adds a small look-around. Reduced motion: jumps instead of glides, no float.
export function createCameraRig(camera, dom, views) {
  const target = new THREE.Vector3();
  const look = new THREE.Vector3();
  const pointer = new THREE.Vector2();
  let current = null, busy = false, reduced = false, t0 = performance.now();

  dom.addEventListener("pointermove", (e) => {
    const r = dom.getBoundingClientRect();
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
  });

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
    const roll = { r: 0 };
    tl.to(roll, { r: 0.06, duration: duration / 2, ease: "sine.inOut", yoyo: true, repeat: 1, onUpdate: () => (camera.userData.roll = roll.r) }, 0);
  }

  function update() {
    const t = (performance.now() - t0) / 1000;
    const float = reduced ? 0 : 1;
    const bob = new THREE.Vector3(Math.sin(t * 0.31) * 0.012, Math.sin(t * 0.43 + 1) * 0.01, Math.cos(t * 0.27) * 0.008).multiplyScalar(float);
    look.copy(target);
    if (!busy && !reduced) {
      const v = views[current];
      const amt = v && v.lookAround != null ? v.lookAround : 0.12;
      look.x += pointer.x * amt * (v && v.axis === "z" ? 0 : 1);
      look.z += pointer.x * amt * (v && v.axis === "z" ? 1 : 0);
      look.y -= pointer.y * amt * 0.6;
    }
    camera.position.add(bob);
    camera.lookAt(look);
    camera.rotateZ((camera.userData.roll || 0) + Math.sin(t * 0.2) * 0.004 * float);
    camera.position.sub(bob);
  }

  return { go, update, get current() { return current; }, get busy() { return busy; }, setReduced(v) { reduced = v; } };
}
