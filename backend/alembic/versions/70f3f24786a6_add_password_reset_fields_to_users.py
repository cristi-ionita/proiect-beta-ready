"""add password reset fields to users

Revision ID: 70f3f24786a6
Revises: eff32d6f3715
Create Date: 2026-04-26 19:48:12.324719
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "70f3f24786a6"
down_revision: Union[str, Sequence[str], None] = "eff32d6f3715"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("password_reset_token_hash", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("password_reset_expires_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        op.f("ix_users_password_reset_token_hash"),
        "users",
        ["password_reset_token_hash"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_users_password_reset_token_hash"), table_name="users")
    op.drop_column("users", "password_reset_expires_at")
    op.drop_column("users", "password_reset_token_hash")