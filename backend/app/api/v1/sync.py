"""
Offline-First Data Synchronization API Routes
PRD Section 11 Compliance:
- POST /api/v1/sync/push: Outbox batch execution with priority ordering
- GET /api/v1/sync/pull: Cursor-based delta pull
"""
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from fastapi import HTTPException
from app.models.entities import User, Device
from app.schemas.schemas import SyncPushRequest, SyncPushResponse, SyncPullResponse
from app.api.deps import get_current_user, require_role
from app.services.sync_service import process_sync_push, process_sync_pull

router = APIRouter(
    prefix="/sync",
    tags=["Offline Sync"],
    dependencies=[Depends(require_role(["ASHA", "ANM", "DOCTOR", "PHC_STAFF", "PUBLIC_HEALTH_OFFICER"]))],
)

@router.post("/push", response_model=SyncPushResponse)
def sync_push(
    data: SyncPushRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    device = db.query(Device).filter(
        Device.device_id == data.device_id,
        Device.user_id == current_user.id,
        Device.is_revoked.is_(False),
    ).first()
    if not device:
        raise HTTPException(status_code=403, detail="This device is not registered to your account or has been revoked.")
    device.last_seen_at = datetime.now(timezone.utc)
    db.commit()
    return process_sync_push(db, data, current_user)

@router.get("/pull", response_model=SyncPullResponse)
def sync_pull(
    cursor: Optional[str] = Query(None, description="Client sync cursor timestamp"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return process_sync_pull(db, cursor, current_user)
