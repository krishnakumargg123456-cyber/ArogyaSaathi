"""
Doctor Directory, Slot View and Appointment API Routes (MediSlot Integration)
PRD Section 10.12, 10.13 & 10.14 Compliance
"""
from typing import List, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.entities import (
    DoctorProfile, Department, DoctorSlot, Appointment,
    AppointmentEvent, Facility, Patient, User, Village, Consent
)
from app.schemas.schemas import (
    DoctorProfileOut, DoctorSlotOut, AppointmentCreate,
    AppointmentCancelRequest, AppointmentStatusRequest, AppointmentOut
)
from app.api.deps import get_current_user, require_role
from app.services.appointment_service import book_appointment, cancel_appointment, update_appointment_status

router = APIRouter(tags=["Appointments & Directory"])

def _accessible_village_ids(current_user: User, db: Session):
    query = db.query(Village.id)
    scope = current_user.scope
    if not scope:
        return query.filter(False)

    has_scope = False
    if scope.village:
        query = query.filter(Village.name == scope.village)
        has_scope = True
    if scope.block:
        query = query.filter(Village.block == scope.block)
        has_scope = True
    if scope.district:
        query = query.filter(Village.district == scope.district)
        has_scope = True
    if scope.facility_id:
        query = query.filter(Village.assigned_facility_id == scope.facility_id)
        has_scope = True
    return query if has_scope else query.filter(False)


def _ensure_appointment_access(appointment: Appointment, current_user: User, db: Session) -> None:
    if current_user.role == "PATIENT":
        profile = db.query(Patient.id).filter(Patient.user_id == current_user.id).first()
        if not profile or profile.id != appointment.patient_id:
            raise HTTPException(status_code=404, detail="Appointment not found.")
        return
    if current_user.role == "DOCTOR":
        profile = db.query(DoctorProfile.id).filter(
            DoctorProfile.user_id == current_user.id,
            DoctorProfile.id == appointment.doctor_id,
        ).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Appointment not found.")
        return
    if current_user.role not in {"ASHA", "ANM", "PHC_STAFF"}:
        raise HTTPException(status_code=403, detail="Your role cannot access appointment records.")

    patient_in_scope = db.query(Patient.id).filter(
        Patient.id == appointment.patient_id,
        Patient.village_id.in_(_accessible_village_ids(current_user, db)),
    ).first()
    if not patient_in_scope:
        raise HTTPException(status_code=404, detail="Appointment not found.")
    if (
        current_user.role == "PHC_STAFF"
        and current_user.scope
        and current_user.scope.facility_id
        and appointment.facility_id != current_user.scope.facility_id
    ):
        raise HTTPException(status_code=404, detail="Appointment not found.")


# -----------------
# Directory & Slots
# -----------------
@router.get("/departments")
def list_departments(db: Session = Depends(get_db)):
    depts = db.query(Department).filter(Department.is_active == True).all()
    return [
        {"id": d.id, "name": d.name, "code": d.code, "description": d.description}
        for d in depts
    ]

@router.get("/facilities")
def list_active_facilities(db: Session = Depends(get_db)):
    facilities = db.query(Facility).filter(Facility.is_active == True).order_by(Facility.name.asc()).all()
    return [
        {"id": facility.id, "name": facility.name, "district": facility.district, "block": facility.block}
        for facility in facilities
    ]

@router.get("/doctors", response_model=List[DoctorProfileOut])
def list_doctors(
    facility_id: Optional[str] = None,
    department_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(DoctorProfile).filter(DoctorProfile.is_active == True)
    if facility_id:
        q = q.filter(DoctorProfile.facility_id == facility_id)
    if department_id:
        q = q.filter(DoctorProfile.department_id == department_id)

    doctors = q.all()
    results = []
    for d in doctors:
        results.append(DoctorProfileOut(
            id=d.id,
            user_id=d.user_id,
            facility_id=d.facility_id,
            full_name=d.user.full_name if d.user else "Doctor",
            department_name=d.department.name if d.department else "",
            facility_name=d.facility.name if d.facility else "",
            specialization=d.specialization,
            qualification=d.qualification,
            experience_years=d.experience_years,
            opd_days=d.opd_days,
            opd_timings=d.opd_timings,
            is_active=d.is_active
        ))
    return results

@router.get("/doctors/{doctor_id}/slots", response_model=List[DoctorSlotOut])
def get_doctor_slots(
    doctor_id: str,
    slot_date: Optional[str] = Query(None, description="Format YYYY-MM-DD"),
    db: Session = Depends(get_db)
):
    doctor = db.query(DoctorProfile).filter(
        DoctorProfile.id == doctor_id,
        DoctorProfile.is_active.is_(True),
    ).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found.")
    if slot_date:
        try:
            parsed_slot_date = date.fromisoformat(slot_date)
        except ValueError as error:
            raise HTTPException(status_code=422, detail="slot_date must use YYYY-MM-DD format.") from error
        if parsed_slot_date.isoformat() != slot_date:
            raise HTTPException(status_code=422, detail="slot_date must use YYYY-MM-DD format.")

    q = db.query(DoctorSlot).filter(DoctorSlot.doctor_id == doctor_id)
    if slot_date:
        q = q.filter(DoctorSlot.slot_date == slot_date)
    else:
        # Default to today or future
        today_str = date.today().isoformat()
        q = q.filter(DoctorSlot.slot_date >= today_str)

    slots = q.order_by(DoctorSlot.slot_date.asc(), DoctorSlot.start_time.asc()).all()
    return slots

# -----------------
# Appointments
# -----------------
@router.post("/appointments", response_model=AppointmentOut)
def create_appointment(
    data: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in {"PATIENT", "ASHA", "ANM", "PHC_STAFF"}:
        raise HTTPException(status_code=403, detail="Your role cannot book appointments.")
    patient = db.query(Patient).filter(Patient.id == data.patient_id, Patient.is_active.is_(True)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")
    if current_user.role == "PATIENT":
        if patient.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Patients can only book appointments for their own account.")
        existing_request = db.query(Appointment).filter(Appointment.client_uuid == data.client_uuid).first()
        if existing_request and existing_request.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="This booking request belongs to a different patient.")
    elif not db.query(Village.id).filter(
        Village.id == patient.village_id,
        Village.id.in_(_accessible_village_ids(current_user, db)),
    ).first():
        raise HTTPException(status_code=404, detail="Patient not found in your assigned health-worker scope.")
    if not db.query(Consent.id).filter(
        Consent.patient_id == patient.id,
        Consent.status == "ACTIVE",
    ).first():
        raise HTTPException(status_code=403, detail="Active patient consent is required before booking.")
    appt = book_appointment(db, data, current_user.id)
    return AppointmentOut(
        id=appt.id,
        booking_ref=appt.booking_ref,
        client_uuid=appt.client_uuid,
        patient_id=appt.patient_id,
        patient_name=appt.patient.name if appt.patient else None,
        doctor_id=appt.doctor_id,
        doctor_name=appt.doctor.user.full_name if appt.doctor and appt.doctor.user else None,
        facility_id=appt.facility_id,
        facility_name=appt.doctor.facility.name if appt.doctor and appt.doctor.facility else None,
        slot_id=appt.slot_id,
        slot_date=appt.slot.slot_date if appt.slot else None,
        slot_time=f"{appt.slot.start_time} - {appt.slot.end_time}" if appt.slot else None,
        referral_id=appt.referral_id,
        reason_code=appt.reason_code,
        notes=appt.notes,
        status=appt.status,
        created_at=appt.created_at
    )

@router.get("/appointments", response_model=List[AppointmentOut])
def list_appointments(
    status_filter: Optional[str] = Query(None, alias="status"),
    patient_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in {"PATIENT", "DOCTOR", "ASHA", "ANM", "PHC_STAFF"}:
        raise HTTPException(status_code=403, detail="Your role cannot access appointment records.")
    q = db.query(Appointment)
    if status_filter:
        q = q.filter(Appointment.status == status_filter.upper())
    if patient_id:
        q = q.filter(Appointment.patient_id == patient_id)
    if doctor_id:
        q = q.filter(Appointment.doctor_id == doctor_id)

    if current_user.role == "PATIENT":
        profile = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Patient account profile not found.")
        q = q.filter(Appointment.patient_id == profile.id)
    elif current_user.role == "DOCTOR":
        profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Doctor profile not found.")
        q = q.filter(Appointment.doctor_id == profile.id)
    else:
        q = q.join(Patient, Appointment.patient_id == Patient.id).filter(
            Patient.village_id.in_(_accessible_village_ids(current_user, db))
        )
        if current_user.role == "PHC_STAFF" and current_user.scope and current_user.scope.facility_id:
            q = q.filter(Appointment.facility_id == current_user.scope.facility_id)

    appts = q.order_by(Appointment.created_at.desc()).limit(50).all()
    results = []
    for a in appts:
        results.append(AppointmentOut(
            id=a.id,
            booking_ref=a.booking_ref,
            client_uuid=a.client_uuid,
            patient_id=a.patient_id,
            patient_name=a.patient.name if a.patient else None,
            doctor_id=a.doctor_id,
            doctor_name=a.doctor.user.full_name if a.doctor and a.doctor.user else None,
            facility_id=a.facility_id,
            facility_name=a.doctor.facility.name if a.doctor and a.doctor.facility else None,
            slot_id=a.slot_id,
            slot_date=a.slot.slot_date if a.slot else None,
            slot_time=f"{a.slot.start_time} - {a.slot.end_time}" if a.slot else None,
            referral_id=a.referral_id,
            reason_code=a.reason_code,
            notes=a.notes,
            status=a.status,
            cancellation_reason=a.cancellation_reason,
            created_at=a.created_at
        ))
    return results

@router.patch("/appointments/{appointment_id}/cancel", response_model=dict)
def cancel_existing_appointment(
    appointment_id: str,
    data: AppointmentCancelRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found.")
    _ensure_appointment_access(appointment, current_user, db)
    appt = cancel_appointment(db, appointment_id, current_user.id, data.cancellation_reason)
    return {
        "status": "success",
        "appointment_id": appt.id,
        "booking_ref": appt.booking_ref,
        "new_status": "CANCELLED"
    }

@router.patch("/appointments/{appointment_id}/status", response_model=dict)
def set_appointment_status(
    appointment_id: str,
    data: AppointmentStatusRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in {"DOCTOR", "PHC_STAFF"}:
        raise HTTPException(status_code=403, detail="Only the assigned doctor or facility staff can change appointment status.")
    allowed_statuses = {
        "DOCTOR": {"COMPLETED", "NO_SHOW"},
        "PHC_STAFF": {"CONFIRMED", "NO_SHOW"},
    }
    if data.status.upper() not in allowed_statuses[current_user.role]:
        raise HTTPException(status_code=403, detail="This role cannot set the requested appointment status.")
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found.")
    _ensure_appointment_access(appointment, current_user, db)
    appt = update_appointment_status(db, appointment_id, data.status.upper(), current_user.id, data.notes)
    return {
        "status": "success",
        "appointment_id": appt.id,
        "booking_ref": appt.booking_ref,
        "new_status": appt.status
    }

@router.get("/doctor/queue")
def get_doctor_queue(
    current_user: User = Depends(require_role(["DOCTOR"])),
    db: Session = Depends(get_db)
):
    """
    Doctor's daily consultation queue. Urgent referrals pinned on top.
    """
    profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found.")

    doctor_id = profile.id
    today = date.today().isoformat()
    appts = db.query(Appointment).join(
        DoctorSlot, Appointment.slot_id == DoctorSlot.id,
    ).filter(
        Appointment.doctor_id == doctor_id,
        Appointment.status.in_(["CONFIRMED", "PENDING", "ARRIVED"]),
        DoctorSlot.slot_date == today,
    ).all()
    appts.sort(key=lambda appointment: (
        not bool(appointment.referral and appointment.referral.urgency == "URGENT"),
        appointment.slot.start_time if appointment.slot else "",
    ))
    urgent_count = sum(
        1 for appointment in appts
        if appointment.referral and appointment.referral.urgency == "URGENT"
    )

    return {
        "doctor_name": profile.user.full_name if profile.user else "Doctor",
        "department": profile.department.name if profile.department else "General Medicine",
        "total_scheduled_today": len(appts),
        "urgent_count": urgent_count,
        "queue": [
            {
                "appointment_id": a.id,
                "booking_ref": a.booking_ref,
                "patient_name": a.patient.name if a.patient else "Unknown",
                "patient_age": a.patient.age if a.patient else None,
                "patient_gender": a.patient.gender if a.patient else None,
                "slot_time": f"{a.slot.start_time} - {a.slot.end_time}" if a.slot else None,
                "reason_code": a.reason_code,
                "status": a.status,
                "is_urgent": bool(a.referral and a.referral.urgency == "URGENT")
            }
            for a in appts
        ]
    }
