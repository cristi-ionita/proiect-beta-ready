"""fix assignment rejected constraint

Revision ID: eff32d6f3715
Revises: 211146e48bde
Create Date: 2026-04-26
"""

from typing import Sequence, Union

from alembic import op


revision: str = "eff32d6f3715"
down_revision: Union[str, None] = "211146e48bde"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
    ALTER TABLE vehicle_assignments
    DROP CONSTRAINT ck_vehicle_assignments_status_matches_ended_at;
    """)

    op.execute("""
    ALTER TABLE vehicle_assignments
    ADD CONSTRAINT ck_vehicle_assignments_status_matches_ended_at
    CHECK (
        (
            status IN ('pending', 'active')
            AND ended_at IS NULL
        )
        OR (
            status IN ('rejected', 'closed')
            AND ended_at IS NOT NULL
        )
    );
    """)


def downgrade() -> None:
    op.execute("""
    ALTER TABLE vehicle_assignments
    DROP CONSTRAINT ck_vehicle_assignments_status_matches_ended_at;
    """)

    op.execute("""
    ALTER TABLE vehicle_assignments
    ADD CONSTRAINT ck_vehicle_assignments_status_matches_ended_at
    CHECK (
        (
            status IN ('pending', 'active', 'rejected')
            AND ended_at IS NULL
        )
        OR (
            status = 'closed'
            AND ended_at IS NOT NULL
        )
    );
    """)