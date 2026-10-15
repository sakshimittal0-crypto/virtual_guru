import { SWARA_ORDER } from "../data/swaras.js";

export default function SwarMandal({ raag }) {
  // Fallback: if swaras not defined, show all as active (for backward compatibility)
  const raagSwaras = raag?.swaras || SWARA_ORDER;

  return (
    <div className="w-full max-w-xs rounded-2xl border border-maroon/10 bg-white p-4">
      <label className="block text-xs font-semibold uppercase tracking-wide text-maroon/60 mb-3">
        Swar Mandal (Raag Scale)
      </label>
      <div className="grid grid-cols-7 gap-2">
        {SWARA_ORDER.map((swara) => {
          const isInRaag = raagSwaras.includes(swara);
          return (
            <div
              key={swara}
              className={`rounded-lg py-2 px-1 text-center text-sm font-semibold transition-colors ${
                isInRaag
                  ? "bg-saffron text-white shadow-sm"
                  : "bg-maroon/5 text-maroon/30"
              }`}
            >
              {swara}
            </div>
          );
        })}
      </div>
    </div>
  );
}
