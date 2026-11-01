// Which design choices buy power? Power = chance of the right call by day 56 (effect 1.0 and 0.6 SD,
// smallest worthwhile effect 0.3 SD), false-call rate under no effect. Noise: AR(1) rho 0.3.
import { powerCurve } from "../src/engine/power.js";
import { mulberry32 } from "../src/engine/rng.js";
import { fit, makeDesign, makePrior, simulateOutcomes, verdict } from "../src/engine/trial.js";
const RESPONSE = Number(process.env.RESPONSE ?? 1);
const designs = [
  { name: "7-day blocks, 2 washout", blockLen: 7, washout: 2 },
  { name: "3-day blocks, 1 washout", blockLen: 3, washout: 1 },
  { name: "2-day blocks, 1 washout", blockLen: 2, washout: 1 },
  { name: "daily randomized, no washout", blockLen: 1, washout: 0 },
];
function falseCall(d, thr) {
  let w = 0; const T = 600, prior = makePrior(1);
  for (let k = 0; k < T; k++) { const rng = mulberry32(555000 + k); const des = makeDesign({ days: 56, blockLen: d.blockLen, washout: d.washout, rng });
    const y = simulateOutcomes(des, { effect: 0, sigma: 1, rho: 0.3, response: RESPONSE }, rng); const l = verdict(fit(des, y, { prior }), { delta: 0.3, thr }).label; if (l === "works" || l === "harms") w++; }
  return w / T;
}
const rows = [];
for (const d of designs) for (const thr of [0.95, 0.9]) {
  const get = (effect) => powerCurve({ truth: { effect, sigma: 1, rho: 0.3, response: RESPONSE }, delta: 0.3, thr, days: 56, blockLen: d.blockLen, washout: d.washout, trials: 500, seed: 11, checkpoints: [56] })[0];
  rows.push({ design: d.name, threshold: thr, power_effect_1_0: +get(1.0).pRight.toFixed(2), power_effect_0_6: +get(0.6).pRight.toFixed(2), wrong_call_at_effect_1_0: +get(1.0).pWrong.toFixed(3), false_call_no_effect: +falseCall(d, thr).toFixed(3) });
}
console.table(rows);
import fs from "node:fs"; fs.writeFileSync(`../analysis/lab_design_search_response_${RESPONSE}.json`, JSON.stringify({ response: RESPONSE, rows }, null, 2));
