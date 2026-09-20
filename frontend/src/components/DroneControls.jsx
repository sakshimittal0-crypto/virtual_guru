import { useRef, useState } from "react";
import { getAudioContext } from "../lib/audio/audioEngine.js";

// TODO(Sakshi/Rajat): replace startPlaceholderDrone() with real tanpura
// and tabla sample playback (looped, tuned to the selected pitch/tala).
// The oscillator here just proves the on/off + audio-graph wiring works
// end to end so you're not starting from nothing.
function startPlaceholderDrone(ctx, frequency) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;
  gain.gain.value = 0.06; // quiet — it's a placeholder, not the real drone
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  return () => {
    osc.stop();
    osc.disconnect();
    gain.disconnect();
  };
}

const DRONES = [
  { id: "tanpura", label: "Tanpura", frequency: 130.81 }, // Sa @ C3, placeholder
  { id: "tabla", label: "Tabla", frequency: 98.0 }, // placeholder tone, not a real tabla loop
];

export default function DroneControls() {
  const [playingId, setPlayingId] = useState(null);
  const stopRef = useRef(null);

  const toggle = async (drone) => {
    if (playingId === drone.id) {
      stopRef.current?.();
      stopRef.current = null;
      setPlayingId(null);
      return;
    }
    stopRef.current?.();
    const ctx = await getAudioContext();
    stopRef.current = startPlaceholderDrone(ctx, drone.frequency);
    setPlayingId(drone.id);
  };

  return (
    <div className="flex justify-center gap-3">
      {DRONES.map((drone) => (
        <button
          key={drone.id}
          onClick={() => toggle(drone)}
          className={`rounded-full border px-4 py-2 text-sm font-medium ${
            playingId === drone.id
              ? "border-saffron bg-saffron/10 text-saffron"
              : "border-maroon/20 text-maroon/70"
          }`}
        >
          {drone.label} {playingId === drone.id ? "■" : "▶"}
        </button>
      ))}
    </div>
  );
}
