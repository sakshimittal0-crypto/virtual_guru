import { useCallback, useEffect, useRef, useState } from "react";
import MicButton from "../components/MicButton.jsx";
import PitchMeter from "../components/PitchMeter.jsx";
import DroneControls from "../components/DroneControls.jsx";
import { startMicAnalyser, readWaveform } from "../lib/audio/audioEngine.js";
import { detectPitch, createPitchSmoother } from "../lib/audio/pitchDetector.js";

// Western note names and their frequencies (C4 = 261.63 Hz, A4 = 440 Hz standard)
const PITCH_OPTIONS = [
  { note: "C", freq: 261.63 },
  { note: "C#", freq: 277.18 },
  { note: "D", freq: 293.66 },
  { note: "D#", freq: 311.13 },
  { note: "E", freq: 329.63 },
  { note: "F", freq: 349.23 },
  { note: "F#", freq: 369.99 },
  { note: "G", freq: 392.00 },
  { note: "G#", freq: 415.30 },
  { note: "A", freq: 440.00 },
  { note: "A#", freq: 466.16 },
  { note: "B", freq: 493.88 },
];

export default function Practice() {
  const [listening, setListening] = useState(false);
  const [pitch, setPitch] = useState({ note: null, cents: 0, hz: null });
  const [error, setError] = useState(null);
  const [selectedSa, setSelectedSa] = useState(PITCH_OPTIONS[0]); // Default to C

  const sessionRef = useRef(null);
  const saRef = useRef(selectedSa);
  saRef.current = selectedSa;

  const stopListening = useCallback(() => {
    const session = sessionRef.current;
    if (session) {
      session.cancelled = true;
      cancelAnimationFrame(session.rafId);
      session.stop();
      sessionRef.current = null;
    }
    setListening(false);
    setPitch({ note: null, cents: 0 });
  }, []);

  useEffect(() => stopListening, [stopListening]);

  const startListening = async () => {
    setError(null);
    try {
      const { audioContext, analyser, stop } = await startMicAnalyser();
      const session = { stop, rafId: 0, cancelled: false };
      sessionRef.current = session;

      const smoother = createPitchSmoother();
      let last = 0;
      const tick = (now) => {
        if (session.cancelled) return;
        if (now - last >= 33) {
          last = now;
          const freq = detectPitch(readWaveform(analyser), audioContext.sampleRate);
          const result = smoother(freq, saRef.current.freq);
          setPitch(result ? { note: result.swara, cents: result.cents, hz: result.hz } : { note: null, cents: 0, hz: null });
        }
        session.rafId = requestAnimationFrame(tick);
      };
      session.rafId = requestAnimationFrame(tick);
      setListening(true);
    } catch (err) {
      setError("Couldn't access the microphone. Check browser permissions.");
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 px-6 pt-6 pb-8">
      <h1 className="text-lg font-semibold text-maroon">Sing &amp; Practise</h1>

      {/* Sa (tonic) selector */}
      <div className="w-full max-w-xs rounded-2xl border border-maroon/10 bg-white p-4">
        <label className="block text-xs font-semibold uppercase tracking-wide text-maroon/60 mb-2">
          Your Sa (root pitch)
        </label>
        <div className="grid grid-cols-6 gap-2">
          {PITCH_OPTIONS.map((option) => (
            <button
              key={option.note}
              onClick={() => setSelectedSa(option)}
              className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
                selectedSa.note === option.note
                  ? "bg-maroon text-white"
                  : "bg-maroon/5 text-maroon hover:bg-maroon/10"
              }`}
            >
              {option.note}
            </button>
          ))}
        </div>
      </div>

      {/* Drone Controls */}
      <DroneControls selectedSa={selectedSa} />

      <PitchMeter note={pitch.note} cents={pitch.cents} hz={pitch.hz} />

      <MicButton
        listening={listening}
        onToggle={() => (listening ? stopListening() : startListening())}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
