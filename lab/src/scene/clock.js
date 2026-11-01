import * as THREE from "three";
import { step, settle, lightSchedule, DEFAULTS } from "../engine/circadian.js";
import { mulberry32, normal } from "../engine/rng.js";
import { tapeMesh } from "./textures.js";

// Body clock station. Four crew members run the Forger-Jewett-Kronauer pacemaker live.
// Intrinsic periods are drawn around 24.18 h (Czeisler et al. 1999 mean); the 0.14 h spread
// is an approximation from the reported coefficient of variation, stated in the build log.
// Dial = one local day. The hand shows local time; each bead shows where that crew member's
// body clock is. A bead riding with the hand is locked to the day; a bead slipping is drifting.
const RD = 0.42;
const CREW_COLORS = [0x6fa8f5, 0xf06a5e, 0xe2b04a, 0xd7dde3];

export function buildClock(mats) {
  const group = new THREE.Group();
  group.name = "clock";

  const face = new THREE.Mesh(new THREE.CylinderGeometry(RD, RD, 0.03, 128), new THREE.MeshStandardMaterial({ color: 0x15191e, roughness: 0.7, metalness: 0.3 }));
  face.rotation.x = Math.PI / 2;
  face.castShadow = true;
  group.add(face);
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(RD + 0.018, 0.026, 24, 160), mats.gold);
  bezel.position.z = 0.012;
  group.add(bezel);
  const back = new THREE.Mesh(new THREE.CylinderGeometry(RD + 0.05, RD + 0.05, 0.04, 96), mats.graphite);
  back.rotation.x = Math.PI / 2;
  back.position.z = -0.03;
  group.add(back);

  const tickGeoMajor = new THREE.BoxGeometry(0.008, 0.045, 0.006), tickGeoMinor = new THREE.BoxGeometry(0.004, 0.022, 0.006);
  for (let i = 0; i < 24; i++) {
    const a = Math.PI / 2 - (i / 24) * Math.PI * 2;
    const major = i % 6 === 0;
    const t = new THREE.Mesh(major ? tickGeoMajor : tickGeoMinor, mats.aluBright);
    const rr = RD - (major ? 0.035 : 0.025);
    t.position.set(Math.cos(a) * rr, Math.sin(a) * rr, 0.02);
    t.rotation.z = a - Math.PI / 2;
    group.add(t);
  }
  [["midnight", 0], ["6 h", 6], ["noon", 12], ["18 h", 18]].forEach(([txt, h], i) => {
    const a = Math.PI / 2 - (h / 24) * Math.PI * 2;
    const tp = tapeMesh(txt, { w: 0.12, h: 0.036, width: 384, height: 112, fontSize: 70, seed: 500 + i });
    tp.position.set(Math.cos(a) * (RD - 0.115), Math.sin(a) * (RD - 0.115), 0.022);
    group.add(tp);
  });
  const nameTape = tapeMesh("Body clock", { w: 0.24, h: 0.06, fontSize: 72, seed: 520 });
  nameTape.position.set(0, RD + 0.1, 0.02);
  group.add(nameTape);

  // Lights-on arc, rebuilt when the schedule changes.
  const arcMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffd9a0, emissiveIntensity: 2.2, roughness: 0.4 });
  let arc = null;
  function setArc(onFrac, offFrac) {
    if (arc) { group.remove(arc); arc.geometry.dispose(); }
    const len = ((offFrac - onFrac + 1) % 1) * Math.PI * 2;
    arc = new THREE.Mesh(new THREE.TorusGeometry(RD - 0.012, 0.007, 8, 160, len), arcMat);
    arc.rotation.z = Math.PI / 2 - onFrac * Math.PI * 2 - len;
    arc.position.z = 0.02;
    group.add(arc);
  }

  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.012, RD - 0.07, 0.008), mats.aluBright);
  hand.geometry.translate(0, (RD - 0.07) / 2, 0);
  hand.position.z = 0.03;
  hand.castShadow = true;
  group.add(hand);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.02, 24), mats.gold);
  hub.rotation.x = Math.PI / 2;
  hub.position.z = 0.04;
  group.add(hub);

  // Phase portrait of the selected crew member: the oscillator's (x, xc) state, live.
  const TRAIL = 900;
  const trailPos = new Float32Array(TRAIL * 3), trailCol = new Float32Array(TRAIL * 3);
  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
  trailGeo.setAttribute("color", new THREE.BufferAttribute(trailCol, 3));
  const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95 }));
  trail.position.z = 0.025;
  group.add(trail);
  let trailHead = 0, trailFilled = 0;

  const beadGeo = new THREE.SphereGeometry(0.022, 24, 16);
  const beads = CREW_COLORS.map((c, i) => {
    const m = new THREE.Mesh(beadGeo, new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.4, roughness: 0.3 }));
    m.position.z = 0.04;
    group.add(m);
    const tag = tapeMesh("ABCD"[i], { w: 0.03, h: 0.026, width: 128, height: 112, fontSize: 80, seed: 540 + i });
    tag.position.z = 0.041;
    group.add(tag);
    m.userData.tag = tag;
    return m;
  });
  const portraitBead = new THREE.Mesh(new THREE.SphereGeometry(0.012, 16, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2 }));
  portraitBead.position.z = 0.03;
  group.add(portraitBead);

  // ---------------- simulation ----------------
  const rng = mulberry32(1999);
  const crew = [0, 1, 2, 3].map((i) => ({ id: "ABCD"[i], tau: +(24.18 + 0.14 * normal(rng)).toFixed(2) }));
  const earthCache = new Map();
  let sim = null;

  function lightFn(P, lux, brightWake) {
    const on = (7 / 24) * P, off = (23 / 24) * P;
    return (t) => {
      const h = ((t % P) + P) % P;
      if (h < on || h >= off) return 0;
      if (brightWake && h < on + 2) return 1000;
      return lux;
    };
  }

  function reset({ dayHours, lux, brightWake, selected = 0 }) {
    setArc(7 / 24, 23 / 24);
    const earthLight = lightSchedule({ on: 7, off: 23, lux: 300 });
    sim = {
      t: 0, P: dayHours, lux, brightWake, selected,
      light: lightFn(dayHours, lux, brightWake),
      members: crew.map((c) => {
        if (!earthCache.has(c.tau)) earthCache.set(c.tau, settle({ light: earthLight, days: 60, params: { tau: c.tau } }));
        const s = earthCache.get(c.tau).slice();
        return { ...c, s, params: { ...DEFAULTS, tau: c.tau }, prevAngle: Math.atan2(s[1], s[0]), cycles: 0, dir: 0, history: [] };
      }),
    };
    trailHead = 0;
    trailFilled = 0;
  }

  // Advance simulated time by `hours`, integrating each crew member with RK4.
  function advance(hours) {
    if (!sim) return;
    const dt = 0.05;
    let remaining = hours;
    while (remaining > 1e-9) {
      const h = Math.min(dt, remaining);
      for (const m of sim.members) {
        m.s = step(sim.t, m.s, h, sim.light, m.params);
        const a = Math.atan2(m.s[1], m.s[0]);
        let d = a - m.prevAngle;
        if (d > Math.PI) d -= 2 * Math.PI;
        if (d < -Math.PI) d += 2 * Math.PI;
        if (!m.dir) m.dir = Math.sign(d) || -1;
        m.cycles += (m.dir * d) / (2 * Math.PI);
        m.prevAngle = a;
      }
      const before = Math.floor(sim.t / sim.P);
      sim.t += h;
      remaining -= h;
      if (Math.floor(sim.t / sim.P) !== before) {
        for (const m of sim.members) m.history.push(offsetHours(m));
      }
      const sel = sim.members[sim.selected];
      trailPos[trailHead * 3] = sel.s[0] * 0.13;
      trailPos[trailHead * 3 + 1] = sel.s[1] * 0.13;
      trailPos[trailHead * 3 + 2] = 0;
      trailHead = (trailHead + 1) % TRAIL;
      trailFilled = Math.min(TRAIL, trailFilled + 1);
    }
  }

  // Signed misalignment between body clock and local day, in local hours (+ = body runs early).
  function offsetHours(m) {
    const bodyFrac = ((m.cycles % 1) + 1) % 1;
    const localFrac = ((sim.t % sim.P) + sim.P) % sim.P / sim.P;
    let d = bodyFrac - localFrac;
    if (d > 0.5) d -= 1;
    if (d < -0.5) d += 1;
    return d * sim.P;
  }

  function render() {
    if (!sim) return;
    const localFrac = ((sim.t % sim.P) + sim.P) % sim.P / sim.P;
    hand.rotation.z = -localFrac * Math.PI * 2;
    sim.members.forEach((m, i) => {
      const frac = ((m.cycles % 1) + 1) % 1;
      const a = Math.PI / 2 - frac * Math.PI * 2;
      const rr = RD - 0.13 - i * 0.045;
      beads[i].position.set(Math.cos(a) * rr, Math.sin(a) * rr, 0.04);
      beads[i].userData.tag.position.set(Math.cos(a) * (rr - 0.035), Math.sin(a) * (rr - 0.035), 0.041);
      beads[i].scale.setScalar(i === sim.selected ? 1.35 : 1);
    });
    const sel = sim.members[sim.selected];
    portraitBead.position.set(sel.s[0] * 0.13, sel.s[1] * 0.13, 0.03);
    // colour the trail from faint (old) to bright (new)
    const c = new THREE.Color(CREW_COLORS[sim.selected]);
    for (let k = 0; k < TRAIL; k++) {
      const idx = (trailHead - 1 - k + TRAIL) % TRAIL;
      const f = k < trailFilled ? Math.pow(1 - k / TRAIL, 1.6) : 0;
      trailCol[idx * 3] = c.r * f; trailCol[idx * 3 + 1] = c.g * f; trailCol[idx * 3 + 2] = c.b * f;
    }
    trailGeo.attributes.position.needsUpdate = true;
    trailGeo.attributes.color.needsUpdate = true;
    trailGeo.setDrawRange(0, TRAIL);
  }

  function readout() {
    if (!sim) return null;
    return {
      days: sim.t / sim.P,
      P: sim.P,
      members: sim.members.map((m) => {
        const h = m.history;
        const rate = h.length >= 4 ? (h[h.length - 1] - h[h.length - 4]) / 3 : null;
        const off = offsetHours(m);
        return { id: m.id, tau: m.tau, offset: off, ratePerDay: rate, locked: rate !== null && Math.abs(rate) < 0.05 && Math.abs(off) < 3 };
      }),
    };
  }

  return { group, crew, reset, advance, render, readout, select(i) { if (sim) { sim.selected = i; trailFilled = 0; } } };
}
