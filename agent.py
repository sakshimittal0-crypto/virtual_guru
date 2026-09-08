"""
agent.py
Claude-powered Hindustani classical music singing guide.
Provides streaming guidance on how to sing swaras for any given Sa pitch.
"""

import os
from typing import Generator
from dotenv import load_dotenv
import anthropic

from swara_mapper import (
    get_shuddha_swara_map,
    get_swara_info,
    get_aaroh_avaroh,
    INDIAN_PITCH_NAMES,
    SWARA_DESCRIPTIONS,
)

load_dotenv()

# ---------------------------------------------------------------------------
# System prompt — defines the agent's persona and knowledge base
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are Ustad Ji, an expert Hindustani classical music teacher with 40 years
of experience teaching vocal music. You specialise in guiding students to find and sing the
7 swaras (Sa Re Ga Ma Pa Dha Ni) correctly on any given pitch.

Your teaching style:
- Warm, encouraging, and patient
- Use both Indian (Sa Re Ga Ma Pa Dha Ni) and Western (C D E F G A B) note names together
- Give practical, physical guidance: throat position, breath support, mouth shape
- Mention common mistakes and how to avoid them
- Use analogies that make abstract concepts tangible
- When relevant, mention which ragas use certain swaras prominently
- Keep responses focused and actionable — not too long

Core knowledge you draw from:
- Sa (Shadja): The tonic. Fixed. Comes from the navel. The anchor of all music.
- Re (Rishabh): Produced in the chest. Shuddha Re is 2 semitones above Sa.
- Ga (Gandhar): Produced in the throat. The most emotionally expressive swara.
- Ma (Madhyam): The pivot note. Shuddha Ma is 5 semitones above Sa.
- Pa (Pancham): Fixed like Sa. Resonates in the palate/nose. 7 semitones above Sa.
- Dha (Dhaivat): Produced in the forehead. 9 semitones above Sa.
- Ni (Nishad): Produced at the top of the head. Leads back to Sa. 11 semitones above Sa.

Komal swaras (flat): Re Komal, Ga Komal, Dha Komal, Ni Komal
Tivra swara (sharp): Ma Tivra (the only sharp variant)
Sa and Pa are fixed — they never change.

When a student's Sa pitch is provided, always refer to their specific notes by name
(e.g., "Your Sa is on D, which is Safed 2 on the harmonium").
"""


def _build_client() -> anthropic.Anthropic:
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if not api_key or api_key == 'your_api_key_here':
        raise EnvironmentError(
            "ANTHROPIC_API_KEY is not set.\n"
            "Copy .env.example to .env and add your API key."
        )
    return anthropic.Anthropic(api_key=api_key)


def _swara_context(sa_pitch: str) -> str:
    """Build a context string describing the student's scale."""
    swara_map  = get_shuddha_swara_map(sa_pitch)
    indian_name = INDIAN_PITCH_NAMES[swara_map['Sa']]
    seq         = get_aaroh_avaroh(sa_pitch)
    aaroh_str   = ' → '.join(seq['aaroh'])
    avaroh_str  = ' → '.join(seq['avaroh'])

    lines = [
        f"Student's Sa (tonic): {sa_pitch} ({indian_name} on harmonium)",
        f"Their 7 shuddha swaras:",
    ]
    for info in get_swara_info(sa_pitch):
        lines.append(f"  {info['swara']:<6} = {info['note']:<4} ({info['indian_name']})")
    lines.append(f"Aaroh  (ascending) : {aaroh_str}")
    lines.append(f"Avaroh (descending): {avaroh_str}")
    return '\n'.join(lines)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_scale_introduction(sa_pitch: str) -> Generator[str, None, None]:
    """
    Stream an introduction to the student's scale — what their swaras are,
    where to find them on the harmonium, and how to approach singing them.
    """
    client  = _build_client()
    context = _swara_context(sa_pitch)

    prompt = f"""The student has set their Sa on {sa_pitch}.

{context}

Please introduce them to their scale. Cover:
1. Where their Sa sits on the harmonium and how to establish it vocally
2. A brief overview of all 7 swaras they will be singing
3. How to approach the Aaroh (ascending) and Avaroh (descending)
4. One key tip to get started"""

    with client.messages.stream(
        model='claude-sonnet-4-6',
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{'role': 'user', 'content': prompt}],
    ) as stream:
        for text in stream.text_stream:
            yield text


def get_swara_guide(sa_pitch: str, swara: str) -> Generator[str, None, None]:
    """
    Stream detailed guidance on how to sing a specific swara.

    Args:
        sa_pitch: The Sa note e.g. 'C', 'D', 'F#'
        swara:    Swara name e.g. 'Sa', 'Re', 'Ga', 'Ma', 'Pa', 'Dha', 'Ni'
    """
    client    = _build_client()
    swara_map = get_shuddha_swara_map(sa_pitch)
    note      = swara_map.get(swara)

    if note is None:
        raise ValueError(f"Unknown swara: '{swara}'. Must be one of {list(swara_map.keys())}")

    indian_name = INDIAN_PITCH_NAMES[note]
    context     = _swara_context(sa_pitch)

    prompt = f"""The student wants to learn how to sing {swara} ({note} / {indian_name}).

{context}

Guide them specifically on singing {swara}:
1. Which note it is on their harmonium (physical key to press)
2. How to produce it vocally — throat position, breath, resonance
3. How it relates to Sa — the interval feel
4. Common mistakes students make on this swara
5. A simple exercise to practice it"""

    with client.messages.stream(
        model='claude-sonnet-4-6',
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{'role': 'user', 'content': prompt}],
    ) as stream:
        for text in stream.text_stream:
            yield text


def get_full_scale_guide(sa_pitch: str) -> Generator[str, None, None]:
    """
    Stream a complete step-by-step guide through all 7 swaras for the given Sa.
    """
    client  = _build_client()
    context = _swara_context(sa_pitch)

    prompt = f"""The student wants a complete guide to sing all 7 swaras of their scale.

{context}

Guide them through each swara one by one (Sa → Re → Ga → Ma → Pa → Dha → Ni → Sa):
For each swara, briefly cover:
- The note name and harmonium key
- How to produce it vocally
- One practical tip or common mistake

End with guidance on how to sing the full Aaroh and Avaroh smoothly."""

    with client.messages.stream(
        model='claude-sonnet-4-6',
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=[{'role': 'user', 'content': prompt}],
    ) as stream:
        for text in stream.text_stream:
            yield text


def chat(
    user_message: str,
    conversation_history: list,
    sa_pitch: str | None = None,
) -> Generator[str, None, None]:
    """
    Stream a response to a free-form user question, maintaining conversation history.

    Args:
        user_message:          The student's latest message.
        conversation_history:  List of {'role': ..., 'content': ...} dicts (updated in place).
        sa_pitch:              Optional Sa pitch for context injection.

    Returns:
        Generator yielding streamed text chunks.
        Caller should append the full response to conversation_history after consuming.
    """
    client = _build_client()

    # Inject scale context into the first user message if sa_pitch is provided
    if sa_pitch and not conversation_history:
        context_prefix = f"[Student context: {_swara_context(sa_pitch)}]\n\n"
        enriched_message = context_prefix + user_message
    else:
        enriched_message = user_message

    messages = conversation_history + [{'role': 'user', 'content': enriched_message}]

    full_response = []

    with client.messages.stream(
        model='claude-sonnet-4-6',
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=messages,
    ) as stream:
        for text in stream.text_stream:
            full_response.append(text)
            yield text

    # Update history with both the user message and assistant response
    conversation_history.append({'role': 'user',      'content': user_message})
    conversation_history.append({'role': 'assistant', 'content': ''.join(full_response)})
