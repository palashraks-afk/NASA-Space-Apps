"""How often does a personal "usual range" built from the first B days falsely flag a later
healthy day? Real sleep diaries of 49 people (Baigutanova et al. 2025), 28 days each, no
intervention, so every flag on a later day is a false flag.

Range = the app's rule: mean of the first B days +/- t(0.975, B-1) * SD * sqrt(1 + 1/B)
(a 95% prediction interval). A correctly calibrated range flags about 5% of healthy days.
Also reported: the rate with the app's 3-day persistence rule for escalation (flag only when
3 consecutive days are outside), which is what reaches the "talk to the flight surgeon" level
for sleep.

Run from lab/: python -I scripts/study_baseline.py  -> ../analysis/baseline_false_flags.json
"""
import json, math, statistics
from pathlib import Path

def tq(df):  # 97.5% quantile of Student t, small table plus normal fallback
    table = {4: 2.776, 5: 2.571, 6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228, 11: 2.201, 12: 2.179, 13: 2.160, 14: 2.145, 15: 2.131, 16: 2.120, 17: 2.110, 18: 2.101, 19: 2.093, 20: 2.086, 21: 2.080}
    return table.get(df, 1.96 + 2.4 / df)

d = json.load(open("public/data/real_noise.json"))
out = {"source": "Baigutanova et al. 2025 sleep diaries, 49 people x 28 days", "rule": "95% prediction interval from the first B days", "results": {}}
for measure, block in d["deviations"].items():
    res = {}
    for B in (7, 10, 14, 21):
        rates, persist = [], []
        for p in block["people"]:
            x = [p["mean"] + v for v in p["devs"] if v is not None]
            if len(x) < B + 5:
                continue
            base, test = x[:B], x[B:]
            m, sd = statistics.mean(base), statistics.stdev(base)
            h = tq(B - 1) * sd * math.sqrt(1 + 1 / B)
            out_days = [abs(v - m) > h for v in test]
            rates.append(sum(out_days) / len(test))
            runs = sum(1 for i in range(2, len(out_days)) if out_days[i] and out_days[i - 1] and out_days[i - 2])
            persist.append(runs / max(1, len(test) - 2))
        res[B] = {"people": len(rates), "median_false_flag_rate": round(statistics.median(rates), 3), "mean_false_flag_rate": round(statistics.mean(rates), 3),
                  "people_over_15pct": sum(r > 0.15 for r in rates), "three_day_run_rate": round(statistics.mean(persist), 4)}
    out["results"][measure] = res
Path("../analysis/baseline_false_flags.json").write_text(json.dumps(out, indent=2))
for k, v in out["results"].items():
    print(k)
    for B, r in v.items():
        print(f"  B={B:>2}: mean false flags {r['mean_false_flag_rate']:.1%}, median {r['median_false_flag_rate']:.1%}, >15% for {r['people_over_15pct']}/{r['people']} people, 3-day runs {r['three_day_run_rate']:.2%}")
