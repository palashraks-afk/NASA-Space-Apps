"""Real crew blood tests from the SpaceX Inspiration4 mission (2021, 3 days in orbit), from
NASA's Open Science Data Repository: OSD-569 (complete blood count) and OSD-575
(comprehensive metabolic panel). Four crew, seven draws each:
92, 44 and 3 days before launch, then 1, 45, 82 and 194 days after return.

Inputs (downloaded, not committed): lab/data-raw/osdr/{cbc,cmp}.csv
The OSD-575 multiplex cardiovascular panel was downloaded but left out: its values span
several orders of magnitude within one person (haptoglobin) and C-reactive protein reads
far above clinical norms, so it is not comparable with clinical ranges.
Output: lab/public/data/bloodwork.json
Run from lab/: python -I scripts/build_bloodwork.py
"""
import csv, json, re
from pathlib import Path

RAW = Path("data-raw/osdr")
TIMES = ["L-92", "L-44", "L-3", "R+1", "R+45", "R+82", "R+194"]
DAYS = [-92, -44, -3, 1, 45, 82, 194]

# Reference change values (%) from Coskun et al. 2018 (EuBIVAS, CBC only). Other analytes
# have no RCV here, so the app compares them with the lab range and the crew member's own
# pre-flight values only.
RCV = {"hemoglobin": 7.76, "white_blood_cell_count": 22.4, "absolute_lymphocytes": 28.0,
       "absolute_neutrophils": 32.5, "platelet_count": 20.6, "mcv": 2.06}

PANELS = [
    ("Blood count", "cbc.csv", [
        # The file labels hemoglobin as "percent", but its values (about 12 to 17) and range are g/dL.
        ("hemoglobin", "Hemoglobin", "value_percent", "g/dL"),
        ("hematocrit", "Hematocrit", "value_percent", "%"),
        ("red_blood_cell_count", "Red cells", None, "M/µL"),
        ("white_blood_cell_count", "White cells", None, "K/µL"),
        ("absolute_lymphocytes", "Lymphocytes", None, "cells/µL"),
        ("absolute_neutrophils", "Neutrophils", None, "cells/µL"),
        ("platelet_count", "Platelets", None, "K/µL"),
        ("mcv", "Red cell size (MCV)", None, "fL"),
    ]),
    ("Metabolic panel", "cmp.csv", [
        ("glucose", "Glucose", None, "mg/dL"),
        ("calcium", "Calcium", None, "mg/dL"),
        ("sodium", "Sodium", None, "mmol/L"),
        ("potassium", "Potassium", None, "mmol/L"),
        ("creatinine", "Creatinine", None, "mg/dL"),
        ("urea_nitrogen_bun", "Urea nitrogen", None, "mg/dL"),
        ("albumin", "Albumin", None, "g/dL"),
        ("alkaline_phosphatase", "Alkaline phosphatase", None, "U/L"),
        ("alt", "ALT (liver)", None, "U/L"),
        ("ast", "AST (liver)", None, "U/L"),
    ]),
]

def num(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return None

def main():
    crew = {}
    panels_out = []
    for title, fname, analytes in PANELS:
        rows = list(csv.DictReader(open(RAW / fname, encoding="utf-8-sig")))
        cols = list(rows[0].keys())
        panel = {"title": title, "analytes": []}
        for key, label, suffix, unit in analytes:
            vcol = next((c for c in cols if c.startswith(key + "_") and (c == f"{key}_{suffix}" if suffix else "_value" in c)), None)
            if vcol is None:
                raise SystemExit(f"missing column for {key} in {fname}")
            lo_col = vcol.replace("_value", "_range_min") if "_value" in vcol else None
            hi_col = vcol.replace("_value", "_range_max") if "_value" in vcol else None
            a = {"key": key, "label": label, "unit": unit, "rcv": RCV.get(key)}
            ref = None
            for r in rows:
                m = re.match(r"(C\d{3})_[^_]+_([LR][+-]\d+)", r["Sample Name"])
                if not m:
                    continue
                cid, tp = m.groups()
                if tp not in TIMES:
                    continue
                crew.setdefault(cid, {}).setdefault(key, [None] * len(TIMES))[TIMES.index(tp)] = num(r[vcol])
                if lo_col and ref is None:
                    lo = num(r.get(lo_col)) if lo_col in r else None
                    hi_alt = hi_col.replace("_range_max", "_max")  # ALT and AST use a different name
                    hi = num(r.get(hi_col)) if hi_col in r else num(r.get(hi_alt)) if hi_alt in r else None
                    if lo is not None or hi is not None:
                        ref = [lo, hi]
            a["ref"] = ref
            panel["analytes"].append(a)
        panels_out.append(panel)
    out = {
        "source": "NASA Open Science Data Repository, Inspiration4 (SpaceX, Sept 2021, 3 days in orbit): OSD-569 complete blood count, OSD-575 comprehensive metabolic panel. Crew identities are coded C001 to C004.",
        "timepoints": TIMES, "days": DAYS, "panels": panels_out,
        "crew": [{"id": cid, "values": vals} for cid, vals in sorted(crew.items())],
    }
    Path("public/data/bloodwork.json").write_text(json.dumps(out, separators=(",", ":")), encoding="utf-8")
    print("crew", len(crew), "analytes", sum(len(p["analytes"]) for p in panels_out))

main()
