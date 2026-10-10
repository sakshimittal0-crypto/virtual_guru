// Pitch detection and swara classification.
// Converts mic waveform → Hz (YIN) → swara name + sharp/flat feedback.

import { SWARA_RATIOS, SWARA_ORDER } from "../../data/swaras.js";

const MIN_FREQUENCY = 70; // Hz — below this is rumble / low male voice floor
const MAX_FREQUENCY = 1000; // Hz — covers upper-octave singing
const RMS_GATE = 0.004; // below this the mic is effectively silent
const YIN_THRESHOLD = 0.15; // lower = stricter; 0.10–0.20 is typical for voice
const YIN_FALLBACK = 0.3; // weaker voiced frames still accepted if no dip beats YIN_THRESHOLD
const HYSTERESIS_CENTS = 30; // extra pull toward the swara already shown
const MAX_CENTS_OFF = 150; // beyond this we call it "between swaras"

/**
 * YIN pitch detection (de Cheveigné & Kawahara, 2002). Much more robust
 * than raw autocorrelation: the normalised difference function avoids
 * octave errors, and parabolic interpolation gives sub-sample accuracy.
 *
 * @param {Float32Array} waveform  time-domain samples from readWaveform()
 * @param {number} sampleRate      audioContext.sampleRate
 * @returns {number | null} fundamental frequency in Hz, or null if the
 *   signal is silent / unvoiced / noisy.
 */
export function detectPitch(waveform, sampleRate) {
  const half = Math.floor(waveform.length / 2);

  // Silence gate
  let sumSq = 0;
  for (let i = 0; i < waveform.length; i++) sumSq += waveform[i] * waveform[i];
  if (Math.sqrt(sumSq / waveform.length) < RMS_GATE) return null;

  const tauMin = Math.max(2, Math.floor(sampleRate / MAX_FREQUENCY));
  const tauMax = Math.min(half - 1, Math.ceil(sampleRate / MIN_FREQUENCY));
  if (tauMax <= tauMin) return null;

  // Difference function + cumulative mean normalisation, in one pass.
  const cmnd = new Float32Array(tauMax + 1);
  cmnd[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau <= tauMax; tau++) {
    let d = 0;
    for (let i = 0; i < half; i++) {
      const diff = waveform[i] - waveform[i + tau];
      d += diff * diff;
    }
    runningSum += d;
    cmnd[tau] = runningSum === 0 ? 1 : (d * tau) / runningSum;
  }

  // First dip below threshold, followed down to its local minimum.
  let tauEstimate = -1;
  for (let tau = tauMin; tau <= tauMax; tau++) {
    if (cmnd[tau] < YIN_THRESHOLD) {
      while (tau + 1 <= tauMax && cmnd[tau + 1] < cmnd[tau]) tau++;
      tauEstimate = tau;
      break;
    }
  }
  if (tauEstimate === -1) {
    // No clean dip: accept the deepest one if it is still reasonably periodic.
    let best = tauMin;
    for (let tau = tauMin; tau <= tauMax; tau++) if (cmnd[tau] < cmnd[best]) best = tau;
    if (cmnd[best] >= YIN_FALLBACK) return null;
    tauEstimate = best;
  }

  // Parabolic interpolation around the minimum for sub-sample precision.
  let refined = tauEstimate;
  if (tauEstimate > 1 && tauEstimate < tauMax) {
    const a = cmnd[tauEstimate - 1];
    const b = cmnd[tauEstimate];
    const c = cmnd[tauEstimate + 1];
    const denom = a - 2 * b + c;
    if (denom !== 0) refined = tauEstimate + (a - c) / (2 * denom);
  }

  return sampleRate / refined;
}

// Swara ratios plus the upper Sa, so notes just below the next octave's
// Sa match it instead of wrapping around to a ~1200-cent error from Sa.
const CANDIDATES = [
  ...SWARA_ORDER.map((swara) => ({ swara, cents: 1200 * Math.log2(SWARA_RATIOS[swara]) })),
  { swara: "Sa", cents: 1200 },
];

/**
 * Maps detected frequency to the nearest swara (in any octave) and
 * calculates how far sharp (+cents) or flat (-cents) it is.
 *
 * @param {number} frequencyHz   output of detectPitch()
 * @param {number} tonicHz       frequency of the student's Sa
 * @param {string} [prefer]      currently-shown swara; gets a small bias so
 *   the label doesn't flip back and forth near a boundary
 * @returns {{ swara: string, cents: number } | null}
 */
export function classifySwara(frequencyHz, tonicHz, prefer = null) {
  if (!frequencyHz || !tonicHz) return null;

  // Position within the octave above Sa, in cents: [0, 1200)
  const fromSa = 1200 * Math.log2(frequencyHz / tonicHz);
  const inOctave = ((fromSa % 1200) + 1200) % 1200;

  let best = null;
  let bestDiff = Infinity;
  for (const candidate of CANDIDATES) {
    const diff = inOctave - candidate.cents;
    const bias = candidate.swara === prefer ? HYSTERESIS_CENTS : 0;
    if (Math.abs(diff) - bias < Math.abs(bestDiff) - (best === prefer ? HYSTERESIS_CENTS : 0)) {
      bestDiff = diff;
      best = candidate.swara;
    }
  }

  if (Math.abs(bestDiff) > MAX_CENTS_OFF) return null;
  return { swara: best, cents: Math.round(bestDiff) };
}

/**
 * Stabilises the live readout. Takes raw detectPitch() output and returns a
 * steady { swara, cents } for display:
 *  - median of recent log-frequencies (rejects octave jumps / glitches),
 *  - exponential smoothing of cents (rides through vibrato),
 *  - hysteresis on the swara label (no flicker near boundaries),
 *  - a short hold through dropouts (breaths, consonants).
 *
 * @returns {(freqHz: number | null, tonicHz: number) => {swara, cents} | null}
 */
export function createPitchSmoother({ window = 9, holdFrames = 8, alpha = 0.35 } = {}) {
  const recent = []; // log2(Hz)
  let missed = 0;
  let swara = null;
  let cents = 0;

  const reset = () => {
    recent.length = 0;
    swara = null;
  };

  return (freqHz, tonicHz) => {
    if (freqHz) {
      missed = 0;
      recent.push(Math.log2(freqHz));
      if (recent.length > window) recent.shift();
    } else if (++missed > holdFrames) {
      reset();
      return null;
    }
    if (recent.length === 0) return null;

    const sorted = [...recent].sort((a, b) => a - b);
    const medianHz = 2 ** sorted[Math.floor(sorted.length / 2)];

    const result = classifySwara(medianHz, tonicHz, swara);
    if (!result) {
      reset();
      return null;
    }
    cents = result.swara === swara ? cents + alpha * (result.cents - cents) : result.cents;
    swara = result.swara;
    return { swara, cents: Math.round(cents), hz: medianHz };
  };
}

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** e.g. 146.8 → "D3" (nearest equal-tempered note, A4 = 440 Hz). */
export function noteName(hz) {
  const midi = Math.round(69 + 12 * Math.log2(hz / 440));
  return NOTE_NAMES[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1);
}
