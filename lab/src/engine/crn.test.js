import { describe, expect, it } from "vitest";
import { mulberry32, normal, gamma } from "./rng.js";
import { fit, makeDesign, makePrior, simulateOutcomes, verdict } from "./trial.js";
import { crnDraws, gammaP, gammaQuantile, normCdf } from "./crn.js";

describe("special functions", () => {
  it("gamma quantile inverts the regularised gamma CDF", () => {
    for (const a of [0.6, 1, 2.5, 5, 30, 200]) for (const u of [0.01, 0.2, 0.5, 0.9, 0.995]) expect(gammaP(a, gammaQuantile(a, u))).toBeCloseTo(u, 9);
  });
  it("matches known values", () => {
    expect(gammaP(1, 1)).toBeCloseTo(1 - Math.exp(-1), 12); // exponential
    expect(normCdf(1.959964)).toBeCloseTo(0.975, 6);
  });
  it("gamma quantiles agree with a Marsaglia-Tsang sample", () => {
    const rng = mulberry32(9), a = 2.5, n = 40000;
    const xs = Array.from({ length: n }, () => gamma(a, rng)).sort((x, y) => x - y);
    for (const u of [0.1, 0.5, 0.9]) expect(Math.abs(xs[Math.floor(u * n)] - gammaQuantile(a, u)) / gammaQuantile(a, u)).toBeLessThan(0.03);
  });
});

// The chamber must show the same answer as the verdict text: the share of motes in the
// "works" region equals the posterior P(effect >= delta), within Monte Carlo error.
describe("evidence chamber motes", () => {
  const crn = mulberry32(2026);
  const Z = Array.from({ length: 1600 }, () => [normal(crn), normal(crn), normal(crn), normal(crn), crn()]);
  const truth = { effect: 0.4, response: 0.6, drift: 0.1, sigma: 1, rho: 0.3, b0: 3 };
  for (const days of [10, 21, 56]) {
    it(`match the posterior after ${days} days`, () => {
      for (let k = 0; k < 6; k++) {
        const rng = mulberry32(300 + k * 7 + days);
        const d = makeDesign({ days: 56, rng });
        const y = simulateOutcomes(d, truth, rng);
        const post = fit(d, y, { prior: makePrior(1), upTo: days });
        const delta = 0.3, v = verdict(post, { delta });
        const draws = crnDraws(post, Z);
        const share = draws.filter((x) => x.effect >= delta).length / draws.length;
        const se = Math.sqrt(Math.max(v.pWork * (1 - v.pWork), 0.01) / draws.length);
        expect(Math.abs(share - v.pWork)).toBeLessThan(4 * se + 0.005);
      }
    });
  }
});
