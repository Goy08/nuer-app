"""Tests for the dictionary search and lookup endpoints."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from api.models.word import Word
from api.models.phrase import Phrase


async def _seed(db: AsyncSession):
    words = [
        Word(nuer_text="malo", english_text="hello", is_verified=True, category="greetings"),
        Word(nuer_text="ba", english_text="water", is_verified=True, category="nature"),
        Word(nuer_text="unverified_word", english_text="unverified", is_verified=False, category="greetings"),
    ]
    phrases = [
        Phrase(nuer_text="Ca be cath", english_text="How are you?", is_verified=True, category="greetings"),
    ]
    for w in words:
        db.add(w)
    for p in phrases:
        db.add(p)
    await db.flush()


@pytest.mark.asyncio
async def test_search_returns_verified_only(client: AsyncClient, db_session: AsyncSession):
    await _seed(db_session)
    resp = await client.get("/dictionary/search?q=unverified")
    assert resp.status_code == 200
    body = resp.json()
    # unverified entries must not appear
    assert body["total"] == 0


@pytest.mark.asyncio
async def test_search_finds_english_word(client: AsyncClient, db_session: AsyncSession):
    await _seed(db_session)
    resp = await client.get("/dictionary/search?q=hello")
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1


@pytest.mark.asyncio
async def test_search_finds_nuer_word(client: AsyncClient, db_session: AsyncSession):
    await _seed(db_session)
    resp = await client.get("/dictionary/search?q=malo")
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1


@pytest.mark.asyncio
async def test_category_lookup(client: AsyncClient, db_session: AsyncSession):
    await _seed(db_session)
    resp = await client.get("/dictionary/category/greetings")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] >= 2  # "malo" word + "Ca be cath" phrase


@pytest.mark.asyncio
async def test_word_not_found(client: AsyncClient):
    import uuid
    resp = await client.get(f"/dictionary/word/{uuid.uuid4()}")
    assert resp.status_code == 404
