import { describe, it, expect } from "vitest";
import fs from "node:fs";

const load = (f) => JSON.parse(fs.readFileSync(new URL(`../../public/data/${f}`, import.meta.url), "utf8"));

describe("real mission data files", () => {
  it("ISS radiation: daily absorbed dose in the published DOSTEL range", () => {
    const r = load("radiation.json");
    expect(r.daily.length).toBeGreaterThan(90);
    for (const d of r.daily) expect(d.dose).toBeGreaterThan(150), expect(d.dose).toBeLessThan(500);
    // hottest map cell sits in the South Atlantic Anomaly
    const top = [...r.grid].sort((a, b) => b[2] - a[2])[0];
    expect(top[0]).toBeLessThan(0);
    expect(top[1]).toBeGreaterThan(-90);
    expect(top[1]).toBeLessThan(0);
    expect(r.saa.share).toBeGreaterThan(0.3);
  });

  it("Inspiration4 bloodwork: four crew, seven draws, values inside physical bounds", () => {
    const b = load("bloodwork.json");
    expect(b.crew).toHaveLength(4);
    expect(b.timepoints).toEqual(["L-92", "L-44", "L-3", "R+1", "R+45", "R+82", "R+194"]);
    for (const c of b.crew) {
      expect(c.values.hemoglobin.filter((v) => v != null).every((v) => v > 8 && v < 20)).toBe(true);
      expect(c.values.sodium.filter((v) => v != null).every((v) => v > 120 && v < 160)).toBe(true);
    }
  });

  it("ISS cabin air: daily CO2 in the range reported for the station, no flat-lined days", () => {
    const c = load("cabin.json");
    expect(c.daily.length).toBeGreaterThan(300);
    const co2 = c.daily.map((d) => d.co2).sort((a, b) => a - b);
    const median = co2[co2.length >> 1];
    expect(median).toBeGreaterThan(1.5);
    expect(median).toBeLessThan(3.5);
    for (const d of c.daily) {
      expect(d.peak1h).toBeGreaterThanOrEqual(d.co2 * 0.9);
      if (d.temp != null) expect(d.temp).toBeGreaterThan(15), expect(d.temp).toBeLessThan(30);
    }
    expect(new Set(c.daily.map((d) => d.date)).size).toBe(c.daily.length);
  });
});
