import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { loadOutcomes } from "./presets.js";
import { recommendDesign, drawMysteryEffect, buildMission, analyseDay, truthLabel } from "./mission.js";

const real = JSON.parse(fs.readFileSync(new URL("../../public/data/real_noise.json", import.meta.url)));
const outcomes = loadOutcomes(real);

describe("presets from real data", () => {
  it("every outcome has a positive real spread and a bounded autocorrelation", () => {
    for (const o of Object.values(outcomes)) {
      expect(o.sd).toBeGreaterThan(0);
      expect(o.rho).toBeGreaterThanOrEqual(0);
      expect(o.rho).toBeLessThan(0.9);
    }
    expect(outcomes.sleep_duration.sd).toBeCloseTo(1.339, 2);
  });
});

describe("real-data replay", () => {
  it("uses the real diary as noise and adds the effect only through the schedule", () => {
    const series = real.example_person.series.map((r) => r.sleep_duration);
    const o = outcomes.sleep_duration;
    const zero = buildMission({ seed: 9, days: 56, outcome: o, design: recommendDesign("day"), trueEffect: 0, baseSeries: series });
    expect(zero.days).toBe(series.length);
    zero.values.forEach((v, i) => expect(v).toBeCloseTo(series[i], 10));
    const plus = buildMission({ seed: 9, days: 56, outcome: o, design: recommendDesign("day"), trueEffect: 0.5, baseSeries: series });
    plus.schedule.forEach((d, i) => expect(plus.values[i] - series[i]).toBeCloseTo(d.arm ? 0.5 : 0, 10));
  });
});

describe("mission", () => {
  it("recommends daily randomization for fast effects and blocks for slow ones", () => {
    expect(recommendDesign("day").blockLen).toBe(1);
    expect(recommendDesign("days").washout).toBe(2);
  });
  it("mystery effects cover null, helpful and harmful cases", () => {
    const labels = { works: 0, none: 0, harms: 0, inconclusive: 0 };
    for (let s = 1; s <= 2000; s++) {
      const e = drawMysteryEffect(s, 1);
      labels[e >= 1 ? "works" : e <= -1 ? "harms" : Math.abs(e) < 1 ? "none" : "inconclusive"]++;
    }
    expect(labels.works).toBeGreaterThan(800);
    expect(labels.none).toBeGreaterThan(500);
    expect(labels.harms).toBeGreaterThan(150);
  });
  it("runs a full mission and produces coherent probabilities each day", () => {
    const o = outcomes.sleep_latency;
    const m = buildMission({ seed: 3, days: 56, outcome: o, design: recommendDesign("day"), trueEffect: 2 * o.delta });
    expect(m.values.length).toBe(56);
    // values come from real people's diaries, so they stay within physical limits
    m.values.forEach((v) => { expect(v).toBeGreaterThanOrEqual(1); expect(v).toBeLessThanOrEqual(600); });
    let last;
    for (let d = 7; d <= 56; d++) {
      last = analyseDay(m, d, o.delta, 0.95);
      const s = last.v.pWork + last.v.pNone + last.v.pHarm;
      expect(s).toBeGreaterThan(0.999);
      expect(s).toBeLessThan(1.001);
    }
    expect(truthLabel(m, o.delta)).toBe("works");
    expect(last.mean).toBeGreaterThan(0);
  });
});
