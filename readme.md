# Virtual Guru

Virtual Guru is an app for learning and practising Indian classical music
(with instrument support planned for later). This repo is the **skeleton
for v1**: three screens, the audio plumbing they need, and clearly marked
places for each workstream to build into.

> Status: empty/skeletal on purpose. Nothing here is a finished feature —
> it's the shared scaffolding so nobody starts from a blank file.

## The three screens

| Screen | Purpose | File |
|---|---|---|
| **Practice** ("Sing & Practise") | The main riyaaz screen — mic button, live pitch feedback, tanpura/tabla drone | `frontend/src/screens/Practice.jsx` |
| **Coach** ("Ask Your Virtual Guru") | Conversational AI — student asks for a practice plan in plain language | `frontend/src/screens/Coach.jsx` |
| **Guides** ("Guided Riyaaz") | Library of ready-made sessions (For You / Ragas / Techniques / Short Sessions) + "Build Your Own Riyaaz Plan" | `frontend/src/screens/Guides.jsx` |

## Stack (v1 decision — see "Why a web app first?" below)

- **Frontend**: React + Vite + Tailwind, mobile-first, PWA-ready
- **Backend**: Node + Express — thin API layer, mainly to proxy the Coach
  screen to an LLM without exposing API keys in the browser
- **Audio**: Web Audio API (`getUserMedia` + `AudioContext`) for mic
  capture and pitch analysis — no native modules needed for v1

## Getting started

```bash
# Frontend
cd frontend
npm install
npm run dev        # http://localhost:5173

# Backend (separate terminal)
cd backend
npm install
cp .env.example .env   # add your ANTHROPIC_API_KEY (or leave blank for a stub reply)
npm run dev        # http://localhost:8787
```

The frontend proxies `/api/*` to the backend during dev — see
`frontend/vite.config.js`.

## Where to plug in your work

This maps to the action items from the planning doc:

- **Base code / repo (Rajat)** — done, this scaffold.
- **Voice recognition — pitch ID + correction (Rohit, Sarath)** →
  `frontend/src/lib/audio/pitchDetector.js`. `audioEngine.js` already
  handles mic permission + the `AudioContext`/`AnalyserNode` graph and
  hands you raw samples each animation frame — you just need to fill in
  `detectPitch()` and `classifySwara()`. `frontend/src/data/swaras.js`
  has the swara frequency ratios to compare against.
- **Coach conversational examples (Sakshi, Rohit)** →
  `frontend/src/screens/Coach.jsx` (UI + example prompts) and
  `backend/src/routes/coach.js` (system prompt / response shaping).
- **Tanpura & Tabla, Practice screen (Sakshi, Rajat)** →
  `frontend/src/components/DroneControls.jsx`. It currently plays a
  placeholder oscillator drone on loop so the on/off wiring is provable —
  swap `startPlaceholderDrone()` for real tanpura/tabla sample playback.

## Why a web app first?

Short version: **build it as a mobile-first web app now, wrap it with
Capacitor into an Android/iOS app once the core (pitch detection + Coach)
is solid.** Longer reasoning and alternatives are in the chat where this
repo was generated, and summarized in `docs/ARCHITECTURE.md`.

## Project layout

```
virtual-guru/
├── frontend/           React + Vite PWA
│   └── src/
│       ├── screens/    Practice, Coach, Guides
│       ├── components/ BottomNav, MicButton, PitchMeter, DroneControls
│       ├── lib/audio/  audioEngine.js (done), pitchDetector.js (stub)
│       ├── lib/api/    coachClient.js
│       └── data/       swaras.js
├── backend/            Node/Express API (Coach proxy)
│   └── src/routes/coach.js
└── docs/ARCHITECTURE.md
```
