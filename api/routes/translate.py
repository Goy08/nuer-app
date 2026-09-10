from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.database import get_db
from api.schemas.translate import TranslateRequest, TranslateResponse
from api.services import nllb_service

router = APIRouter(prefix="/translate", tags=["translate"])


@router.post("", response_model=TranslateResponse)
async def translate(body: TranslateRequest, db: AsyncSession = Depends(get_db)):
    """
    Translate text between English (eng_Latn) and Nuer (nus_Latn).

    Lookup priority:
      1. Verified dictionary entries (words table)
      2. Verified dictionary entries (phrases table)
      3. Translation cache (prior model result)
      4. NLLB-200 model (result stored in cache)
    """
    return await nllb_service.translate(
        db=db,
        text=body.text,
        source_lang=body.source_lang,
        target_lang=body.target_lang,
    )
