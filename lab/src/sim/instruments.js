// Instruments: the real hardware behind each kind of reading on the ISS, what it measures, how
// the reading reaches Sol Lab, its published specifications, and a parts model for the exploded
// blueprint view.
//
// Units: metres. Where a source gives a dimension, the part is built to it and marked
// `exact: true` (the blueprint outlines it in green). Other parts are placed to show how the
// device works and are labelled as schematic. Every number in `specs` names its source in
// `sources`, so judges can check it.
//
// "feeds": check-in indicator keys or app stations the readings go to.
// "path": "import" (CSV or FHIR file), "dataset" (loaded from a public record), "reference".

const NTRS = (id) => `https://ntrs.nasa.gov/citations/${id}`;

export const INSTRUMENTS = [
  // ---------------------------------------------------------------- radiation
  {
    key: "dosimeter", name: "DOSTEL radiation telescope", flight: "ISS Columbus module: DOSTEL, the DLR DOSimetry TELescope (DOSIS and DOSIS 3D experiments)",
    agency: "DLR / ESA", measures: "Absorbed dose rate in silicon, particle count rate", feeds: ["radiation"], path: "dataset",
    how: "Two thin, round silicon detectors sit one above the other. A charged particle crossing silicon frees electric charge in proportion to the energy it loses. Each detector's pulses, summed and divided by the detector's mass, give the absorbed dose. A particle that hits both detectors within the 124° cone of the telescope is counted as crossing it, which also gives its path length and so its energy loss per micrometre (LET). Two smaller PIN diodes, mounted at right angles, catch particles from other directions. This is the instrument behind Sol Lab's 123,695 radiation readings.",
    specs: [
      ["Upper telescope detector", "Silicon PIPS, 154 µm thick, 6.93 cm², 0.249 g", "swsc"],
      ["Lower telescope detector", "Silicon PIPS, 315 µm thick, 6.93 cm², 0.509 g", "swsc"],
      ["Side detectors", "Two PIN diodes, 300 µm, 2.31 cm², 0.161 g, at right angles", "swsc"],
      ["Telescope opening angle", "124°", "swsc"],
      ["Detector gap", "About 15.8 mm (from the 6.93 cm² area and the 124° cone)", "derived"],
      ["Energy deposit range (lower)", "42.5 keV to 51.2 MeV, LET 0.061 to 73.5 keV/µm in water", "swsc"],
      ["Misses", "Neutrons, about 30% of ISS radiation", "csa"],
    ],
    sources: { swsc: ["Labrenz et al., Matroshka DOSTEL measurements onboard the ISS, J. Space Weather Space Clim. 5, A38 (2015), Table 1", "https://doi.org/10.1051/swsc/2015039"], csa: ["Canadian Space Agency, Monitoring radiation for astronaut health (2026)", "https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp"], derived: ["Geometry: detector radius sqrt(6.93/π) = 1.485 cm; gap = 2r / tan(62°)", ""] },
    parts: [
      { name: "Upper PIPS detector", does: "154 µm silicon disc, 6.93 cm²: first hit of each particle", shape: "cyl", size: [0.01485, 0.0006], at: [0, 0.0079, 0], dir: [0, 1, 0], glow: "#9cc4ff", exact: true, note: "Thickness drawn 4x for visibility" },
      { name: "Lower PIPS detector", does: "315 µm silicon disc, 6.93 cm²: a matching hit marks a particle crossing the telescope", shape: "cyl", size: [0.01485, 0.0012], at: [0, -0.0079, 0], dir: [0, -1, 0], glow: "#9cc4ff", exact: true, note: "Thickness drawn 4x for visibility" },
      { name: "Detector rings", does: "Hold each disc at its edge; set the 15.8 mm gap", shape: "ring", size: [0.0185, 0.0152, 0.003], at: [0, 0, 0], dir: [0.2, 0, 1], count: 2, step: [0, 0.0158, 0] },
      { name: "Acceptance cone", does: "The 124° cone of particle paths that cross both detectors", shape: "cone", size: [0.03, 0.0158], at: [0, 0, 0], dir: [0, 0, 0], color: "#39c6f4", ghost: true, exact: true },
      { name: "PIN diode X", does: "300 µm, 2.31 cm² (drawn square): particles arriving sideways", shape: "box", size: [0.0152, 0.0152, 0.0012], at: [0.03, 0, 0], dir: [1, 0, 0.3], rot: [0, Math.PI / 2, 0], glow: "#7fd1b9", exact: true },
      { name: "PIN diode Z", does: "300 µm, 2.31 cm², at right angles to diode X", shape: "box", size: [0.0152, 0.0152, 0.0012], at: [0, 0, 0.03], dir: [0, 0, 1], glow: "#7fd1b9", exact: true },
      { name: "Charge preamplifiers", does: "Turn tiny charge pulses into voltages", shape: "box", size: [0.04, 0.006, 0.03], at: [0, -0.024, -0.005], dir: [0, -1, -0.4] },
      { name: "Pulse-height analyser", does: "Sorts pulses by energy into a spectrum; dose = sum of energy / detector mass", shape: "box", size: [0.06, 0.008, 0.045], at: [0, -0.04, -0.005], dir: [0.3, -1, -0.6] },
      { name: "Housing", does: "Light-tight aluminium case (schematic size)", shape: "rbox", size: [0.075, 0.065, 0.075, 0.004], at: [0, -0.012, 0], dir: [0, 0, -1], ghost: true },
    ],
  },
  {
    key: "rem", name: "REM pixel detector (Timepix)", flight: "ISS: Radiation Environment Monitor, a USB-connected Timepix chip from CERN's Medipix collaboration (NASA RadWorks)",
    agency: "NASA / CERN", measures: "Each particle's track, energy deposit and type; dose in several modules", feeds: ["radiation"], path: "dataset",
    how: "A silicon sensor is bonded, pixel by pixel, to a Timepix readout chip with 65,536 pixels. A particle crossing the sensor lights a track of pixels; the shape and charge of that track tell a proton from a heavy ion. The whole monitor plugs into a station laptop's USB port, which made it cheap to place in many modules. Sol Lab's module-by-module dose map uses REM data.",
    specs: [
      ["Pixels", "256 × 256 = 65,536", "medipix"],
      ["Pixel pitch", "55 µm, so the sensor is 14.08 mm square", "medipix"],
      ["Connection", "USB to a station laptop; monitors continuously", "ntrs"],
      ["Successors", "BIRD on Orion EFT-1 (2014), then HERA for Orion", "ntrs"],
    ],
    sources: { medipix: ["CERN Medipix collaboration, Timepix", "https://medipix.web.cern.ch/"], ntrs: ["NASA, RadWorks Project. ISS REM to BIRD to HERA: The Evolution of a Technology (NTRS 20150021957)", NTRS("20150021957")] },
    parts: [
      { name: "Silicon sensor", does: "14.08 mm square; particles free charge as they cross", shape: "box", size: [0.01408, 0.0006, 0.01408], at: [0, 0.004, 0], dir: [0, 1, 0], glow: "#9cc4ff", exact: true },
      { name: "Bump bonds", does: "65,536 solder bumps, one per 55 µm pixel (shown as a grid)", shape: "grid", size: [0.01408, 16], at: [0, 0.0028, 0], dir: [0, 0.4, 0], color: "#c9a35a", exact: true },
      { name: "Timepix readout chip", does: "Counts charge or time in each pixel", shape: "box", size: [0.01408, 0.0007, 0.0161], at: [0, 0.0018, 0.001], dir: [0, -0.2, 1], color: "#5b6b7d" },
      { name: "Chip board", does: "Carries the chip and wire bonds", shape: "box", size: [0.03, 0.0016, 0.045], at: [0, 0, 0.008], dir: [0, -1, 0.3], color: "#2f6b4f" },
      { name: "USB readout", does: "Power and data from the station laptop", shape: "rbox", size: [0.026, 0.01, 0.05, 0.002], at: [0, -0.008, 0.055], dir: [0, -0.3, 1] },
      { name: "USB plug", does: "Standard USB connector", shape: "box", size: [0.012, 0.0045, 0.012], at: [0, -0.008, 0.086], dir: [0, 0, 1], color: "#c9ced6" },
      { name: "Particle track", does: "A heavy ion lights a line of pixels; a proton a short dot", shape: "path", size: [[[-0.006, 0.0045, -0.005], [-0.001, 0.0045, 0.0], [0.005, 0.0045, 0.006]], 0.0005], at: [0, 0, 0], dir: [0, 1.6, 0], glow: "#f0c259" },
    ],
  },
  // ---------------------------------------------------------------- air
  {
    key: "cdra", photo: { src: "img/instruments/cdra.jpg", id: "iss033e007246", caption: "JAXA astronaut Aki Hoshide replaces valves in the station's Carbon Dioxide Removal Assembly (Sept. 2012)" }, name: "CO2 removal assembly (CDRA)", flight: "ISS: Carbon Dioxide Removal Assembly, a four-bed molecular sieve in the Atmosphere Revitalization rack",
    agency: "NASA", measures: "Removes CO2 from cabin air (CO2 is measured by the Major Constituent Analyzer)", feeds: ["air"], path: "dataset",
    how: "Cabin air first passes a desiccant bed that takes out water, then a blower pushes it through a precooler and into a zeolite bed that traps CO2. Four beds work in pairs: while one desiccant bed and one CO2 bed adsorb, the other two desorb. Kapton heaters warm the full CO2 bed and space vacuum pulls its CO2 overboard. The air returning to the cabin picks up the water the other desiccant bed stored, so no water is lost. Six numbered selector valves swap the beds every half-cycle.",
    specs: [
      ["Full cycle", "288 minutes (two half-cycles of 144)", "test"],
      ["Blower", "115,000 to 120,000 RPM", "test"],
      ["Air flow", "39 to 42.7 kg per hour (minimum needed: 41)", "test"],
      ["Air selector valves", "Six, numbered 101 to 106", "test"],
      ["Air-save pump", "Runs the first 15 minutes of each half-cycle, returning trapped air", "test"],
      ["Capacity", "One bed pair alone: about 3 crew-equivalents", "concepts"],
      ["Backups", "Russian Vozdukh system; lithium hydroxide canisters", "concepts"],
    ],
    sources: { test: ["NASA, International Space Station Carbon Dioxide Removal Assembly Testing (NTRS 20000072884)", NTRS("20000072884")], concepts: ["NASA, ISS CDRA Concepts and Advancements (NTRS 20050210002)", NTRS("20050210002")] },
    parts: [
      { name: "Desiccant bed 1", does: "Dries incoming air (or returns water on the way out)", shape: "rbox", size: [0.22, 0.2, 0.18, 0.012], at: [-0.25, 0.12, 0], dir: [-1, 0.6, 0], color: "#c9a35a" },
      { name: "Desiccant bed 2", does: "The other half-cycle's desiccant bed", shape: "rbox", size: [0.22, 0.2, 0.18, 0.012], at: [-0.25, -0.12, 0], dir: [-1, -0.6, 0], color: "#c9a35a" },
      { name: "CO2 bed 1 (adsorbing)", does: "Zeolite pores trap CO2 molecules", shape: "rbox", size: [0.26, 0.2, 0.18, 0.012], at: [0.2, 0.12, 0], dir: [1, 0.6, 0], color: "#7fd1b9" },
      { name: "CO2 bed 2 (desorbing)", does: "Heated and opened to vacuum to release CO2", shape: "rbox", size: [0.26, 0.2, 0.18, 0.012], at: [0.2, -0.12, 0], dir: [1, -0.6, 0], color: "#ef8a6c" },
      { name: "Kapton heaters", does: "Warm the CO2 bed to break the CO2 bond", shape: "box", size: [0.24, 0.004, 0.16], at: [0.2, -0.225, 0], dir: [0.4, -1, 0.3], glow: "#f0c259" },
      { name: "Blower", does: "115,000 to 120,000 RPM; 39 to 42.7 kg of air an hour", shape: "cyl", size: [0.05, 0.08], at: [-0.02, 0, 0.13], dir: [0, 0, 1], rot: [Math.PI / 2, 0, 0], exact: false },
      { name: "Precooler", does: "Cools the dry air so the zeolite holds more CO2", shape: "box", size: [0.1, 0.07, 0.06], at: [0.08, 0, 0.13], dir: [0.4, 0.2, 1], color: "#6fa8f5" },
      { name: "Air selector valves 101 to 106", does: "Six valves swap the bed pairs every 144 minutes", shape: "cyl", size: [0.018, 0.035], at: [-0.13, 0, -0.13], dir: [0, 0, -1], count: 6, step: [0.06, 0, 0], color: "#c9ced6" },
      { name: "Air-save pump", does: "First 15 minutes of each half-cycle: pumps trapped cabin air back", shape: "cyl", size: [0.035, 0.06], at: [-0.28, 0, -0.13], dir: [-1, -0.3, -0.6], rot: [0, 0, Math.PI / 2] },
      { name: "Vacuum vent line", does: "CO2 goes overboard (or to the Sabatier reactor)", shape: "path", size: [[[0.33, -0.12, 0], [0.42, -0.12, 0], [0.46, -0.04, 0], [0.46, 0.12, 0]], 0.009], at: [0, 0, 0], dir: [1, 0, 0] },
      { name: "Rack frame", does: "Slides into the Atmosphere Revitalization rack (schematic)", shape: "box", size: [0.9, 0.5, 0.4], at: [0.05, 0, 0], dir: [0, 0, -1], ghost: true },
    ],
  },
  {
    key: "mca", photo: { src: "img/instruments/mca.jpg", id: "iss062e103552", caption: "NASA astronaut Jessica Meir replaces the Major Constituent Analyzer's mass spectrometer (March 2020)" }, name: "Major Constituent Analyzer", flight: "ISS: Major Constituent Analyzer (MCA), the mass spectrometer that measures cabin gases",
    agency: "NASA", measures: "Nitrogen, oxygen, hydrogen, methane, water vapour and CO2 in cabin air", feeds: ["air"], path: "reference",
    how: "A sample of cabin air is drawn into a vacuum chamber, where a hot filament ionises the gas molecules. A magnet bends the ions; lighter ones bend more, so each gas lands on its own detector. Six electrometers, one per gas, measure the ion currents at once. An ion pump keeps the vacuum, and a bottle of known gas checks the calibration. Sol Lab's cabin CO2 values come from station telemetry of this kind.",
    specs: [
      ["Analyser", "Single-focusing magnetic sector mass spectrometer", "mca"],
      ["Detectors", "Six fixed ion-detection electrometers", "mca"],
      ["Gases", "N2, O2, H2, CH4, H2O, CO2", "mca"],
      ["Vacuum", "4 L/s ion pump", "mca"],
      ["Ion source", "Two filaments (lifetime-limiting)", "mca"],
      ["Replaceable units", "ORU 02 analyser, ORU 08 verification gas assembly", "mca"],
    ],
    sources: { mca: ["NASA, International Space Station Major Constituent Analyzer On-orbit Performance (NTRS 20160010396)", NTRS("20160010396")] },
    parts: [
      { name: "Sample inlet", does: "Draws a small flow of cabin air", shape: "path", size: [[[-0.2, 0.05, 0], [-0.13, 0.05, 0], [-0.1, 0.02, 0]], 0.004], at: [0, 0, 0], dir: [-1, 0.3, 0] },
      { name: "Ion source (2 filaments)", does: "Hot filaments turn gas molecules into ions", shape: "cyl", size: [0.018, 0.04], at: [-0.08, 0.02, 0], dir: [-0.6, 0.6, 0], rot: [0, 0, Math.PI / 2], glow: "#f0c259" },
      { name: "Magnet", does: "Bends ions by mass: light ones more, heavy ones less", shape: "cyl", size: [0.07, 0.025], at: [0.0, 0.0, 0], dir: [0, 0.2, 1], rot: [Math.PI / 2, 0, 0], color: "#5b6b7d" },
      { name: "Flight tube", does: "Curved vacuum path for the ions", shape: "torus", size: [0.06, 0.006], at: [0.0, 0.0, 0], dir: [0, 1, 0], arc: Math.PI * 0.6, rot: [0, 0, -Math.PI * 0.05] },
      { name: "Six electrometers", does: "One detector per gas: N2, O2, H2, CH4, H2O, CO2", shape: "box", size: [0.008, 0.02, 0.012], at: [0.06, -0.05, 0], dir: [1, -0.8, 0], count: 6, step: [0.011, 0, 0], color: "#9cc4ff", exact: true },
      { name: "Ion pump", does: "4 L/s: keeps the analyser at high vacuum", shape: "rbox", size: [0.06, 0.05, 0.05, 0.004], at: [0.1, 0.06, 0], dir: [1, 1, 0] },
      { name: "Verification gas (ORU 08)", does: "A bottle of known gas mix to check calibration", shape: "cap", size: [0.018, 0.06], at: [-0.15, -0.06, 0.03], dir: [-1, -0.8, 0.4] },
      { name: "Electronics", does: "Turn six ion currents into partial pressures", shape: "box", size: [0.14, 0.012, 0.09], at: [0, -0.1, 0], dir: [0, -1, 0] },
    ],
  },
  // ---------------------------------------------------------------- vitals
  {
    key: "wearable", photo: { src: "img/instruments/wearable.jpg", id: "iss058e003984", caption: "CSA astronaut David Saint-Jacques demonstrates the Bio-Monitor headband and recorder (Jan. 2019)" }, name: "Bio-Monitor smart shirt", flight: "ISS: Bio-Monitor (Canadian Space Agency), launched December 2018; built by Carré Technologies of Montreal",
    agency: "CSA", measures: "Heart activity, blood pressure, breathing rate and volume, skin temperature, blood oxygen, physical activity", feeds: ["hr", "temp", "sleep"], path: "import",
    how: "A snug shirt and a headband carry sensors against the skin; adjustable straps keep small metal electrodes in contact. The crew can wear it while working, exercising and sleeping. After a session the astronaut unplugs the battery pack and docks it in a base, which sends the data to the ground through the station's communications. A tablet app shows vitals during exercise. Its commercial twin, Hexoskin, is used in research on Earth.",
    specs: [
      ["Garments", "Smart shirt plus headband", "csa"],
      ["Measures", "Heart rate and ECG, blood pressure, breathing rate and volume, skin temperature, SpO2, activity", "csa"],
      ["Data", "Battery pack docks in a base that downlinks to Earth; tablet app on board", "csa"],
      ["On the ISS", "Launched December 2018; first used by CSA astronaut David Saint-Jacques", "csa"],
      ["Earth version", "Hexoskin shirts used in sleep, breathing and cardiac research", "csa"],
    ],
    sources: { csa: ["Canadian Space Agency, Bio-Monitor: Keeping an eye on astronauts' vital signs", "https://www.asc-csa.gc.ca/eng/sciences/bio-monitor.asp"], ntrs: ["NASA, Wearable Biosensor Monitor to Support Autonomous Crew Health (NTRS 20190000238)", NTRS("20190000238")] },
    parts: [
      { name: "Shirt", does: "Holds the sensors against the chest", shape: "lathe", size: [[[0.0, -0.22], [0.13, -0.22], [0.15, -0.1], [0.14, 0.05], [0.16, 0.16], [0.07, 0.2], [0.0, 0.2]], 0.62], at: [0, 0, 0], dir: [0, 0, -1], color: "#3a4552", ghost: true },
      { name: "ECG electrodes", does: "Small metal pads that pick up the heart's electrical signal", shape: "cyl", size: [0.012, 0.004], at: [-0.04, 0.06, 0.1], dir: [0, 0.3, 1], rot: [Math.PI / 2, 0, 0], count: 3, step: [0.04, -0.03, 0], glow: "#ef8a6c" },
      { name: "Chest breathing band", does: "Stretch sensor following rib-cage movement", shape: "torus", size: [0.145, 0.006], at: [0, 0.04, 0], dir: [-1, 0.4, 0], rot: [Math.PI / 2, 0, 0], scaleZ: 0.62, color: "#6fa8f5" },
      { name: "Abdominal breathing band", does: "Second band: together they estimate breathing volume", shape: "torus", size: [0.14, 0.006], at: [0, -0.1, 0], dir: [-1, -0.4, 0], rot: [Math.PI / 2, 0, 0], scaleZ: 0.62, color: "#6fa8f5" },
      { name: "Adjustable straps", does: "Keep the electrodes pressed to the skin", shape: "box", size: [0.02, 0.36, 0.006], at: [0.08, 0, 0.09], dir: [1, 0, 0.5], count: 2, step: [-0.16, 0, 0] },
      { name: "Headband", does: "Forehead oxygen saturation and temperature", shape: "torus", size: [0.08, 0.009], at: [0, 0.34, 0], dir: [0, 1, 0], rot: [Math.PI / 2, 0, 0], color: "#6fa8f5" },
      { name: "Forehead SpO2 sensor", does: "Red and infrared light reflected from the forehead", shape: "rbox", size: [0.03, 0.018, 0.008, 0.003], at: [0, 0.34, 0.08], dir: [0, 0.6, 1], glow: "#ff5a4f" },
      { name: "Battery and recorder pack", does: "Unplugs and docks in the base to send data to Earth", shape: "rbox", size: [0.07, 0.045, 0.018, 0.006], at: [0, -0.15, 0.1], dir: [0, -0.6, 1], screen: true },
    ],
  },
  {
    key: "bp", photo: { src: "img/instruments/bp.jpg", id: "iss009e13739", caption: "Cosmonaut Gennady Padalka records cardiovascular data, including blood pressure cuffs, for the Cardiocog experiment (July 2004)" }, name: "Blood pressure monitor", flight: "ISS: CDL Halter Arterial Blood Pressure Unit (named in NASA ISS daily reports); measures like any oscillometric cuff",
    agency: "NASA / ESA", measures: "Systolic and diastolic blood pressure, pulse", feeds: ["bp", "hr"], path: "import",
    how: "A cuff around the upper arm inflates until the artery is squeezed shut, then lets air out at a steady rate. As blood starts to push through again, the artery wall makes small pulses in the cuff pressure. A pressure sensor records them; the pressure where the pulses are biggest is the mean arterial pressure, and the device calculates systolic and diastolic from how the pulses grow and shrink. Cuff size matters: the bladder should wrap about 80% of the arm and be about 40% as wide as the arm is around.",
    specs: [
      ["Method", "Oscillometric (pressure pulses in the cuff)", "aha"],
      ["Cuff bladder (adult)", "About 40% of arm circumference wide, 80% to 100% of it long", "aha"],
      ["Adult bladder example", "12 cm × 24 cm for a 30 cm arm (40% and 80% of 30 cm)", "aha"],
      ["Escalation in Sol Lab", "ACC/AHA 2017 categories; 3 days high goes to the flight surgeon", "acc"],
    ],
    sources: { aha: ["Pickering et al., Recommendations for blood pressure measurement in humans, Hypertension 45:142 (2005)", "https://doi.org/10.1161/01.HYP.0000150859.47929.8e"], acc: ["Whelton et al., 2017 ACC/AHA high blood pressure guideline", "https://doi.org/10.1161/HYP.0000000000000065"] },
    parts: [
      { name: "Cuff bladder", does: "12 × 24 cm air bladder wrapped around the upper arm", shape: "ring", size: [0.052, 0.046, 0.12], at: [-0.13, 0, 0], dir: [-1, 0, 0], color: "#6fa8f5", exact: true },
      { name: "Cuff cover", does: "Fabric sleeve with hook-and-loop closure", shape: "ring", size: [0.056, 0.0525, 0.14], at: [-0.13, 0, 0], dir: [-1, 0.5, 0], color: "#3a4552", ghost: true },
      { name: "Upper arm", does: "30 cm around: the size this cuff fits", shape: "cyl", size: [0.0477, 0.2], at: [-0.13, 0, 0], dir: [0, 0, 0], color: "#d9a48a", ghost: true, exact: true },
      { name: "Air hose", does: "Carries air both ways and the pressure pulses to the sensor", shape: "path", size: [[[-0.13, -0.05, 0.03], [-0.08, -0.09, 0.05], [0.0, -0.06, 0.04], [0.05, -0.02, 0.02]], 0.0035], at: [0, 0, 0], dir: [0, -1, 0.4] },
      { name: "Pump", does: "Inflates the cuff past systolic pressure", shape: "cyl", size: [0.012, 0.03], at: [0.07, 0.0, -0.015], dir: [0.4, 0.8, -1], rot: [0, 0, Math.PI / 2] },
      { name: "Release valve", does: "Lets air out at a slow, steady rate", shape: "cyl", size: [0.006, 0.016], at: [0.07, -0.018, -0.015], dir: [-0.2, -1, -0.5] },
      { name: "Pressure sensor", does: "Reads cuff pressure and its small pulses", shape: "box", size: [0.012, 0.012, 0.006], at: [0.1, 0, -0.015], dir: [1, 0.5, -0.4], glow: "#7fd1b9" },
      { name: "Processor and display", does: "Finds the pulse peak; computes systolic and diastolic", shape: "rbox", size: [0.1, 0.07, 0.022, 0.006], at: [0.1, 0, 0.01], dir: [0.6, 0.2, 1], screen: true },
    ],
  },
  {
    key: "oximeter", name: "Pulse oximeter", flight: "ISS medical kit; oxygen sensing is also built into the Bio-Monitor headband",
    agency: "NASA / CSA", measures: "Blood oxygen saturation, pulse rate", feeds: ["hr"], path: "import",
    how: "Two LEDs shine red (about 660 nm) and infrared (about 940 nm) light through the fingertip. Blood carrying oxygen absorbs more infrared and less red than blood without it. A photodiode on the other side measures how much of each colour gets through; only the part that pulses with each heartbeat comes from arterial blood. The ratio of the two pulsing signals is converted to oxygen saturation.",
    specs: [
      ["Wavelengths", "About 660 nm (red) and 940 nm (infrared)", "jubran"],
      ["Principle", "Ratio of pulsing red to pulsing infrared absorption", "jubran"],
      ["Accuracy limits", "Affected by poor circulation, skin pigmentation, skin thickness, skin temperature, tobacco use and nail polish", "fda"],
    ],
    sources: { fda: ["U.S. FDA, Pulse Oximeters", "https://www.fda.gov/medical-devices/products-and-medical-procedures/pulse-oximeters"], jubran: ["Jubran, Pulse oximetry, Critical Care 19:272 (2015)", "https://doi.org/10.1186/s13054-015-0984-8"] },
    parts: [
      { name: "Upper clip", does: "Holds the LEDs over the nail", shape: "rbox", size: [0.055, 0.016, 0.03, 0.006], at: [0, 0.018, 0], dir: [0, 1, 0] },
      { name: "Red and infrared LEDs", does: "About 660 nm and 940 nm, flashed in turn", shape: "box", size: [0.004, 0.002, 0.004], at: [0.004, 0.009, 0], dir: [0.3, 0.7, 0.4], count: 2, step: [-0.008, 0, 0], glow: "#ff5a4f" },
      { name: "Fingertip", does: "Pulsing arterial blood changes how much light gets through", shape: "cap", size: [0.008, 0.04], at: [-0.01, 0, 0], dir: [-1, 0, 0], color: "#d9a48a", rot: [0, 0, Math.PI / 2], ghost: true },
      { name: "Photodiode", does: "Measures the light that passes through", shape: "box", size: [0.005, 0.002, 0.005], at: [0, -0.009, 0], dir: [0.3, -0.7, 0.4], glow: "#7fd1b9" },
      { name: "Lower clip and spring", does: "Keeps gentle, steady pressure on the finger", shape: "rbox", size: [0.055, 0.016, 0.03, 0.006], at: [0, -0.018, 0], dir: [0, -1, 0] },
      { name: "Hinge spring", does: "Closes the clip", shape: "torus", size: [0.006, 0.0012], at: [0.03, 0, 0], dir: [1, 0, 0], rot: [0, Math.PI / 2, 0] },
      { name: "Display", does: "SpO2 and pulse from the red/infrared ratio", shape: "box", size: [0.024, 0.002, 0.016], at: [0.005, 0.027, 0], dir: [0.4, 1, -0.2], screen: true },
    ],
  },
  {
    key: "glucometer", name: "Blood glucose meter", flight: "Reference design: the finger-stick meter class used in clinics and at home",
    agency: "Commercial", measures: "Blood sugar (mg/dL)", feeds: ["glucose"], path: "import",
    how: "A finger prick gives a drop of blood, which wicks into the end of a test strip. An enzyme on the strip (glucose oxidase or glucose dehydrogenase) reacts with the glucose, and a mediator carries the freed electrons to the electrodes. The meter measures the current a few seconds later; it is proportional to the glucose level.",
    specs: [
      ["Accuracy standard", "ISO 15197:2013: 95% of readings within ±15 mg/dL below 100 mg/dL, or within ±15% at 100 mg/dL and above", "iso"],
      ["Fasting targets in Sol Lab", "ADA: below 100 normal, 100 to 125 prediabetes range, 126 or more diabetes range", "ada"],
    ],
    sources: { iso: ["ISO 15197:2013, in vitro diagnostic test systems for blood glucose monitoring", "https://www.iso.org/standard/54976.html"], ada: ["American Diabetes Association, Standards of Care, Diagnosis and Classification", "https://diabetesjournals.org/care"] },
    parts: [
      { name: "Lancet", does: "Fine needle for a small finger prick", shape: "cyl", size: [0.0009, 0.012], at: [-0.11, 0.02, 0], dir: [-1, 0.5, 0], rot: [0, 0, Math.PI / 2], color: "#c9ced6" },
      { name: "Lancing device", does: "Spring-loaded holder; sets prick depth", shape: "cap", size: [0.008, 0.07], at: [-0.11, -0.01, 0], dir: [-1, -0.3, 0], rot: [0, 0, Math.PI / 2] },
      { name: "Test strip", does: "Wicks blood to the reaction chamber", shape: "box", size: [0.034, 0.0006, 0.006], at: [-0.045, 0, 0], dir: [-1, 0, 0.3], color: "#e9edf2" },
      { name: "Enzyme and mediator layer", does: "Glucose oxidase or dehydrogenase frees electrons", shape: "box", size: [0.005, 0.0004, 0.005], at: [-0.058, 0.0006, 0], dir: [-0.6, 1, 0.2], glow: "#f0c259" },
      { name: "Electrodes", does: "Working and reference electrodes measure the current", shape: "box", size: [0.026, 0.0002, 0.0012], at: [-0.04, -0.0005, 0], dir: [-0.5, -1, 0.3], count: 2, step: [0, 0, 0.0025], color: "#c9a35a" },
      { name: "Strip port", does: "Connects the strip contacts to the meter", shape: "box", size: [0.012, 0.006, 0.012], at: [-0.022, 0, 0], dir: [-0.4, 0.3, -1] },
      { name: "Meter and display", does: "Converts current to mg/dL; stores readings", shape: "rbox", size: [0.05, 0.085, 0.017, 0.008], at: [0.015, 0, 0], dir: [1, 0.2, 0.2], screen: true },
    ],
  },
  // ---------------------------------------------------------------- exercise
  {
    key: "treadmill", photo: { src: "img/instruments/treadmill.jpg", id: "iss020e048842", caption: "Installing the new T2 (COLBERT) treadmill: the slat belt is visible (2009)" }, name: "T2 treadmill", flight: "ISS: T2, a flight-certified Woodway Path treadmill with an ESA subject loading device and a Boeing vibration isolation system",
    agency: "NASA / ESA", measures: "Exercise time, speed, harness load", feeds: ["exercise"], path: "import",
    how: "In orbit a runner would float off the belt, so a harness and the Subject Loading Device pull them down onto it with a set fraction of their body weight. Running forces would shake the whole station and disturb experiments, so the treadmill rides on a vibration isolation system with two stages of springs in series, which isolates an order of magnitude better at running frequencies than one stage.",
    specs: [
      ["Treadmill", "Commercial Woodway Path, flight-certified", "t2"],
      ["Pull-down", "ESA Subject Loading Device and harness", "t2"],
      ["Isolation", "Boeing Vibration Isolation System based on PaRIS; second spring stage in series", "t2,vis"],
      ["Studied", "Joint loads at different speeds and harness loads", "bio"],
    ],
    sources: { t2: ["NASA, 2nd ISS Treadmill Development, T2 Project (NTRS 20070011772)", NTRS("20070011772")], vis: ["NASA Tech Briefs, Vibration Isolation and Stabilization System for Spacecraft Exercise Treadmill Devices (NTRS 20110012610)", NTRS("20110012610")], bio: ["NASA, Biomechanical Analysis of T2 Exercise (NTRS 20100038357)", NTRS("20100038357")] },
    parts: [
      { name: "Slat belt", does: "Rubber-topped slats on rollers (Woodway design)", shape: "slats", size: [1.6, 0.52, 40], at: [0, 0, 0], dir: [0, 0.4, 1], color: "#2a323c" },
      { name: "Deck and drive", does: "Rollers, bearings and drive motor", shape: "box", size: [1.7, 0.12, 0.6], at: [0, -0.08, 0], dir: [0, -1, 0] },
      { name: "Harness", does: "Worn at shoulders and waist; takes the pull-down load", shape: "torus", size: [0.17, 0.02], at: [0, 1.05, 0], dir: [0, 1, 0], rot: [Math.PI / 2, 0, 0], scaleZ: 0.7, color: "#6fa8f5" },
      { name: "Subject Loading Device", does: "ESA-built: pulls the runner down with a set load", shape: "box", size: [0.3, 0.12, 0.18], at: [0.95, 0.1, 0], dir: [1, 0, 0] },
      { name: "Load cables", does: "Connect harness to the loading device", shape: "path", size: [[[0.12, 1.0, 0.1], [0.5, 0.5, 0.1], [0.85, 0.15, 0.08]], 0.006], at: [0, 0, 0], dir: [0.8, 0.6, 0.2], count: 2, step: [0, 0, -0.2] },
      { name: "Vibration isolation (two stages)", does: "Springs in series keep running forces off the station", shape: "spring", size: [0.04, 0.16, 7], at: [-0.7, -0.24, 0.25], dir: [0, -1, 0.5], count: 4, step: [0.46, 0, 0], color: "#c9ced6" },
      { name: "Second isolation stage", does: "The series spring that improves isolation tenfold", shape: "spring", size: [0.03, 0.1, 6], at: [-0.7, -0.24, -0.25], dir: [0, -1, -0.5], count: 4, step: [0.46, 0, 0], color: "#9cc4ff" },
      { name: "Control panel", does: "Speed, time, load", shape: "rbox", size: [0.22, 0.14, 0.03, 0.01], at: [-0.85, 0.75, 0], dir: [-1, 0.6, 0], screen: true },
    ],
  },
  {
    key: "ared", photo: { src: "img/instruments/ared.jpg", id: "iss018e043409", caption: "JAXA astronaut Koichi Wakata exercises on the Advanced Resistive Exercise Device in the Unity node (March 2009)" }, name: "ARED resistance machine", flight: "ISS: Advanced Resistive Exercise Device (flew on assembly flight ULF 2); squats, deadlifts and heel raises against vacuum cylinders",
    agency: "NASA", measures: "Strength training load and repetitions", feeds: ["exercise"], path: "reference",
    how: "Weights mean nothing in orbit, so ARED makes resistance from vacuum. Two cylinders hold a vacuum on one side of each piston and cabin air on the other; pulling the bar drags the pistons against that pressure difference, a nearly constant force. A lever arm with a ball screw sets the load in 1 lb steps, and flywheels add the inertia of lifting a real barbell. Regular heavy lifting is the main defence against the bone and muscle loss of spaceflight.",
    specs: [
      ["Vacuum cylinders", "Two, 20.3 cm (8 in) diameter; 30.5 cm (12 in) stroke", "ared"],
      ["Force per cylinder", "340 kgf (750 lbf), nearly constant", "ared"],
      ["Load to the crew member", "0 to 272 kgf (0 to 600 lbf), set in 1 lb steps", "ared"],
      ["Predecessor", "iRED: 0 to 136 kgf (0 to 300 lbf)", "ared"],
      ["Inertia", "Flywheels tied to the cylinder motion mimic lifting a barbell", "ared"],
    ],
    sources: { ared: ["NASA, Mechanism Development, Testing, and Lessons Learned for the Advanced Resistive Exercise Device (NTRS 20060028227)", NTRS("20060028227")] },
    parts: [
      { name: "Vacuum cylinder L", does: "20.3 cm bore, 30.5 cm stroke; 340 kgf", shape: "cyl", size: [0.1015, 0.42], at: [-0.32, 0.25, -0.2], dir: [-1, 0, -0.3], color: "#9cc4ff", exact: true },
      { name: "Vacuum cylinder R", does: "The matching cylinder", shape: "cyl", size: [0.1015, 0.42], at: [0.32, 0.25, -0.2], dir: [1, 0, -0.3], color: "#9cc4ff", exact: true },
      { name: "Pistons", does: "Vacuum on one side, cabin air on the other", shape: "cyl", size: [0.098, 0.03], at: [-0.32, 0.36, -0.2], dir: [0, 1, 0], count: 2, step: [0.64, 0, 0], glow: "#7fd1b9", exact: true },
      { name: "Tie rods", does: "Four per cylinder hold the end plates together", shape: "cyl", size: [0.006, 0.44], at: [-0.42, 0.25, -0.2], dir: [-1, 0.2, -0.6], count: 4, step: [0.0, 0, 0.0], ring: 0.115, color: "#c9ced6" },
      { name: "Arm and ball screw", does: "Moves the cylinder pivot to set load in 1 lb steps", shape: "box", size: [1.2, 0.07, 0.1], at: [0, 0.52, -0.05], dir: [0, 1, 0.3] },
      { name: "Flywheels", does: "Add barbell-like inertia to every lift", shape: "cyl", size: [0.14, 0.04], at: [0, 0.2, 0.25], dir: [0, -0.2, 1], count: 2, step: [0.12, 0, 0], rot: [0, 0, Math.PI / 2], color: "#5b6b7d" },
      { name: "Lift bar", does: "Squat and deadlift bar", shape: "cyl", size: [0.016, 1.6], at: [0, 0.95, 0.15], dir: [0, 1, 0.4], rot: [0, 0, Math.PI / 2] },
      { name: "Platform", does: "Crew member stands here; houses electronics", shape: "box", size: [1.3, 0.1, 0.8], at: [0, -0.05, 0.1], dir: [0, -1, 0] },
    ],
  },
];

// ---------- universal import ----------
// Any device that can export CSV or a FHIR bundle can feed the check-in. FHIR Observations
// are matched by LOINC code; CSV by column names.
export const LOINC = {
  "8480-6": { key: "bp", field: "sys" },     // systolic blood pressure
  "8462-4": { key: "bp", field: "dia" },     // diastolic blood pressure
  "8867-4": { key: "hr", field: "v" },       // heart rate
  "2339-0": { key: "glucose", field: "v" },  // glucose, blood, mass/volume
  "1558-6": { key: "glucose", field: "v" },  // fasting glucose, serum/plasma
  "8310-5": { key: "temp", field: "v" },     // body temperature
  "93832-4": { key: "sleep", field: "v" },   // sleep duration
};

const toDay = (iso) => (iso ? String(iso).slice(0, 10) : null);

// Returns { rows: [{ date, key, value }], skipped: [reasons] }. Values are in the app's units
// (mmHg, bpm, mg/dL, degC, hours, 1-5, minutes); simple unit conversions are applied.
export function parseReadings(text, filename = "") {
  const rows = [], skipped = [];
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) {
    let doc;
    try { doc = JSON.parse(trimmed); } catch { return { rows, skipped: ["Not valid JSON."] }; }
    const obs = doc.resourceType === "Bundle" ? (doc.entry || []).map((e) => e.resource) : [doc];
    const byDay = {};
    for (const o of obs) {
      if (!o || o.resourceType !== "Observation") continue;
      const date = toDay(o.effectiveDateTime || o.effectivePeriod?.start || o.issued);
      const items = o.component?.length ? o.component : [o];
      for (const c of items) {
        const code = (c.code?.coding || []).map((x) => x.code).find((x) => LOINC[x]);
        const q = c.valueQuantity;
        if (!code || !q || !Number.isFinite(q.value)) { if (c === o && !o.component) skipped.push(`Unrecognised observation ${(c.code?.coding || [])[0]?.code || "?"}`); continue; }
        const { key, field } = LOINC[code];
        let v = q.value;
        const unit = (q.unit || q.code || "").toLowerCase();
        if (key === "temp" && (unit.includes("f") && !unit.includes("cel"))) v = ((v - 32) * 5) / 9;
        if (key === "glucose" && unit.includes("mmol")) v = v * 18.016;
        if (key === "sleep" && (unit === "min" || unit.includes("minute"))) v = v / 60;
        byDay[date] = byDay[date] || {};
        byDay[date][key] = byDay[date][key] || {};
        byDay[date][key][field] = key === "glucose" || key === "bp" || key === "hr" ? Math.round(v) : Math.round(v * 10) / 10;
      }
    }
    for (const [date, keys] of Object.entries(byDay)) for (const [key, value] of Object.entries(keys)) rows.push({ date, key, value });
    return { rows, skipped };
  }
  // CSV: header with a date column and any of: systolic, diastolic, heart_rate, glucose,
  // temperature, sleep_hours, mood, exercise_min (aliases accepted).
  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { rows, skipped: ["The file has no data rows."] };
  const head = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_"));
  const col = (...names) => head.findIndex((h) => names.includes(h));
  const ci = {
    date: col("date", "day", "timestamp", "datetime"),
    sys: col("systolic", "sys", "bp_systolic"), dia: col("diastolic", "dia", "bp_diastolic"),
    hr: col("heart_rate", "hr", "pulse", "resting_hr"), glucose: col("glucose", "blood_sugar", "glucose_mg_dl"),
    glucose_mmol: col("glucose_mmol_l", "glucose_mmol"), temp: col("temperature", "temp", "temp_c", "body_temp"),
    temp_f: col("temp_f", "temperature_f"), sleep: col("sleep_hours", "sleep", "sleep_h"),
    mood: col("mood"), exercise: col("exercise_min", "exercise", "exercise_minutes"),
  };
  if (ci.date < 0) return { rows, skipped: ["No date column (date, day or timestamp)."] };
  for (let n = 1; n < lines.length; n++) {
    const c = lines[n].split(",").map((x) => x.trim());
    const date = toDay(c[ci.date]);
    const num = (i) => (i >= 0 && c[i] !== "" && c[i] != null ? Number(c[i]) : null);
    const add = (key, value) => rows.push({ date, key, value });
    if (num(ci.sys) != null && num(ci.dia) != null) add("bp", { sys: num(ci.sys), dia: num(ci.dia) });
    if (num(ci.hr) != null) add("hr", { v: num(ci.hr) });
    if (num(ci.glucose) != null) add("glucose", { v: num(ci.glucose) });
    else if (num(ci.glucose_mmol) != null) add("glucose", { v: Math.round(num(ci.glucose_mmol) * 18.016) });
    if (num(ci.temp) != null) add("temp", { v: num(ci.temp) });
    else if (num(ci.temp_f) != null) add("temp", { v: Math.round(((num(ci.temp_f) - 32) * 5 / 9) * 10) / 10 });
    if (num(ci.sleep) != null) add("sleep", { v: num(ci.sleep) });
    if (num(ci.mood) != null) add("mood", { v: num(ci.mood) });
    if (num(ci.exercise) != null) add("exercise", { v: num(ci.exercise) });
  }
  return { rows: rows.filter((r) => r.date), skipped };
}

export const SAMPLE_CSV = `date,systolic,diastolic,heart_rate,glucose,temperature,sleep_hours,mood,exercise_min
2026-11-10,118,76,62,88,36.7,6.5,4,120
2026-11-11,121,78,64,92,36.8,5.75,3,95
2026-11-12,124,80,66,95,36.9,6.0,4,130
`;

export const SAMPLE_FHIR = JSON.stringify({
  resourceType: "Bundle", type: "collection",
  entry: [
    { resource: { resourceType: "Observation", status: "final", effectiveDateTime: "2026-11-12T07:15:00Z", code: { coding: [{ system: "http://loinc.org", code: "85354-9", display: "Blood pressure panel" }] },
      component: [
        { code: { coding: [{ system: "http://loinc.org", code: "8480-6" }] }, valueQuantity: { value: 126, unit: "mmHg" } },
        { code: { coding: [{ system: "http://loinc.org", code: "8462-4" }] }, valueQuantity: { value: 82, unit: "mmHg" } },
      ] } },
    { resource: { resourceType: "Observation", status: "final", effectiveDateTime: "2026-11-12T06:30:00Z", code: { coding: [{ system: "http://loinc.org", code: "8867-4" }] }, valueQuantity: { value: 63, unit: "/min" } } },
    { resource: { resourceType: "Observation", status: "final", effectiveDateTime: "2026-11-12T07:00:00Z", code: { coding: [{ system: "http://loinc.org", code: "2339-0" }] }, valueQuantity: { value: 5.2, unit: "mmol/L" } } },
    { resource: { resourceType: "Observation", status: "final", effectiveDateTime: "2026-11-12T06:45:00Z", code: { coding: [{ system: "http://loinc.org", code: "8310-5" }] }, valueQuantity: { value: 98.6, unit: "[degF]" } } },
  ],
}, null, 2);
