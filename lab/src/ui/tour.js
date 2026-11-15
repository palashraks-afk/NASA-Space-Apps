// Guided tour: a short scripted walk through the stations for someone seeing the tool for
// the first time (a judge, a new crew member). Each step opens a tab and explains it in two
// or three sentences. Back, Next and Exit; Escape also exits.
export const TOUR = [
  { tab: "overview", target: "#ovCrew", title: "One crew, their own normal", text: "Sol Lab helps astronauts notice when their health drifts from their own normal, decide whether it matters, and test what fixes it. Each row is one crew member, compared with their own pre-flight range." },
  { tab: "checkin", target: ".ck", title: "Daily check-in", text: "Each day the astronaut logs seven measurements: blood pressure, heart rate, blood sugar, temperature, sleep, mood and exercise. Click a row: every value gets one of three calm levels and what to do next." },
  { tab: "body", cycle: ["brain", "eyes", "heart", "lungs", "gut", "bones", "muscles", "immune"], title: "The body, part by part", text: "Real anatomy from the BodyParts3D database. The tour now steps through each body system: the selected part glows, everything else fades, and the label on the figure names it and today's level." },
  { tab: "medical", target: "#inspector", title: "Trends against your own range", text: "Heart, temperature and sleep over the last 60 days. The shaded band is this person's range from 14 pre-flight days, so changes show up before any population limit is crossed." },
  { tab: "bloodwork", target: "#inspector", title: "Real astronaut bloodwork", text: "Blood tests of the four Inspiration4 astronauts (SpaceX, 2021), before launch and after landing, from NASA's Open Science Data Repository. Changes are flagged only when they exceed normal day-to-day variation." },
  { tab: "air", target: "#inspector", title: "The air they breathe", text: "Real ISS cabin carbon dioxide, temperature and humidity, replayed one measured day at a time. On many days the cabin peaked above today's 3 mmHg limit; CO2 is linked to headaches." },
  { tab: "radiation", target: "#inspector", title: "Radiation, measured", text: "123,695 real readings from a detector inside the ISS. NASA's own ISS model flies the real track over the globe. NASA space-weather records show solar storms in those months did not raise the dose inside the station." },
  { tab: "galley", target: "#inspector", title: "Food against NASA targets", text: "Today's menu from USDA nutrient data, checked against NASA's spaceflight nutrition targets: vitamin D, calcium and sodium matter most for bone." },
  { tab: "clock", target: "#inspector", title: "The body clock", text: "A published model of the human circadian clock, driven by the crew's light schedule. It shows how a Mars day of 24 h 39 min pulls sleep out of step, and how bright light can fix it." },
  { tab: "maps", target: "#inspector", title: "Maps", text: "The station's real orbit over day and night with the measured dose rate, a module-by-module dose map, and the life-support loop with today's cabin readings." },
  { tab: "instruments", target: ".inst-list", title: "The real hardware", text: "Ten instruments behind the readings, each modelled after the real hardware, with specifications cited from NASA technical reports. The 3D view starts assembled: press Explode to see inside, or NASA photo to see the real device." },
  { tab: "experiments", target: "#inspector", title: "Signature feature: test what fixes it", text: "When a measure drifts, the crew runs a fair self-experiment: randomized days, a rule fixed in advance, and an honest answer, including \"not settled\". Checked on 49 real people's sleep records: wrong calls 0.68%." },
  { tab: "overview", target: ".hero-exp", title: "Your turn", text: "Press Watch a crew experiment to see one run live in about 20 seconds. Press Play to run the mission, switch crew with A to D, and download a crew report. Arrows move between stations." },
];

// Quick start for first-time users: four steps, each pointing at the real control.
export const QUICK = [
  { tab: "overview", target: "#ovCrew", title: "Your crew", text: "Each row is one astronaut, compared with their own normal. Amber means take a closer look." },
  { tab: "checkin", target: ".ck", title: "Log a reading", text: "Click a row, type the value and press Log. You get a level and what to do next." },
  { tab: "body", target: "#bdParts", body: "heart", title: "See what it means", text: "Click a body part, here or on the 3D figure, to see today's readings for it and how spaceflight affects it." },
  { tab: "overview", target: ".hero-exp", title: "Test what actually works", text: "Sol Lab's signature: fair, randomized self-experiments. Press Watch a crew experiment to see one run in about 20 seconds. About has the full tour." },
];

export function createTour({ host, show }) {
  const el = document.createElement("div");
  el.className = "tour";
  el.hidden = true;
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", "Guided tour");
  host.appendChild(el);
  const spot = document.createElement("div");
  spot.className = "tour-spot";
  spot.hidden = true;
  host.appendChild(spot);
  let k = 0, onDone = null, steps = TOUR;
  function place() {
    const s = steps[k];
    const t = s.target && document.querySelector(s.target);
    if (!t || el.hidden) { spot.hidden = true; return; }
    const r = t.getBoundingClientRect(), pad = 6;
    Object.assign(spot.style, { left: `${r.left - pad}px`, top: `${r.top - pad}px`, width: `${r.width + pad * 2}px`, height: `${Math.min(r.height, innerHeight - r.top - 20) + pad * 2}px` });
    spot.hidden = false;
  }
  function render() {
    const s = steps[k];
    show(s);
    const last = k === steps.length - 1;
    el.innerHTML = `<div class="tour-step">${k + 1} of ${steps.length}</div><h3>${s.title}</h3><p>${s.text}</p>
      <div class="actions"><button class="btn quiet" data-t="back" ${k === 0 ? "disabled" : ""}>Back</button><button class="btn" data-t="next">${last ? "Done" : "Next"}</button><button class="btn quiet" data-t="exit">Skip</button></div>`;
    el.querySelector('[data-t="next"]').focus({ preventScroll: true });
    requestAnimationFrame(() => requestAnimationFrame(place)); // after the panel has rendered
  }
  el.addEventListener("click", (e) => {
    const b = e.target.closest("[data-t]");
    if (!b) return;
    if (b.dataset.t === "exit") return stop();
    if (b.dataset.t === "back" && k > 0) { k--; render(); }
    if (b.dataset.t === "next") { if (k < steps.length - 1) { k++; render(); } else { stop(); onDone && onDone(); } }
  });
  addEventListener("keydown", (e) => { if (!el.hidden && e.key === "Escape") stop(); });
  addEventListener("resize", () => { if (!el.hidden) place(); });
  function start(done, list = TOUR) { steps = list; onDone = done; k = 0; el.hidden = false; host.classList.add("touring"); render(); }
  function stop() { el.hidden = true; spot.hidden = true; host.classList.remove("touring"); }
  return { start, stop, active: () => !el.hidden };
}
