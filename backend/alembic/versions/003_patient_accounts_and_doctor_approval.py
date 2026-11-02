"""Add patient account links and doctor registration numbers."""
from alembic import op
import sqlalchemy as sa

revision = "003_patient_accounts_and_doctor_approval"
down_revision = "002_google_identity"
branch_labels = None
depends_on = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    patient_columns = {column["name"] for column in inspector.get_columns("patients")}
    patient_indexes = {index["name"] for index in inspector.get_indexes("patients")}
    if "user_id" not in patient_columns or "ix_patients_user_id" not in patient_indexes:
        with op.batch_alter_table("patients", recreate="always") as batch_op:
            if "user_id" not in patient_columns:
                batch_op.add_column(
                    sa.Column(
                        "user_id",
                        sa.String(),
                        sa.ForeignKey("users.id", name="fk_patients_user_id_users"),
                        nullable=True,
                    )
                )
            if "ix_patients_user_id" not in patient_indexes:
                batch_op.create_index("ix_patients_user_id", ["user_id"], unique=True)

    doctor_columns = {
        column["name"] for column in inspector.get_columns("doctor_profiles")
    }
    doctor_indexes = {
        index["name"] for index in inspector.get_indexes("doctor_profiles")
    }
    if "registration_number" not in doctor_columns:
        op.add_column(
            "doctor_profiles",
            sa.Column("registration_number", sa.String(length=80), nullable=True),
        )
    if "ix_doctor_profiles_registration_number" not in doctor_indexes:
        op.create_index(
            "ix_doctor_profiles_registration_number",
            "doctor_profiles",
            ["registration_number"],
            unique=True,
        )


def downgrade() -> None:
    op.drop_index("ix_doctor_profiles_registration_number", table_name="doctor_profiles")
    op.drop_column("doctor_profiles", "registration_number")
    with op.batch_alter_table("patients", recreate="always") as batch_op:
        batch_op.drop_index("ix_patients_user_id")
        batch_op.drop_column("user_id")
