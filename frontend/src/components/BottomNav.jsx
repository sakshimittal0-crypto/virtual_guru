// Bottom tab bar for the three v1 screens.
const TABS = [
  { id: "practice", label: "Practice" },
  { id: "coach", label: "Coach" },
  { id: "guides", label: "Guides" },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 flex border-t border-maroon/10 bg-white">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            active === tab.id ? "text-maroon" : "text-maroon/40"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
