"""Add verified Google identity fields to users."""
from alembic import op
import sqlalchemy as sa

revision = "002_google_identity"
down_revision = "001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    columns = {column["name"] for column in inspector.get_columns("users")}
    indexes = {index["name"] for index in inspector.get_indexes("users")}
    if "email" not in columns:
        op.add_column("users", sa.Column("email", sa.String(length=255), nullable=True))
    if "google_sub" not in columns:
        op.add_column("users", sa.Column("google_sub", sa.String(length=255), nullable=True))
    if "ix_users_email" not in indexes:
        op.create_index("ix_users_email", "users", ["email"], unique=True)
    if "ix_users_google_sub" not in indexes:
        op.create_index("ix_users_google_sub", "users", ["google_sub"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_google_sub", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_column("users", "google_sub")
    op.drop_column("users", "email")
