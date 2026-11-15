import * as THREE from "three";
import { mulberry32 } from "../engine/rng.js";
import { gltfLoader } from "./gltf.js";

// Outside the window: Earth from the station (real SGP4 position and real Sun direction), or the
// Moon / Mars, against stars and a faint Milky Way. Planets use their own lighting shader so the Sun
// does not light the cabin interior. Earth adds procedural clouds (with shadows on the ground), ocean
// sun-glint, Rayleigh haze at the limb, a warm terminator and city lights under the cloud deck.

const NOISE = /* glsl */ `
  float h31(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float vnoise(vec3 x) {
    vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 6; i++) { s += a * vnoise(p); p = p * 2.03 + 3.1; a *= 0.5; } return s; }
`;

const planetVert = /* glsl */ `
  varying vec2 vUv; varying vec3 vN; varying vec3 vView; varying vec3 vObj;
  void main(){ vUv = uv; vObj = normalize(position); vec4 wp = modelMatrix * vec4(position,1.0);
    vN = normalize(mat3(modelMatrix) * normal); vView = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp; }`;

const planetFrag = /* glsl */ `
  uniform sampler2D dayMap; uniform sampler2D nightMap; uniform float hasNight; uniform vec3 sunDir; uniform vec3 sunObj;
  uniform vec3 rim; uniform float rimStrength; uniform float isEarth; uniform float uTime; uniform float uGain;
  varying vec2 vUv; varying vec3 vN; varying vec3 vView; varying vec3 vObj;
  ${NOISE}
  float clouds(vec3 p) {
    float t = uTime * 0.0035;
    vec3 q = vec3(p.x * cos(t) - p.z * sin(t), p.y, p.x * sin(t) + p.z * cos(t));
    float lat = abs(q.y);
    float warp = fbm(q * 2.2 + 7.0);
    float n = fbm(q * 5.5 + warp * 1.6);
    float band = 0.55 + 0.25 * smoothstep(0.15, 0.0, lat) + 0.3 * smoothstep(0.3, 0.7, lat) - 0.25 * smoothstep(0.15, 0.32, lat) * smoothstep(0.45, 0.3, lat);
    float c = smoothstep(0.5 - band * 0.12, 0.74 - band * 0.08, n);
    float streak = fbm(vec3(q.x * 3.0, q.y * 18.0, q.z * 3.0) + warp);
    return clamp(c + 0.25 * smoothstep(0.6, 0.85, streak) * c, 0.0, 1.0);
  }
  void main(){
    vec3 N = normalize(vN), L = normalize(sunDir), V = normalize(vView);
    float d = dot(N, L);
    vec3 day = texture2D(dayMap, vUv).rgb;
    vec3 col;
    if (isEarth > 0.5) {
      float water = clamp((day.b - max(day.r, day.g * 0.85)) * 14.0, 0.0, 1.0) * smoothstep(0.25, 0.05, dot(day, vec3(0.33)));
      float cl = clouds(vObj);
      float shadow = clouds(normalize(vObj + normalize(sunObj) * 0.012));
      float lightAmt = smoothstep(-0.06, 0.25, d);
      vec3 sunCol = mix(vec3(1.0, 0.55, 0.3), vec3(1.0, 0.97, 0.92), smoothstep(0.0, 0.35, d));
      vec3 ground = day * (1.0 - 0.55 * shadow * lightAmt);
      vec3 lit = ground * max(d, 0.0) * 2.4 * sunCol;
      vec3 H = normalize(L + V);
      float nh = max(dot(N, H), 0.0);
      float glint = (pow(nh, 220.0) * 6.0 + pow(nh, 18.0) * 0.12) * water * (1.0 - cl) * step(0.0, d);
      lit += sunCol * glint;
      vec3 cloudCol = vec3(1.0) * (max(d, 0.0) * 1.35 + 0.015) * sunCol;
      col = mix(lit, cloudCol, cl * 0.92);
      vec3 night = texture2D(nightMap, vUv).rgb * vec3(1.0, 0.78, 0.5) * 2.2 * (1.0 - cl * 0.85);
      col += night * (1.0 - smoothstep(-0.12, 0.05, d));
      float f = pow(1.0 - max(dot(N, V), 0.0), 2.2);
      vec3 haze = mix(vec3(1.0, 0.42, 0.15), vec3(0.32, 0.55, 1.0), smoothstep(-0.05, 0.3, d));
      float f3 = f * f;
      col = mix(col, haze * (0.5 + 1.1 * max(d, 0.0)), f3 * 0.8 * smoothstep(-0.25, 0.1, d));
      col += vec3(0.05, 0.09, 0.2) * smoothstep(0.0, 0.6, d) * 0.12;   // in-scattered daylight
    } else {
      vec3 lit = day * (0.015 + 1.6 * max(d, 0.0));
      vec3 night = day * 0.01;
      col = mix(night, lit, smoothstep(-0.12, 0.1, d));
      float f = pow(1.0 - max(dot(N, V), 0.0), 3.0);
      col += rim * f * rimStrength * smoothstep(-0.3, 0.4, d);
    }
    gl_FragColor = vec4(col * uGain, 1.0);
  }`;

const atmoFrag = /* glsl */ `
  uniform vec3 sunDir; uniform vec3 rim; uniform float uStrength; varying vec3 vN; varying vec3 vView; varying vec2 vUv; varying vec3 vObj;
  void main(){
    vec3 N = normalize(vN);
    float f = pow(1.0 - abs(dot(N, normalize(vView))), 2.4);
    float d = dot(N, normalize(sunDir));
    float lit = smoothstep(-0.35, 0.45, d);
    vec3 c = mix(vec3(1.0, 0.38, 0.12), rim, smoothstep(-0.12, 0.3, d));
    gl_FragColor = vec4(c * f * (0.15 + 2.2 * lit) * uStrength, 1.0); }`;

function sunTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.06, "rgba(255,250,235,0.95)");
  grd.addColorStop(0.15, "rgba(255,230,190,0.35)");
  grd.addColorStop(0.4, "rgba(255,200,150,0.08)");
  grd.addColorStop(1, "rgba(255,180,120,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  // thin anamorphic streak
  const s = g.createLinearGradient(0, 0, 256, 0);
  s.addColorStop(0, "rgba(180,200,255,0)");
  s.addColorStop(0.5, "rgba(220,230,255,0.5)");
  s.addColorStop(1, "rgba(180,200,255,0)");
  g.fillStyle = s;
  g.fillRect(0, 126, 256, 4);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildOutside(tex) {
  const group = new THREE.Group();
  group.name = "outside";

  // Stars: magnitude-like size distribution and black-body-ish colours; steady (no atmosphere up here).
  const r = mulberry32(99);
  const n = 9000;
  const sp = new Float32Array(n * 3), sc = new Float32Array(n * 3), ss = new Float32Array(n);
  const tint = [[0.62, 0.72, 1.0], [0.8, 0.86, 1.0], [1.0, 1.0, 1.0], [1.0, 0.94, 0.82], [1.0, 0.82, 0.62]];
  for (let i = 0; i < n; i++) {
    const u = r() * 2 - 1, th = r() * Math.PI * 2, rr = 700;
    const s = Math.sqrt(1 - u * u);
    // concentrate a share of stars toward a tilted galactic band
    let x = s * Math.cos(th), y = u, z = s * Math.sin(th);
    if (r() < 0.35) { const k = (r() - 0.5) * 0.25; const a = r() * Math.PI * 2; x = Math.cos(a); z = Math.sin(a); y = k; const tilt = 1.05; const y2 = y * Math.cos(tilt) - z * Math.sin(tilt); z = y * Math.sin(tilt) + z * Math.cos(tilt); y = y2; const l = Math.hypot(x, y, z); x /= l; y /= l; z /= l; }
    sp.set([rr * x, rr * y, rr * z], i * 3);
    const mag = Math.pow(r(), 6);
    const tc = tint[Math.floor(r() * tint.length)];
    const b = 0.35 + 2.4 * mag;
    sc.set([tc[0] * b, tc[1] * b, tc[2] * b], i * 3);
    ss[i] = 0.9 + mag * 3.2;
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
  sg.setAttribute("color", new THREE.BufferAttribute(sc, 3));
  sg.setAttribute("size", new THREE.BufferAttribute(ss, 1));
  const starMat = new THREE.ShaderMaterial({
    uniforms: { uPix: { value: 1 }, uDim: { value: 1 } },
    vertexShader: /* glsl */ `attribute float size; attribute vec3 color; uniform float uPix; varying vec3 vC;
      void main(){ vC = color; gl_PointSize = size * uPix; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `uniform float uDim; varying vec3 vC; void main(){ vec2 c = gl_PointCoord - 0.5; float a = exp(-dot(c, c) * 14.0); gl_FragColor = vec4(vC * a * uDim, 1.0); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const stars = new THREE.Points(sg, starMat);
  group.add(stars);

  // Milky Way: a faint band of unresolved stars with dark dust lanes.
  const mw = new THREE.Mesh(new THREE.SphereGeometry(760, 64, 32), new THREE.ShaderMaterial({
    uniforms: { uDim: { value: 1 } },
    vertexShader: /* glsl */ `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `uniform float uDim; varying vec3 vP; ${NOISE}
      void main(){
        float tilt = 1.05; vec3 p = vP; float gy = p.y * cos(tilt) + p.z * sin(tilt);
        float band = exp(-gy * gy * 30.0);
        float n = fbm(p * 7.0); float dust = smoothstep(0.45, 0.7, fbm(p * 11.0 + 4.0)) * exp(-gy * gy * 120.0);
        vec3 c = mix(vec3(0.55, 0.6, 0.8), vec3(1.0, 0.85, 0.65), band) * band * (0.4 + 0.8 * n) * (1.0 - 0.8 * dust);
        gl_FragColor = vec4(c * 0.035 * uDim, 1.0); }`,
    side: THREE.BackSide, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending,
  }));
  group.add(mw);

  const mk = (map, night, rim, rimStrength, isEarth = 0) => new THREE.ShaderMaterial({
    uniforms: {
      dayMap: { value: map }, nightMap: { value: night ?? map }, hasNight: { value: night ? 1 : 0 }, sunDir: { value: new THREE.Vector3(1, 0.3, 0.2) },
      sunObj: { value: new THREE.Vector3(1, 0, 0) }, rim: { value: new THREE.Color(rim) }, rimStrength: { value: rimStrength }, isEarth: { value: isEarth },
      uTime: { value: 0 }, uGain: { value: 1 },
    },
    vertexShader: planetVert, fragmentShader: planetFrag,
  });
  const earthMat = mk(tex.earthDay, tex.earthNight, 0x6fa8ff, 0.9, 1);
  const moonMat = mk(tex.moon, null, 0x000000, 0);
  const marsMat = mk(tex.mars, null, 0xe0a070, 0.35);

  const earth = new THREE.Mesh(new THREE.SphereGeometry(38, 192, 128), earthMat);
  earth.position.set(0, -40.5, -46);
  const atmoMat = (sunU, rim, rad, strength) => new THREE.ShaderMaterial({
    uniforms: { sunDir: sunU, rim: { value: new THREE.Color(rim) }, uStrength: { value: strength } },
    vertexShader: planetVert, fragmentShader: atmoFrag, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide,
  });
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(38.75, 160, 112), atmoMat(earthMat.uniforms.sunDir, 0x4f8fff, 38.75, 1.7));
  atmo.position.copy(earth.position);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(9, 128, 96), moonMat);
  moon.position.set(0, 0.6, -64);
  const mars = new THREE.Mesh(new THREE.SphereGeometry(9, 128, 96), marsMat);
  mars.position.set(0, 0.6, -64);
  const marsAtmo = new THREE.Mesh(new THREE.SphereGeometry(9.25, 96, 64), atmoMat(marsMat.uniforms.sunDir, 0xd99a6a, 9.25, 0.6));
  marsAtmo.position.copy(mars.position);
  group.add(earth, atmo, moon, mars, marsAtmo);

  // The Sun: hot core + soft glare (bloom does the rest); hidden by the planet through the depth test.
  const sunMap = sunTexture();
  const sunCore = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunMap, color: new THREE.Color(1, 0.97, 0.9).multiplyScalar(30), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunMap, color: new THREE.Color(1, 0.9, 0.78).multiplyScalar(1.2), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  sunCore.scale.setScalar(26);
  sunGlow.scale.setScalar(220);
  group.add(sunGlow, sunCore);
  let activeSun = earthMat.uniforms.sunDir.value;
  const cam = new THREE.Vector3(0, 0.02, -3.2);
  const placeSun = () => {
    const p = cam.clone().addScaledVector(activeSun, 650);
    sunCore.position.copy(p);
    sunGlow.position.copy(p);
  };

  const tmpA = new THREE.Matrix4(), tmpB = new THREE.Matrix4();
  // Orient Earth so the station's sub-satellite point faces the window, north up.
  function orientEarth(lat, lon, sunEcf) {
    const local = new THREE.Vector3(Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon));
    const northLocal = new THREE.Vector3(-Math.sin(lat) * Math.cos(lon), Math.cos(lat), Math.sin(lat) * Math.sin(lon));
    const eastLocal = new THREE.Vector3().crossVectors(northLocal, local).normalize();
    const up = cam.clone().sub(earth.position).normalize();
    const north = new THREE.Vector3(0, 0, -1).projectOnPlane(up).normalize();
    const east = new THREE.Vector3().crossVectors(north, up).normalize();
    tmpA.makeBasis(eastLocal, northLocal, local);
    tmpB.makeBasis(east, north, up);
    const rot = tmpB.multiply(tmpA.transpose());
    earth.quaternion.setFromRotationMatrix(rot);
    const sunLocal = new THREE.Vector3(sunEcf.x, sunEcf.z, -sunEcf.y).normalize();
    earthMat.uniforms.sunObj.value.copy(sunLocal);
    earthMat.uniforms.sunDir.value.copy(sunLocal.applyQuaternion(earth.quaternion)).normalize();
    activeSun = earthMat.uniforms.sunDir.value;
    placeSun();
  }

  // A spacewalker outside the window: NASA's EVA-suited astronaut model (NASA 3D Resources,
  // public domain), scaled to 1.8 m and drifting slowly against Earth. Only at the ISS.
  const eva = new THREE.Group();
  eva.position.set(1.15, -0.45, -12.5);
  eva.visible = false;
  group.add(eva);
  gltfLoader().load(`${import.meta.env.BASE_URL}models/nasa/astronaut.glb`, (gltf) => {
    const m = gltf.scene;
    const box = new THREE.Box3().setFromObject(m), size = box.getSize(new THREE.Vector3());
    m.scale.setScalar(1.8 / size.y);
    m.position.copy(box.getCenter(new THREE.Vector3()).multiplyScalar(-m.scale.x));
    // Sunlit from outside: the cabin lights do not reach it, so lift it with its own texture.
    m.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.emissive = new THREE.Color(0xffffff); o.material.emissiveMap = o.material.map; o.material.emissiveIntensity = 0.55; } });
    eva.add(m);
  }, undefined, () => { /* no spacewalker; the view still works */ });
  let evaT = 0, t = 0;
  function tick(dt, pixelRatio = 1, reduced = false) {
    t += dt;
    earthMat.uniforms.uTime.value = t;
    starMat.uniforms.uPix.value = pixelRatio;
    if (!eva.visible || reduced) return;
    evaT += dt;
    eva.rotation.set(-0.35 + 0.08 * Math.sin(evaT * 0.21), 0.6 + 0.25 * Math.sin(evaT * 0.13), 0.25 + 0.1 * Math.sin(evaT * 0.17));
    eva.position.y = -0.45 + 0.12 * Math.sin(evaT * 0.27);
  }

  function show(dest) {
    eva.visible = dest === "iss";
    earth.visible = atmo.visible = dest === "iss";
    moon.visible = dest === "moon";
    mars.visible = marsAtmo.visible = dest === "mars";
    activeSun = (dest === "iss" ? earthMat : dest === "moon" ? moonMat : marsMat).uniforms.sunDir.value;
    placeSun();
  }

  function updateBody(dest, hours, dayHours) {
    const body = dest === "moon" ? moon : mars;
    const mat = dest === "moon" ? moonMat : marsMat;
    const rotPeriod = dest === "moon" ? 29.53 * 24 : dayHours;
    body.rotation.y = (hours / rotPeriod) * Math.PI * 2;
    const a = 0.9 + (hours / (rotPeriod * 6)) * Math.PI * 2;
    mat.uniforms.sunDir.value.set(Math.cos(a), 0.25, Math.sin(a)).normalize();
    activeSun = mat.uniforms.sunDir.value;
    placeSun();
  }

  return { group, orientEarth, show, updateBody, tick };
}
