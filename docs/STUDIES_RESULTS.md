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

## Study 4 (exploratory, not pre-registered): false flags from a personal usual range

Question: the app compares each day with a usual range built from a person's first days (95% prediction interval). How often does that flag a healthy day, and does requiring several days in a row fix it? Data: the same 49 people's sleep diaries, 28 days each, with no intervention, so every flag after the baseline is false. Script: `lab/scripts/study_baseline.py`; output: `analysis/baseline_false_flags.json`.

| Measure | Baseline days | Single-day false flags (mean) | People flagged on more than 15% of days | Three days in a row outside |
|---|---|---|---|---|
| Sleep duration | 14 | 8.0% | 7 of 49 | 0.34% of days |
| Sleep efficiency | 14 | 6.7% | 6 of 49 | 0.51% |
| Time to fall asleep | 14 | 7.1% | 7 of 49 | 0.34% |
| Sleep duration | 7 | 8.9% | 12 of 49 | 0.43% |
| Time to fall asleep | 7 | 11.3% | 13 of 49 | 1.29% |

Reading: a single day outside a 14-day personal range happens on about 7 to 8% of healthy days, above the nominal 5%, and a minority of people are much noisier. Shorter baselines are worse. Requiring three consecutive days outside cuts false escalations to under 1% of days for every measure. This is why the app shows a single day only as "keep an eye on it" and escalates to the flight surgeon for sleep, mood and exercise only after three days. Limits: exploratory (analysis choices made while looking at the data), sleep diaries only, 28-day records, no true changes to detect, so this measures false flags, not sensitivity.

## Study 5 (exploratory, not pre-registered): does machine learning beat a person's own average?

Question: the app centres each person's usual range on their own running average. Would a model learned from other people predict the next night better, and give a sharper range? Data: the same 49 people's sleep diaries (28 nights each). Training: leave one person out, train on the other 48, predict every night from night 8 on using only earlier nights; 1,029 nights scored per measure. Script: `lab/scripts/study_forecast.py`; output: `analysis/forecast_study.json`.

| Measure | Own running average | Yesterday's value | Ridge regression | Gradient-boosted trees |
|---|---|---|---|---|
| Sleep duration (mean absolute error, h) | 1.106 | 1.480 | 1.114 | 1.070 |
| Sleep efficiency | 0.0380 | 0.0467 | 0.0378 | 0.0388 |
| Time to fall asleep | 0.347 | 0.407 | 0.343 | 0.359 |

Reading: neither model reliably beats the person's own running average. Ridge is within about 1% everywhere, and a bootstrap over people puts the ridge-minus-average difference on both sides of zero for every measure. Boosted trees win by 3% on duration and lose on the other two, so we treat that as noise. Ranges centred on the ridge forecast flagged healthy nights more often (7.5 to 13.0%) than ranges centred on the average (7.3 to 11.0%). "Yesterday's value" is clearly worse. So we kept the simple personal average, and the app says why. Limits: exploratory, sleep only, short records, four simple features; a model with richer inputs (activity, light, workload) might do better.
