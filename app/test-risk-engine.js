// Quick standalone sanity check for the risk engine — no framework needed.
// Run with: node app/test-risk-engine.js
const assert = require("assert");
const { computeRisk } = require("./risk-engine");

// Scenario 1: normal day, no voice stress, good self-report
let risk = computeRisk({
  voiceFeatures: { f0ShiftPercent: 5, jitterPercent: 0.5, speechRateDropPercent: 2 },
  checkin: { sleepHours: 7.5, moodScore: 4, exerciseCompliance: 1.0, nutritionFlags: 0 },
});
assert.strictEqual(risk.behavioral.level, "normal", "expected normal behavioral on a good day");
assert.strictEqual(risk.bone.level, "normal", "expected normal bone on full exercise compliance");
console.log("Scenario 1 (normal day): PASS");

// Scenario 2: fatigue-trending — elevated F0 shift + jitter past threshold, poor sleep
risk = computeRisk({
  voiceFeatures: { f0ShiftPercent: 18, jitterPercent: 1.3, speechRateDropPercent: 25 },
  checkin: { sleepHours: 5, moodScore: 2, exerciseCompliance: 0.6, nutritionFlags: 1 },
});
assert.strictEqual(risk.behavioral.level, "flag", "expected flag on multiple exceeded voice thresholds");
assert.ok(risk.behavioral.reasons.length > 0, "expected cited reasons attached to the flag");
assert.ok(risk.behavioral.reasons.every(r => r.source), "every reason must carry a source citation");
console.log("Scenario 2 (fatigue-trending): PASS");

// Scenario 3: low exercise compliance only — bone/cardio watch, behavioral unaffected by voice
risk = computeRisk({
  voiceFeatures: { f0ShiftPercent: 4, jitterPercent: 0.4, speechRateDropPercent: 1 },
  checkin: { sleepHours: 7, moodScore: 4, exerciseCompliance: 0.3, nutritionFlags: 0 },
});
assert.strictEqual(risk.bone.level, "flag", "expected bone flag on low compliance");
assert.strictEqual(risk.cardiovascular.level, "watch", "expected cardio watch on low compliance");
console.log("Scenario 3 (low exercise compliance): PASS");

console.log("\nAll risk-engine sanity checks passed.");
