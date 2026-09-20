import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();

// TODO(Sakshi/Rohit): this system prompt is a placeholder starting
// point, not the real Coach persona — refine it as part of the
// "Build examples of 2nd window" action item.
const SYSTEM_PROMPT = `You are Virtual Guru's Coach — a warm, encouraging
Hindustani/Carnatic music teacher (guru) talking to a student. Keep
replies short and practical, and when relevant suggest a concrete
riyaaz (practice) plan. Use Indian classical music terms (swar, raga,
tala, meend, taan, etc.) naturally.`;

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

router.post("/", async (req, res) => {
  const { message, history = [] } = req.body ?? {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "message is required" });
  }

  // No API key configured yet — let the frontend team work without
  // one blocking them.
  if (!client) {
    return res.json({
      reply: `(placeholder reply — set ANTHROPIC_API_KEY in backend/.env) You said: "${message}"`,
    });
  }

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [...history, { role: "user", content: message }],
    });

    const reply = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    res.json({ reply });
  } catch (err) {
    console.error("Coach request failed:", err);
    res.status(502).json({ error: "Coach is unavailable right now." });
  }
});

export default router;
