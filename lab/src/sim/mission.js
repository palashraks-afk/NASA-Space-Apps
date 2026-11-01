import { mulberry32, normal } from "../engine/rng.js";
import { fit, makeDesign, makePrior, simulateOutcomes, verdict, credibleInterval, effectMean, trueLabel } from "../engine/trial.js";
import { TYPICAL_LEVEL } from "./presets.js";

// The design follows how fast the intervention acts. Fast (within a day): randomize every day,
// no washout. Slow (several days): one-week blocks with two washout days. Measured in
// analysis/lab_design_search_response_*.json: daily randomization is far stronger for fast
// effects and far weaker for slow ones.
export function recommendDesign(speed) {
  return speed === "day"
    ? { blockLen: 1, washout: 0, response: 1, name: "Randomize each day", why: "It acts within a day, so each day can be its own test." }
    : { blockLen: 7, washout: 2, response: 0.6, name: "One-week blocks, first two days of each switch not counted", why: "It takes days to act, so each switch needs time to settle before it counts." };
}

// Mystery mode: the true effect is hidden and drawn from a spread of plausible outcomes, in
// units of the smallest worthwhile effect. This is a game scenario, not a claim about any
// real intervention.
export function drawMysteryEffect(seed, delta) {
  const rng = mulberry32(seed);
  const u = rng();
  if (u < 0.35) return (rng() - 0.5) * delta;            // too small to matter
  if (u < 0.85) return delta * (1.2 + 1.8 * rng());      // worthwhile
  return -delta * (1.2 + 1.3 * rng());                   // backfires
}

// Builds a full mission: schedule, the day-by-day data a crew member would log, and the
// truth. Outcome values are in display units; "improvement" units flip sign so that larger
// always means better, which is what the engine analyses.
// baseSeries (optional): a real person's logged values, in display units, used as the
// day-to-day noise. The hidden effect is added on change days (with the same slow-response
// rule as the simulator), so everything except the effect is real data.
export function buildMission({ seed, days, outcome, design, trueEffect, baseSeries = null }) {
  const rng = mulberry32(seed);
  const n = baseSeries ? Math.min(days, baseSeries.length) : days;
  const schedule = makeDesign({ days: n, blockLen: design.blockLen, washout: design.washout, rng });
  const better = outcome.better;
  let improvement;
  if (baseSeries) {
    let exposure = schedule[0].arm;
    improvement = schedule.map((d, t) => {
      exposure += design.response * (d.arm - exposure);
      return better * baseSeries[t] + trueEffect * exposure;
    });
  } else if (outcome.realPeople) {
    // One real person from the open diaries: their typical level, and each day one of their
    // own logged deviations drawn at random. The change acts through the same slow-response
    // rule; values are kept within physical limits (e.g. at least 1 minute to fall asleep).
    const person = outcome.realPeople[Math.floor(rng() * outcome.realPeople.length)];
    let exposure = schedule[0].arm;
    improvement = schedule.map((d) => {
      exposure += design.response * (d.arm - exposure);
      const raw = person.mean + person.devs[Math.floor(rng() * person.devs.length)];
      const shifted = raw + better * trueEffect * exposure;
      return better * Math.min(outcome.max, Math.max(outcome.min, shifted));
    });
  } else {
    improvement = simulateOutcomes(schedule, {
      b0: better * TYPICAL_LEVEL[outcome.key], effect: trueEffect, response: design.response, sigma: outcome.sd, rho: outcome.rho,
    }, rng);
  }
  const values = improvement.map((v) => better * v);
  return { seed, days: n, schedule, improvement, values, trueEffect, prior: makePrior(outcome.sd), real: !!baseSeries };
}

export function analyseDay(mission, day, delta, thr) {
  const post = fit(mission.schedule, mission.improvement, { prior: mission.prior, upTo: day });
  if (!post) return { day, post: null, v: { pWork: 0, pNone: 0, pHarm: 0, label: "inconclusive" }, ci: null, mean: 0 };
  return { day, post, v: verdict(post, { delta, thr }), ci: credibleInterval(post), mean: effectMean(post) };
}

export function truthLabel(mission, delta) {
  return trueLabel(mission.trueEffect, delta);
}

export { normal };
