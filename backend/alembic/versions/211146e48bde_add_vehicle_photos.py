from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "211146e48bde"
down_revision: Union[str, Sequence[str], None] = "4e76035d818a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    vehicle_photo_type = postgresql.ENUM(
        "exterior",
        "interior",
        "damage",
        "registration",
        name="vehicle_photo_type",
        create_type=False,
    )

    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_type WHERE typname = 'vehicle_photo_type'
            ) THEN
                CREATE TYPE vehicle_photo_type AS ENUM (
                    'exterior',
                    'interior',
                    'damage',
                    'registration'
                );
            END IF;
        END
        $$;
        """
    )

    op.create_table(
        "vehicle_photos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("vehicle_id", sa.Integer(), nullable=False),
        sa.Column("type", vehicle_photo_type, nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("file_path", sa.String(length=500), nullable=False),
        sa.Column("mime_type", sa.String(length=100), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["vehicle_id"],
            ["vehicles.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(op.f("ix_vehicle_photos_id"), "vehicle_photos", ["id"])
    op.create_index(
        op.f("ix_vehicle_photos_vehicle_id"),
        "vehicle_photos",
        ["vehicle_id"],
    )
    op.create_index(op.f("ix_vehicle_photos_type"), "vehicle_photos", ["type"])
    op.create_index(
        op.f("ix_vehicle_photos_created_at"),
        "vehicle_photos",
        ["created_at"],
    )
    op.create_unique_constraint(
        "uq_vehicle_photos_file_path",
        "vehicle_photos",
        ["file_path"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_vehicle_photos_file_path",
        "vehicle_photos",
        type_="unique",
    )
    op.drop_index(op.f("ix_vehicle_photos_created_at"), table_name="vehicle_photos")
    op.drop_index(op.f("ix_vehicle_photos_type"), table_name="vehicle_photos")
    op.drop_index(op.f("ix_vehicle_photos_vehicle_id"), table_name="vehicle_photos")
    op.drop_index(op.f("ix_vehicle_photos_id"), table_name="vehicle_photos")
    op.drop_table("vehicle_photos")

    op.execute("DROP TYPE IF EXISTS vehicle_photo_type")