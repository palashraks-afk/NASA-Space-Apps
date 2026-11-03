# Instruments: how each one works, part by part

Generated from `lab/src/sim/instruments.js` (the same data the Instruments tab draws as exploded blueprints). Each entry names the real ISS hardware, or the reference class of device, then breaks the device into parts and what each part does.

These are teaching diagrams of how each class of device works, not engineering drawings of the flight units; flight blueprints are not public.

## Contents

- [Blood pressure monitor](#blood-pressure-monitor)
- [Pulse oximeter](#pulse-oximeter)
- [Blood glucose meter](#blood-glucose-meter)
- [Smart-garment monitor](#smart-garment-monitor)
- [Radiation dosimeter (telescope)](#radiation-dosimeter-telescope)
- [CO2 removal assembly](#co2-removal-assembly)
- [Treadmill with harness](#treadmill-with-harness)

## Blood pressure monitor

| | |
|---|---|
| On the ISS | ISS: CDL Halter Arterial Blood Pressure Unit (named in NASA ISS daily reports) |
| Agency | NASA / ESA |
| Measures | Systolic and diastolic blood pressure, pulse |
| Feeds | bp, hr |
| Data path | Imported from a device file (CSV or FHIR) in the Instruments tab |

**How it works.** An inflatable cuff squeezes the upper arm until blood flow stops, then lets air out slowly. A pressure sensor records the small oscillations in cuff pressure as flow returns; the device turns their pattern into systolic and diastolic values.

| # | Part | What it does |
|---|---|---|
| 1 | Cuff bladder | Inflates around the upper arm to stop and release blood flow |
| 2 | Air hose | Carries air between pump and cuff; transmits pressure pulses |
| 3 | Pump | Inflates the cuff |
| 4 | Release valve | Lets air out at a steady rate |
| 5 | Pressure sensor | Measures cuff pressure and its pulse oscillations |
| 6 | Processor and display | Turns the oscillation pattern into readings; shows them |
| 7 | Battery | Power; flight units use certified cells |

## Pulse oximeter

| | |
|---|---|
| On the ISS | ISS medical kit; also built into CSA's Bio-Monitor headband |
| Agency | NASA / CSA |
| Measures | Blood oxygen saturation, pulse rate |
| Feeds | hr |
| Data path | Imported from a device file (CSV or FHIR) in the Instruments tab |

**How it works.** Two LEDs shine red and infrared light through a fingertip. Oxygen-rich and oxygen-poor blood absorb the two colours differently; a light sensor on the other side measures how much gets through with each heartbeat.

| # | Part | What it does |
|---|---|---|
| 1 | Upper clip housing | Holds the LEDs against the nail |
| 2 | Red and infrared LEDs | Emit light at about 660 nm and 940 nm |
| 3 | Fingertip | Pulsing blood changes how much light passes |
| 4 | Photodiode | Measures light that passes through |
| 5 | Lower clip and spring | Keeps steady pressure on the finger |
| 6 | Processor and display | Computes saturation from the red/infrared ratio |

## Blood glucose meter

| | |
|---|---|
| On the ISS | Reference design: the finger-stick meter class used in clinics |
| Agency | Commercial |
| Measures | Blood sugar (mg/dL) |
| Feeds | glucose |
| Data path | Imported from a device file (CSV or FHIR) in the Instruments tab |

**How it works.** A drop of blood wicks onto a test strip. An enzyme on the strip reacts with glucose and produces a tiny electric current between electrodes; the current is proportional to the glucose level.

| # | Part | What it does |
|---|---|---|
| 1 | Lancet | Makes a small finger prick for a drop of blood |
| 2 | Test strip | Carries the blood to the reaction area |
| 3 | Enzyme layer | Glucose oxidase or dehydrogenase reacts with glucose |
| 4 | Electrodes | Measure the current the reaction produces |
| 5 | Strip port | Connects the strip to the meter |
| 6 | Meter body and display | Converts current to mg/dL; stores readings |

## Smart-garment monitor

| | |
|---|---|
| On the ISS | ISS: Astroskin, part of the Canadian Space Agency's Bio-Monitor (shirt plus headband) |
| Agency | CSA |
| Measures | ECG heart rhythm, breathing, oxygen saturation, skin temperature, activity |
| Feeds | hr, temp, sleep |
| Data path | Imported from a device file (CSV or FHIR) in the Instruments tab |

**How it works.** Sensors woven into a close-fitting shirt and a headband record the heart's electrical signal, chest movement from breathing, skin temperature and movement through the day and night. A small recorder stores the data for the crew and the ground.

| # | Part | What it does |
|---|---|---|
| 1 | Garment | Holds sensors in place against the body |
| 2 | ECG electrodes | Record the heart's electrical activity |
| 3 | Breathing bands | Stretch sensors that follow chest and belly movement |
| 4 | Headband oximeter | Oxygen saturation at the forehead |
| 5 | Skin temperature sensor | Temperature at the skin surface |
| 6 | Accelerometer | Movement, posture and sleep periods |
| 7 | Recorder | Stores and sends the data |

## Radiation dosimeter (telescope)

| | |
|---|---|
| On the ISS | ISS: DOSTEL, the DLR DOSimetry TELescope in the Columbus module |
| Agency | DLR / ESA |
| Measures | Absorbed dose rate and particle flux |
| Feeds | radiation |
| Data path | Loaded from a public NASA dataset |

**How it works.** Two flat silicon detectors sit one behind the other. A charged particle passing through leaves a small burst of charge in each; the energy deposited gives the dose, and hits in both detectors at once mark particles crossing the telescope.

| # | Part | What it does |
|---|---|---|
| 1 | Housing | Light-tight, shielded case |
| 2 | Front silicon detector | Records energy deposited by each particle |
| 3 | Rear silicon detector | A matching hit marks a particle crossing both |
| 4 | Spacer | Fixes the gap that defines the viewing angle |
| 5 | Preamplifiers | Amplify the tiny charge pulses |
| 6 | Data electronics | Sort pulses by energy, compute dose, send data |

## CO2 removal assembly

| | |
|---|---|
| On the ISS | ISS: Carbon Dioxide Removal Assembly (CDRA) |
| Agency | NASA |
| Measures | Removes CO2 from cabin air (cabin CO2 is measured separately by the station's analysers) |
| Feeds | air |
| Data path | Loaded from a public NASA dataset |

**How it works.** A fan pushes cabin air through a bed that first dries it, then through a zeolite bed that traps CO2. Two sets of beds take turns: while one absorbs, the other is heated and exposed to space vacuum to release its CO2. The dried air's water is returned.

| # | Part | What it does |
|---|---|---|
| 1 | Blower | Moves cabin air through the beds |
| 2 | Desiccant bed A | Removes water before the CO2 bed |
| 3 | Desiccant bed B | Same, used in the other half-cycle |
| 4 | Zeolite CO2 bed A | Traps CO2 molecules in its pores |
| 5 | Zeolite CO2 bed B | Heated and vented to space to release CO2 |
| 6 | Switching valves | Swap which beds absorb and which regenerate |
| 7 | Heaters | Warm the regenerating bed to drive off CO2 |
| 8 | Vent to space | CO2 leaves the station, or goes to the Sabatier reactor |

## Treadmill with harness

| | |
|---|---|
| On the ISS | ISS: T2 treadmill (installed 2010, top speed 12 mph) |
| Agency | NASA |
| Measures | Exercise time, speed, harness load |
| Feeds | exercise |
| Data path | Imported from a device file (CSV or FHIR) in the Instruments tab |

**How it works.** In weightlessness the runner would float off, so a harness and bungee or motor system pulls them down onto the belt. A vibration-isolation system keeps the running forces from shaking the station.

| # | Part | What it does |
|---|---|---|
| 1 | Running belt | Moving surface the crew member runs on |
| 2 | Deck and motor | Drives the belt |
| 3 | Harness | Worn by the crew member; takes the pull-down load |
| 4 | Load straps | Pull the runner onto the belt (a fraction of body weight) |
| 5 | Vibration isolation | Springs and dampers that keep forces off the station |
| 6 | Control panel | Speed, time and load |

## Universal import

Any device that can export **CSV** or a **FHIR R4 Bundle** of Observations can feed the daily check-in (Instruments tab, "Import readings from any device"). The newest date in the file lands on the current mission day; earlier dates fall on earlier days. Values outside the check-in limits are skipped and counted.

**CSV columns** (any order, header names are flexible): `date`, `systolic`, `diastolic`, `heart_rate`, `glucose` (mg/dL) or `glucose_mmol`, `temperature` (°C) or `temp_f`, `sleep_hours`, `mood` (1 to 5), `exercise_min`.

**FHIR LOINC codes**:

| LOINC | Reading |
|---|---|
| 8480-6 | Systolic blood pressure |
| 8462-4 | Diastolic blood pressure |
| 8867-4 | Heart rate |
| 2339-0 | Glucose in blood (mass/volume) |
| 1558-6 | Fasting glucose (serum/plasma) |
| 8310-5 | Body temperature |
| 93832-4 | Sleep duration |

Units converted on import: mmol/L to mg/dL (x 18.016), °F to °C, sleep minutes to hours. Blood pressure panels (LOINC 85354-9) are read from their components.

Sample files: the Instruments tab offers a sample CSV and a sample FHIR bundle to download and re-import.

## Sources

- Blood pressure unit: NASA ISS Daily Summary Report, 15 Oct 2021 (CDL Halter Arterial Blood Pressure Unit, ECHO ultrasound).
- Bio-Monitor and Astroskin: Canadian Space Agency.
- DOSTEL: DLR; data via NASA OSDR RadLab.
- T2 treadmill (installed Oct 2010, 12 mph), ARED, CEVIS: NASA technical reports on ISS exercise hardware (NTRS 20130009882, 20160012791).
- CDRA: NASA descriptions of the ISS Environmental Control and Life Support System.
- FHIR R4 (HL7) and LOINC (Regenstrief Institute) for the import format.
