# Submission form: paste-ready text

Each section matches one field on the team's Project tab. Check the two links work in a private window before you paste them.

---

## Project Name

Sol Lab

---

## Summary (50 to 200 words; this is 189)

Astronauts on long missions can't walk into a doctor's office. On the way to Mars, a message to Earth can take up to 20 minutes each way. So we built Sol Lab: a health app where each crew member does a daily check-in (blood pressure, heart rate, blood sugar, temperature, sleep, mood and exercise). Every number gets compared to that person's own normal, not to an average person. Then it gets one of three labels: within range, keep an eye on it, or talk to the flight surgeon. The part we're proudest of is the self-experiment. Say an astronaut is sleeping badly and wants to try no caffeine after noon. Sol Lab picks the days at random and locks the plan before any results come in. At the end it says whether it worked, and if the data can't tell yet, it says that too. Everything runs inside a 3D space station built on real NASA data: ISS radiation, cabin air, space weather and the Inspiration4 crew's blood tests. We tested it on sleep records from 49 real people and it was wrong less than 1% of the time.

---

## Project Demonstration (link)

The deck in PowerPoint for the web, with its transitions and animations (no login needed; judges click Slide Show):

    https://1drv.ms/p/c/82f87ab6bea1eabe/IQA3i0XuHsI-Rr-yLhXbPgheAXB41oUChSMppnh6q9QYSZk?e=u8fWhB

Checked 2026-11-15 in a signed-out browser: opens straight into the deck. Static PDF backup (linked at the end of Project Details): https://github.com/palashraks-afk/NASA-Space-Apps/blob/main/docs/demo/Sol-Lab-deck.pdf

---

## Project (link)

The app (runs in any modern browser, no install):

    https://palashraks-afk.github.io/NASA-Space-Apps/

Needs Settings > Pages > Source set to "GitHub Actions" (still "not found" on 2026-11-15 evening). If Pages is not live in time, use the repo instead, which already works: https://github.com/palashraks-afk/NASA-Space-Apps

---

## Project Details

The box is rich text: copy the formatted text below (from the rendered page on GitHub) so the bold carries over.

**What Sol Lab does**

Sol Lab works in three steps, the same ones the challenge asks for: gather, evaluate, act.

**1. Gather:** Each crew member does a short check-in every day. It covers blood pressure, resting heart rate, fasting blood sugar, temperature, sleep, mood and exercise. You can type the numbers in or import a file from a device (CSV or FHIR). The app also tells you when to measure. Heart rate is taken before getting up and blood sugar before breakfast. Each card has short steps for how to measure in weightlessness.

**2. Evaluate:** Each reading is compared to that person's own normal range, built from their days before launch. It then gets one of three levels: **within range**, **keep an eye on it** or **talk to the flight surgeon**. Each level has a word as well as a color, so it works for colorblind users. Where medical cut-offs exist we used them (ACC/AHA for blood pressure, ADA for blood sugar, CDC for fever, AASM for sleep). Where none exist we picked one and marked it for a doctor to review. One bad day only gets "keep an eye on it." The level only goes up if it keeps happening.

**3. Act (our main feature):** Every warning comes with clear next steps. For slow problems like bad sleep, the crew can run a small experiment on themselves. They pick a change and lock the plan before seeing any results. Then chance decides which days get the change. At the end a Bayesian model gives one of four answers: it worked, it made things worse, it made no difference, or it's not settled yet. The four crew members can also combine their results. On the overview there's a button that runs a full crew experiment in about 40 seconds with captions, so you can watch all four steps.

**The station**

Sol Lab is set inside a 3D model of a space station module. Each topic has its own station: vitals, bloodwork, cabin air, radiation, galley, body clock, experiments, maps and instruments. The body view uses real anatomy from BodyParts3D. Click a body system to see its readings and how spaceflight affects it. The **evidence chamber** shows how sure the experiment is: 1,600 moving dots, and each one is a possible size of the real effect. We also used NASA's own 3D models. The ISS flies its real path over the radiation globe and an astronaut floats past the window.

**Instruments**

There are 10 instruments, each shown in 3D with a real-size scale bar. Press Explode to see the parts inside, or open a NASA photo of the real device where one exists.

- **Radiation:** DOSTEL and the REM Timepix detector
- **Air:** the CO2 removal assembly (CDRA) and the Major Constituent Analyzer
- **Vitals:** Bio-Monitor smart shirt, blood pressure cuff, pulse oximeter, glucose meter
- **Exercise:** T2 treadmill and ARED

The specs come from NASA technical reports and papers. For example: DOSTEL has two silicon detectors (154 and 315 µm thick), the CDRA runs a 288-minute cycle, and ARED can load up to 272 kgf.

**Real data we used**

- **ISS radiation:** 123,695 DOSTEL-1 readings plus REM data from six modules (NASA OSDR RadLab). Over half the dose comes from the South Atlantic Anomaly.
- **ISS cabin air:** 358 days of CO2, temperature and humidity (NASA OSDR Environmental Data App), checked against the 3 mmHg CO2 limit.
- **Bloodwork:** blood counts and metabolic panels from all four Inspiration4 crew members (OSDR OSD-569 and OSD-575).
- **Space weather:** NASA DONKI recorded 5 days of solar particle events and 6 geomagnetic storms in the same months. The dose inside the station didn't go up on those days. Earth's magnetic field protects low orbit. Crews going to the Moon or Mars won't have that.
- **Sleep:** sleep diaries from 49 people (Baigutanova et al. 2025).

Any reading nobody actually logged is simulated, and the app labels it that way. Records from different people and years are combined into one 180-day mission, and the app says that too.

**How we tested it**

Before each study we wrote down the plan and what would count as a pass. We also report the ones that failed.

1. On 49 real sleep records the experiment engine was wrong 0.68% of the time. Its 95% intervals covered the true answer 94.7% to 97.3% of the time.
2. Combining four crew members cut the error by 20% to 45% in simulation. One simpler method failed our test, so we dropped it.
3. A normal range built from 14 days flags 7 to 8% of healthy days. Three bad days in a row happens on less than 1% of days. That's why only repeated days move the level up.
4. We tried machine learning (ridge regression and gradient-boosted trees, trained on 48 people and tested on the 49th) to predict tomorrow's sleep. It did no better than the person's own average, so we kept the simple method.
5. All 44 automated tests pass.

**Why it matters**

On the way to the Moon or Mars there's no doctor on board, and messages to Earth take a long time. Crews need to catch changes early without getting constant false alarms. They also need a fair way to tell whether a fix really helped or they just had a good week. This works on Earth too, for anyone who lives far from a doctor.

**What we used to build it**

JavaScript with three.js (3D), cannon-es (physics), satellite.js (orbits), GSAP (camera movement) and Vite. Python with NumPy and scikit-learn for the studies. It runs in any modern browser and doesn't need to be installed.

**Limits**

Sol Lab is not a medical device and hasn't been tested on astronauts. A doctor still needs to review our warning levels. The bloodwork is from a 3-day mission, not a long one. The radiation detectors mostly miss neutrons, which the Canadian Space Agency says make up about 30% of ISS radiation.

**Static copy of the demo deck (PDF):** https://github.com/palashraks-afk/NASA-Space-Apps/blob/main/docs/demo/Sol-Lab-deck.pdf

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
