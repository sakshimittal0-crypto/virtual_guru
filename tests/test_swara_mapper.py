"""
Unit tests for swara_mapper.py
Run with: python -m pytest tests/
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from swara_mapper import (
    resolve_pitch,
    get_shuddha_swara_map,
    get_full_swara_map,
    get_aaroh_avaroh,
    get_swara_info,
    SEMITONES,
)


class TestResolvePitch:
    def test_western_notation(self):
        assert resolve_pitch('C') == 'C'
        assert resolve_pitch('C#') == 'C#'
        assert resolve_pitch('D') == 'D'

    def test_western_case_insensitive(self):
        assert resolve_pitch('c') == 'C'
        assert resolve_pitch('f#') == 'F#'

    def test_indian_notation(self):
        assert resolve_pitch('Kali 1') == 'C#'
        assert resolve_pitch('Safed 2') == 'D'
        assert resolve_pitch('Kali 4') == 'G#'

    def test_indian_case_insensitive(self):
        assert resolve_pitch('kali 1') == 'C#'
        assert resolve_pitch('SAFED 2') == 'D'

    def test_invalid_pitch_raises(self):
        with pytest.raises(ValueError):
            resolve_pitch('Z')
        with pytest.raises(ValueError):
            resolve_pitch('Kali 9')


class TestShuddhaSwara:
    def test_c_scale(self):
        result = get_shuddha_swara_map('C')
        assert result == {
            'Sa': 'C', 'Re': 'D', 'Ga': 'E',
            'Ma': 'F', 'Pa': 'G', 'Dha': 'A', 'Ni': 'B'
        }

    def test_d_scale(self):
        result = get_shuddha_swara_map('D')
        assert result == {
            'Sa': 'D', 'Re': 'E', 'Ga': 'F#',
            'Ma': 'G', 'Pa': 'A', 'Dha': 'B', 'Ni': 'C#'
        }

    def test_all_notes_in_semitones(self):
        for sa in SEMITONES:
            result = get_shuddha_swara_map(sa)
            assert len(result) == 7
            for note in result.values():
                assert note in SEMITONES

    def test_wrap_around(self):
        # Sa on B — notes should wrap around the octave
        result = get_shuddha_swara_map('B')
        assert result['Sa'] == 'B'
        assert result['Re'] == 'C#'
        assert result['Pa'] == 'F#'


class TestAarohAvaroh:
    def test_aaroh_ascending_ends_on_sa(self):
        seq = get_aaroh_avaroh('C')
        # 8 notes: Sa Re Ga Ma Pa Dha Ni Sa (upper Sa completes the octave)
        assert seq['aaroh'] == ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C']

    def test_aaroh_starts_and_ends_with_sa(self):
        seq = get_aaroh_avaroh('D')
        assert seq['aaroh'][0] == seq['aaroh'][-1] == 'D'

    def test_avaroh_starts_from_upper_sa(self):
        seq = get_aaroh_avaroh('C')
        # 8 notes: Sa Ni Dha Pa Ma Ga Re Sa
        assert seq['avaroh'] == ['C', 'B', 'A', 'G', 'F', 'E', 'D', 'C']

    def test_avaroh_starts_and_ends_with_sa(self):
        seq = get_aaroh_avaroh('D')
        assert seq['avaroh'][0] == seq['avaroh'][-1] == 'D'

    def test_full_sequence_length(self):
        seq = get_aaroh_avaroh('C')
        assert len(seq['aaroh']) == 8
        assert len(seq['avaroh']) == 8


class TestSwaraInfo:
    def test_returns_7_entries(self):
        info = get_swara_info('C')
        assert len(info) == 7

    def test_entry_has_required_keys(self):
        info = get_swara_info('C')
        for entry in info:
            assert 'swara' in entry
            assert 'note' in entry
            assert 'indian_name' in entry
            assert 'description' in entry

    def test_sa_is_fixed(self):
        for sa in SEMITONES:
            info = get_swara_info(sa)
            sa_entry = next(e for e in info if e['swara'] == 'Sa')
            assert sa_entry['note'] == sa
