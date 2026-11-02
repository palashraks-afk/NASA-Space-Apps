import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { buildCrewHealth, headacheRisk, usualRange, PREFLIGHT } from "./health.js";

const realNoise = JSON.parse(fs.readFileSync(new URL("../../public/data/real_noise.json", import.meta.url)));
const foods = JSON.parse(fs.readFileSync(new URL("../../public/data/foods.json", import.meta.url))).foods;
const H = buildCrewHealth({ realNoise, foods, days: 180 });

describe("crew health model", () => {
  it("reproduces the Law et al. 2014 headache curve", () => {
    expect(headacheRisk(2.5)).toBeCloseTo(0.01, 6);
    const o = (p) => p / (1 - p);
    expect(o(headacheRisk(3.5)) / o(headacheRisk(2.5))).toBeCloseTo(2, 6);
  });
  it("keeps values physically plausible", () => {
    for (const c of H.crew) {
      c.sleepLatency.forEach((v) => expect(v).toBeGreaterThan(0));
      c.sleepEfficiency.forEach((v) => { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(100); });
      c.hr.forEach((v) => { expect(v).toBeGreaterThan(35); expect(v).toBeLessThan(130); });
    }
    H.env.rh.forEach((v) => { expect(v).toBeGreaterThanOrEqual(25); expect(v).toBeLessThanOrEqual(75); });
    H.env.temp.forEach((v) => { expect(v).toBeGreaterThan(18); expect(v).toBeLessThan(27); });
  });
  it("raises core temperature by about 1 degC over 2.5 months, as reported in flight", () => {
    const c = H.crew[0];
    const pre = c.temp.slice(0, PREFLIGHT).reduce((a, b) => a + b, 0) / PREFLIGHT;
    const late = c.temp.slice(PREFLIGHT + 90, PREFLIGHT + 120).reduce((a, b) => a + b, 0) / 30;
    expect(late - pre).toBeGreaterThan(0.8);
    expect(late - pre).toBeLessThan(1.2);
  });
  it("gives each person a usual range from pre-flight days", () => {
    const r = usualRange(H.crew[1].hr);
    expect(r.n).toBe(PREFLIGHT);
    expect(r.lo).toBeLessThan(r.mean);
    expect(usualRange([1, 2, 3])).toBeNull();
  });
  it("produces daily meals with real nutrient totals", () => {
    const m = H.crew[2].meals[20];
    expect(m.items.length).toBe(14);
    expect(m.kcal).toBeGreaterThan(1200);
    expect(m.kcal).toBeLessThan(4000);
  });
});
