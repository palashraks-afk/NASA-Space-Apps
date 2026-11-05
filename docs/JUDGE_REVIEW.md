# Judge's-view review

Done 2026-11-04. Method: open the app the way a judge would (new browser profile, no URL parameters, a 1366 by 768 laptop screen, no instructions), follow the guided tour, read the README and pitch, then score the 11 criteria with evidence. Everything found was fixed in the same pass unless listed under "Still open". The walk is repeatable: `node lab/scripts/judge_walk.mjs 1366 768`.

## What the walk found, and what was fixed

| Found | Why a judge would mark it down | Fix |
|---|---|---|
| Camera position became NaN when the page loaded in a hidden or zero-size window; every later camera move then failed | A judge who opens the link in a background tab or minimised window sees a frozen view | Size guards in the renderer, overview fit and camera rig; a broken position jumps instead of animating |
| Camera glides crawled on slow machines (GSAP lag smoothing stretched a 2 s move to about a minute when frames took over 0.5 s) | On a weak laptop the tour shows the wrong station for every step | Lag smoothing off: moves are timed by the clock |
| First visit opened on mission day 0: empty charts, "0.3 mGy over 1 days" | The first screen looked empty and had a grammar slip | Opens on day 60 at 07:12 with two months of history; plurals fixed |
| The key-hint bar sat under the tour card | Overlapping UI on the very first screen | Hint hidden while the tour is open |
| Overview had no one-line statement of what the tool does | A judge reads the first screen for five seconds | Tagline "Each person against their own normal" |
| README opened with a comparison to other teams and a wall of 16 screenshots | Reads as defensive; the point is buried | README rebuilt: one sentence, live link, gather / evaluate / act, real-data table, how it answers the brief, validation, then more screens |
| Pitch and demo script predated check-in, body, maps and instruments, and never used the brief's words | The live demo would skip what the brief asks for | New one sentence, 30-second version, 3-minute demo that follows the tour, a brief-to-feature table, updated claims |
| No stated benefit beyond spaceflight | Impact judges look for it | "Why it matters": message delay to Mars, personal baselines, and Earth uses (polar and offshore crews, rural patients) in the README and the About window |
| Blood values showed "5" where the lab reported "5.0" | Looks sloppy beside real lab data | Values keep their measured precision |

Earlier passes the same week (see `docs/BUILD_LOG.md` 33 to 38) removed text clutter, sharpened 3D text and added the Instruments tab.

## Walk results after the fixes

Fresh profile, 1366 by 768, software rendering (no GPU, the worst case): all 10 tour steps open the right station with the camera at the right place; no page errors; all 13 tabs fit without scrolling; 12 frames a second even without a GPU; smallest inspector text 10.4 px; tour cards 6 to 17 words. Load took 39 s here because the development server sends 60 unbundled files to a software renderer; the production build is one script and loads much faster.

## Scores

0 to 10, evidence-based. "Before" is the gap analysis of 2026-11-02 after the check-in was added; "now" is after this pass.

| Criterion | Before | Now | Evidence | What would raise it |
|---|---|---|---|---|
| Impact | 7 | 8 | Gather, evaluate, act; flight-surgeon guidance; Earth uses stated | A short video showing one crew member's problem being caught and fixed |
| Creativity | 8 | 8.5 | Self-experiments in flight, 3D station as the interface, exploded instrument blueprints | |
| Novelty | 7.5 | 7.5 | No crew-run self-experiment tool for spaceflight found; personal baselines and N-of-1 exist on Earth | Cannot honestly go higher |
| Fit to the brief | 8 | 9 | Every line of the brief mapped to a feature (README table) | Clinician review of the escalation points |
| Scientific rigor | 9 | 9 | Pre-registered studies with failures reported; cited cut-offs; team choices marked | External clinician review |
| Depth of real data | 8.5 | 9 | NASA OSDR radiation (two instruments, six modules), ISS cabin air, Inspiration4 bloodwork, real sleep diaries, USDA, CelesTrak | Real astronaut vitals are not public; this is near the ceiling |
| Feasibility | 7 | 7.5 | Runs offline from any folder, CI builds every push, FHIR/CSV import from any device, zero-size and slow-machine bugs fixed | **Live link** (repo public plus Pages switch), demo video |
| Profile fit (biomed) | 8 | 8.5 | Clinical cut-offs, reference change values, bloodwork, physiology explainers | |
| Interactive and visual appeal | 8 | 8.5 | Teammate's surface detail and navigation, blueprints, crisp labels, maps | Teammate's 3D models in place of placeholder props and figure |
| Technical depth | 8 | 9 | Bayesian engine with AR(1) mixture, empirical-Bayes pooling, circadian model, SGP4, FHIR parsing, three.js pipeline, 38 tests | |
| Uniqueness | 8 | 8.5 | 3D station plus real mission data plus self-experiments; no public rival combines them | |
| **Mean** | **7.9** | **8.5** | | |

## Still open (blocks a 9+ mean)

1. **Live link.** The deploy workflow is ready; the owner must make the repo public and set Settings > Pages > Source to "GitHub Actions". Without it a judge cannot open the app.
2. **Demo video** (60 to 90 s), following the 3-minute script in `docs/PITCH.md`.
3. **Real 3D models** from the teammate for the body figure and stations (drop-in, `docs/MODELS.md`).
4. **Clinician review** of the team-chosen escalation points.
5. **Challenge Resources tab** not yet checked for listed datasets.
