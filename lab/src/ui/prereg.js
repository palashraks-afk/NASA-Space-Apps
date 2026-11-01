// The pre-registration card: everything that decides the verdict, fixed before day 1.
export function buildPrereg(S, outcome, intervention, design) {
  return {
    title: "Sol Lab experiment plan",
    locked_at: new Date().toISOString(),
    question: `Does "${intervention.label}" change ${outcome.label.toLowerCase()} compared with "${intervention.control}"?`,
    destination: S.destLabel,
    outcome: { name: outcome.label, unit: outcome.unit, better: outcome.better > 0 ? "higher" : "lower" },
    smallest_worthwhile_change: `${outcome.fmtDelta(S.delta)}`,
    decision_threshold: `posterior probability at least ${S.thr}`,
    design: { name: design.name, block_days: design.blockLen, settling_days_not_counted: design.washout, mission_days: S.days },
    randomization_seed: S.seed,
    schedule: S.mission.schedule.map((d) => (d.washout ? "settling" : d.arm ? "change" : "usual")),
    analysis: "Bayesian linear model: outcome = baseline + effect x (change day) + weekly drift + noise; day-to-day correlation (AR(1)) integrated over; Normal-Inverse-Gamma prior scaled to the outcome's usual spread.",
    stopping_rule: `One verdict, read on day ${S.days}. Checking earlier is allowed for interest but does not change the verdict.`,
    verdicts: ["works for you", "no meaningful change", "backfires", "not settled"],
    mode: S.mode === "hidden" ? "hidden truth (game scenario)" : "practice (truth set by the user)",
  };
}

export function downloadJSON(obj, name) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
