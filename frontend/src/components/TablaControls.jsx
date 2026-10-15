export default function TablaControls({ playingDrones, onToggleTabla }) {
  return (
    <button
      onClick={() => onToggleTabla()}
      className={`rounded-full border px-4 py-2 text-sm font-medium ${
        playingDrones.has("tabla")
          ? "border-saffron bg-saffron/10 text-saffron"
          : "border-maroon/20 text-maroon/70 hover:border-maroon/40"
      }`}
    >
      Tabla {playingDrones.has("tabla") ? "■" : "▶"}
    </button>
  );
}
