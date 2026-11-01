// Study 3 (pre-registered): does the circadian model reproduce the published Mars-sol result
// (light in the second half of wake entrains people to a 24.65 h sol)?
// Run from lab/: node scripts/study3_mars_validation.mjs
import fs from "node:fs";
import { simulate, settle, lightSchedule } from "../src/engine/circadian.js";

const SOL = 24 + 39 / 60 + 35 / 3600;
const WAKE = SOL * (16 / 24);
const wakeStart = SOL * (7 / 24);

function light(half) {
  return (t) => {
    const h = ((t % SOL) + SOL) % SOL;
    if (h < wakeStart || h >= wakeStart + WAKE) return 0;
    const inFirst = h < wakeStart + WAKE / 2;
    return (half === "first" ? inFirst : !inFirst) ? 450 : 10;
  };
}

function drift(tau, half) {
  const s0 = settle({ light: lightSchedule({ on: 7, off: 23, lux: 300 }), days: 60, params: { tau } });
  const res = simulate({ light: light(half), hours: 40 * SOL, state: s0, params: { tau }, every: SOL, dt: 0.02 });
  const a = res.series.map((p) => Math.atan2(p.xc, p.x));
  const u = [a[0]];
  for (let i = 1; i < a.length; i++) { let d = a[i] - a[i - 1]; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; u.push(u[i - 1] + d); }
  const n = u.length;
  const minPerSol = (Math.abs(u[n - 1] - u[n - 11]) / 10 / (2 * Math.PI)) * 24 * 60;
  return +minPerSol.toFixed(1);
}

const taus = [23.9, 24.0, 24.1, 24.18, 24.3, 24.4, 24.5];
const rows = taus.map((tau) => {
  const second = drift(tau, "second"), first = drift(tau, "first");
  return { tau, second_half_drift_min_per_sol: second, second_half_locked: second < 3, first_half_drift_min_per_sol: first, first_half_locked: first < 3 };
});
console.table(rows);
const out = {
  study: "3: circadian model vs published Mars-sol entrainment",
  bars: {
    "3a second-half light locks tau 23.9 to 24.3": { pass: rows.filter((r) => r.tau <= 24.3).every((r) => r.second_half_locked) },
    "3b first-half light fails at tau 23.9": { pass: !rows[0].first_half_locked },
  },
  rows,
};
fs.writeFileSync("../analysis/study3_mars_validation.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out.bars));
