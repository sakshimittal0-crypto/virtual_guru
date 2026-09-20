// STUB — owned by Rohit & Sarath (see README "Where to plug in your
// work"). audioEngine.js already gives you a live waveform via
// readWaveform(analyser); this file's job is to turn that into a
// musical answer.
//
// Suggested approach: autocorrelation or the YIN algorithm on the
// waveform to get a fundamental frequency in Hz, then compare that
// against SWARA_RATIOS (see ../../data/swaras.js) relative to the
// student's chosen tonic (Sa) to classify which swar was sung and how
// far off-pitch it was.

import { SWARA_RATIOS } from "../../data/swaras.js";

/**
 * @param {Float32Array} waveform  time-domain samples from readWaveform()
 * @param {number} sampleRate      audioContext.sampleRate
 * @returns {number | null} detected fundamental frequency in Hz, or
 *   null if no clear pitch was found (silence, noise, etc.)
 */
export function detectPitch(waveform, sampleRate) {
  // TODO: implement (autocorrelation / YIN / etc).
  return null;
}

/**
 * @param {number} frequencyHz   output of detectPitch()
 * @param {number} tonicHz       frequency of the student's Sa
 * @returns {{ swara: string, cents: number } | null}
 *   `swara` is one of the keys in SWARA_RATIOS, `cents` is how far
 *   sharp (+) or flat (-) the sung note was from that swara.
 */
export function classifySwara(frequencyHz, tonicHz) {
  if (frequencyHz == null) return null;

  // TODO: replace with a real nearest-swara + cents-deviation
  // calculation using SWARA_RATIOS. Left unimplemented on purpose.
  void SWARA_RATIOS;
  return null;
}
