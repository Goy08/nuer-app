import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Text, UniqueConstraint, UUID
from sqlalchemy.orm import Mapped, mapped_column

from api.database import Base


class TranslationCache(Base):
    __tablename__ = "translation_cache"
    __table_args__ = (
        UniqueConstraint("source_text", "source_lang", "target_lang", name="uq_translation_cache"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    source_text: Mapped[str] = mapped_column(Text, nullable=False)
    source_lang: Mapped[str] = mapped_column(String(50), nullable=False)
    target_lang: Mapped[str] = mapped_column(String(50), nullable=False)
    translated_text: Mapped[str] = mapped_column(Text, nullable=False)
    model_version: Mapped[str] = mapped_column(String(200), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
