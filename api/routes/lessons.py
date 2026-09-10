from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from api.database import get_db
from api.dependencies import get_current_user
from api.models.user import User
from api.schemas.lesson import LessonResponse, ProgressResponse, ProgressUpdate
from api.services import lesson_service

router = APIRouter(prefix="/lessons", tags=["lessons"])


@router.get("/{category}", response_model=LessonResponse)
async def get_lesson(
    category: str,
    limit: int = Query(20, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a flashcard set for a lesson category.
    Cards due for review are returned first; new cards follow.
    """
    return await lesson_service.get_lesson_cards(
        db=db,
        category=category,
        user_id=current_user.id,
        limit=limit,
    )


@router.post("/progress", response_model=ProgressResponse)
async def update_progress(
    body: ProgressUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submit a review result for a flashcard.
    Quality score 0-5 (SM-2): 0=blackout, 3=correct with effort, 5=perfect recall.
    Updates the spaced repetition schedule for this item.
    """
    return await lesson_service.record_review(
        db=db,
        user_id=current_user.id,
        item_id=body.item_id,
        item_type=body.item_type,
        quality=body.quality,
    )
