# Pre-registered validation studies (written 2026-11-01, before any of these were run)

Bars are fixed here and will not be moved after seeing results. Results go in `docs/STUDIES_RESULTS.md`, including any bar that is missed.

## Study 1: Does the engine behave on real, messy data?

Simulation checks so far used Gaussian noise. Real diaries are skewed, have outliers and odd days.

- **Data:** the open sleep-diary dataset (Baigutanova et al. 2025, CC BY), 49 people, about 4 weeks each. Outcomes: sleep duration (h), sleep efficiency (%), time to fall asleep (min). People with at least 21 logged days; days used in date order.
- **Placebo arm:** for each person and outcome, 200 random schedules (daily randomization) with no effect added. The engine is run with the app's smallest worthwhile change for that outcome and threshold 0.95, verdict read on the last day.
  - **Bar 1a:** overall false-call rate ("works" or "backfires" when nothing was added) at most 5%.
- **Injection arm:** same, with an effect of 1.5 times the smallest worthwhile change added on change days.
  - **Bar 1b:** real-data power within 10 percentage points of the power predicted by the simulator for the same length, spread and autocorrelation. If it misses, the in-app power preview is misleading and must say so.
  - **Bar 1c:** 95% intervals cover the injected effect at least 90% of the time.

## Study 2: Does pooling across a crew help each person's answer?

A crew of 4 or 6 can run the same self-experiment. Pooling (partial shrinkage of each person's estimate toward the crew average, by an amount estimated from the data) is established in medicine as aggregated N-of-1 trials; applying it to a spaceflight crew is the new part.

- **Simulation:** crews of 4 and 6; each person's true effect drawn from a normal distribution with mean 1.0 times the smallest worthwhile change and between-person spread 0, 0.5 or 1.0 times it; noise and autocorrelation of time to fall asleep from the real dataset; daily randomization, 56 days; 2,000 crews per setting.
- **Methods compared:** each person alone (the app's engine) versus normal-normal empirical Bayes shrinkage of the per-person estimates (DerSimonian-Laird estimate of between-person spread).
  - **Bar 2a:** pooled root-mean-square error of each person's effect is lower than individual-only when between-person spread is 0 or 0.5 times the smallest worthwhile change.
  - **Bar 2b:** pooled 95% intervals cover each person's true effect at least 90% of the time in every setting.
  - **Bar 2c (reported, no bar):** RMSE and coverage when between-person spread is large (1.0), where pooling could mislead.

## Study 3: Does the circadian model reproduce a published Mars-sol result?

Published finding (Czeisler group, 2007, PNAS and PLoS ONE): moderately bright light (about 450 lux) in the second half of the scheduled wake period entrains people to the 24.65 h Mars sol; light timing relative to the clock decides advance versus delay.

- **Simulation:** intrinsic periods 23.9 to 24.5 h; Mars sol; 16.4 h wake; 450 lux during either the first half or the second half of wake, 10 lux for the rest of wake, dark during sleep; 40 sols from an Earth-entrained start. Locked = drift under 3 minutes per sol over the last 10 sols.
  - **Bar 3a:** second-half light locks every intrinsic period from 23.9 to 24.3 h.
  - **Bar 3b:** first-half light fails to lock at least the shortest intrinsic period (23.9 h).
  - If either bar fails, the body-clock station must say the model disagrees with the published human data.

## Study 2b (added 2026-11-01 after Study 2 missed bar 2b; written before running 2b)

Study 2's pooled intervals covered only 83% to 86% when people truly differ (bar: 90%), because the between-person spread was estimated from 4 to 6 people and then treated as known. Study 2b replaces the plug-in estimate with full integration over the between-person spread: a grid from 0 to 3 times the smallest worthwhile change, a half-normal prior with scale equal to the smallest worthwhile change, the crew mean integrated out under a flat prior, and each person's interval taken from the resulting normal mixture.

- Same simulation settings, seeds and bars as Study 2 (2a: lower RMSE than individual-only at spread 0 and 0.5; 2b: coverage at least 90% in every setting).
- Study 2's failure stays reported as a failure. If 2b also fails, the app will not offer pooled intervals.
