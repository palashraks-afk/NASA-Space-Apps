import { mulberry32 } from "./rng.js";
import { fit, makeDesign, makePrior, simulateOutcomes, trueLabel, verdict } from "./trial.js";

// How likely is a design to reach the right verdict by each checkpoint day?
// Everything (effect size, spread, smallest worthwhile effect, thresholds) is in
// units of the outcome's day-to-day spread so the answer does not depend on the unit.
export function powerCurve({ truth, days = 56, blockLen = 7, washout = 2, delta, thr = 0.95, trials = 300, seed = 1, checkpoints }) {
  const cps = checkpoints ?? Array.from({ length: Math.floor(days / 7) - 1 }, (_, i) => 14 + 7 * i).filter((d) => d <= days);
  const prior = makePrior(truth.sigma ?? 1);
  const target = trueLabel(truth.effect, delta);
  const tally = cps.map(() => ({ right: 0, wrong: 0, open: 0 }));
  for (let k = 0; k < trials; k++) {
    const rng = mulberry32(seed * 100003 + k);
    const design = makeDesign({ days, blockLen, washout, rng });
    const y = simulateOutcomes(design, truth, rng);
    cps.forEach((d, i) => {
      const post = fit(design, y, { prior, upTo: d });
      const v = post ? verdict(post, { delta, thr }).label : "inconclusive";
      if (v === "inconclusive") tally[i].open++;
      else if (v === target) tally[i].right++;
      else tally[i].wrong++;
    });
  }
  return cps.map((day, i) => ({ day, pRight: tally[i].right / trials, pWrong: tally[i].wrong / trials, pOpen: tally[i].open / trials }));
}
