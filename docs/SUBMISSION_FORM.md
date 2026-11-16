# Submission form: paste-ready text

Each section matches one field on the team's Project tab. Check the two links work in a private window before you paste them.

---

## Project Name

Sol Lab

---

## Summary (50 to 200 words; this is 188)

Sol Lab is a health console for astronauts on long missions, where the nearest doctor can be days away. Each crew member does a two-minute daily check-in: blood pressure, heart rate, blood sugar, temperature, sleep, mood and exercise. Instead of comparing readings with a population average, Sol Lab compares each one with that person's own normal, gives it one of three plain levels, and says what to do next and when the flight surgeon needs to know. When something drifts, the crew can run a fair self-experiment, like no caffeine after noon: chance picks the days, the plan is locked before any results, and the answer is honest, including "not settled yet". It all happens inside a 3D station module with a clickable body, real ISS radiation and cabin air data from NASA's Open Science Data Repository, NASA space weather records, and the Inspiration4 crew's blood tests. We tested the method on 49 real people's sleep records and it made a wrong call less than 1% of the time. The same idea could help anyone far from a doctor on Earth, from polar research crews to rural patients.

---

## Project Demonstration (link)

Our 7-slide demo deck (PDF):

    https://github.com/palashraks-afk/NASA-Space-Apps/blob/main/docs/demo/Sol-Lab-deck.pdf

Checked 2026-11-15: opens without a login.

---

## Project (link)

The app (runs in any modern browser, no install):

    https://palashraks-afk.github.io/NASA-Space-Apps/

Needs Settings > Pages > Source set to "GitHub Actions" (still "not found" on 2026-11-15 evening). If Pages is not live in time, use the repo instead, which already works: https://github.com/palashraks-afk/NASA-Space-Apps

---

## Project Details

Paste everything between the lines into the box.

```
WHAT IT DOES
Sol Lab follows the challenge's three steps: gather, evaluate, act.

Gather. A short daily check-in covers blood pressure, resting heart rate, fasting blood sugar, temperature, sleep, mood and exercise. Values can be typed in or imported from a device file (CSV or FHIR). A daily routine puts each measurement at the right time (heart rate before getting up, blood sugar before breakfast), with a quiet reminder instead of an alarm. Every card has short "how to measure" steps written for weightlessness.

Evaluate. Every reading is compared with the person's own usual range, built from their pre-flight days, and given one of three levels: within range, keep an eye on it, or talk to the flight surgeon. Levels use a word as well as a colour, so they don't depend on colour vision. Where published cut-offs exist we use them (ACC/AHA blood pressure, ADA blood sugar, CDC fever, AASM sleep). Where none exist, the team chose one and marked it for clinician review. One odd day only asks you to keep an eye on it; repeated days escalate.

Act (our signature feature). Every non-normal level comes with concrete next steps. For slow problems like poor sleep, the crew can run a small randomized self-experiment: pick a change, lock the plan before seeing any results, and let chance decide which days get the change. A Bayesian engine then says whether it worked, made things worse, made no difference, or isn't settled yet. Four crew members can pool their results. One button on the overview runs a narrated 40-second crew experiment so anyone can see all four steps.

THE STATION
The app is a 3D ISS-style module with one station per topic: vitals, bloodwork, cabin air, radiation, galley, body clock, experiments, maps and instruments. A real anatomy model (BodyParts3D) lights up each body system by status; click one to see its readings and what spaceflight does to it. An "evidence chamber" shows the experiment's uncertainty as 1,600 moving points, each one a possible true effect. NASA's own 3D models appear in the scene: the ISS flies its real track over the radiation globe, and a spacewalker drifts past the window.

INSTRUMENTS
Ten instruments show the real hardware behind each reading in 3D, with a true-size scale bar, an Explode button to see inside, and a NASA photo of the real device where one exists: DOSTEL and the REM Timepix detector (radiation), the CO2 removal assembly and the Major Constituent Analyzer (air), the Bio-Monitor smart shirt, blood pressure cuff, pulse oximeter and glucose meter (vitals), and the T2 treadmill and ARED (exercise). Specs come from NASA technical reports and published papers, for example DOSTEL's two silicon detectors (154 and 315 µm thick, 124° telescope), the CO2 assembly's 288-minute cycle, and ARED's vacuum cylinders giving up to 272 kgf.

REAL DATA
- ISS radiation: 123,695 DOSTEL-1 readings and six-module REM data from NASA OSDR RadLab. Over half the dose arrives over the South Atlantic Anomaly.
- ISS cabin air: 358 days of CO2, temperature and humidity from the NASA OSDR Environmental Data App, checked against today's 3 mmHg CO2 limit.
- Bloodwork: the four Inspiration4 crew's blood counts and metabolic panels (OSDR OSD-569, OSD-575).
- Space weather: NASA DONKI logged 5 days of solar particle events and 6 geomagnetic storms in the same months. The dose inside Columbus did not rise on those days, because Earth's magnetic field shields low orbit. Crews bound for the Moon or Mars have no such shield.
- Sleep: diaries from 49 people (Baigutanova et al. 2025).
Readings nobody logged are simulated and labelled that way, and records from different people and years are combined into one 180-day mission. The app says so.

HOW WE CHECKED IT
We wrote down each study's plan and pass/fail bars before running it, and we report the ones that failed.
1. On 49 real sleep records, the experiment engine made a wrong call 0.68% of the time, and its 95% intervals covered the truth 94.7% to 97.3% of the time.
2. Pooling four crew members cut error by 20% to 45% in simulation. One simpler pooling method failed its bar, so we dropped it.
3. A personal range built from 14 days flags 7 to 8% of healthy single days, but three days in a row outside happens on under 1% of days. That's why only repeated days escalate.
4. We tested whether machine learning (ridge regression and gradient-boosted trees, trained on 48 people, tested on the 49th) could predict tomorrow's sleep better than a person's own average. It couldn't, so the app keeps the simpler method.
5. All 44 automated tests pass.

WHY IT MATTERS
Crews heading to the Moon and Mars will have long communication delays and no doctor on board. They need to catch their own changes early without false alarms wearing them out, and a fair way to tell a real fix from a lucky week. The same idea helps people on Earth who live far from care: compare yourself with your own normal, and test changes fairly.

TOOLS
JavaScript with three.js (3D), cannon-es (physics), satellite.js (orbit), GSAP (camera motion) and Vite (build), plus Python with NumPy and scikit-learn for the studies. It runs in any modern browser with no install.

LIMITS
Sol Lab is not a medical device and has not been tested on astronauts. The escalation points need review by a clinician. The bloodwork comes from a 3-day mission, not a long one. The radiation detectors largely miss neutrons, which the Canadian Space Agency estimates make up about 30% of ISS radiation.
```

---

## Use of Super Intelligence (SI)

Tick the options for code and for text/writing. Leave image, video and audio unticked: none were generated, and the slides use real screenshots of the app.

If there is a text box:

```
We used Claude Code (Anthropic) as a coding and writing assistant, and ChatGPT to help lay out the slide deck. The team chose the challenge, the idea, the features and the pass/fail bars for every study, and reviewed what was built. The AI tools wrote most of the code, the analysis scripts and drafts of the text under our direction. No images, video or audio were generated; every visual is a screenshot of the app's own 3D scenes. This is also stated in the repository README.
```

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
| NASA 3D Resources: Astronaut, ISS and Crew Lock Bag models | https://github.com/nasa/NASA-3D-Resources |
| NASA DONKI space weather database (solar particle events, geomagnetic storms) | https://ccmc.gsfc.nasa.gov/tools/DONKI/ |
| NASA Open APIs (DONKI endpoint) | https://api.nasa.gov/ |
| NASA Image and Video Library: ISS photos of CDRA, ARED, Bio-Monitor, MCA, T2, Cardiocog | https://images.nasa.gov/ |
| NASA NTRS: ISS CDRA testing (CO2 removal specs) | https://ntrs.nasa.gov/citations/20000072884 |
| NASA NTRS: ISS CDRA concepts and advancements | https://ntrs.nasa.gov/citations/20050210002 |
| NASA NTRS: Major Constituent Analyzer on-orbit performance | https://ntrs.nasa.gov/citations/20160010396 |
| NASA NTRS: RadWorks ISS REM to BIRD to HERA | https://ntrs.nasa.gov/citations/20150021957 |
| NASA NTRS: T2 treadmill development | https://ntrs.nasa.gov/citations/20070011772 |
| NASA NTRS: T2 vibration isolation system | https://ntrs.nasa.gov/citations/20110012610 |
| NASA NTRS: Biomechanical analysis of T2 exercise | https://ntrs.nasa.gov/citations/20100038357 |
| NASA NTRS: Advanced Resistive Exercise Device mechanisms | https://ntrs.nasa.gov/citations/20060028227 |
| NASA NTRS: Wearable biosensor monitor (Astroskin) | https://ntrs.nasa.gov/citations/20190000238 |

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
| BodyParts3D anatomy (DBCLS), CC BY 4.0 | https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/ |
| open-anatomy-3d models (CC BY 4.0) | https://github.com/MervinR07/open-anatomy-3d |
| Contini, Drillis and Bluestein 1963, body segment proportions (fallback figure) | https://doi.org/10.1177/001872086300500508 |
| Baigutanova et al. 2025, Scientific Data article | https://doi.org/10.1038/s41597-025-05801-3 |
| html-to-image (MIT) | https://github.com/bubkoo/html-to-image |
| Labrenz et al. 2015, Matroshka DOSTEL detector specifications | https://doi.org/10.1051/swsc/2015039 |
| CERN Medipix collaboration (Timepix chip) | https://medipix.web.cern.ch/ |
| Pickering et al. 2005, blood pressure measurement recommendations | https://doi.org/10.1161/01.HYP.0000150859.47929.8e |
| Whelton et al., 2017 ACC/AHA blood pressure guideline | https://doi.org/10.1161/HYP.0000000000000065 |
| Jubran 2015, Pulse oximetry | https://doi.org/10.1186/s13054-015-0984-8 |
| U.S. FDA, Pulse Oximeters | https://www.fda.gov/medical-devices/products-and-medical-procedures/pulse-oximeters |
| ISO 15197:2013, blood glucose meter accuracy | https://www.iso.org/standard/54976.html |
| Draco 3D mesh decoder (via three.js) | https://github.com/google/draco |
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

- [x] Whole team registered to the Temecula event
- [ ] Repo public; app link and demo link open in a private window
- [ ] Every field above pasted; "Save Progress"
- [ ] Both boxes ticked
- [ ] Submit before Sun Nov 15, 11:59 p.m. Pacific
