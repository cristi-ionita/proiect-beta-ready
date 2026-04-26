"""add shift_number to vehicle_assignments

Revision ID: d5c49f6c692b
Revises: 3c1f4d2b8e91
Create Date: 2026-04-23 17:37:27.082296
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d5c49f6c692b"
down_revision: Union[str, Sequence[str], None] = "3c1f4d2b8e91"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "vehicle_assignments",
        sa.Column("shift_number", sa.Integer(), nullable=True),
    )

    op.execute(
        "UPDATE vehicle_assignments SET shift_number = 1 WHERE shift_number IS NULL"
    )

    op.alter_column(
        "vehicle_assignments",
        "shift_number",
        existing_type=sa.Integer(),
        nullable=False,
    )

    op.create_check_constraint(
        "ck_vehicle_assignments_shift_number_positive",
        "vehicle_assignments",
        "shift_number > 0",
    )

    op.create_index(
        op.f("ix_vehicle_assignments_shift_number"),
        "vehicle_assignments",
        ["shift_number"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(
        op.f("ix_vehicle_assignments_shift_number"),
        table_name="vehicle_assignments",
    )

    op.drop_constraint(
        "ck_vehicle_assignments_shift_number_positive",
        "vehicle_assignments",
        type_="check",
    )

    op.drop_column("vehicle_assignments", "shift_number")