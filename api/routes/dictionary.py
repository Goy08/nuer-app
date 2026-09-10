import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.database import get_db
from api.models.word import Word
from api.models.phrase import Phrase
from api.schemas.dictionary import DictionarySearchResponse, PhraseResponse, WordResponse
from api.services.audio_service import get_presigned_url

router = APIRouter(prefix="/dictionary", tags=["dictionary"])


@router.get("/search", response_model=DictionarySearchResponse)
async def search(
    q: str = Query(..., min_length=1, description="Search term (Nuer or English)"),
    db: AsyncSession = Depends(get_db),
):
    """Full-text search across verified words and phrases in both languages."""
    pattern = f"%{q}%"

    word_stmt = select(Word).where(
        Word.is_verified.is_(True),
        or_(Word.nuer_text.ilike(pattern), Word.english_text.ilike(pattern)),
    ).limit(50)
    words = (await db.execute(word_stmt)).scalars().all()

    phrase_stmt = select(Phrase).where(
        Phrase.is_verified.is_(True),
        or_(Phrase.nuer_text.ilike(pattern), Phrase.english_text.ilike(pattern)),
    ).limit(50)
    phrases = (await db.execute(phrase_stmt)).scalars().all()

    return DictionarySearchResponse(
        words=[WordResponse.model_validate(w) for w in words],
        phrases=[PhraseResponse.model_validate(p) for p in phrases],
        total=len(words) + len(phrases),
    )


@router.get("/category/{name}", response_model=DictionarySearchResponse)
async def by_category(name: str, db: AsyncSession = Depends(get_db)):
    """Return all verified words and phrases for a given category."""
    words = (
        await db.execute(
            select(Word).where(Word.category == name, Word.is_verified.is_(True))
        )
    ).scalars().all()

    phrases = (
        await db.execute(
            select(Phrase).where(Phrase.category == name, Phrase.is_verified.is_(True))
        )
    ).scalars().all()

    return DictionarySearchResponse(
        words=[WordResponse.model_validate(w) for w in words],
        phrases=[PhraseResponse.model_validate(p) for p in phrases],
        total=len(words) + len(phrases),
    )


@router.get("/word/{word_id}", response_model=WordResponse)
async def get_word(word_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Fetch a single word entry. Audio URL is returned as a pre-signed S3 URL."""
    result = await db.execute(select(Word).where(Word.id == word_id))
    word = result.scalars().first()
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")

    word_data = WordResponse.model_validate(word)
    # Swap the stored S3 key for a fresh pre-signed URL
    if word.audio_url:
        try:
            word_data.audio_url = get_presigned_url(word.audio_url)
        except Exception:
            pass  # Return the raw key if S3 is unreachable (dev/test)

    return word_data
