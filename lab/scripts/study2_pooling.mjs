// Study 2 (pre-registered): does partial pooling across a crew improve each person's answer?
// Run from lab/: node scripts/study2_pooling.mjs
import fs from "node:fs";
import { mulberry32, normal } from "../src/engine/rng.js";
import { fit, makeDesign, makePrior, simulateOutcomes, credibleInterval, effectMean } from "../src/engine/trial.js";

const real = JSON.parse(fs.readFileSync("public/data/real_noise.json"));
const r = real.outcomes.sleep_latency;
const SD = r.within_person_sd.median * 60, RHO = Math.max(0, r.lag1_autocorrelation.median);
const DELTA = 8, DAYS = 56, CREWS = 2000;
const prior = makePrior(SD);

// Normal-normal empirical Bayes with the DerSimonian-Laird between-person variance.
export function poolCrew(est, se) {
  const k = est.length;
  const w = se.map((s) => 1 / (s * s));
  const sw = w.reduce((a, b) => a + b, 0);
  const mFixed = est.reduce((a, e, i) => a + w[i] * e, 0) / sw;
  const Q = est.reduce((a, e, i) => a + w[i] * (e - mFixed) ** 2, 0);
  const tau2 = Math.max(0, (Q - (k - 1)) / (sw - w.reduce((a, b) => a + b * b, 0) / sw));
  const wr = se.map((s) => 1 / (s * s + tau2));
  const swr = wr.reduce((a, b) => a + b, 0);
  const mu = est.reduce((a, e, i) => a + wr[i] * e, 0) / swr;
  const varMu = 1 / swr;
  return est.map((e, i) => {
    const B = tau2 === 0 ? 1 : (se[i] * se[i]) / (se[i] * se[i] + tau2);
    const theta = B * mu + (1 - B) * e;
    const v = (1 - B) * se[i] * se[i] + B * B * varMu;
    return { theta, sd: Math.sqrt(Math.max(v, 1e-12)), tau2 };
  });
}

const settings = [];
for (const crew of [4, 6]) for (const tauMult of [0, 0.5, 1.0]) settings.push({ crew, tauMult });
const out = { study: "2: crew pooling", outcome: "time to fall asleep", sd: SD, rho: RHO, delta: DELTA, days: DAYS, crews: CREWS, settings: [] };

for (const st of settings) {
  let seInd = 0, sePool = 0, covInd = 0, covPool = 0, n = 0;
  for (let c = 0; c < CREWS; c++) {
    const rng = mulberry32(777000 + c * 13 + st.crew * 1000 + Math.round(st.tauMult * 100));
    const thetas = Array.from({ length: st.crew }, () => DELTA + st.tauMult * DELTA * normal(rng));
    const est = [], se = [], cis = [];
    for (const th of thetas) {
      const d = makeDesign({ days: DAYS, blockLen: 1, washout: 0, rng });
      const y = simulateOutcomes(d, { effect: th, sigma: SD, rho: RHO, response: 1, b0: 20 }, rng);
      const post = fit(d, y, { prior });
      const ci = credibleInterval(post);
      est.push(effectMean(post));
      se.push((ci[1] - ci[0]) / 3.92);
      cis.push(ci);
    }
    const pooled = poolCrew(est, se);
    thetas.forEach((th, i) => {
      n++;
      seInd += (est[i] - th) ** 2;
      sePool += (pooled[i].theta - th) ** 2;
      if (cis[i][0] <= th && th <= cis[i][1]) covInd++;
      if (Math.abs(pooled[i].theta - th) <= 1.96 * pooled[i].sd) covPool++;
    });
  }
  const row = {
    crew: st.crew, between_person_spread_x_delta: st.tauMult,
    rmse_individual: +Math.sqrt(seInd / n).toFixed(3), rmse_pooled: +Math.sqrt(sePool / n).toFixed(3),
    coverage_individual: +(covInd / n).toFixed(3), coverage_pooled: +(covPool / n).toFixed(3),
  };
  out.settings.push(row);
  console.log(row);
}
out.bars = {
  "2a pooled RMSE lower when spread is 0 or 0.5": out.settings.filter((s) => s.between_person_spread_x_delta <= 0.5).map((s) => ({ crew: s.crew, spread: s.between_person_spread_x_delta, pass: s.rmse_pooled < s.rmse_individual })),
  "2b pooled coverage >= 90% in every setting": out.settings.map((s) => ({ crew: s.crew, spread: s.between_person_spread_x_delta, value: s.coverage_pooled, pass: s.coverage_pooled >= 0.9 })),
};
fs.writeFileSync("../analysis/study2_pooling.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out.bars, null, 1));
