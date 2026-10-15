export default function SurPetiControls({
  playingDrones,
  volumeSurPeti,
  onToggleSurPeti,
  onVolumeChange,
}) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <button
        onClick={() => onToggleSurPeti()}
        className={`rounded-full border px-4 py-2 text-sm font-medium ${
          playingDrones.has("surpeti")
            ? "border-saffron bg-saffron/10 text-saffron"
            : "border-maroon/20 text-maroon/70 hover:border-maroon/40"
        }`}
      >
        Sur Peti {playingDrones.has("surpeti") ? "■" : "▶"}
      </button>

      {playingDrones.has("surpeti") && (
        <div>
          <label className="text-xs font-semibold text-maroon/60 uppercase block mb-1">
            Sur Peti Volume
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={volumeSurPeti}
            onChange={(e) => onVolumeChange("surpeti", parseInt(e.target.value))}
            className="w-full accent-maroon"
          />
        </div>
      )}
    </div>
  );
}
