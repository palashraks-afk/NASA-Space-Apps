# 100-point critique, judge's view

Written 2026-11-04 while fixing. Each point is something a judge could notice in the first five minutes. **Fixed** means changed and checked in this pass; **Open** means still true. Numbers for performance come from `lab/scripts/perf.mjs` on a GTX 1060 and from the app's own per-frame CPU meter.

## Lag (1 to 15)
1. **Fixed.** 907 separate meshes drawn every frame; the module's static parts are now merged per material (625 into 68). Scene: 280 meshes.
2. **Fixed.** Ambient occlusion re-drew the whole scene every frame; now opt-in (`?q=ultra`).
3. **Fixed.** Shadow maps re-rendered every frame for 274 casters and two lights; now drawn once (lights and fittings never move).
4. **Fixed.** About 80 labels, each with its own 1024 by 256 texture and draw call; packed into two atlas pages (about 80 MB of textures freed).
5. **Fixed.** The vitals screen re-uploaded a 1536 px canvas 12 times a second even when off screen; the pulse is now a small scrolling texture and the screen redraws only when the day or crew changes.
6. **Fixed.** Duct ribs were 275,000 triangles; now about 80,000.
7. **Fixed.** The side panel rebuilt its HTML four times a second whether or not anything changed; it now rebuilds only on change (live views excepted).
8. **Fixed.** Camera glides crawled on slow frames (GSAP lag smoothing).
9. **Fixed.** A NaN camera after loading in a hidden window froze every later move.
10. **Fixed.** High-density laptop screens with weak GPUs now drop to one pixel per CSS pixel once, in the first seconds.
11. **Fixed.** The loading screen could stay on top in a throttled tab; it is now removed after its fade.
12. Result: overview CPU per frame about 41 ms before, about 9 ms after; vitals about 2 to 5 ms.
13. **Open.** The overview still issues about 500 draw calls (stations, transparent props); merging station props would need per-part animation flags.
14. **Open.** Bloom runs every frame at full resolution; could run at half.
15. **Open.** The JavaScript bundle is 1.2 MB (three.js); could be split so the first screen loads sooner.

## Clutter (16 to 30)
16. **Fixed.** Thirteen tabs across the top; now five sections (Overview, Crew, Station, Experiments, Instruments) with a page switcher inside each.
17. **Fixed.** Seven check-in cards fully open at once; now one row each (name, value, level) that opens on click.
18. **Fixed.** The routine list pushed the measurements down; folded into one line ("3 due, 0 of 7 logged").
19. **Fixed.** Duplicate level legends under titles removed.
20. **Fixed.** Ten constantly pulsing rings on the 3D hotspots; now small still dots that brighten on hover.
21. **Fixed.** Intro and source paragraphs on every panel; moved to a closed "About this view".
22. **Fixed.** Long card notes ("Within your usual range (66 to 97 bpm, from 14 pre-flight days)") cut to "Usual 66 to 97 bpm".
23. **Fixed.** Patches and hazards folded on the overview.
24. **Fixed.** Key hint under the tour card.
25. **Fixed.** Three speeds (1 hour/s for the routine, 1 day/s, 10 days/s) instead of five.
26. **Open.** The experiment setup shows eight controls at once; could be a two-question start with "more options".
27. **Open.** Body detail repeats each reading's full sentence; could show value and level only.
28. **Open.** Station screens in 3D duplicate numbers already in the panel (by design, but busy).
29. **Open.** Nine stations' edge-arrow labels ("Experiments · board") are long.
30. **Open.** The crew report is a long page; a one-screen summary first would help.

## Graphics (31 to 45)
31. **Fixed.** Body figure looked like flat plastic blobs; now a hologram shader (glowing edges, see-through centres, slow scanlines) that keeps the status colours.
32. **Fixed.** Hand-written tape labels were hard to read; printed labels at double resolution.
33. **Fixed.** Station screens: fewer, larger numbers at 1.5 to 2 times resolution.
34. **Fixed.** Maximum anisotropic filtering on every texture.
35. **Fixed.** Teammate's surface detail, steadier glow and LED strips (merged earlier).
36. **Open.** Body and station props are still built from simple shapes; the teammate's models drop in via `docs/MODELS.md`.
37. **Open.** No crew avatars; the module feels empty.
38. **Open.** Lighting is flat white overall; a cooler night mode or warmer accent light would add depth.
39. **Open.** No ambient occlusion by default (traded for speed); a baked AO texture would give contact shadows for free.
40. **Open.** Earth through the window is a simple sphere; clouds and atmosphere glow would help.
41. **Open.** The radiation globe's halo and base look unfinished.
42. **Open.** Galley food items are boxes and cylinders.
43. **Open.** No transition effect when switching sections beyond the camera glide.
44. **Open.** The blueprint viewer's parts are primitive shapes.
45. **Open.** No dark-room or high-contrast theme for projectors.

## Making sense (46 to 60)
46. **Fixed.** First screen said nothing about purpose; tagline "Each person against their own normal."
47. **Fixed.** Opened on mission day 0 with empty charts; now day 60.
48. **Fixed.** Pitch and README now say "gather, evaluate, act" in the brief's words.
49. **Fixed.** Sections group pages by who they are about (crew vs station).
50. **Open.** "Vitals" and "Check-in" overlap (both show heart rate, temperature, sleep); a judge may ask why two.
51. **Open.** The composite mission (people and years combined) is explained only in About.
52. **Open.** Experiments are reached from the top bar, not from the finding they would fix ("sleep drifting: test a fix" link).
53. **Open.** The body clock's beads need explanation to read.
54. **Open.** "Window" is more scenery than health; could fold into Maps.
55. **Open.** Bloodwork is from a 3-day flight inside a 180-day mission; labelled, but odd.
56. **Open.** Crew A to D have no names or roles.
57. **Open.** Mission patches do not say where to go to earn them.
58. **Open.** Levels use the word "surgeon" for any escalation; some are "next medical conference", some "now".
59. **Open.** Units vary (µGy vs mGy) between panels.
60. **Open.** No "what changed since yesterday" summary.

## First-time tutorial (61 to 65)
61. **Fixed.** First visit gets a 4-step quick start that spotlights the real control (crew table, a check-in row, the body list, the sections).
62. **Fixed.** The 10-step tour remains from the overview and the About window.
63. **Fixed.** Tour and quick start hide the key hint and are skippable.
64. **Open.** The quick start does not make the visitor actually log a value.
65. **Fixed.** The 3D view's hint reads "Click a dot to visit a station".

## Criteria (66 to 100)
66. Impact. **Open.** No video showing one problem caught and fixed.
67. Impact. **Fixed.** Earth uses stated.
68. Impact. **Open.** No quantified benefit (for example, how much earlier a personal range flags a change than a population range, from the real diaries).
69. Creativity. **Fixed.** Hologram body and blueprints add distinct visual ideas.
70. Creativity. **Open.** The experiments' payoff is often "not settled", which can feel flat in a demo.
71. Novelty. **Open.** Capped near 7.5 to 8 honestly: personal baselines and N-of-1 trials exist on Earth.
72. Novelty. **Fixed.** Study 4: on 49 real diaries a 14-day personal range flags 7 to 8% of healthy single days, but three days in a row under 1%, which is the app's escalation rule.
73. Fit. **Fixed.** Every line of the brief is mapped in the README.
74. Fit. **Open.** Resources tab of the challenge page not checked.
75. Rigor. **Open.** Escalation points chosen by the team need clinician review.
76. Rigor. **Fixed.** Measured (Study 4, exploratory).
77. Rigor. **Fixed.** Pre-registered studies with failures reported.
78. Data. **Fixed.** Five real public datasets in use.
79. Data. **Open.** Heart rate, blood pressure and blood sugar for unlogged days are simulated.
80. Data. **Open.** More Inspiration4 panels (urine, proteomics) unused.
81. Feasibility. **Open.** No live link until the repo is public and Pages is on.
82. Feasibility. **Fixed.** Runs offline from any folder; CI builds every push.
83. Feasibility. **Fixed.** Device import via FHIR and CSV.
84. Feasibility. **Open.** No mobile or tablet layout.
85. Profile fit. **Fixed.** Clinical cut-offs, reference change values, physiology explainers.
86. Visual appeal. **Open.** Depends on 36 to 45 above.
87. Technical depth. **Fixed.** Bayesian engine, pooling, circadian model, SGP4, FHIR, render optimisation with measurements.
88. Uniqueness. **Fixed.** No public rival combines 3D, real mission data and self-experiments.
89. Accessibility. **Open.** 3D picks have list equivalents, but no screen-reader test was run.
90. Accessibility. **Open.** Smallest panel text is 10.4 px.
91. Accessibility. **Fixed.** Colour plus a word for every level; reduced motion respected.
92. Presentation. **Open.** No slide deck.
93. Presentation. **Open.** No team roles page.
94. Presentation. **Fixed.** Pitch with a 3-minute script that follows the tour.
95. Trust. **Fixed.** Every simulated value labelled.
96. Trust. **Fixed.** "Not a medical device" in About and the report.
97. Robustness. **Fixed.** Zero-size and slow-machine bugs.
98. Robustness. **Fixed.** A failed load leaves the loading screen up with the error and how to retry.
99. Robustness. **Open.** Not tested on Safari or Firefox.
100. Process. **Fixed.** Repeatable judge walk, performance probe and full-tab sweep scripts.

Fixed: 53. Open: 46, most needing the team (video, 3D models, the live link, a clinician) or a further pass.
