export default function TanpuraControls({
  selectedRaag,
  playingDrones,
  activeStrings1,
  activeStrings2,
  volume1,
  volume2,
  onToggleTanpura,
  onToggleString,
  onVolumeChange,
}) {
  return (
    <>
      {/* Tanpura 1 & 2 buttons */}
      <div className="flex justify-center gap-2 mb-4">
        <button
          onClick={() => onToggleTanpura("tanpura1")}
          className={`rounded-full border px-4 py-2 text-sm font-medium ${
            playingDrones.has("tanpura1")
              ? "border-saffron bg-saffron/10 text-saffron"
              : "border-maroon/20 text-maroon/70 hover:border-maroon/40"
          }`}
        >
          Tanpura 1 {playingDrones.has("tanpura1") ? "■" : "▶"}
        </button>
        <button
          onClick={() => onToggleTanpura("tanpura2")}
          className={`rounded-full border px-4 py-2 text-sm font-medium ${
            playingDrones.has("tanpura2")
              ? "border-saffron bg-saffron/10 text-saffron"
              : "border-maroon/20 text-maroon/70 hover:border-maroon/40"
          }`}
        >
          Tanpura 2 {playingDrones.has("tanpura2") ? "■" : "▶"}
        </button>
      </div>

      {/* Tanpura 1 volume + string selector */}
      {playingDrones.has("tanpura1") && (
        <div className="border-t border-maroon/10 pt-3 mb-3">
          <div className="mb-2">
            <label className="text-xs font-semibold text-maroon/60 uppercase block mb-1">
              Tanpura 1 Volume
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={volume1}
              onChange={(e) => onVolumeChange("tanpura1", parseInt(e.target.value))}
              className="w-full accent-maroon"
            />
          </div>
          <p className="text-xs font-semibold text-maroon/60 uppercase mb-2">
            Tanpura 1 Strings
          </p>
          <div className="grid grid-cols-2 gap-2">
            {selectedRaag.tanpuraStrings.map((string) => (
              <button
                key={string.id}
                onClick={() => onToggleString(string.id, 1)}
                className={`rounded py-1.5 text-xs font-medium transition-colors ${
                  activeStrings1.includes(string.id)
                    ? "bg-saffron/20 text-saffron border border-saffron/30"
                    : "bg-maroon/5 text-maroon/50 border border-maroon/10"
                }`}
              >
                {string.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tanpura 2 volume + string selector */}
      {playingDrones.has("tanpura2") && (
        <div className="border-t border-maroon/10 pt-3">
          <div className="mb-2">
            <label className="text-xs font-semibold text-maroon/60 uppercase block mb-1">
              Tanpura 2 Volume
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={volume2}
              onChange={(e) => onVolumeChange("tanpura2", parseInt(e.target.value))}
              className="w-full accent-maroon"
            />
          </div>
          <p className="text-xs font-semibold text-maroon/60 uppercase mb-2">
            Tanpura 2 Strings
          </p>
          <div className="grid grid-cols-2 gap-2">
            {selectedRaag.tanpuraStrings.map((string) => (
              <button
                key={string.id}
                onClick={() => onToggleString(string.id, 2)}
                className={`rounded py-1.5 text-xs font-medium transition-colors ${
                  activeStrings2.includes(string.id)
                    ? "bg-saffron/20 text-saffron border border-saffron/30"
                    : "bg-maroon/5 text-maroon/50 border border-maroon/10"
                }`}
              >
                {string.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
