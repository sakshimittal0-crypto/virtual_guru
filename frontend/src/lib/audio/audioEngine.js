// Shared Web Audio plumbing: mic permission, AudioContext, and an
// AnalyserNode feeding raw time-domain samples. This is the piece that
// would need to change if we ever move pitch detection to a native
// module — everything above this file (pitchDetector.js, screens)
// should be able to stay the same.
//
// See docs/ARCHITECTURE.md for why this is Web Audio API rather than a
// native audio module for v1.

let audioContext = null;

/** Lazily creates (or resumes) a single shared AudioContext. Browsers
 * require this to happen after a user gesture, so call it from a
 * click/tap handler (e.g. MicButton's onToggle). */
export async function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }
  return audioContext;
}

/**
 * Requests mic access and returns an AnalyserNode wired up to it, plus
 * a stop() to release the mic. Fails loudly if permission is denied —
 * callers should catch and show the user a message, not swallow it.
 */
export async function startMicAnalyser({ fftSize = 2048 } = {}) {
  const ctx = await getAudioContext();
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = fftSize;
  source.connect(analyser);

  const stop = () => {
    stream.getTracks().forEach((track) => track.stop());
    source.disconnect();
    analyser.disconnect();
  };

  return { audioContext: ctx, analyser, stop };
}

/** Pulls the current time-domain waveform out of an analyser as a
 * Float32Array in the range [-1, 1] — this is what pitchDetector.js
 * should consume. */
export function readWaveform(analyser) {
  const buffer = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buffer);
  return buffer;
}
