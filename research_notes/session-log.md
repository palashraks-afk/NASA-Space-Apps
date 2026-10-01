# Session log — full working notes (2026-10-01)

Raw record of everything covered so far, so nothing gets lost between sessions.

## Challenge brief (from team page)

- **Challenge:** Create Health Monitoring Software for Astronauts on Space Missions
- **Local Event:** San Marino, CA, United States
- **Team:** Rahul (owner) — "Experienced in web apps and ML (Python, JS, XGBoost). Lead dev of OncoVision AI and presenter at MIT Jameel Clinic program." Looking for teammates in UI/UX & Design, Data Viz, Pitch & Video.
- **Challenge text:** "Long-duration missions expose astronauts to space radiation, isolation and confinement, altered gravity, and a hostile closed environment, which can bring immune changes, bone loss, cardiovascular events, and behavioral health problems. On long missions, astronauts carry much of the responsibility for spotting these changes in themselves. Your challenge is to build a health monitoring software that gathers health indicators and enables astronauts to evaluate and act on the status of their health."

## Step 1 — 2025 Global Finalists pattern analysis

Reviewed the 45-team 2025 Global Finalists list (spaceappschallenge.org/2025/awards/global-finalists). Patterns extracted:

- **Novelty**: strongest teams pick one narrow, technical hook ("physics-first AI engine," "YOLO-based space debris detection," "knowledge graphs over NASA's space biology archive") instead of a broad "AI app for X." Vague passion-only blurbs read weaker.
- **Team-background alignment**: finalist "About the Team" blurbs tie existing skills directly to the technical approach — judges implicitly score "can this team actually build this."
- **Impact framing**: strongest entries name a concrete beneficiary and decision enabled, not just "raises awareness."
- **Feasibility**: scoped to something demoable in ~48 hrs — complexity lives in the model/analysis, not infrastructure.
- **Design**: memorable name + one-line hook repeatable after 30 seconds.

Initial read: given Rahul's OncoVision background (XGBoost, health-risk scoring, "measure-don't-assume" rigor, panel taxonomy), strongest angle looked like a risk-scoring/anomaly-detection engine over astronaut health indicators rather than a generic vitals dashboard.

## Step 2 — First proposed design: "Aegis" (MVP risk engine)

- Core: risk-scoring engine (not dashboard), per-system (immune/bone/cardiovascular/behavioral), explainable, reusing OncoVision panel-taxonomy rigor.
- Data: MVP = self-reported daily check-in log (no hardware dependency); backing = NASA Open Science Data Repository / GeneLab / Twins Study / HRP findings to calibrate what indicators matter; stretch = simulated wearable feed.
- Model: XGBoost per risk-category, calibrated against literature thresholds, explainable not black-box.
- UI: astronaut check-in + risk dashboard, trend lines, plain-language flags.
- **Rejected/superseded** by later research — see below.

## Step 3 — 10 Global Awards criteria (user pasted full award list)

Full award list and criteria captured in `award-criteria-mapping.md`. Refined concept at this stage: **"GEMINI" — Astronaut Digital Health Twin** — personalized physiological baseline model calibrated against NASA Twins Study + HRP data, forecasting risk trajectory (not just current state), dual-deployed on Earth for isolated/remote populations (polar researchers, submariners, rural clinics, aging-in-place elderly). Mapped against all 10 awards (see award-criteria-mapping.md history / git blame for the original table if needed).

## Step 4 — Novelty check (web search) — GEMINI/digital-twin direction REJECTED

Searched for prior art. Findings:

- "Digital twin for astronaut health" is an **active, published academic field**: e.g. "Digital twin modelling in microgravity: A framework for predictive and personalised space medicine" (PubMed), "Human Digital Twin for Astronauts: Integrating Microgravity Stress Testing and AI-Driven Predictive Modeling" (Springer), "A Systems Architecture for Data-Constrained Environments: Leveraging the Astronaut Digital Twin..." (Wiley INSIGHT, 2026), plus digital twin papers specifically for astronaut orthopedic and periodontal care.
- Multiple **other teams on this exact 2026 Space Apps challenge** are already building AI astronaut health-monitoring prototypes: AL-KASAV ASTROHEALTH, Project-Astra, and a repo by Ridwanulkarim.
- Conclusion: "digital twin" is not a differentiator — it's now an expected/default framing for this challenge. Pitching it as "genuinely novel, never done before" would have been inaccurate and likely embarrassing in front of judges who may know the research literature.

## Step 5 — Competitor repo deep-dive

Full findings in `competitor-analysis.md`. Summary of the real, execution-level gap found across all 3 competitor repos: **none of them cite real sources for their numeric risk thresholds** (two explicitly self-disclaim their numbers as "illustrative" / "demonstration," not clinical or official), **none show explainability** (why a flag fired), **none attempt real wearable/device streaming**, and **none attempt an Earth-impact/terrestrial-translation angle**.

## Current working thesis (not yet locked as final spec)

The differentiator is not concept novelty (the concept is now crowded) — it's **execution rigor**: traceable/cited thresholds + explainable reasoning traces + genuinely offline-first design + a credible Earth-side deployment of the same engine, reusing the OncoVision measure-don't-assume discipline as the actual hard-to-copy asset. See `docs/design.md` for the current draft and open questions (data ingestion approach, which specific NASA publications back each risk category, explainability mechanism, offline architecture, Earth-impact population/delivery constraints, UI/storytelling pass).

## Open items for next session

1. Resume brainstorming to lock the 6 open design questions in `docs/design.md`.
2. Pull the actual specific NASA HRP/OSDR/Twins Study publications to cite per risk category (not yet done — currently just referenced generically).
3. Decide final project name (GEMINI and Aegis were both working names, neither locked).
4. Re-check competitor landscape closer to submission (more teams will publish as the event approaches).
5. Once design is locked and written as a proper spec doc, move to `writing-plans` → implementation.
