# Gap analysis: Sol Lab against the strongest entries

Written 2026-11-02, 12 days before the event. Honest by design: every item here is something a judge could hold against us.

## Who we are measuring against

**1. VITA** ([Nav33dCodes/vita-astronaut-health-monitor](https://github.com/Nav33dCodes/vita-astronaut-health-monitor)), the strongest public entry for our challenge we can see today (pushed 2026-11-02). Full stack: .NET 10 API, Next.js 16, PostgreSQL, live SignalR streaming, NEWS2-style early-warning score, trend lines that estimate when a limit will be crossed, alert lifecycle with escalation, PDF and Excel reports, unit and integration tests, typed API, offline-tolerant client cache. Weaknesses: all vitals simulated, alarm-centred (the thing every other entry does), 2D dashboard, no validation study.

**2. AstroBone** (mysunatislam/astrobone), the only other 3D entry found: a source-labelled 3D skeletal digital twin for bone health, Vite and three.js, explicit "not a diagnostic device". The repo returned 404 on 2026-11-02 (made private or deleted), so it may still be submitted. It overlaps our two selling points: 3D and labelling what is real.

**3. What 2025 global winners had in common** (from `research_notes/judging-and-rules.md`): one idea a judge can repeat in a sentence, visible use of NASA data, a working demo a judge can open, and a short clear video. Polish of the story beat breadth of features.

## Scorecard (our 11 criteria, 0 to 10, our honest estimate)

| Criterion | Sol Lab | VITA | Gap |
|---|---|---|---|
| Impact | 7 | 7 | Our impact story is split between monitoring and self-experiments |
| Creativity | 8 | 5 | Ahead |
| Novelty | 7.5 | 4 | Ahead, but AstroBone overlaps on 3D and labelling |
| Challenge fit | 6 | 8 | Against the official text: we lack measurement entry, treatment guidance and the flight-surgeon question; VITA lacks guidance and self-assessment too but gathers vitals |
| Scientific rigor | 9 | 5 | Ahead (pre-registered studies, cited limits) |
| Depth of real data | 8.5 | 3 | Ahead now (ISS air, ISS radiation, Inspiration4 blood, real sleep diaries, USDA) |
| Feasibility | 7 | 8 | VITA is built like a deployable product |
| Profile fit (biomed) | 8 | 6 | Ahead |
| Interactive and visual appeal | 8 | 7 | Ahead in 3D, behind in finish and responsiveness |
| Technical depth | 8 | 8 | Different kinds: our statistics vs their systems engineering |
| Uniqueness | 8 | 4 | Ahead |
| **Mean** | **7.7** | **5.9** | |

Where we lose: challenge fit, feasibility, and engineering finish. Where we win: rigor, data, novelty.

## Fit against the official challenge text

Added 2026-11-02 after the team pasted the official text (`research_notes/challenge.md`). This changes the priorities: the brief asks for things we have not built at all.

| The brief asks for | Sol Lab today | Status |
|---|---|---|
| Software that **gathers** health indicators | Check-in tab: 7 indicators logged by keyboard and clicks (added 2026-11-02) | Have |
| Astronauts **evaluate** their own health | Each value compared with own pre-flight range, plain-language state | Have |
| Astronauts **act** on it; **guidance on treatments and health improvements** | Actions for every non-normal level, plus self-experiments | Have |
| Visual tool, animations, interactivity | 3D module, stations, charts | Have |
| Example indicators: **blood pressure**, heart rate, **blood sugar**, body temperature, sleep hours, **mood** | All six, plus exercise | Have |
| Five hazards: radiation, isolation, distance, gravity, closed environment | All five on the overview, each linked to its stations; isolation via mood and sleep, gravity via exercise | Have |
| Immune, bone, cardiovascular, nutrition, behavioral | Immune and cardiovascular via bloodwork, nutrition via galley. Bone and behavioral absent | **Partial** |
| Which measurements are possible in space; why an exam is needed; how hazards affect each indicator | Explainer on every check-in card | Have |
| **When a result warrants attention from the crew or flight surgeons** | Three levels; a "for the flight surgeon" box collects anything at the top level | Have (cut-offs need clinician review) |
| What actions prevent a critical condition | Experiments only | **Partial** |
| Clickable human figure, body parts show function and status (suggested) | 3D figure with 8 clickable regions (added 2026-11-02) | Have (placeholder shapes; teammate model can replace) |
| Different environments: spacecraft, station, rover, base | Station, Moon base, Mars (window and body clock) | Have |
| Prompt measurements or actions as part of the routine | Timed daily routine, due list, quiet reminder cards | Have |
| Gamification | Eleven mission patches plus the check-in streak; nothing punishes a missed day | Have |
| Dynamic charts over time | Yes, every station | Have |
| Color coding at a glance | Amber/green/blue states | Have (needs a legend and a second cue) |
| Simple instructions, do not assume astronauts know how to assess themselves | How-to on every check-in card | Have |
| NASA HRP resources and other agencies | NASA OSDR, NASA-STD-3001, DLR detector data; no HRP evidence pages cited yet | Partial |

Revised challenge-fit score: was **6 of 10**; with check-in, guidance, levels and hazards built (2026-11-02), now about **8 of 10**. Body figure, routine prompts and mission patches (gamification) added the same day. Note the brief is fine with colour coding and attention levels; it does not ask for alarms, so "calm tiers" (own normal / keep an eye on it / tell the flight surgeon) fits both the brief and our no-alarm rule.

### What to build, in order

1. **Daily check-in** (gathers indicators): astronaut enters blood pressure, resting heart rate, blood sugar, temperature, sleep, and mood by keyboard and clicks, with how-to instructions for each measurement. Entries land in the same charts as the dataset values.
2. **Assessment with guidance**: for each indicator, three calm tiers (within your normal / watch / talk to the flight surgeon), each tier with plain actions ("hydrate and recheck in 2 hours", "log symptoms"), sourced from NASA-STD-3001 and HRP evidence. No sounds, no flashing.
3. **Clickable body figure**: organs and systems (heart, bones, brain, eyes, immune, muscles) linking each to its indicators, the hazard that affects it, and its status. Our teammate's 3D models go here.
4. **Hazard map**: the five HRP hazards, each linked to the indicators and stations that track it.
5. **Routine prompts**: a mission-day checklist (morning vitals, mood, exercise log), tied to the timeline, ticked off as entries arrive.
6. **Gamification without pressure**: streaks for completed check-ins and finished experiments; nothing punishes a skipped day.
7. **Explainers**: one card per indicator: what it measures, how to take it in space, why spaceflight changes it, when it matters.
8. **Bone and behavioral health**: exercise log and mood scale, the two hazards we do not cover.

These replace items 1, 4, 13, 17, 55 and 56 below as the top priorities.

## The five gaps that matter most

1. **The story is two products.** A crew health console and a self-experiment lab. A judge has a few minutes. Fix: one sentence that ties them: "Sol Lab watches each astronaut against their own normal, then helps them test what actually fixes it." The console is the "notice", experiments are the "fix". Put this on the first screen.
2. **Our data come from different people and different years.** Vitals use Earth volunteers, blood is from a three-day mission, radiation is 2022, cabin air is 2014 to 2021, all shown as one 180-day mission. Fix: say so on screen in one line ("a composite mission built from real records"), and give every number a real or simulated badge.
3. **No link a judge can open, and no video.** VITA can be run; we only run on a dev machine. Fix: static build deployed (GitHub Pages or Netlify), a 30 to 60 second video, a fallback "low quality" mode for weak laptops.
4. **"Monitoring" without notification.** We refuse alarms, correctly, but a judge will ask "how does the crew find out?" Fix: a calm daily "what changed" digest (no sounds, no red), ranked by how far from the person's own normal, each with a suggested experiment.
5. **Engineering finish.** No CI, no end-to-end tests, an 800-line main file, desktop-only layout, untested on Safari and low-end GPUs.

## 100 problems, grouped

Severity: **H** could cost a placing, **M** costs points, **L** polish.

### Story and pitch (1 to 12)
1. **H** No single sentence links monitoring and experiments; the first screen does not say what the tool is for.
2. **H** No demo video exists.
3. **H** `docs/PITCH.md` predates the console, radiation, bloodwork and real cabin air.
4. **H** ~~No guided demo mode~~ Done 2026-11-02: 10-step tour, opens on first visit.
5. **M** The verdict "not settled" (the honest common outcome) is an anticlimax in a demo; the demo script needs a case that settles.
6. **M** No impact numbers: how many crew-days, what decisions change, what a flight surgeon gains.
7. **M** No Earth-benefit story (people on night shifts, Antarctic stations, patients tracking their own normal).
8. **M** README leads with "every other entry raises alerts", which reads as a dig; lead with what we do.
9. **M** No slide deck for the live pitch.
10. **L** Name "Sol Lab" says Mars/sol; the tool now covers much more.
11. **L** No one-line tagline on the loading screen.
12. **L** No team page (who did what, the biomed background behind it).

### Challenge fit and rules (13 to 22)
13. **H** Challenge text now saved (`research_notes/challenge.md`) and checked above; the Resources tab (dataset list) is still not captured.
14. **H** ~~No LICENSE file~~ Done 2026-11-02: Apache 2.0.
15. **H** Space Apps terms not re-read this year (AI disclosure wording, submission fields).
16. **M** Challenge datasets may include specific NASA resources we do not use; each unused one is a possible point lost.
17. **M** The self-experiment lab may look off-topic to a judge scoring "monitoring software".
18. **M** No explicit crew view versus flight-surgeon view; the challenge brief is likely to mention both crew and ground.
19. **M** No handling of communication delay or loss of contact with Earth (common in the brief and in rival entries).
20. **M** AI-use disclosure is a line in README and CREDITS, not a dedicated section with specifics.
21. **L** Submission form text (project summary, how NASA data was used) not drafted.
22. **L** No check that every external asset licence allows public use (fonts, textures done; re-verify all).

### Data (23 to 42)
23. **H** Heart rate, HRV and core temperature are still simulated (from published spreads), not real recordings.
24. **H** Vitals come from Earth volunteers, not astronauts, without a visible on-screen statement.
25. **H** Records from different people and years are stitched into one mission without a per-value source badge.
26. **M** Bloodwork lab ranges in the source file are single (apparently male) ranges; one crew member's hemoglobin is flagged against a range that may not apply to them.
27. **M** Bloodwork is from a three-day flight but sits inside a 180-day mission timeline.
28. **M** Only blood count and metabolic panel used; Inspiration4 also has urine immune panels and plasma proteomics on OSDR.
29. **M** Radiation is absorbed dose only; no dose equivalent, so no honest comparison with NASA's 600 mSv limit.
30. **M** Radiation covers 103 days of one detector; other years and instruments exist on RadLab (a six-module comparison from Dec 2019 was added on 2026-11-02).
31. **M** No solar particle event example, the radiation risk that actually threatens a Mars crew.
32. **M** Cabin CO2 comes from Rodent Research telemetry; whether the sensor reads cabin average or a local spot is not confirmed.
33. **M** RR-7 and RR-9 disagree by about 3 mmHg on the same dates; we keep one by rule, not by knowing which is right.
34. **M** CO2 ppm to mmHg assumes 760 mmHg cabin pressure; actual ISS pressure varies slightly.
35. **M** Menus are simulated from 19 Earth foods; NASA's real space food nutrient data are not used.
36. **M** No water intake, hydration or urine output data.
37. **M** No body mass, bone density or muscle data (core spaceflight risks).
38. **M** No exercise data (treadmill, cycle, resistance device minutes).
39. **M** No vision data (spaceflight-associated neuro-ocular syndrome is a top risk).
40. **M** No cognition or mood data (NASA's Cognition battery, behavioural health).
41. **L** ISS orbital elements are from one date; not refreshed at build time.
42. **L** No data dictionary listing every field, unit, source and transform in one place.

### Science and validation (43 to 54)
43. **H** Validation studies cover the experiment engine, not the new monitoring features (usual-range flags, bloodwork flags).
44. **M** Usual range uses 14 pre-flight days; literature (Coskun 2018) says some measures need far more samples; no per-measure warning.
45. **M** Reference change values exist only for blood counts; metabolic panel flags rely on lab range alone.
46. **M** Headache-risk model (Law 2014) is applied to habitat-sensor CO2, a different exposure than in the paper.
47. **M** Core temperature rise is a fixed curve, not a fitted model with uncertainty.
48. **M** Circadian model failed one pre-registered check; still shown as a central feature.
49. **M** No sensitivity analysis: how flags change with baseline length or threshold.
50. **M** No multiple-comparison control across 6 vitals x 4 crew x 180 days (expected false flags per week not shown).
51. **M** No external review by a clinician or space-medicine person.
52. **L** Pooling assumes crew members are exchangeable; not tested on real astronaut variance.
53. **L** Nutrition targets mix exploration requirements and ISS practice without saying which applies.
54. **L** No statement of what the tool should never be used for.

### Features (55 to 70)
55. **H** No calm "what changed today" digest that ranks findings by distance from personal normal.
56. **H** No link from a finding to an experiment ("sleep latency up for 5 days: test earlier light?").
57. **M** No exercise station (treadmill, cycle ergometer, resistance device).
58. **M** No sleep station (crew quarters, light, noise).
59. **M** No medication and medical-kit inventory.
60. **M** No crew self-report (symptoms, mood, workload).
61. **M** No trend projection (where a measure is heading), which VITA has.
62. **M** No comparison of crew members side by side for one measure.
63. **M** No CSV or JSON export of the data behind each chart.
64. **M** Crew report is HTML only; no PDF.
65. **M** Radiation module comparison is a bar list, not shown on a 3D station map.
66. **M** No "what if" for cabin air (another crew member, scrubber failure) using real data as the base.
67. **L** No notes or annotations on a day.
68. **L** No search or jump-to-date.
69. **L** No undo for experiment setup steps.
70. **L** No settings page (units, theme, motion).

### Interface and experience (71 to 82)
71. **H** ~~No onboarding~~ Done: guided tour.
72. **H** Desktop-only layout: inspector and timeline do not adapt below about 1000 px; phones and tablets break.
73. **M** Nine tabs is a lot; group them (People: vitals, bloodwork, clock; Ship: air, radiation, galley; Science: experiments).
74. **M** Inspector panels are long scrolls; no summary-first layout.
75. **M** Units and decimal places vary between panels.
76. **M** Amber is the only signal colour; colour-blind users get no second cue in some charts.
77. **M** Hover tooltips on charts are missing; values are only readable from labels.
78. **M** No light theme for projected demos in bright rooms.
79. **L** Keyboard shortcut list only appears on the overview.
80. **L** Loading screen shows plain text; no progress.
81. **L** Status bar repeats crew and day already shown in the timeline.
82. **L** Some copy is long; lede paragraphs run four lines.

### 3D and visuals (83 to 90)
83. **H** Station props are simple primitives; a drop-in model loader is ready (docs/MODELS.md), waiting on the teammate's files.
84. **M** No crew avatars; the module feels empty.
85. **M** Overview camera shows the evidence chamber more than the new stations.
86. **M** The radiation globe's halo reads as a grey ring; the base and arm look unfinished.
87. **M** No transition cue tying a 3D station to its panel (highlight on hover, label).
88. **L** Air particles barely visible at the new density.
89. **L** Window Earth texture once rendered flat in a headless capture; not confirmed fixed.
90. **L** Screens on stations are low-contrast at a distance.

### Engineering and quality (91 to 97)
91. **H** Deploy workflow ready (GitHub Pages); needs the repo made public and Pages switched on by the owner.
92. **H** ~~No continuous integration~~ Done 2026-11-02: GitHub Actions runs check, tests and build.
93. **M** `lab/src/main.js` is about 800 lines; panels, report and timeline should be separate modules.
94. **M** No end-to-end browser tests (tab switching, report download, keyboard) in the suite.
95. **M** No error state if a data file fails to load (the whole app stops).
96. **M** Not tested on Safari, Firefox, or integrated laptop GPUs.
97. **L** Raw downloads live only on one machine; the scripts can re-fetch, but there is no single `fetch_all` command.

### Docs and team (98 to 100)
98. **M** `docs/design.md` describes an earlier version.
99. **M** No architecture diagram of data flow from source to screen.
100. **L** No rehearsal plan or speaker split for the live pitch.

## Data still to add (ranked by value per hour)

| Dataset | Where | What it adds |
|---|---|---|
| ISS radiation by module, Dec 2019 (REM in US Lab, Columbus, JPM, Cupola, Node 1, Node 3; SPACEDOS in the Russian segment) | NASA OSDR RadLab | Done 2026-11-02: six US-segment modules from REM detectors, 324 to 648 µGy a day |
| More DOSTEL years (2012 to 2021) | RadLab | Solar-cycle change in dose; a full mission length with no wrap |
| Inspiration4 urine immune panel (OSD-656) and plasma proteomics (OSD-571) | NASA OSDR | Immune response to flight, more real crew biology |
| ISS temperature and humidity for RR-18 (Dec 2021 to Aug 2022, 8 months) | NASA OSDR EDA | A continuous 8-month cabin record |
| EDA daily radiation with SAA split per mission | NASA OSDR EDA | A second radiation source to cross-check RadLab |
| NASA Standard Measures or LSDA open summaries | NASA LSDA | Real astronaut vitals if any open summaries exist (check access terms) |
| Space food nutrient tables | NASA reports | Real menu items instead of Earth equivalents |
