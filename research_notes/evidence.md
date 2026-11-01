# Evidence file (2026-11-01)

Every item says what the source shows, what it does NOT show, and whether it was read directly or only seen in a search snippet. Direct = I read the document text. Snippet = search-result summary only.

## 1. Real biological-variation numbers (DIRECT read)

Source: Coskun et al., "Within-subject and between-subject biological variation estimates of 21 hematological parameters in 30 healthy subjects", Clin Chem Lab Med 2018, doi 10.1515/cclm-2017-1155 (EFLM Working Group on Biological Variation / EuBIVAS). Design: 30 healthy adults (17 F, 13 M, mean ages 28 and 25), fasting blood drawn weekly for 10 weeks, Sysmex XN 3000, duplicate analysis. Limits: young, healthy, ground-based, one analyzer, one 10-week window; the paper itself notes erythrocyte CVI may be underestimated because 10 weeks is less than one red-cell lifespan.

Female CVI/CVG (%) and the paper's Table 3 values (RCV %, index of individuality II, NHSP = number of samples needed to estimate the individual set point within 5% / 10% / 20%):

| Analyte | CVI | CVG | RCV | II | NHSP 5/10/20% |
|---|---|---|---|---|---|
| Hemoglobin | 2.74 | 6.57 | 7.76 | 0.47 | 2 / 1 / 1 |
| MCV | 0.72 | 3.96 | 2.06 | 0.18 | 1 / 1 / 1 |
| RDW-SD | 1.65 | 7.62 | 4.84 | 0.75 | 1 / 1 / 1 |
| Leukocytes | 12.82 | 16.53 | 22.4 | 0.48 | 11 / 3 / 1 |
| Lymphocytes | 9.81 | 20.36 | 28.0 | 0.48 | 16 / 4 / 1 |
| Neutrophils | 20.09 | 27.81 | 32.5 | 0.70 | 22 / 6 / 2 |
| Eosinophils | 14.83 | 70.5 | 41.4 | 0.14 | 35 / 9 / 3 |
| Platelets (PLT-I) | 7.22 | 17.42 | 20.6 | 1.00 | 9 / 3 / 1 |

12 of 21 parameters had II below 0.6 (personal baselines clearly more informative than population ranges). NHSP within 5% exceeded 60 samples for basophils.

What this shows: the number of baseline samples needed varies from 1 to over 60 depending on the analyte, and many analytes have a personal normal far narrower than the population range. What it does NOT show: any spaceflight value. In-flight CVI is unknown and could differ.

## 2. Prior art that limits novelty (DIRECT for item 2a; snippet for the rest)

a. NHSP above IS a published "how many baseline samples do you need" calculation (Coskun 2018). A baseline-budget idea is not new in laboratory medicine.
b. Reference change values and index of individuality are established (EFLM Biological Variation Database; over 3,000 estimates; snippet).
c. Personalized reference intervals: parametric empirical Bayes (PMC12582661, snippet); a 2026 arXiv model "NORMA" (snippet); prior-results rules of about 3 to 10 samples (snippet).
d. Sequential multiplicity control for streaming data exists: "sequential family-wise error rate" for online change-point detection in mHealth (arXiv 2607.15423, snippet); sequential Benjamini-Hochberg (PMC7993061, snippet).
e. Wearable personalized-baseline infection detection with at least 10 valid baseline days (PMC13487130, snippet).

Not found in my searches (absence is not proof): the spaceflight-specific combination; multi-analyte false-alarm budgeting with an in-flight point-of-care analyzer's imprecision; a sampling-plan optimizer for a pre-flight draw budget; a physiological (not spacecraft-telemetry) benchmark of the standard rules used by competitor repos.

## 3. Evidence the problem is real

- NASA gap Med03 "we do not know how to apply personalized medicine effectively to reduce health risk for a selected crew", merged into Medical-701 (in-flight medical capability); NASA is building an on-board clinical decision support system (snippet).
- NASA evidence reports: the astronaut cohort is statistically underpowered for some questions; "small population size precludes statistical analysis" (snippet).
- A 2026 review states small astronaut cohorts and high inter-individual variability require model recalibration (snippet).
- Individual variation is large: circulating cell-free mitochondrial DNA rose roughly 2- to 355-fold across 14 astronauts; preflight refraction was the strongest predictor of in-flight eye change; group means hid wide individual swings in body composition (snippets).
- A 2024 civilian-flight paper scored astronaut labs against Earth reference ranges with a "more than 5% outside" rule (snippet). That is current practice in a published study.
- In-flight analyzers: shuttle study found the i-STAT worked similarly in flight except a small sodium difference; ground imprecision 0.34% to 3.97% CV (snippet). An ISS hematology study found a processing delay made an in-flight MCV measurement partly artifactual (snippet).
- Base-rate problem for consumer wearables: the Apple Heart Study reported positive predictive value 0.84 among those notified, notification rate 0.52% (snippet; NEJM). Secondary sources argue the false-positive burden is high in low-prevalence groups; one illustrative worked example gave about 33% PPV for a young healthy cohort (not measured). No peer-reviewed false-positive data found for Oura or Whoop.
- Within-person variance is heterogeneous: one Bayesian study found a largest-to-smallest ratio above 20, so pooling variance across people can misstate an individual's noise (snippet; PMC9170648). This is a modeling risk the project must test, not assume away.

## 4. Data availability

Open and confirmed to exist: LifeSnaps (71 people, 4 months, Zenodo 7229547); PMData (16 people, about 5 months); a 49-adult wearable HRV + sleep-diary set (Figshare 10.6084/m9.figshare.28509740).
Inspiration4 in NASA OSDR: one third-party source maps OSD-569 to the CBC file and OSD-575 to the CMP file, with analytes including glucose, WBC, lymphocytes, platelets, calcium, alkaline phosphatase, creatinine, hemoglobin, hematocrit; another source describes OSD-569 as RNA-seq. Treat as UNRESOLVED until the OSDR study pages are opened. 4 crew; 3 pre-flight, 4 post-flight timepoints; no in-flight draws.
Not usable in 13 days: GLOBEM (credentialed access), restricted NASA medical data, public AGBRESA individual data (not found).

## 5. Evidence on visuals and interactivity (what winners and finalists did)

- 2025 Best Use of Science, SpaceGenes+, was an interactive dashboard over NASA GeneLab data; a team member's own write-up says they prioritized metadata and flexible filtering for bioinformaticians over a minimal interface (first-person account; no demo or code found).
- Among the 45 finalists you pasted, several were explicitly visual or interactive: Cosmoscope (gamified 3D adventure), Titan (VR), the habitat layout creator, the Zumorroda-X storytelling frame.
- A third-party winners database found no quantified link between visuals or interactivity and winning; its claims are the author's interpretation and its tables have inconsistencies (sums to 82 vs a stated 87). So visual appeal is a reasonable bet, not a proven lever.
- Judging guides list Presentation as a criterion and a high-level summary plus demo as judged.
