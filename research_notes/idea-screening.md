# Idea screening (2026-11-01)

Scores are my judgment (/10), unweighted mean, not measurements. Nothing here is a guarantee.

## Criteria

1. Impact. 2. Creativity. 3. Novelty (not done before; building on prior work is fine). 4. Challenge fit (match to attributes of past winners). 5. Scientific rigor. 6. Depth of real NASA/open data use. 7. Feasibility in ~13 days. 8. Profile fit (public clinical data, NHANES, pre-registration, external validation, honest nulls).

## Candidates

| Candidate | Imp | Cre | Nov | Fit | Rig | Data | Feas | Prof | Mean |
|---|---|---|---|---|---|---|---|---|---|
| **I. Baseline Budget (calibration study + abstaining monitor + benchmark of standard rules)** | 8 | 8 | 7 | 8 | 9 | 7 | 6 | 9 | **7.75** |
| B. Earth-range audit alone | 6 | 5 | 7 | 6 | 9 | 6 | 8 | 10 | 7.1 |
| A. Normal for Orbit verdicts alone | 6 | 6 | 7 | 6 | 8 | 5 | 7 | 8 | 6.6 |
| F. Spaceflight genes x disease GWAS (wrong challenge) | 6 | 6 | 5 | 3 | 8 | 8 | 6 | 10 | 6.5 |
| E. Radiation-to-cancer-risk tracker | 6 | 4 | 3 | 5 | 6 | 7 | 6 | 8 | 5.6 |
| J. Lab-panel "phenotypic age" of astronauts (NHANES-calibrated) | 6 | 7 | 6 | 5 | 5 | 4 | 4 | 8 | 5.6 |
| D. ECHO (voice, keystroke, CO2) | 5 | 7 | 6 | 5 | 3 | 2 | 3 | 2 | 4.1 |
| H. Bone and countermeasure tracker | 4 | 3 | 3 | 4 | 5 | 3 | 8 | 3 | 4.1 |
| G. Simulated-vitals AI dashboard (the field) | 3 | 2 | 1 | 3 | 2 | 2 | 10 | 3 | 3.3 |
| K. Bed-rest analog monitor | not scored | | | | | | | | blocked: no public individual-level data found |

## Why Baseline Budget leads, and where it is weak

- NASA's own gap: HRR Med03 ("how to apply personalized medicine to reduce risk for a selected crew"), merged into Medical-701 (in-flight medical capability); NASA is building an on-board clinical decision support system.
- Core idea: for a given baseline length and number of monitored signals, predict false-alarm rate, test the prediction on real people, ship a monitor that abstains ("can't tell") when the baseline is too thin, and benchmark the standard approach used by competitor repos (14-day rolling baseline, fixed thresholds) on the same data.
- Textbook teasers (Gaussian, independent assumption, not findings): with 3 baseline draws a new value must differ by about 5x the person's normal variation to be believable; 7 draws about 2.6x; 10 draws about 2.4x. Monitoring 40 independent analytes at 5% each gives about an 87% chance of at least one false alarm per draw (20 analytes: about 64%).
- Novelty is only 7: prior art exists for personal reference intervals (empirical Bayes; a 2026 arXiv model), how many prior results a personal interval needs (about 3 to 10 in lab medicine), reference change values and index of individuality, and baseline-window effects in wearable infection detection. Not found in searches (absence is not proof): cross-dataset calibration of false alarms vs baseline length, an explicit abstain verdict, a spaceflight multiplicity budget, a physiological (not spacecraft-telemetry) monitoring benchmark.
- Honest ceiling is about 8. Novelty rises only if the pre-registered study yields a surprising result, which cannot be promised.

## Data: verified vs not

Verified to exist (open): LifeSnaps (71 people, 4 months, Zenodo); PMData (16 people, ~5 months); a 49-adult wearable HRV + sleep-diary set on Figshare (DOI 10.6084/m9.figshare.28509740); Inspiration4 blood data in NASA OSDR (4 crew, 3 pre-flight and 4 post-flight timepoints, NO in-flight draws).

Needs verification before building: which OSDR accession holds which Inspiration4 measurements (sources conflict on OSD-569: CBC vs RNA-seq); official 2026 challenge dataset list (released Oct 28; the page cannot be fetched from here); per-analyte biological variation values from the EFLM database (biologicalvariation.eu); published in-flight analyzer imprecision.

Not usable in 13 days: GLOBEM (credentialed PhysioNet access); NASA restricted medical data; AGBRESA bed-rest data (no public individual-level data found); actual Mars-500 RR data (not confirmed public; a small 5-person analog HRV file exists).

## Update 2026-11-01 (evening): 10 criteria, evidence, and angles

Two criteria added by the owner: **9. Interactive and visual appeal**, **10. Technical depth (data, ML, computation)**. Evidence is in `evidence.md`.

### What the new evidence changed

- **Novelty down to 6.5.** The "baseline budget" already exists in lab medicine as NHSP (number of samples needed to estimate an individual's set point; Coskun 2018: 1 sample for MCV, 11 for leukocytes, 35 for eosinophils, over 60 for basophils, all within 5%). Reference change values, personalized intervals and sequential multiplicity control are also published. What remains unclaimed (as far as searches show) is the spaceflight combination, below.
- **Data depth up to 7.5.** Real biological-variation tables for 21 CBC parameters are in hand and read directly.
- **A modeling risk surfaced:** within-person variance can differ more than 20-fold between people, so a model that pools variance can mislead. The project must test this instead of assuming it.

### Angles added to the idea ("Mission Lab", v2 of Baseline Budget)

1. **Pre-flight sampling-plan optimizer.** Given a draw budget, an in-flight point-of-care analyzer's imprecision, and a panel, choose which analytes to track and how many baseline draws each needs, to minimize missed changes and false alarms. This extends NHSP from one analyte to a mission-design problem (an optimization, not a table lookup).
2. **False-alarm budget with multiplicity.** Expected false alarms per draw for a k-analyte panel as a function of baseline length, calibrated by Monte Carlo and checked against real people.
3. **Non-stationary baseline.** Spaceflight adds an adaptation period (fluid shift, post-flight recovery). The monitor abstains during the transient and reports expected-shift vs unexplained-shift. Only pre/post data exists, so this is modeled, labeled as modeled.
4. **Pre-registered calibration on real people** (LifeSnaps, Figshare HRV, PMData; Inspiration4 labs once the OSDR files are confirmed): subsample n=3, 5, 7, 10 baseline days, compare predicted vs observed false-alarm rate, test whether shrinkage (partial pooling) helps or hurts given the 20-fold variance heterogeneity.
5. **Benchmark of the field's standard rules** (14-day rolling baseline, fixed thresholds) on the same data.
6. **Earth twin:** the same engine on published high-altitude reference intervals.

### Interactive and visual plan (data-driven, not decoration)

- **Corridor view:** a person's own normal band vs the textbook range for the same analyte, shrinking live as the baseline-length slider moves. Published numbers: MCV personal change limit 2.06% vs population spread of about 8% either side; hemoglobin 7.76% vs about 13% either side (illustrative derivation from CVG).
- **Alarm landscape:** a 3D response surface of false-alarm probability against baseline length and panel size, from precomputed Monte Carlo. A genuine use of 3D: it shows two interacting variables.
- **Virtual crew:** hundreds of simulated astronauts run in the browser; press launch and watch false alarms appear, then change the baseline and rerun.
- **Real-data replay:** scrub through one real person's days with verdict ribbons (normal / expected shift / unexplained / can't tell).

### Computation and ML plan

Monte Carlo (about 10^6 simulated person-draws), empirical-Bayes and hierarchical shrinkage with a pre-registered test of whether it helps, a learned model for per-person variance from few observations compared against naive and pooled estimators, multi-analyte allocation optimization, and a cross-dataset calibration study. Pre-register success bars before running; report nulls.

### Scoring ledger: now vs conditional (10 criteria, my judgment)

| Criterion | Today (evidence-backed) | If conditions met |
|---|---|---|
| Impact | 7.5 | 8 |
| Creativity | 8 | 8 |
| Novelty | 6.5 | 7 |
| Challenge fit | 8 | 8 |
| Rigor | 9 | 9 |
| Data depth | 7.5 | 8 |
| Feasibility | 6 | 7 |
| Profile fit | 9 | 9 |
| Interactive / visual | 7 | 8 |
| Technical depth | 7 | 8 |
| **Mean** | **7.55** | **8.0** |

Interactive/visual and technical-depth "today" scores are plans, not built work, so they are held at 7 until something runs. Conditions for 8.0: (a) a teammate for design/story so feasibility reaches 7; (b) the OSDR Inspiration4 CBC/CMP files confirmed and loaded so data depth reaches 8; (c) the sampling-plan optimizer shown to be new in a recorded prior-art check, or a surprising calibration result, so novelty reaches 7; (d) the visuals and ML actually built and verified. None of these is guaranteed.

## Open decisions for the owner

- Approve or reject Baseline Budget as the direction.
- Team: any teammates for design/story/pitch? (Still unanswered.)
- Paste the official 2026 challenge text and dataset list.
- Whether to apply for any credentialed data now (long lead time).
