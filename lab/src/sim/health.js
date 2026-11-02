// Crew health and cabin environment over a mission, generated deterministically.
// What is real and what is simulated is stated per signal (also shown in the interface):
// - Sleep: each crew member IS one of the 49 open-diary participants; days resampled from
//   their own logged deviations (Baigutanova et al. 2025, CC BY).
// - Heart rate and HRV (wearable, daytime-weighted daily medians): typical level, spread
//   between people, day-to-day spread and autocorrelation all from the same dataset;
//   individual series simulated.
// - Core body temperature: rises about 1 degC over roughly 2.5 months in flight, then
//   plateaus (Stahn et al. 2017, 11 ISS astronauts); individual series simulated.
// - Meals: real USDA nutrient values for station-like foods; daily menus simulated.
// - Cabin air: carbon dioxide, temperature, humidity simulated within NASA-STD-3001 ranges,
//   with occasional days of reduced scrubber capacity; headache risk from Law et al. 2014
//   (odds double per +1 mmHg CO2; 7-day average under 2.5 mmHg keeps risk under 1%).
import { mulberry32, normal } from "../engine/rng.js";

export const PREFLIGHT = 14; // days of pre-flight baseline (days -14 .. -1)
export const NUTRITION_TARGETS = {
  vitamin_d_IU: { min: 1000, label: "Vitamin D", unit: "IU", source: "NASA JSC-67378 (2020): 1000 IU per day" },
  calcium_mg: { min: 1000, max: 1200, upper: 2500, label: "Calcium", unit: "mg", source: "NASA JSC-67378 (2020): 1000 to 1200 mg per day, not above 2500" },
  sodium_mg: { min: 1500, max: 2300, label: "Sodium", unit: "mg", source: "NASA JSC-67378 (2020): 1500 to 2300 mg per day" },
};
export const AIR_LIMITS = {
  co2_1h_mmHg: 3.0,     // NASA nominal 1-hour average limit since 2022 (via 2026 npj Microgravity review)
  co2_7d_headache_mmHg: 2.5, // Law et al. 2014: keeps headache risk under 1%
  temp_C: [18, 27],     // NASA-STD-3001 Vol 2
  rh_pct: [25, 75],     // NASA-STD-3001 Vol 2
};

// Law et al. 2014: odds of a reported headache double for each +1 mmHg of CO2; 1% at 2.5 mmHg.
export function headacheRisk(co2_7d) {
  const odds0 = 0.01 / 0.99;
  const odds = odds0 * Math.pow(2, co2_7d - AIR_LIMITS.co2_7d_headache_mmHg);
  return odds / (1 + odds);
}

function ar1Series(n, mean, sd, rho, rng) {
  const out = [];
  let e = sd * normal(rng);
  for (let i = 0; i < n; i++) {
    if (i) e = rho * e + sd * Math.sqrt(1 - rho * rho) * normal(rng);
    out.push(mean + e);
  }
  return out;
}

export function buildCrewHealth({ seed = 2026, days = 180, realNoise, foods }) {
  const rng = mulberry32(seed);
  const n = PREFLIGHT + days;
  const dayOf = (i) => i - PREFLIGHT; // -14 .. days-1
  const o = realNoise.outcomes;
  const sleepPeople = realNoise.deviations.sleep_duration.people;
  const effPeople = realNoise.deviations.sleep_efficiency.people;
  const latPeople = realNoise.deviations.sleep_latency.people;

  // Cabin environment, shared by the crew.
  const env = { co2: [], co2_7d: [], temp: [], rh: [], headache: [], scrubberReduced: [] };
  let co2 = 2.2, reducedLeft = 0;
  for (let i = 0; i < n; i++) {
    if (dayOf(i) >= 0 && reducedLeft === 0 && rng() < 0.035) reducedLeft = 3 + Math.floor(rng() * 4);
    const target = reducedLeft > 0 ? 3.6 : 2.2;
    co2 += 0.45 * (target - co2) + 0.12 * normal(rng);
    if (reducedLeft > 0) reducedLeft--;
    env.scrubberReduced.push(target > 3);
    env.co2.push(Math.max(1.2, co2));
    const w = env.co2.slice(Math.max(0, i - 6));
    env.co2_7d.push(w.reduce((a, b) => a + b, 0) / w.length);
    env.headache.push(headacheRisk(env.co2_7d[i]));
    env.temp.push(22.6 + 0.5 * normal(rng));
    env.rh.push(Math.min(70, Math.max(30, 46 + 5 * normal(rng))));
  }

  const crew = ["A", "B", "C", "D"].map((id, k) => {
    const pick = (list) => list[(Math.floor(rng() * list.length) + k * 7) % list.length];
    const sp = pick(sleepPeople), ep = pick(effPeople), lp = pick(latPeople);
    const boot = (p) => p.mean + p.devs[Math.floor(rng() * p.devs.length)];
    const hrMean = o.day_hr.median_person_mean + o.day_hr.between_person_sd_of_means * normal(rng);
    const rmMean = o.day_rmssd.median_person_mean + o.day_rmssd.between_person_sd_of_means * normal(rng);
    const tBase = 36.8 + 0.15 * normal(rng);
    const temp = [];
    for (let i = 0; i < n; i++) {
      const d = dayOf(i);
      const rise = d >= 0 ? 1.0 * (1 - Math.exp(-d / 25)) : 0; // ~95% of the rise by day 75
      temp.push(tBase + rise + 0.12 * normal(rng));
    }
    // Meals: breakfast (2 items), lunch (main, side, tortilla), dinner (main, 2 sides),
    // two snacks and three drinks a day.
    const by = (slot) => foods.filter((f) => f.slot === slot);
    const tortilla = foods.find((f) => f.name === "Flour tortilla");
    const spreads = foods.filter((f) => f.slot === "any" && f.name !== "Flour tortilla");
    const meals = [];
    for (let i = 0; i < n; i++) {
      const choose = (list) => list[Math.floor(rng() * list.length)];
      const items = [
        choose(by("breakfast")), choose(by("breakfast")),
        choose(by("main")), choose(by("side")), tortilla, choose(spreads),
        choose(by("main")), choose(by("side")), choose(by("side")),
        choose(by("snack")), choose(by("snack")),
        choose(by("drink")), choose(by("drink")), choose(by("drink")),
      ];
      const tot = { kcal: 0, protein_g: 0, calcium_mg: 0, sodium_mg: 0, vitamin_d_IU: 0 };
      for (const f of items) for (const key of Object.keys(tot)) tot[key] += (f.per100[key] * f.serving_g) / 100;
      meals.push({ items: items.map((f) => f.name), ...tot });
    }
    return {
      id,
      sleepDuration: Array.from({ length: n }, () => Math.max(0, boot(sp))),
      sleepEfficiency: Array.from({ length: n }, () => Math.min(1, Math.max(0, boot(ep))) * 100),
      sleepLatency: Array.from({ length: n }, () => Math.max(1 / 60, boot(lp)) * 60),
      hr: ar1Series(n, hrMean, o.day_hr.within_person_sd.median, Math.max(0, o.day_hr.lag1_autocorrelation.median), rng),
      rmssd: ar1Series(n, rmMean, o.day_rmssd.within_person_sd.median, Math.max(0, o.day_rmssd.lag1_autocorrelation.median), rng),
      temp,
      meals,
    };
  });
  return { days, preflight: PREFLIGHT, n, dayOf, env, crew };
}

// A person's usual range from their pre-flight days: mean plus or minus a 95% prediction
// interval (Student t). Fewer than 5 baseline days: no range ("too few days to tell").
import { tQuantile } from "../engine/trial.js";
export function usualRange(series, preflight = PREFLIGHT, { min = -Infinity, max = Infinity } = {}) {
  const base = series.slice(0, preflight).filter((v) => Number.isFinite(v));
  if (base.length < 5) return null;
  const m = base.reduce((a, b) => a + b, 0) / base.length;
  const sd = Math.sqrt(base.reduce((a, b) => a + (b - m) ** 2, 0) / (base.length - 1));
  const h = tQuantile(0.975, base.length - 1) * sd * Math.sqrt(1 + 1 / base.length);
  // Clip to what the measure can physically take (e.g. sleep efficiency cannot exceed 100%).
  return { mean: m, lo: Math.max(min, m - h), hi: Math.min(max, m + h), n: base.length };
}
