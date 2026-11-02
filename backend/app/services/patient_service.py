"""
Patient Management Service
Handles patient registry, fuzzy duplicate detection, consent management, and profiles
"""
from uuid import uuid4
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.entities import Patient, Consent, Village, User
from app.schemas.schemas import PatientCreate, PatientUpdate
from app.services.audit_service import log_audit_event

def generate_internal_id() -> str:
    return f"AS-{uuid4().hex[:12].upper()}"

def check_duplicates(
    db: Session,
    name: str,
    age: int,
    village_id: Optional[str] = None,
    phone: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Duplicate detection rule (APP-PAT-04):
    Flags likely matches based on phone match OR (name similarity + same village / close age)
    """
    query = db.query(Patient).filter(
        Patient.is_active.is_(True),
        Patient.village_id == village_id,
    )
    matches = []

    # 1. Direct phone match
    if phone:
        phone_matches = query.filter(Patient.phone == phone).all()
        for p in phone_matches:
            matches.append({
                "patient_id": p.id,
                "internal_id": p.internal_id,
                "name": p.name,
                "age": p.age,
                "match_reason": "Exact phone number match",
                "confidence": 0.95
            })

    # 2. Name + Village / Age match
    clean_name = name.strip().lower()
    name_matches = query.filter(Patient.name.ilike(f"%{clean_name}%")).all()
    for p in name_matches:
        if any(m["patient_id"] == p.id for m in matches):
            continue
        age_diff = abs(p.age - age)
        same_village = (p.village_id == village_id) if village_id else False

        if same_village and age_diff <= 3:
            matches.append({
                "patient_id": p.id,
                "internal_id": p.internal_id,
                "name": p.name,
                "age": p.age,
                "match_reason": f"Similar name in same village (age ±{age_diff} yrs)",
                "confidence": 0.85
            })
        elif same_village or age_diff <= 1:
            matches.append({
                "patient_id": p.id,
                "internal_id": p.internal_id,
                "name": p.name,
                "age": p.age,
                "match_reason": "Similar name & demographic characteristics",
                "confidence": 0.65
            })

    return matches

def create_patient(db: Session, data: PatientCreate, actor_id: str) -> Tuple[Patient, List[Dict[str, Any]]]:
    # Check for potential duplicates
    potential_duplicates = check_duplicates(
        db=db,
        name=data.name,
        age=data.age,
        village_id=data.village_id,
        phone=data.phone
    )

    internal_id = generate_internal_id()
    patient = Patient(
        internal_id=internal_id,
        name=data.name.strip(),
        age=data.age,
        gender=data.gender,
        phone=data.phone,
        village_id=data.village_id,
        address=data.address,
        emergency_contact=data.emergency_contact,
        chronic_conditions=data.chronic_conditions,
        created_by_id=actor_id
    )
    db.add(patient)
    db.flush()

    # Create initial consent
    consent = Consent(
        patient_id=patient.id,
        purpose=data.consent_purpose or "GENERAL_HEALTHCARE_COORDINATION",
        scope="FACILITY_AND_WORKER_ACCESS",
        text_version="v2.1",
        language="hi",
        status="ACTIVE",
        capture_method=data.consent_method or "TICK_ACK",
        captured_by_id=actor_id
    )
    db.add(consent)
    db.commit()
    db.refresh(patient)

    log_audit_event(
        db=db,
        actor_id=actor_id,
        action="CREATE_PATIENT",
        entity_type="patient",
        entity_id=patient.id,
        details=f"Created patient {patient.internal_id} ({patient.name})"
    )

    return patient, potential_duplicates
