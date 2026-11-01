# Design: Sol Lab (working name, not locked)

Status 2026-11-01: concept chosen by the owner after rejecting monitor/alert products. Nothing here is a measured result unless it says so.

## One sentence

A 3D, game-like lab where a crew member designs and runs small experiments on themselves (for example, "does moving my exercise earlier improve my sleep?") and watches the evidence build, with no alarms and honest "inconclusive" verdicts.

## Why this form

- The field (25+ public repos for this challenge) monitors and alerts. This tool helps the astronaut act, which is what the challenge text asks for.
- Real gap: a 46-astronaut study found about 600 min/week of exercise did not fully protect against deconditioning, and a 2021 review says personalized medicine for astronauts is limited. Who benefits from which countermeasure, and how to find out within a mission, is open.
- Prior art, stated plainly: Earth N-of-1 platforms exist (StudyU, StudyMe), adaptive Thompson-sampling trials exist in mobile health (HeartSteps), and open-source circadian models exist. A crew-facing combination was not found in searches. Novelty is the application, about 6.5.

## Criteria (owner's list, 11)

Impact, creativity, novelty, challenge fit (to past-winner attributes), scientific rigor, depth of real data, feasibility in ~13 days, profile fit (biomed rigor), interactive and visual appeal, technical depth (data, ML, computation), and **uniqueness** (different in kind from the field, not just better executed).

Plan-level estimate for this concept: about 8.0. It is a prediction because nothing is built. The baseline-monitor concept measured 7.75 over 10 criteria and would score about 5 on uniqueness.

## Features and angles

1. **Procedure board.** Design an experiment by placing schedule tokens (exercise, light, sleep window, meal timing) on a calendar. Randomized crossover with washout days. A protocol checklist is the quest log.
2. **Evidence chamber.** A 3D cloud of posterior draws over effect size, carryover and noise, with a zero-effect plane. It contracts as days of data arrive. Verdicts: works for you, no meaningful effect, makes it worse, or inconclusive. Thresholds and the smallest worthwhile effect are fixed before the trial starts (pre-registration card, exportable).
3. **Power preview.** Before starting, a Monte Carlo shows how many days it takes for a given design to reach a verdict. Proving "no effect" takes much longer than proving "an effect"; the tool says so.
4. **Body clock.** The Forger-Jewett-Kronauer pacemaker (parameters from Serkh and Forger 2014, as implemented in the open-source HCRSimPY code) integrated live and shown as a physical ring. Light schedules push it. Different crew members get different intrinsic periods, so the same schedule affects each differently.
5. **Destination.** ISS (about 92-minute orbit, fixed cabin lighting), Moon, Mars (24 h 39 min sol). Choosing a destination changes the day the clock must follow. ISS orbit by SGP4 (satellite.js) with CelesTrak data.
6. **Adaptive mode (stretch).** Thompson sampling shifts days toward the better arm while still learning; the interface shows the explore/exploit trade and warns that adaptive allocation complicates inference.
7. **Earth mode (stretch).** Jet lag and shift work on the same engine, so the tool is not space-only.
8. **Autocorrelation honesty.** Daily outcomes are correlated; ignoring that overstates certainty. The engine pre-whitens and the test suite checks the calibration of the intervals.

## Interface and art direction

Subject vernacular: the inside of a station module. White Beta-cloth and anodized aluminum, Velcro patches, cargo bags, wrist checklists, white tape labeled by hand with a marker, safety-tag streamers, gold Kapton foil.

Decisions, and why they avoid the field's defaults:
- **Light, daylit module** (cool aluminum white with graphite hardware), not the dark space theme every other entry uses.
- **The world is the interface.** A 3D module interior with four stations (procedure board, body clock, evidence chamber, cupola window). Camera glides between them. HTML overlay is limited to the wrist checklist and a few controls. (Navigation-by-world follows the approach documented for Bruno Simon's portfolio.)
- **Microgravity physics for the tokens.** Schedule tokens float, drift and bump (cannon-es with zero gravity), and stick to Velcro patches. This is the game-like feel, and it is also literally true to the setting.
- **One memorable thing:** marker-on-tape labels and tactile Velcro tokens. Everything else is quiet.
- Palette (decided before building): aluminum white `#E4E8EB`, graphite `#2A2F35`, Kapton gold `#C28A1E` (clock ring only), ink blue `#1D3F72` (data), tag red `#D6342A` (tags only), tape white `#F6F6F1`, marker black `#16181B`.
- Type: Archivo (UI, variable width and weight, tabular figures) and Permanent Marker (tape labels only). Fonts bundled locally so the tool works offline.
- Avoid: dark purple/blue gradients, identical rounded cards, all-caps eyebrow labels, emoji icons, middle-dot meta strings, one-word accent in headlines, scattered hover fades.
- Motion: one orchestrated opening (from the cupola window view into the module), then only motion that answers an action (snap, glide, contract).
- Quality floor: keyboard reachable controls, reduced-motion respected, readable contrast, works at laptop and tablet widths. A plain 2D summary is available for low-power or screenshot use.

## Architecture

`lab/` is a Vite app with plain JavaScript modules.
- `src/engine/`: pure logic, tested first. `rng.js`, `linalg.js`, `trial.js` (design, simulate, Bayesian linear model with conjugate posterior, verdict rule), `power.js`, `circadian.js`.
- `src/scene/`: three.js scenes and camera rig.
- `src/ui/`: wrist checklist, controls, pre-registration export.

Build order: engine and tests, then the evidence chamber, then the body clock, then the board with physics, then hub navigation and transitions, then destination view, then polish.

## Honest limits

- The posterior is exact for a Gaussian linear model with a conjugate prior; the cloud shows real draws, not decoration.
- No astronaut data is used. Demonstrations use simulated outcomes and, where labeled, open wearable data. Open observational data cannot establish cause; randomized replays are labeled as simulation.
- The circadian model is a published approximation with population-level parameters.
- Not a medical device; not clinically validated.
- AI assistance: the code is written with Claude Code assistance and must be disclosed in the submission as the Space Apps rules ask.

## Measured so far (engine, 2026-11-01)

Everything below is a simulation of the model in `lab/src/engine`, reproducible with `node lab/scripts/checks.mjs` and `node lab/scripts/design_search.mjs` (results in `analysis/lab_*.json`). It is not a result on people.

- **Calibration.** 95% intervals cover 95.7% (autocorrelation 0 and 0.4) and 97.5% (0.7) of the time, over 2,000 simulated trials each. Ignoring autocorrelation drops coverage to 82.8% at 0.4 and 71.2% at 0.7. When the engine estimated autocorrelation as a fixed number instead of integrating over it, coverage was only 91% to 93%; integrating fixed that.
- **False calls.** With no true effect, the engine called a worthwhile effect (or harm) 0.5% to 1% of the time.
- **Power is limited, and that is the honest message.** A strict 95% rule on a noisy daily outcome settles a clearly worthwhile effect (1 standard deviation) in 56% of 12-week runs and a moderate one (0.6) in 14%. "No effect" is essentially never proven within a mission.
- **Design depends on how fast the intervention acts.** At 8 weeks, for a 1 SD effect: if the body responds within a day (for example same-day light or caffeine timing), daily randomization settles it 94% of the time versus 38% for 7-day blocks. If the response is slow (about 60% of the gap closed per day), daily randomization drops to 16% and 7-day blocks with 2 washout days are best at 35%. So the app asks how fast an intervention acts and recommends a design, and shows the power before the trial starts.
- A looser threshold (90% instead of 95%) raises power but raises false calls to about 3%; the threshold is fixed in the pre-registration, not chosen after seeing data.

Model corrections made on the way (kept in the history of this file for honesty): carryover was first modelled as a separate term, but with washout days dropped it cannot be told apart from the effect, so it was replaced with a drift term and washout; a simulator bug that added the "carryover" onto the true effect was fixed.

## Open items

- Hierarchical pooling across crew members (should raise power; not built or tested).
- Which outcomes are quiet enough to be useful (daily sleep efficiency vs a composite); this decides whether self-experiments are practical.
- 3D scenes, hub transitions, Velcro-token physics, destination view: not built.
