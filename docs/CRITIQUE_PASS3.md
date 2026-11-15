# Part-by-part critique, third pass (2026-11-15)

Each part of Sol Lab, what was wrong, what changed, and what is still open. Measured on a GTX 1060 at 1440 x 900 in a visible browser.

| Part | Problem found | Fixed | Still open |
|---|---|---|---|
| Speed | Overview 48 fps with 50 to 67 ms frames 4+ times a second; glides stuttered | Cause: the radiation screen re-uploaded a 1280 x 600 texture about 8 times a second. Now at most twice a second; air, galley and vitals screens capped the same way. Overview 60 fps, glides 59 to 60 fps | One 100 ms hitch near the start of a live experiment |
| Body | Hand-built capsules; when a part was picked the rest stayed at 40% so it was unclear which part was meant | Real BodyParts3D anatomy (CC BY 4.0); the picked part glows at full strength, the rest drops to 8%, the figure turns to face you, and a label on the figure names the part and today's level | The model stands upright (no weightless posture) |
| Guided tour | 10 steps; skipped the galley, body clock, instruments and the signature demo; the body step showed only the brain; no on-screen highlights | 13 steps covering every station; the body step walks through all eight body systems with the label on each; every step highlights its panel | |
| Instruments | 3D parts flew apart as soon as a device opened; plain translucent boxes | Opens assembled; parts separate only on Explode or the slider. Devices with a NASA photo open on the real photo of the hardware; 3D is one click away, rendered solid with metal and plastic materials; X-ray shows the inside | No public 3D models exist of DOSTEL, CDRA, T2 or ARED, so the 3D views are diagrams, not replicas. Four devices have no NASA photo |
| Signature feature | Self-experiments were buried in a tab | Featured card on the overview; one-click live crew experiment (about 20 s) with a disclosed large effect | |
| NASA data | Radiation, air, bloodwork only | Added NASA DONKI space weather (solar storms did not raise ISS dose), NASA photos, NASA 3D models, NTRS instrument specs | RadLab service was down, so no new radiation series |
| Top bar | Overflowed on narrower screens | Tighter spacing below 1180 px and 980 px | No phone layout |
| Submission | | Form text, deck, logo, team name ready | Repo must be public and Pages on before submitting |
