import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.database import get_db
from api.models.word import Word
from api.services.audio_service import get_presigned_url

router = APIRouter(prefix="/audio", tags=["audio"])


@router.get("/{word_id}")
async def get_audio_url(word_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Return a pre-signed S3 URL for a word's audio file (valid for 1 hour)."""
    result = await db.execute(select(Word).where(Word.id == word_id))
    word = result.scalars().first()
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")
    if not word.audio_url:
        raise HTTPException(status_code=404, detail="No audio available for this word")

    url = get_presigned_url(word.audio_url)
    return {"word_id": word_id, "audio_url": url, "expires_in_seconds": 3600}
