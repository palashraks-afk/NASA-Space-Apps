import * as THREE from "three";
import { mulberry32 } from "../engine/rng.js";

// Outside the window: Earth from the station (real SGP4 position and real Sun direction),
// or the Moon / Mars, plus a star field. Planets use their own lighting shader so the Sun
// does not light the cabin interior.
const planetVert = /* glsl */ `
  varying vec2 vUv; varying vec3 vN; varying vec3 vView;
  void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position,1.0);
    vN = normalize(mat3(modelMatrix) * normal); vView = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp; }`;
const planetFrag = /* glsl */ `
  uniform sampler2D dayMap; uniform sampler2D nightMap; uniform float hasNight; uniform vec3 sunDir;
  uniform vec3 rim; uniform float rimStrength;
  varying vec2 vUv; varying vec3 vN; varying vec3 vView;
  void main(){
    float d = dot(normalize(vN), normalize(sunDir));
    vec3 day = texture2D(dayMap, vUv).rgb;
    vec3 lit = day * (0.02 + 1.35 * max(d, 0.0));
    vec3 night = hasNight > 0.5 ? texture2D(nightMap, vUv).rgb * vec3(1.0, 0.85, 0.6) * 1.4 : day * 0.012;
    float t = smoothstep(-0.18, 0.12, d);
    vec3 col = mix(night, lit, t);
    float f = pow(1.0 - max(dot(normalize(vN), vView), 0.0), 3.0);
    col += rim * f * rimStrength * smoothstep(-0.3, 0.4, d);
    gl_FragColor = vec4(col, 1.0);
  }`;
const atmoFrag = /* glsl */ `
  uniform vec3 sunDir; uniform vec3 rim; varying vec3 vN; varying vec3 vView; varying vec2 vUv;
  void main(){ float f = pow(1.0 - abs(dot(normalize(vN), vView)), 2.2);
    float lit = smoothstep(-0.35, 0.5, dot(normalize(vN), normalize(sunDir)));
    gl_FragColor = vec4(rim * f * (0.25 + 1.4 * lit), f * lit); }`;

export function buildOutside(tex) {
  const group = new THREE.Group();
  group.name = "outside";

  const r = mulberry32(99);
  const n = 5000;
  const sp = new Float32Array(n * 3), sc = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = r() * 2 - 1, th = r() * Math.PI * 2, rr = 700;
    const s = Math.sqrt(1 - u * u);
    sp.set([rr * s * Math.cos(th), rr * u, rr * s * Math.sin(th)], i * 3);
    const b = 0.45 + r() * 0.55, warm = r();
    sc.set([b * (0.9 + 0.1 * warm), b * 0.95, b * (1.05 - 0.15 * warm)], i * 3);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
  sg.setAttribute("color", new THREE.BufferAttribute(sc, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ size: 1.4, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false }));
  group.add(stars);

  const mk = (map, night, rim, rimStrength) => new THREE.ShaderMaterial({
    uniforms: { dayMap: { value: map }, nightMap: { value: night ?? map }, hasNight: { value: night ? 1 : 0 }, sunDir: { value: new THREE.Vector3(1, 0.3, 0.2) }, rim: { value: new THREE.Color(rim) }, rimStrength: { value: rimStrength } },
    vertexShader: planetVert, fragmentShader: planetFrag,
  });
  const earthMat = mk(tex.earthDay, tex.earthNight, 0x6fa8ff, 0.9);
  const moonMat = mk(tex.moon, null, 0x000000, 0);
  const marsMat = mk(tex.mars, null, 0xe0a070, 0.35);

  const earth = new THREE.Mesh(new THREE.SphereGeometry(38, 128, 96), earthMat);
  earth.position.set(0, -40.5, -46);
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(38.9, 128, 96), new THREE.ShaderMaterial({
    uniforms: { sunDir: earthMat.uniforms.sunDir, rim: { value: new THREE.Color(0x5fa0ff) } },
    vertexShader: planetVert, fragmentShader: atmoFrag, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide,
  }));
  atmo.position.copy(earth.position);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(9, 96, 64), moonMat);
  moon.position.set(0, 0.6, -64);
  const mars = new THREE.Mesh(new THREE.SphereGeometry(9, 96, 64), marsMat);
  mars.position.set(0, 0.6, -64);
  const marsAtmo = new THREE.Mesh(new THREE.SphereGeometry(9.25, 96, 64), new THREE.ShaderMaterial({
    uniforms: { sunDir: marsMat.uniforms.sunDir, rim: { value: new THREE.Color(0xd99a6a) } },
    vertexShader: planetVert, fragmentShader: atmoFrag, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide,
  }));
  marsAtmo.position.copy(mars.position);
  group.add(earth, atmo, moon, mars, marsAtmo);

  const cam = new THREE.Vector3(0, 0.02, -3.2);
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
    const sunLocal = new THREE.Vector3(sunEcf.x, sunEcf.z, -sunEcf.y);
    earthMat.uniforms.sunDir.value.copy(sunLocal.applyQuaternion(earth.quaternion)).normalize();
  }

  function show(dest) {
    earth.visible = atmo.visible = dest === "iss";
    moon.visible = dest === "moon";
    mars.visible = marsAtmo.visible = dest === "mars";
  }

  function updateBody(dest, hours, dayHours) {
    const body = dest === "moon" ? moon : mars;
    const mat = dest === "moon" ? moonMat : marsMat;
    const rotPeriod = dest === "moon" ? 29.53 * 24 : dayHours;
    body.rotation.y = (hours / rotPeriod) * Math.PI * 2;
    const a = 0.9 + (hours / (rotPeriod * 6)) * Math.PI * 2;
    mat.uniforms.sunDir.value.set(Math.cos(a), 0.25, Math.sin(a)).normalize();
  }

  return { group, orientEarth, show, updateBody };
}
