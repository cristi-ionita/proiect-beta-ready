"""add email verification fields to registration_requests

Revision ID: 3c1f4d2b8e91
Revises: 942cc1992a78
Create Date: 2026-04-23 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "3c1f4d2b8e91"
down_revision = "942cc1992a78"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "registration_requests",
        sa.Column("email_verification_token", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "registration_requests",
        sa.Column("email_verification_sent_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "registration_requests",
        sa.Column("email_verification_expires_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "registration_requests",
        sa.Column("email_verified_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_index(
        "ix_registration_requests_email_verification_token",
        "registration_requests",
        ["email_verification_token"],
        unique=True,
    )

    op.create_check_constraint(
        "ck_regreq_email_verification_token_not_blank",
        "registration_requests",
        "email_verification_token IS NULL OR char_length(trim(email_verification_token)) > 0",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_regreq_email_verification_token_not_blank",
        "registration_requests",
        type_="check",
    )
    op.drop_index(
        "ix_registration_requests_email_verification_token",
        table_name="registration_requests",
    )

    op.drop_column("registration_requests", "email_verified_at")
    op.drop_column("registration_requests", "email_verification_expires_at")
    op.drop_column("registration_requests", "email_verification_sent_at")
    op.drop_column("registration_requests", "email_verification_token")