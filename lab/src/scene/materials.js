import * as THREE from "three";
import { aluNormal, aluWear, brushedRoughness, kaptonBump, velcro, weave } from "./textures.js";

export const PALETTE = {
  alu: 0xe4e8eb,
  graphite: 0x2a2f35,
  gold: 0xc28a1e,
  ink: 0x1d3f72,
  inkLight: 0x6fa8f5,
  tag: 0xd6342a,
  tape: 0xf6f6f1,
  marker: 0x16181b,
};

export function makeMaterials() {
  const rough = brushedRoughness(11);
  const relief = aluNormal(21);
  const nScale = new THREE.Vector2(0.4, 0.4);
  // Each aluminium finish gets its own wear map so neighbouring panels do not share the same smudges.
  const surface = (seed) => ({ normalMap: relief, normalScale: nScale, map: aluWear(seed) });
  return {
    alu: new THREE.MeshStandardMaterial({ color: PALETTE.alu, roughness: 0.62, metalness: 0.15, roughnessMap: rough, ...surface(31) }),
    aluPanel: new THREE.MeshStandardMaterial({ color: 0xd9dee2, roughness: 0.55, metalness: 0.2, roughnessMap: rough, ...surface(32) }),
    aluBright: new THREE.MeshStandardMaterial({ color: 0xf1f3f4, roughness: 0.5, metalness: 0.05, ...surface(33) }),
    rail: new THREE.MeshStandardMaterial({ color: 0xaab2ba, roughness: 0.38, metalness: 0.75 }),
    screw: new THREE.MeshStandardMaterial({ color: 0x8d949b, roughness: 0.35, metalness: 0.85 }),
    reveal: new THREE.MeshStandardMaterial({ color: 0x15181b, roughness: 0.9, metalness: 0 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x17191c, roughness: 0.8, metalness: 0 }),
    duct: new THREE.MeshStandardMaterial({ color: 0xc5cbd0, roughness: 0.9, metalness: 0 }),
    ledGreen: new THREE.MeshStandardMaterial({ color: 0x0d2a14, emissive: 0x4cff7a, emissiveIntensity: 2.4, roughness: 0.4 }),
    ledAmber: new THREE.MeshStandardMaterial({ color: 0x2a1c08, emissive: 0xffa040, emissiveIntensity: 2.4, roughness: 0.4 }),
    graphite: new THREE.MeshStandardMaterial({ color: PALETTE.graphite, roughness: 0.55, metalness: 0.45 }),
    graphiteMatte: new THREE.MeshStandardMaterial({ color: 0x23272c, roughness: 0.85, metalness: 0.1 }),
    gold: new THREE.MeshStandardMaterial({ color: PALETTE.gold, roughness: 0.28, metalness: 1, bumpMap: kaptonBump(7), bumpScale: 0.6 }),
    fabric: new THREE.MeshStandardMaterial({ map: weave(5), roughness: 0.95, metalness: 0 }),
    fabricBlue: new THREE.MeshStandardMaterial({ map: weave(6, [176, 190, 210]), roughness: 0.95, metalness: 0 }),
    velcro: new THREE.MeshStandardMaterial({ map: velcro(9), roughness: 1, metalness: 0 }),
    ink: new THREE.MeshStandardMaterial({ color: PALETTE.ink, roughness: 0.4, metalness: 0.2 }),
    tag: new THREE.MeshStandardMaterial({ color: PALETTE.tag, roughness: 0.7, metalness: 0 }),
    led: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff3e2, emissiveIntensity: 1.9, roughness: 0.4 }),
    ledCool: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xe8f1ff, emissiveIntensity: 1.6, roughness: 0.4 }),
    // Clear-coat glass, no transmission: transmission re-renders the whole scene every frame.
    glass: new THREE.MeshPhysicalMaterial({ color: 0xdfeaff, roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, transparent: true, opacity: 0.14, depthWrite: false }),
    screen: new THREE.MeshStandardMaterial({ color: 0x0b1726, emissive: 0x9cc4ff, emissiveIntensity: 0.25, roughness: 0.2 }),
    aluWarm: new THREE.MeshStandardMaterial({ color: 0xe9e6df, roughness: 0.6, metalness: 0.1, roughnessMap: rough, ...surface(34) }),
    aluCool: new THREE.MeshStandardMaterial({ color: 0xcfd6dc, roughness: 0.5, metalness: 0.25, roughnessMap: rough, ...surface(35) }),
    vent: new THREE.MeshStandardMaterial({ color: 0x3a4047, roughness: 0.6, metalness: 0.5 }),
    strap: new THREE.MeshStandardMaterial({ color: 0x31363c, roughness: 0.95 }),
    yellow: new THREE.MeshStandardMaterial({ color: 0xe6b422, roughness: 0.6 }),
    fabricTan: new THREE.MeshStandardMaterial({ map: weave(12, [214, 203, 178]), roughness: 0.95 }),
  };
}
