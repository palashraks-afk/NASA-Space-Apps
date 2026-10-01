# NASA Space Apps 2026 — Astronaut Health Monitoring

**Challenge:** [Create Health Monitoring Software for Astronauts on Space Missions](https://www.spaceappschallenge.org/2026/challenges/create-health-monitoring-software-for-astronauts-on-space-missions/)
**Local Event:** San Marino, CA
**Team Owner:** Rahul (lead dev, OncoVision AI — cancer-risk platform, Python/JS, XGBoost)

> Long-duration missions expose astronauts to space radiation, isolation and confinement, altered gravity, and a hostile closed environment, bringing immune changes, bone loss, cardiovascular events, and behavioral health problems. Astronauts carry much of the responsibility for spotting these changes themselves. Build health monitoring software that gathers health indicators and enables astronauts to evaluate and act on the status of their health.

## Status

Pre-build. Currently in research/design phase — see [`research_notes/`](research_notes/) for competitor analysis and award-criteria mapping, and [`docs/design.md`](docs/design.md) for the current project design.

## Why this approach

Early framing ("digital twin for astronauts") turned out to be **not novel** — it's an actively published academic field, and a broader sweep found **15+ other 2026 Space Apps teams** already building AI health-monitoring dashboards for this same challenge. See [`research_notes/competitor-analysis.md`](research_notes/competitor-analysis.md) for the full field and where the real gaps are.

Current direction: **ECHO** — instead of another self-report/wearable dashboard (what nearly every competitor built), it infers risk from passive signals astronauts already generate with zero added effort: voice cadence from routine comms, keystroke timing from normal laptop use, cabin CO2/environmental telemetry, and exercise-countermeasure usage logs — each threshold traced to a specific cited NASA source. Rendered as a real-time 3D "signal constellation" rather than a 2D chart dashboard. Full spec in [`docs/design.md`](docs/design.md).

## Repo layout

- `research_notes/` — competitor analysis, award-criteria mapping, data source notes
- `docs/` — design docs
- `data/` — NASA dataset references/snapshots (once sourced)
- `app/` — application code (once build starts)
