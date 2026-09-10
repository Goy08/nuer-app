import uuid
from datetime import datetime, timezone
from sqlalchemy import Integer, Float, DateTime, ForeignKey, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from api.database import Base


class UserProgress(Base):
    __tablename__ = "user_progress"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    word_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("words.id", ondelete="CASCADE"), nullable=True
    )
    phrase_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("phrases.id", ondelete="CASCADE"), nullable=True
    )
    times_seen: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    times_correct: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    next_review: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    # SM-2 interval in days
    interval: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    ease_factor: Mapped[float] = mapped_column(Float, default=2.5, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="progress")  # noqa: F821
    word: Mapped["Word | None"] = relationship("Word", back_populates="progress_records")  # noqa: F821
    phrase: Mapped["Phrase | None"] = relationship("Phrase", back_populates="progress_records")  # noqa: F821
