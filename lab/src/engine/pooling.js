// Crew pooling: each crew member's own estimate is pulled toward the crew average by an
// amount that depends on how much crew members really differ. That between-person spread
// is not plugged in as a single estimate (Study 2: plug-in intervals undercovered, 83-86%);
// it is integrated over a grid with a half-normal prior scaled to the smallest worthwhile
// change, and the crew mean is integrated out under a flat prior (Study 2b: coverage
// 90.9-97.8%, error down 20-45%). See docs/STUDIES_RESULTS.md.

const erf = (x) => {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
};
export const normCdf = (z) => 0.5 * (1 + erf(z / Math.SQRT2));

export function poolCrew(est, se, delta, { gridN = 61, maxMult = 3 } = {}) {
  const grid = Array.from({ length: gridN }, (_, i) => (maxMult * delta * i) / (gridN - 1));
  const comps = grid.map((tau) => {
    const v = se.map((s) => s * s + tau * tau);
    const w = v.map((x) => 1 / x);
    const sw = w.reduce((a, b) => a + b, 0);
    const mu = est.reduce((a, e, i) => a + w[i] * e, 0) / sw;
    const logML = -0.5 * v.reduce((a, x) => a + Math.log(x), 0) - 0.5 * Math.log(sw) - 0.5 * est.reduce((a, e, i) => a + w[i] * (e - mu) ** 2, 0);
    const per = est.map((e, i) => {
      const B = tau === 0 ? 1 : (se[i] * se[i]) / (se[i] * se[i] + tau * tau);
      return { m: B * mu + (1 - B) * e, s: Math.sqrt(Math.max((1 - B) * se[i] * se[i] + (B * B) / sw, 1e-12)) };
    });
    return { lw: logML - 0.5 * (tau / delta) ** 2, per, tau };
  });
  const top = Math.max(...comps.map((c) => c.lw));
  const ws = comps.map((c) => Math.exp(c.lw - top));
  const tot = ws.reduce((a, b) => a + b, 0);
  const tauMean = comps.reduce((a, c, k) => a + (ws[k] / tot) * c.tau, 0);
  return est.map((_, i) => {
    const cdf = (x) => comps.reduce((a, c, k) => a + (ws[k] / tot) * normCdf((x - c.per[i].m) / c.per[i].s), 0);
    const quant = (p) => { let lo = -1e4, hi = 1e4; for (let it = 0; it < 90; it++) { const mid = (lo + hi) / 2; if (cdf(mid) < p) lo = mid; else hi = mid; } return (lo + hi) / 2; };
    const mean = comps.reduce((a, c, k) => a + (ws[k] / tot) * c.per[i].m, 0);
    return { mean, lo: quant(0.025), hi: quant(0.975), cdf, tauMean };
  });
}

// Same verdict rule as the single-person engine, applied to a pooled distribution.
export function pooledVerdict(p, { delta, thr = 0.95 }) {
  const pWork = 1 - p.cdf(delta), pHarm = p.cdf(-delta), pNone = p.cdf(delta) - p.cdf(-delta);
  const label = pWork >= thr ? "works" : pHarm >= thr ? "harms" : pNone >= thr ? "none" : "inconclusive";
  return { pWork, pNone, pHarm, label };
}
