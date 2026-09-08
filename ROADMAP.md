# Hindustani Music Agent — Project Roadmap

## Overview
A full-Python AI agent that guides singers through the 7 swaras of Hindustani classical music
on any given pitch, with harmonium audio output and real-time singing feedback.

---

## Phase 1: Project Setup
**Duration: 1 day**

- Create project folder structure
- Set up Python virtual environment
- Install all dependencies (requirements.txt)
- Configure .env file with Anthropic API key
- Source or record harmonium audio samples (12 notes: C to B)

---

## Phase 2: Core Music Logic
**Duration: 2 days**

- Build `swara_mapper.py`
  - Map any given Sa pitch to all 7 swaras
  - Support all 12 chromatic pitches (C to B)
  - Add komal (flat) and tivra (sharp) swara variants
  - Add Indian pitch naming support (Kali 1-5, Safed 1-7)
- Write unit tests for the mapping logic

---

## Phase 3: Audio System
**Duration: 3 days**

- Build `audio_player.py`
  - Load and play harmonium WAV samples using pygame
  - Play individual notes on demand
  - Play full scale (Aaroh and Avaroh sequences)
  - Handle audio errors gracefully
- Test audio playback across all 12 pitches

---

## Phase 4: Claude AI Agent
**Duration: 3 days**

- Build `agent.py`
  - Design system prompt (Hindustani music teacher persona)
  - Implement streaming responses via Anthropic SDK
  - Build context-aware guidance (per swara instructions)
  - Support multi-turn conversation (memory within session)
  - Guide on throat position, common mistakes, practice tips

---

## Phase 5: Streamlit UI
**Duration: 5 days**

- Build `app.py` (main Streamlit interface)
  - Pitch / scale selector (C to B dropdown)
  - Swara map display (all 7 swaras with their note names)
  - Play button per individual swara
  - Full scale playback (Aaroh / Avaroh)
  - Streaming chat interface for AI guide
  - Visual harmonium keyboard highlighting active keys
  - Session state management

---

## Phase 6: Pitch Detection (Mic Input)
**Duration: 5 days**

- Build `pitch_detector.py`
  - Capture mic input via sounddevice
  - Analyze frequency using librosa
  - Map detected frequency to nearest swara
  - Show real-time feedback: which swara user is singing
  - Indicate if pitch is flat, sharp, or accurate
- Integrate pitch detection into Streamlit UI

---

## Phase 7: Integration & Testing
**Duration: 3 days**

- End-to-end flow testing (all pitches, all swaras)
- Edge case handling (invalid inputs, mic errors, API failures)
- Performance tuning (audio latency, streaming speed)
- Cross-platform testing (Windows / Mac)

---

## Phase 8: Polish & Documentation
**Duration: 2 days**

- UI improvements (layout, colours, labels)
- Write README with setup and run instructions
- Add sample harmonium audio files or download script
- Optional: package as executable (.exe / .app)

---

## Timeline Summary

| Phase | Task                      | Duration  | Cumulative |
|-------|---------------------------|-----------|------------|
| 1     | Project Setup             | 1 day     | Week 1     |
| 2     | Core Music Logic          | 2 days    | Week 1     |
| 3     | Audio System              | 3 days    | Week 1-2   |
| 4     | Claude AI Agent           | 3 days    | Week 2     |
| 5     | Streamlit UI              | 5 days    | Week 2-3   |
| 6     | Pitch Detection           | 5 days    | Week 3-4   |
| 7     | Integration & Testing     | 3 days    | Week 4     |
| 8     | Polish & Documentation    | 2 days    | Week 5     |
| **Total** |                       | **24 days** | **~5 weeks** |

---

## Dependencies

```txt
streamlit
anthropic
pygame
sounddevice
librosa
numpy
music21
python-dotenv
```

---

## Milestones

- **End of Week 1** — Swara mapping works, audio plays correctly
- **End of Week 2** — Claude agent guides through swaras, basic UI working
- **End of Week 3** — Full Streamlit UI with harmonium keyboard
- **End of Week 4** — Pitch detection live from mic
- **End of Week 5** — Polished, tested, documented app ready
