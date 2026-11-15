# Pitch material

## One sentence

Sol Lab gives each astronaut a daily check-in that compares every reading with their own normal, says plainly what to do and when to call the flight surgeon, and helps them test which change actually fixes it, built on real NASA and SpaceX crew data.

## 30-second version

On long missions astronauts have to spot and fix their own health problems. Sol Lab does three things. **Gather:** a two-minute daily check-in (blood pressure, heart rate, blood sugar, temperature, sleep, mood, exercise), typed in or imported from any device. **Evaluate:** every value is compared with that person's own normal and given one of three calm levels, with what to do next and when the flight surgeon should hear about it. **Act:** when something drifts, the crew can run a fair self-experiment and get an honest answer, including "not settled". It runs on real records: ISS radiation and cabin air from NASA's open data, and the Inspiration4 crew's blood tests.

## Demo script (3 minutes)

The app opens with a guided tour; the demo follows it.

1. **Overview (20 s).** "Four crew, one module. Each line compares a person with their own normal, not a population average. Nothing beeps; a colour and a word say whether to look."
2. **Check-in (40 s).** Type a blood pressure of 145/92. The card turns amber: "Recheck after 5 minutes of rest; if it stays this high for 3 days, raise it at the next medical conference." Open "How to measure": instructions written for weightlessness. Point to the daily routine and the quiet reminder at 07:15.
3. **Body (20 s).** Click the heart on the 3D figure: today's linked readings, what spaceflight does to it, which of NASA's five hazards apply.
4. **Real data (40 s).** Bloodwork: the Inspiration4 astronauts' blood counts before launch and after landing, flagged only beyond normal day-to-day variation. Air: real ISS CO2 from 2016, above today's 3 mmHg limit. Radiation: 123,695 real readings; the globe lights up over South America, where more than half the dose comes from.
5. **Act (40 s).** Experiments: "Does no caffeine after noon help me fall asleep?" Randomize, lock the plan, run as a crew at 10 days a second, read the verdict. "It often says 'not settled'. That is the point: it stops a crew member trusting a lucky streak."
6. **Hardware (10 s).** Instruments: the real ISS devices behind each reading, exploded into parts; import a FHIR file from any device.
7. **Close (10 s).** "Gather, evaluate, act. Checked on 49 real people's sleep diaries: false calls under 1%."

## How it answers the brief

| The brief asks | Where in Sol Lab |
|---|---|
| Gather health indicators (keyboard, clicks, files) | Check-in; Instruments import (CSV, FHIR) |
| Evaluate status; colour coding at a glance | Three levels on every reading; overview table; coloured body figure |
| Act: guidance on treatment and improvement | Actions on every non-normal level; self-experiments |
| When to involve the crew or flight surgeons | "For the flight surgeon" box; top level |
| Blood pressure, heart rate, blood sugar, temperature, sleep, mood | All six, plus exercise |
| The five HRP hazards | Overview list, each linked to its stations |
| Clickable human figure | Body tab |
| Prompts as part of the routine | Daily routine with timed reminders |
| Gamification | Mission patches, check-in streak |
| Charts over time | Every station |
| Simple instructions and explanations | "How to measure" on every card; guided tour |
| Different environments | Station, Moon base, Mars |

## Claims we can make

- Real data: ISS radiation (NASA OSDR RadLab: 123,695 DOSTEL-1 readings, plus six modules), ISS cabin air (358 days, NASA OSDR Environmental Data App), Inspiration4 bloodwork (NASA OSDR OSD-569, OSD-575), 49 people's sleep diaries, USDA nutrients, CelesTrak orbit.
- On 49 real people's sleep diaries the self-experiment engine made a false call 0.68% of the time; interval coverage 94.7% to 97.3% (pre-registered).
- Crew pooling cut error by 20% to 45% with coverage 90.9% to 97.8% (simulation, pre-registered).
- Guidance levels follow published cut-offs (ACC/AHA, ADA, CDC, AHA, AASM); team-chosen escalation points are marked as such.
- No crew-run randomized self-experiment tool for spaceflight was found in public sources (searched 2026-11-01).

## Claims we must not make

- That it is a medical device, clinically validated, or tested on astronauts.
- That the team-chosen escalation points are clinical standards.
- That the composite mission is one real crew: records from different people and years are combined, and the app says so.
- That a single short self-experiment usually settles a question (it usually does not).
- That the instrument diagrams are flight blueprints (they explain how each class of device works).
- That the Mars light-timing result is new (it replicates a 2007 study, approximately).

## AI-use disclosure (for the submission form)

Code, analyses and documentation were written with Claude Code (an AI assistant) under the team's direction. The team chose the concept, criteria and scope, and reviewed results. Every study's plan and pass/fail bars were committed to the repository before it was run.
