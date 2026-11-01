// Single-person crossover experiment: design, simulation, Bayesian analysis, verdicts.
//
// Model for day t that is analysed (washout days dropped):
//   y_t = b0 + effect * arm_t + drift * (t / 7) + e_t,  e_t AR(1) with variance sigma^2
// drift is a per-week linear trend (adaptation, learning, mission fatigue). Carryover from
// the previous day is removed by the washout days, not modelled: with washout days dropped,
// "previous arm" equals "today's arm" on every analysed day, so it cannot be estimated.
// Conjugate Normal-Inverse-Gamma posterior after exact AR(1) pre-whitening at an
// estimated rho. The posterior is exact for this Gaussian model; it is only as good as the
// model (a linear effect and linear drift with AR(1) noise).

import { normal, gamma } from "./rng.js";
import { cholesky, diag, inverse, matMul } from "./linalg.js";

// ---------- special functions (Student t) ----------
function lnGamma(x) {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x, tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += c[j] / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}
function betacf(a, b, x) {
  const FPMIN = 1e-300;
  let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 300; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 3e-15) break;
  }
  return h;
}
function betai(a, b, x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
}
export function tCdf(t, df) {
  const x = df / (df + t * t);
  const p = 0.5 * betai(df / 2, 0.5, x);
  return t > 0 ? 1 - p : p;
}
export function tQuantile(p, df) {
  let lo = -50, hi = 50;
  for (let i = 0; i < 90; i++) {
    const mid = (lo + hi) / 2;
    if (tCdf(mid, df) < p) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

// ---------- design ----------
// Randomized crossover: blocks of blockLen days, each consecutive pair of blocks holds
// one A block and one B block in random order. The first `washout` days after a switch
// are excluded from analysis.
export function makeDesign({ days, blockLen = 7, washout = 2, rng }) {
  const rows = [];
  let prevArm = null;
  while (rows.length < days) {
    const order = rng() < 0.5 ? [0, 1] : [1, 0];
    for (const arm of order) {
      for (let k = 0; k < blockLen && rows.length < days; k++) {
        rows.push({ day: rows.length, arm, washout: prevArm !== null && prevArm !== arm && k < washout });
      }
      prevArm = arm;
    }
  }
  return rows;
}

// truth.response in (0, 1]: how fast the body catches up to a new arm. 1 means instantly;
// 0.5 means half the gap closes each day, so the first days after a switch carry over the
// old arm. Washout days exist to cover exactly that.
export function simulateOutcomes(design, truth, rng) {
  const { b0 = 0, effect, response = 1, drift = 0, sigma = 1, rho = 0 } = truth;
  const y = [];
  let e = sigma * normal(rng);
  let exposure = design[0].arm;
  for (let t = 0; t < design.length; t++) {
    if (t > 0) e = rho * e + sigma * Math.sqrt(1 - rho * rho) * normal(rng);
    exposure += response * (design[t].arm - exposure);
    y.push(b0 + effect * exposure + drift * (t / 7) + e);
  }
  return y;
}

// ---------- analysis ----------
const rowsFor = (design, y, upTo) => {
  const out = [];
  for (let t = 0; t < Math.min(upTo ?? design.length, design.length); t++) {
    if (design[t].washout) continue;
    out.push({ t, x: [1, design[t].arm, t / 7], y: y[t] });
  }
  return out;
};

function conjugate(X, Y, prior) {
  const p = 3;
  const V0inv = inverse(prior.V0);
  const XtX = matMul(X[0].map((_, j) => X.map((r) => r[j])), X);
  const VnInv = V0inv.map((r, i) => r.map((v, j) => v + XtX[i][j]));
  const Vn = inverse(VnInv);
  const XtY = X[0].map((_, j) => X.reduce((s, r, i) => s + r[j] * Y[i], 0));
  const rhs = V0inv.map((r, i) => r.reduce((s, v, j) => s + v * prior.m0[j], 0) + XtY[i]);
  const mn = Vn.map((r) => r.reduce((s, v, j) => s + v * rhs[j], 0));
  const yy = Y.reduce((s, v) => s + v * v, 0);
  const m0V = prior.m0.reduce((s, m, i) => s + m * V0inv[i].reduce((q, v, j) => q + v * prior.m0[j], 0), 0);
  const mnV = mn.reduce((s, m, i) => s + m * VnInv[i].reduce((q, v, j) => q + v * mn[j], 0), 0);
  return { mn, Vn, an: prior.a0 + Y.length / 2, bn: prior.b0 + 0.5 * (yy + m0V - mnV), n: Y.length, p };
}

export function makePrior(spread) {
  // spread: your guess of the typical day-to-day spread of the outcome (its SD)
  const s = spread;
  return { m0: [0, 0, 0], V0: diag([100, 1, 0.09]), a0: 2, b0: s * s };
}

const logDet = (A) => 2 * cholesky(A).reduce((s, r, i) => s + Math.log(r[i]), 0);

// rho = a number fixes the autocorrelation. rho = "auto" integrates over it: the posterior
// is a mixture over a grid of rho values, each weighted by its marginal likelihood, so the
// intervals carry the uncertainty about rho instead of treating an estimate as known.
const RHO_GRID = Array.from({ length: 25 }, (_, i) => -0.3 + (1.2 * i) / 24);

export function fit(design, y, { prior, rho = "auto", upTo } = {}) {
  const rows = rowsFor(design, y, upTo);
  if (rows.length < 5) return null;
  const runs = rows.reduce((c, row, i) => c + (i > 0 && rows[i - 1].t === row.t - 1 ? 0 : 1), 0);
  const build = (r) => {
    const X = [], Y = [];
    rows.forEach((row, i) => {
      const consecutive = i > 0 && rows[i - 1].t === row.t - 1;
      if (consecutive) {
        const q = rows[i - 1];
        X.push(row.x.map((v, j) => v - r * q.x[j]));
        Y.push(row.y - r * q.y);
      } else {
        const sc = Math.sqrt(1 - r * r);
        X.push(row.x.map((v) => sc * v));
        Y.push(sc * row.y);
      }
    });
    return { X, Y };
  };
  const logV0 = logDet(prior.V0);
  const one = (r) => {
    const { X, Y } = build(r);
    const post = conjugate(X, Y, prior);
    const logML = -0.5 * Y.length * Math.log(2 * Math.PI) + 0.5 * (logDet(post.Vn) - logV0)
      + prior.a0 * Math.log(prior.b0) - post.an * Math.log(post.bn) + lnGamma(post.an) - lnGamma(prior.a0)
      + 0.5 * runs * Math.log(1 - r * r);
    return { ...post, rho: r, logML };
  };
  const grid = typeof rho === "number" ? [rho] : RHO_GRID;
  const comps = grid.map(one);
  const top = Math.max(...comps.map((c) => c.logML));
  const raw = comps.map((c) => Math.exp(c.logML - top));
  const tot = raw.reduce((a, b) => a + b, 0);
  comps.forEach((c, i) => (c.w = raw[i] / tot));
  return { comps, n: comps[0].n, rho: comps.reduce((a, c) => a + c.w * c.rho, 0) };
}

const effectCdf = (post, v) => post.comps.reduce((acc, c) => {
  const scale = Math.sqrt((c.bn / c.an) * c.Vn[1][1]);
  return acc + c.w * tCdf((v - c.mn[1]) / scale, 2 * c.an);
}, 0);

export function effectMean(post) {
  return post.comps.reduce((a, c) => a + c.w * c.mn[1], 0);
}

export function credibleInterval(post, level = 0.95) {
  const find = (p) => {
    let lo = -50, hi = 50;
    for (let i = 0; i < 80; i++) {
      const mid = (lo + hi) / 2;
      if (effectCdf(post, mid) < p) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  };
  return [find((1 - level) / 2), find(1 - (1 - level) / 2)];
}

// Pre-registered rule: delta is the smallest effect worth acting on; thr is the posterior
// probability needed to call it. Both are fixed before the first data point.
export function verdict(post, { delta, thr = 0.95 }) {
  const pWork = 1 - effectCdf(post, delta);
  const pHarm = effectCdf(post, -delta);
  const pNone = effectCdf(post, delta) - effectCdf(post, -delta);
  const label = pWork >= thr ? "works" : pHarm >= thr ? "harms" : pNone >= thr ? "none" : "inconclusive";
  return { pWork, pNone, pHarm, label };
}

export function sampleDraws(post, k, rng) {
  const chol = post.comps.map((c) => cholesky(c.Vn));
  const out = [];
  for (let i = 0; i < k; i++) {
    let u = rng(), ci = 0;
    while (ci < post.comps.length - 1 && u > post.comps[ci].w) { u -= post.comps[ci].w; ci++; }
    const c = post.comps[ci], L = chol[ci];
    const sd = Math.sqrt(c.bn / gamma(c.an, rng));
    const z = [normal(rng), normal(rng), normal(rng)];
    const b = c.mn.map((m, r) => m + sd * L[r].reduce((s, l, q) => s + l * z[q], 0));
    out.push({ effect: b[1], drift: b[2], sigma: sd, rho: c.rho });
  }
  return out;
}

export const trueLabel = (effect, delta) => (effect >= delta ? "works" : effect <= -delta ? "harms" : Math.abs(effect) < delta ? "none" : "inconclusive");
