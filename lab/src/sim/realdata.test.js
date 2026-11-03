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
});
