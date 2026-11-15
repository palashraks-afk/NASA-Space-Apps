"""Study 5 (exploratory): can a model learned from other people predict a person's next night
better than their own running average, and does that make the personal usual range sharper?

Data: real sleep diaries, 49 people x 28 days (Baigutanova et al. 2025, CC BY), as stored in
public/data/real_noise.json (per-person mean and daily deviations).

Forecasters for night t, using only nights before t:
  mean     : the person's running mean (what the app's usual range is centred on)
  last     : last night's value
  ridge    : ridge regression on [last night, mean of last 3, running mean, running SD],
             trained on the other 48 people (leave-one-person-out), features centred on the
             person's running mean so the model learns how people move, not their level
  gbm      : gradient-boosted trees on the same features, same leave-one-person-out training
Scored on nights 8 to 28 by mean absolute error. Then the usual range: centre on the
forecast, half-width from the person's own running spread of forecast errors, and count how
often a healthy night falls outside (the false-flag rate), as in Study 4.

Run from lab/: python -I scripts/study_forecast.py  -> ../analysis/forecast_study.json
"""
import json, math
from pathlib import Path
import numpy as np
from sklearn.linear_model import RidgeCV
from sklearn.ensemble import HistGradientBoostingRegressor

d = json.load(open("public/data/real_noise.json"))
START = 7
out = {"source": "Baigutanova et al. 2025 sleep diaries", "design": "leave-one-person-out; nights 8-28 scored", "results": {}}


def series(block):
    people = []
    for p in block["people"]:
        x = [p["mean"] + v if v is not None else None for v in p["devs"]]
        if sum(v is not None for v in x) >= 20:
            people.append(np.array([np.nan if v is None else v for v in x], dtype=float))
    return people


def feats(x, t):
    h = x[:t][~np.isnan(x[:t])]
    if len(h) < 4 or np.isnan(x[t]):
        return None
    m = h.mean()
    last = h[-1] - m
    last3 = h[-3:].mean() - m
    return [last, last3, h.std(ddof=1), len(h)], m


for measure, block in d["deviations"].items():
    people = series(block)
    rows = []  # (person, t, features, running mean, truth, last)
    for i, x in enumerate(people):
        for t in range(START, len(x)):
            f = feats(x, t)
            if f:
                rows.append((i, t, f[0], f[1], x[t], x[:t][~np.isnan(x[:t])][-1]))
    P = np.array([r[0] for r in rows]); X = np.array([r[2] for r in rows]); M = np.array([r[3] for r in rows])
    Y = np.array([r[4] for r in rows]); L = np.array([r[5] for r in rows]); T = np.array([r[1] for r in rows])
    pred = {"mean": M.copy(), "last": L.copy(), "ridge": np.zeros(len(rows)), "gbm": np.zeros(len(rows))}
    for i in range(len(people)):
        te, tr = P == i, P != i
        if not te.any():
            continue
        r = RidgeCV(alphas=np.logspace(-2, 3, 12)).fit(X[tr], Y[tr] - M[tr])
        pred["ridge"][te] = M[te] + r.predict(X[te])
        g = HistGradientBoostingRegressor(max_depth=3, max_iter=150, learning_rate=0.05, min_samples_leaf=20, random_state=0).fit(X[tr], Y[tr] - M[tr])
        pred["gbm"][te] = M[te] + g.predict(X[te])
    mae = {k: float(np.mean(np.abs(v - Y))) for k, v in pred.items()}
    # Paired bootstrap over people: is the ridge model really better than the running mean?
    rng = np.random.default_rng(0)
    per = {k: np.array([np.mean(np.abs(pred[k][P == i] - Y[P == i])) for i in range(len(people)) if (P == i).any()]) for k in pred}
    diffs = []
    for _ in range(4000):
        s = rng.integers(0, len(per["mean"]), len(per["mean"]))
        diffs.append(per["mean"][s].mean() - per["ridge"][s].mean())
    lo, hi = np.percentile(diffs, [2.5, 97.5])
    # Usual-range false flags: 95% interval from the person's own past forecast errors.
    flags = {}
    for k in ("mean", "ridge"):
        n_out = n = 0
        for i in range(len(people)):
            idx = np.where(P == i)[0]
            errs = []
            for j in idx:
                if len(errs) >= 5:
                    sd = np.std(errs, ddof=1)
                    n += 1
                    n_out += abs(Y[j] - pred[k][j]) > 2.0 * sd * math.sqrt(1 + 1 / len(errs))
                errs.append(Y[j] - pred[k][j])
        flags[k] = round(float(n_out / max(n, 1)), 4)
    out["results"][measure] = {
        "people": len(people), "nights_scored": int(len(rows)),
        "mae": {k: round(v, 4) for k, v in mae.items()},
        "ridge_gain_vs_mean": round(1 - mae["ridge"] / mae["mean"], 4),
        "ridge_minus_mean_mae_95ci_by_person": [round(float(-hi), 4), round(float(-lo), 4)],
        "false_flag_rate_single_night": flags,
    }
    print(measure, out["results"][measure])

Path("../analysis/forecast_study.json").write_text(json.dumps(out, indent=2))
