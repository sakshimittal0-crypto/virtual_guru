// Large mic button for the Practice screen. Owns nothing about pitch
// detection itself — just start/stop listening state, handed off via
// props to whatever wraps audioEngine + pitchDetector.
export default function MicButton({ listening, onToggle }) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={listening}
      className={`flex h-28 w-28 items-center justify-center rounded-full text-white shadow-lg transition-transform active:scale-95 ${
        listening ? "bg-saffron animate-pulse" : "bg-maroon"
      }`}
    >
      <span className="text-sm font-semibold">
        {listening ? "Listening…" : "Tap to sing"}
      </span>
    </button>
  );
}
