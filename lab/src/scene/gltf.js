import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

// One glTF loader for the whole app, able to read Draco-compressed meshes (NASA's 3D Resources
// models use Draco; the anatomy model uses meshopt). The decoder ships with three.js and is served from public/draco/, so it
// also works offline.
let loader = null;
export function gltfLoader() {
  if (loader) return loader;
  const draco = new DRACOLoader();
  draco.setDecoderPath(`${import.meta.env.BASE_URL}draco/`);
  loader = new GLTFLoader();
  loader.setDRACOLoader(draco);
  loader.setMeshoptDecoder(MeshoptDecoder); // the anatomy model uses EXT_meshopt_compression
  return loader;
}
