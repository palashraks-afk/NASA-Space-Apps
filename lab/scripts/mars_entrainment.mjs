// Does the Forger-Jewett-Kronauer pacemaker lock onto a Mars sol (24.66 h) under different
// cabin light levels? Crew intrinsic periods span the human range. Output feeds the docs.
// Run: node scripts/mars_entrainment.mjs
import fs from "node:fs";
import { simulate, settle, lightSchedule, step, DEFAULTS } from "../src/engine/circadian.js";

const SOL = 24 + 39 / 60 + 35 / 3600;
function lightFn(P, lux, brightWake) {
  const on = (7 / 24) * P, off = (23 / 24) * P;
  return (t) => { const h = ((t % P) + P) % P; if (h < on || h >= off) return 0; if (brightWake && h < on + 2) return 1000; return lux; };
}
function run(tau, P, lux, brightWake, days = 40) {
  const s0 = settle({ light: lightSchedule({ on: 7, off: 23, lux: 300 }), days: 60, params: { tau } });
  const light = lightFn(P, lux, brightWake);
  const res = simulate({ light, hours: days * P, state: s0, params: { tau }, every: P, dt: 0.02 });
  // phase angle at each local midnight; locked if it stops changing over the last 10 sols
  const ang = res.series.map((p) => Math.atan2(p.xc, p.x));
  const unwrap = [ang[0]];
  for (let i = 1; i < ang.length; i++) { let d = ang[i] - ang[i - 1]; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; unwrap.push(unwrap[i - 1] + d); }
  const n = unwrap.length;
  const driftHoursPerDay = Math.abs((unwrap[n - 1] - unwrap[n - 11]) / 10) / (2 * Math.PI) * 24;
  return { tau, lux, brightWake, driftMinPerSol: +(driftHoursPerDay * 60).toFixed(1), locked: driftHoursPerDay * 60 < 3 };
}
const rows = [];
for (const tau of [23.9, 24.05, 24.18, 24.3, 24.45]) for (const [lux, bw] of [[100, false], [300, false], [1000, false], [300, true]]) rows.push(run(tau, SOL, lux, bw));
console.table(rows);
fs.writeFileSync("../analysis/mars_entrainment.json", JSON.stringify({ sol_hours: SOL, model: "Forger-Jewett-Kronauer 1999, Serkh-Forger 2014 parameters (HCRSimPY)", schedule: "lights on 16 of 24.66 h at the stated lux; optional 1000 lux for 2 h after waking", locked_rule: "phase drift under 3 minutes per sol over the last 10 of 40 sols", rows }, null, 2));
