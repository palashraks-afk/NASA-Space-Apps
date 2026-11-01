# Sol Lab

A 3D station-module lab where a crew member designs and runs a small, fair experiment on themselves (for example, "does cutting caffeine after noon help me fall asleep faster?"), watches the evidence build, and gets an honest verdict, including "not settled".

## Run it

```bash
npm install
npm run dev          # http://localhost:5199
npm test             # engine, mission, orbit tests
npm run build        # static build in dist/, works offline
```

Add `?q=low` to the address for a lighter renderer (no ambient occlusion, pixel ratio 1). The app also drops quality by itself if the frame rate stays low.

## Stations

- **Window.** Choose the destination. For the space station, Earth is placed using the real ISS orbit (CelesTrak elements propagated with SGP4) and the real Sun direction, so day, night, city lights and the 15 to 16 sunrises a day are computed, not drawn.
- **Procedure board.** Pick the change, what it is compared with, the measure, the smallest change worth acting on and how fast it acts. Randomizing sends schedule tokens drifting across the cabin in zero gravity (cannon-es physics) until each sticks to its day. Lock the plan and save it as a pre-registration file.
- **Evidence chamber.** Each mote is one draw from the posterior over the effect (left to right), the day-to-day spread (up) and weekly drift (depth). Blue motes say "works", grey "too small to matter", red "backfires". The cloud tightens as days are logged.
- **Body clock.** Four crew members run the Forger-Jewett-Kronauer pacemaker live under the cabin light schedule of the chosen destination. A bead riding with the hand is locked to the day; a slipping bead is drifting.

## What is real, what is simulated

| Part | Status |
|---|---|
| Day-to-day spread and autocorrelation of each outcome | Real: medians across people in an open wearable and sleep-diary dataset (49 adults; Baigutanova et al. 2025, CC BY). See `scripts/derive_noise.py` and `public/data/real_noise.json`. |
| The daily values during a mission | Simulated from that spread. No astronaut data is used. |
| The hidden truth in game mode | A game scenario drawn at random. Not a claim about any real intervention. |
| Statistics | Bayesian linear model with AR(1) noise integrated over, linear drift, and a pre-registered verdict rule. Coverage of 95% intervals measured at about 95.7% in simulation (`scripts/checks.mjs`). |
| How fast a change acts | The user's judgment. The design follows it (daily randomization for fast changes, weekly blocks with settling days for slow ones; see `analysis/lab_design_search_response_*.json`). |
| ISS orbit, sunrises | Real orbital elements and real eclipse geometry. |
| Body clock | A published mathematical model with population parameters; crew intrinsic periods are drawn around the measured 24.18 h average with an approximate spread. |

Not a medical device. Not clinically validated.

## Testing tools (development only)

- `window.__solAdvance(seconds)` steps the whole simulation without animation frames (browsers pause those in hidden tabs).
- `?auto=<scenario>` drives the app into a state: `overview`, `step2`, `numbers2`, `rand`, `locked`, `run`, `result`, `resultnum`, `mars`, `clock`.
- `scripts/shoot.sh <scenario...>` takes full-resolution screenshots with headless Edge and a throwaway profile into `.shots/`.

## Credits

See `public/CREDITS.md`. Built with Claude Code (AI) assistance, disclosed as the Space Apps rules require.
