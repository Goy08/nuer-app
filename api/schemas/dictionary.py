from pydantic import BaseModel
import uuid
from datetime import datetime


class WordResponse(BaseModel):
    id: uuid.UUID
    nuer_text: str
    english_text: str
    pronunciation: str | None
    part_of_speech: str | None
    category: str | None
    audio_url: str | None
    dialect: str | None
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PhraseResponse(BaseModel):
    id: uuid.UUID
    nuer_text: str
    english_text: str
    context: str | None
    audio_url: str | None
    category: str | None
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class DictionarySearchResponse(BaseModel):
    words: list[WordResponse]
    phrases: list[PhraseResponse]
    total: int
