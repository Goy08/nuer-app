"""
Contribution review service.
Handles approving/rejecting contributions and promoting approved data
into the words/phrases tables.
"""

import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from api.models.contribution import Contribution, ContributionStatus, ContributionType
from api.models.word import Word
from api.models.phrase import Phrase

logger = logging.getLogger(__name__)


async def review_contribution(
    db: AsyncSession,
    contribution_id: uuid.UUID,
    reviewer_id: uuid.UUID,
    status: ContributionStatus,
    review_notes: str | None,
) -> Contribution:
    """
    Approve or reject a contribution.
    On approval, the payload is promoted into the words/phrases table.
    """
    result = await db.execute(select(Contribution).where(Contribution.id == contribution_id))
    contribution = result.scalars().first()
    if not contribution:
        from fastapi import HTTPException  # noqa: PLC0415
        raise HTTPException(status_code=404, detail="Contribution not found")

    contribution.status = status
    contribution.reviewed_by = reviewer_id
    contribution.review_notes = review_notes

    if status == ContributionStatus.approved:
        await _promote_contribution(db, contribution, reviewer_id)

    await db.flush()
    return contribution


async def _promote_contribution(
    db: AsyncSession, contribution: Contribution, reviewer_id: uuid.UUID
) -> None:
    """Insert approved contribution data into the canonical tables."""
    payload = contribution.payload

    if contribution.type == ContributionType.word:
        word = Word(
            nuer_text=payload.get("nuer_text", ""),
            english_text=payload.get("english_text", ""),
            pronunciation=payload.get("pronunciation"),
            part_of_speech=payload.get("part_of_speech"),
            category=payload.get("category"),
            dialect=payload.get("dialect"),
            is_verified=True,
            contributor_id=contribution.contributor_id,
        )
        db.add(word)
        logger.info("Promoted word contribution %s to words table", contribution.id)

    elif contribution.type == ContributionType.phrase:
        phrase = Phrase(
            nuer_text=payload.get("nuer_text", ""),
            english_text=payload.get("english_text", ""),
            context=payload.get("context"),
            category=payload.get("category"),
            is_verified=True,
        )
        db.add(phrase)
        logger.info("Promoted phrase contribution %s to phrases table", contribution.id)

    elif contribution.type == ContributionType.correction:
        # Corrections update existing records
        target_type = payload.get("target_type")  # "word" or "phrase"
        target_id = payload.get("target_id")
        updates = payload.get("updates", {})
        if target_type == "word" and target_id:
            word_result = await db.execute(select(Word).where(Word.id == uuid.UUID(target_id)))
            word = word_result.scalars().first()
            if word:
                for field, value in updates.items():
                    if hasattr(word, field):
                        setattr(word, field, value)
        elif target_type == "phrase" and target_id:
            phrase_result = await db.execute(select(Phrase).where(Phrase.id == uuid.UUID(target_id)))
            phrase = phrase_result.scalars().first()
            if phrase:
                for field, value in updates.items():
                    if hasattr(phrase, field):
                        setattr(phrase, field, value)
