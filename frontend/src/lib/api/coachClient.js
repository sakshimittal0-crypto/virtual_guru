// Talks to the backend's /api/coach route (which in turn talks to the
// LLM — see backend/src/routes/coach.js). Kept as a thin wrapper so the
// Coach screen doesn't need to know about the network shape.

/**
 * @param {string} message                 what the student typed/said
 * @param {{role: "user"|"assistant", content: string}[]} history
 * @returns {Promise<string>} the coach's reply text
 */
export async function askCoach(message, history = []) {
  const res = await fetch("/api/coach", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });

  if (!res.ok) {
    throw new Error(`Coach request failed: ${res.status}`);
  }

  const data = await res.json();
  return data.reply;
}
