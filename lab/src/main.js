import "./styles.css";
import * as THREE from "three";
import { createRenderer } from "./scene/renderer.js";
import { makeMaterials } from "./scene/materials.js";
import { buildModule, buildFloaters, W } from "./scene/module.js";
import { buildEvidence, priorAsPosterior } from "./scene/evidence.js";
import { buildClock } from "./scene/clock.js";
import { buildBoard } from "./scene/board.js";
import { buildOutside } from "./scene/window.js";
import { createCameraRig } from "./scene/cameraRig.js";
import { loadOutcomes, INTERVENTIONS, DESTINATIONS } from "./sim/presets.js";
import { recommendDesign, drawMysteryEffect, buildMission, analyseDay, truthLabel } from "./sim/mission.js";
import { makeISS, issState, countSunrises } from "./sim/orbit.js";
import { renderNumbers } from "./ui/numbers.js";
import { poolCrew, pooledVerdict } from "./engine/pooling.js";
import { mulberry32, normal } from "./engine/rng.js";
import { buildPrereg, downloadJSON } from "./ui/prereg.js";

const $ = (s) => document.querySelector(s);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const loadingText = $("#loadingText");

async function boot() {
  loadingText.textContent = "Loading crew data";
  await Promise.all([document.fonts.load('64px "Permanent Marker"'), document.fonts.load('600 16px "Archivo"')]);
  const [realNoise, gp] = await Promise.all([
    fetch("/data/real_noise.json").then((r) => r.json()),
    fetch("/data/iss_gp.json").then((r) => r.json()),
  ]);
  const OUTCOMES = loadOutcomes(realNoise);
  const iss = makeISS(gp[0]);
  const issEpoch = new Date(gp[0].EPOCH + "Z");
  const sunrises = countSunrises(iss, issEpoch, 24, 20);
  // Open on the nearest real daylight pass of this orbit (the epoch itself falls on the night side).
  let dayStartHours = 0;
  for (let m = 0; m < 240; m++) {
    const st = issState(iss, new Date(issEpoch.getTime() + m * 60e3));
    if (!st || st.inShadow) continue;
    const up = { x: Math.cos(st.lat) * Math.cos(st.lon), y: Math.cos(st.lat) * Math.sin(st.lon), z: Math.sin(st.lat) };
    if (up.x * st.sunEcf.x + up.y * st.sunEcf.y + up.z * st.sunEcf.z > 0.55) { dayStartHours = m / 60; break; }
  }

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
  const floaters = buildFloaters(mats);
  scene.add(floaters.group);
  const outside = buildOutside({ earthDay, earthNight, moon: moonT, mars: marsT });
  scene.add(outside.group);

  const evidence = buildEvidence(mats);
  evidence.group.position.set(W - 0.44, -0.04, -1.9);
  evidence.group.rotation.y = -Math.PI / 2;
  evidence.setMotion(reduced);
  scene.add(evidence.group);

  const clock = buildClock(mats);
  clock.group.position.set(W - 0.05, 0.08, 1.95);
  clock.group.rotation.y = -Math.PI / 2;
  scene.add(clock.group);

  const board = buildBoard(mats);
  board.group.position.set(-W + 0.07, 0.04, 0.55);
  board.group.rotation.y = Math.PI / 2;
  scene.add(board.group);

  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const views = {
    // Each view aims a little below its station so the station sits in the upper part of the
    // screen, clear of the control deck along the bottom.
    window: { pos: V(0, -0.05, -3.05), look: V(0, -0.42, -6), lookAround: 0.35 },
    board: { pos: V(0.9, -0.04, 0.55), look: V(-1.1, -0.26, 0.55), axis: "z", lookAround: 0.2 },
    evidence: { pos: V(-0.9, 0.02, -1.9), look: V(W - 0.44, -0.22, -1.9), axis: "z", lookAround: 0.12 },
    clock: { pos: V(-0.55, 0.02, 1.95), look: V(W, -0.2, 1.95), axis: "z", lookAround: 0.12 },
    overview: { pos: V(0, 0.28, 4.4), look: V(0, -0.05, -2), lookAround: 0.4 },
  };
  const rig = createCameraRig(camera, renderer.domElement, views);
  rig.setReduced(reduced);

  // ---------------- state ----------------
  const S = {
    step: 1, maxStep: 1, station: "window",
    dest: "iss", intervention: "caffeine", outcomeKey: "sleep_latency", speed: INTERVENTIONS.caffeine.speed,
    delta: OUTCOMES.sleep_latency.delta, thr: 0.95, mode: "hidden", practiceMult: 1.5,
    seed: Math.floor(Math.random() * 1e6) + 1, days: 56,
    mission: null, locked: false, day: 0, playing: false, daysPerSec: 3, dayAcc: 0, history: [], last: null,
    power: null, powerId: 0, clockSpeed: 6, clockLux: 300, brightWake: false, crewSel: 0,
    simHours: 0, randomizing: false, noise: "sim", crewMode: false, crew: null, member: 0,
  };
  S.simHours = dayStartHours;
  const outcome = () => OUTCOMES[S.outcomeKey];
  const intervention = () => INTERVENTIONS[S.intervention];
  const design = () => recommendDesign(S.speed);
  const diary = realNoise.example_person.series;
  const realSeriesFor = (key) => key === "sleep_duration" ? diary.map((r) => r.sleep_duration) : key === "sleep_efficiency" ? diary.map((r) => r.sleep_efficiency * 100) : null;
  const syncDays = () => {
    if (S.noise === "real" && (!realSeriesFor(S.outcomeKey) || S.crewMode)) S.noise = "sim";
    S.days = S.noise === "real" ? realSeriesFor(S.outcomeKey).length : 56;
  };
  S.destLabel = DESTINATIONS[S.dest].label;

  const worker = new Worker(new URL("./sim/powerWorker.js", import.meta.url), { type: "module" });
  worker.onmessage = (e) => {
    if (e.data.id !== S.powerId) return;
    S.power = e.data;
    renderDeck();
    if (!numbers.hidden) renderNumbers(numbers, S, outcome());
  };
  const requestPower = () => {
    S.power = null;
    S.powerId++;
    worker.postMessage({ id: S.powerId, outcome: { sd: outcome().sd, rho: outcome().rho }, design: design(), delta: S.delta, thr: S.thr, days: S.days });
  };

  // ---------------- cuff (procedure) ----------------
  const STEPS = [
    { n: 1, label: "Choose a destination", station: "window" },
    { n: 2, label: "Choose what to test", station: "board" },
    { n: 3, label: "Randomize and lock the plan", station: "board" },
    { n: 4, label: "Run the mission", station: "evidence" },
    { n: 5, label: "Read the result", station: "evidence" },
  ];
  const stepsEl = $("#steps");
  function renderCuff() {
    stepsEl.innerHTML = STEPS.map((s) => `<li><button type="button" data-step="${s.n}" ${S.step === s.n && S.station !== "clock" && S.station !== "overview" ? 'aria-current="step"' : ""} ${s.n < S.step ? 'data-done="true"' : ""} ${s.n > S.maxStep ? "disabled" : ""}>${s.label}</button></li>`).join("");
  }
  stepsEl.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-step]");
    if (!b || b.disabled) return;
    goStep(+b.dataset.step);
  });
  $("#clockLink").addEventListener("click", () => goStation("clock"));
  $("#overviewLink").addEventListener("click", () => goStation("overview"));

  function goStation(name) {
    S.station = name;
    rig.go(name);
    renderCuff();
    renderDeck();
  }
  function goStep(n) {
    S.step = n;
    S.maxStep = Math.max(S.maxStep, n);
    goStation(STEPS[n - 1].station);
  }

  // ---------------- deck ----------------
  const deck = $("#deck");
  const seg = (name, opts, cur) => `<div class="seg" role="group" data-seg="${name}">${opts.map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${v === cur}">${l}</button>`).join("")}</div>`;

  function renderDeck() {
    const o = outcome(), iv = intervention(), d = design(), dest = DESTINATIONS[S.dest];
    if (S.station === "clock") return renderClockDeck();
    if (S.station === "overview") {
      deck.innerHTML = `<h2>Inside the module</h2><p>Four stations: the window, the procedure board on the port wall, the evidence chamber and the body clock on the starboard wall. Click any of them, or use the checklist.</p>`;
      return;
    }
    if (S.step === 1) {
      const issFacts = `<span class="fact"><b>${iss.periodMin.toFixed(1)} min</b> per orbit</span><span class="fact"><b>${sunrises}</b> sunrises in a day</span><span class="note">Computed from CelesTrak orbital elements (epoch ${gp[0].EPOCH.slice(0, 10)}) with SGP4.</span>`;
      deck.innerHTML = `<h2>Where is this mission?</h2><p>${dest.note}</p>
        <div class="row">${seg("dest", Object.entries(DESTINATIONS).map(([k, v]) => [k, v.label]), S.dest)}</div>
        <p style="margin-top:10px">${S.dest === "iss" ? issFacts : `<span class="fact"><b>${S.dest === "mars" ? "24 h 39 min" : "29.5 days"}</b> ${S.dest === "mars" ? "per sol" : "per lunar day"}</span>`}</p>
        <div class="actions"><button class="btn" data-act="next">Next: choose what to test</button></div>`;
      return;
    }
    if (S.step === 2) {
      const outcomesFor = iv.outcomes.map((k) => [k, OUTCOMES[k].label]);
      const pw = S.power ? Math.round(S.power.worth.at(-1).pRight * 100) : null;
      deck.innerHTML = `<h2>What do you want to find out?</h2>
        <div class="row">
          <label>The change<select data-in="intervention">${Object.entries(INTERVENTIONS).map(([k, v]) => `<option value="${k}" ${k === S.intervention ? "selected" : ""}>${v.label}</option>`).join("")}</select></label>
          <label>Compared with<select disabled><option>${iv.control}</option></select></label>
          <label>Measured by<select data-in="outcome">${outcomesFor.map(([k, l]) => `<option value="${k}" ${k === S.outcomeKey ? "selected" : ""}>${l}</option>`).join("")}</select></label>
          <label>Smallest change worth acting on (${o.unit})<input type="number" data-in="delta" step="${o.unit === "%" ? 0.5 : o.unit === "h" ? 0.05 : 1}" min="0" value="${S.delta}"/></label>
        </div>
        <div class="row" style="margin-top:10px">
          <label>How fast does it act? (your judgment)${seg("speed", [["day", "Within a day"], ["days", "Over several days"]], S.speed)}</label>
          <label>Truth${seg("mode", [["hidden", "Hidden (game)"], ["practice", "I set it (practice)"]], S.mode)}</label>
          ${S.mode === "practice" ? `<label>True change: ${(S.practiceMult * S.delta).toFixed(2)} ${o.unit}<input type="range" data-in="practice" min="-2" max="4" step="0.25" value="${S.practiceMult}"/></label>` : ""}
          <label>Who runs it${seg("who", [["solo", "Just me"], ["crew", "The whole crew (4)"]], S.crewMode ? "crew" : "solo")}</label>
          ${realSeriesFor(S.outcomeKey) && !S.crewMode ? `<label>Daily ups and downs${seg("noise", [["sim", "Simulated from 49 people"], ["real", "One real person's diary (28 days)"]], S.noise)}</label>` : ""}
        </div>
        <p style="margin-top:8px"><b>Design:</b> ${d.name}. ${d.why} ${pw === null ? "Working out the odds." : `If the real change is 1.5 times your smallest worthwhile change, this ${S.days}-day mission gives a clear answer <b>${pw}%</b> of the time.`} <span class="note">Typical day-to-day spread: ${o.fmtDelta(o.sd)} (${o.people} people).</span></p>
        <div class="actions"><button class="btn" data-act="toRandomize">Next: randomize the schedule</button></div>`;
      return;
    }
    if (S.step === 3) {
      deck.innerHTML = `<h2>Randomize, then lock the plan</h2>
        <p>The schedule decides, by chance, which days get "${iv.label.toLowerCase()}" (B) and which keep "${iv.control.toLowerCase()}" (A). Chance is what makes the answer fair. Once locked, the plan cannot change.</p>
        <div class="actions">
          <button class="btn" data-act="randomize" ${S.locked || S.randomizing ? "disabled" : ""}>${S.mission ? "Randomize again" : "Randomize the schedule"}</button>
          <button class="btn btn--quiet" data-act="lock" ${!S.mission || S.locked || S.randomizing ? "disabled" : ""}>${S.locked ? "Plan locked" : "Lock the plan"}</button>
          <button class="btn btn--quiet" data-act="save" ${!S.locked ? "disabled" : ""}>Save the plan</button>
          ${S.locked ? `<button class="btn" data-act="toRun">Next: run the mission</button>` : ""}
          <span class="note">${S.randomizing ? "Tokens are drifting to their days. Click one to give it a nudge." : S.mission ? "Every token is stuck to its day." : ""}</span>
        </div>`;
      return;
    }
    if (S.step === 4) {
      deck.innerHTML = `<h2>Run the mission</h2>
        <p>Each day the crew member follows the token for that day and logs ${o.label.toLowerCase()}. The cloud in the chamber shows what the data allow: each dot is one possible value of the true change. Watch it tighten.</p>
        <div class="row">
          <button class="btn" data-act="play">${S.playing ? "Pause" : S.day >= S.days ? "Finished" : S.day ? "Continue" : "Start the mission"}</button>
          <label>Speed${seg("speed2", [["1", "1 day/s"], ["3", "3 days/s"], ["10", "10 days/s"]], String(S.daysPerSec))}</label>
          <button class="btn btn--quiet" data-act="skip" ${S.day >= S.days ? "disabled" : ""}>Skip to the end</button>
        </div>`;
      return;
    }
    if (S.step === 5) return renderResult();
  }

  function renderResult() {
    if (S.crew && S.crew.pooled) return renderCrewResult();
    const o = outcome(), v = S.last?.v;
    const truth = truthLabel(S.mission, S.delta);
    const words = { works: "it works for you", none: "no meaningful change", harms: "it backfires", inconclusive: "not settled" };
    const verdict = v ? v.label : "inconclusive";
    const right = verdict !== "inconclusive" && verdict === truth;
    const wrong = verdict !== "inconclusive" && verdict !== truth;
    const reveal = S.mode === "hidden" ? `<p>The hidden truth: the change was <b>${o.fmtDelta(Math.abs(S.mission.trueEffect))} ${S.mission.trueEffect * 1 >= 0 ? "better" : "worse"}</b>, which counts as "${words[truth] === "not settled" ? "in between" : words[truth]}".</p>` : "";
    const lesson = verdict === "inconclusive"
      ? `${S.days} days were not enough to settle it. That is common for a single person: day-to-day spread is large compared with most real effects. A longer mission, a quieter measure, or a change that acts within a day would help.`
      : right ? "The plan worked as designed: the verdict matches the truth." : "This is the rare wrong call the threshold allows. It happens; the threshold controls how often.";
    deck.innerHTML = `<h2>Verdict on day ${S.days}: <span class="verdict">${words[verdict]}</span></h2>
      ${reveal}<p>${lesson}</p>${S.mission.real ? `<p class="note">The day-to-day ups and downs in this mission were one real person's sleep diary (open dataset, CC BY); only the hidden change was added.</p>` : ""}
      <div class="actions"><button class="btn" data-act="again">Run another mission</button><button class="btn btn--quiet" data-act="change">Change the test</button></div>`;
    if (right) celebrate();
    void wrong;
  }

  function renderCrewResult() {
    const o = outcome();
    const words = { works: "works", none: "no meaningful change", harms: "backfires", inconclusive: "not settled" };
    let rightPooled = 0, rightAlone = 0, wrongPooled = 0;
    const rows = [0, 1, 2, 3].map((i) => {
      const truth = truthLabel(S.crew.missions[i], S.delta);
      const pv = S.crew.pooled[i].v.label, av = S.crew.last[i].v.label;
      if (pv !== "inconclusive" && pv === truth) rightPooled++;
      if (pv !== "inconclusive" && pv !== truth) wrongPooled++;
      if (av !== "inconclusive" && av === truth) rightAlone++;
      const eff = S.crew.effects[i];
      return `<tr><td>${"ABCD"[i]}</td><td>${o.fmtDelta(Math.abs(eff))} ${eff >= 0 ? "better" : "worse"}</td><td><b>${words[pv]}</b></td><td>${words[av]}</td></tr>`;
    }).join("");
    deck.innerHTML = `<h2>Verdicts on day ${S.days}: <span class="verdict">${rightPooled} of 4 settled correctly with the crew</span></h2>
      <p>Alone, ${rightAlone} of 4 would have been settled correctly. ${wrongPooled ? `${wrongPooled} wrong call${wrongPooled > 1 ? "s" : ""} with the crew; the threshold keeps that rare.` : "No wrong calls."} Each person still gets their own answer; the crew only sharpens it, and less so when people respond differently.</p>
      <table class="crewtable"><thead><tr><th>Crew</th><th>Hidden truth</th><th>With the crew</th><th>Alone</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="actions"><button class="btn" data-act="again">Run another mission</button><button class="btn btn--quiet" data-act="change">Change the test</button></div>`;
    if (rightPooled > 0) celebrate();
  }

  function renderClockDeck() {
    const ro = clock.readout();
    const P = DESTINATIONS[S.dest].dayHours;
    const rows = ro ? ro.members.map((m, i) => `<button type="button" class="chip" data-crew="${i}" aria-pressed="${i === S.crewSel}"><b>${m.id}</b> ${m.tau.toFixed(2)} h clock: ${m.ratePerDay == null ? "measuring" : m.locked ? "locked to the day" : `${m.ratePerDay > 0 ? "running early" : "running late"} ${Math.abs(m.ratePerDay * 60).toFixed(0)} min a day`}</button>`).join("") : "";
    deck.innerHTML = `<h2>Body clock: ${DESTINATIONS[S.dest].label}, day ${ro ? Math.floor(ro.days) + 1 : 1}</h2>
      <p>Each bead is one crew member's internal clock (Forger-Jewett-Kronauer pacemaker model). The hand is local time on a ${P === 24 ? "24 h day" : "24 h 39 min Mars sol"}. A bead riding with the hand is locked to the day; a slipping bead is drifting.</p>
      <div class="row">
        <label>Cabin light${seg("lux", [["100", "Dim"], ["300", "Normal"], ["1000", "Bright"]], String(S.clockLux))}</label>
        <label>Bright light for 2 h after waking${seg("wake", [["0", "Off"], ["1", "On"]], S.brightWake ? "1" : "0")}</label>
        <label>Speed${seg("cspeed", [["2", "2 h/s"], ["6", "6 h/s"], ["24", "1 day/s"]], String(S.clockSpeed))}</label>
        <button class="btn btn--quiet" data-act="clockReset">Restart from launch</button>
      </div>
      <div class="chips">${rows}</div>
      ${S.dest === "mars" ? `<details style="margin-top:8px"><summary><b>What the model says about Mars time</b></summary><p> under dim cabin light, a crew member whose clock runs short (23.9 h) never locks onto the 24 h 39 min sol and slips about 29 minutes a sol; normal light locks nearly everyone. Timing matters as much as brightness: light late in the day keeps the clock where it was on Earth, while light early in the day can lock it 7 to 9 hours off, like a night shift. This matches the direction of a 2007 human study that entrained people to the Mars sol with evening-half light. <span class="note">Caveat from our own pre-registered check: this model locks more easily than we expected from that study, so treat its numbers as approximate (docs/STUDIES_RESULTS.md).</span></p></details>` : ""}
      <p class="note" style="margin-top:6px">Intrinsic periods are drawn around the measured human average of 24.18 h (Czeisler et al. 1999); the spread is an approximation. A model, not a measurement of anyone.</p>`;
  }

  deck.addEventListener("click", (e) => {
    const sb = e.target.closest("[data-seg] button");
    if (sb) {
      const name = sb.parentElement.dataset.seg, v = sb.dataset.v;
      if (name === "dest") { S.dest = v; S.destLabel = DESTINATIONS[v].label; outside.show(v); resetClock(); }
      if (name === "speed") { S.speed = v; requestPower(); }
      if (name === "noise") { S.noise = v; syncDays(); requestPower(); }
      if (name === "who") { S.crewMode = v === "crew"; syncDays(); requestPower(); }
      if (name === "mode") S.mode = v;
      if (name === "speed2") S.daysPerSec = +v;
      if (name === "lux") { S.clockLux = +v; resetClock(); }
      if (name === "wake") { S.brightWake = v === "1"; resetClock(); }
      if (name === "cspeed") S.clockSpeed = +v;
      renderDeck();
      return;
    }
    const cb = e.target.closest("[data-crew]");
    if (cb) { S.crewSel = +cb.dataset.crew; clock.select(S.crewSel); renderDeck(); return; }
    const a = e.target.closest("[data-act]");
    if (!a || a.disabled) return;
    const act = a.dataset.act;
    if (act === "next") goStep(2);
    if (act === "toRandomize") goStep(3);
    if (act === "randomize") randomize();
    if (act === "lock") { S.locked = true; renderDeck(); }
    if (act === "save") downloadJSON(buildPrereg(S, outcome(), intervention(), design()), `sol-lab-plan-${S.seed}.json`);
    if (act === "toRun") goStep(4);
    if (act === "play") { if (S.day < S.days) S.playing = !S.playing; renderDeck(); }
    if (act === "skip") { while (S.day < S.days) advanceDay(); finish(); }
    if (act === "again") newMission(true);
    if (act === "change") newMission(false);
    if (act === "clockReset") resetClock();
  });
  deck.addEventListener("change", (e) => {
    const k = e.target.dataset.in;
    if (!k) return;
    if (k === "intervention") {
      S.intervention = e.target.value;
      const iv = INTERVENTIONS[S.intervention];
      S.outcomeKey = iv.outcomes.includes(S.outcomeKey) ? S.outcomeKey : iv.outcomes[0];
      S.speed = iv.speed;
      S.delta = OUTCOMES[S.outcomeKey].delta;
    }
    if (k === "outcome") { S.outcomeKey = e.target.value; S.delta = OUTCOMES[S.outcomeKey].delta; }
    syncDays();
    if (k === "delta") S.delta = Math.max(0.01, +e.target.value || OUTCOMES[S.outcomeKey].delta);
    if (k === "practice") S.practiceMult = +e.target.value;
    evidence.setRange({ delta: S.delta, sd: outcome().sd });
    requestPower();
    renderDeck();
  });

  // ---------------- mission flow ----------------
  function trueEffect() {
    return S.mode === "hidden" ? drawMysteryEffect(S.seed, S.delta) : S.practiceMult * S.delta;
  }
  function randomize() {
    S.seed = Math.floor(Math.random() * 1e6) + 1;
    syncDays();
    if (S.crewMode) {
      // Game scenario: crew members share a typical response but differ around it.
      const base = trueEffect(), r = mulberry32(S.seed ^ 0x9e3779b9);
      const effects = [0, 1, 2, 3].map(() => base + 0.5 * S.delta * normal(r));
      const missions = effects.map((e, i) => buildMission({ seed: S.seed + 7919 * (i + 1), days: S.days, outcome: outcome(), design: design(), trueEffect: e }));
      S.crew = { effects, missions, last: [], pooled: null, hist: [[], [], [], []] };
      S.mission = missions[S.member];
    } else {
      S.crew = null;
      S.mission = buildMission({ seed: S.seed, days: S.days, outcome: outcome(), design: design(), trueEffect: trueEffect(), baseSeries: S.noise === "real" ? realSeriesFor(S.outcomeKey) : null });
    }
    S.day = 0; S.history = []; S.last = null;
    S.randomizing = true;
    evidence.setRange({ delta: S.delta, sd: outcome().sd });
    evidence.setPosterior(priorAsPosterior(S.mission.prior));
    board.highlightDay(null);
    board.randomize(S.mission.schedule, { instant: reduced, onDone: () => { S.randomizing = false; renderDeck(); } });
    renderDeck();
    renderReadout();
  }
  function advanceDay() {
    if (!S.mission || S.day >= S.days) return;
    S.day++;
    if (S.crew) {
      S.crew.missions.forEach((m, i) => { const a = analyseDay(m, S.day, S.delta, S.thr); S.crew.last[i] = a; S.crew.hist[i].push(a); });
      if (S.crew.last.every((a) => a.ci)) {
        const est = S.crew.last.map((a) => a.mean), se = S.crew.last.map((a) => (a.ci[1] - a.ci[0]) / 3.92);
        S.crew.pooled = poolCrew(est, se, S.delta).map((q) => ({ ...q, v: pooledVerdict(q, { delta: S.delta, thr: S.thr }) }));
      }
      S.history = S.crew.hist[S.member];
      const a = S.crew.last[S.member];
      if (a.post) { S.last = a; evidence.setPosterior(a.post); }
    } else {
      const a = analyseDay(S.mission, S.day, S.delta, S.thr);
      S.history.push(a);
      if (a.post) { S.last = a; evidence.setPosterior(a.post); }
    }
    board.highlightDay(S.day - 1);
  }
  function finish() {
    S.playing = false;
    renderReadout();
    if (!numbers.hidden) renderNumbers(numbers, S, outcome());
    goStep(5);
  }
  function newMission(keepSettings) {
    S.mission = null; S.crew = null; S.locked = false; S.day = 0; S.history = []; S.last = null; S.playing = false;
    board.clear();
    board.highlightDay(null);
    evidence.setPosterior(priorAsPosterior(buildMission({ seed: 1, days: S.days, outcome: outcome(), design: design(), trueEffect: 0 }).prior), { snap: true });
    S.maxStep = keepSettings ? 3 : 2;
    renderReadout();
    goStep(keepSettings ? 3 : 2);
  }

  // ---------------- readout ----------------
  const readout = $("#readout");
  function selectMember(i) {
    if (!S.crew) return;
    S.member = i;
    S.mission = S.crew.missions[i];
    S.history = S.crew.hist[i];
    S.last = S.crew.last[i] || null;
    if (S.last && S.last.post) evidence.setPosterior(S.last.post);
    else evidence.setPosterior(priorAsPosterior(S.mission.prior));
    board.randomize(S.mission.schedule, { instant: true });
    board.highlightDay(S.day ? S.day - 1 : null);
    renderReadout();
    if (!numbers.hidden) renderNumbers(numbers, S, outcome());
  }
  readout.addEventListener("click", (e) => { const b = e.target.closest("[data-member]"); if (b) selectMember(+b.dataset.member); });
  function renderReadout() {
    if (!S.mission) { readout.innerHTML = ""; return; }
    if (S.day === 0) {
      readout.innerHTML = `<div class="day"><b>Day 0</b><span>of ${S.days}, ${S.destLabel.toLowerCase()}${S.crew ? ", crew of 4" : ""}</span></div>
        <div class="prob"><span>${design().name}.</span><span class="note" style="color:#aab3bb">The evidence starts building on day 1. Verdict needs ${Math.round(S.thr * 100)}%, read on day ${S.days}.</span></div>`;
      return;
    }
    if (S.crew) {
      const rows = [0, 1, 2, 3].map((i) => {
        const pooled = S.crew.pooled ? S.crew.pooled[i].v.pWork : 0;
        const alone = S.crew.last[i] ? S.crew.last[i].v.pWork : 0;
        return `<button type="button" class="crewrow" data-member="${i}" aria-pressed="${i === S.member}"><span class="crewrow__id">${"ABCD"[i]}</span><span class="track"><span class="fill" style="width:${(pooled * 100).toFixed(1)}%;background:#6fa8f5"></span></span><span class="num">${Math.round(pooled * 100)}%</span><span class="alone">alone ${Math.round(alone * 100)}%</span></button>`;
      }).join("");
      readout.innerHTML = `<div class="day"><b>Day ${S.day}</b><span>of ${S.days}, ${S.destLabel.toLowerCase()}, crew of 4</span></div>
        <div class="prob"><span class="note" style="color:#cfd6dc">Chance it works for each crew member, using what the crew shares. Click a row to see that person's schedule and evidence.</span>${rows}
        <span class="note" style="color:#aab3bb">Verdict needs ${Math.round(S.thr * 100)}%, read on day ${S.days}.</span></div>`;
      return;
    }
    const v = S.last?.v || { pWork: 0, pNone: 0, pHarm: 0 };
    const bar = (label, p, color) => `<div class="bar"><span>${label}</span><span class="track"><span class="fill" style="width:${(p * 100).toFixed(1)}%;background:${color}"></span></span><span class="num">${Math.round(p * 100)}%</span></div>`;
    readout.innerHTML = `<div class="day"><b>Day ${S.day}</b><span>of ${S.days}, ${S.destLabel.toLowerCase()}</span></div>
      <div class="prob">${bar("Works", v.pWork, "#6fa8f5")}${bar("Too small to matter", v.pNone, "#b9c3cc")}${bar("Backfires", v.pHarm, "#f06a5e")}
      <span class="note" style="color:#aab3bb">Verdict needs ${Math.round(S.thr * 100)}%, read on day ${S.days}.</span></div>`;
  }

  // ---------------- numbers ----------------
  const numbers = $("#numbers");
  $("#numbersToggle").addEventListener("click", (e) => {
    numbers.hidden = !numbers.hidden;
    e.currentTarget.setAttribute("aria-expanded", String(!numbers.hidden));
    e.currentTarget.textContent = numbers.hidden ? "Show the numbers" : "Hide the numbers";
    if (!numbers.hidden) renderNumbers(numbers, S, outcome());
  });

  // ---------------- clock ----------------
  function resetClock() {
    clock.reset({ dayHours: DESTINATIONS[S.dest].dayHours, lux: S.clockLux, brightWake: S.brightWake, selected: S.crewSel });
    if (S.station === "clock") renderDeck();
  }

  // ---------------- picking ----------------
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  renderer.domElement.addEventListener("click", (e) => {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const tok = ray.intersectObjects(board.tokenMeshes(), false)[0];
    if (tok) { board.poke(tok.object, ray.ray.direction.clone().applyQuaternion(board.group.quaternion.clone().invert())); return; }
    const hit = ray.intersectObjects([evidence.group, clock.group, board.group], true)[0];
    if (!hit) return;
    let o = hit.object;
    while (o && !["evidence", "clock", "board"].includes(o.name)) o = o.parent;
    if (o && o.name !== S.station) goStation(o.name);
  });

  // ---------------- celebration: a burst of confetti tape in zero g ----------------
  const confetti = [];
  function celebrate() {
    if (reduced) return;
    const cols = [0x6fa8f5, 0xf6f6f1, 0xc28a1e, 0x1d3f72];
    for (let i = 0; i < 60; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.012), new THREE.MeshStandardMaterial({ color: cols[i % 4], side: THREE.DoubleSide, roughness: 0.6 }));
      m.position.copy(evidence.group.position).add(new THREE.Vector3(-0.2, 0.2, 0));
      m.userData.v = new THREE.Vector3((Math.random() - 0.8) * 0.9, (Math.random() - 0.3) * 0.8, (Math.random() - 0.5) * 0.9);
      m.userData.w = new THREE.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      m.userData.life = 6;
      scene.add(m);
      confetti.push(m);
    }
  }

  // ---------------- loop ----------------
  evidence.setRange({ delta: S.delta, sd: outcome().sd });
  evidence.setPosterior(priorAsPosterior(buildMission({ seed: 1, days: S.days, outcome: outcome(), design: design(), trueEffect: 0 }).prior), { snap: true });
  outside.show(S.dest);
  resetClock();
  requestPower();
  renderCuff();
  renderDeck();
  renderReadout();

  // Opening: start against the glass looking at Earth, then drift back to reveal the cabin.
  camera.position.set(0, 0.0, -4.35);
  rig.go("window", { duration: reduced ? 0 : 0 });
  camera.position.set(0, 0.0, -4.35);
  setTimeout(() => {
    $("#loading").classList.add("gone");
    if (!reduced) rig.go("window", { duration: 3.4 });
  }, 250);

  const clockObj = new THREE.Clock();
  let fpsT = 0, fpsN = 0, lowered = false, clockUiT = 0, readoutDirty = false;
  let simT = 0;
  function frame() {
    tick(Math.min(clockObj.getDelta(), 0.1), true);
    requestAnimationFrame(frame);
  }
  function tick(dt, draw) {
    simT += dt;
    const t = simT;
    // mission time
    if (S.playing && S.mission) {
      S.dayAcc += dt * S.daysPerSec;
      while (S.dayAcc >= 1 && S.day < S.days) { S.dayAcc -= 1; advanceDay(); readoutDirty = true; }
      if (S.day >= S.days) finish();
    }
    if (readoutDirty) { renderReadout(); if (!numbers.hidden) renderNumbers(numbers, S, outcome()); readoutDirty = false; }
    // outside world time: 90x real time at the window, so the orbit visibly moves
    S.simHours += dt * (S.station === "window" ? 90 : 20) / 3600;
    if (S.dest === "iss") {
      const st = issState(iss, new Date(issEpoch.getTime() + S.simHours * 3600e3));
      if (st) outside.orientEarth(st.lat, st.lon, st.sunEcf);
    } else outside.updateBody(S.dest, S.simHours * 60, DESTINATIONS[S.dest].dayHours);
    // clock station
    clock.advance(dt * (S.station === "clock" ? S.clockSpeed : 1));
    clock.render();
    clockUiT += dt;
    if (S.station === "clock" && clockUiT > 0.5) { clockUiT = 0; renderClockDeck(); }
    evidence.update(dt, t);
    board.update(dt);
    floaters.update(dt);
    for (let i = confetti.length - 1; i >= 0; i--) {
      const m = confetti[i];
      m.position.addScaledVector(m.userData.v, dt);
      m.rotation.x += m.userData.w.x * dt; m.rotation.y += m.userData.w.y * dt;
      m.userData.v.multiplyScalar(1 - 0.35 * dt);
      m.userData.life -= dt;
      if (m.userData.life <= 0) { scene.remove(m); m.geometry.dispose(); confetti.splice(i, 1); }
    }
    rig.update();
    if (draw) composer.render(dt);
    // adaptive quality: drop ambient occlusion and pixel ratio if the frame rate stays low
    fpsT += dt; fpsN++;
    if (fpsT > 3) {
      const fps = fpsN / fpsT;
      if (fps < 32 && !lowered && R.gtao) { R.gtao.enabled = false; renderer.setPixelRatio(1); R.onResize(); lowered = true; }
      window.__solFps = fps;
      fpsT = 0; fpsN = 0;
    }
  }
  requestAnimationFrame(frame);
  window.__sol = { S, rig, board, evidence, clock, goStep, goStation };
  if (import.meta.env.DEV) {
    // Step the whole simulation without animation frames (the browser pauses those when the
    // tab is hidden), for automated testing.
    window.__solAdvance = (seconds, step = 1 / 60) => { for (let k = 0; k < seconds / step; k++) tick(step, false); return S.day; };
    window.__solShot = async (name = "shot") => {
      composer.render(0);
      const url = renderer.domElement.toDataURL("image/jpeg", 0.9);
      await fetch(`/__shot?name=${encodeURIComponent(name)}`, { method: "POST", body: url });
      return "saved";
    };
    // ?auto=<scenario> drives the app into a state for headless screenshots and checks.
    const auto = new URLSearchParams(location.search).get("auto");
    if (auto) {
      window.__solInstant = true;
      const q = (sel) => document.querySelector(sel);
      const click = (sel) => q(sel) && q(sel).click();
      const adv = window.__solAdvance;
      const settle = () => { let k = 0; while (S.randomizing && k < 60) { adv(0.5); k++; } };
      const steps = {
        overview: () => goStation("overview"),
        step2: () => { click('[data-act="next"]'); },
        numbers2: () => { click('[data-act="next"]'); setTimeout(() => click("#numbersToggle"), 3000); },
        rand: () => { click('[data-act="next"]'); click('[data-act="toRandomize"]'); click('[data-act="randomize"]'); adv(1.7); },
        locked: () => { click('[data-act="next"]'); click('[data-act="toRandomize"]'); click('[data-act="randomize"]'); settle(); click('[data-act="lock"]'); },
        run: () => { click('[data-act="next"]'); click('[data-act="toRandomize"]'); click('[data-act="randomize"]'); settle(); click('[data-act="lock"]'); click('[data-act="toRun"]'); S.daysPerSec = 4; click('[data-act="play"]'); adv(4.2); S.playing = false; renderDeck(); },
        result: () => { click('[data-act="next"]'); click('[data-act="toRandomize"]'); click('[data-act="randomize"]'); settle(); click('[data-act="lock"]'); click('[data-act="toRun"]'); click('[data-act="skip"]'); },
        resultnum: () => { steps.result(); setTimeout(() => click("#numbersToggle"), 500); },
        crew: () => { click('[data-act="next"]'); S.crewMode = true; syncDays(); click('[data-act="toRandomize"]'); click('[data-act="randomize"]'); settle(); click('[data-act="lock"]'); click('[data-act="toRun"]'); click('[data-act="skip"]'); },
        crewrun: () => { click('[data-act="next"]'); S.crewMode = true; syncDays(); click('[data-act="toRandomize"]'); click('[data-act="randomize"]'); settle(); click('[data-act="lock"]'); click('[data-act="toRun"]'); S.daysPerSec = 4; click('[data-act="play"]'); adv(6); S.playing = false; renderDeck(); },
        mars: () => { S.dest = "mars"; S.destLabel = DESTINATIONS.mars.label; outside.show("mars"); resetClock(); renderDeck(); },
        clock: () => { S.dest = "mars"; S.destLabel = DESTINATIONS.mars.label; S.clockLux = 100; resetClock(); goStation("clock"); clock.advance(24 * 9); },
      };
      setTimeout(() => { steps[auto] && steps[auto](); }, 1500);
    }
    // Full composite (3D frame plus the HTML interface) at full resolution.
    window.__solShotFull = async (name = "full") => {
      const { toJpeg } = await import("html-to-image");
      composer.render(0);
      const img = new Image();
      img.src = renderer.domElement.toDataURL("image/jpeg", 0.92);
      await img.decode();
      Object.assign(img.style, { position: "absolute", inset: "0", width: "100%", height: "100%" });
      stage.appendChild(img);
      renderer.domElement.style.visibility = "hidden";
      try {
        const url = await toJpeg(document.querySelector("#app"), { quality: 0.9, pixelRatio: 1, width: innerWidth, height: innerHeight });
        await fetch(`/__shot?name=${encodeURIComponent(name)}`, { method: "POST", body: url });
      } finally {
        img.remove();
        renderer.domElement.style.visibility = "";
      }
      return "saved";
    };
  }
}

boot().catch((err) => {
  console.error(err);
  loadingText.textContent = `Something failed while loading: ${err.message}. Reload the page; if it keeps failing, try ?q=low in the address.`;
});
