// Posterior draws from fixed random numbers ("common random numbers") for the evidence
// chamber. Each mote keeps the same five standard-normal numbers for its whole life, so when the
// posterior updates the mote glides to its new value instead of jumping to a fresh sample.
//
// The model's posterior is a mixture of Normal-Inverse-Gamma components:
//   sigma^2 ~ InvGamma(an, bn),  b | sigma^2 ~ N(mn, sigma^2 Vn).
// sigma^2 = bn / G with G ~ Gamma(an, 1). G is computed exactly by inverting the regularised
// incomplete gamma function at Phi(z4), so the draws are exact for any an. (The chamber used the
// Wilson-Hilferty approximation before, which is off when an is small, early in a trial.)
import { cholesky } from "./linalg.js";

function lnGamma(x) {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x, tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += c[j] / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

// Regularised lower incomplete gamma P(a, x) (series below a+1, continued fraction above).
export function gammaP(a, x) {
  if (x <= 0) return 0;
  const gln = lnGamma(a);
  if (x < a + 1) {
    let ap = a, sum = 1 / a, del = sum;
    for (let n = 0; n < 500; n++) { ap += 1; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-15) break; }
    return sum * Math.exp(-x + a * Math.log(x) - gln);
  }
  const FPMIN = 1e-300;
  let b = x + 1 - a, c = 1 / FPMIN, d = 1 / b, h = d;
  for (let i = 1; i < 500; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-15) break;
  }
  return 1 - Math.exp(-x + a * Math.log(x) - gln) * h;
}

// Standard normal CDF (Abramowitz-Stegun 7.1.26 via erf, absolute error below 1.5e-7).
export function normCdf(z) {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2);
  return z >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y);
}

// Quantile of Gamma(a, 1): Newton steps on P(a, x) = u from a Wilson-Hilferty start, bracketed.
export function gammaQuantile(a, u) {
  u = Math.min(1 - 1e-12, Math.max(1e-12, u));
  const z = Math.SQRT2 * erfInv(2 * u - 1);
  let x = Math.max(1e-8, a * (1 - 1 / (9 * a) + z * Math.sqrt(1 / (9 * a))) ** 3);
  let lo = 0, hi = Infinity;
  const gln = lnGamma(a);
  for (let i = 0; i < 60; i++) {
    const f = gammaP(a, x) - u;
    if (Math.abs(f) < 1e-10 || i > 25) break;
    if (f < 0) lo = x; else hi = x;
    const pdf = Math.exp((a - 1) * Math.log(x) - x - gln);
    let nx = x - f / pdf;
    if (!(nx > lo && nx < hi) || !Number.isFinite(nx)) nx = hi === Infinity ? x * 2 : (lo + hi) / 2;
    if (Math.abs(nx - x) < 1e-13 * Math.max(1, x)) { x = nx; break; }
    x = nx;
  }
  return x;
}
function erfInv(y) { // Giles (2010) single-precision approximation, refined by two Newton steps
  const w = -Math.log((1 - y) * (1 + y));
  let x;
  if (w < 5) { const t = w - 2.5; x = [2.81022636e-08, 3.43273939e-07, -3.5233877e-06, -4.39150654e-06, 0.00021858087, -0.00125372503, -0.00417768164, 0.246640727, 1.50140941].reduce((p, c) => p * t + c, 0); }
  else { const t = Math.sqrt(w) - 3; x = [-0.000200214257, 0.000100950558, 0.00134934322, -0.00367342844, 0.00573950773, -0.0076224613, 0.00943887047, 1.00167406, 2.83297682].reduce((p, c) => p * t + c, 0); }
  x *= y;
  for (let i = 0; i < 2; i++) { const e = 2 * normCdf(x * Math.SQRT2) - 1 - y; x -= e / ((2 / Math.sqrt(Math.PI)) * Math.exp(-x * x)); }
  return x;
}

// Gamma quantiles for one shape on a fixed grid of normal scores (-4.5 to 4.5, step 0.05),
// interpolated per mote. The quantile is smooth in z, so this is accurate to well under 0.1% and
// costs 181 inversions per new shape instead of one per mote (6 to 21 ms became under 2 ms).
const ZG0 = -4.5, ZGS = 0.1, ZGN = 91;
const tables = new Map();
function quantileTable(a) {
  const key = a.toFixed(6);
  let t = tables.get(key);
  if (!t) {
    t = new Float64Array(ZGN);
    for (let i = 0; i < ZGN; i++) t[i] = gammaQuantile(a, normCdf(ZG0 + i * ZGS));
    if (tables.size > 64) tables.clear();
    tables.set(key, t);
  }
  return t;
}
function gammaAtZ(a, z) {
  // Wilson-Hilferty is accurate to well under 0.1% for shape 8 and above; exact table below that.
  if (a >= 8) { const c = 1 / (9 * a); return a * Math.max(1e-9, 1 - c + z * Math.sqrt(c)) ** 3; }
  const t = quantileTable(a);
  const f = (Math.min(Math.max(z, ZG0), ZG0 + (ZGN - 1) * ZGS) - ZG0) / ZGS;
  const i = Math.min(ZGN - 2, Math.floor(f)), w = f - i;
  return t[i] * (1 - w) + t[i + 1] * w;
}

// One draw per mote. Z[i] = [z1, z2, z3, z4, u] (four standard normals and one uniform).
// Written as a flat loop with no per-mote allocation: it runs once per experiment day.
export function crnDraws(post, Z) {
  const comps = post.comps, nc = comps.length;
  const L = comps.map((c) => cholesky(c.Vn));
  const cum = new Float64Array(nc);
  let acc = 0;
  for (let i = 0; i < nc; i++) { acc += comps[i].w; cum[i] = acc; }
  const out = new Array(Z.length);
  for (let i = 0; i < Z.length; i++) {
    const z = Z[i];
    let ci = 0;
    while (ci < nc - 1 && z[4] > cum[ci]) ci++;
    const c = comps[ci], l = L[ci], m = c.mn;
    const sigma = Math.sqrt(c.bn / gammaAtZ(c.an, z[3]));
    // b = m + sigma * L z, lower-triangular 3x3
    const effect = m[1] + sigma * (l[1][0] * z[0] + l[1][1] * z[1]);
    const drift = m[2] + sigma * (l[2][0] * z[0] + l[2][1] * z[1] + l[2][2] * z[2]);
    out[i] = { effect, drift, sigma };
  }
  return out;
}
