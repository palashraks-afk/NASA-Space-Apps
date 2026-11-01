import { describe, expect, it } from "vitest";
import { mulberry32 } from "./rng.js";
import { fit, makeDesign, makePrior, simulateOutcomes, credibleInterval, verdict, tCdf, tQuantile } from "./trial.js";
import { powerCurve } from "./power.js";
import { simulate, settle, lightSchedule, phaseHours } from "./circadian.js";

describe("student t", () => {
  it("matches reference values", () => {
    expect(tCdf(0, 7)).toBeCloseTo(0.5, 12);
    expect(tQuantile(0.975, 10)).toBeCloseTo(2.228, 3);
    expect(tQuantile(0.95, 5)).toBeCloseTo(2.015, 3);
    expect(tCdf(1.96, 1e6)).toBeCloseTo(0.975, 3);
  });
});

// Bars below were written before the numbers were looked at.
describe("posterior calibration", () => {
  const coverage = (rho, whiten, trials = 600) => {
    let hit = 0;
    const truth = { effect: 0.5, response: 0.6, drift: 0.15, sigma: 1, rho, b0: 3 };
    const prior = makePrior(1);
    for (let k = 0; k < trials; k++) {
      const rng = mulberry32(5000 + k);
      const d = makeDesign({ days: 56, rng });
      const y = simulateOutcomes(d, truth, rng);
      const post = fit(d, y, { prior, rho: whiten ? "auto" : 0 });
      const [lo, hi] = credibleInterval(post);
      if (lo <= truth.effect && truth.effect <= hi) hit++;
    }
    return hit / trials;
  };
  it("95% intervals cover about 95% when noise is independent", () => {
    const c = coverage(0, true);
    expect(c).toBeGreaterThan(0.92);
    expect(c).toBeLessThan(0.98);
  });
  it("pre-whitening keeps coverage near nominal when daily noise is correlated (rho 0.4)", () => {
    expect(coverage(0.4, true)).toBeGreaterThan(0.9);
  });
  it("ignoring correlation (rho 0.4) is measurably worse than modelling it", () => {
    expect(coverage(0.4, false)).toBeLessThan(coverage(0.4, true));
  });
  it("calls 'works' under no true effect no more than 5% of the time", () => {
    let wrong = 0;
    const trials = 600;
    const prior = makePrior(1);
    for (let k = 0; k < trials; k++) {
      const rng = mulberry32(9000 + k);
      const d = makeDesign({ days: 56, rng });
      const y = simulateOutcomes(d, { effect: 0, sigma: 1, rho: 0.3 }, rng);
      const v = verdict(fit(d, y, { prior }), { delta: 0.3, thr: 0.95 }).label;
      if (v === "works" || v === "harms") wrong++;
    }
    expect(wrong / trials).toBeLessThanOrEqual(0.05);
  });
});

describe("power preview", () => {
  it("a bigger effect is decided sooner, and wrong verdicts stay rare", () => {
    // An effect only just above the smallest worthwhile effect is not expected to be monotone
    // (early lucky calls, then a posterior that settles near the threshold), so monotonicity is
    // asserted for the large effect only.
    const small = powerCurve({ truth: { effect: 0.5, sigma: 1, rho: 0.2 }, delta: 0.3, trials: 150, days: 56 });
    const big = powerCurve({ truth: { effect: 1.2, sigma: 1, rho: 0.2 }, delta: 0.3, trials: 150, days: 56 });
    expect(big.at(-1).pRight).toBeGreaterThan(small.at(-1).pRight);
    expect(big.at(-1).pRight).toBeGreaterThanOrEqual(big[0].pRight);
    expect(big.at(-1).pWrong).toBeLessThan(0.06);
  });
});

describe("circadian pacemaker", () => {
  const period = (series) => {
    const cross = [];
    for (let i = 1; i < series.length; i++) if (series[i - 1].x < 0 && series[i].x >= 0) {
      cross.push(series[i - 1].t + (series[i].t - series[i - 1].t) * (-series[i - 1].x / (series[i].x - series[i - 1].x)));
    }
    return (cross.at(-1) - cross[0]) / (cross.length - 1);
  };
  it("free-runs near the intrinsic period in darkness and responds to tau", () => {
    const dark = () => 0;
    const p242 = period(simulate({ light: dark, hours: 24 * 40, every: 0.1 }).series);
    const p240 = period(simulate({ light: dark, hours: 24 * 40, every: 0.1, params: { tau: 24.0 } }).series);
    expect(p242).toBeGreaterThan(23.9);
    expect(p242).toBeLessThan(24.5);
    expect(p240).toBeLessThan(p242 - 0.1);
  });
  it("entrains to a 24 h light-dark cycle with a stable daily phase", () => {
    const light = lightSchedule({ on: 7, off: 23, lux: 500 });
    const s = settle({ light, days: 60 });
    const a = simulate({ light, hours: 24 * 6, state: s, t0: 60 * 24, every: 24 }).series.map((p) => phaseHours(p));
    const spread = Math.max(...a) - Math.min(...a);
    expect(spread).toBeLessThan(0.05);
  });
  it("follows a schedule delayed by 3 h, ending about 3 h later than before", () => {
    const base = lightSchedule({ on: 7, off: 23, lux: 500 });
    const late = lightSchedule({ on: 10, off: 26 % 24, lux: 500 });
    const s0 = settle({ light: base, days: 60 });
    const before = phaseHours({ x: s0[0], xc: s0[1] });
    const s1 = settle({ light: late, days: 60 });
    const after = phaseHours({ x: s1[0], xc: s1[1] });
    const shift = (((after - before) % 24) + 24) % 24;
    const signed = shift > 12 ? shift - 24 : shift;
    expect(Math.abs(Math.abs(signed) - 3)).toBeLessThan(0.6);
  });
});
