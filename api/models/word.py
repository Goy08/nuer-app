import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from api.database import Base


class Word(Base):
    __tablename__ = "words"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    nuer_text: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    english_text: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    pronunciation: Mapped[str | None] = mapped_column(String(500), nullable=True)
    part_of_speech: Mapped[str | None] = mapped_column(String(100), nullable=True)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    audio_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    dialect: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    contributor_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    contributor: Mapped["User"] = relationship(  # noqa: F821
        "User", back_populates="words_contributed"
    )
    progress_records: Mapped[list["UserProgress"]] = relationship(  # noqa: F821
        "UserProgress", back_populates="word"
    )
