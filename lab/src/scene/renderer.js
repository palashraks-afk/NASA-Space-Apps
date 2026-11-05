import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";

export function createRenderer(container, { quality = "high" } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
  const dprCap = quality === "high" ? 1.75 : 1;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, dprCap));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 0.95;
  container.appendChild(renderer.domElement);
  RectAreaLightUniformsLib.init();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020306);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.32;

  const camera = new THREE.PerspectiveCamera(56, container.clientWidth / container.clientHeight || 16 / 9, 0.02, 1500);

  const size = () => [container.clientWidth, container.clientHeight];
  const [w, h] = size();
  const target = new THREE.WebGLRenderTarget(w * renderer.getPixelRatio(), h * renderer.getPixelRatio(), { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  let gtao = null;
  if (quality === "high") {
    gtao = new GTAOPass(scene, camera, w, h);
    gtao.blendIntensity = 0.85;
    gtao.updateGtaoMaterial({ radius: 0.35, distanceExponent: 1.5, thickness: 1.2, scale: 1.1, samples: 12 });
    composer.addPass(gtao);
  }
  // Glow only for true emitters (LED strips, screens), not lit walls. The threshold used to sit right
  // where lit panels land, so tiny camera moves pushed pixels in and out of the glow and the lights
  // flickered while gliding between stations. A higher threshold with a soft knee keeps it steady.
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.3, 0.4, 1.5);
  bloom.highPassUniforms.smoothWidth.value = 0.6;
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const onResize = () => {
    const [nw, nh] = size();
    if (!nw || !nh) return; // hidden or minimised: keep the last good size
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    renderer.setSize(nw, nh);
    composer.setSize(nw, nh);
    if (gtao) gtao.setSize(nw, nh);
  };
  window.addEventListener("resize", onResize);
  return { renderer, scene, camera, composer, bloom, gtao, onResize };
}
