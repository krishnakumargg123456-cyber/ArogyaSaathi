"""Initial schema migration

Revision ID: 001_initial
Revises: 
Create Date: 2026-10-30 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from app.db.session import Base
from app.models import entities

revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    Base.metadata.create_all(bind=op.get_bind())

def downgrade() -> None:
    Base.metadata.drop_all(bind=op.get_bind())
