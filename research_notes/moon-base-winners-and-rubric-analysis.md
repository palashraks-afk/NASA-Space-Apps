# Moon Base Challenge: winners analysis and rubric breakdown

Written 2026-11-19. Team confirmed all high school students, so the entry would be in the **High School Division**. Companion to `moon-base-challenge.md` (rules digest) and `moon-base-fit-plan.md` (what to change).

Pages read: moonbasechallenge.org (rules, Astronaut Safety, How to Conduct Scholarly Research) and ssic.competitionsciences.org (rules, Best in Show: Fall 2023, Spring 2024, Fall 2024).

## 1. There are no Moon Base winners yet, and winning papers are not public

Registration opened 2026-11-07 and the first paper is due 2027-02-22, so nobody has won anything. I searched for any announced finalists and found none.

The closest real evidence is another challenge from the same organizer, the **Space Station Innovation Challenge (SSIC)**, run by the Institute of Competition Sciences (ICS) for high school and college students. Its site lists "Best in Show" winners for three seasons. Only team names, schools, project titles, student names and coaches are listed. I could not find any winning deck, paper or video online, so I cannot say what the winners wrote or why they won. Everything below is about who won and what they chose, not what was in their entries.

## 2. SSIC winners: what the 17 teams show

| Season | Teams | Titles (as listed) |
|---|---|---|
| Fall 2023 | 5 | 360 Projectors to Benefit Astronaut Mental Health; Emergency Evacuation Systems and Improvements; Mid-zone and Lightweight Space Suit; Bamboo Greenhouse; Autonomous Cleaner Controls |
| Spring 2024 | 6 | Wall Gardens of Specially Chosen Plants on the ISS; Autonomous Laser Debris Removal (AI); Cardiovascular Health in Space: Monitoring Vitals in Microgravity; Predictive Monoclonal Antibody Engineering (deep learning); Solid Propellant Gas Generators; Expanding Space Tourism Using Existing Technology |
| Fall 2024 | 6 | Radiation Prevention on the ISS; Integrating Nanotechnology/AI in Space Health; Artificial Gravity Ring; Bioregenerative Systems to Improve Water Recovery; Interdependent, Sustainable, Resilient Hydroponics; Microgravity Metal 3D Printing |

What stands out:

1. **Health and safety topics win often.** Six of 17 were directly about astronaut health, safety or protection (mental health, evacuation, space suit, cardiovascular monitoring, radiation, space health). Seven if the wall-garden project counts. Radiation specifically appeared once. So a health-and-safety entry is a normal kind of winner in this program, but it is also a crowded theme.
2. **Team size does not matter.** Winners had 1 to 5 students: three teams of 1, three of 2, five of 3, three of 4, three of 5. Mean and median are both 3. Moon Base allows 2 to 5, so our five is fine but not an advantage.
3. **A few schools and coaches produce a lot of winners.** Eight of 17 winning teams (47%) came from three schools: three from one Hawaii high school (all in Fall 2024), three from one Virginia governor's school (all coached by the same teacher), and two from one New York high school (same coach). In total the 17 teams came from 12 schools. The pattern suggests a coach who runs this as a repeatable program matters. For us, the Team Coach is more than paperwork.
4. **Returning students win again.** At least one student appears on winning teams in two consecutive seasons.
5. **Software and AI topics appear (4 of 17)** but none is a pure software product; each is tied to a physical station problem.
6. **Three of 17 were international teams.** Moon Base is U.S. only, so those are not comparable.

Limits of this analysis: the pages do not rank the winners or give scores, "Best in Show" is not the Grand Prize, and the SSIC rules page says one to three Best in Show awards per division per season, while these lists show five or six per season, so the lists probably include both divisions or the rules changed. I do not know how many teams entered.

## 3. Why SSIC winners are only a loose guide for Moon Base

| | SSIC (high school) | Moon Base |
|---|---|---|
| Phase 1 deliverable | Pitch deck of up to 12 slides plus a video of up to 10 minutes | **A 5 to 7 page technical paper** with a visual aid page, no video |
| Judges | SSIC advisors (ISS National Lab context) | NASA experts and aerospace industry professionals, then a Judges' Summit vote |
| What the topic must satisfy | An idea for a space station | Lunar surface constraints: mass, volume, power, vacuum, dust, -170 to +120 C, two-week night, no constant Earth link |
| Team size | 1 to 3 per the current rules page | 2 to 5, with an adult Team Coach |
| AI use | **Banned** for writing submissions; ICS says it may use AI detectors and disqualify | **Allowed with disclosure** (rule 8.6) |
| Location | Any country | U.S. students and U.S.-based organizations only |

The biggest gap: SSIC high school entries never had to write a technical paper, and Moon Base judges will score viability against hard lunar constraints. Winning an SSIC-style pitch does not predict a good Moon Base paper.

The AI rules differ, but both come from the same organizer. The Moon Base rules also require that the design, analysis, visuals and writing are the students' own work, and the Moon Base research guide says to treat AI output as "a lead, not a credible source" and to verify every claim against a primary source.

## 4. The Phase 1 rubric, broken down

The rules give five criteria, each scored 0 to 5 (25 points). Each criterion lists exactly **five questions** (12.1.1.1 to 12.1.1.5, and so on). The rules do not say how the 0 to 5 is assigned, but one point per question is a reasonable assumption, and the questions are the clearest statement of what judges check. That makes 25 questions to answer. Below is each one against the storm-shelter concept in `moon-base-fit-plan.md`.

Key: **Ready** = we have the material now. **Work** = doable, task number from the plan. **Hard** = structural weakness. **Students** = depends on how well the paper is written.

| # | Question (shortened) | Status |
|---|---|---|
| **Problem background and NASA alignment** | | |
| 1 | Clearly names the challenge and category | Ready |
| 2 | Explains why it is critical for long-term Moon Base operations | Work (tasks 2, 3) |
| 3 | Describes current technical barriers or gaps facing Artemis | Work (task 2) |
| 4 | Explains how it supports a sustained lunar presence | Ready |
| 5 | Accurate research with credible facts and proper citations | Work (task 2) |
| **Solution design and operations** | | |
| 6 | Step-by-step operation from start to finish | Work (tasks 4, 8) |
| 7 | Names the lunar infrastructure or operational need it fulfills | Work (task 3) |
| 8 | Shows the core logic, architecture, components or steps | Work (tasks 4, 8) |
| 9 | Explains why it beats existing methods | **Hard** (needs the task 4 result; Orion already has a shelter plan and NOAA issues storm alerts) |
| 10 | Addresses risks, failure points and safety hazards | Work (task 7) |
| **Solution viability** | | |
| 11 | Resource efficiency: mass, volume, power, computing | Work (tasks 5, 6) |
| 12 | Harsh conditions: low gravity, thermal shifts, vacuum, dust | **Hard** (software lives inside the habitat; must argue by system boundary) |
| 13 | Works through the two-week light and dark cycles | Work (tasks 6, 7) |
| 14 | Minimal Earth resupply and complex crew maintenance | Work (tasks 6, 7) |
| 15 | Self-sufficient, no continuous human intervention or out-of-scope infrastructure | Work (task 5) |
| **Visual aids** | | |
| 16 | A dedicated visual aid page | Ready (task 8) |
| 17 | Labeled with titles, callouts, captions | Ready |
| 18 | Helps the reviewer see how it fits into a Moon Base | Work (task 8: habitat layout figure) |
| 19 | Visuals support the text | Ready |
| 20 | Clean, legible, high resolution | Ready |
| **Communication** | | |
| 21 | Logical, organized, required sections distinct | Students |
| 22 | Guides the reader without ambiguity | Students |
| 23 | Concise and clear for a broad technical audience | Students |
| 24 | Proofread, few errors | Students |
| 25 | Meets format rules (font, margins, cover page, page limit) | Ready (checklist) |

Tally: **7 ready, 12 work, 2 hard, 4 students.**

What that says:
- The two hard questions (9 and 12) and parts of 11 and 13 are all in design and viability. That is where points will be lost, and where a software-only concept is weakest.
- Visual aids (5 questions) are our strongest area, because the app already produces labeled, high-resolution 3D images.
- Four of five Communication points are craftsmanship. A weak paper loses them regardless of the idea.
- Question 25 is easy points, but format failures can also stop an entry at screening before anyone scores it.

## 5. What the research guide adds

NASA's own guide on the Moon Base site tells students:

- Start from a focused, testable question. Its example: how much storage would a habitat need to survive a 14-day night.
- Use primary sources (NASA Moon Base site, Moon to Mars white papers, NTRS, TechPort) and cite them by document ID. Pick APA or IEEE and use one throughout.
- Show where every number came from, with assumptions, units and calculations. The guide's own scoreboard says **0 uncited numbers or facts**.
- Prefer NASA sources from the last five years. NASA announced the Moon Base on 2026-03-24; earlier documents may call it "Artemis Base Camp".

Implication: write the paper around one quantitative question, for example "How much warning does a habitat dose-rate monitor give compared with the time crew need to reach shelter?", and show the calculation. Our habit of pre-registering studies and reporting failed bars fits this well. It also means every Space Apps style claim we plan to reuse has to be re-sourced.

## 6. Strategy implications

1. **Position on measurement and procedure, not materials.** Many entries in this category will probably be shielding or dust hardware. A concept about knowing when to shelter and where is different. I cannot say how many entries there will be.
2. **Make the viability section the centerpiece.** It holds the two hard questions. Budget the most time there (compute measurement, cited mass and power, failure-mode table, plain statement of what the system does not cover).
3. **Do not oversell the app.** The paper is judged on the concept. Screenshots serve the visual aid page.
4. **Choose a coach early.** The SSIC pattern (a few coaches and schools repeating) suggests a coach who can review drafts and keep the team on schedule is worth more than extra features.
5. **Students write; we check.** Required by the rules, and the Phase 2 video needs every student on camera explaining the concept without AI voices.

## 7. Eligibility, updated

Confirmed: all high school students, so High School Division. Still to confirm:

- [ ] Each member is 13 to 18 years old as of 2026-11-07 and in grades 9 to 12 at a U.S. high school, CTE program, home school group or similar
- [ ] An adult (18+) with a formal role at that school or club will be the Team Coach (not a team member)
- [ ] Proof of enrollment for each member (transcript, registrar letter or coach letter)
- [ ] Each member applies on NASA STEM Gateway before **2027-01-25**
- [ ] No member is on another Moon Base team
- [ ] "Required Team Member documentation" (rules, section 3) is not described on the rules page; ask at registration what it includes

## 8. What I could not find

- Any Moon Base finalist or winner (none exists yet)
- The text of any winning SSIC entry or its score sheet
- The number of Moon Base entries expected, or acceptance odds
- Space Apps 2026 results (not announced; the 2025 winners were announced on 2025-12-18, so expect mid-December)
