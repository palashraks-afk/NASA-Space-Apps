// Instruments: the real hardware that produces each kind of reading on the ISS, what it
// measures, how the reading reaches Sol Lab, and a simplified parts breakdown used for the
// exploded blueprint views. Part lists describe how each class of device works in general;
// they are teaching diagrams, not engineering drawings of the flight units.
//
// "feeds": check-in indicator keys or other app stations the device's readings go to.
// "path": how its data gets into Sol Lab: "import" (CSV or FHIR file in the Instruments tab),
// "dataset" (already loaded from a public record), or "reference" (shown for context).

export const INSTRUMENTS = [
  {
    key: "bp", name: "Blood pressure monitor", flight: "ISS: CDL Halter Arterial Blood Pressure Unit (named in NASA ISS daily reports)",
    agency: "NASA / ESA", measures: "Systolic and diastolic blood pressure, pulse", feeds: ["bp", "hr"], path: "import",
    how: "An inflatable cuff squeezes the upper arm until blood flow stops, then lets air out slowly. A pressure sensor records the small oscillations in cuff pressure as flow returns; the device turns their pattern into systolic and diastolic values.",
    parts: [
      { name: "Cuff bladder", does: "Inflates around the upper arm to stop and release blood flow", shape: "torus", size: [0.09, 0.03], at: [-0.12, 0.02, 0], dir: [-1, 0.2, 0], color: "#6fa8f5" },
      { name: "Air hose", does: "Carries air between pump and cuff; transmits pressure pulses", shape: "tube", size: [0.12, 0.006], at: [-0.03, 0, 0], dir: [-0.3, -1, 0] },
      { name: "Pump", does: "Inflates the cuff", shape: "cyl", size: [0.025, 0.05], at: [0.06, 0.02, -0.02], dir: [0.4, 0.8, -1] },
      { name: "Release valve", does: "Lets air out at a steady rate", shape: "cyl", size: [0.012, 0.03], at: [0.06, -0.03, -0.02], dir: [0.3, -1, -0.6] },
      { name: "Pressure sensor", does: "Measures cuff pressure and its pulse oscillations", shape: "box", size: [0.03, 0.02, 0.02], at: [0.1, 0, 0], dir: [1, 0.5, 0.4] },
      { name: "Processor and display", does: "Turns the oscillation pattern into readings; shows them", shape: "box", size: [0.1, 0.07, 0.02], at: [0.12, 0, 0.03], dir: [0.6, 0.2, 1], screen: true },
      { name: "Battery", does: "Power; flight units use certified cells", shape: "box", size: [0.05, 0.03, 0.015], at: [0.12, -0.02, -0.03], dir: [0.5, -0.6, -1] },
    ],
  },
  {
    key: "oximeter", name: "Pulse oximeter", flight: "ISS medical kit; also built into CSA's Bio-Monitor headband",
    agency: "NASA / CSA", measures: "Blood oxygen saturation, pulse rate", feeds: ["hr"], path: "import",
    how: "Two LEDs shine red and infrared light through a fingertip. Oxygen-rich and oxygen-poor blood absorb the two colours differently; a light sensor on the other side measures how much gets through with each heartbeat.",
    parts: [
      { name: "Upper clip housing", does: "Holds the LEDs against the nail", shape: "box", size: [0.07, 0.02, 0.035], at: [0, 0.025, 0], dir: [0, 1, 0] },
      { name: "Red and infrared LEDs", does: "Emit light at about 660 nm and 940 nm", shape: "box", size: [0.012, 0.004, 0.012], at: [0, 0.012, 0], dir: [0.3, 0.7, 0.4], glow: "#ff5a4f" },
      { name: "Fingertip", does: "Pulsing blood changes how much light passes", shape: "cap", size: [0.011, 0.05], at: [0, 0, 0], dir: [-1, 0, 0], color: "#d9a48a", rot: [0, 0, Math.PI / 2] },
      { name: "Photodiode", does: "Measures light that passes through", shape: "box", size: [0.012, 0.004, 0.012], at: [0, -0.012, 0], dir: [0.3, -0.7, 0.4], glow: "#7fd1b9" },
      { name: "Lower clip and spring", does: "Keeps steady pressure on the finger", shape: "box", size: [0.07, 0.02, 0.035], at: [0, -0.025, 0], dir: [0, -1, 0] },
      { name: "Processor and display", does: "Computes saturation from the red/infrared ratio", shape: "box", size: [0.04, 0.012, 0.03], at: [0.02, 0.04, 0], dir: [0.6, 1, -0.2], screen: true },
    ],
  },
  {
    key: "glucometer", name: "Blood glucose meter", flight: "Reference design: the finger-stick meter class used in clinics",
    agency: "Commercial", measures: "Blood sugar (mg/dL)", feeds: ["glucose"], path: "import",
    how: "A drop of blood wicks onto a test strip. An enzyme on the strip reacts with glucose and produces a tiny electric current between electrodes; the current is proportional to the glucose level.",
    parts: [
      { name: "Lancet", does: "Makes a small finger prick for a drop of blood", shape: "cyl", size: [0.005, 0.06], at: [-0.12, 0, 0], dir: [-1, 0.4, 0], rot: [0, 0, Math.PI / 2] },
      { name: "Test strip", does: "Carries the blood to the reaction area", shape: "box", size: [0.05, 0.002, 0.012], at: [-0.06, 0, 0], dir: [-1, 0, 0.3], color: "#e9edf2" },
      { name: "Enzyme layer", does: "Glucose oxidase or dehydrogenase reacts with glucose", shape: "box", size: [0.012, 0.003, 0.01], at: [-0.075, 0.003, 0], dir: [-0.6, 1, 0.2], glow: "#f0c259" },
      { name: "Electrodes", does: "Measure the current the reaction produces", shape: "box", size: [0.03, 0.002, 0.008], at: [-0.05, -0.003, 0], dir: [-0.5, -1, 0.3], color: "#c9a35a" },
      { name: "Strip port", does: "Connects the strip to the meter", shape: "box", size: [0.015, 0.01, 0.02], at: [-0.025, 0, 0], dir: [-0.4, 0.3, -1] },
      { name: "Meter body and display", does: "Converts current to mg/dL; stores readings", shape: "box", size: [0.06, 0.1, 0.02], at: [0.02, 0, 0], dir: [1, 0.2, 0.2], screen: true },
    ],
  },
  {
    key: "wearable", name: "Smart-garment monitor", flight: "ISS: Astroskin, part of the Canadian Space Agency's Bio-Monitor (shirt plus headband)",
    agency: "CSA", measures: "ECG heart rhythm, breathing, oxygen saturation, skin temperature, activity", feeds: ["hr", "temp", "sleep"], path: "import",
    how: "Sensors woven into a close-fitting shirt and a headband record the heart's electrical signal, chest movement from breathing, skin temperature and movement through the day and night. A small recorder stores the data for the crew and the ground.",
    parts: [
      { name: "Garment", does: "Holds sensors in place against the body", shape: "cap", size: [0.07, 0.12], at: [0, 0, 0], dir: [0, 0, -1], color: "#3a4552" },
      { name: "ECG electrodes", does: "Record the heart's electrical activity", shape: "sph", size: [0.012], at: [0.03, 0.04, 0.07], dir: [0.6, 0.4, 1], glow: "#ef8a6c", count: 3 },
      { name: "Breathing bands", does: "Stretch sensors that follow chest and belly movement", shape: "torus", size: [0.075, 0.004], at: [0, -0.02, 0], dir: [1, 0, 0], rot: [Math.PI / 2, 0, 0], color: "#6fa8f5" },
      { name: "Headband oximeter", does: "Oxygen saturation at the forehead", shape: "torus", size: [0.05, 0.008], at: [0, 0.16, 0], dir: [0, 1, 0], rot: [Math.PI / 2, 0, 0] },
      { name: "Skin temperature sensor", does: "Temperature at the skin surface", shape: "sph", size: [0.01], at: [-0.04, 0.02, 0.07], dir: [-0.7, 0.2, 1], glow: "#f0c259" },
      { name: "Accelerometer", does: "Movement, posture and sleep periods", shape: "box", size: [0.02, 0.02, 0.008], at: [0.04, -0.06, 0.07], dir: [0.8, -0.6, 1] },
      { name: "Recorder", does: "Stores and sends the data", shape: "box", size: [0.05, 0.035, 0.015], at: [0, -0.1, 0.07], dir: [0, -1, 1], screen: true },
    ],
  },
  {
    key: "dosimeter", name: "Radiation dosimeter (telescope)", flight: "ISS: DOSTEL, the DLR DOSimetry TELescope in the Columbus module",
    agency: "DLR / ESA", measures: "Absorbed dose rate and particle flux", feeds: ["radiation"], path: "dataset",
    how: "Two flat silicon detectors sit one behind the other. A charged particle passing through leaves a small burst of charge in each; the energy deposited gives the dose, and hits in both detectors at once mark particles crossing the telescope.",
    parts: [
      { name: "Housing", does: "Light-tight, shielded case", shape: "box", size: [0.14, 0.08, 0.08], at: [0, 0, 0], dir: [0, 0, -1], color: "#4a5563" },
      { name: "Front silicon detector", does: "Records energy deposited by each particle", shape: "box", size: [0.006, 0.05, 0.05], at: [-0.03, 0, 0], dir: [-1, 0.2, 0.3], glow: "#9cc4ff" },
      { name: "Rear silicon detector", does: "A matching hit marks a particle crossing both", shape: "box", size: [0.006, 0.05, 0.05], at: [0.01, 0, 0], dir: [0.4, 0.3, 1], glow: "#9cc4ff" },
      { name: "Spacer", does: "Fixes the gap that defines the viewing angle", shape: "box", size: [0.03, 0.04, 0.008], at: [-0.01, 0, 0], dir: [0, 1, 0.5] },
      { name: "Preamplifiers", does: "Amplify the tiny charge pulses", shape: "box", size: [0.04, 0.012, 0.04], at: [0.04, -0.025, 0], dir: [1, -1, 0] },
      { name: "Data electronics", does: "Sort pulses by energy, compute dose, send data", shape: "box", size: [0.05, 0.012, 0.06], at: [0.04, 0.03, 0], dir: [1, 1, 0.2] },
    ],
  },
  {
    key: "cdra", name: "CO2 removal assembly", flight: "ISS: Carbon Dioxide Removal Assembly (CDRA)",
    agency: "NASA", measures: "Removes CO2 from cabin air (cabin CO2 is measured separately by the station's analysers)", feeds: ["air"], path: "dataset",
    how: "A fan pushes cabin air through a bed that first dries it, then through a zeolite bed that traps CO2. Two sets of beds take turns: while one absorbs, the other is heated and exposed to space vacuum to release its CO2. The dried air's water is returned.",
    parts: [
      { name: "Blower", does: "Moves cabin air through the beds", shape: "cyl", size: [0.04, 0.03], at: [-0.13, 0, 0], dir: [-1, 0, 0], rot: [0, 0, Math.PI / 2] },
      { name: "Desiccant bed A", does: "Removes water before the CO2 bed", shape: "box", size: [0.05, 0.06, 0.05], at: [-0.06, 0.04, 0], dir: [-0.5, 1, 0.3], color: "#c9a35a" },
      { name: "Desiccant bed B", does: "Same, used in the other half-cycle", shape: "box", size: [0.05, 0.06, 0.05], at: [-0.06, -0.04, 0], dir: [-0.5, -1, 0.3], color: "#c9a35a" },
      { name: "Zeolite CO2 bed A", does: "Traps CO2 molecules in its pores", shape: "box", size: [0.06, 0.06, 0.05], at: [0.03, 0.04, 0], dir: [0.4, 1, -0.3], color: "#7fd1b9" },
      { name: "Zeolite CO2 bed B", does: "Heated and vented to space to release CO2", shape: "box", size: [0.06, 0.06, 0.05], at: [0.03, -0.04, 0], dir: [0.4, -1, -0.3], color: "#ef8a6c" },
      { name: "Switching valves", does: "Swap which beds absorb and which regenerate", shape: "cyl", size: [0.012, 0.03], at: [-0.015, 0, 0.035], dir: [0, 0, 1], count: 2 },
      { name: "Heaters", does: "Warm the regenerating bed to drive off CO2", shape: "box", size: [0.06, 0.004, 0.05], at: [0.03, -0.075, 0], dir: [0.3, -1, 0.6], glow: "#f0c259" },
      { name: "Vent to space", does: "CO2 leaves the station, or goes to the Sabatier reactor", shape: "cyl", size: [0.008, 0.06], at: [0.1, 0, 0], dir: [1, 0, 0], rot: [0, 0, Math.PI / 2] },
    ],
  },
  {
    key: "treadmill", name: "Treadmill with harness", flight: "ISS: T2 treadmill (installed 2010, top speed 12 mph)",
    agency: "NASA", measures: "Exercise time, speed, harness load", feeds: ["exercise"], path: "import",
    how: "In weightlessness the runner would float off, so a harness and bungee or motor system pulls them down onto the belt. A vibration-isolation system keeps the running forces from shaking the station.",
    parts: [
      { name: "Running belt", does: "Moving surface the crew member runs on", shape: "box", size: [0.2, 0.01, 0.07], at: [0, -0.03, 0], dir: [0, -0.4, 1], color: "#2a323c" },
      { name: "Deck and motor", does: "Drives the belt", shape: "box", size: [0.22, 0.03, 0.08], at: [0, -0.055, 0], dir: [0, -1, 0] },
      { name: "Harness", does: "Worn by the crew member; takes the pull-down load", shape: "torus", size: [0.04, 0.008], at: [0, 0.1, 0], dir: [0, 1, 0], rot: [Math.PI / 2, 0, 0], color: "#6fa8f5" },
      { name: "Load straps", does: "Pull the runner onto the belt (a fraction of body weight)", shape: "cyl", size: [0.003, 0.12], at: [0.04, 0.04, 0], dir: [1, 0.5, 0.2], count: 2 },
      { name: "Vibration isolation", does: "Springs and dampers that keep forces off the station", shape: "cyl", size: [0.012, 0.03], at: [0.08, -0.085, 0.03], dir: [0.6, -1, 0.6], count: 4 },
      { name: "Control panel", does: "Speed, time and load", shape: "box", size: [0.05, 0.03, 0.01], at: [0.1, 0.06, -0.03], dir: [1, 0.6, -0.6], screen: true },
    ],
  },
];

// ---------- universal import ----------
// Any device that can export CSV or a FHIR bundle can feed the check-in. FHIR Observations
// are matched by LOINC code; CSV by column names.
export const LOINC = {
  "8480-6": { key: "bp", field: "sys" },     // systolic blood pressure
  "8462-4": { key: "bp", field: "dia" },     // diastolic blood pressure
  "8867-4": { key: "hr", field: "v" },       // heart rate
  "2339-0": { key: "glucose", field: "v" },  // glucose, blood, mass/volume
  "1558-6": { key: "glucose", field: "v" },  // fasting glucose, serum/plasma
  "8310-5": { key: "temp", field: "v" },     // body temperature
  "93832-4": { key: "sleep", field: "v" },   // sleep duration
};

const toDay = (iso) => (iso ? String(iso).slice(0, 10) : null);

// Returns { rows: [{ date, key, value }], skipped: [reasons] }. Values are in the app's units
// (mmHg, bpm, mg/dL, degC, hours, 1-5, minutes); simple unit conversions are applied.
export function parseReadings(text, filename = "") {
  const rows = [], skipped = [];
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) {
    let doc;
    try { doc = JSON.parse(trimmed); } catch { return { rows, skipped: ["Not valid JSON."] }; }
    const obs = doc.resourceType === "Bundle" ? (doc.entry || []).map((e) => e.resource) : [doc];
    const byDay = {};
    for (const o of obs) {
      if (!o || o.resourceType !== "Observation") continue;
      const date = toDay(o.effectiveDateTime || o.effectivePeriod?.start || o.issued);
      const items = o.component?.length ? o.component : [o];
      for (const c of items) {
        const code = (c.code?.coding || []).map((x) => x.code).find((x) => LOINC[x]);
        const q = c.valueQuantity;
        if (!code || !q || !Number.isFinite(q.value)) { if (c === o && !o.component) skipped.push(`Unrecognised observation ${(c.code?.coding || [])[0]?.code || "?"}`); continue; }
        const { key, field } = LOINC[code];
        let v = q.value;
        const unit = (q.unit || q.code || "").toLowerCase();
        if (key === "temp" && (unit.includes("f") && !unit.includes("cel"))) v = ((v - 32) * 5) / 9;
        if (key === "glucose" && unit.includes("mmol")) v = v * 18.016;
        if (key === "sleep" && (unit === "min" || unit.includes("minute"))) v = v / 60;
        byDay[date] = byDay[date] || {};
        byDay[date][key] = byDay[date][key] || {};
        byDay[date][key][field] = Math.round(v * 10) / 10;
      }
    }
    for (const [date, keys] of Object.entries(byDay)) for (const [key, value] of Object.entries(keys)) rows.push({ date, key, value });
    return { rows, skipped };
  }
  // CSV: header with a date column and any of: systolic, diastolic, heart_rate, glucose,
  // temperature, sleep_hours, mood, exercise_min (aliases accepted).
  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { rows, skipped: ["The file has no data rows."] };
  const head = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_"));
  const col = (...names) => head.findIndex((h) => names.includes(h));
  const ci = {
    date: col("date", "day", "timestamp", "datetime"),
    sys: col("systolic", "sys", "bp_systolic"), dia: col("diastolic", "dia", "bp_diastolic"),
    hr: col("heart_rate", "hr", "pulse", "resting_hr"), glucose: col("glucose", "blood_sugar", "glucose_mg_dl"),
    glucose_mmol: col("glucose_mmol_l", "glucose_mmol"), temp: col("temperature", "temp", "temp_c", "body_temp"),
    temp_f: col("temp_f", "temperature_f"), sleep: col("sleep_hours", "sleep", "sleep_h"),
    mood: col("mood"), exercise: col("exercise_min", "exercise", "exercise_minutes"),
  };
  if (ci.date < 0) return { rows, skipped: ["No date column (date, day or timestamp)."] };
  for (let n = 1; n < lines.length; n++) {
    const c = lines[n].split(",").map((x) => x.trim());
    const date = toDay(c[ci.date]);
    const num = (i) => (i >= 0 && c[i] !== "" && c[i] != null ? Number(c[i]) : null);
    const add = (key, value) => rows.push({ date, key, value });
    if (num(ci.sys) != null && num(ci.dia) != null) add("bp", { sys: num(ci.sys), dia: num(ci.dia) });
    if (num(ci.hr) != null) add("hr", { v: num(ci.hr) });
    if (num(ci.glucose) != null) add("glucose", { v: num(ci.glucose) });
    else if (num(ci.glucose_mmol) != null) add("glucose", { v: Math.round(num(ci.glucose_mmol) * 18.016) });
    if (num(ci.temp) != null) add("temp", { v: num(ci.temp) });
    else if (num(ci.temp_f) != null) add("temp", { v: Math.round(((num(ci.temp_f) - 32) * 5 / 9) * 10) / 10 });
    if (num(ci.sleep) != null) add("sleep", { v: num(ci.sleep) });
    if (num(ci.mood) != null) add("mood", { v: num(ci.mood) });
    if (num(ci.exercise) != null) add("exercise", { v: num(ci.exercise) });
  }
  return { rows: rows.filter((r) => r.date), skipped };
}

export const SAMPLE_CSV = `date,systolic,diastolic,heart_rate,glucose,temperature,sleep_hours,mood,exercise_min
2026-11-10,118,76,62,88,36.7,6.5,4,120
2026-11-11,121,78,64,92,36.8,5.75,3,95
2026-11-12,124,80,66,95,36.9,6.0,4,130
`;

export const SAMPLE_FHIR = JSON.stringify({
  resourceType: "Bundle", type: "collection",
  entry: [
    { resource: { resourceType: "Observation", status: "final", effectiveDateTime: "2026-11-12T07:15:00Z", code: { coding: [{ system: "http://loinc.org", code: "85354-9", display: "Blood pressure panel" }] },
      component: [
        { code: { coding: [{ system: "http://loinc.org", code: "8480-6" }] }, valueQuantity: { value: 126, unit: "mmHg" } },
        { code: { coding: [{ system: "http://loinc.org", code: "8462-4" }] }, valueQuantity: { value: 82, unit: "mmHg" } },
      ] } },
    { resource: { resourceType: "Observation", status: "final", effectiveDateTime: "2026-11-12T06:30:00Z", code: { coding: [{ system: "http://loinc.org", code: "8867-4" }] }, valueQuantity: { value: 63, unit: "/min" } } },
    { resource: { resourceType: "Observation", status: "final", effectiveDateTime: "2026-11-12T07:00:00Z", code: { coding: [{ system: "http://loinc.org", code: "2339-0" }] }, valueQuantity: { value: 5.2, unit: "mmol/L" } } },
    { resource: { resourceType: "Observation", status: "final", effectiveDateTime: "2026-11-12T06:45:00Z", code: { coding: [{ system: "http://loinc.org", code: "8310-5" }] }, valueQuantity: { value: 98.6, unit: "[degF]" } } },
  ],
}, null, 2);
