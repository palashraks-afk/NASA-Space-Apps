// Exploratory (NOT pre-registered): where does the body clock settle relative to the sleep
// schedule under first-half versus second-half light? Locked at the wrong phase still means
// sleeping at the wrong biological time. Offset is relative to the Earth-entrained phase.
import fs from "node:fs";
import { simulate, settle, lightSchedule } from "../src/engine/circadian.js";
const SOL = 24 + 39 / 60 + 35 / 3600, WAKE = SOL * (16 / 24), W0 = SOL * (7 / 24);
const light = (half) => (t) => { const h = ((t % SOL) + SOL) % SOL; if (h < W0 || h >= W0 + WAKE) return 0; const f = h < W0 + WAKE / 2; return (half === "first" ? f : !f) ? 450 : 10; };
const rows = [];
for (const tau of [23.9, 24.18, 24.5]) {
  const s0 = settle({ light: lightSchedule({ on: 7, off: 23, lux: 300 }), days: 60, params: { tau } });
  const a0 = Math.atan2(s0[1], s0[0]);
  const row = { tau };
  for (const half of ["first", "second"]) {
    const res = simulate({ light: light(half), hours: 40 * SOL, state: s0, params: { tau }, every: SOL, dt: 0.02 });
    const last = res.series.at(-1);
    let d = Math.atan2(last.xc, last.x) - a0;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    row[`${half}_half_offset_h`] = +((Math.abs(d) / (2 * Math.PI)) * 24).toFixed(2);
  }
  rows.push(row);
}
console.table(rows);
fs.writeFileSync("../analysis/study3x_phase_angle.json", JSON.stringify({ note: "Exploratory, not pre-registered. Offset = size of the shift of the settled clock relative to its Earth-entrained timing at the start of each sleep schedule, in hours.", rows }, null, 2));
