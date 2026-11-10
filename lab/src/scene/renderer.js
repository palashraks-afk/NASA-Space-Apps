import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";

// Final "camera" pass: exposure, a touch of lens chromatic aberration, AgX tone mapping, a filmic
// grade (gentle S-curve, cool shadows / warm highlights, saturation), vignette, grain and dither.
// The scene renders linear HDR into a half-float target; this is the only place tone mapping happens.
const CinematicShader = {
  uniforms: {
    tDiffuse: { value: null },
    toneMappingExposure: { value: 1 },
    uTime: { value: 0 },
    uAberration: { value: 0.0016 },
    uVignette: { value: 0.32 },
    uGrain: { value: 0.035 },
    uSaturation: { value: 1.16 },
    uContrast: { value: 1.12 },
    uSplit: { value: 0.035 },
    uResolution: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: /* glsl */ `
    precision highp float;
    uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix;
    attribute vec3 position; attribute vec2 uv; varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    precision highp float;
    uniform sampler2D tDiffuse;
    uniform float uTime, uAberration, uVignette, uGrain, uSaturation, uContrast, uSplit;
    uniform vec2 uResolution;
    #include <tonemapping_pars_fragment>
    #include <colorspace_pars_fragment>
    varying vec2 vUv;
    float hash(vec2 p) { p = fract(p * vec2(443.897, 441.423)); p += dot(p, p.yx + 19.19); return fract((p.x + p.y) * p.x); }
    void main() {
      vec2 c = vUv - 0.5;
      float r2 = dot(c, c);
      vec2 off = c * r2 * uAberration * 4.0;
      vec3 col;
      col.r = texture2D(tDiffuse, vUv - off).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv + off).b;
      col = AgXToneMapping(col);                       // applies toneMappingExposure
      // grade in display-referred space
      float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(l), col, uSaturation);
      col = clamp((col - 0.5) * uContrast + 0.5, 0.0, 1.0);
      col += uSplit * mix(vec3(-0.25, 0.05, 0.35), vec3(0.3, 0.08, -0.25), smoothstep(0.15, 0.75, l)) * (1.0 - abs(l * 2.0 - 1.0));
      float vig = smoothstep(0.85, 0.2, length(c * vec2(uResolution.x / uResolution.y, 1.0)) * 0.9);
      col *= mix(1.0 - uVignette, 1.0, vig);
      vec4 outc = sRGBTransferOETF(vec4(clamp(col, 0.0, 1.0), 1.0));
      float n = hash(vUv * uResolution + fract(uTime * 7.31) * 113.0) - 0.5;
      outc.rgb += n * uGrain * (1.0 - l * 0.6) + (hash(vUv * uResolution * 1.37 + 7.0) - 0.5) / 255.0;
      gl_FragColor = outc;
    }`,
};

export function createRenderer(container, { quality = "high" } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance", stencil: false });
  const dprCap = quality === "high" ? 1.75 : 1;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, dprCap));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.NoToneMapping;   // done in CinematicShader
  container.appendChild(renderer.domElement);
  RectAreaLightUniformsLib.init();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  const pmrem = new THREE.PMREMGenerator(renderer);
  // Neutral studio light until the baked cabin probe arrives.
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.3;

  // Reflection probe rendered in Blender from the middle of the cabin (lab/blender/bake.py).
  function loadProbe(url, intensity = 1) {
    return new Promise((res) => {
      new HDRLoader().load(url, (hdr) => {
        hdr.mapping = THREE.EquirectangularReflectionMapping;
        const env = pmrem.fromEquirectangular(hdr).texture;
        hdr.dispose();
        scene.environment = env;
        scene.environmentIntensity = intensity;
        res(env);
      }, undefined, () => res(null));
    });
  }

  const camera = new THREE.PerspectiveCamera(56, container.clientWidth / container.clientHeight, 0.02, 1500);

  const size = () => [container.clientWidth, container.clientHeight];
  const [w, h] = size();
  const target = new THREE.WebGLRenderTarget(w * renderer.getPixelRatio(), h * renderer.getPixelRatio(), { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  let gtao = null;
  if (quality === "high") {
    gtao = new GTAOPass(scene, camera, w, h);
    gtao.blendIntensity = 0.7;
    gtao.updateGtaoMaterial({ radius: 0.28, distanceExponent: 1.6, thickness: 1.0, scale: 1.0, samples: 12 });
    gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
    composer.addPass(gtao);
  }
  // Glow only for true emitters (LED diffusers, screens, the Sun). The threshold sits well above lit
  // walls so small camera moves never push wall pixels in and out of the glow (that read as flicker).
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.22, 0.32, 1.6);
  bloom.highPassUniforms.smoothWidth.value = 0.9;
  composer.addPass(bloom);
  const final = new ShaderPass(new THREE.RawShaderMaterial({
    uniforms: THREE.UniformsUtils.clone(CinematicShader.uniforms),
    vertexShader: CinematicShader.vertexShader,
    fragmentShader: CinematicShader.fragmentShader,
  }));
  final.uniforms.toneMappingExposure.value = 1.12;
  final.uniforms.uResolution.value.set(w, h);
  composer.addPass(final);

  const clock = new THREE.Clock();
  const render = (dt) => {
    final.uniforms.uTime.value = clock.getElapsedTime();
    composer.render(dt);
  };

  const onResize = () => {
    const [nw, nh] = size();
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    renderer.setSize(nw, nh);
    composer.setSize(nw, nh);
    if (gtao) gtao.setSize(nw, nh);
    final.uniforms.uResolution.value.set(nw, nh);
  };
  window.addEventListener("resize", onResize);
  return { renderer, scene, camera, composer, bloom, gtao, final, render, loadProbe, pmrem, onResize };
}
