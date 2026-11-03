// Guided tour: a short scripted walk through the stations for someone seeing the tool for
// the first time (a judge, a new crew member). Each step opens a tab and explains it in two
// or three sentences. Back, Next and Exit; Escape also exits.
export const TOUR = [
  { tab: "overview", title: "One crew, their own normal", text: "Sol Lab helps astronauts notice when their health drifts from their own normal, decide whether it matters, and test what fixes it. Everything shown is built from real records: NASA radiation and cabin-air logs, a SpaceX crew's blood tests, real sleep diaries." },
  { tab: "checkin", title: "Daily check-in", text: "Each day the astronaut logs seven measurements: blood pressure, heart rate, blood sugar, temperature, sleep, mood and exercise. Every value gets one of three calm levels with what to do next. Open \"How to measure\" on any card for instructions." },
  { tab: "body", title: "The body at a glance", text: "Click any part of the figure. It is coloured by today's measurements and explains what that part does, how spaceflight affects it, and which of NASA's five hazards apply.", body: "brain" },
  { tab: "medical", title: "Trends against your own range", text: "Heart, temperature and sleep over the last 60 days. The shaded band is this person's range from 14 pre-flight days, so changes show up before any population limit is crossed." },
  { tab: "bloodwork", title: "Real astronaut bloodwork", text: "Blood tests of the four Inspiration4 astronauts (SpaceX, 2021), before launch and after landing, from NASA's Open Science Data Repository. Changes are flagged only when they exceed normal day-to-day variation." },
  { tab: "air", title: "The air they breathe", text: "Real ISS cabin carbon dioxide, temperature and humidity, replayed one measured day at a time. On many 2016 days the cabin peaked above today's 3 mmHg limit; CO2 is linked to headaches." },
  { tab: "radiation", title: "Radiation, measured", text: "123,695 real readings from a detector inside the ISS. The globe shows where the dose comes from: more than half of it in under an hour a day over South America, in the South Atlantic Anomaly." },
  { tab: "maps", title: "Maps", text: "The station's real orbit over day and night with the measured dose rate, a module-by-module dose map, and the life-support loop with today's cabin readings. Use the buttons above the map to switch." },
  { tab: "experiments", title: "Test what fixes it", text: "When a measure drifts, the crew can run a fair self-experiment: randomized days, a rule fixed in advance, and an honest answer, including \"not settled\". The method was checked on 49 real people's sleep diaries." },
  { tab: "overview", title: "Your turn", text: "Press Play to run the mission, switch crew with A to D, and download a crew report from this page. Left and Right arrows move between stations; the Instruments tab shows the real hardware behind each reading." },
];

export function createTour({ host, show }) {
  const el = document.createElement("div");
  el.className = "tour";
  el.hidden = true;
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", "Guided tour");
  host.appendChild(el);
  let k = 0, onDone = null;
  function render() {
    const s = TOUR[k];
    show(s);
    el.innerHTML = `<div class="tour-step">${k + 1} of ${TOUR.length}</div><h3>${s.title}</h3><p>${s.text}</p>
      <div class="actions"><button class="btn quiet" data-t="back" ${k === 0 ? "disabled" : ""}>Back</button><button class="btn" data-t="next">${k === TOUR.length - 1 ? "Finish" : "Next"}</button><button class="btn quiet" data-t="exit">Exit tour</button></div>`;
    el.querySelector('[data-t="next"]').focus({ preventScroll: true });
  }
  el.addEventListener("click", (e) => {
    const b = e.target.closest("[data-t]");
    if (!b) return;
    if (b.dataset.t === "exit") return stop();
    if (b.dataset.t === "back" && k > 0) { k--; render(); }
    if (b.dataset.t === "next") { if (k < TOUR.length - 1) { k++; render(); } else { stop(); onDone && onDone(); } }
  });
  addEventListener("keydown", (e) => { if (!el.hidden && e.key === "Escape") stop(); });
  function start(done) { onDone = done; k = 0; el.hidden = false; render(); }
  function stop() { el.hidden = true; }
  return { start, stop, active: () => !el.hidden };
}
