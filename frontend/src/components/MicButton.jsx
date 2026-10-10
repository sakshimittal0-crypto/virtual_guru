// Large mic button for the Practice screen with visual feedback.
// Owns nothing about pitch detection itself — just start/stop listening state.
export default function MicButton({ listening, onToggle }) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={listening}
      className={`group relative flex h-28 w-28 items-center justify-center rounded-full text-white shadow-lg transition-all active:scale-95 ${
        listening
          ? "bg-gradient-to-br from-saffron to-orange-500 animate-pulse"
          : "bg-gradient-to-br from-maroon to-red-700 hover:shadow-xl"
      }`}
    >
      {/* Animated ring when listening */}
      {listening && (
        <>
          <div className="absolute inset-0 rounded-full border-4 border-saffron opacity-50 animate-ping" />
          <div className="absolute inset-0 rounded-full border-2 border-saffron opacity-25 animate-pulse" />
        </>
      )}

      {/* Icon and text */}
      <div className="flex flex-col items-center gap-1 relative z-10">
        <span className="text-2xl">🎤</span>
        <span className="text-xs font-semibold">
          {listening ? "Listening…" : "Tap to sing"}
        </span>
      </div>
    </button>
  );
}
