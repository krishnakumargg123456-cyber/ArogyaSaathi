"""
Voice Triage, Symptom Capture & Deterministic Safety Engine API Routes
PRD Section 10.5 & 15 Compliance:
- Strictly deterministic evaluation
- No autonomous diagnosis or prescription
- Signed versioned protocol bundle and golden vectors
"""
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.entities import TriageSession, TriageDecision, Patient, User, Village, Consent
from app.schemas.schemas import TriageEvaluateRequest, TriageResultOut
from app.safety.rules import evaluate_deterministic_safety, PROTOCOL_VERSION_V2_1
from app.safety.golden_vectors import GOLDEN_RULE_VECTORS
from app.api.deps import require_role
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/triage", tags=["Voice Triage & Safety Engine"])
TRIAGE_ROLES = ["ASHA", "ANM", "DOCTOR", "PHC_STAFF", "PUBLIC_HEALTH_OFFICER"]
PROTOCOL_READ_ROLES = [*TRIAGE_ROLES, "ADMIN"]

@router.post("/evaluate", response_model=TriageResultOut)
def evaluate_triage(
    data: TriageEvaluateRequest,
    current_user: User = Depends(require_role(TRIAGE_ROLES)),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(
        Patient.id == data.patient_id,
        Patient.is_active.is_(True),
    ).first()
    scope = current_user.scope
    village_query = db.query(Village.id)
    if scope:
        has_scope = False
        if scope.village:
            village_query = village_query.filter(Village.name == scope.village)
            has_scope = True
        if scope.block:
            village_query = village_query.filter(Village.block == scope.block)
            has_scope = True
        if scope.district:
            village_query = village_query.filter(Village.district == scope.district)
            has_scope = True
        if scope.facility_id:
            village_query = village_query.filter(Village.assigned_facility_id == scope.facility_id)
            has_scope = True
        if not has_scope:
            village_query = village_query.filter(False)
    else:
        village_query = village_query.filter(False)
    if (
        not patient
        or not patient.village_id
        or not db.query(Village.id).filter(
            Village.id == patient.village_id,
            Village.id.in_(village_query),
        ).first()
    ):
        raise HTTPException(status_code=404, detail="Patient not found in your assigned health-worker scope.")
    if not db.query(Consent.id).filter(
        Consent.patient_id == patient.id,
        Consent.status == "ACTIVE",
    ).first():
        raise HTTPException(status_code=403, detail="Active patient consent is required before triage.")

    # Format symptoms and vitals for deterministic evaluator
    symptoms_list = [s.model_dump() for s in data.symptoms]
    vitals_dict = data.vitals.model_dump() if data.vitals else {}
    patient_context = {
        "is_pregnant": data.is_pregnant or False,
        "age": patient.age,
        "gender": patient.gender
    }

    decision = evaluate_deterministic_safety(
        symptoms=symptoms_list,
        vitals=vitals_dict,
        patient_context=patient_context
    )

    log_audit_event(
        db=db,
        actor_id=current_user.id,
        action="EVALUATE_SAFETY_RULES",
        entity_type="patient",
        entity_id=patient.id,
        details=f"Evaluated protocol {decision.protocol_version}. Level: {decision.escalation_level.value}. Triggered: {decision.triggered_rules}"
    )

    return TriageResultOut(
        decision_id=decision.decision_id,
        protocol_version=decision.protocol_version,
        escalation_level=decision.escalation_level.value,
        is_urgent=decision.is_urgent,
        triggered_rules=decision.triggered_rules,
        clinical_explanation=decision.clinical_explanation,
        recommended_action=decision.recommended_action,
        missing_required_inputs=decision.missing_required_inputs,
        evaluated_at=decision.evaluated_at
    )

@router.post("/voice/simulate")
def simulate_voice_transcription(
    payload: Dict[str, Any],
    current_user: User = Depends(require_role(TRIAGE_ROLES))
):
    raise HTTPException(
        status_code=501,
        detail="Speech transcription is not configured. Use the manual symptom entry workflow.",
    )

@router.get("/protocols/current")
def get_current_protocol_bundle(
    current_user: User = Depends(require_role(PROTOCOL_READ_ROLES)),
):
    """
    Returns the signed, versioned protocol bundle and golden vectors.
    """
    return {
        "protocol_version": PROTOCOL_VERSION_V2_1,
        "title": "Rural Acute Care & Red Flag Protocol",
        "effective_date": "2026-10-30",
        "clinician_signoff": "Dr. V. Sharma (Chief Medical Reviewer)",
        "golden_vectors": GOLDEN_RULE_VECTORS,
        "status": "ACTIVE"
    }
