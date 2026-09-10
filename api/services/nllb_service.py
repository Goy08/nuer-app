"""
Translation service.

Translation lookup priority (CRITICAL business rule):
  1. Check words table for a verified human-curated match  →  source: "dictionary"
  2. Check phrases table for a verified human-curated match →  source: "dictionary"
  3. Check translation_cache (previous Google results)      →  source: "model"
  4. Call Google Translate, store in cache, return          →  source: "model"

Verified human data always wins over Google output.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.config import get_settings
from api.models.phrase import Phrase
from api.models.translation_cache import TranslationCache
from api.models.word import Word
from api.schemas.translate import TranslateResponse

if TYPE_CHECKING:
    pass

logger = logging.getLogger(__name__)
settings = get_settings()

# Map NLLB-style codes → Google Translate codes
_LANG_MAP = {
    "eng_Latn": "en",
    "nus_Latn": "nus",
}


async def warm_up_model() -> None:
    """No-op — Google Translate needs no warmup."""
    return


# ---------------------------------------------------------------------------
# Core translate function — calls Google Translate's public endpoint
# ---------------------------------------------------------------------------

async def _translate_with_google(text: str, source_lang: str, target_lang: str) -> str:
    sl = _LANG_MAP.get(source_lang, source_lang)
    tl = _LANG_MAP.get(target_lang, target_lang)
    url = "https://translate.googleapis.com/translate_a/single"
    params = {"client": "gtx", "sl": sl, "tl": tl, "dt": "t", "q": text}
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
        data = r.json()
        return "".join(chunk[0] for chunk in data[0] if chunk[0])


# ---------------------------------------------------------------------------
# Dictionary lookup helpers
# ---------------------------------------------------------------------------

async def _lookup_dictionary(
    db: AsyncSession, text: str, source_lang: str, target_lang: str
) -> TranslateResponse | None:
    """
    Check words and phrases tables for a verified entry.
    Only verified (is_verified=True) entries are returned — we never surface
    unverified crowdsourced content as authoritative.
    """
    text_lower = text.strip().lower()

    # --- Words table ---
    if source_lang == "eng_Latn":
        word_stmt = select(Word).where(
            Word.english_text.ilike(text_lower),
            Word.is_verified.is_(True),
        )
    else:
        word_stmt = select(Word).where(
            Word.nuer_text.ilike(text_lower),
            Word.is_verified.is_(True),
        )

    word_result = await db.execute(word_stmt)
    word = word_result.scalars().first()
    if word:
        translated = word.english_text if source_lang == "nus_Latn" else word.nuer_text
        return TranslateResponse(
            source_text=text,
            translated_text=translated,
            source_lang=source_lang,
            target_lang=target_lang,
            source="dictionary",
            entry_id=str(word.id),
            entry_type="word",
        )

    # --- Phrases table ---
    if source_lang == "eng_Latn":
        phrase_stmt = select(Phrase).where(
            Phrase.english_text.ilike(text_lower),
            Phrase.is_verified.is_(True),
        )
    else:
        phrase_stmt = select(Phrase).where(
            Phrase.nuer_text.ilike(text_lower),
            Phrase.is_verified.is_(True),
        )

    phrase_result = await db.execute(phrase_stmt)
    phrase = phrase_result.scalars().first()
    if phrase:
        translated = phrase.english_text if source_lang == "nus_Latn" else phrase.nuer_text
        return TranslateResponse(
            source_text=text,
            translated_text=translated,
            source_lang=source_lang,
            target_lang=target_lang,
            source="dictionary",
            entry_id=str(phrase.id),
            entry_type="phrase",
        )

    return None


async def _lookup_cache(
    db: AsyncSession, text: str, source_lang: str, target_lang: str
) -> TranslateResponse | None:
    """Check translation_cache for a previous model result."""
    stmt = select(TranslationCache).where(
        TranslationCache.source_text == text,
        TranslationCache.source_lang == source_lang,
        TranslationCache.target_lang == target_lang,
    )
    result = await db.execute(stmt)
    cached = result.scalars().first()
    if cached:
        return TranslateResponse(
            source_text=text,
            translated_text=cached.translated_text,
            source_lang=source_lang,
            target_lang=target_lang,
            source="model",
        )
    return None


async def _run_google_and_cache(
    db: AsyncSession, text: str, source_lang: str, target_lang: str
) -> TranslateResponse:
    """Call Google Translate, persist result to cache, return response."""
    translated_text = await _translate_with_google(text, source_lang, target_lang)

    # Persist to cache — only insert if the row doesn't already exist.
    # We check first rather than using dialect-specific ON CONFLICT so this
    # works with both PostgreSQL and SQLite (test env).
    existing = await _lookup_cache(db, text, source_lang, target_lang)
    if not existing:
        db.add(TranslationCache(
            source_text=text,
            source_lang=source_lang,
            target_lang=target_lang,
            translated_text=translated_text,
            model_version="google-translate",
        ))
        await db.commit()

    return TranslateResponse(
        source_text=text,
        translated_text=translated_text,
        source_lang=source_lang,
        target_lang=target_lang,
        source="model",
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def translate(
    db: AsyncSession,
    text: str,
    source_lang: str,
    target_lang: str,
) -> TranslateResponse:
    """
    Translate text applying the lookup priority:
      dictionary (verified) → cache → model
    """
    if source_lang == target_lang:
        return TranslateResponse(
            source_text=text,
            translated_text=text,
            source_lang=source_lang,
            target_lang=target_lang,
            source="dictionary",
        )

    # 1 & 2: Human-curated dictionary (words + phrases)
    dict_result = await _lookup_dictionary(db, text, source_lang, target_lang)
    if dict_result:
        logger.debug("Translation hit: dictionary for '%s'", text[:50])
        return dict_result

    # 3: Cached model result
    cache_result = await _lookup_cache(db, text, source_lang, target_lang)
    if cache_result:
        logger.debug("Translation hit: cache for '%s'", text[:50])
        return cache_result

    # 4: Google Translate
    logger.debug("Translation miss: calling Google Translate for '%s'", text[:50])
    return await _run_google_and_cache(db, text, source_lang, target_lang)
