// Mission patches: small rewards for the habits the tool is meant to build. Nothing is ever
// taken away and nothing punishes a missed day; patches only mark what has been done.
// Progress is kept in this browser.
const KEY = "sollab.patches.v1";

export const PATCHES = [
  { id: "first_log", name: "First entry", how: "Log any measurement in Check-in." },
  { id: "full_day", name: "Full check-in", how: "Log all seven measurements in one day." },
  { id: "streak3", name: "Three in a row", how: "Complete the check-in three days running." },
  { id: "streak7", name: "Full week", how: "Complete the check-in seven days running." },
  { id: "body", name: "Know your body", how: "Open every part of the body figure." },
  { id: "explorer", name: "Station walk", how: "Visit every station tab." },
  { id: "navigator", name: "Navigator", how: "Open all three maps." },
  { id: "experiment", name: "Fair test", how: "Finish a self-experiment." },
  { id: "crew_science", name: "Crew science", how: "Finish an experiment in crew mode." },
  { id: "report", name: "Report filed", how: "Download a crew report." },
  { id: "briefed", name: "Briefed", how: "Finish the guided tour." },
];

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}

export function createPatches(onEarn) {
  const st = Object.assign({ earned: {}, seen: {} }, read());
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* keep in memory */ } };
  function award(id) {
    if (st.earned[id] || !PATCHES.some((p) => p.id === id)) return;
    st.earned[id] = new Date().toISOString().slice(0, 10);
    save();
    onEarn(PATCHES.find((p) => p.id === id));
  }
  // Remember things seen (tabs, body parts, maps); award when a set is complete.
  function see(group, item, all, id) {
    const set = new Set(st.seen[group] || []);
    if (set.has(item)) return;
    set.add(item);
    st.seen[group] = [...set];
    save();
    if (all.every((x) => set.has(x))) award(id);
  }
  const has = (id) => !!st.earned[id];
  const count = () => Object.keys(st.earned).length;
  return { award, see, has, count };
}
