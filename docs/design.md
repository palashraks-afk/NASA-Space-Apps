# Design spec — ECHO

Status: locked concept, ready to move to implementation planning.

## Rejected directions (history)

1. **"Astronaut digital twin"** — rejected 2026-10-01. Active published academic field (multiple 2025–2026 papers); not a differentiator.
2. **Generic AI vitals/risk dashboard with self-report or simulated wearable feed** — rejected 2026-10-01 after competitor sweep found **15+ public repos** already built for this exact 2026 challenge (AUREON, AstroHealth/AstroHealth Telemetry, AL-KASAV ASTROHEALTH, H.E.L.I.O.S, Project-Astra, ASTRA-VITAL, Astro_Friend, astroguard, astrohealth-monitor, Apollo 15 Astronaut Health Monitor, and others). Nearly all of them share the same shape: a dashboard fed by self-report check-ins, simulated vitals, or a radiation dosimeter feed, rendered as 2D charts/gauges/HUD cards. Several already claim offline-first and behavioral/mood self-assessment. Concept-level novelty in "AI health dashboard for astronauts" is exhausted; the differentiator has to be structural, not a feature add.
3. **Crew comms content/sentiment analysis for isolation detection** — considered, rejected. Requires access to private crew communications content, which is both a plausibility problem (NASA would never expose this) and a trust/dignity problem that cuts against "Most Inspirational." Noted here so the reasoning isn't silently lost.

## Current direction: ECHO

**Thesis:** every competitor system requires the astronaut to feed it — a check-in form, a mood log, a wearable to put on, a dosimeter reading to transcribe. That's additional cognitive load exactly where the challenge brief identifies the astronaut is already overloaded (isolation, confinement, behavioral strain). ECHO inverts the model: it infers health/behavioral risk entirely from **passive signals already produced as exhaust from normal mission operations** — zero new hardware, zero additional astronaut effort, nothing to remember to log.

### The four signal streams (each backed by a specific cited NASA/published source, not an invented number)

| Stream | Source signal | What it indicates | Grounding |
|---|---|---|---|
| **Voice** | Cadence, pitch, pause structure, speech-onset time from routine crew↔ground comms audio | Cognitive workload / fatigue | NASA CR-4249 "Voice Measures of Workload"; NTRS 19880013997 "Voice-stress measure of mental workload"; Apollo 11 astronaut-speech case study |
| **Keystroke dynamics** | Inter-key timing/rhythm from normal IVA laptop/tablet use (science logging, procedures) | Mental fatigue / stress | JMIR Biomedical Engineering keystroke-fatigue feasibility study; CMU keystroke stress-detection work (transferred to this domain — no prior astronaut-specific application found) |
| **Cabin environment** | CO2 ppm / O2 / temp / humidity telemetry, already instrumented on ISS-class vehicles | Cognitive impairment & headache risk | NASA NTRS 20160013696 "Effects of Acute Exposures to Carbon Dioxide upon Cognitive Functions"; NTRS 20100037203; NASA's own documented CO2–headache dose-response findings |
| **Countermeasure telemetry** | ARED/treadmill/cycle-ergometer usage logs | Personalized bone/cardio decline trajectory | NASA-STD-3001 BMD maintenance standards (≥95% hip/spine, ≥90% femoral neck vs. pre-mission) — flags when *this specific astronaut's* countermeasure dose is tracking off *their own* expected curve, not a population-average risk number |

### Fusion layer

A reasoning engine cross-correlates the four streams instead of showing four separate gauges. Example: rising CO2 + measurable speech-fluency decline + typing slowdown in the same window is a single escalating, higher-confidence flag — not three unrelated alerts. Every flag renders its reasoning trace: which signal, which baseline deviation, which cited source.

### Why this wins on plausibility

No new hardware dependency — every input already exists as data on current crewed vehicles (comms audio, laptop interaction logs, ECLSS environmental telemetry, exercise-device usage logs). This is the single biggest "Best Mission Concept" lever available: it's buildable with no invented sensor.

## UI design: "Signal Constellation"

Every competitor found in the sweep renders 2D dashboards — chart grids, gauge cards, or a HUD panel. The UI needs to be a different visual language, not a better-looking version of the same thing, and it needs to make the fusion concept *visible*, not just computed.

### Concept

A real-time 3D scene (WebGL via Three.js / react-three-fiber), not a flat dashboard:

- **Core** — a single sphere at the center representing the astronaut's overall fused state. Idle = steady slow pulse. Size/glow intensity = composite risk level.
- **Four orbital rings**, one per signal stream, at increasing radius/depth (z-layers) around the core — voice, keystroke, environment, countermeasure. Each ring carries small nodes that light up as new readings arrive; node brightness/size = magnitude of deviation from that astronaut's personal baseline.
- **Convergence spikes** — when two or more rings deviate in the same time window, thin light-trails extend from those rings inward to the core and visibly merge, making the fusion logic (the actual technical differentiator) visually legible instead of buried in a log line.
- **Mission log scrub** — a timeline control lets you scrub backward through the mission; the camera moves along the time axis through a tunnel of past constellation states, turning the health record into a navigable, narrated "mission log" instead of a static chart (this is the Best Use of Storytelling hook: scrubbing through time *feels* like replaying the mission, not reading a spreadsheet).
- **Explain panel** — clicking any node/spike opens a side panel with the reasoning trace and its cited source, keeping the explainability requirement intact underneath the visual layer.

Performance/offline constraints: low particle counts, no heavy post-processing, all assets bundled locally (no CDN dependency) — consistent with the genuinely-offline-first requirement; the 3D scene must run on a mid-range laptop GPU with no network.

### Color scheme

Dark, low-glare "deep mission" palette — accessible, restrained, and semantically disciplined (color is never the only signal; each ring also has a distinct icon/shape so the encoding survives colorblindness):

| Role | Color | Hex | Notes |
|---|---|---|---|
| Background / void | Deep space navy-black | `#05060A` | near-black, not pure black, to keep glow contrast readable |
| Voice ring | Teal-cyan | `#4DD8C4` | |
| Keystroke ring | Amber-gold | `#E8A33D` | |
| Environment (CO2) ring | Violet | `#9B6BD9` | |
| Countermeasure ring | Coral-rose | `#E85D75` | |
| Baseline / neutral state | Blue-grey | `#6B7A99` | used for "within personal baseline" everywhere, consistently |
| Confirmed multi-signal convergence | Warm red-orange | `#FF5A3C` | reserved *only* for fused, multi-stream flags — never used per-metric, so it stays meaningful when it appears |
| UI text / chrome | Soft off-white | `#E9EDF2` | |

Trend lines use a custom perceptually-even 4-hue ramp (not a rainbow gradient) so relative magnitude reads correctly at a glance.

### Why this is new

Novelty check (2026-10-01 web sweep) found no competitor repo in this challenge using 3D/WebGL visualization, voice biomarkers, keystroke dynamics, or cabin-environment-driven cognitive risk modeling — every one found so far uses 2D charts/cards/HUD panels over self-report or simulated-vitals data. Re-check closer to submission, per the standing caveat in `research_notes/competitor-analysis.md`.

## Award mapping (ECHO-specific)

- **Best Use of Science** — every threshold traces to a specific cited NASA technical report, not an invented or "illustrative" number (the gap all 15+ competitors share).
- **Best Use of Data** — fuses four genuinely distinct NASA-adjacent data classes (audio, interaction telemetry, ECLSS environmental data, exercise-hardware telemetry); no other found competitor fuses more than vitals + one extra stream.
- **Best Use of Technology** — real signal processing (audio feature extraction, keystroke-timing analysis, time-series fusion) plus a real-time 3D rendering engine, vs. the rule-engine-on-seeded-CSV + 2D chart pattern common across competitors.
- **Galactic Impact / Local Impact / Global Connection** — same zero-new-hardware passive engine ports directly to Earth populations where self-report is unreliable or burdensome and the same instrumentation already exists: ICU/palliative patients, shift workers, remote/polar/submarine crews, aging-in-place elderly using their own devices.
- **Best Mission Concept** — most plausible precisely because it needs no new hardware; every signal already exists on current crewed vehicles.
- **Most Inspirational** — a system that watches over the astronaut without asking anything extra of them, at the exact moment the brief says they're already overloaded.
- **Best Use of Storytelling** — mission-log timeline scrub through the 3D constellation, not a bar chart.
- **Art & Technology** — the constellation visual language is a genuine design+engineering artifact, not a styled dashboard template.

## Open items before implementation planning

1. Pick concrete data sourcing per stream for the MVP demo: real public datasets where they exist (NASA OSDR, published CO2 telemetry studies) vs. realistic synthetic generation calibrated to the cited papers' reported ranges — needs to be explicit per stream, not blurred.
2. Confirm the exact NASA source document per threshold before the build (cite precisely, not generically, in-app).
3. Scope the 3D build for a ~48 hr window: react-three-fiber + drei, bundled assets, capped particle/node counts.
4. Decide MVP voice/keystroke input: live mic/keyboard capture during demo vs. pre-recorded/replayed session data — needs to be unambiguous in the demo script.
5. Lock final project name ("ECHO" working, not yet confirmed final).

## Next step

Move to `writing-plans` for implementation once items 1–4 above are resolved.
