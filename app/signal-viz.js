// "The Signal" — the secondary engagement/storytelling visualization layer.
// Per design review: this is NEVER the only way to see an urgent flag (see
// the status-chip tier in index.html, which renders first and independently).
// This module only reacts to risk data computed elsewhere; it invents nothing.

const LEVEL_COLOR = {
  normal: 0x34d399,
  watch: 0xfbbf24,
  flag: 0xf87171,
};

function levelToIntensity(level) {
  return { normal: 0.15, watch: 0.55, flag: 1.0 }[level] ?? 0.15;
}

function createSignalViz(container) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, 1.4, 7);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0x404060, 1.2));
  const key = new THREE.PointLight(0xffffff, 1.4, 50);
  key.position.set(4, 5, 6);
  scene.add(key);

  // Core: a torus knot standing in for the astronaut's voice waveform,
  // extruded into a 3D ribbon. Base geometry is fixed; color + distortion
  // are driven live by behavioral risk level.
  const coreGeo = new THREE.TorusKnotGeometry(1.4, 0.38, 220, 24, 2, 3);
  const basePositions = coreGeo.attributes.position.array.slice();
  const coreMat = new THREE.MeshStandardMaterial({
    color: LEVEL_COLOR.normal,
    roughness: 0.35,
    metalness: 0.5,
    emissive: LEVEL_COLOR.normal,
    emissiveIntensity: 0.2,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  scene.add(core);

  // Orbiting satellites: one per non-behavioral risk category.
  const satelliteDefs = [
    { category: "bone", angleOffset: 0, radius: 3.0 },
    { category: "cardiovascular", angleOffset: (Math.PI * 2) / 3, radius: 3.0 },
    { category: "immune", angleOffset: (Math.PI * 4) / 3, radius: 3.0 },
  ];
  const satellites = satelliteDefs.map((def) => {
    const geo = new THREE.SphereGeometry(0.32, 24, 24);
    const mat = new THREE.MeshStandardMaterial({ color: LEVEL_COLOR.normal, emissive: LEVEL_COLOR.normal, emissiveIntensity: 0.3 });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    return { ...def, mesh };
  });

  let t = 0;
  let currentRisk = null;
  let turbulence = 0; // smoothed jitter-driven distortion amount

  function setRisk(risk) {
    currentRisk = risk;
  }

  function animate() {
    t += 0.01;
    requestAnimationFrame(animate);

    if (currentRisk) {
      const b = currentRisk.behavioral;
      const targetColor = new THREE.Color(LEVEL_COLOR[b.level]);
      coreMat.color.lerp(targetColor, 0.05);
      coreMat.emissive.lerp(targetColor, 0.05);
      coreMat.emissiveIntensity = 0.15 + levelToIntensity(b.level) * 0.5;

      const targetTurbulence = levelToIntensity(b.level);
      turbulence += (targetTurbulence - turbulence) * 0.04;

      satellites.forEach((sat) => {
        const r = currentRisk[sat.category];
        const col = new THREE.Color(LEVEL_COLOR[r.level]);
        sat.mesh.material.color.lerp(col, 0.08);
        sat.mesh.material.emissive.lerp(col, 0.08);
        const scale = 0.85 + levelToIntensity(r.level) * 0.6;
        sat.mesh.scale.setScalar(scale);
        const angle = t * 0.3 + sat.angleOffset;
        sat.mesh.position.set(Math.cos(angle) * sat.radius, Math.sin(t * 0.6 + sat.angleOffset) * 0.6, Math.sin(angle) * sat.radius);
      });
    }

    // Surface distortion driven by turbulence (fatigue/jitter visibly roughens the form)
    const pos = coreGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const ix = i * 3;
      const bx = basePositions[ix], by = basePositions[ix + 1], bz = basePositions[ix + 2];
      const noise = Math.sin(bx * 3 + t * 2) * Math.cos(by * 3 - t * 1.7) * turbulence * 0.18;
      pos.array[ix] = bx + bx * noise;
      pos.array[ix + 1] = by + by * noise;
      pos.array[ix + 2] = bz + bz * noise;
    }
    pos.needsUpdate = true;

    core.rotation.y += 0.004;
    core.rotation.x += 0.0015;

    renderer.render(scene, camera);
  }
  animate();

  function onResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }
  window.addEventListener("resize", onResize);

  return { setRisk };
}
