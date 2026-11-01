"""Monte Carlo: can Earth reference ranges and personal baselines see real spaceflight shifts?

Inputs are published numbers, not fitted to anything here:
  - Biological variation (CVA analytical, CVI within-subject, CVG between-subject, %):
    Coskun et al., Clin Chem Lab Med 2018, doi 10.1515/cclm-2017-1155, Tables 1-2,
    FEMALE rows (30 healthy adults, weekly x10, Sysmex XN 3000).
  - In-flight mean shifts: Kunz et al., BMC Hematology 2017, PMC5590186
    (31 ISS crew; baseline L-180, early/mid/late in flight, landing day).

Assumptions (all labelled in the report): analytes independent; proportional noise;
in-flight within-person variance equals ground variance unless the inflation factor
f says otherwise; every person gets the same mean percentage shift; ground-based
healthy young adults. The simulation reports what the rules do under these assumptions.
It is not a measurement of astronauts.
"""
import json
import numpy as np
from scipy import stats

rng = np.random.default_rng(20261101)

# name: (CVA, CVI, CVG) percent, female rows
BV = {
    "Erythrocytes": (0.66, 2.77, 6.98),
    "Hemoglobin": (0.58, 2.74, 6.57),
    "Hematocrit": (0.63, 2.82, 5.51),
    "MCH": (0.78, 0.75, 6.11),
    "MCHC": (0.79, 0.97, 1.59),
    "MCV": (0.18, 0.72, 3.96),
    "RDW-SD": (0.57, 1.65, 7.62),
    "RBC-He": (0.65, 2.65, 5.95),
    "Reticulocytes": (4.45, 10.83, 25.77),
    "RET-He": (0.79, 3.40, 6.59),
    "Leukocytes": (1.49, 12.82, 16.53),
    "Lymphocytes": (2.40, 9.81, 20.36),
    "Monocytes": (4.95, 15.33, 29.78),
    "Neutrophils": (1.88, 20.09, 27.81),
    "Eosinophils": (11.01, 14.83, 70.5),
    "Basophils": (16.65, 11.36, 22.10),
    "Platelets": (1.80, 7.22, 17.42),
    "PDW": (3.28, 3.69, 15.86),
    "Plateletcrit": (2.57, 6.45, 15.72),
    "MPV": (1.13, 2.24, 8.46),
    "P-LCR": (2.83, 6.60, 24.42),
}

# Real in-flight mean shifts (Kunz 2017, means from the Results text): percent change vs L-180
SHIFTS = {
    "Erythrocytes, early flight": ("Erythrocytes", (4.8 - 4.4) / 4.4 * 100),
    "Erythrocytes, late flight": ("Erythrocytes", (4.7 - 4.4) / 4.4 * 100),
    "Hemoglobin, early flight": ("Hemoglobin", (15.0 - 14.1) / 14.1 * 100),
    "Hemoglobin, landing day": ("Hemoglobin", (13.5 - 14.1) / 14.1 * 100),
    "MCH, late flight": ("MCH", (31.3 - 31.7) / 31.7 * 100),
}

N = 200_000
ALPHA = 0.05
NU = 4  # prior strength (pseudo-observations) for variance shrinkage toward the literature value


def sig(cv):
    """log-scale sd for a lognormal with the given coefficient of variation"""
    return np.sqrt(np.log1p(cv**2))


def params(analyte):
    cva, cvi, cvg = [v / 100 for v in BV[analyte]]
    return sig(np.sqrt(cva**2 + cvi**2)), sig(cvg), sig(np.sqrt(cva**2 + cvi**2 + cvg**2))


def simulate(analyte, shift_pct, n, f=1.0, h=0.0, rules=("earth", "own_sd", "lit", "shrunk"), z=1.96):
    """Fraction of virtual people flagged, per rule. All work in log space.
    f: true in-flight within-person variability relative to published ground value.
    h: person-to-person heterogeneity of within-person sd (log-sd of the multiplier)."""
    sw, sg, stot = params(analyte)
    mu = sg * rng.standard_normal(N)                       # log set point
    mult = np.exp(h * rng.standard_normal(N) - h**2)       # E[mult^2] = 1
    sd_i = (f * sw * mult)[:, None]
    base = mu[:, None] + sd_i * rng.standard_normal((N, n))
    x = mu + np.log1p(shift_pct / 100) + sd_i[:, 0] * rng.standard_normal(N)
    m = base.mean(1)
    s = base.std(1, ddof=1)
    out = {}
    if "earth" in rules:
        out["earth"] = float((np.abs(x) > 1.96 * stot).mean())
    if "own_sd" in rules:
        thr = stats.t.ppf(1 - ALPHA / 2, n - 1) * s * np.sqrt(1 + 1 / n)
        out["own_sd"] = float((np.abs(x - m) > thr).mean())
    if "lit" in rules:
        out["lit"] = float((np.abs(x - m) > z * sw * np.sqrt(1 + 1 / n)).mean())
    if "shrunk" in rules:
        df = NU + n - 1
        s2 = (NU * sw**2 + (n - 1) * s**2) / df
        thr = stats.t.ppf(1 - ALPHA / 2, df) * np.sqrt(s2) * np.sqrt(1 + 1 / n)
        out["shrunk"] = float((np.abs(x - m) > thr).mean())
    return {k: round(v, 3) for k, v in out.items()}


R = {"assumptions": __doc__.strip().split("\n\n")[-1], "N_per_cell": N, "NU": NU}

# 1. Detection of real in-flight shifts (ground variability, homogeneous people)
R["detection_power"] = {
    label: {"analyte": an, "shift_pct": round(pct, 2),
            **{f"n={n}": simulate(an, pct, n) for n in (3, 5, 10)}}
    for label, (an, pct) in SHIFTS.items()
}

# 2. Null false-alarm rate when the in-flight variance assumption is wrong
scen = {"ground variance": (1.0, 0.0), "in-flight variance x1.5": (1.5, 0.0),
        "in-flight variance x2": (2.0, 0.0), "people differ (h=0.5)": (1.0, 0.5)}
R["false_alarm_null"] = {
    an: {sname: {f"n={n}": simulate(an, 0.0, n, f=f, h=h) for n in (3, 5, 10)}
         for sname, (f, h) in scen.items()}
    for an in ("Hemoglobin", "MCH", "Platelets")
}

# 3. Power of the rules for erythrocytes early flight under those same wrong-variance scenarios
R["power_under_scenarios_RBC_early"] = {
    sname: {f"n={n}": simulate("Erythrocytes", SHIFTS["Erythrocytes, early flight"][1], n, f=f, h=h)
            for n in (3, 5)}
    for sname, (f, h) in scen.items()
}

# 4. Panel false alarms per draw: k analytes, independent, null
names = list(BV)
R["panel_false_alarm_per_draw_n5"] = {}
for label in ("nominal", "bonferroni"):
    R["panel_false_alarm_per_draw_n5"][label] = {}
    for k in (1, 3, 5, 8, 12, 21):
        z = 1.96 if label == "nominal" else stats.norm.ppf(1 - ALPHA / 2 / k)
        alarms = {r: np.zeros(N, dtype=bool) for r in ("lit", "own_sd", "shrunk")}
        for an in names[:k]:
            sw, sg, _ = params(an)
            mu = sg * rng.standard_normal(N)
            base = mu[:, None] + sw * rng.standard_normal((N, 5))
            x = mu + sw * rng.standard_normal(N)
            m, s = base.mean(1), base.std(1, ddof=1)
            tz = z if label == "bonferroni" else None
            alarms["lit"] |= np.abs(x - m) > z * sw * np.sqrt(1.2)
            tq = stats.t.ppf(1 - (ALPHA / k if label == "bonferroni" else ALPHA) / 2, 4)
            alarms["own_sd"] |= np.abs(x - m) > tq * s * np.sqrt(1.2)
            df = NU + 4
            s2 = (NU * sw**2 + 4 * s**2) / df
            tq2 = stats.t.ppf(1 - (ALPHA / k if label == "bonferroni" else ALPHA) / 2, df)
            alarms["shrunk"] |= np.abs(x - m) > tq2 * np.sqrt(s2) * np.sqrt(1.2)
        R["panel_false_alarm_per_draw_n5"][label][f"k={k}"] = {r: round(float(a.mean()), 3) for r, a in alarms.items()}
R["panel_theory_independent_nominal"] = {f"k={k}": round(1 - (1 - ALPHA) ** k, 3) for k in (1, 3, 5, 8, 12, 21)}

# 5. Power paid for the false-alarm cap at k=21 (shrunk rule, n=5)
R["bonferroni_cost_shrunk_n5"] = {}
for label, (an, pct) in SHIFTS.items():
    sw, sg, _ = params(an)
    mu = sg * rng.standard_normal(N)
    base = mu[:, None] + sw * rng.standard_normal((N, 5))
    x = mu + np.log1p(pct / 100) + sw * rng.standard_normal(N)
    m, s = base.mean(1), base.std(1, ddof=1)
    df = NU + 4
    s2 = (NU * sw**2 + 4 * s**2) / df
    out = {}
    for lab, a in (("nominal", ALPHA), ("bonferroni_k21", ALPHA / 21)):
        out[lab] = round(float((np.abs(x - m) > stats.t.ppf(1 - a / 2, df) * np.sqrt(s2) * np.sqrt(1.2)).mean()), 3)
    R["bonferroni_cost_shrunk_n5"][label] = out

# 6. How many analytes can you watch? Power for the real shifts when the false-alarm cap is
#    5% per draw across k watched analytes (Bonferroni), literature-spread rule, n=5
R["power_vs_panel_size_bonferroni_lit_n5"] = {}
for label, (an, pct) in SHIFTS.items():
    sw, sg, _ = params(an)
    row = {}
    for k in (1, 2, 3, 5, 8, 12, 21):
        zk = stats.norm.ppf(1 - ALPHA / 2 / k)
        mu = sg * rng.standard_normal(N)
        base = mu[:, None] + sw * rng.standard_normal((N, 5))
        x = mu + np.log1p(pct / 100) + sw * rng.standard_normal(N)
        row[f"k={k}"] = round(float((np.abs(x - base.mean(1)) > zk * sw * np.sqrt(1.2)).mean()), 3)
    R["power_vs_panel_size_bonferroni_lit_n5"][label] = row

with open("analysis/results.json", "w") as fh:
    json.dump(R, fh, indent=2)

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

STYLE = {"earth": ("k", "--", "Earth reference range"), "own_sd": ("#d95f02", "-", "own baseline, own spread"),
         "lit": ("#7570b3", "-", "own baseline, literature spread"), "shrunk": ("#1b9e77", "-", "own baseline, spread shrunk to literature")}
fig, axes = plt.subplots(1, len(SHIFTS), figsize=(17, 3.5), sharey=True)
ns = list(range(2, 13))
for ax, (label, (an, pct)) in zip(axes, SHIFTS.items()):
    ser = {k: [] for k in STYLE}
    for n in ns:
        r = simulate(an, pct, n)
        for k in STYLE:
            ser[k].append(r[k])
    for k, (c, ls, lab) in STYLE.items():
        ax.plot(ns, ser[k], color=c, ls=ls, lw=2, label=lab)
    ax.set_title(f"{label} ({pct:+.1f}%)", fontsize=9)
    ax.set_xlabel("baseline draws"); ax.set_ylim(0, 1)
axes[0].set_ylabel("chance the real shift is flagged")
axes[0].legend(fontsize=6.5, loc="upper left")
fig.tight_layout(); fig.savefig("analysis/detection_vs_baseline.png", dpi=130)

fig2, ax = plt.subplots(figsize=(6.5, 3.6))
fs = [1.0, 1.25, 1.5, 1.75, 2.0]
for k in ("own_sd", "lit", "shrunk"):
    ax.plot(fs, [simulate("Hemoglobin", 0.0, 5, f=f)[k] for f in fs], color=STYLE[k][0], lw=2, label=STYLE[k][2])
ax.axhline(0.05, color="gray", ls=":")
ax.set_xlabel("true in-flight variability / ground variability"); ax.set_ylabel("false alarms per draw (no real shift)")
ax.legend(fontsize=7); fig2.tight_layout(); fig2.savefig("analysis/false_alarm_vs_variance_error.png", dpi=130)
print("done")
