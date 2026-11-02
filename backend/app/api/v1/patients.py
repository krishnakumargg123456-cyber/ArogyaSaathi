"""
Patient Registry and Profiles API Routes
"""
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.session import get_db
from app.models.entities import Patient, Village, Consent, Encounter, Observation, Referral, Appointment, FollowUpTask, User
from app.schemas.schemas import PatientCreate, PatientUpdate, PatientOut, VitalsObservationCreate
from app.api.deps import get_current_user, require_role
from app.services.patient_service import create_patient
from app.services.audit_service import log_audit_event


# Authenticated patient self-profile API.
# Kept separate from the staff-only patient registry router.
patient_self_router = APIRouter(
    prefix="/patients",
    tags=["Patient Self Service"],
    dependencies=[Depends(require_role(["PATIENT"]))],
)


@patient_self_router.get("/me", response_model=PatientOut)
def get_my_patient_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    patient = db.query(Patient).filter(
        Patient.user_id == current_user.id,
        Patient.is_active.is_(True),
    ).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found.")

    has_active_consent = db.query(Consent.id).filter(
        Consent.patient_id == patient.id,
        Consent.status == "ACTIVE",
    ).first() is not None

    return PatientOut(
        id=patient.id,
        internal_id=patient.internal_id,
        name=patient.name,
        age=patient.age,
        gender=patient.gender,
        phone=patient.phone,
        village_id=patient.village_id,
        village_name=patient.village.name if patient.village else None,
        address=patient.address,
        emergency_contact=patient.emergency_contact,
        chronic_conditions=patient.chronic_conditions,
        has_active_consent=has_active_consent,
        created_at=patient.created_at,
    )

router = APIRouter(
    prefix="/patients",
    tags=["Patients"],
    dependencies=[Depends(require_role(["ASHA", "ANM", "DOCTOR", "PHC_STAFF", "PUBLIC_HEALTH_OFFICER"]))],
)
patient_consent_router = APIRouter(prefix="/patients", tags=["Patients"])

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

@router.get("/villages", response_model=List[dict])
def list_villages(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(Village).filter(Village.id.in_(_accessible_village_ids(current_user, db)))
    return [
        {"id": village.id, "name": village.name, "block": village.block, "district": village.district}
        for village in q.order_by(Village.name.asc()).all()
    ]

@router.get("", response_model=List[PatientOut])
def list_patients(
    query: Optional[str] = Query(None, description="Search by name, ID, phone, or village"),
    village_id: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(Patient).filter(
        Patient.is_active == True,
        Patient.village_id.in_(_accessible_village_ids(current_user, db))
    )

    if query:
        search = f"%{query.strip()}%"
        q = q.filter(
            or_(
                Patient.name.ilike(search),
                Patient.internal_id.ilike(search),
                Patient.phone.ilike(search)
            )
        )

    if village_id:
        q = q.filter(Patient.village_id == village_id)

    # Order by creation descending
    patients = q.order_by(Patient.created_at.desc()).offset(offset).limit(limit).all()

    result = []
    for p in patients:
        has_consent = any(c.status == "ACTIVE" for c in p.consents)
        v_name = p.village.name if p.village else None
        # Mask phone number by default (e.g. ******3210)
        masked_phone = p.phone
        if p.phone and len(p.phone) >= 4:
            masked_phone = f"******{p.phone[-4:]}"

        result.append(PatientOut(
            id=p.id,
            internal_id=p.internal_id,
            name=p.name,
            age=p.age,
            gender=p.gender,
            phone=masked_phone,
            village_id=p.village_id,
            village_name=v_name,
            address=p.address,
            emergency_contact=p.emergency_contact,
            chronic_conditions=p.chronic_conditions,
            has_active_consent=has_consent,
            created_at=p.created_at
        ))
    return result

@router.post("", response_model=dict)
def register_patient(
    data: PatientCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not data.village_id:
        raise HTTPException(status_code=400, detail="Choose a village assigned to your health-worker account.")
    if not db.query(Village.id).filter(
        Village.id == data.village_id,
        Village.id.in_(_accessible_village_ids(current_user, db))
    ).first():
        raise HTTPException(status_code=403, detail="You can only register patients in your assigned village scope.")

    patient, potential_duplicates = create_patient(db, data, current_user.id)
    return {
        "status": "success",
        "patient": {
            "id": patient.id,
            "internal_id": patient.internal_id,
            "name": patient.name,
            "age": patient.age,
            "gender": patient.gender,
            "village_id": patient.village_id
        },
        "potential_duplicates": potential_duplicates
    }

@router.get("/{patient_id}")
def get_patient_profile(
    patient_id: str,
    reveal_phone: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient or not patient.village_id or not db.query(Village.id).filter(
        Village.id == patient.village_id,
        Village.id.in_(_accessible_village_ids(current_user, db))
    ).first():
        raise HTTPException(status_code=404, detail="Patient not found")

    if reveal_phone:
        if current_user.role not in {"ASHA", "ANM", "DOCTOR", "PHC_STAFF"}:
            raise HTTPException(status_code=403, detail="Your role cannot reveal patient phone numbers.")
        if not db.query(Consent.id).filter(
            Consent.patient_id == patient.id,
            Consent.status == "ACTIVE",
        ).first():
            raise HTTPException(status_code=403, detail="Active patient consent is required to reveal the phone number.")
        log_audit_event(
            db=db,
            actor_id=current_user.id,
            action="REVEAL_PATIENT_PHONE",
            entity_type="patient",
            entity_id=patient.id,
            details="Phone number unmasked by authorized user"
        )
        display_phone = patient.phone
    else:
        display_phone = f"******{patient.phone[-4:]}" if patient.phone and len(patient.phone) >= 4 else patient.phone

    # Fetch visits / encounters
    encounters = db.query(Encounter).filter(Encounter.patient_id == patient_id).order_by(Encounter.created_at.desc()).all()
    # Fetch observations (vitals)
    observations = db.query(Observation).filter(Observation.patient_id == patient_id).order_by(Observation.recorded_at.desc()).all()
    # Fetch referrals
    referrals = db.query(Referral).filter(Referral.patient_id == patient_id).order_by(Referral.created_at.desc()).all()
    # Fetch appointments
    appointments = db.query(Appointment).filter(Appointment.patient_id == patient_id).order_by(Appointment.created_at.desc()).all()
    # Fetch tasks
    tasks = db.query(FollowUpTask).filter(FollowUpTask.patient_id == patient_id).order_by(FollowUpTask.due_date.asc()).all()
    # Fetch consents
    consents = db.query(Consent).filter(Consent.patient_id == patient_id).order_by(Consent.granted_at.desc()).all()

    return {
        "overview": {
            "id": patient.id,
            "internal_id": patient.internal_id,
            "name": patient.name,
            "age": patient.age,
            "gender": patient.gender,
            "phone": display_phone,
            "address": patient.address,
            "village": patient.village.name if patient.village else None,
            "emergency_contact": patient.emergency_contact,
            "chronic_conditions": patient.chronic_conditions.split(",") if patient.chronic_conditions else [],
            "created_at": patient.created_at
        },
        "visits": [
            {
                "id": e.id,
                "encounter_date": e.encounter_date,
                "source": e.source,
                "status": e.status
            }
            for e in encounters
        ],
        "vitals": [
            {
                "id": o.id,
                "type": o.observation_type,
                "systolic_bp": o.systolic_bp,
                "diastolic_bp": o.diastolic_bp,
                "blood_glucose": o.blood_glucose,
                "temperature": o.temperature,
                "spo2": o.spo2,
                "recorded_at": o.recorded_at
            }
            for o in observations
        ],
        "referrals": [
            {
                "id": r.id,
                "referral_code": r.referral_code,
                "urgency": r.urgency,
                "reason": r.reason,
                "status": r.status,
                "facility": r.receiving_facility.name if r.receiving_facility else None,
                "created_at": r.created_at
            }
            for r in referrals
        ],
        "appointments": [
            {
                "id": a.id,
                "booking_ref": a.booking_ref,
                "doctor_name": a.doctor.user.full_name if a.doctor and a.doctor.user else "Doctor",
                "slot_date": a.slot.slot_date if a.slot else None,
                "slot_time": f"{a.slot.start_time} - {a.slot.end_time}" if a.slot else None,
                "status": a.status,
                "reason_code": a.reason_code
            }
            for a in appointments
        ],
        "tasks": [
            {
                "id": t.id,
                "task_type": t.task_type,
                "due_date": t.due_date,
                "status": t.status,
                "priority": t.priority,
                "notes": t.notes
            }
            for t in tasks
        ],
        "consents": [
            {
                "id": c.id,
                "purpose": c.purpose,
                "scope": c.scope,
                "status": c.status,
                "text_version": c.text_version,
                "granted_at": c.granted_at
            }
            for c in consents
        ]
    }


@patient_consent_router.post("/{patient_id}/consent/revoke")
def revoke_patient_consent(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    if current_user.role == "PATIENT":
        if patient.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Patient not found.")
    elif current_user.role in {"ASHA", "ANM", "DOCTOR", "PHC_STAFF", "PUBLIC_HEALTH_OFFICER"}:
        if not patient.village_id or not db.query(Village.id).filter(
            Village.id == patient.village_id,
            Village.id.in_(_accessible_village_ids(current_user, db)),
        ).first():
            raise HTTPException(status_code=404, detail="Patient not found in your assigned health-worker scope.")
    else:
        raise HTTPException(status_code=403, detail="Your role cannot withdraw patient consent.")

    active_consents = db.query(Consent).filter(
        Consent.patient_id == patient.id,
        Consent.status == "ACTIVE",
    ).all()
    if not active_consents:
        raise HTTPException(status_code=409, detail="There is no active consent to withdraw.")

    withdrawn_at = datetime.now(timezone.utc)
    for consent in active_consents:
        consent.status = "WITHDRAWN"
        consent.withdrawn_at = withdrawn_at
        db.add(consent)
    db.commit()
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        action="WITHDRAW_PATIENT_CONSENT",
        entity_type="patient",
        entity_id=patient.id,
        details=f"Withdrew {len(active_consents)} active consent record(s)",
    )
    return {"status": "success", "withdrawn_count": len(active_consents), "withdrawn_at": withdrawn_at}


@router.post("/{patient_id}/observations", status_code=status.HTTP_201_CREATED)
def create_patient_observation(
    patient_id: str,
    data: VitalsObservationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not any(value is not None for value in (
        data.systolic_bp,
        data.diastolic_bp,
        data.blood_glucose,
        data.temperature,
        data.spo2,
    )):
        raise HTTPException(status_code=422, detail="At least one vital measurement is required.")
    if (data.systolic_bp is None) != (data.diastolic_bp is None):
        raise HTTPException(status_code=422, detail="Both systolic and diastolic blood pressure are required.")

    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.is_active.is_(True),
        Patient.village_id.in_(_accessible_village_ids(current_user, db)),
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found in your assigned health-worker scope.")
    if not db.query(Consent.id).filter(
        Consent.patient_id == patient.id,
        Consent.status == "ACTIVE",
    ).first():
        raise HTTPException(status_code=403, detail="Active patient consent is required before recording vitals.")

    observation = Observation(
        patient_id=patient.id,
        observation_type="NCD_CHECK" if data.systolic_bp is not None or data.blood_glucose is not None else "VITALS",
        systolic_bp=data.systolic_bp,
        diastolic_bp=data.diastolic_bp,
        blood_glucose=data.blood_glucose,
        glucose_context=data.glucose_context,
        temperature=data.temperature,
        spo2=data.spo2,
        recorded_by_id=current_user.id,
    )
    db.add(observation)
    db.commit()
    db.refresh(observation)
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        action="RECORD_PATIENT_VITALS",
        entity_type="patient",
        entity_id=patient.id,
        details=f"Recorded {observation.observation_type} observation",
    )
    return {
        "id": observation.id,
        "patient_id": observation.patient_id,
        "type": observation.observation_type,
        "systolic_bp": observation.systolic_bp,
        "diastolic_bp": observation.diastolic_bp,
        "blood_glucose": observation.blood_glucose,
        "glucose_context": observation.glucose_context,
        "temperature": observation.temperature,
        "spo2": observation.spo2,
        "recorded_at": observation.recorded_at,
    }
