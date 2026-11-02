// Plain 2D view of everything the 3D world shows: data, evidence over time, and the power
// preview. SVG built by hand so it works offline and stays readable in screenshots.

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function frame(w, h, pad) {
  return { w, h, pad, x0: pad.l, x1: w - pad.r, y0: h - pad.b, y1: pad.t };
}

function axis(f, xs, ys, xLab, yLab) {
  let s = `<line x1="${f.x0}" y1="${f.y0}" x2="${f.x1}" y2="${f.y0}" stroke="#3a4552"/>`;
  s += `<line x1="${f.x0}" y1="${f.y0}" x2="${f.x0}" y2="${f.y1}" stroke="#3a4552"/>`;
  for (const [v, px] of xs) s += `<text x="${px}" y="${f.y0 + 15}" font-size="11" text-anchor="middle" fill="#93a1b0">${esc(v)}</text>`;
  for (const [v, py] of ys) s += `<text x="${f.x0 - 6}" y="${py + 4}" font-size="11" text-anchor="end" fill="#93a1b0">${esc(v)}</text><line x1="${f.x0}" x2="${f.x1}" y1="${py}" y2="${py}" stroke="#262e38"/>`;
  s += `<text x="${(f.x0 + f.x1) / 2}" y="${f.h - 2}" font-size="11" text-anchor="middle" fill="#93a1b0">${esc(xLab)}</text>`;
  s += `<text x="11" y="${(f.y0 + f.y1) / 2}" font-size="11" text-anchor="middle" fill="#93a1b0" transform="rotate(-90 12 ${(f.y0 + f.y1) / 2})">${esc(yLab)}</text>`;
  return s;
}

export function powerChart(power, days) {
  if (!power) return `<p>Working out the odds for this design.</p>`;
  const f = frame(380, 190, { l: 60, r: 12, t: 12, b: 34 });
  const X = (d) => f.x0 + ((d - 14) / (days - 14)) * (f.x1 - f.x0);
  const Y = (p) => f.y0 - p * (f.y0 - f.y1);
  const line = (curve, key, color, dash = "") => `<polyline fill="none" stroke="${color}" stroke-width="2.5" ${dash} points="${curve.map((c) => `${X(c.day)},${Y(c[key])}`).join(" ")}"/>`;
  let s = `<svg viewBox="0 0 ${f.w} ${f.h}" role="img" aria-label="Chance of a clear answer by day">`;
  s += axis(f, [14, 28, 42, 56].filter((d) => d <= days).map((d) => [d, X(d)]), [0, 0.5, 1].map((p) => [`${p * 100}%`, Y(p)]), "mission day", "chance");
  s += line(power.big, "pRight", "#9cc4ff");
  s += line(power.worth, "pRight", "#6fa8f5");
  s += line(power.none, "pWrong", "#d6342a", 'stroke-dasharray="5 4"');
  s += `</svg>`;
  const last = (c, k) => Math.round(c.at(-1)[k] * 100);
  return s + `<p><b style="color:#9cc4ff">Dark blue:</b> chance of a clear "it works" if the real change is 3 times the smallest worthwhile change (${last(power.big, "pRight")}% by the end). <b style="color:#6fa8f5">Light blue:</b> if it is 1.5 times (${last(power.worth, "pRight")}%). <b style="color:#d6342a">Red dashed:</b> chance of a wrong "it works" or "it backfires" when there is no real change (${last(power.none, "pWrong")}%).</p>`;
}

export function dataChart(mission, day, outcome) {
  if (!mission) return `<p>No data yet. Randomize and lock a plan, then run the mission.</p>`;
  const n = Math.max(1, Math.min(day, mission.days));
  const vals = mission.values.slice(0, n);
  const lo = Math.max(outcome.min ?? -Infinity, Math.min(...mission.values) - outcome.sd * 0.2), hi = Math.min(outcome.max ?? Infinity, Math.max(...mission.values) + outcome.sd * 0.2);
  const f = frame(380, 170, { l: 62, r: 12, t: 10, b: 34 });
  const X = (d) => f.x0 + (d / (mission.days - 1)) * (f.x1 - f.x0);
  const Y = (v) => f.y0 - ((v - lo) / (hi - lo)) * (f.y0 - f.y1);
  let s = `<svg viewBox="0 0 ${f.w} ${f.h}" role="img" aria-label="Daily values">`;
  const ticks = [lo, (lo + hi) / 2, hi].map((v) => [outcome.fmt(v), Y(v)]);
  s += axis(f, [0, 13, 27, 41, 55].filter((d) => d < mission.days).map((d) => [d + 1, X(d)]), ticks, "mission day", outcome.label.toLowerCase());
  vals.forEach((v, d) => {
    const sch = mission.schedule[d];
    const fill = sch.washout ? "none" : sch.arm ? "#6fa8f5" : "#66727f";
    s += `<circle cx="${X(d)}" cy="${Y(v)}" r="3.6" fill="${fill}" stroke="${sch.arm ? "#6fa8f5" : "#66727f"}" stroke-width="1.2"/>`;
  });
  return s + `</svg><p>Blue dots: days with the change. Grey: usual days. Hollow: settling days that do not count.</p>`;
}

export function effectChart(history, delta, outcome, days) {
  const pts = history.filter((h) => h.ci);
  if (pts.length < 2) return `<p>The estimate appears once a few days are logged.</p>`;
  const span = Math.max(3 * delta, ...pts.map((p) => Math.max(Math.abs(p.ci[0]), Math.abs(p.ci[1]))));
  const f = frame(380, 180, { l: 66, r: 12, t: 10, b: 34 });
  const X = (d) => f.x0 + ((d - 1) / (days - 1)) * (f.x1 - f.x0);
  const Y = (v) => f.y0 - ((v + span) / (2 * span)) * (f.y0 - f.y1);
  let s = `<svg viewBox="0 0 ${f.w} ${f.h}" role="img" aria-label="Estimated effect over time">`;
  s += axis(f, [1, 14, 28, 42, 56].filter((d) => d <= days).map((d) => [d, X(d)]), [[`-${outcome.fmtDelta(span)}`, Y(-span)], ["0", Y(0)], [`+${outcome.fmtDelta(span)}`, Y(span)]], "mission day", "change (better is up)");
  s += `<rect x="${f.x0}" y="${Y(delta)}" width="${f.x1 - f.x0}" height="${Y(-delta) - Y(delta)}" fill="#93a1b0" opacity="0.15"/>`;
  s += `<polygon fill="#6fa8f5" opacity="0.3" points="${pts.map((p) => `${X(p.day)},${Y(p.ci[1])}`).join(" ")} ${pts.slice().reverse().map((p) => `${X(p.day)},${Y(p.ci[0])}`).join(" ")}"/>`;
  s += `<polyline fill="none" stroke="#9cc4ff" stroke-width="2.2" points="${pts.map((p) => `${X(p.day)},${Y(p.mean)}`).join(" ")}"/>`;
  return s + `</svg><p>Line: best estimate of the change. Blue band: 95% credible range. Grey band: too small to matter (under ${outcome.fmtDelta(delta)}).</p>`;
}

export function renderNumbers(el, S, outcome) {
  el.innerHTML = `
    <h3>Will this design give a clear answer?</h3>
    ${powerChart(S.power, S.days)}
    <h3>What you logged</h3>
    ${dataChart(S.mission, S.day, outcome)}
    <h3>How the estimate settles</h3>
    ${effectChart(S.history, S.delta, outcome, S.days)}
    <p class="src">Day-to-day spread for "${outcome.label.toLowerCase()}" (${outcome.fmtDelta(outcome.sd)} SD, autocorrelation ${outcome.rho.toFixed(2)}) is the median across ${outcome.people} people in an open wearable and sleep-diary dataset (Baigutanova et al. 2025, CC BY). ${S.mission && S.mission.real ? "In this mission the daily values are one real person's 28-day sleep diary from that dataset, with the hidden change added on change days." : "In a mission, each simulated person is one of those real people: their own typical level, with each day drawn from their own logged ups and downs (wearable measures use a Gaussian model with the same spread)."} Nothing here is medical advice.</p>`;
}
