# Submission form: paste-ready text

Each section matches one field on the team's Project tab. Check the two links work in a private window before you paste them.

---

## Project Name

Sol Lab

---

## Summary (50 to 200 words; this is 166)

Sol Lab is a health console for astronauts on long missions, where the nearest doctor may be days away. Each crew member does a two-minute daily check-in: blood pressure, heart rate, blood sugar, temperature, sleep, mood and exercise. Sol Lab compares every reading with that person's own normal instead of a population average, gives it one of three plain levels, and says what to do next and when the flight surgeon needs to hear about it. When something drifts, the crew can run a fair self-experiment, such as no caffeine after noon, and get an honest answer, including "not settled yet". Everything happens in a 3D station module with a clickable body, real ISS radiation and cabin air from NASA's Open Science Data Repository, and the Inspiration4 crew's blood tests. We checked the method on 49 real people's sleep records: wrong calls happened under 1% of the time. The same approach could help anyone far from a doctor on Earth, from polar crews to rural patients.

---

## Project Demonstration (link)

Our 7-slide demo deck (PDF):

    https://github.com/palashraks-afk/NASA-Space-Apps/blob/main/docs/demo/Sol-Lab-demo.pdf

Works only after the repo is public.

---

## Project (link)

The app (runs in any modern browser, no install):

    https://palashraks-afk.github.io/NASA-Space-Apps/

Needs the repo public and Settings > Pages > Source set to "GitHub Actions". If Pages is not live in time, use the repo instead: https://github.com/palashraks-afk/NASA-Space-Apps

---

## Project Details

**What it does**

Sol Lab follows the challenge's three steps: gather, evaluate, act.

*Gather.* A short daily check-in covers blood pressure, resting heart rate, fasting blood sugar, temperature, sleep, mood and exercise. Values can be typed in or imported from a device file (CSV or FHIR). A daily routine puts each measurement at the right time (heart rate before getting up, blood sugar before breakfast), with a quiet reminder instead of an alarm. Every card has short "how to measure" steps written for weightlessness.

*Evaluate.* Every reading is compared with the person's own usual range, built from their pre-flight days, and given one of three levels: within range, keep an eye on it, or talk to the flight surgeon. Levels use colour plus a word, so they don't depend on colour vision. Where published cut-offs exist we use them (ACC/AHA blood pressure, ADA blood sugar, CDC fever, AASM sleep). Where none exist the team chose one and marked it for clinician review. A single odd day only asks you to keep an eye on it; repeated days escalate.

*Act.* Every non-normal level comes with concrete next steps. For slow problems like poor sleep, the crew can design a small randomized self-experiment: pick a change, lock the plan before seeing results, and let the schedule decide which days get the change. A Bayesian engine then says whether it worked, made things worse, made no difference, or is not settled yet. Four crew members can pool their results.

**The station**

The app is a 3D ISS-style module with one station per topic: vitals, bloodwork, cabin air, radiation, galley, body clock, experiments, maps and instruments. A floating hologram of a crew member lights up each body system by status; click an organ to see its readings and what spaceflight does to it. The figure uses real body proportions and the relaxed posture NASA measured in astronauts in orbit. An "evidence chamber" shows the experiment's uncertainty as 1,600 moving points, each one a possible true effect.

**Real data**

- ISS radiation: 123,695 DOSTEL-1 readings (DLR, 2022) and six-module REM data, from NASA OSDR RadLab. The globe shows where on the orbit the dose comes from; over half arrives over the South Atlantic Anomaly.
- ISS cabin air: 358 days of CO2, temperature and humidity from the NASA OSDR Environmental Data App, checked against today's 3 mmHg CO2 limit.
- Bloodwork: the four Inspiration4 crew's complete blood counts and metabolic panels (OSDR OSD-569, OSD-575), flagged only when a change is larger than normal day-to-day variation.
- Sleep: diaries from 49 people (Baigutanova et al. 2025).
- Food: USDA FoodData Central. Orbit: CelesTrak elements propagated with SGP4.

Readings nobody logged are simulated and labelled that way, and records from different people and years are combined into one 180-day mission. The app says so.

**How we checked it**

We wrote down each study's plan and pass/fail bars before running it, and we report the ones that failed.

1. On the 49 real sleep records, the self-experiment engine made a wrong call 0.68% of the time, and its 95% intervals covered the truth 94.7% to 97.3% of the time.
2. Pooling four crew members cut error by 20% to 45% in simulation. One simpler pooling method failed its coverage bar, so we dropped it.
3. A personal range built from 14 days flags 7 to 8% of healthy single days, but three days in a row outside happens on under 1% of days. That is why only repeated days escalate.
4. We tested whether machine learning (ridge regression and gradient-boosted trees, trained on 48 people and tested on the 49th) could predict tomorrow's sleep better than a person's own average. It could not, so the app keeps the simpler personal average.
5. All 44 automated tests pass, including one that checks the evidence chamber's points match the experiment's real probabilities.

**Why it matters**

Crews heading to the Moon and Mars will have long communication delays and no doctor on board. They need to notice their own changes early without false alarms wearing them out, and they need a fair way to tell a real fix from a lucky week. The same idea helps people on Earth who are far from care or living with a long-term condition: compare yourself with your own normal, and test changes fairly.

**Tools**

JavaScript with three.js (3D), cannon-es (physics), satellite.js (orbit), GSAP (camera motion) and Vite (build), plus Python with NumPy and scikit-learn for the studies. It runs in any modern browser, works offline once loaded, and every push is built and tested automatically.

**Limits**

Sol Lab is not a medical device and has not been tested on astronauts. The escalation points we chose need review by a clinician. Bloodwork comes from a 3-day mission, not a long one. The radiation detectors measure charged particles and largely miss neutrons, which the Canadian Space Agency estimates are about 30% of ISS radiation.

---

## Use of Super Intelligence (SI)

Tick the options that match. From what the form describes, this means code and text/writing assistance. Leave image, video and audio unticked: we generated none.

If there is a text box:

> We used Claude Code (Anthropic) as a coding and writing assistant. The team chose the challenge, the concept, the features, the judging priorities and the study pass/fail bars, and reviewed what was built. The assistant wrote most of the code, the analysis scripts and drafts of the documentation under our direction. No images, video or audio were generated; all visuals are the app's own 3D renders. This is also stated in the repository README.

---

## NASA Data (Link Text | Link URL)

| Link Text | Link URL |
|---|---|
| NASA OSDR RadLab: ISS radiation, DOSTEL-1 and REM | https://visualization.osdr.nasa.gov/ |
| NASA OSDR Environmental Data App: ISS cabin CO2, temperature, humidity | https://visualization.osdr.nasa.gov/eda/ |
| NASA OSDR OSD-569: Inspiration4 complete blood count | https://osdr.nasa.gov/bio/repo/data/studies/OSD-569 |
| NASA OSDR OSD-575: Inspiration4 metabolic panel | https://osdr.nasa.gov/bio/repo/data/studies/OSD-575 |
| NASA Human Research Program: 5 Hazards of Human Spaceflight | https://www.nasa.gov/hrp/hazards/ |
| NASA Human Research Program: Risks of Human Spaceflight | https://www.nasa.gov/hrp/risks/ |
| NASA JSC: Neutral Body Posture in Spaceflight (Kim, Young, Rajulu 2019) | https://ntrs.nasa.gov/citations/20190032496 |
| NASA Visible Earth: Blue Marble and Black Marble Earth imagery | https://visibleearth.nasa.gov/ |
| NASA-STD-3001 human spaceflight standards (cabin limits, CO2) | https://www.nasa.gov/ochmo/human-spaceflight-and-aviation-standards/ |

---

## Space Agency Partner & Other Data (Link Text | Link URL)

| Link Text | Link URL |
|---|---|
| Canadian Space Agency: Monitoring radiation for astronaut health | https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp |
| Canadian Space Agency: Bio-Monitor | https://www.asc-csa.gc.ca/eng/sciences/bio-monitor.asp |
| Baigutanova et al. 2025 sleep and wearable dataset (CC BY 4.0) | https://doi.org/10.6084/m9.figshare.28509740 |
| USDA FoodData Central (public domain) | https://fdc.nal.usda.gov/ |
| Solar System Scope Moon and Mars textures (CC BY 4.0) | https://www.solarsystemscope.com/textures/ |
| Law et al. 2014, CO2 and headaches on the ISS | https://doi.org/10.1097/jom.0000000000000268 |
| Stahn et al. 2017, astronaut core body temperature | https://doi.org/10.1038/s41598-017-15560-w |
| Coskun et al., biological variation of blood counts | https://doi.org/10.1515/cclm-2019-0658 |
| Forger, Jewett and Kronauer 1999, circadian model | https://doi.org/10.1177/074873099129000867 |
| HCRSimPY circadian model code (Arcascope) | https://github.com/Arcascope/HCRSimPY |
| Contini, Drillis and Bluestein 1963, body segment proportions | https://doi.org/10.1177/001872086300500508 |
| Baigutanova et al. 2025, Scientific Data article | https://doi.org/10.1038/s41597-025-05801-3 |
| html-to-image (MIT) | https://github.com/bubkoo/html-to-image |
| CelesTrak orbital elements | https://celestrak.org/NORAD/elements/ |
| three.js (MIT) | https://threejs.org/ |
| cannon-es (MIT) | https://github.com/pmndrs/cannon-es |
| satellite.js (MIT) | https://github.com/shashwatak/satellite-js |
| GSAP | https://gsap.com/ |
| Vite (MIT) | https://vite.dev/ |
| Barlow font (SIL OFL) | https://fonts.google.com/specimen/Barlow |
| Archivo font (SIL OFL) | https://fonts.google.com/specimen/Archivo |
| Permanent Marker font | https://fonts.google.com/specimen/Permanent+Marker |
| NumPy | https://numpy.org/ |
| scikit-learn | https://scikit-learn.org/ |
| Sol Lab source code (Apache 2.0) | https://github.com/palashraks-afk/NASA-Space-Apps |

The RadLab page itself (https://visualization.osdr.nasa.gov/radlab/gui/) was returning a server error on 2026-11-14, so the table links the OSDR visualization home. Swap it back if RadLab is up when you paste.

---

## Before clicking "Submit for Judging"

- [ ] williamsel is on the Temecula event (the form still flags them)
- [ ] Repo public; app link and demo link open in a private window
- [ ] Every field above pasted; "Save Progress"
- [ ] Both boxes ticked
- [ ] Submit before Sun Nov 15, 11:59 p.m. Pacific
