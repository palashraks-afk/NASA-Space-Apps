import { describe, it, expect } from "vitest";
import { INSTRUMENTS, parseReadings, SAMPLE_CSV, SAMPLE_FHIR } from "./instruments.js";

describe("instruments and universal import", () => {
  it("every instrument has parts with a shape, a position and a direction", () => {
    expect(INSTRUMENTS.length).toBeGreaterThanOrEqual(6);
    for (const x of INSTRUMENTS) {
      expect(x.parts.length).toBeGreaterThanOrEqual(4);
      for (const p of x.parts) { expect(p.at).toHaveLength(3); expect(p.dir).toHaveLength(3); expect(p.does.length).toBeGreaterThan(5); }
    }
  });

  it("reads the sample CSV", () => {
    const { rows } = parseReadings(SAMPLE_CSV);
    const day = rows.filter((r) => r.date === "2026-11-12");
    expect(day.find((r) => r.key === "bp").value).toEqual({ sys: 124, dia: 80 });
    expect(day.find((r) => r.key === "sleep").value.v).toBe(6);
    expect(new Set(rows.map((r) => r.key)).size).toBe(7);
  });

  it("reads a FHIR bundle by LOINC code and converts units", () => {
    const { rows } = parseReadings(SAMPLE_FHIR);
    const get = (k) => rows.find((r) => r.key === k).value;
    expect(get("bp")).toEqual({ sys: 126, dia: 82 });
    expect(get("hr").v).toBe(63);
    expect(get("glucose").v).toBeCloseTo(93.7, 0);  // 5.2 mmol/L
    expect(get("temp").v).toBeCloseTo(37, 0);        // 98.6 F
  });

  it("explains what is wrong with a file it cannot read", () => {
    expect(parseReadings("weight\n70").skipped[0]).toMatch(/date/);
    expect(parseReadings("{ nope").skipped[0]).toMatch(/JSON/);
  });
});
