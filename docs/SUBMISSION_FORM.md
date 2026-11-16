# Submission form: paste-ready text

Each section matches one field on the team's Project tab. Check the two links work in a private window before you paste them.

---

## Project Name

Sol Lab

---

## Summary (50 to 200 words; this is 189)

Astronauts on long missions cannot count on a doctor nearby. On the way to Mars, a message to Earth can take up to 20 minutes each way, so the crew has to catch health problems themselves. Sol Lab is built for that. Each crew member logs blood pressure, heart rate, blood sugar, temperature, sleep, mood and exercise in a daily check-in. The app compares every reading with that person's own baseline rather than a population average and gives it one of three levels: within range, keep an eye on it, or talk to the flight surgeon. Our main feature is the self-experiment. To test whether a slow-breathing session lowers a stressed crew member's heart rate, Sol Lab randomizes which days include it and locks the plan before any results are seen. At the end it reports whether the session helped, and it says "not settled yet" when the data are too weak. It runs inside a 3D station built on NASA data for ISS radiation, cabin air and the Inspiration4 crew's blood tests. On sleep records from 49 people, the method was wrong less than 1% of the time.

---

## Project Demonstration (link)

The deck in PowerPoint for the web, with its transitions and animations (no login needed; judges click Slide Show):

    https://1drv.ms/p/c/82f87ab6bea1eabe/IQA3i0XuHsI-Rr-yLhXbPgheAXB41oUChSMppnh6q9QYSZk?e=u8fWhB

Checked 2026-11-15 in a signed-out browser: opens straight into the deck. Static PDF backup (linked at the end of Project Details): https://github.com/palashraks-afk/NASA-Space-Apps/blob/main/docs/demo/Sol-Lab-deck.pdf

---

## Project (link)

Entered on the form (works without a login):

    https://github.com/palashraks-afk/NASA-Space-Apps

The live app will be at https://palashraks-afk.github.io/NASA-Space-Apps/ once Settings > Pages > Source is set to "GitHub Actions" (still "not found" on 2026-11-15 at 8 p.m.). If it goes live before the deadline, swap it in and click Submit for Judging again.

---

## Project Details

The box is rich text: copy the formatted text below (from the rendered page on GitHub) so the bold carries over.

**What it does**

The challenge asks for three things: gather health data, make sense of it, and help the crew act on it. Sol Lab does all three.

**1. Gather:** Every day each astronaut does a short check-in. Blood pressure, resting heart rate, fasting blood sugar, temperature, sleep, mood and exercise. They can type numbers in or load a file from a device (CSV or FHIR). The app reminds them when to measure, since timing matters: heart rate before getting up, blood sugar before breakfast. Each card also explains how to take the measurement when you're floating.

**2. Evaluate:** We compare each reading to that person's own normal, which comes from their days before launch. A reading gets one of three labels: within range, keep an eye on it, or talk to the flight surgeon. The labels are words as well as colors so colorblind users aren't left out. For blood pressure, blood sugar, fever and sleep we used published medical cut-offs (ACC/AHA, ADA, CDC and AASM). Where we couldn't find one, we picked a value and flagged it for a doctor to check. One weird day doesn't set off an alarm. It has to keep happening.

**3. Act (our main feature):** Every warning tells the crew what to try next. For slow problems like bad sleep, they can run a small experiment on themselves. They choose a change, lock the plan before seeing any data, and let chance pick which days get the change. A Bayesian model then gives one of four answers: it worked, it made things worse, it made no difference, or it's not settled yet. That last one comes up a lot with a single person, and we'd rather say so than guess. The whole crew can also pool their results. If you just want to see it, there's a button on the overview that runs a crew experiment in about 40 seconds with captions for each step.

**The station**

Everything happens inside a 3D space station module with a different station for each topic (vitals, bloodwork, cabin air, radiation, galley, body clock, experiments, maps and instruments). The body uses real anatomy from the BodyParts3D database, and you can click a body system to see its readings and what spaceflight does to it. The evidence chamber is probably the strangest thing we made: 1,600 floating dots, where each dot is one possible size of the real effect. As the experiment runs, the cloud shrinks and slides toward the answer. We also pulled in NASA's own 3D models, so the ISS flies its real orbit over the radiation globe and an astronaut drifts past the window.

**Instruments**

We modeled 10 pieces of real ISS hardware in 3D at true size. You can explode each one to see the parts inside or switch to a NASA photo of the real thing. For radiation there's DOSTEL and the REM Timepix detector. For air, the CO2 removal assembly (CDRA) and the Major Constituent Analyzer. For vitals, the Bio-Monitor shirt, a blood pressure cuff, a pulse oximeter and a glucose meter. For exercise, the T2 treadmill and ARED. The specs come from NASA technical reports. DOSTEL's two silicon detectors are 154 and 315 µm thick, the CDRA runs on a 288-minute cycle, and ARED can pull up to 272 kgf.

**Data**

- **ISS radiation:** 123,695 DOSTEL-1 readings plus REM data from six modules, from NASA OSDR RadLab. More than half the dose comes while the station passes over the South Atlantic Anomaly.
- **ISS cabin air:** 358 days of CO2, temperature and humidity from the NASA OSDR Environmental Data App, checked against the 3 mmHg CO2 limit.
- **Bloodwork:** blood counts and metabolic panels for all four Inspiration4 crew members (OSD-569 and OSD-575).
- **Space weather:** NASA DONKI logged 5 days of solar particle events and 6 geomagnetic storms during the same months. You might expect the dose to jump on those days. It didn't, because Earth's magnetic field shields low orbit. A crew headed to the Moon or Mars won't have that protection.
- **Sleep:** sleep diaries from 49 people (Baigutanova et al. 2025).

We tried to be upfront about the gaps. Any reading nobody actually logged is simulated and labeled that way. Records from different people and years are stitched into one 180-day mission, and the app says that too.

**Testing**

We wrote down each study's plan and pass/fail bar before running it. Not everything passed.
1. On the 49 real sleep records, the experiment engine made the wrong call 0.68% of the time. Its 95% intervals contained the true answer 94.7% to 97.3% of the time.
2. Pooling four crew members cut the error by 20% to 45% in simulation. A simpler pooling method failed our bar, so we cut it.
3. A personal range built from 14 days flags 7 to 8% of perfectly healthy days. Three flagged days in a row happens less than 1% of the time, which is why the app waits for repeats.
4. We tried machine learning (ridge regression and gradient-boosted trees, trained on 48 people, tested on the 49th) to predict tomorrow's sleep. It couldn't beat the person's own average, so we kept the average.
5. All 44 automated tests pass.

**Mental health**

NASA lists isolation and confinement as one of the five hazards of spaceflight, so mood is part of the daily check-in, rated 1 to 5 before sleep. One low day gets "keep an eye on it" along with simple steps: schedule a private call home, get some exercise and light, tell a crewmate you trust. Three low days in a row go to the flight surgeon or the behavioral health team, and the app says that conversation is private. The answers stay with the astronaut unless they choose to share them. We also track cabin CO2, since high levels are linked to headaches and slower thinking. The air station turns the 7-day average into a headache risk using the curve from Law et al. 2014, a study of ISS crews. In the 3D body, the brain shows mood and sleep, and clicking it explains how confinement and distance from home wear on a crew over time.

**Why it matters**

On a Mars mission there's no clinic to call and every message takes a while. Crews need to catch changes early without getting buried in false alarms, and they need a fair way to tell a real fix from a lucky week. People on Earth who live far from a doctor have the same problem.

**Built with**

JavaScript with three.js, cannon-es, satellite.js, GSAP and Vite. Python with NumPy and scikit-learn for the studies. It runs in a normal web browser with nothing to install.

**Limits**

Sol Lab isn't a medical device and hasn't been tested on real astronauts. A doctor still needs to review the warning levels. The bloodwork comes from a 3-day mission, not a long one. And the radiation detectors mostly miss neutrons, which the Canadian Space Agency estimates are about 30% of the dose on the ISS.

**Static copy of the demo deck (PDF):** https://github.com/palashraks-afk/NASA-Space-Apps/blob/main/docs/demo/Sol-Lab-deck.pdf

---

## Use of Super Intelligence (SI)

Ticked on the form: **Data Analysis and Interpretation** and **Coding, Debugging, or Troubleshooting**.

Not ticked: "Building SI/ML Into the Project". Sol Lab has no AI inside it: we tested machine learning, it did not beat the simple method, and we left it out. No images, video or audio were generated; the slides use real screenshots of the app.

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

The form allows 25 rows, so the code libraries and fonts share one row that links to the credits file, which lists each with its license.

| Link Text | Link URL |
|---|---|
| Canadian Space Agency: Monitoring radiation for astronaut health | https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp |
| Canadian Space Agency: Bio-Monitor | https://www.asc-csa.gc.ca/eng/sciences/bio-monitor.asp |
| Baigutanova et al. 2025 sleep and wearable dataset (CC BY 4.0) | https://doi.org/10.6084/m9.figshare.28509740 |
| Baigutanova et al. 2025, Scientific Data article | https://doi.org/10.1038/s41597-025-05801-3 |
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
| Labrenz et al. 2015, Matroshka DOSTEL detector specifications | https://doi.org/10.1051/swsc/2015039 |
| CERN Medipix collaboration (Timepix chip) | https://medipix.web.cern.ch/ |
| Pickering et al. 2005, blood pressure measurement recommendations | https://doi.org/10.1161/01.HYP.0000150859.47929.8e |
| Whelton et al., 2017 ACC/AHA blood pressure guideline | https://doi.org/10.1161/HYP.0000000000000065 |
| Jubran 2015, Pulse oximetry | https://doi.org/10.1186/s13054-015-0984-8 |
| U.S. FDA, Pulse Oximeters | https://www.fda.gov/medical-devices/products-and-medical-procedures/pulse-oximeters |
| ISO 15197:2013, blood glucose meter accuracy | https://www.iso.org/standard/54976.html |
| CelesTrak orbital elements | https://celestrak.org/NORAD/elements/ |
| Sol Lab source code (Apache 2.0) | https://github.com/palashraks-afk/NASA-Space-Apps |
| Open-source code libraries and fonts: three.js, cannon-es, satellite.js, GSAP, Vite, Draco, html-to-image, NumPy, scikit-learn, Barlow, Archivo and Permanent Marker fonts | https://github.com/palashraks-afk/NASA-Space-Apps/blob/main/lab/public/CREDITS.md |

The RadLab page itself (https://visualization.osdr.nasa.gov/radlab/gui/) was returning a server error on 2026-11-14, so the table links the OSDR visualization home. Swap it back if RadLab is up when you paste.

---

## Before clicking "Submit for Judging"

Status at 8 p.m. on 2026-11-15: every section of the project page shows Complete and was saved at 20:00.

- [x] Whole team registered to the Temecula event
- [x] Repo public; demo link (OneDrive) and repo link open without a login
- [x] Every field pasted and saved
- [x] Both boxes ticked
- [ ] Click Submit for Judging before Sun Nov 15, 11:59 p.m. Pacific, and check for the confirmation banner
- [ ] Optional: turn on GitHub Pages, then swap the live app link into the Project field and resubmit
