from pydantic import BaseModel, Field
from typing import Literal
import uuid
from datetime import datetime


class FlashCard(BaseModel):
    item_id: uuid.UUID
    item_type: Literal["word", "phrase"]
    nuer_text: str
    english_text: str
    audio_url: str | None
    times_seen: int
    times_correct: int
    ease_factor: float
    next_review: datetime


class LessonResponse(BaseModel):
    category: str
    cards: list[FlashCard]


class ProgressUpdate(BaseModel):
    item_id: uuid.UUID
    item_type: Literal["word", "phrase"]
    # SM-2 quality score: 0 = complete blackout, 5 = perfect recall
    quality: int = Field(ge=0, le=5)


class ProgressResponse(BaseModel):
    item_id: uuid.UUID
    item_type: str
    next_review: datetime
    ease_factor: float
    interval_days: int
