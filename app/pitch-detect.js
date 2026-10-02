// Pitch (F0) and jitter extraction using the YIN algorithm.
// Naive FFT-peak-picking was rejected in design review as too noisy for a
// credible live demo (see docs/design.md critique log) — YIN is a standard,
// well-validated time-domain pitch detector.
//
// Reference: de Cheveigne & Kawahara, "YIN, a fundamental frequency estimator
// for speech and music," J. Acoust. Soc. Am. 111, 2002.

function yinPitch(buffer, sampleRate, threshold = 0.1) {
  const n = buffer.length;
  const yinBuffer = new Float32Array(n / 2);

  // Step 1-2: difference function + cumulative mean normalized difference
  yinBuffer[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau < yinBuffer.length; tau++) {
    let sum = 0;
    for (let i = 0; i < yinBuffer.length; i++) {
      const delta = buffer[i] - buffer[i + tau];
      sum += delta * delta;
    }
    runningSum += sum;
    yinBuffer[tau] = runningSum === 0 ? 1 : (sum * tau) / runningSum;
  }

  // Step 3: absolute threshold — find first dip below threshold
  let tauEstimate = -1;
  for (let tau = 2; tau < yinBuffer.length; tau++) {
    if (yinBuffer[tau] < threshold) {
      while (tau + 1 < yinBuffer.length && yinBuffer[tau + 1] < yinBuffer[tau]) {
        tau++;
      }
      tauEstimate = tau;
      break;
    }
  }
  if (tauEstimate === -1) return null; // no clear periodicity found (silence/noise)

  // Step 4: parabolic interpolation for sub-sample accuracy
  const x0 = tauEstimate < 1 ? tauEstimate : tauEstimate - 1;
  const x2 = tauEstimate + 1 < yinBuffer.length ? tauEstimate + 1 : tauEstimate;
  let betterTau = tauEstimate;
  if (x0 !== tauEstimate && x2 !== tauEstimate) {
    const s0 = yinBuffer[x0], s1 = yinBuffer[tauEstimate], s2 = yinBuffer[x2];
    const adjustment = (s2 - s0) / (2 * (2 * s1 - s2 - s0));
    if (Number.isFinite(adjustment)) betterTau = tauEstimate + adjustment;
  }

  return sampleRate / betterTau;
}

// Extracts F0 shift (vs a personal baseline), jitter, and speech-rate proxy
// from a sequence of short audio frames. `frames` is an array of Float32Array
// buffers; `sampleRate` in Hz; `baselineF0` is the astronaut's own resting F0
// captured during onboarding (never a population average — see design notes
// on personal baselining).
function extractVoiceFeatures(frames, sampleRate, baselineF0) {
  const f0s = frames.map((f) => yinPitch(f, sampleRate)).filter((f) => f !== null && f > 50 && f < 500);
  if (f0s.length < 2) return null;

  const meanF0 = f0s.reduce((a, b) => a + b, 0) / f0s.length;
  const f0ShiftPercent = baselineF0 ? (Math.abs(meanF0 - baselineF0) / baselineF0) * 100 : 0;

  // Jitter: average absolute cycle-to-cycle period difference, as a percent of mean period
  let periodDiffs = [];
  for (let i = 1; i < f0s.length; i++) {
    const p0 = 1 / f0s[i - 1];
    const p1 = 1 / f0s[i];
    periodDiffs.push(Math.abs(p1 - p0));
  }
  const meanPeriod = 1 / meanF0;
  const jitterPercent = periodDiffs.length
    ? (periodDiffs.reduce((a, b) => a + b, 0) / periodDiffs.length / meanPeriod) * 100
    : 0;

  return { meanF0, f0ShiftPercent, jitterPercent };
}

if (typeof module !== "undefined") {
  module.exports = { yinPitch, extractVoiceFeatures };
}
