"""
Unit tests for agent.py
All Claude API calls are mocked — no real API key needed.
Run with: python -m pytest tests/test_agent.py -v
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from unittest.mock import patch, MagicMock, PropertyMock


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_mock_stream(text_chunks: list):
    """Return a mock context manager that yields text chunks via text_stream."""
    mock_stream = MagicMock()
    mock_stream.__enter__ = MagicMock(return_value=mock_stream)
    mock_stream.__exit__ = MagicMock(return_value=False)
    mock_stream.text_stream = iter(text_chunks)
    return mock_stream


# ---------------------------------------------------------------------------
# _swara_context
# ---------------------------------------------------------------------------

class TestSwaraContext:
    def test_contains_sa_pitch(self):
        from agent import _swara_context
        ctx = _swara_context('D')
        assert 'D' in ctx

    def test_contains_all_swaras(self):
        from agent import _swara_context
        ctx = _swara_context('C')
        for swara in ['Sa', 'Re', 'Ga', 'Ma', 'Pa', 'Dha', 'Ni']:
            assert swara in ctx

    def test_contains_harmonium_key_name(self):
        from agent import _swara_context
        ctx = _swara_context('C')
        assert 'Safed 1' in ctx   # C = Safed 1


# ---------------------------------------------------------------------------
# _build_client
# ---------------------------------------------------------------------------

class TestBuildClient:
    def test_raises_if_no_api_key(self):
        from agent import _build_client
        with patch.dict(os.environ, {'ANTHROPIC_API_KEY': 'your_api_key_here'}):
            with pytest.raises(EnvironmentError, match='ANTHROPIC_API_KEY'):
                _build_client()

    def test_returns_client_with_valid_key(self):
        from agent import _build_client
        with patch.dict(os.environ, {'ANTHROPIC_API_KEY': 'sk-test-validkey'}):
            with patch('anthropic.Anthropic') as mock_cls:
                _build_client()
                mock_cls.assert_called_once_with(api_key='sk-test-validkey')


# ---------------------------------------------------------------------------
# get_scale_introduction
# ---------------------------------------------------------------------------

class TestGetScaleIntroduction:
    @patch('agent._build_client')
    def test_streams_text(self, mock_build):
        mock_client = MagicMock()
        mock_build.return_value = mock_client
        mock_client.messages.stream.return_value = _make_mock_stream(
            ['Welcome', ' to', ' your', ' scale!']
        )

        from agent import get_scale_introduction
        result = ''.join(get_scale_introduction('D'))
        assert result == 'Welcome to your scale!'

    @patch('agent._build_client')
    def test_passes_sa_pitch_in_prompt(self, mock_build):
        mock_client = MagicMock()
        mock_build.return_value = mock_client
        mock_client.messages.stream.return_value = _make_mock_stream(['ok'])

        from agent import get_scale_introduction
        list(get_scale_introduction('F#'))

        call_kwargs = mock_client.messages.stream.call_args[1]
        prompt = call_kwargs['messages'][0]['content']
        assert 'F#' in prompt


# ---------------------------------------------------------------------------
# get_swara_guide
# ---------------------------------------------------------------------------

class TestGetSwaraGuide:
    @patch('agent._build_client')
    def test_streams_text_for_valid_swara(self, mock_build):
        mock_client = MagicMock()
        mock_build.return_value = mock_client
        mock_client.messages.stream.return_value = _make_mock_stream(['Ga guide'])

        from agent import get_swara_guide
        result = ''.join(get_swara_guide('C', 'Ga'))
        assert result == 'Ga guide'

    def test_raises_for_invalid_swara(self):
        from agent import get_swara_guide
        with patch('agent._build_client'):
            with pytest.raises(ValueError, match="Unknown swara"):
                list(get_swara_guide('C', 'Xa'))

    @patch('agent._build_client')
    def test_prompt_contains_swara_and_note(self, mock_build):
        mock_client = MagicMock()
        mock_build.return_value = mock_client
        mock_client.messages.stream.return_value = _make_mock_stream(['ok'])

        from agent import get_swara_guide
        list(get_swara_guide('C', 'Pa'))

        call_kwargs = mock_client.messages.stream.call_args[1]
        prompt = call_kwargs['messages'][0]['content']
        assert 'Pa' in prompt
        assert 'G' in prompt   # Pa on C scale = G


# ---------------------------------------------------------------------------
# chat
# ---------------------------------------------------------------------------

class TestChat:
    @patch('agent._build_client')
    def test_streams_and_updates_history(self, mock_build):
        mock_client = MagicMock()
        mock_build.return_value = mock_client
        mock_client.messages.stream.return_value = _make_mock_stream(
            ['Hello', ' student!']
        )

        from agent import chat
        history = []
        result = ''.join(chat('How do I sing Sa?', history, sa_pitch='D'))

        assert result == 'Hello student!'
        # History should now have user + assistant turns
        assert len(history) == 2
        assert history[0]['role'] == 'user'
        assert history[1]['role'] == 'assistant'
        assert history[1]['content'] == 'Hello student!'

    @patch('agent._build_client')
    def test_injects_context_on_first_message(self, mock_build):
        mock_client = MagicMock()
        mock_build.return_value = mock_client
        mock_client.messages.stream.return_value = _make_mock_stream(['ok'])

        from agent import chat
        history = []
        list(chat('Teach me', history, sa_pitch='C'))

        call_kwargs = mock_client.messages.stream.call_args[1]
        first_msg = call_kwargs['messages'][0]['content']
        assert 'Student context' in first_msg

    @patch('agent._build_client')
    def test_no_context_injection_on_followup(self, mock_build):
        mock_client = MagicMock()
        mock_build.return_value = mock_client
        mock_client.messages.stream.return_value = _make_mock_stream(['ok'])

        from agent import chat
        # Pre-populate history — simulates a follow-up message
        history = [
            {'role': 'user',      'content': 'first message'},
            {'role': 'assistant', 'content': 'first response'},
        ]
        list(chat('Follow up question', history, sa_pitch='C'))

        call_kwargs = mock_client.messages.stream.call_args[1]
        last_msg = call_kwargs['messages'][-1]['content']
        # Follow-up should NOT have context injected
        assert 'Student context' not in last_msg
