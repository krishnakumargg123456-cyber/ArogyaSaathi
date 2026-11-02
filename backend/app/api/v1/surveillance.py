"""
Health Radar & Public Health Surveillance API Routes
PRD Section 6.9 & 10.9 Compliance:
- Candidate alerts with human review workflow
- No automated unreviewed outbreak declaration
"""
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.entities import CandidateAlert, Village, User
from app.schemas.schemas import CandidateAlertOut, AlertReviewRequest
from app.api.deps import get_current_user, require_role
from app.services.audit_service import log_audit_event

router = APIRouter(
    prefix="/surveillance",
    tags=["Health Radar Surveillance"],
    dependencies=[Depends(require_role(["ASHA", "ANM", "DOCTOR", "PHC_STAFF", "PUBLIC_HEALTH_OFFICER", "ADMIN"]))],
)

def _scope_alerts(query, current_user: User, db: Session):
    if current_user.role == "ADMIN":
        return query

    scope = current_user.scope
    if not scope:
        return query.filter(False)

    has_scope = False
    if scope.district:
        query = query.filter(CandidateAlert.district == scope.district)
        has_scope = True
    if scope.block:
        query = query.filter(CandidateAlert.block == scope.block)
        has_scope = True
    if scope.village:
        village_ids = db.query(Village.id).filter(Village.name == scope.village)
        query = query.filter(CandidateAlert.village_id.in_(village_ids))
        has_scope = True
    if scope.facility_id:
        village_ids = db.query(Village.id).filter(Village.assigned_facility_id == scope.facility_id)
        query = query.filter(CandidateAlert.village_id.in_(village_ids))
        has_scope = True
    return query if has_scope else query.filter(False)

def _ensure_alert_review_access(alert: CandidateAlert, current_user: User, db: Session):
    if current_user.role not in ["ADMIN", "PUBLIC_HEALTH_OFFICER"]:
        raise HTTPException(status_code=403, detail="Public-health officer or administrator access is required to review alerts.")
    if current_user.role == "ADMIN":
        return
    scoped_alert = _scope_alerts(
        db.query(CandidateAlert).filter(CandidateAlert.id == alert.id),
        current_user,
        db,
    ).first()
    if not scoped_alert:
        raise HTTPException(status_code=404, detail="Alert not found")

@router.get("/alerts", response_model=List[CandidateAlertOut])
def get_health_radar_alerts(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(CandidateAlert)
    if status_filter:
        q = q.filter(CandidateAlert.status == status_filter.upper())

    q = _scope_alerts(q, current_user, db)
    alerts = q.order_by(CandidateAlert.detected_at.desc()).all()
    results = []
    for a in alerts:
        village = db.query(Village).filter(Village.id == a.village_id).first() if a.village_id else None
        results.append(CandidateAlertOut(
            id=a.id,
            alert_code=a.alert_code,
            title=a.title,
            disease_category=a.disease_category,
            district=a.district,
            block=a.block,
            village_name=village.name if village else None,
            severity=a.severity,
            status=a.status,
            case_count=a.case_count,
            data_quality=a.data_quality,
            detected_at=a.detected_at,
            review_notes=a.review_notes
        ))
    return results

@router.patch("/alerts/{alert_id}/review", response_model=dict)
def review_candidate_alert(
    alert_id: str,
    data: AlertReviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alert = db.query(CandidateAlert).filter(CandidateAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    _ensure_alert_review_access(alert, current_user, db)
    if data.status.upper() not in {"UNDER_REVIEW", "ACKNOWLEDGED", "INVESTIGATED", "CLOSED"}:
        raise HTTPException(status_code=422, detail="Unsupported health-radar review status.")

    alert.status = data.status.upper()
    alert.review_notes = data.review_notes
    alert.reviewed_by_id = current_user.id
    alert.updated_at = datetime.now(timezone.utc)
    db.add(alert)
    db.commit()

    log_audit_event(
        db=db,
        actor_id=current_user.id,
        action="REVIEW_HEALTH_RADAR_ALERT",
        entity_type="candidate_alert",
        entity_id=alert.id,
        details=f"Alert {alert.alert_code} marked {alert.status}. Notes: {data.review_notes}"
    )

    return {
        "status": "success",
        "alert_id": alert.id,
        "new_status": alert.status,
        "reviewed_by": current_user.full_name
    }
