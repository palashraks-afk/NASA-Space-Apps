# Design notes (draft — not finalized)

Status: in progress. This is a working doc, not an approved spec yet.

## Rejected direction

"Astronaut digital twin" — rejected 2026-10-01. Not novel: it's an active academic research area (multiple 2025–2026 papers, e.g. Wiley INSIGHT "Astronaut Digital Twin," "Human Digital Twin for Astronauts," digital twin orthopedic/periodontal astronaut-care papers) and the term invites direct comparison to published research we can't match in a weekend. Keep the underlying idea (personalized baseline, trend forecasting) but drop the "digital twin" label and the framing that it's unclaimed territory.

## Current direction

Risk-monitoring system built on **traceable, cited thresholds** and **explainable flags**, differentiated from the 3 known competitor repos (see `research_notes/competitor-analysis.md`) specifically on rigor and Earth-impact, not on concept novelty — the concept (AI health monitoring for astronauts) is now a crowded space; execution quality and sourcing discipline are the actual edge.

Core pieces still to nail down before this becomes an approved spec:

1. Data ingestion: self-report check-in (MVP, no hardware dependency) vs. simulated streaming vitals vs. both
2. Threshold sourcing: which specific NASA HRP/OSDR/Twins Study publications back each of the 4 risk categories (immune, bone, cardiovascular, behavioral) — needs real literature pull, not assumed
3. Explainability mechanism: how a flag shows its reasoning trace to the astronaut
4. Offline-first architecture: what "genuinely offline" means technically (not just async-tolerant)
5. Earth-impact deployment: what population, what delivery constraint (bandwidth/language), how it reuses the same core engine without becoming a second product
6. UI/storytelling pass: "mission health log" framing vs. plain dashboard

## Next step

Resume brainstorming to lock sections 1–6 above, then write the real design doc per `superpowers:brainstorming` (`docs/superpowers/specs/YYYY-MM-DD-*-design.md`), get sign-off, then move to `writing-plans` for implementation.
