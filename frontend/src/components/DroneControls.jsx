import { useRef, useState } from "react";
import { getAudioContext } from "../lib/audio/audioEngine.js";

// Assume tanpura samples are recorded at C (261.63 Hz)
const SAMPLE_BASE_FREQ = 261.63;

// Play multiple tanpura strings (Sa + Pa) simultaneously
async function startTanpura(ctx, selectedSa, masterGain) {
  try {
    // Load both Sa and Pa samples
    const saSample = await fetch("/samples/tanpura/sa.mp3").then((r) =>
      r.arrayBuffer()
    );
    const paSample = await fetch("/samples/tanpura/pa.mp3").then((r) =>
      r.arrayBuffer()
    );

    const saBuffer = await ctx.decodeAudioData(saSample);
    const paBuffer = await ctx.decodeAudioData(paSample);

    const saGain = ctx.createGain();
    const paGain = ctx.createGain();
    saGain.connect(masterGain);
    paGain.connect(masterGain);
    saGain.gain.value = 0.5;
    paGain.gain.value = 0.4; // Pa slightly quieter

    const playbackRate = selectedSa.freq / SAMPLE_BASE_FREQ;
    let isPlaying = true;

    // Loop Sa string
    const playSaLoop = () => {
      if (!isPlaying || ctx.state !== "running") return;
      const source = ctx.createBufferSource();
      source.buffer = saBuffer;
      source.playbackRate.value = playbackRate;
      source.connect(saGain);
      source.start(0);
      setTimeout(playSaLoop, (saBuffer.duration * 1000) / playbackRate - 10);
    };

    // Loop Pa string (offset by 100ms for natural shimmer)
    const playPaLoop = () => {
      if (!isPlaying || ctx.state !== "running") return;
      const source = ctx.createBufferSource();
      source.buffer = paBuffer;
      source.playbackRate.value = playbackRate * (3 / 2); // Pa is 3/2 ratio from Sa
      source.connect(paGain);
      source.start(0);
      setTimeout(
        playPaLoop,
        (paBuffer.duration * 1000) / (playbackRate * (3 / 2)) - 10
      );
    };

    playSaLoop();
    setTimeout(playPaLoop, 100); // Slight offset

    return () => {
      isPlaying = false;
      saGain.disconnect();
      paGain.disconnect();
    };
  } catch (err) {
    console.warn("Failed to load Tanpura samples:", err);
    return () => {};
  }
}

// Sur peti using sample
async function startSurPeti(ctx, selectedSa, masterGain) {
  try {
    const response = await fetch("/samples/surpeti/surpeti.mp3");
    const arrayBuffer = await response.arrayBuffer();
    const buffer = await ctx.decodeAudioData(arrayBuffer);

    const stringGain = ctx.createGain();
    stringGain.connect(masterGain);
    stringGain.gain.value = 0.5;

    const playbackRate = selectedSa.freq / SAMPLE_BASE_FREQ;
    let isPlaying = true;

    const playLoop = () => {
      if (!isPlaying || ctx.state !== "running") return;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = playbackRate;
      source.connect(stringGain);
      source.start(0);
      setTimeout(playLoop, (buffer.duration * 1000) / playbackRate - 10);
    };

    playLoop();

    return () => {
      isPlaying = false;
      stringGain.disconnect();
    };
  } catch (err) {
    console.warn("Failed to load Sur Peti sample:", err);
    return () => {};
  }
}

// Tabla using sample
async function startTabla(ctx, selectedSa, masterGain) {
  try {
    const response = await fetch("/samples/tabla/tabla.mp3");
    const arrayBuffer = await response.arrayBuffer();
    const buffer = await ctx.decodeAudioData(arrayBuffer);

    const stringGain = ctx.createGain();
    stringGain.connect(masterGain);
    stringGain.gain.value = 0.5;

    const playbackRate = selectedSa.freq / SAMPLE_BASE_FREQ;
    let isPlaying = true;

    const playLoop = () => {
      if (!isPlaying || ctx.state !== "running") return;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = playbackRate;
      source.connect(stringGain);
      source.start(0);
      setTimeout(playLoop, (buffer.duration * 1000) / playbackRate - 10);
    };

    playLoop();

    return () => {
      isPlaying = false;
      stringGain.disconnect();
    };
  } catch (err) {
    console.warn("Failed to load Tabla sample:", err);
    return () => {};
  }
}

const DRONES = [
  { id: "tanpura", label: "Tanpura (Sa + Pa)", icon: "🎼" },
  { id: "surpeti", label: "Sur Peti", icon: "🎹" },
  { id: "tabla", label: "Tabla", icon: "🪘" },
];

export default function DroneControls({ selectedSa }) {
  const [playingDrones, setPlayingDrones] = useState(new Set());
  const [volumeTanpura, setVolumeTanpura] = useState(50);
  const [volumeSurPeti, setVolumeSurPeti] = useState(50);
  const [volumeTabla, setVolumeTabla] = useState(50);

  const stopRefs = useRef({});
  const ctxRef = useRef(null);

  const toggleDrone = async (droneId) => {
    const newPlaying = new Set(playingDrones);

    if (newPlaying.has(droneId)) {
      stopRefs.current[droneId]?.stop?.();
      stopRefs.current[droneId]?.gainNode?.disconnect();
      delete stopRefs.current[droneId];
      newPlaying.delete(droneId);
    } else {
      const ctx = await getAudioContext();
      ctxRef.current = ctx;

      const masterGain = ctx.createGain();
      let volume = 0.5;
      if (droneId === "tanpura") volume = volumeTanpura / 100;
      else if (droneId === "surpeti") volume = volumeSurPeti / 100;
      else if (droneId === "tabla") volume = volumeTabla / 100;
      masterGain.gain.value = volume;
      masterGain.connect(ctx.destination);

      let stop;
      if (droneId === "tanpura") stop = await startTanpura(ctx, selectedSa, masterGain);
      else if (droneId === "surpeti") stop = await startSurPeti(ctx, selectedSa, masterGain);
      else if (droneId === "tabla") stop = await startTabla(ctx, selectedSa, masterGain);

      stopRefs.current[droneId] = { stop, gainNode: masterGain };
      newPlaying.add(droneId);
    }

    setPlayingDrones(newPlaying);
  };

  const handleVolumeChange = (droneId, newVolume) => {
    if (droneId === "tanpura") setVolumeTanpura(newVolume);
    else if (droneId === "surpeti") setVolumeSurPeti(newVolume);
    else if (droneId === "tabla") setVolumeTabla(newVolume);

    if (stopRefs.current[droneId]?.gainNode) {
      stopRefs.current[droneId].gainNode.gain.value = newVolume / 100;
    }
  };

  const getVolume = (droneId) => {
    if (droneId === "tanpura") return volumeTanpura;
    if (droneId === "surpeti") return volumeSurPeti;
    if (droneId === "tabla") return volumeTabla;
    return 50;
  };

  return (
    <div className="w-full max-w-sm rounded-2xl border border-maroon/10 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-maroon/60 mb-4">
        Drones
      </p>

      {/* Vertical drone list */}
      <div className="space-y-3">
        {DRONES.map((drone) => (
          <div key={drone.id}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{drone.icon}</span>
              <button
                onClick={() => toggleDrone(drone.id)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap flex-1 text-left ${
                  playingDrones.has(drone.id)
                    ? "border-saffron bg-saffron/10 text-saffron"
                    : "border-maroon/20 text-maroon/70 hover:border-maroon/40"
                }`}
              >
                {drone.label} {playingDrones.has(drone.id) ? "■" : "▶"}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={getVolume(drone.id)}
                onChange={(e) =>
                  handleVolumeChange(drone.id, parseInt(e.target.value))
                }
                className="flex-1 accent-maroon"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
