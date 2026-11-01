"""Derive real day-to-day noise for candidate self-experiment outcomes.

Source: "In-situ wearable-based dataset of continuous heart rate variability monitoring
accompanied by sleep diaries" (Baigutanova et al., Scientific Data 2025), Figshare
doi 10.6084/m9.figshare.28509740, CC BY. 49 healthy adults, about four weeks.

For each person and outcome: within-person SD and lag-1 autocorrelation over consecutive
days. Output: public/data/real_noise.json (summary across people) and one example person's
series for the in-app replay. Run from lab/: python scripts/derive_noise.py
"""
import json
import numpy as np
import pandas as pd

RAW = "data-raw/"
LOCAL_TZ_OFFSET_H = 9  # data collected in South Korea (KAIST); timestamps are UTC epoch ms

def ar1(x):
    x = np.asarray(x, float)
    if len(x) < 8:
        return np.nan
    x = x - x.mean()
    den = (x[:-1] ** 2).sum()
    return float((x[1:] * x[:-1]).sum() / den) if den > 0 else np.nan

def person_stats(df, col):
    out = []
    for pid, g in df.groupby("pid"):
        g = g.sort_values("date").dropna(subset=[col])
        if len(g) < 14:
            continue
        # lag-1 only across consecutive calendar days
        d = pd.to_datetime(g["date"]).values
        v = g[col].values
        consec = np.diff(d).astype("timedelta64[D]").astype(int) == 1
        xs = v - v.mean()
        num = (xs[1:] * xs[:-1])[consec].sum()
        den = (xs[:-1] ** 2)[consec].sum()
        rho = num / den if den > 0 and consec.sum() >= 8 else np.nan
        out.append({"pid": pid, "n_days": int(len(g)), "mean": float(v.mean()), "sd": float(v.std(ddof=1)), "rho": float(rho)})
    return pd.DataFrame(out)

def summarise(ps, unit, label):
    q = lambda s, p: float(np.nanpercentile(s, p))
    return {
        "label": label, "unit": unit, "people": int(len(ps)),
        "median_days_per_person": float(ps["n_days"].median()),
        "within_person_sd": {"p25": q(ps.sd, 25), "median": q(ps.sd, 50), "p75": q(ps.sd, 75)},
        "lag1_autocorrelation": {"p25": q(ps.rho, 25), "median": q(ps.rho, 50), "p75": q(ps.rho, 75)},
        "between_person_sd_of_means": float(ps["mean"].std(ddof=1)),
    }

# Sleep diary outcomes
sd = pd.read_csv(RAW + "sleep_diary.csv")
sd = sd.rename(columns={"userId": "pid"})
results = {}
for col, unit, label in [("sleep_duration", "h", "Sleep duration"), ("sleep_efficiency", "fraction", "Sleep efficiency"),
                         ("sleep_latency", "h", "Time to fall asleep")]:
    results[col] = summarise(person_stats(sd, col), unit, label)

# Real day-to-day deviations (value minus that person's own mean) for the sleep outcomes,
# used by the app to simulate realistic, skewed, physically bounded daily values.
deviations = {}
for col in ["sleep_duration", "sleep_efficiency", "sleep_latency"]:
    people_list = []
    for pid, g in sd.groupby("pid"):
        v = g[col].dropna().values
        if len(v) < 14:
            continue
        people_list.append({"mean": round(float(v.mean()), 4), "devs": (v - v.mean()).round(4).tolist()})
    deviations[col] = {"people": people_list}

# Wearable: the filtered 5-minute segments are mostly daytime (few overnight), so the
# outcomes are daily medians over whatever segments exist that day (at least 10), not
# overnight measures. Steps are dropped: filtered segments would undercount them.
# A few timestamps fall in 2018, outside the 2021 study window (device clock errors); dropped.
hrv = pd.read_csv(RAW + "sensor_hrv_filtered.csv", usecols=["deviceId", "ts_start", "HR", "rmssd", "missingness_score"])
t = pd.to_datetime(hrv["ts_start"], unit="ms") + pd.Timedelta(hours=LOCAL_TZ_OFFSET_H)
hrv = hrv[(t >= "2021-01-01").values]
t = t[t >= "2021-01-01"]
hrv["date"] = t.dt.date.astype(str).values
daily = hrv.groupby(["deviceId", "date"]).agg(rmssd=("rmssd", "median"), hr=("HR", "median"), n=("HR", "size")).reset_index()
daily = daily[daily["n"] >= 10].rename(columns={"deviceId": "pid"})
results["day_rmssd"] = summarise(person_stats(daily, "rmssd"), "ms", "Daily heart rate variability (median RMSSD, daytime-weighted)")
results["day_hr"] = summarise(person_stats(daily, "hr"), "bpm", "Daily median heart rate (daytime-weighted)")

# One example person for the replay: the sleep-diary participant with the most consecutive days
ps = person_stats(sd, "sleep_efficiency").sort_values("n_days", ascending=False)
ex = ps.iloc[0]["pid"]
ex_series = sd[sd["pid"] == ex].sort_values("date")[["date", "sleep_duration", "sleep_efficiency"]].dropna()

out = {
    "source": "Baigutanova et al. 2025, Scientific Data; Figshare doi 10.6084/m9.figshare.28509740 (CC BY 4.0). 49 healthy adults, about 4 weeks.",
    "method": "Per person: SD and lag-1 autocorrelation over consecutive days (people with at least 14 days). Wearable outcomes are daily medians over available filtered 5-minute segments (at least 10 per day); they are daytime-weighted because few overnight segments exist.",
    "outcomes": results,
    "example_person": {"id": "participant A (anonymised)", "series": ex_series.to_dict(orient="records")},
    "deviations": deviations,
}
with open("public/data/real_noise.json", "w") as f:
    json.dump(out, f, indent=1, default=float)

for k, v in results.items():
    print(f"{v['label']:<42} people {v['people']:>3}  sd median {v['within_person_sd']['median']:.3f} {v['unit']:<8} rho median {v['lag1_autocorrelation']['median']:.2f} (IQR {v['lag1_autocorrelation']['p25']:.2f} to {v['lag1_autocorrelation']['p75']:.2f})")
print("example person:", ex, len(ex_series), "days")
