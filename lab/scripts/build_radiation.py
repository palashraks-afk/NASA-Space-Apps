"""Real radiation on the ISS from NASA OSDR RadLab: DOSTEL-1 (DLR) absorbed dose rate,
January to mid-April 2022, with the station's position at each reading.

Download (not committed): lab/data-raw/radlab/dostel_2022_MM.csv, from
https://visualization.osdr.nasa.gov/radlab/api/?spacecraft=ISS&instrument=DosTel1&timestamp>=...&absorbed_dose_rate&latitude&longitude&altitude&format=csv
Output: lab/public/data/radiation.json
  daily: absorbed dose per day (uGy/day), from the time-weighted mean rate on days with
         at least 20 hours of coverage
  grid:  mean dose rate (uGy/h) in 6 x 6 degree cells, for the map on the globe
  track: one orbit-day of readings (lat, lon, rate) to animate along the orbit
Run from lab/: python -I scripts/build_radiation.py
"""
import csv, json, math
from datetime import datetime
from pathlib import Path

RAW = Path("data-raw/radlab")
rows = []
for f in sorted(RAW.glob("dostel_2022_*.csv")):
    for r in csv.DictReader(open(f, encoding="utf-8")):
        try:
            t = datetime.fromisoformat(r["timestamp"])
            rows.append((t, float(r["absorbed_dose_rate"]), float(r["latitude"]), float(r["longitude"])))
        except (ValueError, KeyError):
            pass
rows.sort()
print("readings", len(rows), rows[0][0], rows[-1][0])

# Daily dose: integrate rate over time, capping gaps at 10 minutes so outages are not filled.
daily = {}
for (t0, r0, *_), (t1, r1, *_) in zip(rows, rows[1:]):
    dt = (t1 - t0).total_seconds() / 3600
    if dt <= 0 or dt > 10 / 60:
        continue
    d = daily.setdefault(t0.date().isoformat(), [0.0, 0.0])
    d[0] += 0.5 * (r0 + r1) * dt
    d[1] += dt
days = [{"date": k, "dose": round(v[0] / v[1] * 24, 1), "hours": round(v[1], 1)} for k, v in sorted(daily.items()) if v[1] >= 20]

# Map grid.
G = 6
cells = {}
for _, r, lat, lon in rows:
    k = (int((lat + 90) // G), int((lon + 180) // G) % (360 // G))
    c = cells.setdefault(k, [0.0, 0])
    c[0] += r
    c[1] += 1
grid = [[i * G - 90 + G / 2, j * G - 180 + G / 2, round(s / n, 2)] for (i, j), (s, n) in sorted(cells.items()) if n >= 3]

# South Atlantic Anomaly: readings above 20 uGy/h inside 50 S to 0, 90 W to 40 E. Share of
# all dose collected there, time-weighted with the same gap cap.
in_saa = lambda lat, lon, r: r > 20 and -50 <= lat <= 0 and -90 <= lon <= 40
tot = saa_dose = saa_h = 0.0
saa_by_day = {}
for (t0, r0, la, lo), (t1, r1, *_) in zip(rows, rows[1:]):
    dt = (t1 - t0).total_seconds() / 3600
    if dt <= 0 or dt > 10 / 60:
        continue
    dose = 0.5 * (r0 + r1) * dt
    tot += dose
    if in_saa(la, lo, r0):
        saa_dose += dose
        saa_h += dt
        saa_by_day[t0.date()] = saa_by_day.get(t0.date(), 0) + dt
covered_days = len(days)
saa = {"share": round(saa_dose / tot, 3), "minutes_per_day": round(saa_h * 60 / covered_days, 1)}

# One day of track, thinned to one point a minute: the day with the most time in the anomaly
# among days with full coverage, so the passes show on the globe.
full = {d["date"] for d in days if d["hours"] >= 23}
day0 = max((d for d in saa_by_day if d.isoformat() in full), key=lambda d: saa_by_day[d])
track, last = [], None
for t, r, lat, lon in rows:
    if t.date() != day0:
        continue
    if last is None or (t - last).total_seconds() >= 60 or r > 20:
        track.append([round((t - datetime.combine(day0, datetime.min.time())).total_seconds() / 3600, 4), round(lat, 2), round(lon, 2), round(r, 2)])
        last = t

# Dose by module: the REM detectors log one daily-average rate per unit, in six US-segment
# modules over the same days of Dec 2019 (lab/data-raw/radlab/modules_2019-12-*.csv), so the
# modules can be compared on one instrument type.
mods = {}
for f in sorted(RAW.glob("modules_2019-12-*.csv")):
    for r in csv.DictReader(open(f, encoding="utf-8")):
        if r["instrument"] != "REM":
            continue
        try:
            mods.setdefault(r["module"], []).append(float(r["absorbed_dose_rate"]) * 24)
        except ValueError:
            pass
modules = sorted(({"module": m, "dose": round(sum(v) / len(v), 1), "days": len(v)} for m, v in mods.items()), key=lambda x: x["dose"])

out = {
    "source": "NASA OSDR RadLab; DOSTEL-1 (DLR, DOSIS 3D) absorbed dose rate in silicon, ISS Columbus module, Jan to Apr 2022.",
    "unit_rate": "uGy/h", "unit_daily": "uGy/day",
    "saa": saa, "modules": modules,
    "modules_source": "NASA OSDR RadLab, REM detectors, daily average absorbed dose, Dec 2019.",
    "daily": days, "grid": grid, "track_date": day0.isoformat(), "track": track,
}
Path("public/data/radiation.json").write_text(json.dumps(out, separators=(",", ":")), encoding="utf-8")
ds = [d["dose"] for d in days]
print("modules", modules)
print("days", len(days), "daily dose min/median/max", min(ds), sorted(ds)[len(ds) // 2], max(ds), "grid", len(grid), "track", len(track), day0, "saa", saa)
