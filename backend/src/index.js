import "dotenv/config";
import express from "express";
import cors from "cors";
import coachRouter from "./routes/coach.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/coach", coachRouter);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

const port = process.env.PORT || 8787;
app.listen(port, () => {
  console.log(`Virtual Guru backend listening on http://localhost:${port}`);
});
