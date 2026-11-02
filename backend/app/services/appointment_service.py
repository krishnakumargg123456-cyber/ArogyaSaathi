"""
MediSlot Appointment & Scheduling Service
PRD Section 10.12, 10.13 & 14.5 Compliance:
- Server-side conflict protection with row-locking
- HTTP 409 SLOT_TAKEN with up to 3 alternative slots
- Idempotency via client_uuid
- Status transitions: PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW
- Referral lifecycle linkage
- Auto follow-up tasks on NO_SHOW
"""
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Tuple, Dict, Any
from uuid import uuid4
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import and_, or_
from app.models.entities import (
    Appointment, AppointmentEvent, DoctorSlot, DoctorProfile,
    Patient, Referral, FollowUpTask, User, Consent
)
from app.schemas.schemas import AppointmentCreate
from app.services.audit_service import log_audit_event

def generate_booking_ref(db: Session) -> str:
    return f"AP-{uuid4().hex[:12].upper()}"

def get_alternative_slots(db: Session, doctor_id: str, limit: int = 3) -> List[Dict[str, Any]]:
    """
    Finds up to `limit` upcoming available slots for the doctor or same facility.
    """
    active_booking = db.query(Appointment.id).filter(
        Appointment.slot_id == DoctorSlot.id,
        Appointment.status.in_(["PENDING", "CONFIRMED"]),
    ).exists()
    slots = db.query(DoctorSlot).filter(
        DoctorSlot.doctor_id == doctor_id,
        DoctorSlot.status == "AVAILABLE",
        ~active_booking,
    ).order_by(DoctorSlot.slot_date.asc(), DoctorSlot.start_time.asc()).limit(limit).all()

    return [
        {
            "slot_id": s.id,
            "slot_date": s.slot_date,
            "start_time": s.start_time,
            "end_time": s.end_time
        }
        for s in slots
    ]

def book_appointment(
    db: Session,
    data: AppointmentCreate,
    booked_by_id: str
) -> Appointment:
    # 1. Idempotency Check: if client_uuid already exists, return existing appointment
    existing = db.query(Appointment).filter(Appointment.client_uuid == data.client_uuid).first()
    if existing:
        same_request = (
            existing.patient_id == data.patient_id
            and existing.doctor_id == data.doctor_id
            and existing.facility_id == data.facility_id
            and existing.slot_id == data.slot_id
        )
        same_owner = existing.booked_by_id == booked_by_id or (
            existing.patient is not None and existing.patient.user_id == booked_by_id
        )
        if same_request and same_owner:
            return existing
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "IDEMPOTENCY_CONFLICT", "message": "This booking request ID is already associated with a different request."},
        )

    patient = db.query(Patient).filter(
        Patient.id == data.patient_id,
        Patient.is_active.is_(True),
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")
    if not db.query(Consent.id).filter(
        Consent.patient_id == patient.id,
        Consent.status == "ACTIVE",
    ).first():
        raise HTTPException(status_code=403, detail="Active patient consent is required before booking.")
    doctor = db.query(DoctorProfile).filter(
        DoctorProfile.id == data.doctor_id,
        DoctorProfile.is_active.is_(True),
    ).first()
    if not doctor or doctor.facility_id != data.facility_id:
        raise HTTPException(status_code=422, detail="Choose an active doctor and their assigned facility.")

    # 2. Concurrency-safe slot lock
    slot_query = db.query(DoctorSlot).filter(DoctorSlot.id == data.slot_id)
    slot = slot_query.with_for_update().first()

    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "SLOT_NOT_FOUND", "message": "Requested appointment slot does not exist."}
        )
    if slot.doctor_id != doctor.id:
        raise HTTPException(status_code=422, detail="The selected slot does not belong to this doctor.")

    if data.referral_id:
        referral = db.query(Referral).filter(Referral.id == data.referral_id).first()
        if (
            not referral
            or referral.patient_id != patient.id
            or referral.status in {"COMPLETED", "REJECTED"}
        ):
            raise HTTPException(status_code=422, detail="The selected referral is not active for this patient.")

    # 3. Check Slot Availability
    if slot.status != "AVAILABLE":
        alternatives = get_alternative_slots(db, slot.doctor_id, limit=3)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "SLOT_TAKEN",
                "message": "This slot was just booked by another worker or is unavailable. Please select an alternative.",
                "alternatives": alternatives
            }
        )

    # 4. Mark Slot as BOOKED
    slot.status = "BOOKED"
    db.add(slot)

    # 5. Create Appointment
    booking_ref = generate_booking_ref(db)
    appointment = Appointment(
        booking_ref=booking_ref,
        client_uuid=data.client_uuid,
        patient_id=data.patient_id,
        doctor_id=data.doctor_id,
        facility_id=data.facility_id,
        slot_id=slot.id,
        referral_id=data.referral_id,
        reason_code=data.reason_code or "General OPD",
        notes=data.notes,
        status="CONFIRMED",
        booked_by_id=booked_by_id
    )
    db.add(appointment)

    try:
        db.flush()
        # 6. Record Event
        event = AppointmentEvent(
            appointment_id=appointment.id,
            from_status="NONE",
            to_status="CONFIRMED",
            actor_id=booked_by_id,
            reason="Initial booking confirmed"
        )
        db.add(event)

        # 7. Update Referral if linked
        if data.referral_id:
            referral = db.query(Referral).filter(Referral.id == data.referral_id).first()
            if referral and referral.status in ["PENDING", "ACCEPTED"]:
                referral.status = "SCHEDULED"
                db.add(referral)

        db.commit()
        db.refresh(appointment)
    except IntegrityError:
        db.rollback()
        existing = db.query(Appointment).filter(Appointment.client_uuid == data.client_uuid).first()
        if existing:
            same_request = (
                existing.patient_id == data.patient_id
                and existing.doctor_id == data.doctor_id
                and existing.facility_id == data.facility_id
                and existing.slot_id == data.slot_id
            )
            same_owner = existing.booked_by_id == booked_by_id or (
                existing.patient is not None and existing.patient.user_id == booked_by_id
            )
            if same_request and same_owner:
                return existing
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "IDEMPOTENCY_CONFLICT", "message": "This booking request ID is already associated with a different request."},
            )
        alternatives = get_alternative_slots(db, data.doctor_id, limit=3)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "SLOT_TAKEN",
                "message": "This slot was just booked by another worker. Please select an alternative.",
                "alternatives": alternatives
            }
        )

    log_audit_event(
        db=db,
        actor_id=booked_by_id,
        action="BOOK_APPOINTMENT",
        entity_type="appointment",
        entity_id=appointment.id,
        details=f"Booked appointment {appointment.booking_ref} for slot {slot.slot_date} {slot.start_time}"
    )

    return appointment

def cancel_appointment(
    db: Session,
    appointment_id: str,
    actor_id: str,
    reason: str
) -> Appointment:
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if appointment.status in {"COMPLETED", "CANCELLED", "NO_SHOW"}:
        raise HTTPException(
            status_code=409,
            detail={"code": "APPOINTMENT_FINAL", "message": "This appointment is already in a final state."}
        )

    old_status = appointment.status
    appointment.status = "CANCELLED"
    appointment.cancellation_reason = reason
    db.add(appointment)

    # Free up slot back to AVAILABLE
    slot = db.query(DoctorSlot).filter(DoctorSlot.id == appointment.slot_id).first()
    if slot:
        slot.status = "AVAILABLE"
        db.add(slot)

    # Log transition event
    event = AppointmentEvent(
        appointment_id=appointment.id,
        from_status=old_status,
        to_status="CANCELLED",
        actor_id=actor_id,
        reason=reason
    )
    db.add(event)
    db.commit()
    db.refresh(appointment)

    log_audit_event(
        db=db,
        actor_id=actor_id,
        action="CANCEL_APPOINTMENT",
        entity_type="appointment",
        entity_id=appointment.id,
        details=f"Cancelled appointment {appointment.booking_ref}. Reason: {reason}"
    )

    return appointment

def update_appointment_status(
    db: Session,
    appointment_id: str,
    new_status: str,
    actor_id: str,
    notes: Optional[str] = None
) -> Appointment:
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    allowed_transitions = {
        "PENDING": {"CONFIRMED", "CANCELLED"},
        "CONFIRMED": {"COMPLETED", "CANCELLED", "NO_SHOW"},
    }
    if new_status not in allowed_transitions.get(appointment.status, set()):
        raise HTTPException(
            status_code=409,
            detail={
                "code": "INVALID_APPOINTMENT_TRANSITION",
                "message": f"Appointment cannot transition from {appointment.status} to {new_status}.",
            },
        )

    old_status = appointment.status
    appointment.status = new_status
    if notes:
        appointment.notes = f"{appointment.notes or ''}\n[Status Update {new_status}]: {notes}".strip()

    db.add(appointment)

    # If status is NO_SHOW, create auto follow-up task for the booking worker (ASHA/ANM)
    if new_status == "NO_SHOW":
        task = FollowUpTask(
            patient_id=appointment.patient_id,
            assigned_user_id=appointment.booked_by_id,
            task_type="NO_SHOW_FOLLOWUP",
            due_date=datetime.now(timezone.utc) + timedelta(days=2),
            status="PENDING",
            priority="ROUTINE",
            notes=f"Patient missed appointment {appointment.booking_ref}. Inquire reason and reschedule if needed."
        )
        db.add(task)

    # If linked to a referral, advance referral lifecycle
    if appointment.referral_id:
        referral = db.query(Referral).filter(Referral.id == appointment.referral_id).first()
        if referral:
            if new_status == "COMPLETED":
                referral.status = "COMPLETED"
            elif new_status == "CONFIRMED":
                referral.status = "SCHEDULED"

    event = AppointmentEvent(
        appointment_id=appointment.id,
        from_status=old_status,
        to_status=new_status,
        actor_id=actor_id,
        reason=notes or f"Transition to {new_status}"
    )
    db.add(event)
    db.commit()
    db.refresh(appointment)

    return appointment
