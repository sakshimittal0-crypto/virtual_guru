"""
download_samples.py
Generates harmonium-like audio samples for all 12 notes (C to B)
using FluidSynth with the macOS built-in GM soundfont (Reed Organ patch).

Run once during setup:  python download_samples.py
"""

import os
import wave
import struct
import fluidsynth

SAMPLES_DIR  = os.path.join(os.path.dirname(__file__), 'samples')
SOUNDFONT    = '/System/Library/Components/CoreAudio.component/Contents/Resources/gs_instruments.dls'
SAMPLE_RATE  = 44100
DURATION     = 3.0    # seconds per note
VELOCITY     = 100    # MIDI note velocity (0-127)
GM_REED_ORGAN = 20   # GM program 20 — Reed Organ (closest to harmonium)

# MIDI note numbers for octave 4
NOTE_MIDI = {
    'C':  60,
    'C#': 61,
    'D':  62,
    'D#': 63,
    'E':  64,
    'F':  65,
    'F#': 66,
    'G':  67,
    'G#': 68,
    'A':  69,
    'A#': 70,
    'B':  71,
}

# Filename-safe note names
NOTE_FILENAMES = {
    'C':  'C',
    'C#': 'C_sharp',
    'D':  'D',
    'D#': 'D_sharp',
    'E':  'E',
    'F':  'F',
    'F#': 'F_sharp',
    'G':  'G',
    'G#': 'G_sharp',
    'A':  'A',
    'A#': 'A_sharp',
    'B':  'B',
}


def _apply_fade_out(samples: bytes, fade_samples: int) -> bytes:
    """Apply a short fade-out to avoid clicks at the end of a sample."""
    import array
    arr = array.array('h', samples)
    total = len(arr)
    start = total - fade_samples
    for i in range(fade_samples):
        factor = 1.0 - (i / fade_samples)
        arr[start + i] = int(arr[start + i] * factor)
    return arr.tobytes()


def generate_all_samples() -> None:
    if not os.path.exists(SOUNDFONT):
        raise FileNotFoundError(
            f"macOS GM soundfont not found at:\n  {SOUNDFONT}\n"
            "This script requires macOS with CoreAudio installed."
        )

    os.makedirs(SAMPLES_DIR, exist_ok=True)
    print(f"Soundfont : {SOUNDFONT}")
    print(f"Patch     : GM program {GM_REED_ORGAN} — Reed Organ")
    print(f"Output    : {SAMPLES_DIR}\n")

    # Initialise FluidSynth (no audio driver — we capture samples directly)
    fs = fluidsynth.Synth(samplerate=float(SAMPLE_RATE))
    sfid = fs.sfload(SOUNDFONT)
    if sfid == -1:
        raise RuntimeError(f"FluidSynth failed to load soundfont: {SOUNDFONT}")

    # Select Reed Organ on channel 0
    fs.program_select(0, sfid, 0, GM_REED_ORGAN)

    total_frames  = int(SAMPLE_RATE * DURATION)
    fade_frames   = int(SAMPLE_RATE * 0.15)  # 150ms fade-out

    for note, midi_num in NOTE_MIDI.items():
        filename = f"{NOTE_FILENAMES[note]}.wav"
        filepath = os.path.join(SAMPLES_DIR, filename)

        print(f"  [gen]   {filename}  (MIDI {midi_num}) ...", end=' ', flush=True)

        # Trigger note
        fs.noteon(0, midi_num, VELOCITY)

        # Capture rendered PCM (stereo int16 interleaved)
        raw = fs.get_samples(total_frames)

        # Release note
        fs.noteoff(0, midi_num)

        # raw is a numpy int16 array — stereo interleaved (L, R, L, R ...)
        # Convert to mono by averaging left and right channels
        left  = raw[0::2]
        right = raw[1::2]
        mono  = ((left.astype('int32') + right.astype('int32')) // 2).astype('int16')

        # Pack to bytes and apply fade-out
        pcm = mono.tobytes()
        pcm = _apply_fade_out(pcm, fade_frames)

        # Write WAV
        with wave.open(filepath, 'w') as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(SAMPLE_RATE)
            wf.writeframes(pcm)

        print("done")

    fs.delete()
    print(f"\nAll 12 Reed Organ samples ready in /samples/")


if __name__ == '__main__':
    generate_all_samples()
