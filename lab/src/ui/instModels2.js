import * as THREE from "three";
import { MODEL_PARTS, instMat as mat, rbox, cyl, cylX, cylZ, tube, torus, drum, label, screen, spring, connector, grp, at, mesh, cap, P } from "./instModels.js";

// Vitals and exercise hardware (see instModels.js for the toolkit and the other devices).
Object.assign(MODEL_PARTS, {
  bp: [
    P("Upper arm", "30 cm around: the size this cuff fits", [-0.16, 0, 0], [0, 0, 0], () => at(cap(0.0477, 0.22, mat("skin")), 0, 0, 0, 0, 0, Math.PI / 2), { exact: true, ghost: true }),
    P("Cuff", "Nylon cuff with hook-and-loop closure; 12 x 24 cm bladder inside", [-0.16, 0, 0], [-1, 0.6, 0], () => grp(
      at(mesh(new THREE.CylinderGeometry(0.058, 0.056, 0.14, 64, 1, true), mat("fabricBlue")), 0, 0, 0, 0, 0, Math.PI / 2),
      at(rbox(0.13, 0.004, 0.05, 0.002, "fabricBlack"), 0, 0.058, 0),
      at(label(0.05, 0.012, "ARTERY", { bg: "#2c4f9a", fg: "#e9ecef" }), -0.02, 0, 0.059))),
    P("Bladder", "12 x 24 cm air bladder that squeezes the artery", [-0.16, 0, 0], [-1.3, -0.4, 0.3], () => at(mesh(new THREE.CylinderGeometry(0.0525, 0.0525, 0.12, 64, 1, true), mat("white")), 0, 0, 0, 0, 0, Math.PI / 2), { exact: true }),
    P("Air hose", "Carries air and the pressure pulses to the monitor", [0, 0, 0], [0, -1, 0.4], () => tube([[-0.13, -0.05, 0.04], [-0.07, -0.1, 0.07], [0.02, -0.08, 0.06], [0.06, -0.03, 0.03]], 0.0035, "grey")),
    P("Monitor", "Pump, release valve, pressure sensor and display in one unit", [0.13, 0, 0], [1, 0.3, 0.6], () => grp(
      rbox(0.13, 0.1, 0.045, 0.014, "white"),
      at(screen(0.09, 0.05, [["SYS", 0.14, "#8fa3b8", 0.24], ["118", 0.42, "#e9f4ff", 0.62, "right"], ["DIA 76   HR 64", 0.16, "#9fe8ff", 0.9]]), 0, 0.012, 0.0226),
      at(rbox(0.03, 0.012, 0.004, 0.004, "blueAnod"), -0.025, -0.035, 0.0225), at(rbox(0.03, 0.012, 0.004, 0.004, "grey"), 0.025, -0.035, 0.0225),
      at(connector(0.006, "grey"), -0.066, -0.02, 0, 0, -Math.PI / 2, 0))),
  ],
  oximeter: [
    P("Fingertip", "Pulsing arterial blood changes how much light gets through", [-0.012, 0, 0], [-1, 0, 0], () => at(cap(0.0085, 0.045, mat("skin")), 0, 0, 0, 0, 0, Math.PI / 2), { ghost: true }),
    P("Upper shell and display", "Rounded top shell with an OLED readout", [0, 0.017, 0], [0, 1, 0], () => grp(
      rbox(0.058, 0.018, 0.034, 0.008, "blueAnod"),
      at(screen(0.026, 0.016, [["98", 0.6, "#45ef74", 0.62], ["%", 0.3, "#45ef74", 0.62, "right"], ["HR 72", 0.3, "#f2c23a", 0.95]]), 0.006, 0.0092, 0, -Math.PI / 2, 0, 0),
      at(rbox(0.008, 0.002, 0.008, 0.002, "white"), -0.018, 0.0092, 0))),
    P("Red and infrared LEDs", "About 660 nm and 940 nm, flashed in turn", [-0.004, 0.008, 0], [0.2, 1.4, 0.4], () => grp(at(rbox(0.004, 0.002, 0.004, 0.0008, "led"), 0.003, 0, 0), at(rbox(0.004, 0.002, 0.004, 0.0008, "ledIr"), -0.003, 0, 0))),
    P("Photodiode", "Measures the light that passes through the finger", [-0.004, -0.008, 0], [0.2, -1.4, 0.4], () => rbox(0.005, 0.0015, 0.005, 0.0006, "silicon")),
    P("Silicone finger pads", "Soft pads that seal out room light", [-0.006, 0, 0], [0, 0, 1], () => grp(at(rbox(0.04, 0.003, 0.022, 0.0015, "black"), 0, 0.0095, 0), at(rbox(0.04, 0.003, 0.022, 0.0015, "black"), 0, -0.0095, 0))),
    P("Lower shell", "Holds the photodiode and two AAA batteries", [0, -0.017, 0], [0, -1, 0], () => grp(rbox(0.058, 0.018, 0.034, 0.008, "white"), at(rbox(0.04, 0.001, 0.02, 0.001, "grey"), 0.004, -0.0092, 0))),
    P("Hinge spring", "Closes the clip with gentle pressure", [0.028, 0, 0], [1, 0, 0], () => at(spring(0.004, 0.022, 6, 0.0008), 0, 0, 0, Math.PI / 2, 0, 0)),
  ],
  glucometer: [
    P("Meter", "Converts the strip's current to mg/dL; stores readings", [0.02, 0, 0], [1, 0.2, 0.2], () => grp(
      rbox(0.055, 0.09, 0.018, 0.012, "white"),
      at(screen(0.04, 0.03, [["96", 0.62, "#e9f4ff", 0.66, "center"], ["mg/dL  fasting", 0.18, "#9fe8ff", 0.92, "center"]]), 0, 0.016, 0.0092),
      at(cylZ(0.009, 0.004, "blueAnod"), 0, -0.022, 0.009), at(rbox(0.01, 0.006, 0.003, 0.002, "grey"), -0.016, -0.03, 0.009), at(rbox(0.01, 0.006, 0.003, 0.002, "grey"), 0.016, -0.03, 0.009))),
    P("Strip port", "Contacts that read the strip's electrodes", [0.02, -0.046, 0], [0, -1, -0.6], () => rbox(0.014, 0.006, 0.01, 0.002, "black")),
    P("Test strip", "Wicks a drop of blood to the reaction chamber", [0.02, -0.066, 0], [0.2, -1.6, 0.3], () => grp(rbox(0.006, 0.034, 0.0006, 0.0002, "white"), at(rbox(0.0045, 0.008, 0.0007, 0.0002, "gold"), 0, 0.012, 0), at(rbox(0.003, 0.003, 0.0008, 0.0002, "yellow"), 0, -0.015, 0))),
    P("Enzyme and mediator", "Glucose oxidase or dehydrogenase frees electrons", [0.02, -0.081, 0.001], [0.6, -1.6, 1], () => rbox(0.004, 0.003, 0.0008, 0.0002, "yellow")),
    P("Lancing device", "Spring-loaded pen that sets the prick depth", [-0.05, -0.01, 0], [-1, 0, 0], () => grp(cap(0.009, 0.075, "blueAnod"), at(cyl(0.0095, 0.012, "white", 32), 0, 0.045, 0), at(cyl(0.004, 0.012, "grey", 16), 0, -0.052, 0))),
    P("Lancet", "Fine sterile needle, used once", [-0.05, -0.07, 0], [-0.6, -1.4, 0.3], () => grp(cyl(0.003, 0.016, "white", 16), at(cyl(0.0004, 0.006, "steel", 8), 0, -0.011, 0))),
  ],
  treadmill: [
    P("Slat belt", "Olive-green rubber slats on rollers (Woodway design), as in the NASA photo", [0, 0.06, 0], [0, 0.9, 0.5], () => grp(...Array.from({ length: 34 }, (_, i) => at(rbox(0.046, 0.016, 0.5, 0.005, "rubberGreen"), -0.84 + i * 0.051, 0, 0)))),
    P("Side panels", "Brushed stainless covers either side of the belt", [0, 0.06, 0], [0, 0, 1], () => grp(...[-0.29, 0.29].map((z) => at(rbox(1.8, 0.06, 0.07, 0.008, "steel"), 0, 0.01, z)))),
    P("Deck and rollers", "Drive rollers, bearings and the frame", [0, -0.03, 0], [0, -1, 0], () => grp(rbox(1.85, 0.08, 0.6, 0.01, "alu"), ...[-0.88, 0.88].map((x) => at(cylZ(0.05, 0.56, "steel"), x, 0.04, 0)))),
    P("Rail and labels", "Mounting rail with stencilled DECK / To LAB markings", [0, 0.14, -0.33], [0, 0.6, -1], () => grp(rbox(1.7, 0.04, 0.03, 0.006, "blueAnod"), at(label(0.22, 0.035, "DECK", { bg: "#1e6fd6", fg: "#ffffff" }), -0.4, 0, 0.016), at(label(0.22, 0.035, "To LAB", { bg: "#e9ecef", fg: "#111" }), -0.12, 0, 0.016))),
    P("Harness", "Worn at shoulders and waist; takes the pull-down load", [0.05, 1.05, 0], [0, 1, 0], () => grp(at(torus(0.16, 0.022, "fabricBlue"), 0, 0, 0, Math.PI / 2, 0, 0), at(torus(0.14, 0.02, "fabricBlue"), 0, -0.35, 0, Math.PI / 2, 0, 0), ...[-0.08, 0.08].map((z) => at(rbox(0.04, 0.36, 0.02, 0.006, "fabricBlue"), 0, -0.17, z)))),
    P("Subject Loading Device", "ESA-built unit that pulls the runner down with a set load", [0.95, 0.12, 0], [1, 0, 0], () => grp(rbox(0.28, 0.14, 0.24, 0.012, "white"), at(label(0.12, 0.025, "SLD  ESA", { bg: "#1a1d21", fg: "#e9ecef" }), 0, 0.02, 0.121))),
    P("Load cables", "Bungee cords in blue sleeves from harness to the loading device", [0, 0, 0], [0.6, 0.6, 0.2], () => grp(...[-0.1, 0.1].map((z) => tube([[0.1, 0.72, z], [0.45, 0.4, z], [0.82, 0.16, z * 0.8]], 0.012, "blueAnod")))),
    P("Vibration isolation", "Two spring stages in series keep running forces off the station", [0, -0.17, 0], [0, -1, 0.4], () => grp(...[-0.75, -0.25, 0.25, 0.75].flatMap((x) => [-0.22, 0.22].map((z) => at(grp(spring(0.035, 0.12, 6, 0.005), at(spring(0.025, 0.08, 6, 0.004, "blueAnod"), 0, -0.1, 0)), x, 0, z))))),
    P("Control panel", "Speed, time and load display", [-0.9, 0.75, 0], [-1, 0.6, 0], () => grp(rbox(0.26, 0.16, 0.035, 0.012, "white"), at(screen(0.18, 0.09, [["8.0 mph", 0.34, "#e9f4ff", 0.45], ["LOAD 70% BW   12:40", 0.2, "#9fe8ff", 0.82]]), 0, 0.01, 0.0181), at(cyl(0.012, 0.6, "steel", 16), 0, -0.38, 0))),
  ],
  ared: [
    P("Base housing", "Rounded blue covers over the cylinders and flywheels", [0, 0.1, 0], [0, -1, 0], () => grp(rbox(1.2, 0.22, 0.6, 0.08, "blueAnod"), ...[-0.62, 0.62].map((x) => at(cylZ(0.13, 0.62, "blueAnod"), x, 0.02, 0)))),
    P("Platform", "Gold anodised plate the crew member stands on", [0, 0.24, 0.05], [0, 1.2, 0.4], () => grp(rbox(0.7, 0.03, 0.5, 0.01, "gold"), ...[[-0.3, -0.2], [0.3, -0.2], [-0.3, 0.2], [0.3, 0.2]].map(([x, z]) => at(cyl(0.008, 0.005, "steel", 12), x, 0.016, z)))),
    P("Vacuum cylinder L", "20.3 cm bore, 30.5 cm stroke: a constant 340 kgf", [-0.32, 0.1, -0.18], [-1.4, -0.4, -0.6], () => vacuumCylinder(), { exact: true }),
    P("Vacuum cylinder R", "The matching cylinder on the other side", [0.32, 0.1, -0.18], [1.4, -0.4, -0.6], () => vacuumCylinder(), { exact: true }),
    P("Flywheels", "Add barbell-like inertia to every lift", [0, 0.06, 0.24], [0, -0.8, 1.4], () => grp(...[-0.07, 0.07].map((x) => at(grp(cylX(0.13, 0.03, "blackAnod"), cylX(0.03, 0.05, "steel")), x, 0, 0)))),
    P("Uprights and sliders", "Blue posts with yellow sliders that guide the bar", [0, 0.75, -0.2], [0, 0.6, -1], () => grp(...[-0.45, 0.45].map((x) => at(grp(rbox(0.06, 1.0, 0.06, 0.01, "blueAnod"), at(rbox(0.09, 0.1, 0.08, 0.01, "yellow"), 0, 0.05, 0)), x, 0, 0)))),
    P("Arm and ball screw", "Moves the cylinder pivot to set load in 1 lb steps", [0, 0.42, -0.08], [0, 1, -0.6], () => grp(rbox(1.1, 0.06, 0.09, 0.012, "blueAnod"), at(cylX(0.012, 0.9, "steel"), 0, 0.045, 0), at(rbox(0.12, 0.08, 0.1, 0.01, "gold"), 0.25, 0.04, 0))),
    P("Lift bar", "Black squat and deadlift bar with blue collars", [0, 0.82, 0.05], [0, 1.4, 0.6], () => grp(cylX(0.016, 1.6, "black"), ...[-0.45, 0.45].map((x) => at(cylX(0.03, 0.06, "blueAnod"), x, 0, 0)), ...[-0.7, 0.7].map((x) => at(cylX(0.022, 0.12, "steel"), x, 0, 0)))),
    P("Load display", "Shows the set load and repetitions", [0.55, 0.62, 0.25], [1, 0.6, 0.6], () => grp(rbox(0.16, 0.1, 0.03, 0.01, "black"), at(screen(0.12, 0.07, [["LOAD", 0.2, "#8fa3b8", 0.3], ["185 lb", 0.4, "#e9f4ff", 0.72], ["REPS 6", 0.18, "#9fe8ff", 0.95]]), 0, 0, 0.0155))),
  ],
});

function vacuumCylinder() { // aluminium barrel, black end plates, four steel tie rods
  return grp(drum(0.1015, 0.42, "alu", "blackAnod", "y"), ...[0, 1, 2, 3].map((k) => at(cyl(0.006, 0.44, "steel", 12), Math.cos(k * Math.PI / 2 + 0.78) * 0.115, 0, Math.sin(k * Math.PI / 2 + 0.78) * 0.115)));
}
