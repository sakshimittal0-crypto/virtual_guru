import { askCoach } from "../lib/api/coachClient.js";

// "Guided Riyaaz" — the practice-session library. Per the spec doc:
// categories (For You / Ragas / Techniques / Short Sessions) plus a
// "Build Your Own Riyaaz Plan" card that hands off to the Coach.
// Categories and sessions are empty placeholders — content is a
// separate, later workstream, not part of this base scaffold.
const CATEGORIES = ["For You", "Ragas", "Techniques", "Short Sessions"];

export default function Guides() {
  const buildOwnPlan = async () => {
    // Placeholder wiring — a real implementation should probably route
    // to the Coach screen with this prompt pre-filled rather than
    // firing the request from here directly.
    try {
      await askCoach("Build me a personalized riyaaz plan for today.");
    } catch {
      /* no-op placeholder */
    }
  };

  return (
    <div className="flex flex-col gap-6 px-4 pt-6">
      <h1 className="text-lg font-semibold text-maroon">Guided Riyaaz</h1>

      <button
        onClick={buildOwnPlan}
        className="rounded-2xl border border-saffron bg-saffron/10 px-4 py-4 text-left"
      >
        <p className="font-medium text-maroon">Build Your Own Riyaaz Plan</p>
        <p className="text-sm text-maroon/60">
          Ask Virtual Guru to generate a personalized session
        </p>
      </button>

      {CATEGORIES.map((category) => (
        <section key={category}>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-maroon/50">
            {category}
          </h2>
          <div className="rounded-2xl border border-dashed border-maroon/15 p-6 text-center text-sm text-maroon/40">
            No sessions yet
          </div>
        </section>
      ))}
    </div>
  );
}
