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

## Update 2026-10-01 (second sweep) — field is much larger than first pass

A broader search found **15+ public repos** already live for this exact 2026 challenge, not just the original 3: AUREON, AstroHealth / AstroHealth Telemetry, AL-KASAV ASTROHEALTH, H.E.L.I.O.S (nsaspace), Project-Astra, ASTRA-VITAL, Astro_Friend (Shift-Delete), astroguard-astronaut-health-monitor, astrohealth-monitor, Astronaut-Health-Monitor (Apollo 15 replay), astra-space-health, threshold, and several more with minimal public detail.

Common shape across nearly all of them: self-report check-ins and/or simulated wearable vitals, fed into a 2D dashboard (chart grid, gauge cards, or a HUD panel). Several now explicitly claim offline-first and behavioral/mood self-assessment (loneliness, crew connection, cognitive focus) — so "self-report behavioral check-in" and "offline-first" are no longer unclaimed either. One (Apollo 15 Astronaut Health Monitor) replays real 1971 mission biomedical data instead of simulating — a legitimate use-real-data angle, but historical replay rather than an active monitoring system.

**Conclusion:** concept-level novelty in "AI health-monitoring dashboard for astronauts" is now exhausted. None of the 15+ repos found use voice/speech biomarkers, keystroke dynamics, cabin-environment (CO2) driven cognitive-risk modeling, or 3D/WebGL visualization — these remain the open gaps as of this sweep. See `docs/design.md` for the resulting "ECHO" concept built on these specific gaps.

**Standing caveat:** re-check again closer to submission — this field is growing fast.

## Update 2026-11-14/15: rivals during the event

GitHub search for public repos created since 2026-09-15 on this challenge found 60+ teams (most created Nov 13 to 15). Common pattern: daily check-in, traffic-light status, "AI-powered" triage, simulated vitals, offline-first.

- **Closest: edmundzen/crew-health-ops (Team Cloud Catalyst, Singapore).** 3D astronaut with 5 clickable health sites, green/amber/red, guidance cards citing NASA sources, real NASA OSDR RadLab DOSTEL data (one day, 1 Mar 2022), 5 locations, 22-minute delay framing. So "3D + RadLab + hazards" is not unique.
- **Abdriel369/Argonaut:** personal baselines plus four specialist models across three laptops; simulated data.
- Others with "personal baseline" wording exist; several claim AI/ML risk prediction on simulated data.

What no rival repo mentions (searches for n-of-1, self-experiment, randomized, crossover returned no relevant 2026 repos): crew-run randomized self-experiments with a validated Bayesian engine; pre-registered studies with failures reported; a measured false-flag rate on real diaries; a tested ML-vs-personal-average comparison; real ISS cabin air and Inspiration4 bloodwork alongside radiation. Lead the pitch with these, not with the 3D.
