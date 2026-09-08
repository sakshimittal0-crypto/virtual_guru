"""
app.py
Streamlit UI for the Hindustani Swara Guide.
Ties together swara_mapper, audio_player, and the Claude AI agent.
"""

import threading
import streamlit as st

from swara_mapper import (
    SEMITONES, INDIAN_PITCH_NAMES,
    get_swara_info, get_aaroh_avaroh, get_shuddha_swara_map,
)
from audio_player import play_note, play_aaroh, play_avaroh, play_aaroh_avaroh, stop_all
from agent import get_scale_introduction, get_swara_guide, get_full_scale_guide, chat

# ---------------------------------------------------------------------------
# Page config
# ---------------------------------------------------------------------------
st.set_page_config(
    page_title='Hindustani Swara Guide',
    page_icon='🎵',
    layout='wide',
)

# ---------------------------------------------------------------------------
# Session state defaults
# ---------------------------------------------------------------------------
if 'chat_history'  not in st.session_state: st.session_state.chat_history  = []
if 'sa_pitch'      not in st.session_state: st.session_state.sa_pitch      = 'C'
if 'audio_thread'  not in st.session_state: st.session_state.audio_thread  = None

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _play_in_thread(fn, *args, **kwargs):
    """Run a blocking audio function in a background thread."""
    t = threading.Thread(target=fn, args=args, kwargs=kwargs, daemon=True)
    t.start()
    st.session_state.audio_thread = t


def _harmonium_keyboard_html(active_notes: list, sa_note: str) -> str:
    """
    Build a 2-octave SVG harmonium keyboard with a Sa→Sa bracket showing one full scale.
    active_notes: list of Western note names in the current scale.
    sa_note:      the root/tonic note.
    """
    CHROMATIC   = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
    WHITE_NOTES = ['C','D','E','F','G','A','B']
    # Black key left-edge offset as fraction of white-key width within each octave
    BLACK_OFFSETS = {'C#': 0.65, 'D#': 1.65, 'F#': 3.65, 'G#': 4.65, 'A#': 5.65}

    W   = 48   # white key width
    H   = 155  # white key height
    BW  = 30   # black key width
    BH  = 98   # black key height
    PAD = 10   # left/right padding
    KY  = 40   # keyboard y-start (space for bracket above)

    # Build key list for 2 octaves
    # Each entry: {'note', 'is_white', 'chrom_idx', 'x', 'white_idx'}
    keys = []
    white_idx = 0
    for oct in range(2):
        for si, note in enumerate(CHROMATIC):
            chrom_idx = oct * 12 + si
            is_white  = note in WHITE_NOTES
            if is_white:
                x = PAD + white_idx * W
                keys.append({'note': note, 'is_white': True,
                             'chrom_idx': chrom_idx, 'x': x, 'w': W - 2})
                white_idx += 1
            else:
                x = int(PAD + (oct * 7 + BLACK_OFFSETS[note]) * W)
                keys.append({'note': note, 'is_white': False,
                             'chrom_idx': chrom_idx, 'x': x, 'w': BW})

    # Sa chromatic indices
    sa_chrom_0 = CHROMATIC.index(sa_note)       # lower Sa (octave 0)
    sa_chrom_1 = sa_chrom_0 + 12                # upper Sa (octave 1)

    # Active chromatic indices = scale notes between lower_sa and upper_sa
    active_chroms = {
        ci for ci in range(sa_chrom_0, sa_chrom_1 + 1)
        if CHROMATIC[ci % 12] in active_notes
    }

    swara_lookup = {info['note']: info['swara'] for info in get_swara_info(sa_note)}

    def key_fill(k):
        ci = k['chrom_idx']
        if ci in (sa_chrom_0, sa_chrom_1):
            return ('#e63946', '#fff')   # Sa — red
        if ci in active_chroms:
            return (('#f4a261', '#333') if k['is_white'] else ('#e76f51', '#fff'))
        return (('#fffbf0', '#999') if k['is_white'] else ('#1a1a2e', '#555'))

    def swara_label(k):
        ci = k['chrom_idx']
        if ci == sa_chrom_1:
            return "Sa'"
        if ci in active_chroms or ci == sa_chrom_0:
            return swara_lookup.get(k['note'], '')
        return ''

    total_w = PAD * 2 + 14 * W
    total_h = KY + H + 38

    lines = [
        f'<svg width="{total_w}" height="{total_h}" '
        f'xmlns="http://www.w3.org/2000/svg" style="font-family:sans-serif;">'
    ]

    # ── Sa→Sa bracket above keyboard ──────────────────────────────────────
    lower_sa_key = next((k for k in keys if k['chrom_idx'] == sa_chrom_0), None)
    upper_sa_key = next((k for k in keys if k['chrom_idx'] == sa_chrom_1), None)
    if lower_sa_key and upper_sa_key:
        x1 = lower_sa_key['x']
        x2 = upper_sa_key['x'] + upper_sa_key['w']
        by = 24
        lines += [
            f'<line x1="{x1}" y1="{by}" x2="{x2}" y2="{by}" '
            f'stroke="#e63946" stroke-width="2.5"/>',
            f'<line x1="{x1}" y1="{by-6}" x2="{x1}" y2="{by+6}" '
            f'stroke="#e63946" stroke-width="2.5"/>',
            f'<line x1="{x2}" y1="{by-6}" x2="{x2}" y2="{by+6}" '
            f'stroke="#e63946" stroke-width="2.5"/>',
            f'<text x="{(x1+x2)//2}" y="{by-9}" text-anchor="middle" '
            f'font-size="12" fill="#e63946" font-weight="bold">'
            f'Sa → Sa  (one full octave)</text>',
        ]

    # ── White keys (draw first so black keys appear on top) ───────────────
    for k in keys:
        if not k['is_white']:
            continue
        fill, txt = key_fill(k)
        swara = swara_label(k)
        x, y  = k['x'], KY
        lines.append(
            f'<rect x="{x}" y="{y}" width="{k["w"]}" height="{H}" '
            f'rx="4" fill="{fill}" stroke="#aaa" stroke-width="1.2"/>'
        )
        if swara:
            lines.append(
                f'<text x="{x + W//2 - 1}" y="{y + H - 28}" '
                f'text-anchor="middle" font-size="12" fill="{txt}" font-weight="bold">'
                f'{swara}</text>'
            )
        lines.append(
            f'<text x="{x + W//2 - 1}" y="{y + H - 12}" '
            f'text-anchor="middle" font-size="10" fill="{txt}">{k["note"]}</text>'
        )

    # ── Black keys ─────────────────────────────────────────────────────────
    for k in keys:
        if k['is_white']:
            continue
        fill, txt = key_fill(k)
        swara = swara_label(k)
        x, y  = k['x'], KY
        lines.append(
            f'<rect x="{x}" y="{y}" width="{BW}" height="{BH}" '
            f'rx="3" fill="{fill}" stroke="#222" stroke-width="1"/>'
        )
        if swara:
            lines.append(
                f'<text x="{x + BW//2}" y="{y + BH - 16}" '
                f'text-anchor="middle" font-size="10" fill="{txt}" font-weight="bold">'
                f'{swara}</text>'
            )
            lines.append(
                f'<text x="{x + BW//2}" y="{y + BH - 4}" '
                f'text-anchor="middle" font-size="9" fill="{txt}">{k["note"]}</text>'
            )

    # ── Octave divider ─────────────────────────────────────────────────────
    div_x = PAD + 7 * W
    lines.append(
        f'<line x1="{div_x}" y1="{KY}" x2="{div_x}" y2="{KY + H}" '
        f'stroke="#bbb" stroke-width="1.5" stroke-dasharray="4,3"/>'
    )

    # ── Legend ─────────────────────────────────────────────────────────────
    leg_y  = KY + H + 14
    legend = [('#e63946','Sa (root)'), ('#f4a261','Active swara'), ('#1a1a2e','Inactive')]
    lx = PAD
    for color, label in legend:
        lines += [
            f'<rect x="{lx}" y="{leg_y}" width="13" height="13" rx="2" '
            f'fill="{color}" stroke="#aaa" stroke-width="0.5"/>',
            f'<text x="{lx+17}" y="{leg_y+11}" font-size="11" fill="#555">{label}</text>',
        ]
        lx += 120

    lines.append('</svg>')
    return '\n'.join(lines)


# ---------------------------------------------------------------------------
# Sidebar — pitch selector
# ---------------------------------------------------------------------------
with st.sidebar:
    st.title('🎵 Swara Guide')
    st.markdown('---')

    pitch_options = [f"{n}  ({INDIAN_PITCH_NAMES[n]})" for n in SEMITONES]
    selected_idx  = st.selectbox(
        'Select your Sa (pitch)',
        options=range(len(SEMITONES)),
        format_func=lambda i: pitch_options[i],
        index=SEMITONES.index(st.session_state.sa_pitch),
    )
    st.session_state.sa_pitch = SEMITONES[selected_idx]
    sa = st.session_state.sa_pitch

    st.markdown(f'**Sa =** `{sa}` — {INDIAN_PITCH_NAMES[sa]}')
    st.markdown('---')

    if st.button('⏹ Stop Audio', use_container_width=True):
        stop_all()

    st.markdown('---')
    st.caption('Phases complete: Setup · Audio · Agent · UI')

# ---------------------------------------------------------------------------
# Main content
# ---------------------------------------------------------------------------
sa          = st.session_state.sa_pitch
swara_info  = get_swara_info(sa)
swara_map   = get_shuddha_swara_map(sa)
active_notes = list(swara_map.values())
seq         = get_aaroh_avaroh(sa)

st.title(f'Hindustani Swara Guide — Sa: {sa} ({INDIAN_PITCH_NAMES[sa]})')

# ── Harmonium keyboard ──────────────────────────────────────────────────────
st.subheader('Harmonium — 2 Octaves')
st.markdown(
    _harmonium_keyboard_html(active_notes, sa),
    unsafe_allow_html=True,
)

st.markdown('')

# ── Swara map table ─────────────────────────────────────────────────────────
st.subheader('Your Swara Map')
cols = st.columns(7)
for i, info in enumerate(swara_info):
    with cols[i]:
        is_sa = info['swara'] == 'Sa'
        is_pa = info['swara'] == 'Pa'
        bg    = '#e63946' if is_sa else ('#2a9d8f' if is_pa else '#f4a261')
        st.markdown(
            f"""<div style="background:{bg};color:white;padding:10px 6px;
                border-radius:8px;text-align:center;margin-bottom:6px">
                <div style="font-size:1.3rem;font-weight:bold">{info['swara']}</div>
                <div style="font-size:1rem">{info['note']}</div>
                <div style="font-size:0.75rem;opacity:0.9">{info['indian_name']}</div>
            </div>""",
            unsafe_allow_html=True,
        )
        if st.button('▶', key=f'play_{info["swara"]}', use_container_width=True):
            _play_in_thread(play_note, info['note'])

st.markdown('---')

# ── Scale playback controls ─────────────────────────────────────────────────
st.subheader('Play Scale')

aaroh_str  = ' → '.join(seq['aaroh'])
avaroh_str = ' → '.join(seq['avaroh'])
st.caption(f'Aaroh:  {aaroh_str}')
st.caption(f'Avaroh: {avaroh_str}')

c1, c2, c3 = st.columns(3)
with c1:
    if st.button('▶ Aaroh', use_container_width=True):
        _play_in_thread(play_aaroh, sa)
with c2:
    if st.button('▶ Avaroh', use_container_width=True):
        _play_in_thread(play_avaroh, sa)
with c3:
    if st.button('▶ Aaroh + Avaroh', use_container_width=True):
        _play_in_thread(play_aaroh_avaroh, sa)

st.markdown('---')

# ── AI Guide ────────────────────────────────────────────────────────────────
st.subheader('🤖 Ustad Ji — AI Singing Guide')

g1, g2, g3 = st.columns(3)
with g1:
    if st.button('📖 Introduce this scale', use_container_width=True):
        with st.chat_message('assistant'):
            response = st.write_stream(get_scale_introduction(sa))
        st.session_state.chat_history.append(
            {'role': 'assistant', 'content': response}
        )
with g2:
    if st.button('📚 Guide me through all swaras', use_container_width=True):
        with st.chat_message('assistant'):
            response = st.write_stream(get_full_scale_guide(sa))
        st.session_state.chat_history.append(
            {'role': 'assistant', 'content': response}
        )
with g3:
    swara_options = [info['swara'] for info in swara_info]
    selected_swara = st.selectbox('Guide me on:', swara_options, label_visibility='collapsed')
    if st.button(f'🎵 Guide on {selected_swara}', use_container_width=True):
        with st.chat_message('assistant'):
            response = st.write_stream(get_swara_guide(sa, selected_swara))
        st.session_state.chat_history.append(
            {'role': 'assistant', 'content': response}
        )

st.markdown('')

# ── Chat history ─────────────────────────────────────────────────────────────
for msg in st.session_state.chat_history:
    with st.chat_message(msg['role']):
        st.markdown(msg['content'])

# ── Chat input ───────────────────────────────────────────────────────────────
if user_input := st.chat_input('Ask Ustad Ji anything about your scale or swaras...'):
    with st.chat_message('user'):
        st.markdown(user_input)
    st.session_state.chat_history.append({'role': 'user', 'content': user_input})

    with st.chat_message('assistant'):
        response = st.write_stream(
            chat(user_input, st.session_state.chat_history, sa_pitch=sa)
        )
