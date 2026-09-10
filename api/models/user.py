import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, Enum as SAEnum, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from api.database import Base


class UserRole(str, enum.Enum):
    learner = "learner"
    contributor = "contributor"
    moderator = "moderator"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole, name="user_role", native_enum=False), default=UserRole.learner, nullable=False
    )
    is_native_speaker: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    contributions: Mapped[list["Contribution"]] = relationship(  # noqa: F821
        "Contribution", foreign_keys="Contribution.contributor_id", back_populates="contributor"
    )
    reviewed_contributions: Mapped[list["Contribution"]] = relationship(  # noqa: F821
        "Contribution", foreign_keys="Contribution.reviewed_by", back_populates="reviewer"
    )
    words_contributed: Mapped[list["Word"]] = relationship(  # noqa: F821
        "Word", back_populates="contributor"
    )
    progress: Mapped[list["UserProgress"]] = relationship(  # noqa: F821
        "UserProgress", back_populates="user"
    )
