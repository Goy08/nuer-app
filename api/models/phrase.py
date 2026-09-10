import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, Text, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from api.database import Base


class Phrase(Base):
    __tablename__ = "phrases"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    nuer_text: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    english_text: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    context: Mapped[str | None] = mapped_column(Text, nullable=True)
    audio_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    progress_records: Mapped[list["UserProgress"]] = relationship(  # noqa: F821
        "UserProgress", back_populates="phrase"
    )
