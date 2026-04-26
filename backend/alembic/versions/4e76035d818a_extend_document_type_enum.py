from typing import Sequence, Union

from alembic import op

revision: str = "4e76035d818a"
down_revision: Union[str, Sequence[str], None] = "d5c49f6c692b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'passport'")
    op.execute("ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'tax_number'")
    op.execute("ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'bank_card'")


def downgrade() -> None:
    pass