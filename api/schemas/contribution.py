from pydantic import BaseModel
from api.models.contribution import ContributionType, ContributionStatus
import uuid
from datetime import datetime


class ContributionCreate(BaseModel):
    type: ContributionType
    payload: dict


class ContributionReview(BaseModel):
    status: ContributionStatus
    review_notes: str | None = None


class ContributionResponse(BaseModel):
    id: uuid.UUID
    contributor_id: uuid.UUID
    type: ContributionType
    payload: dict
    status: ContributionStatus
    reviewed_by: uuid.UUID | None
    review_notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
