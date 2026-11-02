"""Add verified mobile numbers and one-time password challenges."""
from alembic import op
import sqlalchemy as sa

revision = "004_mobile_otp_challenges"
down_revision = "003_patient_accounts_and_doctor_approval"
branch_labels = None
depends_on = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    user_columns = {column["name"] for column in inspector.get_columns("users")}
    if "mobile_verified_at" not in user_columns:
        op.add_column("users", sa.Column("mobile_verified_at", sa.DateTime(), nullable=True))

    tables = set(inspector.get_table_names())
    if "mobile_otp_challenges" not in tables:
        op.create_table(
            "mobile_otp_challenges",
            sa.Column("id", sa.String(), nullable=False),
            sa.Column("mobile", sa.String(length=20), nullable=False),
            sa.Column("purpose", sa.String(length=30), nullable=False),
            sa.Column("code_hash", sa.String(length=64), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("expires_at", sa.DateTime(), nullable=False),
            sa.Column("attempts", sa.Integer(), nullable=False),
            sa.Column("consumed_at", sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
        inspector = sa.inspect(op.get_bind())
    indexes = {
        index["name"] for index in inspector.get_indexes("mobile_otp_challenges")
    }
    if "ix_mobile_otp_challenges_mobile" not in indexes:
        op.create_index("ix_mobile_otp_challenges_mobile", "mobile_otp_challenges", ["mobile"])


def downgrade() -> None:
    op.drop_index("ix_mobile_otp_challenges_mobile", table_name="mobile_otp_challenges")
    op.drop_table("mobile_otp_challenges")
    op.drop_column("users", "mobile_verified_at")
