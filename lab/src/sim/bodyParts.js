// Body regions for the clickable figure: what each part does, which check-in indicators and
// other readings speak for it, and how spaceflight affects it. Status is computed in
// main.js from the live data; parts with nothing measured say so instead of guessing.
export const BODY_PARTS = [
  {
    key: "brain", name: "Brain and mood", indicators: ["mood", "sleep"], hazards: ["isolation", "radiation", "environment"],
    does: "Thinking, memory, mood and sleep timing. The body clock lives here.",
    space: "Confinement and distance from home wear on mood; 16 sunrises a day and noise cut sleep; high cabin CO2 is linked to headaches; deep-space radiation is a long-term risk to nerve cells.",
    also: "air",
  },
  {
    key: "eyes", name: "Eyes", indicators: [], hazards: ["gravity"],
    does: "Vision. The optic nerve connects the eye to the brain.",
    space: "Fluid shifts toward the head can swell the optic disc and flatten the back of the eye (spaceflight-associated neuro-ocular syndrome). Crews have eye exams with ultrasound and imaging during flight.",
    unmeasured: "Not measured by this tool: needs eye imaging. Report any change in near vision.",
  },
  {
    key: "heart", name: "Heart and blood vessels", indicators: ["bp", "hr"], hazards: ["gravity", "radiation"],
    does: "Pumps blood; blood pressure keeps the brain supplied when standing.",
    space: "Without gravity the heart works less and can lose some mass; after landing, many crew feel faint on standing. Radiation may raise long-term heart disease risk.",
  },
  {
    key: "lungs", name: "Lungs and breathing", indicators: [], hazards: ["environment"],
    does: "Takes in oxygen, removes carbon dioxide.",
    space: "Cabin air is made and cleaned on board. When CO2 builds up the body breathes harder and headaches become more likely.",
    also: "air",
  },
  {
    key: "gut", name: "Gut and metabolism", indicators: ["glucose"], hazards: ["environment"],
    does: "Digests food, controls blood sugar, absorbs vitamins and minerals.",
    space: "Inactivity and stress can blunt the response to insulin; packaged food and no sunlight make vitamin D and calcium intake important.",
    also: "galley",
  },
  {
    key: "bones", name: "Bones", indicators: ["exercise"], hazards: ["gravity"],
    does: "Hold the body up and store calcium.",
    space: "Hips and spine can lose about 1 to 1.5% of their mineral a month without loading. Resistance exercise and enough calcium and vitamin D slow it; released calcium raises kidney stone risk.",
  },
  {
    key: "muscles", name: "Muscles", indicators: ["exercise"], hazards: ["gravity"],
    does: "Movement and posture; leg and back muscles work against gravity on Earth.",
    space: "Leg and back muscles shrink and weaken without daily resistance and treadmill work.",
  },
  {
    key: "immune", name: "Blood and immune system", indicators: ["temp"], hazards: ["radiation", "environment"],
    does: "Fights infection; red cells carry oxygen.",
    space: "Immune responses shift in flight and dormant viruses can reactivate; red cell mass drops early in flight. Fever on a station affects the whole crew.",
    also: "bloodwork",
  },
];

// Daily routine: when each check-in measurement is due (mission clock hours).
export const ROUTINE = [
  { hour: 6.5, key: "hr", what: "Resting heart rate, before getting up" },
  { hour: 6.75, key: "temp", what: "Temperature, before exercise" },
  { hour: 7.0, key: "glucose", what: "Fasting blood sugar, before breakfast" },
  { hour: 7.25, key: "bp", what: "Blood pressure, after 5 minutes of rest" },
  { hour: 7.5, key: "sleep", what: "Sleep last night" },
  { hour: 18.0, key: "exercise", what: "Exercise minutes, after the last session" },
  { hour: 21.0, key: "mood", what: "Mood, before sleep" },
];

export const clockText = (h) => `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.floor((h % 1) * 60)).padStart(2, "0")}`;
