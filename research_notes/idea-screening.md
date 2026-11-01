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

## Open decisions for the owner

- Approve or reject Baseline Budget as the direction.
- Team: any teammates for design/story/pitch? (Still unanswered.)
- Paste the official 2026 challenge text and dataset list.
- Whether to apply for any credentialed data now (long lead time).
