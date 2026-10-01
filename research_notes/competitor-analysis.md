# Competitor analysis — 2026 "Astronaut Health Monitoring" challenge

Researched 2026-10-01. Scope: other public repos already built for this exact Space Apps 2026 challenge, found via web search.

## Repo 1 — [Ridwanulkarim/nasa-challenge-Create-Health-Monitoring-Software-for-Astronauts-on-Space-Missions](https://github.com/Ridwanulkarim/nasa-challenge-Create-Health-Monitoring-Software-for-Astronauts-on-Space-Missions)

- **Stack:** Node.js/Express, MySQL (3NF, 13 tables), vanilla JS/Chart.js frontend, JWT + bcrypt + Helmet
- **Data:** 15 days of seeded/simulated telemetry; references NASA HRP, Twins Study, OSDR but does not live-integrate them
- **Approach:** deterministic rule engine, personal 14-day rolling baselines (not fixed thresholds), multi-day trend detection, NORMAL/WARNING/CRITICAL alerts, demo scenario switcher
- **Threshold rigor:** best of the three — explicitly maps to NASA's 5 Hazards framework and real countermeasure hardware (ARED, T2, Chibis LBNP) — but self-disclaims thresholds as "illustrative," not official limits
- **Gaps:** no wearable/device ingestion, rationale for rule parameters is thin
- **Maturity:** 17 commits, functional prototype, most polished of the three, demo-ready with seeded accounts

## Repo 2 — [meherpurtv71-sketch/AL-KASAV-ASTROHEALTH](https://github.com/meherpurtv71-sketch/AL-KASAV-ASTROHEALTH)

- **Stack:** Python, OpenCV + MediaPipe pose estimation, Tkinter desktop GUI
- **Data:** real NASA OSDR RadLab/DosTel radiation data; vitals (HR, SpO2, temp) are simulated
- **Approach:** webcam-based pose/movement AI + radiation exposure + simulated vitals → mission health status for ISS/Moon/Mars modes
- **Threshold rigor:** weakest — explicitly states radiation risk indicator is a "demonstration" value, "not a clinical or official NASA" limit; no citations
- **Gaps:** no database/persistence, no longitudinal tracking, unclear real-vs-simulated boundary in code, minimal anomaly detection, no explainability of pose-estimation findings
- **Maturity:** 3 commits, incomplete, placeholder screenshots, hackathon-stage

## Repo 3 — [md-istiak/Project-Astra](https://github.com/md-istiak/Project-Astra)

- **Stack:** unknown — essentially a stub
- **Data:** unspecified
- **Approach:** claims "offline astronaut health monitoring and risk-assessment," no other detail available
- **Threshold rigor:** cannot assess — no visible sourcing
- **Gaps:** no code visible, 0 stars/forks
- **Maturity:** 1 commit, pre-alpha, likely just a title/description placeholder as of 2026-10-01 (worth rechecking closer to submission — could grow)

## Exploitable gaps (what none of them do well)

1. **No real-time wearable/device ingestion** — all three use simulated or pre-seeded vitals. A genuine sensor/API streaming pipeline (even simulated-but-realistic) stands out.
2. **No traceable, cited thresholds** — Repo 1 gets closest (NASA HRP/Twins Study/5 Hazards) but still disclaims numbers as illustrative. A model that sources each threshold to a specific NASA/HRP publication or dataset, with inline citation, is unclaimed territory — and is exactly the OncoVision measure-don't-assume pattern.
3. **No explainability** anywhere — none show *why* a flag triggered beyond "rule fired." A transparent reasoning trace (which metric, which baseline deviation, which cited source) is unclaimed.
4. **Repo 2's pose-estimation angle is novel but shallow** — no persistence, no fusion with other vitals over time. Fusing movement/behavioral signals with longitudinal physiological trends is unclaimed.
5. **Offline/bandwidth-constrained design** — Repo 1 explicitly targets comm latency/blackouts (its strongest feature); Repo 3 claims "offline" but shows nothing; Repo 2 doesn't address it. Building genuinely offline-first (not just async-tolerant) beats Repo 1 on rigor and Repo 3 on substance.
6. **Earth-impact/terrestrial-translation angle** — none of the three mention dual-use or terrestrial health application. NASA Space Apps judging (Galactic Impact, Local Impact awards) rewards this explicitly.

## Caveat

This list will grow between now and submission — more teams will register and publish repos as the event approaches. Re-check competitor landscape again closer to the hackathon date.
