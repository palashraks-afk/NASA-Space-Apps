import { describe, it, expect } from "vitest";
import { INDICATOR, INDICATORS, HAZARDS, validate, ownRange } from "./guidance.js";

const tier = (key, v, own, hist) => INDICATOR[key].assess(v, own, hist).tier;

describe("check-in guidance", () => {
  it("every indicator has instructions, a reason, a source and a hazard", () => {
    for (const i of INDICATORS) {
      expect(i.howTo.length).toBeGreaterThan(40);
      expect(i.whySpace.length).toBeGreaterThan(40);
      expect(i.source.length).toBeGreaterThan(20);
      expect(HAZARDS.map((h) => h.key)).toContain(i.hazard);
    }
    expect(HAZARDS).toHaveLength(5);
  });

  it("blood pressure follows the ACC/AHA categories", () => {
    expect(tier("bp", { sys: 115, dia: 75 })).toBe("ok");
    expect(tier("bp", { sys: 132, dia: 78 })).toBe("watch");
    expect(tier("bp", { sys: 145, dia: 92 })).toBe("watch");
    expect(tier("bp", { sys: 185, dia: 100 })).toBe("surgeon");
  });

  it("blood sugar follows the ADA cut-offs", () => {
    expect(tier("glucose", { v: 90 })).toBe("ok");
    expect(tier("glucose", { v: 110 })).toBe("watch");
    expect(tier("glucose", { v: 65 })).toBe("watch");
    expect(tier("glucose", { v: 50 })).toBe("surgeon");
    expect(tier("glucose", { v: 260 })).toBe("surgeon");
  });

  it("fever goes to the flight surgeon; personal normal catches smaller changes", () => {
    expect(tier("temp", { v: 38.2 })).toBe("surgeon");
    expect(tier("temp", { v: 37.4 }, { lo: 36.4, hi: 37.2 })).toBe("watch");
    expect(tier("temp", { v: 37.0 }, { lo: 36.4, hi: 37.2 })).toBe("ok");
  });

  it("repeated low mood, short sleep or missed exercise escalates; one day does not", () => {
    expect(tier("mood", { v: 2 }, null, [{ v: 4 }, { v: 4 }])).toBe("watch");
    expect(tier("mood", { v: 2 }, null, [{ v: 2 }, { v: 1 }])).toBe("surgeon");
    expect(tier("sleep", { v: 4.5 }, null, [{ v: 4 }, { v: 4.5 }])).toBe("surgeon");
    expect(tier("exercise", { v: 10 }, null, [{ v: 120 }, { v: 0 }])).toBe("watch");
  });

  it("rejects impossible entries", () => {
    expect(validate(INDICATOR.bp, { sys: 80, dia: 90 })).toMatch(/lower/);
    expect(validate(INDICATOR.glucose, { v: 2000 })).toMatch(/between/);
    expect(validate(INDICATOR.hr, { v: 64 })).toBeNull();
  });

  it("own range needs at least a week of entries", () => {
    expect(ownRange([60, 61, 62])).toBeNull();
    const r = ownRange([60, 62, 61, 63, 59, 60, 62, 61]);
    expect(r.lo).toBeLessThan(60);
    expect(r.hi).toBeGreaterThan(62);
  });
});
