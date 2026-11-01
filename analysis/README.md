# Detection simulation: Earth ranges vs personal baselines

Run: `python analysis/simulate_detection.py` (about 22 s; numpy, scipy, matplotlib). Writes `results.json`, `detection_vs_baseline.png`, `false_alarm_vs_variance_error.png`. Seeded, 200,000 virtual people per cell.

## Inputs (all published, none fitted here)

- Biological variation for 21 CBC parameters: Coskun et al., Clin Chem Lab Med 2018, doi 10.1515/cclm-2017-1155 (female rows; 30 healthy adults, weekly x10).
- Real in-flight mean shifts: Kunz et al., BMC Hematology 2017, PMC5590186. 31 ISS crew, CBC before, during and after flight, ambient storage with a 48 h stability check. Shifts used: erythrocytes +9.1% (early) and +6.8% (late), hemoglobin +6.4% (early) and -4.3% (landing day), MCH -1.3% (late). Hematocrit and MCV excluded because the paper shows they drift with storage delay.

## What the simulation compares

Four ways to flag a new in-flight value as abnormal: (1) an Earth reference range; (2) the person's own baseline and own spread; (3) own baseline with the published spread; (4) own baseline with own spread shrunk toward the published spread (NU = 4). Everything is done in log space so the false-alarm math is exact (panel results match theory: 65.9% for 21 independent analytes).

## Results (under the assumptions below)

Chance a real mean shift is flagged, 3 baseline draws, ground-level variability:

| Real shift | Earth range | own spread | published spread | shrunk |
|---|---|---|---|---|
| Erythrocytes, early flight, +9.1% | 21% | 33% | 75% | 59% |
| Hemoglobin, early flight, +6.4% | 14% | 20% | 48% | 32% |
| Hemoglobin, landing day, -4.3% | 9% | 13% | 27% | 16% |
| MCH, late flight, -1.3% | 6% | 10% | 17% | 9% |

1. A range-based flag misses most of the real shifts that a personal baseline can see. Reading the earlier numbers honestly: the personal rule does not catch everything either (hemoglobin on landing day is flagged only 27% even at best).
2. Borrowing the noise level from the literature roughly doubles to triples power at 3 draws, but it is fragile. If true in-flight variability is 1.5x the ground value, its false-alarm rate rises from 5% to 19% per analyte per draw; at 2x it rises to 33%. The own-spread rule stays at 5% but loses most of its power (erythrocyte shift at 2x variance: 13% at 3 draws). The shrunk rule sits between (8% and 13% false alarms at 1.5x and 2x).
3. The shrunk rule is conservative when its prior is right (2% to 4% false alarms, not the nominal 5%), so it is not perfectly calibrated.
4. Panel size is the hard limit. Watching 21 analytes at 5% each gives a 66% chance of at least one false alarm per draw. Capping that at 5% per draw cuts the chance of catching the early erythrocyte shift from 80% (one analyte) to 40% (21 analytes); hemoglobin early flight from 52% to 15%. Choosing which few analytes to watch matters more than adding more.
5. Heterogeneity between people (within-person spread differing about 7-fold between the 2.5th and 97.5th percentile of people) barely hurts the literature rule on false alarms (6%) in this setup, but the 20-fold variation reported in one study was not simulated.

## Limits (read before quoting any number)

- Mean shifts applied identically to everyone; real people vary, so individual-level power differs.
- Female variation parameters used throughout; Earth ranges for men differ.
- Analytes treated as independent. Erythrocytes, hemoglobin and hematocrit are strongly correlated, so real panel false alarms are lower than the independent figure.
- In-flight within-person variability is unknown. That is the main unknown; results 2 and the scenarios exist to show how much it matters.
- Ground-based, young, healthy volunteers; one analyzer; weekly sampling.
- The "Earth range" comparator is automated range-flagging, as in a 2024 civilian-flight paper and in competitor repos. NASA flight surgeons already weigh pre-flight values, so this is not a claim about NASA clinical practice.
- This is a simulation parameterized by published numbers. It is not a measurement on astronauts and not a validated clinical result.
