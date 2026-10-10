// Real-time pitch feedback with visual gauge and sharp/flat indicators.
// Shows the detected swara, cents deviation, and accuracy feedback.

import { noteName } from "../lib/audio/pitchDetector.js";

export default function PitchMeter({ note, cents, hz }) {
  const hasPitch = note != null;

  // Determine accuracy status
  let accuracyStatus = "—";
  let statusColor = "text-maroon/30";

  if (hasPitch) {
    const absCents = Math.abs(cents);
    if (absCents < 10) {
      accuracyStatus = "✓ Perfect!";
      statusColor = "text-green-600 font-bold";
    } else if (absCents < 30) {
      accuracyStatus = "≈ Close";
      statusColor = "text-blue-600";
    } else if (cents > 0) {
      accuracyStatus = "↑ Sharp";
      statusColor = "text-orange-600";
    } else {
      accuracyStatus = "↓ Flat";
      statusColor = "text-purple-600";
    }
  }

  // Gauge: visual needle showing position (-150 to +150 cents)
  const gaugePercent = hasPitch ? ((cents + 150) / 300) * 100 : 50;

  return (
    <div className="mx-auto flex w-full max-w-xs flex-col items-center gap-4 rounded-2xl border border-maroon/10 bg-white p-6">
      {/* Large swara display */}
      <div className="text-center">
        <span className="text-6xl font-bold text-maroon">
          {hasPitch ? note : "—"}
        </span>
      </div>

      {/* Visual gauge (needle) */}
      <div className="w-full">
        <div className="mb-2 h-1 rounded-full bg-gradient-to-r from-purple-400 via-maroon to-orange-400">
          {hasPitch && (
            <div
              className="relative h-full w-1 bg-maroon transition-all"
              style={{ left: `${gaugePercent}%` }}
            >
              <div className="absolute top-1/2 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-maroon shadow-md" />
            </div>
          )}
        </div>
        <div className="flex justify-between px-2 text-xs text-maroon/40">
          <span>Flat -150¢</span>
          <span>On pitch</span>
          <span>Sharp +150¢</span>
        </div>
      </div>

      {/* Status and cents */}
      <div className="text-center space-y-1">
        <div className={`text-sm font-semibold ${statusColor}`}>
          {accuracyStatus}
        </div>
        <div className="text-xs uppercase tracking-wide text-maroon/50">
          {hasPitch ? `${cents > 0 ? "+" : ""}${cents} cents` : "Sing a swar to begin"}
        </div>
      </div>

      {hasPitch && hz && (
        <div className="text-xs text-maroon/40">
          Hearing {hz.toFixed(1)} Hz · {noteName(hz)}
        </div>
      )}

      {/* Guidance text */}
      {hasPitch && Math.abs(cents) > 50 && (
        <div className="rounded-lg bg-maroon/5 px-3 py-2 text-xs text-maroon/70">
          {cents > 0
            ? "🎯 Lower your pitch slightly"
            : "🎯 Raise your pitch slightly"}
        </div>
      )}
    </div>
  );
}
