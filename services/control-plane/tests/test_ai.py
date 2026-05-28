"""AI provider abstraction tests."""

from __future__ import annotations

import pytest

from app.services.ai import get_ai_provider
from app.services.ai.base import extract_json


@pytest.mark.asyncio
async def test_offline_provider_text():
    provider = get_ai_provider()
    assert provider.name == "offline"
    result = await provider.generate("hello")
    assert result.provider == "offline"
    assert isinstance(result.text, str) and result.text


@pytest.mark.asyncio
async def test_offline_provider_json():
    provider = get_ai_provider()
    result = await provider.generate("hello", json=True)
    assert result.json_payload is not None
    assert result.json_payload.get("offline") is True


def test_extract_json_fenced():
    text = 'prelude\n```json\n{"a": 1, "b": [1,2]}\n```\ntrailing'
    assert extract_json(text) == {"a": 1, "b": [1, 2]}


def test_extract_json_bare_object():
    assert extract_json('noise {"x": true} more') == {"x": True}


def test_extract_json_array_wrapped():
    assert extract_json("[1, 2, 3]") == {"items": [1, 2, 3]}


def test_extract_json_none_on_garbage():
    assert extract_json("no json here") is None
    assert extract_json("") is None
