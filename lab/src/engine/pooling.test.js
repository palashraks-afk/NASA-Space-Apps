import { describe, expect, it } from "vitest";
import { poolCrew, pooledVerdict } from "./pooling.js";

describe("crew pooling", () => {
  it("narrows each person's interval when the crew agrees, and shrinks toward the crew mean", () => {
    const est = [9, 11, 10, 12], se = [4, 4, 4, 4];
    const p = poolCrew(est, se, 8);
    p.forEach((q, i) => {
      expect(q.hi - q.lo).toBeLessThan(2 * 1.96 * se[i]);
      expect(Math.abs(q.mean - 10.5)).toBeLessThan(Math.abs(est[i] - 10.5) + 1e-9);
    });
  });
  it("keeps people apart when they clearly differ", () => {
    const p = poolCrew([-20, 30, -22, 31], [3, 3, 3, 3], 8);
    expect(p[1].mean).toBeGreaterThan(20);
    expect(p[0].mean).toBeLessThan(-12);
  });
  it("produces probabilities that sum to one", () => {
    const p = poolCrew([5, 7, 6, 9], [5, 5, 5, 5], 8);
    const v = pooledVerdict(p[0], { delta: 8 });
    expect(v.pWork + v.pNone + v.pHarm).toBeCloseTo(1, 6);
  });
});
