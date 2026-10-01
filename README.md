# NASA Space Apps 2026 — Astronaut Health Monitoring

**Challenge:** [Create Health Monitoring Software for Astronauts on Space Missions](https://www.spaceappschallenge.org/2026/challenges/create-health-monitoring-software-for-astronauts-on-space-missions/)
**Local Event:** San Marino, CA
**Team Owner:** Rahul (lead dev, OncoVision AI — cancer-risk platform, Python/JS, XGBoost)

> Long-duration missions expose astronauts to space radiation, isolation and confinement, altered gravity, and a hostile closed environment, bringing immune changes, bone loss, cardiovascular events, and behavioral health problems. Astronauts carry much of the responsibility for spotting these changes themselves. Build health monitoring software that gathers health indicators and enables astronauts to evaluate and act on the status of their health.

## Status

Pre-build. Currently in research/design phase — see [`research_notes/`](research_notes/) for competitor analysis and award-criteria mapping, and [`docs/design.md`](docs/design.md) for the current project design.

## Why this approach

Early framing ("digital twin for astronauts") turned out to be **not novel** — it's an actively published academic field (multiple 2025–2026 papers) and several other 2026 Space Apps teams on this same challenge are already building AI health-monitoring prototypes. See [`research_notes/competitor-analysis.md`](research_notes/competitor-analysis.md) for what they actually built and where the real gaps are.

The differentiator we're building toward isn't a buzzword — it's **traceable, cited risk thresholds and explainable flags**, reusing the measure-don't-assume discipline from OncoVision, applied in a domain (space medicine) where every other current competitor's thresholds are self-disclosed as illustrative/arbitrary.

## Repo layout

- `research_notes/` — competitor analysis, award-criteria mapping, data source notes
- `docs/` — design docs
- `data/` — NASA dataset references/snapshots (once sourced)
- `app/` — application code (once build starts)
