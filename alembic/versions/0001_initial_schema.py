"""Initial schema

Revision ID: 0001
Revises:
Create Date: 2026-02-21

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Enums ────────────────────────────────────────────────────────────────
    op.execute("CREATE TYPE user_role AS ENUM ('learner', 'contributor', 'moderator', 'admin')")
    op.execute("CREATE TYPE contribution_type AS ENUM ('word', 'phrase', 'correction', 'audio')")
    op.execute("CREATE TYPE contribution_status AS ENUM ('pending', 'approved', 'rejected')")

    # ── users ────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("username", sa.String(100), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column(
            "role",
            postgresql.ENUM("learner", "contributor", "moderator", "admin", name="user_role", create_type=False),
            nullable=False,
            server_default="learner",
        ),
        sa.Column("is_native_speaker", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_username", "users", ["username"])

    # ── words ────────────────────────────────────────────────────────────────
    op.create_table(
        "words",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("nuer_text", sa.String(500), nullable=False),
        sa.Column("english_text", sa.String(500), nullable=False),
        sa.Column("pronunciation", sa.String(500), nullable=True),
        sa.Column("part_of_speech", sa.String(100), nullable=True),
        sa.Column("category", sa.String(100), nullable=True),
        sa.Column("audio_url", sa.Text(), nullable=True),
        sa.Column("dialect", sa.String(100), nullable=True),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("contributor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_words_nuer_text", "words", ["nuer_text"])
    op.create_index("ix_words_english_text", "words", ["english_text"])
    op.create_index("ix_words_category", "words", ["category"])

    # ── phrases ──────────────────────────────────────────────────────────────
    op.create_table(
        "phrases",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("nuer_text", sa.Text(), nullable=False),
        sa.Column("english_text", sa.Text(), nullable=False),
        sa.Column("context", sa.Text(), nullable=True),
        sa.Column("audio_url", sa.Text(), nullable=True),
        sa.Column("category", sa.String(100), nullable=True),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_phrases_category", "phrases", ["category"])

    # ── translation_cache ────────────────────────────────────────────────────
    op.create_table(
        "translation_cache",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("source_text", sa.Text(), nullable=False),
        sa.Column("source_lang", sa.String(50), nullable=False),
        sa.Column("target_lang", sa.String(50), nullable=False),
        sa.Column("translated_text", sa.Text(), nullable=False),
        sa.Column("model_version", sa.String(200), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("source_text", "source_lang", "target_lang", name="uq_translation_cache"),
    )

    # ── contributions ────────────────────────────────────────────────────────
    op.create_table(
        "contributions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("contributor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column(
            "type",
            postgresql.ENUM("word", "phrase", "correction", "audio", name="contribution_type", create_type=False),
            nullable=False,
        ),
        sa.Column("payload", postgresql.JSONB(), nullable=False),
        sa.Column(
            "status",
            postgresql.ENUM("pending", "approved", "rejected", name="contribution_status", create_type=False),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("reviewed_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("review_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_contributions_status", "contributions", ["status"])

    # ── user_progress ────────────────────────────────────────────────────────
    op.create_table(
        "user_progress",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("word_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("words.id", ondelete="CASCADE"), nullable=True),
        sa.Column("phrase_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("phrases.id", ondelete="CASCADE"), nullable=True),
        sa.Column("times_seen", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("times_correct", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("next_review", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("interval", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("ease_factor", sa.Float(), nullable=False, server_default="2.5"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_user_progress_user_id", "user_progress", ["user_id"])


def downgrade() -> None:
    op.drop_table("user_progress")
    op.drop_table("contributions")
    op.drop_table("translation_cache")
    op.drop_table("phrases")
    op.drop_table("words")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS contribution_status")
    op.execute("DROP TYPE IF EXISTS contribution_type")
    op.execute("DROP TYPE IF EXISTS user_role")
