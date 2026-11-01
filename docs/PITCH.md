# Pitch material

## 30-second version

Astronauts carry most of the responsibility for spotting and fixing changes in their own health, and what works differs from person to person. Every entry we found monitors and alerts. Sol Lab lets a crew member find out what works for their own body: design a small, fair experiment, run it in a 3D station module, and get an honest answer, including "not settled". Run it as a crew, and each person's answer gets sharper from what the crew shares. We checked it on 49 real people's sleep diaries before trusting it.

## Demo script (about 3 minutes)

1. **Window (20 s).** Opening drift back from the glass; Earth below on a real ISS pass (CelesTrak elements, SGP4). Switch to Mars: "a sol is 24 hours 39 minutes."
2. **Choose what to test (30 s).** "No caffeine after noon" against usual timing, measured by time to fall asleep. Point out: the smallest change worth acting on is the crew member's call; "how fast does it act" sets the design; the odds of a clear answer appear before starting.
3. **Randomize (20 s).** Tokens leave the cargo bag and drift in zero gravity onto their days. Click one mid-flight. Lock the plan and save it: this is a pre-registration file.
4. **Run as a crew (40 s).** Switch to "the whole crew (4)". Run at 10 days a second. The evidence chamber: every dot is a possible value of the true change; blue means works, grey too small to matter, red backfires; watch it tighten. Right panel: each member's chance with the crew versus alone.
5. **Result (30 s).** The table: with the crew versus alone, against the hidden truth. Say plainly that "not settled" is common for one person, and that this is the point: it stops you trusting a lucky streak.
6. **Body clock (20 s).** Mars, dim light: beads slip off the hand. Light later in the day keeps clocks aligned, consistent with a 2007 human Mars-sol study; our model is approximate and says so.
7. **Close (20 s).** Validation: false calls under 1% on real diaries, calibrated intervals, two pre-registered checks that failed and were reported.

## Claims we can make

- No N-of-1 or crew-run randomized self-experiment work in spaceflight or analog missions was found in public sources on 2026-11-01, and none among about ten public Space Apps 2026 repos for this challenge.
- On 49 real people's sleep diaries: false calls 0.68%, interval coverage 94.7% to 97.3%, power preview within 4 points of real-data power.
- Crew pooling cut error by 20% to 45% with coverage 90.9% to 97.8% (simulation, pre-registered).
- ISS orbit and sunrise count are computed from real orbital elements.

## Claims we must not make

- That this is novel in an absolute sense (we searched public sources only; N-of-1 trials and their pooling are established on Earth).
- That the Mars light-timing result is a discovery (it replicates published 2007 work, and our model locks more easily than people may).
- That it is clinically validated, a medical device, or tested on astronauts.
- That a single short self-experiment usually gives an answer (it usually does not).

## AI-use disclosure (for the submission form)

Code, analyses and documentation were written with Claude Code (an AI assistant) under the team's direction. The team chose the concept, criteria and scope, and reviewed results. Every study's plan and pass/fail bars were committed to the repository before it was run.
