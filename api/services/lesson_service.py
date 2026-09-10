"""
Lesson and spaced repetition service.
Implements the SM-2 algorithm (same algorithm used by Anki).

SM-2 algorithm:
  - Quality q ∈ {0,1,2,3,4,5}
  - If q < 3 (failed recall): reset repetition counter and interval to 1
  - If q >= 3 (successful recall):
      n=0: interval = 1 day
      n=1: interval = 6 days
      n>1: interval = round(prev_interval * EF)
  - EF update: EF' = EF + (0.1 - (5-q)*(0.08 + (5-q)*0.02))
  - EF is clamped to minimum 1.3
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Literal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.models.user_progress import UserProgress
from api.models.word import Word
from api.models.phrase import Phrase
from api.schemas.lesson import FlashCard, LessonResponse, ProgressResponse


# ---------------------------------------------------------------------------
# SM-2 calculation
# ---------------------------------------------------------------------------

def sm2_update(
    ease_factor: float,
    interval: int,
    times_seen: int,
    quality: int,
) -> tuple[float, int, datetime]:
    """
    Apply one SM-2 review step.

    Returns:
        (new_ease_factor, new_interval_days, next_review_datetime)
    """
    if quality < 3:
        # Failed recall — restart sequence
        new_interval = 1
        new_ef = ease_factor  # EF doesn't change on failure
    else:
        if times_seen == 0:
            new_interval = 1
        elif times_seen == 1:
            new_interval = 6
        else:
            new_interval = round(interval * ease_factor)

        ef_delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
        new_ef = max(1.3, ease_factor + ef_delta)

    next_review = datetime.now(timezone.utc) + timedelta(days=new_interval)
    return new_ef, new_interval, next_review


# ---------------------------------------------------------------------------
# Lesson queries
# ---------------------------------------------------------------------------

async def get_lesson_cards(
    db: AsyncSession,
    category: str,
    user_id: uuid.UUID,
    limit: int = 20,
) -> LessonResponse:
    """
    Fetch flashcards for a category, annotated with the user's SM-2 progress.
    Returns cards due for review first (next_review <= now), then new cards.
    """
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    # Fetch verified words in the category
    word_stmt = select(Word).where(
        Word.category == category,
        Word.is_verified.is_(True),
    ).limit(limit)
    word_rows = (await db.execute(word_stmt)).scalars().all()

    # Fetch verified phrases in the category
    phrase_stmt = select(Phrase).where(
        Phrase.category == category,
        Phrase.is_verified.is_(True),
    ).limit(limit)
    phrase_rows = (await db.execute(phrase_stmt)).scalars().all()

    cards: list[FlashCard] = []

    for word in word_rows:
        progress = await _get_or_create_progress(db, user_id, word_id=word.id)
        cards.append(FlashCard(
            item_id=word.id,
            item_type="word",
            nuer_text=word.nuer_text,
            english_text=word.english_text,
            audio_url=word.audio_url,
            times_seen=progress.times_seen,
            times_correct=progress.times_correct,
            ease_factor=progress.ease_factor,
            next_review=progress.next_review,
        ))

    for phrase in phrase_rows:
        progress = await _get_or_create_progress(db, user_id, phrase_id=phrase.id)
        cards.append(FlashCard(
            item_id=phrase.id,
            item_type="phrase",
            nuer_text=phrase.nuer_text,
            english_text=phrase.english_text,
            audio_url=phrase.audio_url,
            times_seen=progress.times_seen,
            times_correct=progress.times_correct,
            ease_factor=progress.ease_factor,
            next_review=progress.next_review,
        ))

    # Sort: due cards first, then by ease_factor ascending (hardest first)
    cards.sort(key=lambda c: (
        (c.next_review.replace(tzinfo=None) if c.next_review.tzinfo else c.next_review) > now,
        c.ease_factor,
    ))
    return LessonResponse(category=category, cards=cards[:limit])


async def record_review(
    db: AsyncSession,
    user_id: uuid.UUID,
    item_id: uuid.UUID,
    item_type: Literal["word", "phrase"],
    quality: int,
) -> ProgressResponse:
    """Update the user's SM-2 progress record for a given flashcard."""
    if item_type == "word":
        progress = await _get_or_create_progress(db, user_id, word_id=item_id)
    else:
        progress = await _get_or_create_progress(db, user_id, phrase_id=item_id)

    new_ef, new_interval, next_review = sm2_update(
        ease_factor=progress.ease_factor,
        interval=progress.interval,
        times_seen=progress.times_seen,
        quality=quality,
    )

    progress.times_seen += 1
    if quality >= 3:
        progress.times_correct += 1
    progress.ease_factor = new_ef
    progress.interval = new_interval
    progress.next_review = next_review
    await db.flush()

    return ProgressResponse(
        item_id=item_id,
        item_type=item_type,
        next_review=next_review,
        ease_factor=new_ef,
        interval_days=new_interval,
    )


async def _get_or_create_progress(
    db: AsyncSession,
    user_id: uuid.UUID,
    word_id: uuid.UUID | None = None,
    phrase_id: uuid.UUID | None = None,
) -> UserProgress:
    """Fetch or create a UserProgress record for a user + item pair."""
    if word_id:
        stmt = select(UserProgress).where(
            UserProgress.user_id == user_id,
            UserProgress.word_id == word_id,
        )
    else:
        stmt = select(UserProgress).where(
            UserProgress.user_id == user_id,
            UserProgress.phrase_id == phrase_id,
        )

    result = await db.execute(stmt)
    progress = result.scalars().first()
    if not progress:
        progress = UserProgress(
            user_id=user_id,
            word_id=word_id,
            phrase_id=phrase_id,
        )
        db.add(progress)
        await db.flush()
    return progress
