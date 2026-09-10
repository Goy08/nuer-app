"""
Tests for the translate endpoint and lookup priority logic.

The NLLB model is mocked so these tests run without GPU/downloading weights.
Dictionary hits are tested end-to-end using real database fixtures.
"""

import pytest
import uuid
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from api.models.word import Word
from api.models.phrase import Phrase


async def _seed_word(db: AsyncSession) -> Word:
    word = Word(
        nuer_text="malo",
        english_text="hello",
        is_verified=True,
        category="greetings",
    )
    db.add(word)
    await db.flush()
    return word


async def _seed_phrase(db: AsyncSession) -> Phrase:
    phrase = Phrase(
        nuer_text="Ca be cath",
        english_text="How are you?",
        is_verified=True,
        category="greetings",
    )
    db.add(phrase)
    await db.flush()
    return phrase


@pytest.mark.asyncio
async def test_translate_hits_dictionary_word(client: AsyncClient, db_session: AsyncSession):
    """Verified word in dictionary should be returned with source='dictionary'."""
    await _seed_word(db_session)

    resp = await client.post("/translate", json={
        "text": "hello",
        "source_lang": "eng_Latn",
        "target_lang": "nus_Latn",
    })
    assert resp.status_code == 200
    body = resp.json()
    assert body["source"] == "dictionary"
    assert body["translated_text"] == "malo"
    assert body["entry_type"] == "word"


@pytest.mark.asyncio
async def test_translate_hits_dictionary_phrase(client: AsyncClient, db_session: AsyncSession):
    """Verified phrase in dictionary should be returned with source='dictionary'."""
    await _seed_phrase(db_session)

    resp = await client.post("/translate", json={
        "text": "How are you?",
        "source_lang": "eng_Latn",
        "target_lang": "nus_Latn",
    })
    assert resp.status_code == 200
    body = resp.json()
    assert body["source"] == "dictionary"
    assert body["entry_type"] == "phrase"


@pytest.mark.asyncio
async def test_translate_falls_back_to_model(client: AsyncClient, db_session: AsyncSession):
    """Unknown text should fall back to the model (mocked here)."""
    mock_translation = "mock nuer output"

    with patch(
        "api.services.nllb_service._translate_with_google",
        new=AsyncMock(return_value=mock_translation),
    ):
        resp = await client.post("/translate", json={
            "text": "This sentence is not in the dictionary",
            "source_lang": "eng_Latn",
            "target_lang": "nus_Latn",
        })

    assert resp.status_code == 200
    body = resp.json()
    assert body["source"] == "model"
    assert body["translated_text"] == mock_translation


@pytest.mark.asyncio
async def test_translate_dictionary_beats_cache(client: AsyncClient, db_session: AsyncSession):
    """
    Even if a cache entry exists for the same text, a verified dictionary
    entry must win and return source='dictionary'.
    """
    from api.models.translation_cache import TranslationCache

    # Seed both a cache entry and a verified dictionary word
    cache_entry = TranslationCache(
        source_text="hello",
        source_lang="eng_Latn",
        target_lang="nus_Latn",
        translated_text="stale_model_output",
        model_version="facebook/nllb-200-distilled-600M",
    )
    db_session.add(cache_entry)
    await _seed_word(db_session)

    resp = await client.post("/translate", json={
        "text": "hello",
        "source_lang": "eng_Latn",
        "target_lang": "nus_Latn",
    })

    assert resp.status_code == 200
    body = resp.json()
    # Dictionary must win
    assert body["source"] == "dictionary"
    assert body["translated_text"] == "malo"


@pytest.mark.asyncio
async def test_translate_same_lang_passthrough(client: AsyncClient):
    """Same source and target language should return the original text unchanged."""
    resp = await client.post("/translate", json={
        "text": "hello",
        "source_lang": "eng_Latn",
        "target_lang": "eng_Latn",
    })
    assert resp.status_code == 200
    assert resp.json()["translated_text"] == "hello"
    assert resp.json()["source"] == "dictionary"
