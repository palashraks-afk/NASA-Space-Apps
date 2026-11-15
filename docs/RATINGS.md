# Ratings, 2026-11-15 (our own estimate, not a judge's)

Two scales: the official Space Apps rubric (1 to 5 on five criteria) and the team's 11 criteria (out of 10). Each score says what it rests on. Rival information: `research_notes/competitor-analysis.md`.

## Official rubric (1 to 5)

| Criterion | Score | Why | What would raise it |
|---|---|---|---|
| Impact | 4 | Real problem (self-care far from Earth), clear Earth uses, works offline in any browser | Evidence from real users: even three people logging for a week |
| Creativity | 4 | Crew-run randomized self-experiments: no rival repo for this challenge mentions them. The 3D-plus-RadLab idea is shared with at least one rival (Team Cloud Catalyst) | A demo that shows one experiment from question to verdict |
| Validity | 4 | Instruments specified from NASA reports with sources; five studies (three on real people's records), pre-registered bars for the first ones, failures reported, 44 automated tests, measured false-flag rate | Clinician review of the escalation points; a live link judges can open |
| Relevance | 5 | Every line of the brief is mapped to a feature; five NASA sources (OSDR RadLab, EDA, OSD-569, OSD-575, HRP) drive the app, plus a CSA partner resource | Already at the top |
| Presentation | 4 | 7-slide deck within the limit, clear story, real screenshots | A 30-second video showing the app moving would beat slides for most judges |

## Team criteria (out of 10)

| Criterion | Before today | Now | Change |
|---|---|---|---|
| Impact | 8 | 8 | Unchanged without user evidence |
| Creativity | 8.5 | 9 | One-click live crew experiment as the signature feature; original logo |
| Novelty | 8 | 8 | Self-experiments confirmed unique among this year's public repos; Earth prior art caps it |
| Fit to the brief | 9 | 9.5 | CSA partner resource now used in the radiation station; challenge resources cited |
| Scientific rigor | 9.5 | 9.5 | Study 5 (ML vs personal average, honest null); evidence chamber now exact and tested |
| Depth of real data | 9 | 9.5 | Ten instruments with specs from NASA reports; NASA 3D models; NASA DONKI space weather cross-checked against ISS dose |
| Feasibility | 8 | 8 | Still no public link until the repo is public |
| Profile fit (biomedical) | 9 | 9.5 | Anatomically placed organs and skeleton; NASA-measured weightless posture |
| Visual and interactive | 9 | 9.5 | Real human figure; NASA ISS and astronaut models; true-scale instrument blueprints |
| Technical depth | 9.5 | 9.5 | Exact inverse-gamma sampler, leave-one-person-out ML |
| Uniqueness | 8.5 | 8 | Lowered: a rival also has 3D with RadLab data |
| **Mean** | **8.7** | **8.9** | |

## Machine learning, plainly

We tried it where it could matter: predicting each person's next night from their history, with models trained on other people. It did not beat the person's own average, so the app does not use it, and the docs say so. Adding a model that does not help would lower validity, not raise it.

## Blocking items (outside the code)

1. williamsel must join the Temecula event.
2. Repo public and GitHub Pages on, or neither link works for judges.
3. Team name on slide 1 (`docs/demo/team.json`, then `node scripts/build_deck.mjs` in `lab/`).
