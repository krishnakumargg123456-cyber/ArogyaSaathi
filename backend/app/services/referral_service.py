"""
Referral Lifecycle Service
PRD Section 8.2 & 10.7 Closed-Loop Referral Management
"""
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from uuid import uuid4
import json
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.entities import Referral, ReferralEvent, Facility, Patient
from app.schemas.schemas import ReferralCreate, ReferralTransitionRequest
from app.services.audit_service import log_audit_event

def generate_referral_code(db: Session) -> str:
    return f"REF-{uuid4().hex[:12].upper()}"

def create_referral(
    db: Session,
    data: ReferralCreate,
    actor_id: str
) -> Referral:
    patient = db.query(Patient).filter(Patient.id == data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    facility = db.query(Facility).filter(Facility.id == data.receiving_facility_id).first()
    if not facility:
        raise HTTPException(status_code=404, detail="Receiving facility not found")

    code = generate_referral_code(db)
    history_json = json.dumps(data.history_packet) if data.history_packet else None

    referral = Referral(
        referral_code=code,
        patient_id=data.patient_id,
        encounter_id=data.encounter_id,
        referring_user_id=actor_id,
        receiving_facility_id=data.receiving_facility_id,
        urgency=data.urgency,
        reason=data.reason,
        history_packet=history_json,
        status="PENDING"
    )
    db.add(referral)
    db.flush()

    event = ReferralEvent(
        referral_id=referral.id,
        from_status="NONE",
        to_status="PENDING",
        actor_id=actor_id,
        notes="Referral created"
    )
    db.add(event)
    db.commit()
    db.refresh(referral)

    log_audit_event(
        db=db,
        actor_id=actor_id,
        action="CREATE_REFERRAL",
        entity_type="referral",
        entity_id=referral.id,
        details=f"Created {referral.urgency} referral {referral.referral_code} to {facility.name}"
    )

    return referral

def transition_referral(
    db: Session,
    referral_id: str,
    data: ReferralTransitionRequest,
    actor_id: str
) -> Referral:
    referral = db.query(Referral).filter(Referral.id == referral_id).first()
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")

    allowed_transitions = {
        "PENDING": ["ACCEPTED", "REJECTED"],
        "ACCEPTED": ["SCHEDULED", "ARRIVED", "REJECTED"],
        "SCHEDULED": ["ARRIVED", "REJECTED"],
        "ARRIVED": ["COMPLETED"],
        "REJECTED": [],
        "COMPLETED": []
    }

    if data.target_status not in allowed_transitions.get(referral.status, []):
        raise HTTPException(
            status_code=400,
            detail={
                "code": "REFERRAL_INVALID_TRANSITION",
                "message": f"Referral cannot transition from '{referral.status}' to '{data.target_status}'."
            }
        )

    if data.target_status == "REJECTED" and not data.rejection_reason:
        raise HTTPException(
            status_code=422,
            detail={"code": "REJECTION_REASON_REQUIRED", "message": "Rejection reason is mandatory."}
        )

    old_status = referral.status
    referral.status = data.target_status
    if data.rejection_reason:
        referral.rejection_reason = data.rejection_reason

    db.add(referral)

    event = ReferralEvent(
        referral_id=referral.id,
        from_status=old_status,
        to_status=data.target_status,
        actor_id=actor_id,
        notes=data.notes or data.rejection_reason
    )
    db.add(event)
    db.commit()
    db.refresh(referral)

    log_audit_event(
        db=db,
        actor_id=actor_id,
        action="TRANSITION_REFERRAL",
        entity_type="referral",
        entity_id=referral.id,
        details=f"Referral {referral.referral_code} moved from {old_status} to {data.target_status}"
    )

    return referral
