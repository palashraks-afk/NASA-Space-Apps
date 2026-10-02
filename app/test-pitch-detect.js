// Sanity check: YIN should recover the known frequency of a synthetic sine wave.
const assert = require("assert");
const { yinPitch } = require("./pitch-detect");

function makeSine(freq, sampleRate, numSamples) {
  const buf = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    buf[i] = Math.sin((2 * Math.PI * freq * i) / sampleRate);
  }
  return buf;
}

const sampleRate = 44100;
for (const freq of [120, 180, 220]) {
  const buf = makeSine(freq, sampleRate, 2048);
  const detected = yinPitch(buf, sampleRate);
  const errorPercent = (Math.abs(detected - freq) / freq) * 100;
  assert.ok(errorPercent < 2, `expected ~${freq}Hz, got ${detected.toFixed(2)}Hz (${errorPercent.toFixed(2)}% error)`);
  console.log(`${freq}Hz tone -> detected ${detected.toFixed(2)}Hz (${errorPercent.toFixed(2)}% error): PASS`);
}

console.log("\nYIN pitch detection sanity checks passed.");
