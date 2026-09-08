"""
swara_mapper.py
Maps a given Sa (tonic) pitch to all 7 swaras of Hindustani classical music.
Supports shuddha (natural), komal (flat), and tivra (sharp) variants.
"""

# Chromatic scale (Western notation)
SEMITONES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

# Indian pitch names used on harmonium (Kali = black key, Safed = white key)
INDIAN_PITCH_NAMES = {
    'C':  'Safed 1',
    'C#': 'Kali 1',
    'D':  'Safed 2',
    'D#': 'Kali 2',
    'E':  'Safed 3',
    'F':  'Safed 4',
    'F#': 'Kali 3',
    'G':  'Safed 5',
    'G#': 'Kali 4',
    'A':  'Safed 6',
    'A#': 'Kali 5',
    'B':  'Safed 7',
}

# Reverse lookup: Indian name → Western note
INDIAN_TO_WESTERN = {v: k for k, v in INDIAN_PITCH_NAMES.items()}

# Semitone intervals from Sa for shuddha (natural) swaras
SHUDDHA_INTERVALS = {
    'Sa':  0,
    'Re':  2,
    'Ga':  4,
    'Ma':  5,
    'Pa':  7,
    'Dha': 9,
    'Ni':  11,
}

# All swara variants with their semitone offsets from Sa
ALL_SWARA_INTERVALS = {
    'Sa':       0,   # fixed
    'Re (Komal)': 1,
    'Re':       2,
    'Ga (Komal)': 3,
    'Ga':       4,
    'Ma':       5,
    'Ma (Tivra)': 6,
    'Pa':       7,   # fixed
    'Dha (Komal)': 8,
    'Dha':      9,
    'Ni (Komal)': 10,
    'Ni':       11,
}

# Descriptions for each shuddha swara
SWARA_DESCRIPTIONS = {
    'Sa':  'Shadja — the tonic, the root. Fixed and unchanging. The foundation of all music.',
    'Re':  'Rishabh — a step above Sa. Shuddha Re sits 2 semitones above Sa.',
    'Ga':  'Gandhar — the 3rd note. Shuddha Ga sits 4 semitones above Sa. Often evokes emotion.',
    'Ma':  'Madhyam — the 4th note. Shuddha Ma sits 5 semitones above Sa. A pivotal note.',
    'Pa':  'Pancham — the 5th. Fixed like Sa. Sits 7 semitones above Sa. Strong and stable.',
    'Dha': 'Dhaivat — the 6th note. Shuddha Dha sits 9 semitones above Sa.',
    'Ni':  'Nishad — the 7th note. Shuddha Ni sits 11 semitones above Sa. Leads back to Sa.',
}


def resolve_pitch(pitch_input: str) -> str:
    """
    Accept either Western notation (C, C#, D ...) or Indian harmonium
    notation (Kali 1, Safed 2 ...) and return the Western note name.
    """
    pitch_input = pitch_input.strip()

    # Direct Western match (case-insensitive)
    for note in SEMITONES:
        if pitch_input.upper() == note.upper():
            return note

    # Indian name match (case-insensitive)
    for indian, western in INDIAN_TO_WESTERN.items():
        if pitch_input.lower() == indian.lower():
            return western

    raise ValueError(
        f"Unknown pitch: '{pitch_input}'. "
        f"Use Western (C, C#, D ...) or Indian (Kali 1, Safed 2 ...) notation."
    )


def get_shuddha_swara_map(sa_pitch: str) -> dict:
    """
    Given a Sa pitch, return the 7 shuddha swaras mapped to Western note names.

    Example:
        get_shuddha_swara_map('D')
        → {'Sa': 'D', 'Re': 'E', 'Ga': 'F#', 'Ma': 'G',
           'Pa': 'A', 'Dha': 'B', 'Ni': 'C#'}
    """
    sa = resolve_pitch(sa_pitch)
    root_index = SEMITONES.index(sa)
    return {
        swara: SEMITONES[(root_index + interval) % 12]
        for swara, interval in SHUDDHA_INTERVALS.items()
    }


def get_full_swara_map(sa_pitch: str) -> dict:
    """
    Return all 12 swara variants (shuddha + komal + tivra) for a given Sa.
    """
    sa = resolve_pitch(sa_pitch)
    root_index = SEMITONES.index(sa)
    return {
        swara: SEMITONES[(root_index + interval) % 12]
        for swara, interval in ALL_SWARA_INTERVALS.items()
    }


def get_aaroh_avaroh(sa_pitch: str) -> dict:
    """
    Return ascending (Aaroh) and descending (Avaroh) note sequences for a given Sa.
    Uses shuddha swaras.

    Aaroh:  Sa Re Ga Ma Pa Dha Ni Sa  (upper Sa completes the octave)
    Avaroh: Sa Ni Dha Pa Ma Ga Re Sa  (starts from upper Sa, descends to lower Sa)
    """
    swara_map = get_shuddha_swara_map(sa_pitch)
    notes = list(swara_map.values())
    sa = notes[0]
    return {
        'aaroh':  notes + [sa],              # Sa Re Ga Ma Pa Dha Ni Sa
        'avaroh': [sa] + list(reversed(notes)),  # Sa Ni Dha Pa Ma Ga Re Sa
    }


def get_swara_info(sa_pitch: str) -> list:
    """
    Return a list of dicts with full info for each shuddha swara:
    swara name, Western note, Indian pitch name, and description.
    """
    swara_map = get_shuddha_swara_map(sa_pitch)
    result = []
    for swara, note in swara_map.items():
        result.append({
            'swara':       swara,
            'note':        note,
            'indian_name': INDIAN_PITCH_NAMES[note],
            'description': SWARA_DESCRIPTIONS[swara],
        })
    return result


def format_swara_table(sa_pitch: str) -> str:
    """
    Return a formatted string table of swaras for display.
    """
    sa = resolve_pitch(sa_pitch)
    info = get_swara_info(sa)
    lines = [
        f"Sa = {sa} ({INDIAN_PITCH_NAMES[sa]})",
        "",
        f"{'Swara':<6} {'Note':<5} {'Harmonium Key':<15} {'Description'}",
        "-" * 70,
    ]
    for row in info:
        lines.append(
            f"{row['swara']:<6} {row['note']:<5} {row['indian_name']:<15} {row['description']}"
        )
    return "\n".join(lines)
