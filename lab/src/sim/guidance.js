// Daily check-in indicators: what each one is, how to take it in space, why spaceflight
// changes it, and a calm three-level assessment with actions. Levels:
//   ok      within the usual range
//   watch   keep an eye on it; do the listed action and recheck
//   surgeon talk to the flight surgeon at the next contact (or now, where it says so)
// No sounds and no flashing: the level is shown as a colour plus a word.
//
// Cut-offs come from the sources named on each indicator. Where a source gives a normal
// range but no "call the doctor" point, the escalation point is a team choice and says so;
// it should be reviewed by a clinician before any real use. Not a medical device.

export const LEVELS = {
  ok: { label: "Within range", color: "#7fd1b9" },
  watch: { label: "Keep an eye on it", color: "#e0b25a" },
  surgeon: { label: "Talk to the flight surgeon", color: "#ef8a6c" },
};

const lvl = (tier, text, actions = []) => ({ tier, text, actions });

export const HAZARDS = [
  { key: "radiation", name: "Space radiation", tracks: ["radiation", "bloodwork"], what: "Particles from the Sun and outside the solar system pass through the hull and the body. Long-term risk: cancer, damage to the nervous system, heart and eyes." },
  { key: "isolation", name: "Isolation and confinement", tracks: ["checkin:mood", "checkin:sleep", "clock"], what: "Small crew, little privacy, far from family. Affects mood, sleep, teamwork and thinking." },
  { key: "distance", name: "Distance from Earth", tracks: ["checkin", "experiments"], what: "Help is delayed or out of reach, so the crew must assess and treat themselves. From Mars, a message takes about 3 to 22 minutes each way." },
  { key: "gravity", name: "Altered gravity", tracks: ["checkin:exercise", "checkin:bp", "bloodwork"], what: "Without weight on the skeleton, bone and muscle are lost; body fluids shift toward the head. Exercise is the main countermeasure." },
  { key: "environment", name: "Hostile closed environment", tracks: ["air", "galley"], what: "The air, water and food are all made or stored on board. Carbon dioxide builds up; microbes and diet are limited." },
];

export const INDICATORS = [
  {
    key: "bp", label: "Blood pressure", unit: "mmHg", hazard: "gravity",
    fields: [{ id: "sys", label: "Systolic (top number)", min: 60, max: 250, step: 1 }, { id: "dia", label: "Diastolic (bottom number)", min: 30, max: 160, step: 1 }],
    howTo: "Sit or brace in the same position each time, arm at heart level, cuff on bare upper arm. Rest 5 minutes, take two readings a minute apart and enter the second. The station medical kit has an automatic cuff.",
    whySpace: "In weightlessness, fluid shifts from the legs toward the head and chest, and the heart and vessels adapt. Blood pressure in flight is often similar to or a little lower than on the ground; the bigger risk is feeling faint after landing.",
    when: "Very high readings, or a headache, chest pain, vision change or confusion with a high reading, need the flight surgeon.",
    source: "Categories from the 2017 ACC/AHA blood pressure guideline (normal under 120/80; 130/80 and up is high; above 180/120 is a hypertensive crisis).",
    format: (v) => `${v.sys}/${v.dia}`,
    assess(v) {
      const { sys, dia } = v;
      if (sys > 180 || dia > 120) return lvl("surgeon", "Crisis range: top number above 180 or bottom above 120.", ["Sit still for 5 minutes and measure again.", "If it is still above 180/120, or you have a headache, chest pain, vision change or confusion, contact the flight surgeon now."]);
      if (sys < 90 || dia < 60) return lvl("watch", "Lower than usual (under 90/60).", ["Drink fluids and recheck lying or strapped in.", "If you feel faint or dizzy, tell a crewmate and log it; contact the flight surgeon if it keeps happening."]);
      if (sys >= 140 || dia >= 90) return lvl("watch", "High (140/90 or more).", ["Recheck after 5 minutes of rest.", "Note salt, caffeine and sleep from the past day.", "If it stays this high for 3 days, raise it at the next medical conference."]);
      if (sys >= 130 || dia >= 80) return lvl("watch", "Slightly high (130/80 or more).", ["Recheck tomorrow at the same time.", "Keep sodium near the 1500 to 2300 mg target (see Galley)."]);
      return lvl("ok", "Under 130/80.");
    },
  },
  {
    key: "hr", label: "Resting heart rate", unit: "bpm", hazard: "gravity",
    fields: [{ id: "v", label: "Beats per minute", min: 25, max: 220, step: 1 }],
    howTo: "Right after waking, before coffee or exercise. Use the wearable's reading or count your pulse at the wrist for 30 seconds and double it.",
    whySpace: "With less work against gravity, the heart can shrink slightly and resting rate can shift. Fever, poor sleep, dehydration and stress all raise it.",
    when: "A resting rate far outside your normal, or any rate with chest pain, fainting or a racing irregular beat, needs the flight surgeon.",
    source: "Adult resting range 60 to 100 bpm (American Heart Association). Escalation points (above 120 or below 40 at rest) are a team choice for review by a clinician.",
    format: (v) => `${v.v}`,
    assess(v, own) {
      const x = v.v;
      if (x > 120 || x < 40) return lvl("surgeon", x > 120 ? "Above 120 at rest." : "Below 40 at rest.", ["Recheck after 5 minutes of quiet rest.", "If it stays there, or you feel faint, short of breath, or have chest pain, contact the flight surgeon now."]);
      if (own && (x > own.hi || x < own.lo)) return lvl("watch", `Outside your usual ${Math.round(own.lo)} to ${Math.round(own.hi)} bpm.`, ["Check temperature and how you slept.", "Drink water and recheck tomorrow morning."]);
      if (x > 100 || x < 50) return lvl("watch", x > 100 ? "Above 100 at rest." : "Below 50 at rest (normal for some fit people).", ["Recheck tomorrow morning at the same time."]);
      return lvl("ok", own ? "Within your usual range." : "Within 50 to 100.");
    },
  },
  {
    key: "glucose", label: "Blood sugar (fasting)", unit: "mg/dL", hazard: "environment",
    fields: [{ id: "v", label: "mg/dL", min: 20, max: 600, step: 1 }],
    howTo: "Before breakfast, after at least 8 hours without food. Clean the fingertip, prick the side, wipe the first drop, touch the strip to the second drop. In weightlessness the drop does not fall, so hold the meter to the finger.",
    whySpace: "Inactivity, stress hormones and diet changes can make the body less sensitive to insulin; this has been seen in bed-rest studies and in flight.",
    when: "Very low or very high readings need the flight surgeon; low readings need sugar first.",
    source: "American Diabetes Association: fasting 70 to 99 normal, 100 to 125 raised, 126 and up in the diabetes range; under 70 is low and under 54 is clinically significant low. The 250 escalation point follows ADA sick-day advice.",
    format: (v) => `${v.v}`,
    assess(v) {
      const x = v.v;
      if (x < 54) return lvl("surgeon", "Under 54: significantly low.", ["Take 15 g of fast sugar now (juice pouch, glucose tablets).", "Recheck in 15 minutes and repeat if still under 70.", "Tell a crewmate and contact the flight surgeon."]);
      if (x < 70) return lvl("watch", "Under 70: low.", ["Take 15 g of fast sugar and recheck in 15 minutes.", "Eat a meal once it is above 70."]);
      if (x >= 250) return lvl("surgeon", "250 or higher.", ["Drink water and recheck in 2 hours.", "Contact the flight surgeon, especially if you feel unwell or very thirsty."]);
      if (x >= 126) return lvl("watch", "126 or higher fasting.", ["Make sure it was a true fast (8 hours).", "Recheck tomorrow; two fasting readings this high should go to the next medical conference."]);
      if (x >= 100) return lvl("watch", "100 to 125 fasting: raised.", ["Recheck in a few days.", "Keep up exercise; it improves insulin sensitivity."]);
      return lvl("ok", "70 to 99 fasting.");
    },
  },
  {
    key: "temp", label: "Body temperature", unit: "°C", hazard: "environment",
    fields: [{ id: "v", label: "°C", min: 33, max: 43, step: 0.1 }],
    howTo: "Same time each day, before exercise. Oral thermometer under the tongue with the mouth closed, or the forehead sensor in the medical kit; use the same one each time.",
    whySpace: "Resting core temperature rises about 1 °C over the first months in flight (Stahn et al. 2017), so compare with your own recent readings, not the Earth average. Fever still matters: immune changes in flight make infections a concern.",
    when: "A fever on a station is shared by the whole crew's air and water; the flight surgeon should hear about it.",
    source: "Fever 38.0 °C (100.4 °F) and above (CDC). In-flight rise: Stahn et al. 2017.",
    format: (v) => v.v.toFixed(1),
    assess(v, own) {
      const x = v.v;
      if (x >= 38.0) return lvl("surgeon", "38.0 °C or more: fever.", ["Rest, drink fluids and recheck in 2 hours.", "Tell the flight surgeon today; log any symptoms (cough, sore throat, stomach upset)."]);
      if (x < 35.0) return lvl("surgeon", "Below 35.0 °C.", ["Recheck with a second thermometer; if confirmed, warm up and contact the flight surgeon."]);
      if (own && x > own.hi) return lvl("watch", "Above your recent normal.", ["Recheck in the evening.", "Note sleep, exercise and how you feel."]);
      return lvl("ok", own ? "Within your recent normal." : "No fever.");
    },
  },
  {
    key: "sleep", label: "Sleep last night", unit: "h", hazard: "isolation",
    fields: [{ id: "v", label: "Hours asleep", min: 0, max: 16, step: 0.25 }],
    howTo: "Estimate hours actually asleep, not hours in the sleeping bag. The wearable's estimate can be used; log it before breakfast.",
    whySpace: "Light-dark cycles every 90 minutes, noise, workload and stress cut sleep. ISS crews averaged about 6 hours a night (Barger et al. 2014).",
    when: "Several short nights in a row raise error risk on critical tasks.",
    source: "Adults need 7 hours or more (American Academy of Sleep Medicine). Crew average: Barger et al., Lancet Neurology 2014. The 3-night escalation is a team choice.",
    format: (v) => `${v.v}`,
    assess(v, own, history = []) {
      const x = v.v;
      const short = [...history.slice(-2).map((h) => h && h.v), x].filter((y) => y != null && y < 5).length;
      if (short >= 3) return lvl("surgeon", "Under 5 hours three nights running.", ["Raise it at the next medical conference; schedules can be changed.", "Avoid critical tasks without a second check today."]);
      if (x < 6) return lvl("watch", "Under 6 hours.", ["Dim screens and cabin light for the last hour before sleep.", "Bright light right after waking helps (see Body clock).", "Consider testing a change with an experiment."]);
      return lvl("ok", x >= 7 ? "7 hours or more." : "6 to 7 hours.");
    },
  },
  {
    key: "mood", label: "Mood", unit: "of 5", hazard: "isolation",
    fields: [{ id: "v", label: "1 very low, 5 very good", min: 1, max: 5, step: 1, scale: true }],
    howTo: "Pick the number that fits today as a whole. Short note optional. Your answers stay with you unless you choose to share them.",
    whySpace: "Months of confinement, a small crew, distance from family and heavy workload can wear mood down over a long mission.",
    when: "Low mood for several days, or any thought of harming yourself, should go to the flight surgeon or the behavioural health team. That conversation is private.",
    source: "Behavioural health is one of NASA's Human Research Program risks. Escalation after 3 low days is a team choice for review by a clinician.",
    format: (v) => `${v.v}`,
    assess(v, own, history = []) {
      const x = v.v;
      const low = [...history.slice(-2).map((h) => h && h.v), x].filter((y) => y != null && y <= 2).length;
      if (low >= 3) return lvl("surgeon", "Low for three days.", ["Book a private conference with the flight surgeon or behavioural health team.", "If you have thoughts of harming yourself, contact them now."]);
      if (x <= 2) return lvl("watch", "Low today.", ["Schedule a private call home or with friends.", "Exercise and daylight-like light help.", "Tell a crewmate you trust."]);
      return lvl("ok", x >= 4 ? "Good." : "Okay.");
    },
  },
  {
    key: "exercise", label: "Exercise today", unit: "min", hazard: "gravity",
    fields: [{ id: "v", label: "Minutes (treadmill, cycle, resistance)", min: 0, max: 300, step: 5 }],
    howTo: "Total minutes of treadmill, cycle and resistance work. Log after the last session of the day.",
    whySpace: "Without weight on the skeleton, hips and spine can lose about 1 to 1.5% of bone mineral density a month, and leg muscles weaken. ISS crews schedule about 2 hours of exercise a day.",
    when: "Several days of missed exercise, or new pain in a bone or joint, should be raised with the flight surgeon.",
    source: "Bone loss rate and the 2-hour schedule: NASA Human Research Program. Thresholds are a team choice.",
    format: (v) => `${v.v}`,
    assess(v, own, history = []) {
      const x = v.v;
      const low = [...history.slice(-2).map((h) => h && h.v), x].filter((y) => y != null && y < 30).length;
      if (low >= 3) return lvl("surgeon", "Under 30 minutes three days running.", ["Raise it at the next medical conference; the schedule may need room.", "Report any bone or joint pain."]);
      if (x < 90) return lvl("watch", "Under 90 minutes.", ["Add a resistance session tomorrow: loading the bones is what protects them."]);
      return lvl("ok", "90 minutes or more.");
    },
  },
];

export const INDICATOR = Object.fromEntries(INDICATORS.map((i) => [i.key, i]));

export function validate(ind, value) {
  for (const f of ind.fields) {
    const x = value[f.id];
    if (x == null || !Number.isFinite(x)) return `Enter ${f.label.toLowerCase()}.`;
    if (x < f.min || x > f.max) return `${ind.fields.length > 1 ? f.label : ind.label}: expected between ${f.min} and ${f.max}.`;
  }
  if (ind.key === "bp" && value.dia >= value.sys) return "The bottom number should be lower than the top number.";
  return null;
}

// Usual range from the person's own earlier entries (at least 7), mean +/- 2 SD.
export function ownRange(values) {
  const xs = values.filter((x) => Number.isFinite(x));
  if (xs.length < 7) return null;
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  const sd = Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
  return { lo: m - 2 * sd, hi: m + 2 * sd, n: xs.length };
}
