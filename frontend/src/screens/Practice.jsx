import { useState } from "react";
import MicButton from "../components/MicButton.jsx";
import PitchMeter from "../components/PitchMeter.jsx";
import DroneControls from "../components/DroneControls.jsx";
import { startMicAnalyser, readWaveform } from "../lib/audio/audioEngine.js";
import { detectPitch, classifySwara } from "../lib/audio/pitchDetector.js";

// "Sing & Practise" — the main riyaaz screen. Mic button + live pitch
// feedback + tanpura/tabla drone, per the spec doc.
export default function Practice() {
  const [listening, setListening] = useState(false);
  const [pitch, setPitch] = useState({ note: null, cents: 0 });
  const [session, setSession] = useState(null); // { analyser, stop, rafId }
  const [error, setError] = useState(null);

  const stopListening = () => {
    session?.stop();
    if (session?.rafId) cancelAnimationFrame(session.rafId);
    setSession(null);
    setListening(false);
    setPitch({ note: null, cents: 0 });
  };

  const startListening = async () => {
    setError(null);
    try {
      const { audioContext, analyser, stop } = await startMicAnalyser();

      const tick = () => {
        const waveform = readWaveform(analyser);
        const freq = detectPitch(waveform, audioContext.sampleRate);
        const result = classifySwara(freq, /* tonicHz */ 130.81); // TODO: let user pick Sa
        setPitch(result ? { note: result.swara, cents: result.cents } : { note: null, cents: 0 });
        rafHandle.id = requestAnimationFrame(tick);
      };
      const rafHandle = { id: null };
      rafHandle.id = requestAnimationFrame(tick);

      setSession({ analyser, stop, rafId: rafHandle.id });
      setListening(true);
    } catch (err) {
      setError("Couldn't access the microphone. Check browser permissions.");
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 px-6 pt-10">
      <h1 className="text-lg font-semibold text-maroon">Sing &amp; Practise</h1>

      <DroneControls />

      <PitchMeter note={pitch.note} cents={pitch.cents} />

      <MicButton
        listening={listening}
        onToggle={() => (listening ? stopListening() : startListening())}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* TODO(Rohit/Sarath): once pitchDetector.js is real, surface
          sur accuracy / stability / sharp-flat feedback here, per the
          spec doc's "Voice Recognition with Pitch Identification and
          Correction" section. */}
    </div>
  );
}
