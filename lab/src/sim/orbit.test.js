import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { makeISS, issState, countSunrises } from "./orbit.js";
const gp = JSON.parse(fs.readFileSync(new URL("../../public/data/iss_gp.json", import.meta.url)))[0];

describe("ISS orbit from CelesTrak elements", () => {
  const iss = makeISS(gp);
  it("has the expected period and altitude", () => {
    expect(iss.periodMin).toBeGreaterThan(90);
    expect(iss.periodMin).toBeLessThan(95);
    const s = issState(iss, new Date(gp.EPOCH + "Z"));
    expect(s.height).toBeGreaterThan(370);
    expect(s.height).toBeLessThan(440);
    expect(Math.abs(s.lat)).toBeLessThanOrEqual((51.7 * Math.PI) / 180);
  });
  it("sees about 15 to 16 sunrises a day (real eclipse geometry)", () => {
    const n = countSunrises(iss, new Date(gp.EPOCH + "Z"), 24, 20);
    expect(n).toBeGreaterThanOrEqual(14);
    expect(n).toBeLessThanOrEqual(16);
  });
});
