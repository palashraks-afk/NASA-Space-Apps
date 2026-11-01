// Canned demo scenarios — a believable synthetic data story so the
// visualization has something real to react to without live astronaut data.
// Each scenario is a 7-point mission-day timeline.

const SCENARIOS = {
  normal: {
    label: "Normal mission week",
    days: [
      { voiceFeatures: { f0ShiftPercent: 4, jitterPercent: 0.4, speechRateDropPercent: 2 }, checkin: { sleepHours: 7.5, moodScore: 4, exerciseCompliance: 1.0, nutritionFlags: 0 } },
      { voiceFeatures: { f0ShiftPercent: 5, jitterPercent: 0.5, speechRateDropPercent: 3 }, checkin: { sleepHours: 7.2, moodScore: 4, exerciseCompliance: 0.95, nutritionFlags: 0 } },
      { voiceFeatures: { f0ShiftPercent: 3, jitterPercent: 0.3, speechRateDropPercent: 1 }, checkin: { sleepHours: 7.8, moodScore: 5, exerciseCompliance: 1.0, nutritionFlags: 0 } },
      { voiceFeatures: { f0ShiftPercent: 6, jitterPercent: 0.5, speechRateDropPercent: 4 }, checkin: { sleepHours: 7.0, moodScore: 4, exerciseCompliance: 0.9, nutritionFlags: 0 } },
      { voiceFeatures: { f0ShiftPercent: 4, jitterPercent: 0.4, speechRateDropPercent: 2 }, checkin: { sleepHours: 7.4, moodScore: 4, exerciseCompliance: 1.0, nutritionFlags: 0 } },
      { voiceFeatures: { f0ShiftPercent: 5, jitterPercent: 0.4, speechRateDropPercent: 3 }, checkin: { sleepHours: 7.6, moodScore: 4, exerciseCompliance: 0.95, nutritionFlags: 0 } },
      { voiceFeatures: { f0ShiftPercent: 4, jitterPercent: 0.3, speechRateDropPercent: 2 }, checkin: { sleepHours: 7.5, moodScore: 5, exerciseCompliance: 1.0, nutritionFlags: 0 } },
    ],
  },
  fatigueTrending: {
    label: "Fatigue trending upward",
    days: [
      { voiceFeatures: { f0ShiftPercent: 5, jitterPercent: 0.5, speechRateDropPercent: 3 }, checkin: { sleepHours: 7.2, moodScore: 4, exerciseCompliance: 0.95, nutritionFlags: 0 } },
      { voiceFeatures: { f0ShiftPercent: 8, jitterPercent: 0.6, speechRateDropPercent: 6 }, checkin: { sleepHours: 6.5, moodScore: 3, exerciseCompliance: 0.9, nutritionFlags: 0 } },
      { voiceFeatures: { f0ShiftPercent: 10, jitterPercent: 0.7, speechRateDropPercent: 9 }, checkin: { sleepHours: 6.0, moodScore: 3, exerciseCompliance: 0.8, nutritionFlags: 1 } },
      { voiceFeatures: { f0ShiftPercent: 13, jitterPercent: 0.9, speechRateDropPercent: 14 }, checkin: { sleepHours: 5.5, moodScore: 3, exerciseCompliance: 0.75, nutritionFlags: 1 } },
      { voiceFeatures: { f0ShiftPercent: 16, jitterPercent: 1.1, speechRateDropPercent: 19 }, checkin: { sleepHours: 5.2, moodScore: 2, exerciseCompliance: 0.7, nutritionFlags: 1 } },
      { voiceFeatures: { f0ShiftPercent: 18, jitterPercent: 1.3, speechRateDropPercent: 25 }, checkin: { sleepHours: 5.0, moodScore: 2, exerciseCompliance: 0.6, nutritionFlags: 1 } },
      { voiceFeatures: { f0ShiftPercent: 20, jitterPercent: 1.4, speechRateDropPercent: 28 }, checkin: { sleepHours: 4.8, moodScore: 2, exerciseCompliance: 0.55, nutritionFlags: 2 } },
    ],
  },
  stressSpike: {
    label: "Acute stress spike (single event)",
    days: [
      { voiceFeatures: { f0ShiftPercent: 4, jitterPercent: 0.4, speechRateDropPercent: 2 }, checkin: { sleepHours: 7.5, moodScore: 4, exerciseCompliance: 1.0, nutritionFlags: 0 } },
      { voiceFeatures: { f0ShiftPercent: 5, jitterPercent: 0.4, speechRateDropPercent: 3 }, checkin: { sleepHours: 7.2, moodScore: 4, exerciseCompliance: 0.95, nutritionFlags: 0 } },
      { voiceFeatures: { f0ShiftPercent: 22, jitterPercent: 1.6, speechRateDropPercent: 30 }, checkin: { sleepHours: 6.0, moodScore: 2, exerciseCompliance: 0.9, nutritionFlags: 0 } },
      { voiceFeatures: { f0ShiftPercent: 12, jitterPercent: 0.8, speechRateDropPercent: 10 }, checkin: { sleepHours: 6.5, moodScore: 3, exerciseCompliance: 0.9, nutritionFlags: 0 } },
      { voiceFeatures: { f0ShiftPercent: 6, jitterPercent: 0.5, speechRateDropPercent: 4 }, checkin: { sleepHours: 7.0, moodScore: 4, exerciseCompliance: 0.95, nutritionFlags: 0 } },
      { voiceFeatures: { f0ShiftPercent: 5, jitterPercent: 0.4, speechRateDropPercent: 3 }, checkin: { sleepHours: 7.3, moodScore: 4, exerciseCompliance: 1.0, nutritionFlags: 0 } },
      { voiceFeatures: { f0ShiftPercent: 4, jitterPercent: 0.4, speechRateDropPercent: 2 }, checkin: { sleepHours: 7.5, moodScore: 4, exerciseCompliance: 1.0, nutritionFlags: 0 } },
    ],
  },
};

if (typeof module !== "undefined") {
  module.exports = { SCENARIOS };
}
