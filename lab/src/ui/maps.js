// Maps view, drawn over the 3D stage when the Maps tab is open:
//   earth    world map with the ISS ground track (SGP4), day and night, and the measured
//            radiation dose rate (NASA OSDR RadLab) on the same grid as the radiation globe
//   station  ISS module layout coloured by measured daily dose (REM detectors, Dec 2019)
//   systems  life support as a flow diagram with today's real cabin readings
import { issState } from "../sim/orbit.js";

const DEG = 180 / Math.PI;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function rateColor(rate) {
  const t = Math.min(1, Math.max(0, Math.log10(Math.max(rate, 1) / 2) / Math.log10(150)));
  const stops = [[0, [90, 158, 242]], [0.35, [128, 209, 184]], [0.65, [240, 194, 89]], [1, [240, 107, 92]]];
  let k = 0;
  while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
  const [t0, a] = stops[k], [t1, b] = stops[k + 1], f = (t - t0) / (t1 - t0);
  return [0, 1, 2].map((j) => Math.round(a[j] + (b[j] - a[j]) * f)).concat(t);
}

export function createMaps({ host, rad, iss, epoch, earthImg, onTab }) {
  const el = document.createElement("div");
  el.className = "mapview";
  el.hidden = true;
  el.innerHTML = `<div class="map-bar">
      <div class="seg" role="group" data-seg="mapMode"><button type="button" data-v="earth" aria-pressed="true">Orbit and radiation</button><button type="button" data-v="station" aria-pressed="false">Station modules</button><button type="button" data-v="systems" aria-pressed="false">Life support</button></div>
      <div class="map-layers" data-for="earth"><label><input type="checkbox" data-layer="rad" checked> Radiation</label><label><input type="checkbox" data-layer="night" checked> Night side</label><label><input type="checkbox" data-layer="track" checked> Ground track</label></div>
    </div>
    <div class="map-body">
      <div class="map-pane" data-pane="earth"><canvas width="1440" height="720"></canvas><div class="map-info" id="mapInfo"></div></div>
      <div class="map-pane" data-pane="station" hidden></div>
      <div class="map-pane" data-pane="systems" hidden></div>
    </div>`;
  host.appendChild(el);
  const canvas = el.querySelector("canvas"), ctx = canvas.getContext("2d");
  const info = el.querySelector("#mapInfo");
  const layers = { rad: true, night: true, track: true };
  let mode = "earth";

  el.addEventListener("click", (e) => {
    const b = e.target.closest('[data-seg="mapMode"] button');
    if (b) {
      mode = b.dataset.v;
      el.querySelectorAll('[data-seg="mapMode"] button').forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      el.querySelectorAll("[data-pane]").forEach((p) => (p.hidden = p.dataset.pane !== mode));
      el.querySelector(".map-layers").hidden = mode !== "earth";
      last = null;
    }
    const go = e.target.closest("[data-go]");
    if (go) onTab(go.dataset.go);
  });
  el.addEventListener("change", (e) => { const l = e.target.dataset.layer; if (l) { layers[l] = e.target.checked; last = null; } });

  // Radiation layer, drawn once.
  const radLayer = document.createElement("canvas");
  radLayer.width = 1440; radLayer.height = 720;
  {
    const c = radLayer.getContext("2d");
    const cell = (6 / 360) * 1440;
    for (const [lat, lon, rate] of rad.grid) {
      const [r, g, b, t] = rateColor(rate);
      c.fillStyle = `rgba(${r},${g},${b},${(0.04 + 0.76 * t).toFixed(2)})`;
      c.fillRect(((lon + 180) / 360) * 1440 - cell / 2, ((90 - lat) / 180) * 720 - cell / 2, cell, cell);
    }
  }
  const X = (lonDeg) => ((lonDeg + 180) / 360) * 1440, Y = (latDeg) => ((90 - latDeg) / 180) * 720;

  function drawEarth(date) {
    ctx.fillStyle = "#0b131d";
    ctx.fillRect(0, 0, 1440, 720);
    if (earthImg) ctx.drawImage(earthImg, 0, 0, 1440, 720);
    const now = issState(iss, date);
    if (layers.night && now) {
      // shade where the Sun is below the horizon, on a coarse grid
      const s = now.sunEcf, step = 8;
      for (let y = 0; y < 720; y += step) {
        const lat = (90 - (y + step / 2) / 4) / DEG;
        for (let x = 0; x < 1440; x += step) {
          const lon = ((x + step / 2) / 4 - 180) / DEG;
          const cosz = Math.cos(lat) * Math.cos(lon) * s.x + Math.cos(lat) * Math.sin(lon) * s.y + Math.sin(lat) * s.z;
          if (cosz < 0.05) { ctx.fillStyle = `rgba(4,8,16,${Math.min(0.62, (0.05 - cosz) * 4).toFixed(2)})`; ctx.fillRect(x, y, step, step); }
        }
      }
    }
    if (layers.rad) { ctx.filter = "blur(5px)"; ctx.drawImage(radLayer, 0, 0); ctx.filter = "none"; }
    // grid
    ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 1;
    for (let lon = -150; lon <= 150; lon += 30) { ctx.beginPath(); ctx.moveTo(X(lon), 0); ctx.lineTo(X(lon), 720); ctx.stroke(); }
    for (let lat = -60; lat <= 60; lat += 30) { ctx.beginPath(); ctx.moveTo(0, Y(lat)); ctx.lineTo(1440, Y(lat)); ctx.stroke(); }
    if (layers.rad) {
      ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.font = "600 20px Archivo, sans-serif";
      ctx.fillText("South Atlantic Anomaly", X(-75), Y(-38));
    }
    if (layers.track && now) {
      // 45 minutes back (solid) and three orbits ahead (dashed)
      for (const [from, to, dash, alpha] of [[-45, 0, [], 0.95], [0, 280, [10, 8], 0.6]]) {
        ctx.setLineDash(dash); ctx.strokeStyle = `rgba(255,255,255,${alpha})`; ctx.lineWidth = 2.5;
        ctx.beginPath();
        let prev = null;
        for (let m = from; m <= to; m += 1) {
          const st = issState(iss, new Date(date.getTime() + m * 60e3));
          if (!st) continue;
          const x = X(st.lon * DEG), y = Y(st.lat * DEG);
          if (prev && Math.abs(x - prev) < 700) ctx.lineTo(x, y); else ctx.moveTo(x, y);
          prev = x;
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);
      const x = X(now.lon * DEG), y = Y(now.lat * DEG);
      ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#0b131d"; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = "#ffffff"; ctx.font = "700 22px Archivo, sans-serif"; ctx.fillText("ISS", x + 14, y - 10);
    }
    if (now) {
      const sub = { lat: Math.asin(now.sunEcf.z) * DEG, lon: Math.atan2(now.sunEcf.y, now.sunEcf.x) * DEG };
      ctx.fillStyle = "#ffd36e"; ctx.beginPath(); ctx.arc(X(sub.lon), Y(sub.lat), 10, 0, Math.PI * 2); ctx.fill();
      // dose rate measured nearest to the station's current position
      let best = null, bd = 1e9;
      for (const g of rad.grid) { const d = (g[0] - now.lat * DEG) ** 2 + (((g[1] - now.lon * DEG + 540) % 360) - 180) ** 2; if (d < bd) { bd = d; best = g; } }
      info.innerHTML = `<b>${esc(date.toISOString().slice(0, 16).replace("T", " "))} UTC</b>
        <span>Position ${(now.lat * DEG).toFixed(1)}°, ${(now.lon * DEG).toFixed(1)}°, ${Math.round(now.height)} km up</span>
        <span>${now.inShadow ? "In Earth's shadow" : "In sunlight"}</span>
        <span>Typical dose rate here: <b>${best ? best[2].toFixed(1) : "–"} µGy/h</b> (measured average for this patch)</span>`;
    }
  }

  function drawStation(modules) {
    const dose = Object.fromEntries(modules.map((m) => [m.module, m.dose]));
    const lo = Math.min(...modules.map((m) => m.dose)), hi = Math.max(...modules.map((m) => m.dose));
    const fill = (name) => {
      if (dose[name] == null) return "#1b2129";
      const [r, g, b] = rateColor(2 * 150 ** ((dose[name] - lo) / (hi - lo)) );
      return `rgb(${r},${g},${b})`;
    };
    // Simplified top view of the pressurised modules (forward is to the right). Labels for
    // each module sit below it so narrow modules stay readable.
    const M = [
      ["Zvezda (SM)", 20, 205, 150, 50, "Russian service module"],
      ["Zarya (FGB)", 180, 207, 120, 46, ""],
      ["Node 1", 320, 200, 70, 60, "Unity"],
      ["US Lab", 400, 205, 170, 50, "Destiny"],
      ["Node 2", 580, 200, 70, 60, "Harmony, crew quarters"],
      ["JPM", 585, 40, 60, 150, "Kibo"],
      ["Columbus", 578, 290, 74, 100, ""],
      ["Node 3", 325, 50, 60, 120, "Tranquility"],
    ];
    const rows = M.map(([name, x, y, w, h, sub]) => {
      const has = dose[name] != null, dim = has ? "" : " dim";
      const vert = h > w * 1.4;
      const tx = x + w / 2, ty = y + h / 2;
      const label = vert
        ? `<text x="${tx}" y="${ty - 8}" text-anchor="middle" class="m-name${dim}">${esc(name)}</text><text x="${tx}" y="${ty + 10}" text-anchor="middle" class="m-val${dim}">${has ? Math.round(dose[name]) : "–"}</text><text x="${tx}" y="${ty + 24}" text-anchor="middle" class="m-val${dim}">${has ? "µGy/day" : ""}</text>`
        : `<text x="${tx}" y="${ty - 3}" text-anchor="middle" class="m-name${dim}">${esc(name)}</text><text x="${tx}" y="${ty + 14}" text-anchor="middle" class="m-val${dim}">${has ? `${Math.round(dose[name])} µGy/day` : "no REM data"}</text>`;
      return `<g class="mod"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${fill(name)}" stroke="#0e1116" stroke-width="2"/>${label}
      ${sub ? `<text x="${tx}" y="${y + h + 15}" text-anchor="middle" class="m-sub">${esc(sub)}</text>` : ""}</g>`;
    }).join("");
    const cupola = `<g class="mod"><circle cx="270" cy="110" r="34" fill="${fill("Cupola")}" stroke="#0e1116" stroke-width="2"/><text x="270" y="106" text-anchor="middle" class="m-name">Cupola</text><text x="270" y="123" text-anchor="middle" class="m-val">${dose.Cupola != null ? Math.round(dose.Cupola) : "–"}</text><line x1="304" y1="110" x2="325" y2="110" stroke="#93a1b0" stroke-width="2"/><text x="270" y="160" text-anchor="middle" class="m-sub">below Node 3</text></g>`;
    const ranked = [...modules].sort((a, b) => a.dose - b.dose);
    return `<div class="station-map"><svg viewBox="0 0 670 420" role="img" aria-label="ISS modules coloured by daily radiation dose">${rows}${cupola}
      <text x="660" y="412" text-anchor="end" class="m-sub">forward →</text></svg>
      <div class="map-side"><h3>Measured dose by module</h3><p>Same detector type (REM) in each module over the same days of December 2019. Lowest: <b>${esc(ranked[0].module)}</b>, ${Math.round(ranked[0].dose)} µGy a day. Highest: <b>${esc(ranked[ranked.length - 1].module)}</b>, ${Math.round(ranked[ranked.length - 1].dose)} µGy a day.</p>
      <p>The crew sleep in Node 2, which had no detector in this data. Shielding (water, stowage, equipment racks) differs from module to module and from spot to spot; each value is the dose where that one detector sat.</p>
      <p class="src">${esc(rad.modules_source)} Layout simplified from NASA's ISS configuration diagrams; sizes not to scale. Russian segment readings come from a different detector type and are not coloured.</p>
      <div class="chips"><button class="chip" data-go="radiation">Radiation station</button></div></div></div>`;
  }

  function drawSystems(env) {
    const v = (x, d = 1) => (x == null ? "–" : x.toFixed(d));
    const node = (id, x, y, w, title, lines, cls = "") => `<g class="sys ${cls}" data-node="${id}"><rect x="${x}" y="${y}" width="${w}" height="${36 + lines.length * 18}" rx="10"/><text x="${x + 12}" y="${y + 22}" class="s-title">${esc(title)}</text>${lines.map((l, k) => `<text x="${x + 12}" y="${y + 42 + k * 18}" class="s-line">${l}</text>`).join("")}</g>`;
    const flow = (d, label, lx, ly) => `<path d="${d}" class="flow"/><text x="${lx}" y="${ly}" class="f-label">${esc(label)}</text>`;
    const co2Cls = env.co2 > 3 ? "warn" : "";
    const svg = `<svg viewBox="0 0 820 430" role="img" aria-label="Life support flow">
      <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#6fa8f5"/></marker></defs>
      ${flow("M190,95 L300,95", "breath", 228, 85)}
      ${flow("M520,95 L600,95", "fans", 545, 85)}
      ${flow("M700,135 L700,205", "CO2", 710, 175)}
      ${flow("M600,240 L520,240", "water", 535, 230)}
      ${flow("M410,150 L410,205", "condensate", 420, 185)}
      ${flow("M300,250 L190,250", "drinking water", 200, 270)}
      ${flow("M410,300 L410,345", "", 0, 0)}
      ${flow("M300,370 L190,370", "oxygen", 215, 360)}
      ${flow("M110,345 L110,140", "O2 to cabin", 118, 300)}
      ${flow("M520,385 L640,385 L700,280", "hydrogen", 600, 405)}
      ${flow("M110,295 L110,300", "", 0, 0)}
      ${node("crew", 30, 60, 160, "Crew (4)", ["breathe, drink, sweat"])}
      ${node("cabin", 300, 50, 220, "Cabin air (measured)", [`CO2 ${v(env.co2)} mmHg, peak ${v(env.peak1h)}`, `${v(env.temp)} °C, ${v(env.rh, 0)}% humidity`, env.date ? `ISS ${esc(env.date)}` : "simulated"], co2Cls)}
      ${node("cdra", 600, 60, 200, "CO2 removal", ["sorbent beds pull CO2", "from fan-driven air"])}
      ${node("sab", 600, 205, 200, "CO2 reduction", ["CO2 + H2 → water", "methane vented"])}
      ${node("wpa", 300, 205, 220, "Water recovery", ["condensate and urine", "cleaned to drinking water"])}
      ${node("ogs", 300, 345, 220, "Oxygen generation", ["splits water: O2 + H2"])}
      ${node("store", 30, 225, 160, "Water store", ["potable water"])}
      ${node("o2", 30, 345, 160, "O2 supply", ["to the cabin"])}
    </svg>`;
    return `<div class="systems-map">${svg}<div class="map-side"><h3>How the station keeps the air breathable</h3>
      <p>Air, water and oxygen are recycled in a loop. When the CO2 removal step falls behind (more crew, more exercise, a fault), CO2 in the cabin rises: the number in the cabin box, from real ISS telemetry for the replayed day.</p>
      <div class="chips"><button class="chip" data-go="air">Air station</button><button class="chip" data-go="checkin">Check-in</button></div>
      <p class="src">Diagram simplified from NASA descriptions of the ISS Environmental Control and Life Support System; flows are illustrative, not measured. Cabin values: NASA OSDR Environmental Data App.</p></div></div>`;
  }

  let last = null;
  function render(state) {
    if (el.hidden) return;
    const key = mode === "earth" ? `${mode}|${Math.floor(state.simHours * 60)}|${layers.rad}${layers.night}${layers.track}` : `${mode}|${state.day}`;
    if (key === last) return;
    last = key;
    if (mode === "earth") drawEarth(new Date(epoch.getTime() + state.simHours * 3600e3));
    else if (mode === "station") el.querySelector('[data-pane="station"]').innerHTML = drawStation(rad.modules);
    else el.querySelector('[data-pane="systems"]').innerHTML = drawSystems(state.env);
  }
  return { el, render, show(on) { el.hidden = !on; last = null; } };
}
