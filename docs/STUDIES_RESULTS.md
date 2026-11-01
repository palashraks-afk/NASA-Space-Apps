# Validation study results (2026-11-01)

Plans and bars were committed before running: `docs/STUDIES_PREREG.md` (commits 8a0940b and 123333f). Raw outputs are in `analysis/study*.json`; scripts in `lab/scripts/study*.mjs`. Two pre-registered bars failed; both are reported as failures.

| Bar | Result | Pass |
|---|---|---|
| 1a. False-call rate on real diaries with nothing added, at most 5% | 0.68% (49 people, 3 sleep outcomes, 200 random schedules each) | yes |
| 1b. Real-data power within 10 points of the simulator's prediction | sleep duration 9.9% vs 9.2%; efficiency 9.8% vs 11.0%; time to fall asleep 13.9% vs 9.8% | yes |
| 1c. 95% interval coverage on real diaries, at least 90% | 94.7% to 97.3% | yes |
| 2a. Pooling lowers each person's error (spread 0 or 0.5) | yes in all four settings (plug-in and integrated methods) | yes |
| 2b. Pooled coverage at least 90% in every setting, plug-in method (Study 2) | 83.1% to 94.6% | **no** |
| 2b. Same bar, integrated method (Study 2b, pre-registered after the failure) | 90.9% to 97.8% | yes |
| 3a. Second-half light locks intrinsic periods 23.9 to 24.3 h to the Mars sol | locked, drift 0 min/sol | yes |
| 3b. First-half light fails to lock a 23.9 h clock | it locked (drift 0.1 min/sol) | **no** |

## What this means

**1. The engine is honest on real, messy data.** On 49 real people's diaries the false-call rate stayed under 1%, intervals were calibrated, and the in-app power preview predicted real-data power within 4 points. It also shows the hard limit: over about four weeks, a change 1.5 times the smallest worthwhile one is settled for one person only 10% to 14% of the time. A single short self-experiment usually ends "not settled", and the app says so.

**2. Running it as a crew is the strongest new angle.** Pooling a crew's results cut each person's estimation error by 37% to 45% when crew members respond alike, and by 20% to 22% when they differ moderately, while still giving each person their own answer. The first method (estimating how much people differ, then treating that as known) undercovered (83% to 86%). Integrating over that uncertainty fixed it (90.9% to 97.8%). Pooling of N-of-1 trials is established in medicine (aggregated N-of-1 trials); applying it to a spaceflight crew, with a validated method, was not found in the prior-art searches.

**3. The circadian model locks more easily than my reading of the 2007 human study.** Light early in the wake period also locked a short clock to the Mars sol. The 2007 study used second-half light for the Mars sol and did not test first-half light on that day length, so this bar rested on my inference, not a direct published result. As pre-registered, the body-clock station now says the model's lock range may be wider than in people. An exploratory follow-up (not pre-registered, `analysis/study3x_phase_angle.json`) shows why timing still matters: first-half light locks the clock 7.4 to 8.6 hours away from its Earth timing (like a night-shift misalignment), while second-half light keeps it within 0.3 to 0.4 hours.

## Prior-art check (2026-11-01, public sources only)

- No N-of-1, single-case, or crew-run randomized self-experiment work in spaceflight or analog missions was found. Closest: proposals for personalized countermeasures and a 2026 Experimental Physiology review calling for designs that separate true individual response from random and technical variability.
- About ten public Space Apps 2026 repos for this challenge were found; none use randomized self-experiments or Bayesian analysis. One (AstroBone) uses a personal baseline and a 3D digital twin, so 3D graphics alone are not a differentiator.
- Mars-sol entrainment by light timing is published (2007); the app treats its own result as a replication.
- Searches cover public sources only; private or unpublished work cannot be ruled out.
