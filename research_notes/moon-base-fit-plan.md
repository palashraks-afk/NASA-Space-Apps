# Moon Base Challenge: how to fit Sol Lab into Astronaut Safety

Drafted 2026-11-19. Sources: https://moonbasechallenge.org/rules/ and https://moonbasechallenge.org/astronaut-safety/ (both read 2026-11-19). The rules digest is in `moon-base-challenge.md`. This file is the plan for what would have to change. Nothing here is built yet.

## Bottom line

1. **This is a paper, not an app.** Phase 1 is a 5 to 7 page Concept Overview Paper with a diagram page. Sol Lab itself is never submitted. What carries over is the engineering behind it (the radiation data, the per-person baseline engine, the studies) and some screenshots as visual aids.
2. **Sol Lab does not fit Astronaut Safety as it stands.** The category is shielding, dust, micrometeoroids, personal safety gear, medical technologies and emergency protocols for the lunar surface. A general health console is none of those. The honest hooks are "measure what gets through", "give crews a shelter they can reach in minutes" and "emergency protocols" (all from the category page).
3. **The best reframe is radiation: an autonomous storm-shelter and dose guidance system for a lunar habitat.** It reuses the strongest real thing we found (see "Our own finding" below) and answers a question the category page asks directly.
4. **The weak spot will be the Solution Viability score.** Judges are told to look for mass, volume, power, vacuum, dust, temperature swings and the two-week night. A software concept has to show it runs on a small computer inside the pressurized habitat, with sensors that already exist, and fails safely. We have to produce those numbers; we do not have them yet.

## Before any work: eligibility (hard gate, checked at screening)

Please answer these. None can be inferred from the repo.

- [x] All members are high school students (confirmed by the team 2026-11-19), so the High School Division applies. Still to check for each: U.S. school or program, grades 9 to 12, and age 13 to 18 on 2026-11-07. See `moon-base-winners-and-rubric-analysis.md` for the full checklist.
- [ ] Is there an adult (18+) with a formal role at the school or club (teacher, advisor, club leader) who will be the Team Coach? They cannot be a team member, and prize money goes to their U.S. bank account.
- [ ] Who gets proof of enrollment for each member (transcript, registrar letter or coach letter)?
- [ ] Is anyone on another Moon Base team already? A student can only be on one.
- [ ] Team size is 2 to 5. Sol-Labs has five, which is the maximum.
- [ ] Application on NASA STEM Gateway by **2027-01-25**. Members who skip it are not eligible for prizes.

## What the judges score (Project Phase, 25 points) and where we stand

| Criterion (0 to 5 each) | What they look for | Sol Lab material we can use | Gap |
|---|---|---|---|
| Problem background and NASA alignment | Why the problem matters for a lasting Moon base; credible, cited facts | Radiation analysis (DOSTEL, REM, DONKI); NASA HRP hazards pages | Need lunar-specific sources; the ISS data is in a shielded orbit |
| Solution design and operations | Step-by-step operation; why better than existing methods; failure points | Guidance tiers and escalation rules (`lab/src/sim/guidance.js`); the instrument models | The shelter logic does not exist yet |
| Solution viability | Mass, volume, power; vacuum, dust, -170 to +120 C; two-week light and dark; little resupply; no constant Earth link | App runs from bundled files with no network calls (checked: every `fetch` in `lab/src` is to its own files) | **No measured compute, power or mass numbers; no failure-mode analysis** |
| Visual aids | At least one page of labeled diagrams | 3D station and instrument screenshots; we can draw the architecture | Architecture diagram not drawn |
| Communication | Clear, organized, proofread, follows the format | Our habit of reporting failed studies | Must be written by the students |

I would not put numbers on the likely score yet. Viability is where a software-only concept loses points, so it needs the most work.

## The concept to write up

Working title: **Autonomous storm-shelter and dose guidance for a lunar habitat.**

- **Sense:** small dosimeters placed around the habitat and shelter (the app already models the REM Timepix detector from NASA's RadWorks report), plus personal dosimeters.
- **Decide on the spot:** a small computer in the habitat detects a rise in dose rate by itself, with no link to Earth, and starts a shelter protocol.
- **Guide:** tells each crew member where the lowest-dose spot is and how long to stay, and keeps a running dose total per person.
- **Follow up:** afterwards the existing per-person baseline engine flags changes (sleep, heart rate, nausea) and tells the crew when the flight surgeon needs to know once a link is available.
- **Fail safe:** if sensors, power or the computer fail, the protocol falls back to a fixed procedure on paper or a simple timer.

What is real already: the REM instrument model and its NASA source; the radiation and space weather analysis; the baseline and escalation logic; a static build with no network calls. What is new: the lunar storm logic, the location-dose map idea, detection tested on real storm data, the failure-mode table, and the mass, volume and power table.

### Our own finding that makes the story

NASA DONKI logged 5 days of solar particle events and 6 geomagnetic storms in the same months as our ISS radiation data, and the dose inside Columbus did not go up on those days. Earth's magnetic field shields low orbit. The Moon has no such shield (the category page says "no atmosphere or global magnetic field"). So the ISS result shows what the Moon crew loses.

### Facts from NASA's Astronaut Safety page to build on (cite the page and the NTRS reports it lists)

- On Artemis I, dosimeters in two mannequins (Helga and Zohar) showed dose varied up to four times by location inside Orion, and turning the spacecraft 90 degrees cut the dose in half.
- Orion's shelter plan packs stowed supplies around the crew to keep a large storm's dose to about 150 mSv.
- During Artemis II, NOAA issued more than 40 space-weather watches, warnings and alerts; no major storm hit, and preliminary crew doses matched predictions.
- Lunar night is about 14.8 days; permanently shadowed craters get as cold as about -203 C; sunlit areas exceed 54 C. (The rules page uses +120 to -170 C as the design range. Use the rules page numbers for the constraints section and say where each number comes from.)
- The page's own questions: How quickly can crew reach shelter during a solar particle event? What happens during a cabin leak, fire or injury far from base?
- Listed reports: Crew Radiation Protection for the NASA Artemis Program (2025), NTRS 20250002757; Addressing the Myths: Health Risk Context for Lunar Dust (ICES 2025), NTRS 20250000173.

## What must change from the Space Apps story

- **Drop the Mars-style delay argument.** Our summary says a message to Earth can take up to 20 minutes each way. For the Moon it is about 1.3 seconds one way. The real argument is autonomy: the rules exclude concepts that need constant Earth communication or continuous supervision, and a south-pole base will have gaps in line of sight.
- **Drop "health console".** Frame it as a safety system. The 3D station, anatomy and instrument models become visual aids, not the product.
- **Do not claim offline operation beyond what we tested.** The build makes no network calls, but there is no service worker and it must be served over HTTP. If we claim offline use, we build and test it first.
- **Do not carry over the circadian claims.** The Moon mode in the app only sets a 24-hour habitat lighting schedule, and our circadian model failed one pre-registered Mars-sol check, bar 3b (see `docs/STUDIES_RESULTS.md`). The two-week night matters for the viability section, but only claim what we validated.
- **Crew time.** Rules say no systems needing complex crew operations. The shelter guidance has to be automatic, with the daily check-in as the only routine task (about two minutes).
- **Scope honestly.** Dust, micrometeoroids and shielding materials are not addressed. Say so, and say how the system works alongside them ("layers" is the category page's own word).

## Work list

Effort is rough hours for one person. Order is the order I would do them.

| # | Task | Output | Effort |
|---|---|---|---|
| 1 | Settle eligibility and the Team Coach (above) | Yes or no on entering | 1 |
| 2 | Read the listed NASA reports and write down every number we will cite, with page | `docs/moonbase/sources.md` | 6 |
| 3 | Pick the lunar dose and storm numbers from published measurements, not from memory | Table with citations | 4 |
| 4 | Pre-register, then run a storm-warning study on real proton flux data: how much warning does a rate-of-rise rule on a dose rate give compared with when a dangerous dose builds up? Report it even if it fails | `docs/STUDIES_PREREG.md` entry and results | 12 |
| 5 | Split the guidance and baseline engine into a headless core and measure its CPU time and memory | Numbers for the viability section | 4 |
| 6 | Find a real small-computer class used in space or planned for it, and cite its power and mass from the maker's data | Resource budget table | 3 |
| 7 | Write a failure-mode table: sensor dropout, power loss, memory upsets from radiation, dust in the airlock, a crew member who cannot reach the shelter | One page | 4 |
| 8 | Draw the architecture and operations diagram | Visual Aid page | 4 |
| 9 | Optional in the app: a lunar storm scenario with a shelter timer, for screenshots only | Screenshots | 10 |
| 10 | Students write the paper from the outline; we review facts and numbers | 5 to 7 page PDF | students |

## Facts I would not trust from memory (verify before writing)

- NASA's short-term and career radiation dose limits (NASA-STD-3001). The app already cites the standard for cabin limits, but dose limits are in a different part of it; read the current volume.
- Measured dose rates on the lunar surface (published surface and orbiter instruments) and how they compare with the ISS.
- How long solar particle storm protons take to arrive after a flare, and typical warning time from space-based forecasts.
- Mass, size and power of the REM unit and of any host computer. The REM numbers are in `lab/src/sim/instruments.js` with sources.

## Rules that bite

- Cover page: Team ID number, category and title only. No names, coach or school, and no NASA logos. It does not count toward the page limit.
- Paper: PDF only, 5 to 7 pages not counting cover and references, 11 pt or larger, 0.75 inch margins or more, single or 1.15 spacing, 6 MB per file or less, English.
- Everything cited. Plagiarism is banned.
- AI is allowed, but any use for text, images, analysis or code must be stated and described. The design, analysis, visuals and writing must be the students' own work. I can find sources, run analyses, draw diagrams and check numbers, but I should not write the paper.
- Phase 2 (finalists only): video up to 10 minutes, every student on camera, at least one student visible at all times, no voice-over slides, no AI avatars or AI voices, no coach on camera; slides up to 15, 16:9 PDF.
- Submissions go through the ICS portal, which opens at the Opening Symposium on 2026-12-03.

## Timeline

| Date | What |
|---|---|
| 2026-12-03 | Opening Symposium; submission portal opens |
| 2027-01-14 | Office Hours 1: ask about category fit for a software concept, and the finalist counts |
| 2027-01-25 | STEM Gateway applications close (every member) |
| 2027-02-11 | Office Hours 2 |
| 2027-02-22 | Concept Overview Paper due |
| 2027-03-11 | Finalists announced |
| 2027-04-19 | Final Phase video and slides due |
| 2027-05-06 | Winners announced |

Work back from 2027-02-22: sources and numbers by mid-December, the storm study and compute measurements by mid-January, diagram and first draft by early February, two weeks of review and proofreading.

## Questions for Office Hours 1

1. Is a software and sensor concept for storm sheltering in scope for Astronaut Safety, or does the category expect physical protective hardware?
2. Is a system that runs only inside the pressurized habitat acceptable for the thermal and dust constraints, with the suit side left to existing personal dosimeters?
3. How should the finalist and Grand Prize counts on the rules page be read?
