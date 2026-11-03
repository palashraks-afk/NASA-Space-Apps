import "./styles.css";
import * as THREE from "three";
import { createRenderer } from "./scene/renderer.js";
import { makeMaterials } from "./scene/materials.js";
import { buildModule, W } from "./scene/module.js";
import { buildEvidence, priorAsPosterior } from "./scene/evidence.js";
import { buildClock } from "./scene/clock.js";
import { buildBoard } from "./scene/board.js";
import { buildOutside } from "./scene/window.js";
import { buildMedical } from "./scene/medical.js";
import { buildAir } from "./scene/air.js";
import { buildGalley } from "./scene/galley.js";
import { buildRadiation } from "./scene/radiation.js";
import { createCameraRig } from "./scene/cameraRig.js";
import { loadOutcomes, INTERVENTIONS, DESTINATIONS } from "./sim/presets.js";
import { recommendDesign, drawMysteryEffect, buildMission, analyseDay, truthLabel } from "./sim/mission.js";
import { makeISS, issState, countSunrises } from "./sim/orbit.js";
import { buildCrewHealth, usualRange, AIR_LIMITS, PREFLIGHT } from "./sim/health.js";
import { poolCrew, pooledVerdict } from "./engine/pooling.js";
import { mulberry32, normal } from "./engine/rng.js";
import { spark, lineWithRefs, draws, bars } from "./ui/charts.js";
import { powerChart, dataChart, effectChart } from "./ui/numbers.js";
import { buildPrereg, downloadJSON } from "./ui/prereg.js";

const $ = (s, r = document) => r.querySelector(s);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const loadingText = $("#loadingText");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const seg = (name, opts, cur) => `<div class="seg" role="group" data-seg="${name}">${opts.map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${String(v) === String(cur)}">${l}</button>`).join("")}</div>`;
const setPressed = (root, name, cur) => root.querySelectorAll(`[data-seg="${name}"] button`).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === String(cur))));

async function boot() {
  loadingText.textContent = "Loading crew data";
  await Promise.all([document.fonts.load('64px "Permanent Marker"'), document.fonts.load('600 16px "Archivo"'), document.fonts.load('800 16px "Archivo"')]);
  const [realNoise, gp, foodsFile, RAD, BLOOD, CABIN] = await Promise.all(["/data/real_noise.json", "/data/iss_gp.json", "/data/foods.json", "/data/radiation.json", "/data/bloodwork.json", "/data/cabin.json"].map((u) => fetch(u).then((r) => r.json())));
  const OUTCOMES = loadOutcomes(realNoise);
  const iss = makeISS(gp[0]);
  const issEpoch = new Date(gp[0].EPOCH + "Z");
  const sunrises = countSunrises(iss, issEpoch, 24, 20);
  let dayStartHours = 0;
  for (let m = 0; m < 240; m++) {
    const st = issState(iss, new Date(issEpoch.getTime() + m * 60e3));
    if (!st || st.inShadow) continue;
    const up = { x: Math.cos(st.lat) * Math.cos(st.lon), y: Math.cos(st.lat) * Math.sin(st.lon), z: Math.sin(st.lat) };
    if (up.x * st.sunEcf.x + up.y * st.sunEcf.y + up.z * st.sunEcf.z > 0.55) { dayStartHours = m / 60; break; }
  }
  const H = buildCrewHealth({ realNoise, foods: foodsFile.foods, days: 180, cabin: CABIN.daily });

  loadingText.textContent = "Pressurizing the module";
  const stage = $("#stage");
  const quality = new URLSearchParams(location.search).get("q") === "low" ? "low" : "high";
  const R = createRenderer(stage, { quality });
  const { scene, camera, composer, renderer } = R;
  const mats = makeMaterials();
  const loader = new THREE.TextureLoader();
  const loadTex = (u) => new Promise((res) => loader.load(u, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; res(t); }, undefined, () => res(null)));
  const [earthDay, earthNight, moonT, marsT] = await Promise.all(["/textures/earth_day.jpg", "/textures/earth_night.jpg", "/textures/moon.jpg", "/textures/mars.jpg"].map(loadTex));

  scene.add(buildModule(mats));
  const outside = buildOutside({ earthDay, earthNight, moon: moonT, mars: marsT });
  scene.add(outside.group);
  const place = (obj, x, y, z, ry) => { obj.group.position.set(x, y, z); obj.group.rotation.y = ry; scene.add(obj.group); return obj; };
  const evidence = place(buildEvidence(mats), W - 0.44, -0.04, -1.9, -Math.PI / 2);
  evidence.setMotion(reduced);
  const clock = place(buildClock(mats), W - 0.05, 0.08, 1.95, -Math.PI / 2);
  const board = place(buildBoard(mats), -W + 0.07, 0.04, 0.55, Math.PI / 2);
  const medical = place(buildMedical(mats), -W + 0.06, 0.05, -2.45, Math.PI / 2);
  const galley = place(buildGalley(mats), -W + 0.06, 0.05, 2.8, Math.PI / 2);
  const air = place(buildAir(mats), W - 0.06, 0.08, 3.7, -Math.PI / 2);
  const radiation = place(buildRadiation(mats, { earthDay, data: RAD }), W - 0.06, 0.06, 0.05, -Math.PI / 2);

  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const views = {
    overview: { pos: V(0, 0.28, 4.6), look: V(0, -0.05, -2) },
    window: { pos: V(0, -0.05, -3.05), look: V(0, -0.42, -6) },
    board: { pos: V(0.9, -0.04, 0.55), look: V(-1.1, -0.2, 0.55) },
    evidence: { pos: V(-0.9, 0.02, -1.9), look: V(W - 0.44, -0.18, -1.9) },
    clock: { pos: V(-0.55, 0.02, 1.95), look: V(W, -0.12, 1.95) },
    medical: { pos: V(0.3, 0.0, -2.45), look: V(-1.1, -0.06, -2.45) },
    galley: { pos: V(0.3, 0.0, 2.8), look: V(-1.1, -0.06, 2.8) },
    air: { pos: V(-0.3, 0.04, 3.7), look: V(1.1, 0.02, 3.7) },
    radiation: { pos: V(-0.5, 0.08, 0.05), look: V(W, -0.02, 0.05) },
  };
  const rig = createCameraRig(camera, renderer.domElement, views);
  rig.setReduced(reduced);

  // ---------------- state ----------------
  const S = { tab: "overview", met: 0, playing: false, speed: 1, crewSel: 0, dest: "iss", destLabel: DESTINATIONS.iss.label, simHours: dayStartHours, clockLux: 300, brightWake: false };
  const E = {
    step: 1, maxStep: 1, intervention: "caffeine", outcomeKey: "sleep_latency", speed: INTERVENTIONS.caffeine.speed,
    delta: OUTCOMES.sleep_latency.delta, thr: 0.95, mode: "hidden", practiceMult: 1.5, noise: "sim", crewMode: false,
    seed: Math.floor(Math.random() * 1e6) + 1, days: 56, mission: null, crew: null, member: 0, locked: false, started: false, done: false,
    startDay: null, day: 0, history: [], last: null, power: null, powerId: 0, randomizing: false,
  };
  const today = () => Math.min(H.days - 1, Math.floor(S.met));
  const idx = () => PREFLIGHT + today();
  const outcome = () => OUTCOMES[E.outcomeKey];
  const intervention = () => INTERVENTIONS[E.intervention];
  const design = () => recommendDesign(E.speed);
  const diary = realNoise.example_person.series;
  const realSeriesFor = (key) => (key === "sleep_duration" ? diary.map((r) => r.sleep_duration) : key === "sleep_efficiency" ? diary.map((r) => r.sleep_efficiency * 100) : null);
  const syncDays = () => {
    if (E.noise === "real" && (!realSeriesFor(E.outcomeKey) || E.crewMode)) E.noise = "sim";
    E.days = E.noise === "real" ? realSeriesFor(E.outcomeKey).length : 56;
  };

  const worker = new Worker(new URL("./sim/powerWorker.js", import.meta.url), { type: "module" });
  worker.onmessage = (e) => { if (e.data.id === E.powerId) { E.power = e.data; refresh(); updateCharts(); } };
  const requestPower = () => {
    E.power = null; E.powerId++;
    worker.postMessage({ id: E.powerId, outcome: { sd: outcome().sd, rho: outcome().rho }, design: design(), delta: E.delta, thr: E.thr, days: E.days });
  };

  // ---------------- health helpers ----------------
  const METRICS = [
    { key: "hr", name: "Heart rate", unit: "bpm", d: 0, src: "wearable, daily median" },
    { key: "rmssd", name: "Heart rate variability", unit: "ms", d: 0, src: "RMSSD, daily median" },
    { key: "temp", name: "Core body temperature", unit: "°C", d: 1, src: "resting" },
    { key: "sleepDuration", name: "Sleep duration", unit: "h", d: 1, src: "sleep diary", bounds: { min: 0, max: 24 } },
    { key: "sleepLatency", name: "Time to fall asleep", unit: "min", d: 0, src: "sleep diary", bounds: { min: 0 } },
    { key: "sleepEfficiency", name: "Sleep efficiency", unit: "%", d: 0, src: "sleep diary", bounds: { min: 0, max: 100 } },
  ];
  const bands = H.crew.map((c) => Object.fromEntries(METRICS.map((m) => [m.key, usualRange(c[m.key], PREFLIGHT, m.bounds)])));
  function metricState(ci, m, i = idx()) {
    const c = H.crew[ci], v = c[m.key][i], b = bands[ci][m.key];
    if (!b) return { v, cls: "", out: false, text: "Too few pre-flight days to set a usual range" };
    const out = v < b.lo || v > b.hi;
    const last7 = c[m.key].slice(Math.max(PREFLIGHT, i - 6), i + 1);
    const nOut = last7.filter((x) => x < b.lo || x > b.hi).length;
    if (m.key === "temp" && v > b.hi && today() > 0) return { v, cls: "expected", out: true, text: "Above pre-flight range, as expected in flight: resting core temperature rises about 1 °C over 2.5 months (Stahn et al. 2017)." };
    if (out) return { v, cls: "out", out: true, text: `Outside your usual range today; ${nOut} of the last ${last7.length} days were outside.` };
    return { v, cls: "", out: false, text: `Within your usual range (${b.lo.toFixed(m.d)} to ${b.hi.toFixed(m.d)} ${m.unit}, from ${b.n} pre-flight days).` };
  }
  const kpi = (label, value, unit, note, flag) => `<div class="kpi ${flag ? "flag" : ""}"><div class="label">${label}</div><div class="value">${value}<small>${unit}</small></div><div class="note">${note}</div></div>`;

  // ---------------- radiation and bloodwork helpers ----------------
  // Real ISS readings cover about 100 days; mission day d replays measured day d (wrapping).
  const radDaily = RAD.daily.map((x) => x.dose);
  const radDates = RAD.daily.map((x) => x.date);
  const radDay = (d = today()) => d % radDaily.length;
  const radSeries = Array.from({ length: H.days }, (_, d) => radDaily[d % radDaily.length]);
  const radCum = radSeries.reduce((a, v) => (a.push((a.length ? a[a.length - 1] : 0) + v), a), []);
  const radToday = () => radSeries[today()];
  const radTotal = () => radCum[today()];
  const radMean = radDaily.reduce((a, b) => a + b, 0) / radDaily.length;
  const bloodFor = (k) => BLOOD.crew[k % BLOOD.crew.length];
  function bloodState(k, a) {
    const vals = bloodFor(k).values[a.key];
    const pre = vals.slice(0, 3).filter((v) => v != null);
    const ret = vals[3];
    if (!pre.length || ret == null) return { vals, pre, ret, text: "Missing draw", cls: "", flagged: [] };
    const mean = pre.reduce((x, y) => x + y, 0) / pre.length;
    const pct = ((ret - mean) / mean) * 100;
    const outRef = (v) => v != null && a.ref && ((a.ref[0] != null && v < a.ref[0]) || (a.ref[1] != null && v > a.ref[1]));
    const beyond = a.rcv != null && Math.abs(pct) > a.rcv;
    const flagged = vals.map((v, i) => (i >= 3 && outRef(v) ? i : -1)).filter((i) => i >= 0);
    if (beyond) flagged.push(3);
    let text = `Day after landing: ${pct >= 0 ? "up" : "down"} ${Math.abs(pct).toFixed(0)}% from own pre-flight average`;
    if (a.rcv != null) text += beyond ? `, more than normal variation (${a.rcv}%)` : `, within normal variation (${a.rcv}%)`;
    if (outRef(ret)) text += "; outside the lab range";
    return { vals, pre, ret, pct, mean, text, cls: beyond || outRef(ret) ? "out" : "", flagged };
  }
  const bloodFlags = (k) => BLOOD.panels.flatMap((p) => p.analytes).filter((a) => bloodState(k, a).cls === "out");

  // ---------------- tabs ----------------
  const TABS = [["overview", "Overview"], ["medical", "Vitals"], ["bloodwork", "Bloodwork"], ["air", "Air"], ["radiation", "Radiation"], ["galley", "Galley"], ["clock", "Body clock"], ["experiments", "Experiments"], ["window", "Window"]];
  const tabsEl = $("#tabs");
  tabsEl.innerHTML = TABS.map(([k, l]) => `<button class="tab" role="tab" data-tab="${k}" aria-selected="${k === S.tab}">${l}</button>`).join("");
  tabsEl.addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) showTab(b.dataset.tab); });
  let inspectorEl = $("#inspector");
  const viewFor = (tab) => (tab === "experiments" ? (E.step <= 2 ? "board" : "evidence") : tab === "bloodwork" ? "medical" : tab);
  let panel = null;
  function showTab(tab) {
    S.tab = tab;
    tabsEl.querySelectorAll("[data-tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === tab)));
    panel = PANELS[tab];
    const fresh = inspectorEl.cloneNode(false); // drop old listeners with the old panel
    inspectorEl.replaceWith(fresh);
    inspectorEl = fresh;
    panel.mount(fresh);
    refresh();
    rig.go(viewFor(tab));
  }
  function refresh() { if (panel) panel.update(); renderTimeline(); renderStatus(); }

  // ---------------- panels ----------------
  const PANELS = {};

  PANELS.overview = {
    mount(root) {
      root.innerHTML = `<h2>Crew overview</h2><p class="lede">Each measure is compared with that person's own pre-flight range, not a population norm. Amber marks a measure outside that range; nothing alarms.</p>
        <table class="grid" id="ovCrew"><thead><tr><th>Crew</th><th>Slept</th><th>Heart rate</th><th>Core temp</th><th>Outside range</th></tr></thead><tbody></tbody></table>
        <h3>Cabin</h3><div class="kpis" id="ovCabin"></div>
        <h3>Experiment</h3><p id="ovExp"></p>
        <div class="actions"><button class="btn quiet" data-act="report">Download crew report</button><span class="src">Keys: 1 to 9 switch stations, Space plays, arrows step a day</span></div>
        <p class="src">Sleep: real diaries from an open dataset (each crew member is one participant). Heart measures and temperature simulated from published spreads. Cabin air: real ISS telemetry (NASA OSDR).</p>`;
      root.querySelector("#ovCrew").addEventListener("click", (e) => { const r = e.target.closest("[data-crew]"); if (r) selectCrew(+r.dataset.crew); });
      root.querySelector('[data-act="report"]').addEventListener("click", downloadReport);
    },
    update() {
      const i = idx();
      $("#ovCrew tbody").innerHTML = H.crew.map((c, k) => {
        const nOut = METRICS.filter((m) => metricState(k, m).cls === "out").length;
        return `<tr data-crew="${k}" class="${k === S.crewSel ? "sel" : ""}"><td><b>${c.id}</b></td><td>${c.sleepDuration[i].toFixed(1)} h</td><td>${c.hr[i].toFixed(0)} bpm</td><td>${c.temp[i].toFixed(1)} °C</td><td><span class="dot ${nOut ? "out" : "ok"}"></span>${nOut} of ${METRICS.length}</td></tr>`;
      }).join("");
      const env = H.env;
      $("#ovCabin").innerHTML = kpi("CO2 today", env.co2[i].toFixed(1), "mmHg", env.co2[i] > AIR_LIMITS.co2_1h_mmHg ? "Above the 3 mmHg nominal limit" : "Within the nominal limit", env.co2[i] > AIR_LIMITS.co2_1h_mmHg)
        + kpi("Headache risk", (env.headache[i] * 100).toFixed(1), "%", "From the 7-day CO2 average (Law et al. 2014)", env.headache[i] > 0.01)
        + kpi("Radiation today", Math.round(radToday()), "µGy", "Measured on the ISS (NASA RadLab)", false)
        + kpi("Mission dose", (radTotal() / 1000).toFixed(1), "mGy", `Absorbed, ${today() + 1} days`, false);
      $("#ovExp").textContent = !E.mission ? "No experiment set up. Open Experiments to design one." : E.started ? `Day ${E.day} of ${E.days}: "${intervention().label}" on ${outcome().label.toLowerCase()}${E.crew ? ", whole crew" : ""}.` : E.done ? "Finished. See Experiments for the result." : E.locked ? "Plan locked; ready to start." : "Plan being set up.";
    },
  };

  PANELS.medical = {
    mount(root) {
      root.innerHTML = `<h2 id="medTitle"></h2><p class="lede">Today's values against this person's own range from ${PREFLIGHT} pre-flight days. The shaded band is that range; the lighter strip at the left is pre-flight.</p>
        <div id="medList">${METRICS.map((m) => `<div class="metric" data-m="${m.key}"><span class="name">${m.name} <span class="src">${m.src}</span></span><span class="val"></span><span class="state"></span><div class="chart"></div></div>`).join("")}</div>
        <p class="src">Sleep values are a real person's diary (Baigutanova et al. 2025, CC BY). Heart rate and HRV: levels, spreads and day-to-day correlation from the same dataset; series simulated. Temperature rise in flight from Stahn et al. 2017. Not a medical device.</p>`;
    },
    update() {
      const ci = S.crewSel, c = H.crew[ci], i = idx();
      $("#medTitle").textContent = `Crew ${c.id}, mission day ${today()}`;
      for (const m of METRICS) {
        const row = $(`[data-m="${m.key}"]`), st = metricState(ci, m);
        row.querySelector(".val").innerHTML = `${st.v.toFixed(m.d)} <small>${m.unit}</small>`;
        const s = row.querySelector(".state");
        s.textContent = st.text;
        s.className = `state ${st.cls}`;
        row.querySelector(".chart").innerHTML = spark(c[m.key], { upTo: i, band: bands[ci][m.key], preflight: PREFLIGHT, window: 60, expected: st.cls === "expected" });
      }
    },
  };

  PANELS.air = {
    mount(root) {
      root.innerHTML = `<h2>Cabin air</h2><p class="lede">Real ISS cabin air, replayed one measured day per mission day. Carbon dioxide builds up in a closed cabin and is removed by the scrubbers; higher levels raise the chance of headaches and can slow thinking.</p>
        <div class="kpis" id="airK"></div><h3>Carbon dioxide, last 90 days</h3><div class="charts" id="airChart"></div>
        <p class="src">NASA nominal 1-hour CO2 limit 3 mmHg since 2022 (per a 2026 npj Microgravity review). Law et al. 2014: on the ISS, each +1 mmHg CO2 doubled the odds of a reported headache; a 7-day average under 2.5 mmHg kept risk under 1%. Temperature 18 to 27 °C and humidity 25 to 75% from NASA-STD-3001 Vol. 2. Cabin values: ${esc(CABIN.source)} CO2 converted from ppm at sea-level cabin pressure. ${CABIN.dropped.flat} flat-lined sensor days and ${CABIN.dropped.overlap} duplicate days from overlapping missions were removed.</p>`;
    },
    update() {
      const i = idx(), e = H.env;
      $("#airK").innerHTML = kpi("CO2 now", e.co2[i].toFixed(1), "mmHg", e.co2[i] > 3 ? "Above the 3 mmHg nominal limit" : "Within the nominal limit", e.co2[i] > 3)
        + kpi("7-day average", e.co2_7d[i].toFixed(2), "mmHg", e.co2_7d[i] > 2.5 ? "Above the 2.5 mmHg headache guidance" : "Under the 2.5 mmHg guidance", e.co2_7d[i] > 2.5)
        + kpi("Headache risk", (e.headache[i] * 100).toFixed(1), "%", "Per crew member, from the 7-day average", e.headache[i] > 0.01)
        + kpi("Peak 1-hour CO2", e.peak1h[i].toFixed(1), "mmHg", e.peak1h[i] > 3 ? "Above the 3 mmHg limit for part of the day" : "Under the 3 mmHg limit all day", e.peak1h[i] > 3)
        + kpi("Temperature", e.temp[i].toFixed(1), "°C", "Range 18 to 27 °C", false)
        + kpi("Humidity", e.rh[i].toFixed(0), "%", "Range 25 to 75%", false);
      $("#airChart").innerHTML = lineWithRefs(e.co2, { upTo: i, window: 90, unit: "mmHg", refs: [{ y: 3, label: "3.0 nominal limit", color: "#ef6a5c" }, { y: 2.5, label: "2.5 headache guidance (7-day)", color: "#e0b25a" }], minY: 1.5 });
    },
  };

  PANELS.galley = {
    mount(root) {
      root.innerHTML = `<h2 id="galTitle"></h2><p class="lede">Today's meals with real nutrient values, against NASA's exploration nutrition targets.</p>
        <div class="kpis" id="galK"></div><h3>Today against targets</h3><div class="bars" id="galBars"></div>
        <h3>Average over the last 14 days</h3><div class="bars" id="galAvg"></div><h3>Today's menu</h3><div id="galMenu"></div>
        <p class="src">Nutrients: USDA FoodData Central (SR Legacy), per item, with approximate servings; these are Earth versions of foods similar to station menu items. Targets: NASA JSC-67378 (2020): vitamin D 1000 IU, calcium 1000 to 1200 mg (not above 2500), sodium 1500 to 2300 mg per day. Astronaut energy intake typically runs 30 to 40% below the recommended level in flight. Menus are simulated.</p>`;
    },
    update() {
      const c = H.crew[S.crewSel], i = idx(), m = c.meals[i];
      $("#galTitle").textContent = `Galley: crew ${c.id}, day ${today()}`;
      $("#galK").innerHTML = kpi("Energy", Math.round(m.kcal), "kcal", "", false) + kpi("Protein", Math.round(m.protein_g), "g", "", false);
      const bar = (label, v, tgt, unit, mode) => {
        const max = mode === "upper" ? tgt * 1.5 : tgt * 1.3;
        const ok = mode === "upper" ? v >= 1500 && v <= tgt : v >= tgt;
        return `<div class="row"><span>${label}</span><span class="track"><span class="fill ${ok ? "ok" : ""}" style="width:${Math.min(100, (v / max) * 100).toFixed(1)}%"></span><span class="target" style="left:${((tgt / max) * 100).toFixed(1)}%"></span></span><span class="v">${Math.round(v)} ${unit}</span></div>`;
      };
      const rows = (mm) => bar("Vitamin D", mm.vitamin_d_IU, 1000, "IU") + bar("Calcium", mm.calcium_mg, 1000, "mg") + bar("Sodium", mm.sodium_mg, 2300, "mg", "upper");
      $("#galBars").innerHTML = rows(m);
      const last = c.meals.slice(Math.max(0, i - 13), i + 1);
      const avg = (k) => last.reduce((a, x) => a + x[k], 0) / last.length;
      $("#galAvg").innerHTML = rows({ vitamin_d_IU: avg("vitamin_d_IU"), calcium_mg: avg("calcium_mg"), sodium_mg: avg("sodium_mg") });
      const counts = new Map();
      for (const t of m.items) counts.set(t, (counts.get(t) || 0) + 1);
      $("#galMenu").innerHTML = `<ul class="menu">${[...counts].map(([t, k]) => `<li>${esc(t)}${k > 1 ? ` <span class="src">${k} servings</span>` : ""}</li>`).join("")}</ul>`;
    },
  };

  PANELS.bloodwork = {
    mount(root) {
      root.innerHTML = `<h2 id="bwTitle"></h2><p class="lede">Real blood tests from a real crew: the four Inspiration4 astronauts (SpaceX, 2021, three days in orbit), drawn three times before launch and four times after landing. Each value is compared with that astronaut's own pre-flight draws and with the lab range.</p>
        <div class="kpis" id="bwK"></div>
        <div id="bwPanels">${BLOOD.panels.map((p) => `<h3>${esc(p.title)}</h3>${p.analytes.map((a) => `<div class="metric" data-b="${a.key}"><span class="name">${esc(a.label)}</span><span class="val"></span><span class="state"></span><div class="chart"></div></div>`).join("")}`).join("")}</div>
        <p class="src">${esc(BLOOD.source)} Crew A to D in this console show participants C001 to C004. Green band: lab reference range. Blue band: this person's three pre-flight draws. Normal variation for blood counts: reference change values from Coskun et al. 2018 (EuBIVAS); none are applied to the metabolic panel. One crew's short mission, not a norm. Not a medical device.</p>`;
    },
    update() {
      const k = S.crewSel, b = bloodFor(k);
      $("#bwTitle").textContent = `Bloodwork: crew ${"ABCD"[k]} (Inspiration4 ${b.id})`;
      const flags = bloodFlags(k);
      const total = BLOOD.panels.reduce((n, p) => n + p.analytes.length, 0);
      $("#bwK").innerHTML = kpi("Draws", BLOOD.timepoints.length, "", "3 before launch, 4 after landing", false)
        + kpi("Changed at landing", flags.length, `of ${total}`, flags.length ? flags.map((a) => a.label).join(", ") : "Nothing beyond normal variation or lab range", flags.length > 0);
      const labels = BLOOD.timepoints.map((t) => t.replace("L-", "−").replace("R+", "+"));
      for (const p of BLOOD.panels) for (const a of p.analytes) {
        const row = $(`[data-b="${a.key}"]`), st = bloodState(k, a);
        row.querySelector(".val").innerHTML = st.ret == null ? "–" : `${st.ret} <small>${esc(a.unit)}</small>`;
        const s = row.querySelector(".state");
        s.textContent = st.text;
        s.className = `state ${st.cls}`;
        row.querySelector(".chart").innerHTML = draws(st.vals, labels, { ref: a.ref, own: st.pre.length ? [Math.min(...st.pre), Math.max(...st.pre)] : null, flag: st.flagged });
      }
    },
  };

  PANELS.radiation = {
    mount(root) {
      const median = [...radDaily].sort((a, b) => a - b)[radDaily.length >> 1];
      root.innerHTML = `<h2>Radiation</h2><p class="lede">Measured radiation inside the ISS, from a detector in the Columbus module. Each mission day replays a real measured day. The globe shows where in orbit the dose comes from.</p>
        <div class="kpis" id="radK"></div>
        <h3 id="radH">Daily dose</h3><div class="charts" id="radChart"></div>
        <h3>Where it comes from</h3>
        <p>Over these ${radDaily.length} days the station spent about ${Math.round(RAD.saa.minutes_per_day)} minutes a day in the South Atlantic Anomaly, where Earth's inner radiation belt dips low over South America, and collected ${Math.round(RAD.saa.share * 100)}% of its dose there. The rest is mostly galactic cosmic rays and outer-belt particles at high latitudes. The marker on the globe flies the real track of ${esc(RAD.track_date)}.</p>
        <h3>By module (same detector type, Dec 2019)</h3><div class="bars" id="radMods">${(() => { const mx = Math.max(...RAD.modules.map((m) => m.dose)); return RAD.modules.map((m) => `<div class="row"><span>${esc(m.module)}</span><span class="track"><span class="fill ok" style="width:${((m.dose / mx) * 100).toFixed(1)}%;background:#6fa8f5"></span></span><span class="v">${Math.round(m.dose)} µGy/day</span></div>`).join(""); })()}</div>
        <p class="src">${esc(RAD.modules_source)} The most exposed module received about ${(RAD.modules[RAD.modules.length - 1].dose / RAD.modules[0].dose).toFixed(1)} times the dose of the least, a difference shielding and where crew sleep can use. Detectors sit at fixed spots, so this is the dose at that spot, not the whole module.</p>
        <div class="legend"><span>Dose rate</span><i style="background:linear-gradient(90deg,#5a9ef2,#80d1b8,#f0c259,#f06b5c)"></i><span>2 to 300+ µGy/h</span></div>
        <p class="src">${esc(RAD.source)} Daily dose: time-weighted average rate on days with at least 20 hours of readings (${radDaily.length} days, ${esc(radDates[0])} to ${esc(radDates[radDates.length - 1])}); median ${Math.round(median)} µGy a day, in line with DLR's published 250 to 290 µGy a day for this detector. This is absorbed dose in a silicon detector. NASA's career limit (600 mSv) is set in effective dose, a different quantity that accounts for radiation type and the body's own shielding, so the two are not compared here.</p>`;
    },
    update() {
      const d = today(), rate = radiation.rateAt();
      $("#radH").textContent = `Daily dose, last 60 days (today replays ${radDates[radDay(d)]})`;
      $("#radK").innerHTML = kpi("Today", Math.round(radToday()), "µGy", `Average day: ${Math.round(radMean)} µGy`, false)
        + kpi("Mission so far", (radTotal() / 1000).toFixed(1), "mGy", `${d + 1} days, absorbed`, false)
        + kpi("Rate now", rate.toFixed(1), "µGy/h", rate > 20 ? "Inside a high-dose region" : "Quiet part of the orbit", rate > 20)
        + kpi("180-day mission", ((radMean * 180) / 1000).toFixed(0), "mGy", "At the measured average rate", false);
      $("#radChart").innerHTML = bars(radSeries, { upTo: d, window: 60, unit: "µGy" });
    },
  };

  PANELS.clock = {
    mount(root) {
      root.innerHTML = `<h2 id="clkTitle"></h2><p class="lede">Each bead on the dial is one crew member's internal clock, simulated with the Forger-Jewett-Kronauer pacemaker model. The hand is local time. A bead riding with the hand is locked to the day; a slipping bead is drifting. The clock runs with the mission timeline.</p>
        <div class="field"><span>Cabin light</span>${seg("lux", [["100", "Dim"], ["300", "Normal"], ["1000", "Bright"]], S.clockLux)}</div>
        <div class="field"><span>Bright light for 2 h after waking</span>${seg("wake", [["0", "Off"], ["1", "On"]], S.brightWake ? "1" : "0")}</div>
        <div class="actions"><button class="btn quiet" data-act="clockReset">Restart from launch</button></div>
        <h3>Crew</h3><div class="chips" id="clkChips">${[0, 1, 2, 3].map((k) => `<button class="chip" data-crew="${k}" aria-pressed="${k === S.crewSel}"></button>`).join("")}</div>
        <details id="clkMars"><summary>What the model says about Mars time</summary><p>Under dim cabin light, a crew member whose clock runs short (23.9 h) never locks onto the 24 h 39 min sol and slips about 29 minutes a sol; normal light locks nearly everyone. Light late in the day keeps the clock where it was on Earth, while light early in the day can lock it 7 to 9 hours off, like a night shift. This matches the direction of a 2007 human study. Caveat from our own pre-registered check: this model locks more easily than we expected from that study, so treat the numbers as approximate.</p></details>
        <p class="src">Intrinsic periods are drawn around the measured human average of 24.18 h (Czeisler et al. 1999); the spread is an approximation. A model, not a measurement of anyone.</p>`;
      root.addEventListener("click", (e) => {
        const sb = e.target.closest("[data-seg] button");
        if (sb) {
          const n = sb.parentElement.dataset.seg;
          if (n === "lux") S.clockLux = +sb.dataset.v;
          if (n === "wake") S.brightWake = sb.dataset.v === "1";
          setPressed(root, "lux", S.clockLux); setPressed(root, "wake", S.brightWake ? "1" : "0");
          resetClock();
        }
        const cb = e.target.closest("[data-crew]");
        if (cb) selectCrew(+cb.dataset.crew);
        if (e.target.closest('[data-act="clockReset"]')) resetClock();
      });
    },
    update() {
      const ro = clock.readout();
      $("#clkTitle").textContent = `Body clock: ${S.destLabel}, day ${ro ? Math.floor(ro.days) + 1 : 1}`;
      $("#clkMars").hidden = S.dest !== "mars";
      if (!ro) return;
      document.querySelectorAll("#clkChips [data-crew]").forEach((b) => {
        const m = ro.members[+b.dataset.crew];
        b.setAttribute("aria-pressed", String(+b.dataset.crew === S.crewSel));
        b.textContent = `${m.id}: ${m.tau.toFixed(2)} h clock, ${m.ratePerDay == null ? "measuring" : m.locked ? "locked to the day" : `${m.ratePerDay > 0 ? "running early" : "running late"} ${Math.abs(m.ratePerDay * 60).toFixed(0)} min a day`}`;
      });
    },
  };

  PANELS.window = {
    mount(root) {
      root.innerHTML = `<h2>Destination</h2><p class="lede" id="winNote"></p>
        <div class="field"><span>Mission</span>${seg("dest", Object.entries(DESTINATIONS).map(([k, v]) => [k, v.label]), S.dest)}</div>
        <div class="kpis" id="winK"></div>
        <p class="src">Station orbit computed with SGP4 from CelesTrak orbital elements (epoch ${esc(gp[0].EPOCH.slice(0, 10))}); sunrises counted from the real eclipse geometry. Earth imagery: NASA Visible Earth. Moon and Mars textures: Solar System Scope (CC BY).</p>`;
      root.addEventListener("click", (e) => {
        const sb = e.target.closest('[data-seg="dest"] button');
        if (!sb) return;
        S.dest = sb.dataset.v; S.destLabel = DESTINATIONS[S.dest].label;
        setPressed(root, "dest", S.dest);
        outside.show(S.dest);
        resetClock();
        refresh();
      });
    },
    update() {
      $("#winNote").textContent = DESTINATIONS[S.dest].note;
      $("#winK").innerHTML = S.dest === "iss"
        ? kpi("Orbit", iss.periodMin.toFixed(1), "min", "Per lap of Earth", false) + kpi("Sunrises", String(sunrises), "a day", "From real eclipse geometry", false)
        : kpi("Day length", S.dest === "mars" ? "24 h 39 min" : "29.5 days", "", S.dest === "mars" ? "One sol" : "One lunar day", false) + kpi("Cabin day", "24", "h", "Set by habitat lighting", false);
    },
  };

  // ---------------- experiments ----------------
  const STEP_NAMES = ["Set up", "Randomize and lock", "Run", "Result"];
  PANELS.experiments = {
    mount(root) {
      root.innerHTML = `<h2>Self-experiment</h2><p class="lede">Test whether a change in routine actually helps, fairly, on your own body.</p>
        <div class="steps" id="expSteps"></div><div id="expBody"></div>
        <details id="expNumbers"><summary>Charts: odds, data and estimate</summary><div class="charts" id="expCharts"></div></details>`;
      root.querySelector("#expSteps").addEventListener("click", (e) => { const b = e.target.closest("[data-step]"); if (b && !b.disabled) goStep(+b.dataset.step); });
      root.querySelector("#expNumbers").addEventListener("toggle", () => updateCharts());
      mountStep();
    },
    update() { updateStep(); },
  };
  function goStep(n) {
    E.step = n; E.maxStep = Math.max(E.maxStep, n);
    if (S.tab === "experiments") { mountStep(); updateStep(); rig.go(viewFor("experiments")); }
  }
  function mountStep() {
    const steps = $("#expSteps");
    if (!steps) return;
    steps.innerHTML = STEP_NAMES.map((l, i) => `<button type="button" data-step="${i + 1}" ${E.step === i + 1 ? 'aria-current="step"' : ""} class="${i + 1 < E.step ? "done" : ""}" ${i + 1 > E.maxStep ? "disabled" : ""}>${i + 1}. ${l}</button>`).join("");
    const old = $("#expBody");
    const body = old.cloneNode(false); // fresh element, so listeners never stack
    old.replaceWith(body);
    const iv = intervention();
    if (E.step === 1) {
      body.innerHTML = `
        <label class="field"><span>The change</span><select data-in="intervention">${Object.entries(INTERVENTIONS).map(([k, v]) => `<option value="${k}" ${k === E.intervention ? "selected" : ""}>${v.label}</option>`).join("")}</select></label>
        <div class="field"><span>Compared with</span><div id="expControl">${esc(iv.control)}</div></div>
        <label class="field"><span>Measured by</span><select data-in="outcome" id="expOutcome"></select></label>
        <label class="field"><span id="expDeltaLabel"></span><input type="number" data-in="delta" min="0" value="${E.delta}"/></label>
        <div class="field"><span>How fast does it act? (your judgment)</span>${seg("speed", [["day", "Within a day"], ["days", "Over several days"]], E.speed)}</div>
        <div class="field"><span>Who runs it</span>${seg("who", [["solo", "One person"], ["crew", "Whole crew (4)"]], E.crewMode ? "crew" : "solo")}</div>
        <div class="field"><span>Truth</span>${seg("mode", [["hidden", "Hidden (practice game)"], ["practice", "I set it"]], E.mode)}</div>
        <label class="field" id="expPractice"><span id="expPracticeLabel"></span><input type="range" data-in="practice" min="-2" max="4" step="0.25" value="${E.practiceMult}"/></label>
        <div class="field" id="expNoise"><span>Daily ups and downs</span>${seg("noise", [["sim", "Simulated from 49 people"], ["real", "One real diary (28 days)"]], E.noise)}</div>
        <p id="expDesign"></p>
        <div class="actions"><button class="btn" data-act="toRandomize">Next: randomize the schedule</button></div>`;
      fillOutcomeOptions();
    } else if (E.step === 2) {
      body.innerHTML = `<p>The schedule decides by chance which days get "${esc(iv.label.toLowerCase())}" (B) and which keep "${esc(iv.control.toLowerCase())}" (A). Chance is what makes the answer fair. Once locked, the plan cannot change.</p>
        <div class="actions"><button class="btn" data-act="randomize">Randomize</button><button class="btn quiet" data-act="lock">Lock the plan</button><button class="btn quiet" data-act="save">Save the plan</button></div>
        <p id="expRand"></p><div class="actions"><button class="btn" data-act="toRun" id="expToRun">Next: run</button></div>`;
    } else if (E.step === 3) {
      body.innerHTML = `<p>The experiment runs on the mission timeline: one experiment day per mission day. The cloud in the chamber shows what the data allow; each dot is one possible value of the true change.</p>
        <div class="actions"><button class="btn" data-act="start" id="expStart">Start</button><button class="btn quiet" data-act="skip" id="expSkip">Skip to the end</button></div>
        <p id="expDay"></p><div id="expProbs"></div>`;
    } else {
      body.innerHTML = `<div id="expResult"></div><div class="actions"><button class="btn" data-act="again">Run another</button><button class="btn quiet" data-act="change">Change the test</button></div>`;
    }
    bindExp(body);
    if (E.step === 4) renderResult();
  }
  function fillOutcomeOptions() {
    const sel = $("#expOutcome");
    if (sel) sel.innerHTML = intervention().outcomes.map((k) => `<option value="${k}" ${k === E.outcomeKey ? "selected" : ""}>${OUTCOMES[k].label}</option>`).join("");
  }
  let lastProbsDay = -1;
  function updateStep() {
    if (S.tab !== "experiments") return;
    const o = outcome(), d = design();
    if (E.step === 1 && $("#expDesign")) {
      $("#expControl").textContent = intervention().control;
      $("#expDeltaLabel").textContent = `Smallest change worth acting on (${o.unit})`;
      $("#expPractice").hidden = E.mode !== "practice";
      $("#expPracticeLabel").textContent = `True change: ${(E.practiceMult * E.delta).toFixed(2)} ${o.unit}`;
      $("#expNoise").hidden = !(realSeriesFor(E.outcomeKey) && !E.crewMode);
      const pw = E.power ? Math.round(E.power.worth.at(-1).pRight * 100) : null;
      $("#expDesign").innerHTML = `<b>Design:</b> ${esc(d.name)}. ${esc(d.why)} ${pw === null ? "Working out the odds." : `If the real change is 1.5 times your smallest worthwhile change, this ${E.days}-day experiment gives a clear answer <b>${pw}%</b> of the time.`} Typical day-to-day spread: ${o.fmtDelta(o.sd)} (${o.people} people).`;
    }
    if (E.step === 2 && $("#expRand")) {
      const rb = $('[data-act="randomize"]'), lb = $('[data-act="lock"]');
      rb.disabled = E.locked || E.randomizing;
      rb.textContent = E.mission ? "Randomize again" : "Randomize";
      lb.disabled = !E.mission || E.locked || E.randomizing;
      lb.textContent = E.locked ? "Plan locked" : "Lock the plan";
      $('[data-act="save"]').disabled = !E.locked;
      $("#expToRun").hidden = !E.locked;
      $("#expRand").textContent = E.randomizing ? "Tokens are drifting to their days. Click one to give it a nudge." : E.mission ? (E.locked ? "Locked. The schedule and the rules for the verdict are fixed." : "Every token is on its day. Lock the plan when ready.") : "";
    }
    if (E.step === 3 && $("#expDay")) {
      const room = H.days - 1 - today();
      $("#expStart").disabled = E.started || room < E.days;
      $("#expStart").textContent = E.started ? "Running" : "Start";
      $("#expSkip").disabled = !E.started || E.day >= E.days;
      $("#expDay").textContent = E.started ? `Experiment day ${E.day} of ${E.days} (mission day ${today()}).${S.playing ? "" : " Press Play on the timeline to continue."}` : room < E.days ? `Only ${room} mission days remain; this experiment needs ${E.days}.` : `Starts on mission day ${today()} and ends on day ${today() + E.days}.`;
      if (E.day !== lastProbsDay) { lastProbsDay = E.day; $("#expProbs").innerHTML = probsHTML(); updateCharts(); }
    }
  }
  function probsHTML() {
    const bar = (label, p, color, extra = "") => `<div class="row"><span>${label}</span><span class="track"><span class="fill ok" style="width:${(p * 100).toFixed(1)}%;background:${color}"></span></span><span class="v">${Math.round(p * 100)}%${extra}</span></div>`;
    if (E.crew && E.crew.pooled) {
      return `<h3>Chance it works, with the crew (alone in brackets)</h3><div class="bars">${[0, 1, 2, 3].map((k) => bar(`Crew ${"ABCD"[k]}`, E.crew.pooled[k].v.pWork, "#6fa8f5", ` <span class="src">(${Math.round(E.crew.last[k].v.pWork * 100)}%)</span>`)).join("")}</div>`;
    }
    const v = E.last?.v;
    if (!v) return "";
    return `<h3>What the evidence says so far</h3><div class="bars">${bar("Works", v.pWork, "#6fa8f5")}${bar("Too small", v.pNone, "#93a1b0")}${bar("Backfires", v.pHarm, "#ef6a5c")}</div><p class="src">The verdict needs ${Math.round(E.thr * 100)}% and is read once, on day ${E.days}.</p>`;
  }
  function bindExp(body) {
    body.addEventListener("click", (e) => {
      const sb = e.target.closest("[data-seg] button");
      if (sb) {
        const n = sb.parentElement.dataset.seg, v = sb.dataset.v;
        if (n === "speed") { E.speed = v; requestPower(); }
        if (n === "mode") E.mode = v;
        if (n === "who") { E.crewMode = v === "crew"; syncDays(); requestPower(); }
        if (n === "noise") { E.noise = v; syncDays(); requestPower(); }
        setPressed(body, "speed", E.speed); setPressed(body, "mode", E.mode); setPressed(body, "who", E.crewMode ? "crew" : "solo"); setPressed(body, "noise", E.noise);
        updateStep();
        return;
      }
      const a = e.target.closest("[data-act]");
      if (!a || a.disabled) return;
      const act = a.dataset.act;
      if (act === "toRandomize") goStep(2);
      if (act === "randomize") randomize();
      if (act === "lock") { E.locked = true; updateStep(); renderTimeline(); }
      if (act === "save") downloadJSON(buildPrereg({ ...E, destLabel: S.destLabel }, outcome(), intervention(), design()), `sol-lab-plan-${E.seed}.json`);
      if (act === "toRun") goStep(3);
      if (act === "start") { E.started = true; E.startDay = today(); S.playing = true; updateStep(); renderTimeline(); }
      if (act === "skip") skipExperiment();
      if (act === "again") newExperiment(true);
      if (act === "change") newExperiment(false);
    });
    body.addEventListener("change", (e) => {
      const k = e.target.dataset.in;
      if (!k) return;
      if (k === "intervention") {
        E.intervention = e.target.value;
        const iv = INTERVENTIONS[E.intervention];
        if (!iv.outcomes.includes(E.outcomeKey)) E.outcomeKey = iv.outcomes[0];
        E.speed = iv.speed;
        E.delta = OUTCOMES[E.outcomeKey].delta;
        fillOutcomeOptions();
        setPressed(body, "speed", E.speed);
        body.querySelector('[data-in="delta"]').value = E.delta;
      }
      if (k === "outcome") { E.outcomeKey = e.target.value; E.delta = OUTCOMES[E.outcomeKey].delta; body.querySelector('[data-in="delta"]').value = E.delta; }
      if (k === "delta") E.delta = Math.max(0.01, +e.target.value || OUTCOMES[E.outcomeKey].delta);
      if (k === "practice") E.practiceMult = +e.target.value;
      syncDays();
      evidence.setRange({ delta: E.delta, sd: outcome().sd });
      if (k !== "practice") requestPower();
      updateStep();
    });
    body.addEventListener("input", (e) => {
      if (e.target.dataset.in === "practice") { E.practiceMult = +e.target.value; updateStep(); }
    });
  }
  function trueEffect() { return E.mode === "hidden" ? drawMysteryEffect(E.seed, E.delta) : E.practiceMult * E.delta; }
  function randomize() {
    E.seed = Math.floor(Math.random() * 1e6) + 1;
    syncDays();
    if (E.crewMode) {
      const base = trueEffect(), r = mulberry32(E.seed ^ 0x9e3779b9);
      const effects = [0, 1, 2, 3].map(() => base + 0.5 * E.delta * normal(r));
      const missions = effects.map((ef, k) => buildMission({ seed: E.seed + 7919 * (k + 1), days: E.days, outcome: outcome(), design: design(), trueEffect: ef }));
      E.crew = { effects, missions, last: [], pooled: null, hist: [[], [], [], []] };
      E.member = S.crewSel;
      E.mission = missions[E.member];
    } else {
      E.crew = null;
      E.mission = buildMission({ seed: E.seed, days: E.days, outcome: outcome(), design: design(), trueEffect: trueEffect(), baseSeries: E.noise === "real" ? realSeriesFor(E.outcomeKey) : null });
    }
    E.day = 0; E.history = []; E.last = null; E.randomizing = true; lastProbsDay = -1;
    evidence.setRange({ delta: E.delta, sd: outcome().sd });
    evidence.setPosterior(priorAsPosterior(E.mission.prior));
    board.highlightDay(null);
    board.randomize(E.mission.schedule, { instant: reduced, onDone: () => { E.randomizing = false; updateStep(); } });
    updateStep();
  }
  function advanceExperimentDay() {
    if (!E.mission || E.day >= E.days) return;
    E.day++;
    if (E.crew) {
      E.crew.missions.forEach((m, k) => { const a = analyseDay(m, E.day, E.delta, E.thr); E.crew.last[k] = a; E.crew.hist[k].push(a); });
      if (E.crew.last.every((a) => a.ci)) {
        const est = E.crew.last.map((a) => a.mean), se = E.crew.last.map((a) => (a.ci[1] - a.ci[0]) / 3.92);
        E.crew.pooled = poolCrew(est, se, E.delta).map((q) => ({ ...q, v: pooledVerdict(q, { delta: E.delta, thr: E.thr }) }));
      }
      E.history = E.crew.hist[E.member];
      const a = E.crew.last[E.member];
      if (a.post) { E.last = a; evidence.setPosterior(a.post); }
    } else {
      const a = analyseDay(E.mission, E.day, E.delta, E.thr);
      E.history.push(a);
      if (a.post) { E.last = a; evidence.setPosterior(a.post); }
    }
    board.highlightDay(E.day - 1);
    if (E.day >= E.days) finishExperiment();
  }
  function skipExperiment() {
    while (E.started && E.day < E.days) { S.met = Math.min(H.days - 1, Math.floor(S.met) + 1); lastDay = today(); advanceExperimentDay(); }
    refresh();
  }
  function finishExperiment() {
    E.started = false;
    E.done = true;
    if (S.tab !== "experiments") showTab("experiments");
    goStep(4);
  }
  function renderResult() {
    const el = $("#expResult");
    if (!el || !E.mission) return;
    const o = outcome();
    const words = { works: "works", none: "no meaningful change", harms: "backfires", inconclusive: "not settled" };
    if (E.crew && E.crew.pooled) {
      let rightP = 0, rightA = 0, wrongP = 0;
      const rows = [0, 1, 2, 3].map((k) => {
        const truth = truthLabel(E.crew.missions[k], E.delta), pv = E.crew.pooled[k].v.label, av = E.crew.last[k].v.label;
        if (pv !== "inconclusive" && pv === truth) rightP++;
        if (pv !== "inconclusive" && pv !== truth) wrongP++;
        if (av !== "inconclusive" && av === truth) rightA++;
        const ef = E.crew.effects[k];
        return `<tr><td>${"ABCD"[k]}</td><td>${o.fmtDelta(Math.abs(ef))} ${ef >= 0 ? "better" : "worse"}</td><td><b>${words[pv]}</b></td><td>${words[av]}</td></tr>`;
      }).join("");
      el.innerHTML = `<p class="verdict">${rightP} of 4 settled correctly with the crew</p><p>Alone, ${rightA} of 4. ${wrongP ? `${wrongP} wrong call${wrongP > 1 ? "s" : ""}; the threshold keeps that rare.` : "No wrong calls."}</p>
        <table class="grid"><thead><tr><th>Crew</th><th>Hidden truth</th><th>With crew</th><th>Alone</th></tr></thead><tbody>${rows}</tbody></table>`;
      if (rightP) celebrate();
      return;
    }
    const v = E.last?.v, verdict = v ? v.label : "inconclusive", truth = truthLabel(E.mission, E.delta);
    const right = verdict !== "inconclusive" && verdict === truth;
    el.innerHTML = `<p class="verdict">Verdict on day ${E.days}: ${words[verdict]}</p>
      ${E.mode === "hidden" ? `<p>Hidden truth: ${o.fmtDelta(Math.abs(E.mission.trueEffect))} ${E.mission.trueEffect >= 0 ? "better" : "worse"} ("${truth === "inconclusive" ? "in between" : words[truth]}").</p>` : ""}
      <p>${verdict === "inconclusive" ? `${E.days} days were not enough to settle it. That is common for one person: day-to-day spread is large compared with most real effects. Running it as a crew, a longer run, a quieter measure, or a change that acts within a day would help.` : right ? "The verdict matches the truth." : "This is the rare wrong call the threshold allows."}</p>
      ${E.mission.real ? `<p class="src">The day-to-day ups and downs were one real person's sleep diary; only the hidden change was added.</p>` : ""}`;
    if (right) celebrate();
  }
  function newExperiment(keep) {
    Object.assign(E, { mission: null, crew: null, locked: false, started: false, done: false, startDay: null, day: 0, history: [], last: null });
    lastProbsDay = -1;
    board.clear(); board.highlightDay(null);
    evidence.setPosterior(priorAsPosterior(buildMission({ seed: 1, days: E.days, outcome: outcome(), design: design(), trueEffect: 0 }).prior), { snap: true });
    E.maxStep = keep ? 2 : 1;
    goStep(keep ? 2 : 1);
    renderTimeline();
  }
  function updateCharts() {
    const d = $("#expNumbers");
    if (!d || !d.open) return;
    $("#expCharts").innerHTML = `<h3>Will this design give a clear answer?</h3>${powerChart(E.power, E.days)}<h3>Logged values</h3>${dataChart(E.mission, E.day, outcome())}<h3>How the estimate settles</h3>${effectChart(E.history, E.delta, outcome(), E.days)}`;
  }

  // ---------------- crew selection ----------------
  function selectCrew(k) {
    S.crewSel = k;
    clock.select(k);
    if (E.crew) {
      E.member = k; E.mission = E.crew.missions[k]; E.history = E.crew.hist[k]; E.last = E.crew.last[k] || null;
      if (E.last && E.last.post) evidence.setPosterior(E.last.post); else evidence.setPosterior(priorAsPosterior(E.mission.prior));
      board.randomize(E.mission.schedule, { instant: true });
      board.highlightDay(E.day ? E.day - 1 : null);
      lastProbsDay = -1;
    }
    refresh();
  }

  // ---------------- crew report ----------------
  function downloadReport() {
    const i = idx(), d = today(), e = H.env;
    const rows = H.crew.map((c, k) => `<tr><td>${c.id}</td>${METRICS.map((m) => { const st = metricState(k, m); return `<td class="${st.cls}">${st.v.toFixed(m.d)} ${m.unit}</td>`; }).join("")}</tr>`).join("");
    const nutr = H.crew.map((c) => {
      const last = c.meals.slice(Math.max(0, i - 13), i + 1), avg = (key) => Math.round(last.reduce((a, x) => a + x[key], 0) / last.length);
      return `<tr><td>${c.id}</td><td>${avg("kcal")} kcal</td><td>${avg("protein_g")} g</td><td>${avg("vitamin_d_IU")} IU</td><td>${avg("calcium_mg")} mg</td><td>${avg("sodium_mg")} mg</td></tr>`;
    }).join("");
    const blood = H.crew.map((c, k) => `<tr><td>${c.id}</td><td>${esc(bloodFor(k).id)}</td><td>${bloodFlags(k).map((a) => esc(a.label)).join(", ") || "none"}</td></tr>`).join("");
    const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Sol Lab crew report, mission day ${d}</title>
<style>body{font:14px/1.45 system-ui,sans-serif;max-width:900px;margin:32px auto;padding:0 16px;color:#111}h1{font-size:22px}h2{font-size:16px;margin-top:28px}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #ddd;padding:6px;text-align:left}.out{color:#a05a00;font-weight:600}.expected{color:#1d5fa8}.src{color:#666;font-size:12px}</style>
<h1>Crew health report, mission day ${d}</h1><p class="src">Generated by Sol Lab on ${new Date().toISOString().slice(0, 10)}. Simulated mission built on real data; sources below. Not a medical device.</p>
<h2>Vitals and sleep today</h2><table><tr><th>Crew</th>${METRICS.map((m) => `<th>${m.name}</th>`).join("")}</tr>${rows}</table>
<p class="src">Amber: outside that person's own pre-flight range. Blue: an expected in-flight change.</p>
<h2>Cabin air</h2><table><tr><th>CO2</th><th>7-day CO2</th><th>Headache risk</th><th>Temperature</th><th>Humidity</th><th>Peak 1-hour CO2</th></tr><tr><td>${e.co2[i].toFixed(1)} mmHg</td><td>${e.co2_7d[i].toFixed(2)} mmHg</td><td>${(e.headache[i] * 100).toFixed(1)}%</td><td>${e.temp[i].toFixed(1)} °C</td><td>${e.rh[i].toFixed(0)}%</td><td>${e.peak1h[i].toFixed(1)} mmHg</td></tr></table>
<h2>Radiation</h2><p>Today ${Math.round(radToday())} µGy; mission total ${(radTotal() / 1000).toFixed(1)} mGy absorbed (real ISS DOSTEL-1 readings; today replays ${esc(radDates[radDay(d)])}).</p>
<h2>Nutrition, last 14 days (average per day)</h2><table><tr><th>Crew</th><th>Energy</th><th>Protein</th><th>Vitamin D (target 1000)</th><th>Calcium (target 1000 to 1200)</th><th>Sodium (1500 to 2300)</th></tr>${nutr}</table>
<h2>Bloodwork at landing (real Inspiration4 crew data)</h2><table><tr><th>Crew</th><th>Participant</th><th>Changed beyond normal variation or lab range</th></tr>${blood}</table>
<h2>Sources</h2><p class="src">Sleep: Baigutanova et al. 2025 (CC BY). Radiation: ${esc(RAD.source)} Bloodwork: ${esc(BLOOD.source)} Nutrients: USDA FoodData Central SR Legacy. Limits and targets: NASA-STD-3001, NASA JSC-67378, Law et al. 2014.</p></html>`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    a.download = `crew-report-day-${d}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ---------------- keyboard ----------------
  addEventListener("keydown", (e) => {
    const t = e.target instanceof Element ? e.target : document.body;
    if (t.closest("input, select, textarea") || e.ctrlKey || e.metaKey || e.altKey) return;
    const n = Number(e.key);
    if (n >= 1 && n <= TABS.length) { showTab(TABS[n - 1][0]); return; }
    if (e.key === " " && !t.closest("button")) { e.preventDefault(); if (today() < H.days - 1) S.playing = !S.playing; refresh(); return; }
    if ((e.key === "ArrowRight" || e.key === "ArrowLeft") && !S.playing) {
      S.met = Math.max(0, Math.min(H.days - 1, Math.floor(S.met) + (e.key === "ArrowRight" ? 1 : -1)));
      refresh();
    }
  });

  // ---------------- timeline and status ----------------
  const tl = $("#timeline");
  tl.innerHTML = `<div class="crew"><span>Crew</span>${[0, 1, 2, 3].map((k) => `<button type="button" data-crew="${k}" aria-label="Crew ${"ABCD"[k]}">${"ABCD"[k]}</button>`).join("")}</div>
    <button type="button" class="play" id="tlPlay">Play</button>
    ${seg("tlSpeed", [["0.25", "¼ day/s"], ["1", "1 day/s"], ["4", "4 days/s"], ["10", "10 days/s"]], S.speed)}
    <div class="track" id="tlTrack"><div class="done"></div><div class="exp" hidden></div><div class="head"></div></div>
    <div class="label" id="tlLabel"></div>`;
  tl.addEventListener("click", (e) => {
    const c = e.target.closest("[data-crew]");
    if (c) return selectCrew(+c.dataset.crew);
    if (e.target.closest("#tlPlay")) { if (today() < H.days - 1) S.playing = !S.playing; refresh(); return; }
    const sb = e.target.closest('[data-seg="tlSpeed"] button');
    if (sb) { S.speed = +sb.dataset.v; setPressed(tl, "tlSpeed", S.speed); }
  });
  function renderTimeline() {
    tl.querySelectorAll("[data-crew]").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.crew === S.crewSel)));
    $("#tlPlay").textContent = S.playing ? "Pause" : today() >= H.days - 1 ? "End" : "Play";
    const frac = (d) => `${Math.min(100, (d / (H.days - 1)) * 100).toFixed(2)}%`;
    $("#tlTrack .done").style.width = frac(S.met);
    $("#tlTrack .head").style.left = frac(S.met);
    const ex = $("#tlTrack .exp");
    const showExp = E.mission && (E.started || E.done) && E.startDay != null;
    ex.hidden = !showExp;
    if (showExp) { ex.style.left = frac(E.startDay); ex.style.width = `${Math.min(100, (E.days / (H.days - 1)) * 100).toFixed(2)}%`; }
    $("#tlLabel").innerHTML = `Mission day <b>${today()}</b> of ${H.days - 1}`;
  }
  const statusEl = $("#status");
  function renderStatus() {
    statusEl.innerHTML = `<span>${esc(S.destLabel)}</span><span>Crew <b>${"ABCD"[S.crewSel]}</b></span><span>Day <b>${today()}</b></span>`;
  }

  // ---------------- clock ----------------
  function resetClock() { clock.reset({ dayHours: DESTINATIONS[S.dest].dayHours, lux: S.clockLux, brightWake: S.brightWake, selected: S.crewSel }); }

  // ---------------- picking ----------------
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let downAt = null;
  renderer.domElement.addEventListener("pointerdown", (e) => { downAt = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener("click", (e) => {
    if (downAt && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const tok = ray.intersectObjects(board.tokenMeshes(), false)[0];
    if (tok) { board.poke(tok.object, ray.ray.direction.clone().applyQuaternion(board.group.quaternion.clone().invert())); return; }
    const hit = ray.intersectObjects([evidence.group, clock.group, board.group, medical.group, galley.group, air.group, radiation.group], true)[0];
    if (!hit) return;
    let o = hit.object;
    while (o && !["evidence", "clock", "board", "medical", "galley", "air", "radiation"].includes(o.name)) o = o.parent;
    if (!o) return;
    const tab = o.name === "evidence" || o.name === "board" ? "experiments" : o.name;
    if (tab !== S.tab) showTab(tab);
  });

  // ---------------- celebration ----------------
  const confetti = [];
  function celebrate() {
    if (reduced) return;
    const cols = [0x6fa8f5, 0xf6f6f1, 0xc28a1e, 0x1d3f72];
    for (let k = 0; k < 50; k++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.012), new THREE.MeshStandardMaterial({ color: cols[k % 4], side: THREE.DoubleSide, roughness: 0.6 }));
      m.position.copy(evidence.group.position).add(new THREE.Vector3(-0.25, 0.35, 0));
      m.userData = { v: new THREE.Vector3((Math.random() - 0.8) * 0.8, (Math.random() - 0.3) * 0.6, (Math.random() - 0.5) * 0.8), w: new THREE.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6), life: 5 };
      scene.add(m);
      confetti.push(m);
    }
  }

  // ---------------- start ----------------
  evidence.setRange({ delta: E.delta, sd: outcome().sd });
  evidence.setPosterior(priorAsPosterior(buildMission({ seed: 1, days: E.days, outcome: outcome(), design: design(), trueEffect: 0 }).prior), { snap: true });
  outside.show(S.dest);
  resetClock();
  requestPower();
  showTab("overview");
  renderTimeline();
  renderStatus();
  setTimeout(() => $("#loading").classList.add("gone"), 200);

  // ---------------- loop ----------------
  let lastDay = today(), simT = 0, prevTs = null, fpsT = 0, fpsN = 0, lowered = false, uiT = 0;
  function frame(ts) {
    const dt = prevTs == null ? 0 : Math.min((ts - prevTs) / 1000, 0.1);
    prevTs = ts;
    tick(dt, true);
    requestAnimationFrame(frame);
  }
  function tick(dt, draw) {
    simT += dt;
    if (S.playing) {
      S.met = Math.min(H.days - 1, S.met + dt * S.speed);
      clock.advance(dt * S.speed * 24);
      if (S.met >= H.days - 1) S.playing = false;
    }
    while (lastDay < today()) {
      lastDay++;
      if (E.started) advanceExperimentDay();
    }
    S.simHours += (dt * (S.tab === "window" ? 90 : 20)) / 3600;
    if (S.dest === "iss") {
      const st = issState(iss, new Date(issEpoch.getTime() + S.simHours * 3600e3));
      if (st) outside.orientEarth(st.lat, st.lon, st.sunEcf);
    } else outside.updateBody(S.dest, S.simHours * 60, DESTINATIONS[S.dest].dayHours);
    const d = today(), i = idx(), c = H.crew[S.crewSel];
    const st = (k) => metricState(S.crewSel, METRICS[k]).cls;
    medical.update(dt, { id: c.id, day: d, hr: c.hr[i], rmssd: c.rmssd[i], temp: c.temp[i], sleep: c.sleepDuration[i], latency: c.sleepLatency[i], eff: c.sleepEfficiency[i],
      hrNote: st(0) === "out" ? "outside usual range" : "", rmssdNote: st(1) === "out" ? "outside usual range" : "", tempNote: st(2) === "expected" ? "expected in flight" : "", sleepNote: st(3) === "out" ? "outside usual range" : "" });
    air.update(dt, { co2: H.env.co2[i], co2_7d: H.env.co2_7d[i], temp: H.env.temp[i], rh: H.env.rh[i], peak1h: H.env.peak1h[i], date: H.env.date[i], mission: H.env.mission[i], day: d });
    galley.update(dt, { id: c.id, day: d, meal: c.meals[i] });
    radiation.update(dt, { today: radToday(), total: radTotal() });
    clock.render();
    evidence.update(dt, simT);
    board.update(dt);
    for (let k = confetti.length - 1; k >= 0; k--) {
      const m = confetti[k];
      m.position.addScaledVector(m.userData.v, dt);
      m.rotation.x += m.userData.w.x * dt; m.rotation.y += m.userData.w.y * dt;
      m.userData.v.multiplyScalar(1 - 0.35 * dt);
      m.userData.life -= dt;
      if (m.userData.life <= 0) { scene.remove(m); m.geometry.dispose(); m.material.dispose(); confetti.splice(k, 1); }
    }
    uiT += dt;
    if (uiT > 0.25) { uiT = 0; refresh(); }
    rig.update();
    if (draw) composer.render(dt);
    fpsT += dt; fpsN++;
    if (fpsT > 3) {
      const fps = fpsN / fpsT;
      if (fps < 32 && !lowered && R.gtao) { R.gtao.enabled = false; renderer.setPixelRatio(1); R.onResize(); lowered = true; }
      window.__solFps = fps;
      fpsT = 0; fpsN = 0;
    }
  }
  requestAnimationFrame(frame);

  // ---------------- development hooks ----------------
  window.__sol = { S, E, H, showTab, goStep, selectCrew };
  if (import.meta.env.DEV) {
    window.__solAdvance = (seconds, step = 1 / 60) => { for (let k = 0; k < seconds / step; k++) tick(step, false); return E.day; };
    const auto = new URLSearchParams(location.search).get("auto");
    if (auto) {
      window.__solInstant = true;
      const click = (sel) => { const el = $(sel); if (el && !el.disabled) el.click(); };
      const adv = window.__solAdvance;
      const settle = () => { let k = 0; while (E.randomizing && k < 60) { adv(0.5); k++; } };
      const setup = (crew) => { showTab("experiments"); if (crew) { E.crewMode = true; syncDays(); } click('[data-act="toRandomize"]'); click('[data-act="randomize"]'); };
      const steps = {
        overview: () => { S.met = 40; refresh(); },
        medical: () => { S.met = 60; showTab("medical"); },
        air: () => { S.met = 60; refresh(); showTab("air"); },
        galley: () => { S.met = 60; showTab("galley"); },
        bloodwork: () => { S.crewSel = 1; showTab("bloodwork"); },
        radiation: () => { S.met = 60; refresh(); showTab("radiation"); },
        clock: () => { S.dest = "mars"; S.destLabel = DESTINATIONS.mars.label; S.clockLux = 100; resetClock(); showTab("clock"); clock.advance(24 * 9); },
        window: () => showTab("window"),
        mars: () => { S.dest = "mars"; S.destLabel = DESTINATIONS.mars.label; outside.show("mars"); showTab("window"); },
        setup: () => showTab("experiments"),
        rand: () => { setup(false); adv(1.7); },
        crewrun: () => { setup(true); settle(); click('[data-act="lock"]'); click('[data-act="toRun"]'); click('[data-act="start"]'); S.speed = 4; adv(6); S.playing = false; refresh(); },
        crew: () => { setup(true); settle(); click('[data-act="lock"]'); click('[data-act="toRun"]'); click('[data-act="start"]'); click('[data-act="skip"]'); },
        result: () => { setup(false); settle(); click('[data-act="lock"]'); click('[data-act="toRun"]'); click('[data-act="start"]'); click('[data-act="skip"]'); setTimeout(() => { const d = $("#expNumbers"); if (d) { d.open = true; updateCharts(); } }, 300); },
      };
      setTimeout(() => { steps[auto] && steps[auto](); }, 1200);
    }
    window.__solShot = async (name = "shot") => {
      composer.render(0);
      const url = renderer.domElement.toDataURL("image/jpeg", 0.9);
      await fetch(`/__shot?name=${encodeURIComponent(name)}`, { method: "POST", body: url });
      return "saved";
    };
  }
}

boot().catch((err) => {
  console.error(err);
  loadingText.textContent = `Something failed while loading: ${err.message}. Reload the page; if it keeps failing, add ?q=low to the address.`;
});
