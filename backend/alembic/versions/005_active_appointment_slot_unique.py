"""Prevent simultaneous active appointments from using one slot."""
from alembic import op
import sqlalchemy as sa

revision = "005_active_appointment_slot_unique"
down_revision = "004_mobile_otp_challenges"
branch_labels = None
depends_on = None

INDEX_NAME = "uq_active_appointment_slot"
ACTIVE_STATUSES = sa.text("status IN ('CONFIRMED', 'PENDING')")


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    indexes = {index["name"] for index in inspector.get_indexes("appointments")}
    if INDEX_NAME not in indexes:
        op.create_index(
            INDEX_NAME,
            "appointments",
            ["slot_id"],
            unique=True,
            sqlite_where=ACTIVE_STATUSES,
            postgresql_where=ACTIVE_STATUSES,
        )


def downgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    indexes = {index["name"] for index in inspector.get_indexes("appointments")}
    if INDEX_NAME in indexes:
        op.drop_index(INDEX_NAME, table_name="appointments")
