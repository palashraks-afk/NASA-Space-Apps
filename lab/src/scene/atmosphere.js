import * as THREE from "three";
import { mulberry32 } from "../engine/rng.js";

// Cabin air: fine dust and lint motes drifting in microgravity, catching the light. All motion runs
// in the vertex shader (no per-frame CPU work). Motes fade out very close to the lens and far down
// the module so they read as depth, not as snow.
export function buildAtmosphere({ count = 1400 } = {}) {
  const r = mulberry32(4242);
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    pos.set([(r() - 0.5) * 5.2, -1.1 + r() * 2.5, -2.6 + r() * 5.2], i * 3); // the hub: 5.2 m square, floor to ceiling
    seed.set([r() * 100, 0.4 + r() * 0.6, r(), r()], i * 4);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("seed", new THREE.BufferAttribute(seed, 4));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uScale: { value: 1 }, uStrength: { value: 1.0 } },
    vertexShader: /* glsl */ `
      uniform float uTime, uScale;
      attribute vec4 seed;
      varying float vA;
      void main() {
        float t = uTime * 0.05 * seed.y + seed.x;
        vec3 p = position + vec3(sin(t * 1.3) * 0.12, sin(t * 0.9 + 1.7) * 0.1, sin(t * 0.7 + 3.1) * 0.2);
        p.z = mod(p.z + uTime * 0.006 * (seed.z - 0.5) + 2.6, 5.2) - 2.6;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float d = -mv.z;
        gl_PointSize = clamp((0.5 + seed.w * 0.9) * uScale / d, 1.0, 3.5);
        vA = smoothstep(0.35, 0.9, d) * (1.0 - smoothstep(2.5, 5.5, d)) * (0.35 + 0.65 * seed.w)
           * (0.6 + 0.4 * sin(uTime * (0.6 + seed.z) + seed.x * 6.0));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uStrength;
      varying float vA;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float a = smoothstep(0.5, 0.0, length(c));
        gl_FragColor = vec4(vec3(1.0, 0.95, 0.86) * a * vA * 0.4 * uStrength, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.renderOrder = 4;
  const group = new THREE.Group();
  group.name = "atmosphere";
  group.add(points);
  let t = 0;
  return {
    group,
    update(dt, camera, viewportHeight = window.innerHeight) {
      t += dt;
      mat.uniforms.uTime.value = t;
      mat.uniforms.uScale.value = viewportHeight * 0.0035 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    },
    setStrength(s) { mat.uniforms.uStrength.value = s; },
  };
}
