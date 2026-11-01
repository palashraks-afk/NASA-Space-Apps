// Outcomes use real day-to-day noise (within-person SD, lag-1 autocorrelation, medians across
// people) from the open wearable and sleep-diary dataset; see public/data/real_noise.json.
// `better` is +1 when higher is better and -1 when lower is better.
// `delta` is the smallest change worth acting on; it is a judgment, shown to the user as one.

// `min`/`max` are physical limits used when simulating daily values.
export const OUTCOMES = {
  sleep_duration: { label: "Sleep duration", unit: "h", better: 1, delta: 0.5, min: 0, max: 16, fmt: (v) => `${v.toFixed(2)} h`, fmtDelta: (v) => `${Math.round(v * 60)} min` },
  sleep_efficiency: { label: "Sleep efficiency", unit: "%", scale: 100, better: 1, delta: 2, min: 0, max: 100, fmt: (v) => `${v.toFixed(1)}%`, fmtDelta: (v) => `${v.toFixed(1)} points` },
  sleep_latency: { label: "Time to fall asleep", unit: "min", scale: 60, better: -1, delta: 8, min: 1, max: 600, fmt: (v) => `${Math.round(v)} min`, fmtDelta: (v) => `${Math.round(v)} min` },
  day_rmssd: { label: "Heart rate variability", unit: "ms", better: 1, delta: 5, fmt: (v) => `${v.toFixed(0)} ms`, fmtDelta: (v) => `${v.toFixed(1)} ms` },
  day_hr: { label: "Daily heart rate", unit: "bpm", better: -1, delta: 3, fmt: (v) => `${v.toFixed(0)} bpm`, fmtDelta: (v) => `${v.toFixed(1)} bpm` },
};

// "speed": how fast the body responds. "day" = within a day; "days" = over several days.
// These are stated assumptions the user can override, not facts about the interventions.
export const INTERVENTIONS = {
  caffeine: { label: "No caffeine after noon", control: "Usual caffeine timing", speed: "day", outcomes: ["sleep_latency", "sleep_duration", "sleep_efficiency"] },
  winddown: { label: "Ten-minute wind-down before sleep", control: "No wind-down", speed: "day", outcomes: ["sleep_latency", "sleep_efficiency", "sleep_duration"] },
  cooler: { label: "Cooler sleep station", control: "Standard temperature", speed: "day", outcomes: ["sleep_efficiency", "sleep_duration", "sleep_latency"] },
  morning_ex: { label: "Exercise in the morning", control: "Exercise in the evening", speed: "day", outcomes: ["sleep_latency", "sleep_efficiency", "day_hr"] },
  bright_wake: { label: "Bright light right after waking", control: "Normal cabin light", speed: "days", outcomes: ["sleep_latency", "sleep_duration", "day_rmssd"] },
  breathing: { label: "Daily slow-breathing session", control: "No session", speed: "days", outcomes: ["day_rmssd", "day_hr"] },
};

export const DESTINATIONS = {
  iss: { label: "Space station", dayHours: 24, note: "Cabin lights follow a 24 h schedule; the station itself circles Earth about every 93 minutes." },
  moon: { label: "Moon base", dayHours: 24, note: "A lunar day lasts about 29.5 Earth days, so habitat lighting sets a 24 h schedule." },
  mars: { label: "Mars", dayHours: 24 + 39 / 60 + 35 / 3600, note: "A Mars solar day (sol) is 24 h 39 min 35 s. Crews living on Mars time must shift their clock 39 minutes later every sol." },
};

export function loadOutcomes(realNoise) {
  const out = {};
  for (const [key, o] of Object.entries(OUTCOMES)) {
    const r = realNoise.outcomes[key];
    const scale = o.scale ?? 1;
    out[key] = {
      ...o,
      key,
      sd: r.within_person_sd.median * scale,
      // medians slightly below zero (sleep outcomes) are treated as zero autocorrelation
      rho: Math.max(0, r.lag1_autocorrelation.median),
      rhoIQR: [r.lag1_autocorrelation.p25, r.lag1_autocorrelation.p75],
      people: r.people,
      source: r.label,
      // Real people's own typical level and logged day-to-day deviations (display units),
      // for outcomes the diaries cover. Each simulated person is one of these real people.
      realPeople: realNoise.deviations && realNoise.deviations[key]
        ? realNoise.deviations[key].people.map((p) => ({ mean: p.mean * scale, devs: p.devs.map((d) => d * scale) }))
        : null,
    };
  }
  return out;
}

// Typical outcome levels for a healthy adult, used only to place the simulated data on a
// familiar scale. They do not affect any verdict (the model estimates its own baseline).
export const TYPICAL_LEVEL = { sleep_duration: 6.8, sleep_efficiency: 90, sleep_latency: 20, day_rmssd: 45, day_hr: 72 };
