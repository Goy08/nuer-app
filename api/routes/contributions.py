import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.database import get_db
from api.dependencies import get_current_user, require_role
from api.models.contribution import Contribution, ContributionStatus
from api.models.user import User, UserRole
from api.schemas.contribution import ContributionCreate, ContributionResponse, ContributionReview
from api.services.review_service import review_contribution

router = APIRouter(prefix="/contributions", tags=["contributions"])


@router.post("", response_model=ContributionResponse, status_code=status.HTTP_201_CREATED)
async def submit_contribution(
    body: ContributionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit a new word, phrase, correction, or audio contribution."""
    contribution = Contribution(
        contributor_id=current_user.id,
        type=body.type,
        payload=body.payload,
    )
    db.add(contribution)
    await db.flush()
    return contribution


@router.get("", response_model=list[ContributionResponse])
async def list_contributions(
    status_filter: ContributionStatus | None = Query(None, alias="status"),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.moderator, UserRole.admin)),
):
    """List contributions (moderators and admins only). Defaults to pending."""
    effective_status = status_filter or ContributionStatus.pending
    stmt = (
        select(Contribution)
        .where(Contribution.status == effective_status)
        .order_by(Contribution.created_at.asc())
        .offset(offset)
        .limit(limit)
    )
    results = (await db.execute(stmt)).scalars().all()
    return results


@router.patch("/{contribution_id}/review", response_model=ContributionResponse)
async def review(
    contribution_id: uuid.UUID,
    body: ContributionReview,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.moderator, UserRole.admin)),
):
    """Approve or reject a contribution (moderators and admins only)."""
    if body.status == ContributionStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot set status back to pending",
        )
    contribution = await review_contribution(
        db=db,
        contribution_id=contribution_id,
        reviewer_id=current_user.id,
        status=body.status,
        review_notes=body.review_notes,
    )
    return contribution
