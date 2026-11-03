"""Real ISS cabin air from NASA OSDR's Environmental Data App (EDA): temperature, relative
humidity and CO2 logged every 5 minutes on the ISS during Rodent Research missions, 2014-2021.

Download (not committed): lab/data-raw/eda/tel_RR-<n>.json from
https://visualization.osdr.nasa.gov/eda/api/missions/RR-<n>/telemetry_data/
Output: lab/public/data/cabin.json, one row per day with full CO2 coverage:
  co2: daily mean CO2 in mmHg, peak1h: highest 1-hour mean that day, temp (degC), rh (%).
CO2 arrives in ppm; mmHg = ppm x 760 / 1e6, assuming the ISS's sea-level cabin pressure
(14.7 psi). Run from lab/: python -I scripts/build_cabin.py
"""
import json, glob, re
from collections import defaultdict
from datetime import datetime
from pathlib import Path

rows_out = []
dropped = {"flat": 0, "overlap": 0}
for f in sorted(glob.glob("data-raw/eda/tel_RR-*.json"), key=lambda p: int(re.search(r"RR-(\d+)", p).group(1))):
    mission = re.search(r"(RR-\d+)", f).group(1)
    data = json.load(open(f, encoding="utf-8"))
    days = defaultdict(list)
    for r in data:
        if r.get("co2_iss") is None:
            continue
        days[r["time"][:10]].append(r)
    for day, rs in sorted(days.items()):
        if len(rs) < 240:  # at least 20 h of 5-minute readings
            continue
        rs.sort(key=lambda r: r["time"])
        ts = [datetime.fromisoformat(r["time"].replace("Z", "+00:00")) for r in rs]
        mm = [r["co2_iss"] * 760 / 1e6 for r in rs]
        # Flat-lined sensor days (one value all day, e.g. 0.152 mmHg) are placeholders, not air.
        if max(mm) - min(mm) < 0.01:
            dropped["flat"] += 1
            continue
        peak = 0.0
        j = 0
        for i in range(len(rs)):  # rolling 1-hour mean
            while (ts[i] - ts[j]).total_seconds() > 3600:
                j += 1
            if (ts[i] - ts[0]).total_seconds() >= 3600:
                peak = max(peak, sum(mm[j:i + 1]) / (i - j + 1))
        tt = [r["temperature_iss"] for r in rs if r.get("temperature_iss") is not None]
        hh = [r["humidity_iss"] for r in rs if r.get("humidity_iss") is not None]
        rows_out.append({"date": day, "mission": mission, "co2": round(sum(mm) / len(mm), 3), "peak1h": round(peak, 3),
                         "n": len(rs), "temp": round(sum(tt) / len(tt), 2) if tt else None, "rh": round(sum(hh) / len(hh), 1) if hh else None})

# Missions overlap in time (RR-7 and RR-9 in Aug-Sep 2018) and their CO2 readings can
# disagree; keep one row per date, from the mission with the most readings that day.
best = {}
for r in rows_out:
    if r["date"] not in best or r["n"] > best[r["date"]]["n"]:
        if r["date"] in best:
            dropped["overlap"] += 1
        best[r["date"]] = r
    else:
        dropped["overlap"] += 1
rows_out = sorted(best.values(), key=lambda r: r["date"])
for r in rows_out:
    del r["n"]
out = {"source": "NASA OSDR Environmental Data App: ISS temperature, humidity and CO2 telemetry (5-minute readings) recorded during Rodent Research missions RR-1 to RR-23, 2014 to 2021.",
       "dropped": dropped, "daily": rows_out}
Path("public/data/cabin.json").write_text(json.dumps(out, separators=(",", ":")), encoding="utf-8")
co2 = sorted(r["co2"] for r in rows_out)
pk = [r["peak1h"] for r in rows_out]
print("days", len(rows_out), "missions", sorted({r["mission"] for r in rows_out}), "co2 mmHg median", co2[len(co2) // 2], "min", co2[0], "max", co2[-1], "days with 1h peak > 3:", sum(p > 3 for p in pk), "dropped", dropped)
