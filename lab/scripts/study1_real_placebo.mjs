// Study 1 (pre-registered in docs/STUDIES_PREREG.md): placebo and injection tests on real
// sleep diaries. Run from lab/: node scripts/study1_real_placebo.mjs
import fs from "node:fs";
import { mulberry32 } from "../src/engine/rng.js";
import { fit, makeDesign, makePrior, verdict, credibleInterval } from "../src/engine/trial.js";
import { powerCurve } from "../src/engine/power.js";

const real = JSON.parse(fs.readFileSync("public/data/real_noise.json"));
const rows = fs.readFileSync("data-raw/sleep_diary.csv", "utf8").trim().split(/\r?\n/);
const head = rows[0].split(",");
const idx = (k) => head.indexOf(k);
const people = new Map();
for (const line of rows.slice(1)) {
  const c = line.split(",");
  const id = c[idx("userId")];
  if (!people.has(id)) people.set(id, []);
  people.get(id).push({ date: c[idx("date")], sleep_duration: +c[idx("sleep_duration")], sleep_efficiency: +c[idx("sleep_efficiency")] * 100, sleep_latency: +c[idx("sleep_latency")] * 60 });
}
const OUT = {
  sleep_duration: { delta: 0.5, better: 1, scale: 1 },
  sleep_efficiency: { delta: 2, better: 1, scale: 100 },
  sleep_latency: { delta: 8, better: -1, scale: 60 },
};
const SCHEDULES = 200, THR = 0.95;
const results = {};
const predCache = new Map();

for (const [key, o] of Object.entries(OUT)) {
  const r = real.outcomes[key];
  const sd = r.within_person_sd.median * o.scale, rho = Math.max(0, r.lag1_autocorrelation.median);
  const prior = makePrior(sd);
  let nP = 0, falseCalls = 0, nI = 0, hits = 0, covered = 0, predPowerSum = 0, persons = 0;
  for (const [id, recs] of people) {
    const series = recs.sort((a, b) => a.date.localeCompare(b.date)).map((x) => x[key]).filter((v) => Number.isFinite(v));
    if (series.length < 21) continue;
    persons++;
    const n = series.length;
    if (!predCache.has(`${key}|${n}`)) {
      const pc = powerCurve({ truth: { effect: 1.5 * o.delta, sigma: sd, rho, response: 1 }, days: n, blockLen: 1, washout: 0, delta: o.delta, thr: THR, trials: 400, seed: 21, checkpoints: [n] });
      predCache.set(`${key}|${n}`, pc[0].pRight);
    }
    predPowerSum += predCache.get(`${key}|${n}`);
    for (let s = 0; s < SCHEDULES; s++) {
      const rng = mulberry32(1000003 * (s + 1) + id.charCodeAt(0) * 7919 + id.charCodeAt(id.length - 1));
      const design = makeDesign({ days: n, blockLen: 1, washout: 0, rng });
      const base = series.map((v) => o.better * v);
      // placebo: nothing added
      const pv = verdict(fit(design, base, { prior }), { delta: o.delta, thr: THR }).label;
      nP++;
      if (pv === "works" || pv === "harms") falseCalls++;
      // injection: 1.5 x smallest worthwhile change on change days
      const inj = base.map((v, t) => v + design[t].arm * 1.5 * o.delta);
      const post = fit(design, inj, { prior });
      const iv = verdict(post, { delta: o.delta, thr: THR }).label;
      nI++;
      if (iv === "works") hits++;
      const [lo, hi] = credibleInterval(post);
      if (lo <= 1.5 * o.delta && 1.5 * o.delta <= hi) covered++;
    }
  }
  results[key] = {
    people: persons, schedules_per_person: SCHEDULES,
    placebo_false_call_rate: +(falseCalls / nP).toFixed(4),
    injection_real_power: +(hits / nI).toFixed(3),
    injection_predicted_power: +(predPowerSum / persons).toFixed(3),
    injection_interval_coverage: +(covered / nI).toFixed(3),
    noise_used_by_simulator: { sd: +sd.toFixed(3), rho: +rho.toFixed(3) },
  };
  console.log(key, results[key]);
}
const all = Object.values(results);
const pooledFalse = all.reduce((a, r) => a + r.placebo_false_call_rate * r.people, 0) / all.reduce((a, r) => a + r.people, 0);
const out = {
  study: "1: placebo and injection on real sleep diaries",
  bars: {
    "1a overall false-call rate <= 5%": { value: +pooledFalse.toFixed(4), pass: pooledFalse <= 0.05 },
    "1b real power within 10 points of predicted": Object.fromEntries(Object.entries(results).map(([k, r]) => [k, { real: r.injection_real_power, predicted: r.injection_predicted_power, pass: Math.abs(r.injection_real_power - r.injection_predicted_power) <= 0.10 }])),
    "1c interval coverage >= 90%": Object.fromEntries(Object.entries(results).map(([k, r]) => [k, { value: r.injection_interval_coverage, pass: r.injection_interval_coverage >= 0.9 }])),
  },
  results,
};
fs.writeFileSync("../analysis/study1_real_placebo.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out.bars, null, 1));
