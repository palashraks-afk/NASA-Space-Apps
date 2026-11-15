// Flight-display layer over the 3D view: thin white line work, green readouts, cyan secondary
// values, tiny spaced capitals. Always: corner brackets and a mission-day tape across the top.
// On the overview: a large ticked ring that draws itself in, with the selected crew member's
// vitals on the left, cabin CO2 on the right, mission day on top and today's radiation below.
// Purely visual (pointer-events: none); every value is also in the side panel.
const NS = "http://www.w3.org/2000/svg";

export function createHud({ host }) {
  const root = document.createElement("div");
  root.className = "hud";
  root.setAttribute("aria-hidden", "true");
  host.appendChild(root);
  const svg = document.createElementNS(NS, "svg");
  root.appendChild(svg);
  let w = 0, h = 0, data = null, overview = false;

  const el = (tag, attrs = {}, parent = svg) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    parent.appendChild(e);
    return e;
  };
  const txt = (x, y, cls, anchor = "middle", parent) => { const t = el("text", { x, y, class: cls, "text-anchor": anchor }, parent); return t; };

  let refs = {};
  function build() {
    svg.innerHTML = "";
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.setAttribute("width", w);
    svg.setAttribute("height", h);
    // Corner brackets
    const m = 14, L = 22;
    const corners = el("g", { class: "hud-line hud-corners" });
    for (const [x, y, dx, dy] of [[m, m, 1, 1], [w - m, m, -1, 1], [m, h - m, 1, -1], [w - m, h - m, -1, -1]]) {
      el("path", { d: `M${x},${y + dy * L} L${x},${y} L${x + dx * L},${y}` }, corners);
    }
    // Mission-day tape across the top: a tick per day, labels every 5 days; slides as days pass.
    const tape = el("g", { class: "hud-tape" });
    const clip = el("clipPath", { id: "hudTapeClip" }, el("defs"));
    el("rect", { x: w / 2 - 210, y: 0, width: 420, height: 60 }, clip);
    tape.setAttribute("clip-path", "url(#hudTapeClip)");
    refs.tapeInner = el("g", { class: "hud-tape-inner" }, tape);
    refs.tapeStep = 14;
    el("path", { d: `M${w / 2},24 l-5,-7 h10 z`, class: "hud-fill" });
    // Overview ring
    const g = el("g", { class: "hud-ring" });
    refs.ring = g;
    const cx = w / 2, cy = h / 2, R = Math.max(90, Math.min(w, h) * 0.34);
    g.style.transformOrigin = `${cx}px ${cy}px`;
    const circ = 2 * Math.PI * R;
    el("circle", { cx, cy, r: R, class: "hud-ring-bg" }, g);
    el("circle", { cx, cy, r: R, class: "hud-line hud-draw", style: `stroke-dasharray:${circ};stroke-dashoffset:${circ}` }, g);
    const ticks = el("g", { class: "hud-line hud-ticks" }, g);
    for (let a = 0; a < 360; a += 5) {
      if (a % 90 === 0) continue; // the four readouts sit at the quarter points
      const r0 = R - (a % 30 === 0 ? 12 : 6), rad = (a * Math.PI) / 180;
      el("line", { x1: cx + Math.cos(rad) * r0, y1: cy + Math.sin(rad) * r0, x2: cx + Math.cos(rad) * R, y2: cy + Math.sin(rad) * R }, ticks);
    }
    // Slow inner dashed ring and the centre sight
    refs.spin = el("circle", { cx, cy, r: R * 0.72, class: "hud-line hud-faint hud-spin", "stroke-dasharray": "2 10" }, g);
    refs.spin.style.transformOrigin = `${cx}px ${cy}px`;
    el("circle", { cx, cy, r: 13, class: "hud-line" }, g);
    el("path", { d: `M${cx - 20},${cy} h12 M${cx + 8},${cy} h12 M${cx},${cy - 20} v12 M${cx},${cy + 8} v12`, class: "hud-line" }, g);
    el("circle", { cx, cy, r: 2, class: "hud-fill-g" }, g);
    // Quarter-point labels in small notch boxes
    const notch = (x, y, label, vertical) => {
      const gg = el("g", {}, g);
      if (vertical) {
        el("rect", { x: x - 9, y: y - 30, width: 18, height: 60, rx: 3, class: "hud-notch" }, gg);
        const t = txt(x, y, "hud-cap", "middle", gg);
        t.setAttribute("transform", `rotate(90 ${x} ${y})`); t.setAttribute("dy", "3"); t.textContent = label;
      } else {
        el("rect", { x: x - 34, y: y - 9, width: 68, height: 18, rx: 3, class: "hud-notch" }, gg);
        const t = txt(x, y + 3.5, "hud-cap", "middle", gg); t.textContent = label;
      }
    };
    notch(cx, cy - R, "DAY");
    notch(cx, cy + R, "DOSE");
    notch(cx - R, cy, "CREW", true);
    notch(cx + R, cy, "CABIN", true);
    refs.day = txt(cx, cy - R + 34, "hud-big", "middle", g);
    refs.dayNote = txt(cx, cy - R + 50, "hud-sub", "middle", g);
    refs.dose = txt(cx, cy + R - 30, "hud-big", "middle", g);
    refs.doseNote = txt(cx, cy + R - 14, "hud-sub", "middle", g);
    refs.co2 = txt(cx + R - 26, cy + 4, "hud-big", "end", g);
    refs.co2Note = txt(cx + R - 26, cy + 20, "hud-sub", "end", g);
    const lx = cx - R + 24;
    refs.crew = [0, 1, 2, 3].map((k) => {
      const lab = txt(lx, cy - 22 + k * 16, "hud-cap", "start", g);
      const val = txt(lx + 34, cy - 22 + k * 16, "hud-val", "start", g);
      return [lab, val];
    });
    refs.rangeLab = txt(cx - R * 0.5, cy + R * 0.5, "hud-cap", "middle", g);
    refs.rangeVal = txt(cx - R * 0.5, cy + R * 0.5 + 16, "hud-val", "middle", g);
    refs.rateLab = txt(cx + R * 0.5, cy + R * 0.5, "hud-cap", "middle", g);
    refs.rateVal = txt(cx + R * 0.5, cy + R * 0.5 + 16, "hud-sub2", "middle", g);
    root.classList.toggle("ov", overview);
    if (data) fill();
  }

  let tapeDay = null;
  function fill() {
    const d = data;
    refs.day.textContent = String(d.day).padStart(3, "0");
    refs.dayNote.textContent = `of ${d.days}  ·  ${d.time}`;
    refs.dose.textContent = `${Math.round(d.dose)} µGy`;
    refs.doseNote.textContent = `${d.mission.toFixed(1)} mGy so far`;
    refs.co2.textContent = d.co2.toFixed(1);
    refs.co2.classList.toggle("warn", d.co2Over);
    refs.co2Note.textContent = d.co2Over ? "mmHg  over limit" : "mmHg CO2";
    const rows = [["CREW", d.crew], ["HR", `${d.hr.toFixed(0)} bpm`], ["TEMP", `${d.temp.toFixed(1)} °C`], ["SLEEP", `${d.sleep.toFixed(1)} h`]];
    refs.crew.forEach(([l, v], k) => { l.textContent = rows[k][0]; v.textContent = rows[k][1]; });
    refs.rangeLab.textContent = "TO WATCH";
    refs.rangeVal.textContent = String(d.watch);
    refs.rangeVal.classList.toggle("warn", d.watch > 0);
    refs.rateLab.textContent = "CHECK-IN";
    refs.rateVal.textContent = `${d.logged} of 7`;
    if (tapeDay !== d.day) {
      // Rebuild the tape around the current day and slide it into place.
      const inner = refs.tapeInner, step = refs.tapeStep, prev = tapeDay;
      inner.innerHTML = "";
      for (let k = -18; k <= 18; k++) {
        const day = d.day + k;
        if (day < 0 || day >= d.days) continue;
        const x = w / 2 + k * step, major = day % 5 === 0;
        el("line", { x1: x, y1: 28, x2: x, y2: major ? 40 : 34, class: "hud-line" }, inner);
        if (major) { const t = txt(x, 52, "hud-tick", "middle", inner); t.textContent = day; }
      }
      if (prev !== null && Math.abs(d.day - prev) < 10) {
        inner.style.transition = "none";
        inner.style.transform = `translateX(${(d.day - prev) * step}px)`;
        inner.getBoundingClientRect();
        inner.style.transition = "";
        inner.style.transform = "";
      }
      tapeDay = d.day;
    }
  }

  function resize() {
    const r = root.getBoundingClientRect();
    if (!r.width || !r.height || (Math.round(r.width) === w && Math.round(r.height) === h)) return;
    w = Math.round(r.width); h = Math.round(r.height);
    tapeDay = null;
    build();
  }
  addEventListener("resize", resize);

  return {
    update(next) { data = next; resize(); if (w) fill(); },
    setOverview(on) {
      if (on === overview) return;
      overview = on;
      root.classList.toggle("ov", on);
    },
  };
}
