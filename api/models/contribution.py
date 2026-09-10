import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Text, Enum as SAEnum, UUID, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from api.database import Base


class ContributionType(str, enum.Enum):
    word = "word"
    phrase = "phrase"
    correction = "correction"
    audio = "audio"


class ContributionStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class Contribution(Base):
    __tablename__ = "contributions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    contributor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    type: Mapped[ContributionType] = mapped_column(
        SAEnum(ContributionType, name="contribution_type", native_enum=False), nullable=False
    )
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    status: Mapped[ContributionStatus] = mapped_column(
        SAEnum(ContributionStatus, name="contribution_status", native_enum=False),
        default=ContributionStatus.pending,
        nullable=False,
        index=True,
    )
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    review_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    contributor: Mapped["User"] = relationship(  # noqa: F821
        "User", foreign_keys=[contributor_id], back_populates="contributions"
    )
    reviewer: Mapped["User | None"] = relationship(  # noqa: F821
        "User", foreign_keys=[reviewed_by], back_populates="reviewed_contributions"
    )
