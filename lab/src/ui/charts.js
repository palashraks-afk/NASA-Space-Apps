// Small hand-built SVG charts for the inspector. They return strings and are written into a
// dedicated container element, so updating a chart never rebuilds the surrounding controls.

const fmt = (v) => (Math.abs(v) >= 100 ? v.toFixed(0) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2));

// values: full series; upTo: index of "today"; band: usual range {lo, hi}; preflight: number of
// pre-flight points at the start (shaded); window: how many recent points to show.
export function spark(values, { upTo, band, preflight = 0, window = 60, color = "#9cc4ff", expected = false } = {}) {
  const W = 400, H = 46, P = 3;
  const start = Math.max(0, upTo - window + 1);
  const pts = values.slice(start, upTo + 1);
  if (pts.length < 2) return `<svg viewBox="0 0 ${W} ${H}"></svg>`;
  let lo = Math.min(...pts), hi = Math.max(...pts);
  if (band) { lo = Math.min(lo, band.lo); hi = Math.max(hi, band.hi); }
  const span = hi - lo || 1;
  const X = (i) => P + (i / (pts.length - 1)) * (W - 2 * P);
  const Y = (v) => H - P - ((v - lo) / span) * (H - 2 * P);
  let s = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="last ${pts.length} days">`;
  if (band) s += `<rect x="0" y="${Y(band.hi)}" width="${W}" height="${Math.max(1, Y(band.lo) - Y(band.hi))}" fill="#7fd1b9" opacity="0.10"/>`;
  const preEnd = preflight - start;
  if (preEnd > 0) s += `<rect x="0" y="0" width="${X(Math.min(preEnd, pts.length - 1))}" height="${H}" fill="#ffffff" opacity="0.035"/>`;
  s += `<polyline fill="none" stroke="${color}" stroke-width="1.8" vector-effect="non-scaling-stroke" points="${pts.map((v, i) => `${X(i)},${Y(v)}`).join(" ")}"/>`;
  const last = pts[pts.length - 1];
  const out = band && (last < band.lo || last > band.hi);
  s += `<circle cx="${X(pts.length - 1)}" cy="${Y(last)}" r="3.2" fill="${out ? (expected ? "#6fa8f5" : "#e0b25a") : color}"/>`;
  return s + `</svg>`;
}

// Line chart with horizontal reference lines (e.g. CO2 limits).
export function lineWithRefs(values, { upTo, window = 90, refs = [], unit = "", color = "#9cc4ff", minY = null } = {}) {
  const W = 400, H = 150, L = 34, R = 6, T = 8, B = 20;
  const start = Math.max(0, upTo - window + 1);
  const pts = values.slice(start, upTo + 1);
  if (pts.length < 2) return `<svg viewBox="0 0 ${W} ${H}"></svg>`;
  let lo = Math.min(...pts, ...refs.map((r) => r.y)), hi = Math.max(...pts, ...refs.map((r) => r.y));
  if (minY !== null) lo = Math.min(lo, minY);
  lo -= (hi - lo) * 0.08; hi += (hi - lo) * 0.08;
  const X = (i) => L + (i / (pts.length - 1)) * (W - L - R);
  const Y = (v) => H - B - ((v - lo) / (hi - lo)) * (H - T - B);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img">`;
  for (const t of [lo + (hi - lo) * 0.1, (lo + hi) / 2, hi - (hi - lo) * 0.1]) {
    s += `<line x1="${L}" x2="${W - R}" y1="${Y(t)}" y2="${Y(t)}" stroke="#262e38"/><text x="${L - 4}" y="${Y(t) + 4}" font-size="10" fill="#66727f" text-anchor="end">${fmt(t)}</text>`;
  }
  for (const r of refs) {
    s += `<line x1="${L}" x2="${W - R}" y1="${Y(r.y)}" y2="${Y(r.y)}" stroke="${r.color}" stroke-dasharray="4 3"/><text x="${L + 4}" y="${Y(r.y) - 3}" font-size="10" fill="${r.color}">${r.label}</text>`;
  }
  s += `<polyline fill="none" stroke="${color}" stroke-width="2" points="${pts.map((v, i) => `${X(i)},${Y(v)}`).join(" ")}"/>`;
  s += `<text x="${L}" y="${H - 4}" font-size="10" fill="#66727f">${pts.length} days</text><text x="${W - R}" y="${H - 4}" font-size="10" fill="#66727f" text-anchor="end">today ${unit}</text>`;
  return s + `</svg>`;
}

// Blood draws: a few values at uneven times, shown evenly spaced. Pre-flight draws sit on a
// light background; the dashed line marks launch. ref: lab range [lo, hi] (either may be
// null); own: this person's pre-flight [min, max].
export function draws(values, labels, { ref = null, own = null, nPre = 3, color = "#9cc4ff", flag = [] } = {}) {
  const W = 400, H = 70, L = 6, R = 6, T = 8, B = 16;
  const pts = values.map((v, i) => [i, v]).filter(([, v]) => v != null);
  if (pts.length < 2) return `<svg viewBox="0 0 ${W} ${H}"></svg>`;
  let lo = Math.min(...pts.map((p) => p[1])), hi = Math.max(...pts.map((p) => p[1]));
  if (own) { lo = Math.min(lo, own[0]); hi = Math.max(hi, own[1]); }
  const pad = (hi - lo || Math.abs(hi) * 0.1 || 1) * 0.25;
  lo -= pad; hi += pad;
  const X = (i) => L + ((i + 0.5) / values.length) * (W - L - R);
  const Y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const clampY = (v) => Math.min(H - B, Math.max(T, Y(v)));
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img">`;
  s += `<rect x="${L}" y="${T}" width="${X(nPre - 0.5) - L}" height="${H - T - B}" fill="#ffffff" opacity="0.035"/>`;
  if (ref) {
    const top = ref[1] != null ? clampY(ref[1]) : T, bot = ref[0] != null ? clampY(ref[0]) : H - B;
    if (bot - top > 0) s += `<rect x="${L}" y="${top}" width="${W - L - R}" height="${bot - top}" fill="#7fd1b9" opacity="0.07"/>`;
  }
  if (own) s += `<rect x="${L}" y="${Y(own[1])}" width="${W - L - R}" height="${Math.max(1.5, Y(own[0]) - Y(own[1]))}" fill="${color}" opacity="0.16"/>`;
  s += `<line x1="${X(nPre - 0.5)}" x2="${X(nPre - 0.5)}" y1="${T}" y2="${H - B}" stroke="#93a1b0" stroke-dasharray="3 3" opacity="0.6"/>`;
  s += `<polyline fill="none" stroke="${color}" stroke-width="1.5" opacity="0.6" points="${pts.map(([i, v]) => `${X(i)},${Y(v)}`).join(" ")}"/>`;
  for (const [i, v] of pts) s += `<circle cx="${X(i)}" cy="${Y(v)}" r="3.6" fill="${flag.includes(i) ? "#e0b25a" : color}"/>`;
  labels.forEach((l, i) => { s += `<text x="${X(i)}" y="${H - 3}" font-size="10" fill="#66727f" text-anchor="middle">${l}</text>`; });
  return s + `</svg>`;
}

// Daily values as bars with an optional highlighted bar (today).
export function bars(values, { upTo, window = 60, color = "#6fa8f5", unit = "" } = {}) {
  const W = 400, H = 110, L = 34, R = 6, T = 8, B = 18;
  const start = Math.max(0, upTo - window + 1);
  const pts = values.slice(start, upTo + 1);
  if (!pts.length) return `<svg viewBox="0 0 ${W} ${H}"></svg>`;
  const hi = Math.max(...pts) * 1.1, bw = (W - L - R) / window;
  const Y = (v) => H - B - (v / hi) * (H - T - B);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img">`;
  for (const t of [hi / 2, hi * 0.9]) s += `<line x1="${L}" x2="${W - R}" y1="${Y(t)}" y2="${Y(t)}" stroke="#262e38"/><text x="${L - 4}" y="${Y(t) + 4}" font-size="10" fill="#66727f" text-anchor="end">${Math.round(t)}</text>`;
  pts.forEach((v, i) => { s += `<rect x="${L + i * bw + 0.5}" y="${Y(v)}" width="${Math.max(1, bw - 1)}" height="${H - B - Y(v)}" fill="${color}" opacity="${i === pts.length - 1 ? 1 : 0.55}"/>`; });
  s += `<text x="${L}" y="${H - 4}" font-size="10" fill="#66727f">${pts.length} days</text><text x="${W - R}" y="${H - 4}" font-size="10" fill="#66727f" text-anchor="end">today ${unit}</text>`;
  return s + `</svg>`;
}
