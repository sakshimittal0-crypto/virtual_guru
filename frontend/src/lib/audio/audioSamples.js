// Load and cache audio samples for tanpura, tabla, sur peti
const audioBuffers = {};

/**
 * Fetch and decode an audio file into an AudioBuffer
 * @param {AudioContext} ctx - Web Audio context
 * @param {string} url - URL to audio file
 * @returns {Promise<AudioBuffer>}
 */
async function loadAudioBuffer(ctx, url) {
  if (audioBuffers[url]) {
    return audioBuffers[url];
  }

  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = await ctx.decodeAudioData(arrayBuffer);
    audioBuffers[url] = buffer;
    return buffer;
  } catch (err) {
    console.error(`Failed to load audio: ${url}`, err);
    return null;
  }
}

/**
 * Play an audio buffer in a loop with volume control
 * @param {AudioContext} ctx - Web Audio context
 * @param {AudioBuffer} buffer - decoded audio buffer
 * @param {GainNode} masterGain - master volume node
 * @returns {Function} stop function
 */
export function playLoopedSample(ctx, buffer, masterGain) {
  if (!buffer) return () => {};

  const sources = [];

  const playOnce = () => {
    if (ctx.state !== "running") return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(masterGain);

    source.onended = () => {
      const idx = sources.indexOf(source);
      if (idx > -1) sources.splice(idx, 1);
    };

    source.start(0);
    sources.push(source);

    // Loop: schedule next play after buffer duration
    setTimeout(playOnce, buffer.duration * 1000 - 50); // slight overlap to avoid gap
  };

  playOnce();

  return () => {
    sources.forEach((src) => {
      try {
        src.stop();
      } catch (e) {}
    });
    sources.length = 0;
  };
}

export async function loadTanpuraSample(ctx, swaraLabel) {
  // Path: /public/samples/tanpura/{swaraLabel}.mp3 or .wav
  const url = `/samples/tanpura/${swaraLabel.toLowerCase()}.mp3`;
  return loadAudioBuffer(ctx, url);
}

export async function loadSurPetiSample(ctx) {
  const url = `/samples/surpeti/surpeti.mp3`;
  return loadAudioBuffer(ctx, url);
}

export async function loadTablaSample(ctx) {
  const url = `/samples/tabla/tabla.mp3`;
  return loadAudioBuffer(ctx, url);
}
