# Build log (autonomous build started 2026-11-01 on the owner's "GO START")

Every decision taken without the owner present is recorded here with the reason.

## Data and assets

| Item | Source | License | Size | Used for |
|---|---|---|---|---|
| ISS orbital elements (GP JSON, epoch 2026-11-01) | CelesTrak `gp.php?CATNR=25544&FORMAT=json` | public | 0.4 KB | Real ISS orbit via SGP4 (satellite.js) |
| Earth day texture (Blue Marble, land_shallow_topo 2048) | NASA Visible Earth | public domain | 0.24 MB | Window view |
| Earth night lights (Black Marble 2012, 3600x1800) | NASA Visible Earth | public domain | 0.79 MB | Night side of Earth |
| Moon texture 2k | Solar System Scope (derived from NASA LRO data) | CC BY 4.0, credit Solar System Scope | 1.05 MB | Moon destination |
| Mars texture 2k | Solar System Scope (derived from NASA data) | CC BY 4.0, credit Solar System Scope | 0.75 MB | Mars destination |
| Wearable HRV + sleep diaries, 49 adults, about 4 weeks | Baigutanova et al. 2025, Scientific Data; Figshare 10.6084/m9.figshare.28509740 | CC BY 4.0 | 17.3 MB (kept out of git; derived summary committed) | Real day-to-day noise for outcome presets |

Not downloaded: LifeSnaps (single 615 MB archive, over the 500 MB limit agreed before the build), the Figshare raw archive (19.7 GB), GLOBEM (credentialed access). The NASA SVS Moon kit failed with an SSL error, so the CC BY Solar System Scope Moon texture was used instead.

## Decisions

1. **Real noise replaces assumed noise.** `lab/scripts/derive_noise.py` computes within-person SD and lag-1 autocorrelation per person. Medians: sleep duration SD 1.34 h, rho -0.02; sleep efficiency SD 0.035, rho 0.00; time to fall asleep SD 0.30 h, rho 0.02; daily median RMSSD SD 10.3 ms, rho 0.09 (32 people); daily median heart rate SD 6.1 bpm, rho 0.11 (32 people). Earlier simulations assumed rho 0.3, which was pessimistic for these outcomes.
2. **Wearable outcomes are daytime-weighted, not overnight.** The filtered data has few overnight segments, so an overnight measure is not supportable. Steps were dropped because filtered segments undercount them. A few 2018 timestamps (clock errors outside the 2021 study) were dropped.
