// Check-in history: what each crew member logged each day. Days the user has not entered
// are filled from the crew health model (heart rate, temperature and sleep from the same
// series the Vitals station shows) or simulated (blood pressure, blood sugar, mood,
// exercise), and every value carries its source so the app can label it. Entries typed in
// the app are kept in this browser only.
import { mulberry32, normal } from "../engine/rng.js";

const KEY = "sollab.checkin.v1";

function readStore() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
function writeStore(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode: entries last for this visit */ }
}

export function buildCheckins(H, seed = 77) {
  const store = readStore();
  const crew = H.crew.map((c, k) => {
    const rng = mulberry32(seed + k * 101);
    const sysBase = 108 + 10 * rng(), diaBase = 68 + 8 * rng(), gluBase = 84 + 8 * rng(), moodBase = 3.6 + 0.8 * rng();
    const sim = [];
    let mood = moodBase;
    for (let i = 0; i < H.n; i++) {
      mood += 0.35 * (moodBase - 0.004 * Math.max(0, i - H.preflight) - mood) + 0.45 * normal(rng);
      sim.push({
        bp: { sys: Math.round(sysBase + 6 * normal(rng)), dia: Math.round(diaBase + 5 * normal(rng)) },
        hr: { v: Math.round(c.hr[i]) },
        glucose: { v: Math.round(gluBase + 7 * normal(rng)) },
        temp: { v: Math.round(c.temp[i] * 10) / 10 },
        sleep: { v: Math.round(c.sleepDuration[i] * 4) / 4 },
        mood: { v: Math.min(5, Math.max(1, Math.round(mood))) },
        exercise: { v: Math.max(0, Math.round((115 + 25 * normal(rng)) / 5) * 5) },
      });
    }
    return { id: c.id, sim };
  });

  // value for crew k, day index i, indicator key: { value, source: "you" | "model" | "simulated" }
  function get(k, i, key) {
    const own = store[k]?.[i]?.[key];
    if (own) return { value: own, source: own._src === "import" ? "imported" : "you" };
    const v = crew[k].sim[i]?.[key];
    if (!v) return null;
    return { value: v, source: key === "hr" || key === "temp" || key === "sleep" ? "model" : "simulated" };
  }
  function set(k, i, key, value) {
    store[k] = store[k] || {};
    store[k][i] = store[k][i] || {};
    store[k][i][key] = value;
    writeStore(store);
  }
  function clear(k, i, key) {
    if (store[k]?.[i]) { delete store[k][i][key]; writeStore(store); }
  }
  const entered = (k, i, key) => !!store[k]?.[i]?.[key];
  // the series of one field, days [from, to]
  function series(k, key, field, from, to) {
    const out = [];
    for (let i = Math.max(0, from); i <= to; i++) { const g = get(k, i, key); out.push(g ? g.value[field] : null); }
    return out;
  }
  return { get, set, clear, entered, series };
}
