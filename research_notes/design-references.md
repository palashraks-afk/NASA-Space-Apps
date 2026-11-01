# Design and technical references (2026-11-01)

Secondary sources are opinion; direct reads are marked.

## Avoiding the "generated" look

- Common tells named across several design blogs: Inter as the default face, purple-to-blue gradients, vague headlines, uniform padding and radius on everything, repeated cards, stock illustration. One source argues these are not proof of AI authorship; they are what you get when decisions are not made. Remedy they agree on: make explicit choices (references, palette, type, layout constraints, real content) and list patterns to avoid.
- Sources: shuffle.dev, DEV Community (GDG), Kyle Chayka, 925studios, InterfaceKit (all secondary).

## World-as-interface

- Bruno Simon's portfolio uses the 3D world as the navigation, with game conventions (floor tiles hinting at more, walls as boundaries), simplified physics shapes (Cannon.js, later Rapier), isometric camera. Critics note it favors showmanship over usability, which is why this project keeps the interface small and puts a plain 2D summary beside the world.

## Crew interface principles (NASA)

- NASA commercial LEO crew-interface workshop deck: design to user needs, iterate design-test-redesign, keep crew cognitive resources for problem solving, consistent orientation. Used as a checklist for restraint.

## Physiology and models

- Intrinsic human circadian period averages 24.18 h (Czeisler et al. 1999, SEM 0.04 h; the SD of about 0.14 h is my inference from the reported percent coefficient of variation, to verify in the paper).
- Pacemaker equations read directly from the open-source HCRSimPY implementation (Arcascope), which cites Forger, Jewett, Kronauer 1999 and takes parameters from Serkh and Forger 2014: tau_x 24.2, mu 0.23, G 33.75, alpha0 0.05, delta 0.0075, p 0.5, I0 9500, k 0.55.
- Thompson-sampling adaptive trials in mobile health (HeartSteps, IntelligentPooling) establish prior art for adaptive allocation.
- N-of-1 platforms: StudyU (open source, Flutter app plus web designer), StudyMe.
- ISS propagation: satellite.js (SGP4/SDP4), CelesTrak GP data in JSON.
