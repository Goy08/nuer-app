from pydantic import BaseModel
from typing import Literal


class TranslateRequest(BaseModel):
    text: str
    source_lang: Literal["eng_Latn", "nus_Latn"]
    target_lang: Literal["eng_Latn", "nus_Latn"]


class TranslateResponse(BaseModel):
    source_text: str
    translated_text: str
    source_lang: str
    target_lang: str
    source: Literal["dictionary", "model"]
    # Only set when source == "dictionary"
    entry_id: str | None = None
    entry_type: Literal["word", "phrase"] | None = None
