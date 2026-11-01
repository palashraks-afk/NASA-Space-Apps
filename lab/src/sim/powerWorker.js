import { powerCurve } from "../engine/power.js";

// Runs the Monte Carlo power preview off the main thread so the 3D scene keeps its frame rate.
self.onmessage = (e) => {
  const { id, outcome, design, delta, thr, days } = e.data;
  const base = { sigma: outcome.sd, rho: outcome.rho, response: design.response };
  const opts = { days, blockLen: design.blockLen, washout: design.washout, delta, thr, trials: 220, checkpoints: [14, 21, 28, 35, 42, 49, 56].filter((d) => d <= days) };
  const worth = powerCurve({ ...opts, truth: { ...base, effect: delta * 1.5 }, seed: 3 });
  const big = powerCurve({ ...opts, truth: { ...base, effect: delta * 3 }, seed: 4 });
  const none = powerCurve({ ...opts, truth: { ...base, effect: 0 }, seed: 5 });
  self.postMessage({ id, worth, big, none });
};
