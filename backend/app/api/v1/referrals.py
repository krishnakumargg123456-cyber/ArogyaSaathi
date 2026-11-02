"""
Referrals and Closed-Loop Care Coordination API Routes
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.entities import Referral, ReferralEvent, Patient, Facility, User, Village, Consent
from app.schemas.schemas import ReferralCreate, ReferralTransitionRequest, ReferralOut
from app.api.deps import get_current_user, require_role
from app.services.referral_service import create_referral, transition_referral

router = APIRouter(
    prefix="/referrals",
    tags=["Referrals"],
    dependencies=[Depends(require_role(["ASHA", "ANM", "DOCTOR", "PHC_STAFF", "PUBLIC_HEALTH_OFFICER"]))],
)

def _accessible_village_ids(current_user: User, db: Session):
    q = db.query(Village.id)
    scope = current_user.scope
    if not scope:
        return q.filter(False)

    has_scope = False
    if scope.village:
        q = q.filter(Village.name == scope.village)
        has_scope = True
    if scope.block:
        q = q.filter(Village.block == scope.block)
        has_scope = True
    if scope.district:
        q = q.filter(Village.district == scope.district)
        has_scope = True
    if scope.facility_id:
        q = q.filter(Village.assigned_facility_id == scope.facility_id)
        has_scope = True
    return q if has_scope else q.filter(False)

def _ensure_referral_access(referral: Referral, current_user: User, db: Session):
    if current_user.role in ["DOCTOR", "PHC_STAFF"]:
        facility_id = current_user.scope.facility_id if current_user.scope else None
        if not facility_id or referral.receiving_facility_id != facility_id:
            raise HTTPException(status_code=404, detail="Referral not found")
        return
    if not referral.patient or not referral.patient.village_id or not db.query(Village.id).filter(
        Village.id == referral.patient.village_id,
        Village.id.in_(_accessible_village_ids(current_user, db))
    ).first():
        raise HTTPException(status_code=404, detail="Referral not found")

@router.get("", response_model=List[ReferralOut])
def list_referrals(
    status_filter: Optional[str] = Query(None, alias="status"),
    urgency: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(Referral)

    if status_filter and status_filter.upper() != "ALL":
        q = q.filter(Referral.status == status_filter.upper())

    if urgency:
        q = q.filter(Referral.urgency == urgency.upper())

    # Role-based scoping: Doctors and PHC staff see their facility referrals; ASHA/ANM see scoped referrals
    if current_user.role in ["DOCTOR", "PHC_STAFF"] and current_user.scope and current_user.scope.facility_id:
        q = q.filter(Referral.receiving_facility_id == current_user.scope.facility_id)
    else:
        q = q.join(Patient, Referral.patient_id == Patient.id).filter(
            Patient.village_id.in_(_accessible_village_ids(current_user, db))
        )

    referrals = q.order_by(Referral.created_at.desc()).limit(limit).all()

    results = []
    for r in referrals:
        results.append(ReferralOut(
            id=r.id,
            referral_code=r.referral_code,
            patient_id=r.patient_id,
            patient_name=r.patient.name if r.patient else None,
            patient_age=r.patient.age if r.patient else None,
            patient_gender=r.patient.gender if r.patient else None,
            referring_user_name=db.query(User).filter(User.id == r.referring_user_id).first().full_name if r.referring_user_id else None,
            receiving_facility_name=r.receiving_facility.name if r.receiving_facility else None,
            urgency=r.urgency,
            reason=r.reason,
            status=r.status,
            rejection_reason=r.rejection_reason,
            created_at=r.created_at,
            updated_at=r.updated_at
        ))
    return results

@router.post("", response_model=ReferralOut)
def create_new_referral(
    data: ReferralCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == data.patient_id).first()
    if not patient or not patient.village_id or not db.query(Village.id).filter(
        Village.id == patient.village_id,
        Village.id.in_(_accessible_village_ids(current_user, db))
    ).first():
        raise HTTPException(status_code=404, detail="Patient not found in your assigned health-worker scope.")
    if not db.query(Consent.id).filter(Consent.patient_id == patient.id, Consent.status == "ACTIVE").first():
        raise HTTPException(status_code=403, detail="Active patient consent is required before creating a referral.")
    referral = create_referral(db, data, current_user.id)
    return ReferralOut(
        id=referral.id,
        referral_code=referral.referral_code,
        patient_id=referral.patient_id,
        patient_name=referral.patient.name if referral.patient else None,
        patient_age=referral.patient.age if referral.patient else None,
        patient_gender=referral.patient.gender if referral.patient else None,
        receiving_facility_name=referral.receiving_facility.name if referral.receiving_facility else None,
        urgency=referral.urgency,
        reason=referral.reason,
        status=referral.status,
        created_at=referral.created_at,
        updated_at=referral.updated_at
    )

@router.get("/{referral_id}")
def get_referral_details(
    referral_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    referral = db.query(Referral).filter(Referral.id == referral_id).first()
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")
    _ensure_referral_access(referral, current_user, db)

    events = db.query(ReferralEvent).filter(ReferralEvent.referral_id == referral_id).order_by(ReferralEvent.timestamp.asc()).all()

    return {
        "id": referral.id,
        "referral_code": referral.referral_code,
        "urgency": referral.urgency,
        "reason": referral.reason,
        "status": referral.status,
        "rejection_reason": referral.rejection_reason,
        "history_packet": referral.history_packet,
        "created_at": referral.created_at,
        "patient": {
            "id": referral.patient.id,
            "internal_id": referral.patient.internal_id,
            "name": referral.patient.name,
            "age": referral.patient.age,
            "gender": referral.patient.gender,
            "village": referral.patient.village.name if referral.patient.village else None
        },
        "facility": {
            "id": referral.receiving_facility.id,
            "name": referral.receiving_facility.name,
            "type": referral.receiving_facility.type,
            "phone": referral.receiving_facility.phone
        },
        "timeline": [
            {
                "from_status": ev.from_status,
                "to_status": ev.to_status,
                "notes": ev.notes,
                "timestamp": ev.timestamp,
                "actor_id": ev.actor_id
            }
            for ev in events
        ]
    }

@router.patch("/{referral_id}/transition", response_model=dict)
def update_referral_transition(
    referral_id: str,
    data: ReferralTransitionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["DOCTOR", "PHC_STAFF"]:
        raise HTTPException(status_code=403, detail="Facility staff or a doctor must update referral status.")
    if data.target_status == "ARRIVED" and current_user.role != "PHC_STAFF":
        raise HTTPException(status_code=403, detail="Only receiving facility staff can record arrival.")
    if data.target_status == "COMPLETED" and current_user.role != "DOCTOR":
        raise HTTPException(status_code=403, detail="Only a doctor can complete a referral.")
    referral = db.query(Referral).filter(Referral.id == referral_id).first()
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")
    _ensure_referral_access(referral, current_user, db)
    updated = transition_referral(db, referral_id, data, current_user.id)
    return {
        "status": "success",
        "referral_id": updated.id,
        "referral_code": updated.referral_code,
        "new_status": updated.status
    }
