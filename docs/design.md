# Design notes (draft — not finalized)

Status: first working prototype built 2026-10-01 (app/). Concept locked after 3 critique rounds; still open items before this is a submission-ready spec.

## Rejected direction

"Astronaut digital twin" — rejected 2026-10-01. Not novel: it's an active academic research area (multiple 2025–2026 papers, e.g. Wiley INSIGHT "Astronaut Digital Twin," "Human Digital Twin for Astronauts," digital twin orthopedic/periodontal astronaut-care papers) and the term invites direct comparison to published research we can't match in a weekend.

## Current direction: CALLSIGN

*"Every transmission is a checkup."*

Astronauts already talk constantly — to mission control, to each other, into mission logs. CALLSIGN passively extracts validated acoustic biomarkers (pitch/F0 shift, jitter, speech rate) from that existing audio stream and fuses it with a short self-report check-in into per-system risk flags. Every threshold traces to a specific cited study — see `app/risk-engine.js` and `research_notes/competitor-analysis.md` for why this (not concept novelty) is the real differentiator against the 5 known competitor repos.

### Critique log (why the design looks the way it does)

**Round 1:**
- Voice was originally claimed to signal cardiovascular/immune risk — scientifically unsupported, fixed by scoping voice to behavioral/cognitive/fatigue only (where real evidence exists); cardio/bone/immune come from the self-report panel instead.
- Continuous passive speech monitoring raised a privacy/autonomy conflict with the challenge brief's "astronauts carry responsibility for spotting changes in themselves" — fixed with a stated privacy-by-design principle: raw audio never leaves the astronaut's device, only derived feature vectors are processed, astronaut reviews/can delete before anything is stored.
- "The Signal" full 3D visualization needed a lightweight fallback for genuinely constrained hardware/bandwidth contexts (onboard low-power, rural clinic terminals).
- Flagged: don't overclaim "trained model" for voice — it's threshold/rule-based and cited; XGBoost is reserved for the self-report panel.
- Flagged: no silent auto-escalation of flags to flight surgeons — astronaut reviews first (human-in-the-loop).

**Round 2:**
- Self-report risked being a boring, undifferentiated form (survey fatigue is a documented problem in real analog missions) — addressed by designing it as a short adaptive micro-check-in (not yet built — currently sliders as a dev stand-in, see Open Items).
- The 3D visualization could be a liability in a real emergency if it were the only way to see an urgent flag — fixed by making the status-chip row (Tier 1, plain color/word) load and render independently of the Three.js layer (Tier 2). Implemented in `app/index.html`.
- Earth-deployment claims assumed a smartphone — needs to drop to SMS/USSD + plain phone-call voice capture at the floor tier for genuine "Global Connection"/"Local Impact" credibility (not yet built).
- No validation step existed — plan: reproduce the cited NASA F0-shift finding against the public numbers at demo time, not just cite it (not yet built).
- Positioning against NASA+Google's CMO-DA: frame CALLSIGN as a narrow, auditable, privacy-preserving complement, not a competing general assistant.

**Round 3 (feasibility/build order):**
- Naive FFT peak-picking for pitch is too noisy for a credible demo — implemented YIN algorithm instead (`app/pitch-detect.js`), verified against synthetic tones (`app/test-pitch-detect.js`, <0.01% error).
- Build order used: risk engine core (deterministic, tested standalone) → synthetic scenario data → pitch detection (tested standalone) → UI wiring → visualization last, since it's most tolerant of being rough under time pressure.

## What's built (app/)

- `risk-engine.js` — deterministic, cited threshold scoring for behavioral/bone/cardiovascular/immune; tested in `test-risk-engine.js`
- `pitch-detect.js` — YIN pitch detection + F0 shift/jitter extraction from audio frames; tested in `test-pitch-detect.js`
- `scenarios.js` — 3 synthetic 7-day mission scenarios (normal, fatigue-trending, acute stress spike) for demo
- `signal-viz.js` + `index.html` — Tier 1 status-chip row (safety-critical, independent) + Tier 2 "The Signal" Three.js visualization (voice-form core + 3 orbiting risk satellites), verified working in-browser against all 3 scenarios

## Open items (not yet built)

1. Real micro-check-in UI (3-tap adaptive) — currently dev sliders standing in for it
2. Live microphone capture wired to `pitch-detect.js` (currently only scenario-driven synthetic data feeds the UI)
3. SMS/USSD + plain-phone-call floor tier for Earth deployment
4. Demo-time validation step reproducing the cited NASA F0-shift study's reported numbers
5. XGBoost model for the self-report panel (currently simple threshold rules, same engine as voice)
6. Final project name lock — "CALLSIGN" is the current working name

## Next step

Continue critique/build cycle per user direction, or move to locking the open items above into a proper spec doc once stable.
