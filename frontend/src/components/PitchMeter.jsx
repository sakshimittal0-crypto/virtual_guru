// Placeholder pitch display. Once pitchDetector.js returns real
// { note, cents, isOnPitch } data, wire it in here — for now it just
// renders whatever it's given so the layout exists to build against.
export default function PitchMeter({ note, cents }) {
  const hasPitch = note != null;

  return (
    <div className="mx-auto flex w-full max-w-xs flex-col items-center gap-2 rounded-2xl border border-maroon/10 bg-white p-6">
      <span className="text-4xl font-semibold text-maroon">
        {hasPitch ? note : "—"}
      </span>
      <span className="text-xs uppercase tracking-wide text-maroon/50">
        {hasPitch ? `${cents > 0 ? "+" : ""}${cents} cents` : "Sing a swar to begin"}
      </span>
      {/* TODO(Rohit/Sarath): swap this for a real needle/gauge once
          pitchDetector.js is implemented. */}
    </div>
  );
}
