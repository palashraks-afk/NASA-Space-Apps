// Reproducible calibration and power numbers for the experiment engine.
// Run: node scripts/checks.mjs   (writes ../analysis/lab_engine_checks.json)
import fs from "node:fs";
import { mulberry32 } from "../src/engine/rng.js";
import { fit, makeDesign, makePrior, simulateOutcomes, credibleInterval, verdict } from "../src/engine/trial.js";
import { powerCurve } from "../src/engine/power.js";

const out = { note: "Simulation under a Gaussian linear model with AR(1) noise, linear drift and a slow response. Units: the outcome's day-to-day spread = 1." };

function coverage(rho, whiten, trials = 2000) {
  let hit = 0, width = 0;
  const truth = { effect: 0.5, response: 0.6, drift: 0.15, sigma: 1, rho, b0: 3 };
  const prior = makePrior(1);
  for (let k = 0; k < trials; k++) {
    const rng = mulberry32(100000 + k);
    const d = makeDesign({ days: 56, rng });
    const y = simulateOutcomes(d, truth, rng);
    const [lo, hi] = credibleInterval(fit(d, y, { prior, rho: whiten ? "auto" : 0 }));
    if (lo <= truth.effect && truth.effect <= hi) hit++;
    width += hi - lo;
  }
  return { coverage: +(hit / trials).toFixed(3), meanWidth: +(width / trials).toFixed(3) };
}
out.coverage_95pct_interval_56_days = {
  "rho 0, modelled": coverage(0, true),
  "rho 0.4, modelled (pre-whitened)": coverage(0.4, true),
  "rho 0.4, correlation ignored": coverage(0.4, false),
  "rho 0.7, modelled (pre-whitened)": coverage(0.7, true),
  "rho 0.7, correlation ignored": coverage(0.7, false),
};

function falseCall(delta, rho, trials = 2000) {
  let wrong = 0;
  const prior = makePrior(1);
  for (let k = 0; k < trials; k++) {
    const rng = mulberry32(300000 + k);
    const d = makeDesign({ days: 56, rng });
    const y = simulateOutcomes(d, { effect: 0, sigma: 1, rho }, rng);
    const l = verdict(fit(d, y, { prior }), { delta, thr: 0.95 }).label;
    if (l === "works" || l === "harms") wrong++;
  }
  return +(wrong / trials).toFixed(4);
}
out.false_call_rate_when_no_true_effect = { "delta 0.3, rho 0.3": falseCall(0.3, 0.3), "delta 0.3, rho 0.6": falseCall(0.3, 0.6) };

const show = (c) => c.map((r) => ({ day: r.day, right: +r.pRight.toFixed(2), wrong: +r.pWrong.toFixed(2), open: +r.pOpen.toFixed(2) }));
const base = { sigma: 1, rho: 0.3, response: 0.6 };
out.power_by_day_delta_0_3 = {
  "true effect 1.0 (clearly worthwhile)": show(powerCurve({ truth: { ...base, effect: 1.0 }, delta: 0.3, days: 84, trials: 400, seed: 7 })),
  "true effect 0.6": show(powerCurve({ truth: { ...base, effect: 0.6 }, delta: 0.3, days: 84, trials: 400, seed: 7 })),
  "true effect 0 (proving there is none)": show(powerCurve({ truth: { ...base, effect: 0 }, delta: 0.3, days: 84, trials: 400, seed: 7 })),
};
fs.writeFileSync("../analysis/lab_engine_checks.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 1));
