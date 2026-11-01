# Design spec — ECHO

Status: concept locked (passive multi-signal fusion, see below); a first working prototype exists in `app/` but currently implements only a subset of the full ECHO signal set (voice + self-report, not yet keystroke/CO2/countermeasure telemetry) under the earlier working name "CALLSIGN." Reconciling two parallel design passes done the same day — see note at the bottom.

## Rejected directions (history)

1. **"Astronaut digital twin"** — rejected 2026-10-01. Active published academic field (multiple 2025–2026 papers, e.g. Wiley INSIGHT "Astronaut Digital Twin," "Human Digital Twin for Astronauts," digital twin orthopedic/periodontal astronaut-care papers); not a differentiator, invites direct comparison to research we can't match in a weekend.
2. **Generic AI vitals/risk dashboard with self-report or simulated wearable feed** — rejected 2026-10-01 after a second, broader competitor sweep found **15+ public repos** already built for this exact 2026 challenge (AUREON, AstroHealth/AstroHealth Telemetry, AL-KASAV ASTROHEALTH, H.E.L.I.O.S, Project-Astra, ASTRA-VITAL, Astro_Friend, astroguard, astrohealth-monitor, Apollo 15 Astronaut Health Monitor, astra-space-health, threshold, and others). Nearly all share the same shape: a dashboard fed by self-report check-ins or simulated vitals, rendered as 2D charts/gauges/HUD cards. Several already claim offline-first and behavioral/mood self-assessment. Concept-level novelty in "AI health dashboard for astronauts" is exhausted — see `research_notes/competitor-analysis.md` for the full list.
3. **Crew comms content/sentiment analysis for isolation detection** — considered, rejected. Requires access to private crew communication *content*, which is both implausible (NASA would never expose this) and a dignity/trust problem that cuts against "Most Inspirational."

## Current direction: ECHO

**Thesis:** every found competitor requires the astronaut to feed it — a check-in form, a mood log, a wearable to put on. That's added cognitive load exactly where the brief says the astronaut is already overloaded (isolation, confinement, behavioral strain). ECHO infers risk from passive signals already produced as exhaust from normal mission operations — zero new hardware, zero added astronaut effort.

### The four signal streams (each cited, not invented)

| Stream | Source signal | What it indicates | Grounding |
|---|---|---|---|
| **Voice** | Cadence, pitch (F0), jitter, pause structure from routine crew↔ground comms audio | Cognitive workload / fatigue | NASA CR-4249 "Voice Measures of Workload"; NTRS 19880013997 "Voice-stress measure of mental workload"; Analysis of Fundamental Frequency Changes in Astronaut Speech in Microgravity, Acoustics 2024 |
| **Keystroke dynamics** | Inter-key timing/rhythm from normal IVA laptop/tablet use | Mental fatigue / stress | JMIR Biomedical Engineering keystroke-fatigue feasibility study; transferred from terrestrial keystroke-stress research — no prior astronaut-specific application found |
| **Cabin environment** | CO2/O2/temp/humidity telemetry, already instrumented on ISS-class vehicles | Cognitive impairment & headache risk | NASA NTRS 20160013696 "Effects of Acute Exposures to Carbon Dioxide upon Cognitive Functions"; NTRS 20100037203 |
| **Countermeasure telemetry** | ARED/treadmill/cycle-ergometer usage logs | Personalized bone/cardio decline trajectory | NASA-STD-3001 BMD maintenance standards — flags when *this astronaut's* dose tracks off *their own* expected curve, not a population average |

**Voice is scoped narrowly to behavioral/cognitive/fatigue only** — it is never used to infer cardiovascular, bone, or immune risk; that scientific overreach was caught and rejected in critique round 1 (see log below). Cardio/bone/immune risk in the current prototype come from the self-report panel; in full ECHO they'd come from countermeasure telemetry and cabin environment data instead of self-report, once those streams are built (see Open Items).

### Fusion layer

A reasoning engine cross-correlates the four streams instead of showing four separate gauges — e.g. rising CO2 + measurable speech-fluency decline + typing slowdown in the same window becomes one escalating, higher-confidence flag, not three unrelated alerts. Every flag renders its reasoning trace: which signal, which baseline deviation, which cited source. This explainability requirement is implemented today in the prototype's "why this flag" panel (`app/index.html`), currently only for the voice + self-report subset.

### Why this wins on plausibility

No new hardware dependency — every input already exists as data on current crewed vehicles. This is the strongest "Best Mission Concept" lever available.

## UI design: "The Signal" / "Signal Constellation"

A real-time 3D scene (WebGL/Three.js), not a 2D dashboard — no competitor found in either sweep uses 3D visualization. Two framings exist for the same idea and should be merged in the next design pass:

- **Built today** (`app/signal-viz.js`): a central torus-knot "voice-form" core whose color/surface turbulence reflects composite behavioral risk, with 3 orbiting satellites (bone/cardiovascular/immune) sized and colored by their own risk level.
- **Fuller spec** (not yet built): four orbital rings, one per signal stream (voice/keystroke/environment/countermeasure), with nodes lighting up per reading and visible "convergence spikes" — light-trails from rings to the core when multiple streams deviate together, making the fusion logic visually legible. Plus a mission-log timeline scrub that moves the camera through a tunnel of past constellation states (Best Use of Storytelling hook).
- **Tiered safety design** (built today, applies to both framings): a plain-language status-chip row renders independently of the 3D layer and is the authoritative safety-critical surface — the 3D view is never the only way to see an urgent flag. This came directly out of critique round 2.

### Color scheme (locked)

| Role | Color | Hex | Notes |
|---|---|---|---|
| Background / void | Deep space navy-black | `#05060A` | near-black, not pure black, to keep glow contrast readable |
| Voice ring | Teal-cyan | `#4DD8C4` | |
| Keystroke ring | Amber-gold | `#E8A33D` | |
| Environment (CO2) ring | Violet | `#9B6BD9` | |
| Countermeasure ring | Coral-rose | `#E85D75` | |
| Baseline / neutral state | Blue-grey | `#6B7A99` | consistent "within personal baseline" color everywhere |
| Confirmed multi-signal convergence | Warm red-orange | `#FF5A3C` | reserved only for fused, multi-stream flags |
| UI text / chrome | Soft off-white | `#E9EDF2` | |

Trend lines use a custom perceptually-even 4-hue ramp, not a rainbow gradient, so relative magnitude reads correctly at a glance. The prototype's current status-chip palette (normal/watch/flag = green/amber/red, `app/style.css`) should be reconciled with this fuller scheme in the next pass.

Performance/offline constraints: low particle counts, no heavy post-processing, all assets bundled locally — consistent with genuine offline-first; must run on a mid-range laptop GPU with no network.

## Critique log (why the design looks the way it does)

**Round 1:**
- Voice was originally claimed to signal cardiovascular/immune risk — scientifically unsupported, fixed by scoping voice to behavioral/cognitive/fatigue only; cardio/bone/immune come from other sources.
- Continuous passive speech monitoring raised a privacy/autonomy conflict with the brief's "astronauts carry responsibility for spotting changes in themselves" — fixed with a stated privacy-by-design principle: raw audio never leaves the astronaut's device, only derived feature vectors are processed, astronaut reviews/can delete before anything is stored. This applies to all four ECHO streams, not just voice.
- The 3D visualization needed a lightweight fallback for genuinely constrained hardware/bandwidth contexts.
- Don't overclaim "trained model" for voice — it's threshold/rule-based and cited; XGBoost is reserved for the self-report panel (and, in full ECHO, potentially the fusion layer once real/synthetic training data exists).
- No silent auto-escalation of flags to flight surgeons — astronaut reviews first (human-in-the-loop).

**Round 2:**
- Self-report risked being a boring, undifferentiated form (survey fatigue is a documented problem in real analog missions) — addressed short-term by an adaptive micro-check-in design (not yet built), and longer-term by ECHO replacing self-report with passive streams entirely.
- The 3D visualization could be a liability in a real emergency if it were the only way to see an urgent flag — fixed by making the status-chip row load and render independently of the Three.js layer. Implemented in `app/index.html`.
- Earth-deployment claims assumed a smartphone — needs to drop to SMS/USSD + plain phone-call voice capture at the floor tier for genuine "Global Connection"/"Local Impact" credibility (not yet built).
- No validation step existed — plan: reproduce the cited NASA F0-shift finding against the public numbers at demo time, not just cite it (not yet built).
- Positioning against NASA+Google's CMO-DA: frame this as a narrow, auditable, privacy-preserving complement, not a competing general assistant.

**Round 3 (feasibility/build order):**
- Naive FFT peak-picking for pitch is too noisy for a credible demo — implemented YIN algorithm instead (`app/pitch-detect.js`), verified against synthetic tones (`app/test-pitch-detect.js`, <0.01% error).
- Build order used: risk engine core (deterministic, tested standalone) → synthetic scenario data → pitch detection (tested standalone) → UI wiring → visualization last, since it's most tolerant of being rough under time pressure.

## What's built (app/)

- `risk-engine.js` — deterministic, cited threshold scoring for behavioral/bone/cardiovascular/immune; tested in `test-risk-engine.js`
- `pitch-detect.js` — YIN pitch detection + F0 shift/jitter extraction from audio frames; tested in `test-pitch-detect.js`
- `scenarios.js` — 3 synthetic 7-day mission scenarios (normal, fatigue-trending, acute stress spike) for demo
- `signal-viz.js` + `index.html` — Tier 1 status-chip row (safety-critical, independent) + Tier 2 3D visualization (voice-form core + 3 orbiting risk satellites), verified working in-browser against all 3 scenarios

## Open items (not yet built)

1. Add the keystroke-dynamics and cabin-CO2 signal streams, and replace self-report-derived bone/cardio/immune scoring with countermeasure-telemetry and environment-derived scoring per the full ECHO spec
2. Build the fuller "4 orbital rings + convergence spikes + mission-log timeline scrub" visualization, reconciling with what's built today
3. Reconcile the built status-chip color palette with the locked color scheme above
4. Live microphone capture wired to `pitch-detect.js` (currently only scenario-driven synthetic data feeds the UI)
5. SMS/USSD + plain-phone-call floor tier for Earth deployment
6. Demo-time validation step reproducing the cited NASA F0-shift study's reported numbers
7. Pick concrete data sourcing per stream for the MVP demo (real public datasets vs. synthetic calibrated to cited papers) — explicit per stream, not blurred
8. Final project name lock — "ECHO" is the current working name (supersedes "CALLSIGN")

## Note on reconciling two parallel passes

On 2026-10-01, two design passes happened independently and both got pushed: one (this document's critique log + the `app/` prototype) iteratively critiqued and built a voice-focused MVP under the name "CALLSIGN." The other (the signal-stream table, fusion layer, and UI color spec above) ran a deeper competitor sweep, found the field was far more crowded than the first 3-repo check suggested, and pivoted to the broader "ECHO" multi-signal concept before any code existed for it. This document merges both: ECHO is the standing concept; the prototype is a real, working, but partial slice of it (voice + self-report only). Next step should explicitly decide whether to extend the existing prototype toward full ECHO or treat the prototype as a disposable spike.

## Next step

Resolve the reconciliation question above, then continue the critique/build cycle or move to locking a final spec per `writing-plans`.
