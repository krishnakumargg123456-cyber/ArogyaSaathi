"""
Tasks & Notifications API Routes
"""
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.entities import FollowUpTask, Notification, User
from app.schemas.schemas import FollowUpTaskOut, NotificationOut
from app.api.deps import get_current_user, require_role
from app.services.audit_service import log_audit_event

router = APIRouter(
    tags=["Tasks & Notifications"],
    dependencies=[Depends(require_role(["ASHA", "ANM", "DOCTOR", "PHC_STAFF", "PUBLIC_HEALTH_OFFICER"]))],
)

@router.get("/tasks", response_model=List[FollowUpTaskOut])
def list_tasks(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(FollowUpTask)
    q = q.filter(FollowUpTask.assigned_user_id == current_user.id)

    if status_filter:
        q = q.filter(FollowUpTask.status == status_filter.upper())

    tasks = q.order_by(FollowUpTask.due_date.asc()).limit(50).all()
    results = []
    for t in tasks:
        results.append(FollowUpTaskOut(
            id=t.id,
            patient_id=t.patient_id,
            patient_name=t.patient.name if t.patient else None,
            assigned_user_id=t.assigned_user_id,
            task_type=t.task_type,
            due_date=t.due_date,
            status=t.status,
            priority=t.priority,
            notes=t.notes,
            created_at=t.created_at
        ))
    return results

@router.patch("/tasks/{task_id}/complete")
def complete_task(
    task_id: str,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(FollowUpTask).filter(
        FollowUpTask.id == task_id,
        FollowUpTask.assigned_user_id == current_user.id,
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.status == "COMPLETED":
        raise HTTPException(status_code=409, detail="Task is already completed.")

    task.status = "COMPLETED"
    task.completed_at = datetime.now(timezone.utc)
    task.completion_notes = notes
    db.add(task)
    db.commit()
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        action="COMPLETE_FOLLOW_UP_TASK",
        entity_type="follow_up_task",
        entity_id=task.id,
        details="Assigned follow-up task completed",
    )
    return {"status": "success", "message": "Task marked as completed."}

@router.get("/notifications", response_model=List[NotificationOut])
def list_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Notice: PRD APP-NTF-02 requires NO PHI in notification payloads!
    notifs = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(30).all()

    return notifs
