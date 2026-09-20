import { useState } from "react";
import { askCoach } from "../lib/api/coachClient.js";

// "Ask Your Virtual Guru" — conversational AI window. Per the spec
// doc, the student describes what they need in plain language instead
// of navigating exercise menus, e.g. "I want to improve my meend in
// Raga Yaman. Can you suggest a short practice plan?"
//
// TODO(Sakshi/Rohit): build out real example prompts/flows here (per
// the action item "Build examples of 2nd window") — the doc mentions
// wanting Sakshi/Rohit example conversations, which haven't been
// written yet. EXAMPLE_PROMPTS below is just a placeholder starting
// point.
const EXAMPLE_PROMPTS = [
  "I want to improve my meend in Raga Yaman. Suggest a short practice plan.",
  "My taan feels shaky — what should I riyaaz this week?",
];

export default function Coach() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const send = async (text) => {
    const outgoing = text ?? input;
    if (!outgoing.trim()) return;

    const history = messages;
    setMessages([...history, { role: "user", content: outgoing }]);
    setInput("");
    setSending(true);
    try {
      const reply = await askCoach(outgoing, history);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't reach the coach just now." },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full flex-col px-4 pt-6">
      <h1 className="mb-4 text-lg font-semibold text-maroon">Ask Your Virtual Guru</h1>

      {messages.length === 0 && (
        <div className="mb-4 flex flex-col gap-2">
          {EXAMPLE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => send(prompt)}
              className="rounded-xl border border-maroon/15 bg-white px-4 py-3 text-left text-sm text-maroon/80"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
              m.role === "user"
                ? "ml-auto bg-maroon text-white"
                : "bg-white text-maroon/90"
            }`}
          >
            {m.content}
          </div>
        ))}
        {sending && <p className="text-xs text-maroon/40">Your Guru is thinking…</p>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex gap-2 py-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about a raga, technique, or practice plan…"
          className="flex-1 rounded-full border border-maroon/15 bg-white px-4 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={sending}
          className="rounded-full bg-maroon px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
