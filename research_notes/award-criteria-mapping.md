# NASA Space Apps Global Award criteria — mapping

The 10 Global Awards and what each actually rewards (from spaceappschallenge.org/2025/awards):

| Award | Criterion |
|---|---|
| Best Use of Science | Most valid use of science and/or the scientific method |
| Best Use of Data | Best makes space data accessible or leverages it for a unique application |
| Best Use of Technology | Most innovative use of technology |
| Galactic Impact | Most potential to improve life on Earth or in the universe |
| Best Mission Concept | Most plausible concept and design |
| Most Inspirational | Captures our hearts |
| Best Use of Storytelling | Most creatively communicates the potential of open data through storytelling |
| Global Connection | Best connects people around the world through technology |
| Art & Technology | Most effectively combines technical and creative skills |
| Local Impact | Greatest potential for local impact |

## How the project design should map to these (working notes)

- **Best Use of Science** — risk thresholds must trace to a specific cited NASA HRP/OSDR/Twins Study finding, not an invented number. This is the core differentiator vs. all 3 competitor repos (see competitor-analysis.md), none of which cite sources for their actual numeric thresholds.
- **Best Use of Data** — must actually ingest/visualize real NASA Open Science Data Repository / GeneLab / Twins Study data, not just reference it in prose (Repo 1's gap).
- **Best Use of Technology** — explainable risk flags (reasoning trace: which metric, which deviation, which cited threshold) + genuinely offline-first design for comm-latency/blackout realism — both unclaimed by competitors.
- **Galactic Impact** — needs a credible Earth-side application of the same engine (e.g., remote/isolated population health monitoring) — none of the 3 competitors attempt this.
- **Best Mission Concept** — plausibility means no new hardware dependency; work with health data NASA already collects operationally.
- **Most Inspirational** — human framing matters at least as much as the tech; lean on the real Twins Study story (Scott & Mark Kelly) if citing that dataset, and on astronaut autonomy/dignity monitoring their own health alone.
- **Best Use of Storytelling** — the UI should narrate a "mission health log" / timeline, not present a bare dashboard of numbers.
- **Global Connection** — if the Earth-impact deployment is real, frame it as usable across countries/clinics (low-bandwidth, simple language) rather than US-only.
- **Art & Technology** — UI/visual design pass matters — don't ship a Bootstrap-default-looking dashboard; this is also a design-review item once we build.
- **Local Impact** — tie the Earth-side deployment angle to something concrete and local (San Marino/LA County) rather than "could help anyone, anywhere" hand-waving.

## Important caveat

This table is not a scorecard — chasing every award with surface-level feature-checkboxing produces a scattered, unfocused project, which judges also penalize (relates to "Best Mission Concept" plausibility). Treat it as a filter to catch blind spots, not a spec to maximize line-by-line.
