"""
audio_player.py
Harmonium sample playback using pygame.
Plays individual notes, full scales (Aaroh/Avaroh), and swara sequences.
"""

import os
import time
import pygame

from swara_mapper import get_shuddha_swara_map, get_aaroh_avaroh

SAMPLES_DIR = os.path.join(os.path.dirname(__file__), 'samples')

# Map Western note names to WAV filenames in /samples/
NOTE_TO_FILE = {
    'C':  'C.wav',
    'C#': 'C_sharp.wav',
    'D':  'D.wav',
    'D#': 'D_sharp.wav',
    'E':  'E.wav',
    'F':  'F.wav',
    'F#': 'F_sharp.wav',
    'G':  'G.wav',
    'G#': 'G_sharp.wav',
    'A':  'A.wav',
    'A#': 'A_sharp.wav',
    'B':  'B.wav',
}

# Default gap between notes when playing a sequence (seconds)
DEFAULT_NOTE_GAP = 1.5

_initialized = False


def _init_pygame() -> None:
    """Initialize pygame mixer once."""
    global _initialized
    if not _initialized:
        pygame.mixer.pre_init(frequency=44100, size=-16, channels=1, buffer=512)
        pygame.mixer.init()
        _initialized = True


def _get_sample_path(note: str) -> str:
    """Return the absolute path to a note's WAV file."""
    filename = NOTE_TO_FILE.get(note)
    if filename is None:
        raise ValueError(f"Unknown note: '{note}'. Must be one of {list(NOTE_TO_FILE.keys())}")
    path = os.path.join(SAMPLES_DIR, filename)
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Sample not found: {path}\n"
            f"Run 'python download_samples.py' to generate samples."
        )
    return path


def play_note(note: str, wait: bool = True) -> None:
    """
    Play a single harmonium note.

    Args:
        note:  Western note name e.g. 'C', 'C#', 'D'
        wait:  If True, block until the note finishes playing.
    """
    _init_pygame()
    path = _get_sample_path(note)
    sound = pygame.mixer.Sound(path)
    sound.play()
    if wait:
        time.sleep(sound.get_length())


def play_sequence(notes: list, gap: float = DEFAULT_NOTE_GAP, wait_after: bool = True) -> None:
    """
    Play a list of notes one after another.

    Args:
        notes:      List of Western note names e.g. ['C', 'D', 'E', 'F', 'G', 'A', 'B']
        gap:        Seconds between note onsets.
        wait_after: If True, block until the last note finishes.
    """
    _init_pygame()
    for i, note in enumerate(notes):
        path = _get_sample_path(note)
        sound = pygame.mixer.Sound(path)
        sound.play()
        # Let the note ring for the full gap duration, then stop cleanly
        time.sleep(gap)
        sound.fadeout(100)  # 100ms fade-out before next note

    if wait_after:
        time.sleep(0.15)  # wait for final fadeout to complete


def play_swara_map(sa_pitch: str, gap: float = DEFAULT_NOTE_GAP) -> None:
    """
    Play all 7 shuddha swaras for a given Sa pitch (Aaroh — ascending).

    Args:
        sa_pitch: The Sa note e.g. 'C', 'D', 'F#', 'Kali 1'
    """
    seq = get_aaroh_avaroh(sa_pitch)
    print(f"Playing Aaroh: {' '.join(seq['aaroh'])}")
    play_sequence(seq['aaroh'], gap=gap)


def play_aaroh(sa_pitch: str, gap: float = DEFAULT_NOTE_GAP) -> None:
    """Play ascending scale (Sa Re Ga Ma Pa Dha Ni) for given Sa."""
    seq = get_aaroh_avaroh(sa_pitch)
    print(f"Aaroh  (ascending) : {' → '.join(seq['aaroh'])}")
    play_sequence(seq['aaroh'], gap=gap)


def play_avaroh(sa_pitch: str, gap: float = DEFAULT_NOTE_GAP) -> None:
    """Play descending scale (Ni Dha Pa Ma Ga Re Sa) for given Sa."""
    seq = get_aaroh_avaroh(sa_pitch)
    print(f"Avaroh (descending): {' → '.join(seq['avaroh'])}")
    play_sequence(seq['avaroh'], gap=gap)


def play_aaroh_avaroh(sa_pitch: str, gap: float = DEFAULT_NOTE_GAP) -> None:
    """Play full ascending then descending scale for given Sa.
    Aaroh ends on upper Sa; Avaroh starts from upper Sa — joined without duplicate.
    """
    seq = get_aaroh_avaroh(sa_pitch)
    # aaroh ends on upper Sa, avaroh starts from upper Sa — Sa held at the top
    full = seq['aaroh'] + seq['avaroh']
    print(f"Aaroh + Avaroh: {' → '.join(full)}")
    play_sequence(full, gap=gap)


def stop_all() -> None:
    """Stop any currently playing audio immediately."""
    if _initialized:
        pygame.mixer.stop()


def is_playing() -> bool:
    """Return True if audio is currently playing."""
    if not _initialized:
        return False
    return pygame.mixer.get_busy()


def get_available_notes() -> list:
    """Return list of notes that have sample files available."""
    available = []
    for note, filename in NOTE_TO_FILE.items():
        if os.path.exists(os.path.join(SAMPLES_DIR, filename)):
            available.append(note)
    return available
