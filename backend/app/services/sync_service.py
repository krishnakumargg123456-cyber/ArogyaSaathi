"""
Offline-First Synchronization Engine
PRD Section 11 Compliance:
- Outbox push batch processor with priority ordering
- Urgent referrals and consents processed first
- Conflict resolution and idempotency
- Delta pull with cursor
"""
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.entities import (
    Patient, Consent, Encounter, Observation, Referral,
    Appointment, FollowUpTask, DoctorSlot, CandidateAlert, User, Village,
    DoctorProfile
)
from app.schemas.schemas import (
    SyncPushRequest, SyncPushResponse, SyncItemResult, SyncPullResponse,
    AppointmentCreate, ReferralCreate,
)
from app.services.appointment_service import book_appointment
from app.services.referral_service import create_referral


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


def _sync_cursor(cursor: Optional[str]) -> Optional[datetime]:
    if cursor is None:
        return None
    try:
        if cursor.isdigit():
            return datetime.fromtimestamp(int(cursor), tz=timezone.utc)
        parsed = datetime.fromisoformat(cursor.replace("Z", "+00:00"))
        return parsed.replace(tzinfo=timezone.utc) if parsed.tzinfo is None else parsed
    except (ValueError, OverflowError) as error:
        raise HTTPException(status_code=422, detail="Sync cursor must be an ISO timestamp or Unix timestamp.") from error


def process_sync_push(db: Session, request: SyncPushRequest, current_user: User) -> SyncPushResponse:
    results: List[SyncItemResult] = []
    actor_id = current_user.id

    # Priority sorting: urgent referrals and consents first
    def get_priority_key(item):
        if item.priority == "urgent" or item.entity == "consent":
            return 0
        if item.entity == "referral":
            return 1
        if item.entity == "appointment":
            return 2
        return 3

    sorted_items = sorted(request.items, key=get_priority_key)

    for item in sorted_items:
        if item.entity not in {"referral", "appointment", "encounter"} or item.action != "create":
            results.append(SyncItemResult(
                op_id=item.op_id,
                status="rejected",
                error_code="UNSUPPORTED_OPERATION",
                message="This entity/action is not supported by the sync API.",
            ))
            continue

        try:
            payload = item.payload
            patient_id = payload.get("patient_id")
            patient = db.query(Patient).filter(
                Patient.id == patient_id,
                Patient.is_active.is_(True),
                Patient.village_id.in_(_accessible_village_ids(current_user, db)),
            ).first()
            if not patient:
                results.append(SyncItemResult(
                    op_id=item.op_id,
                    status="rejected",
                    error_code="OUT_OF_SCOPE",
                    message="Patient is not available in your assigned scope.",
                ))
                continue
            if not db.query(Consent.id).filter(
                Consent.patient_id == patient.id,
                Consent.status == "ACTIVE",
            ).first():
                results.append(SyncItemResult(
                    op_id=item.op_id,
                    status="rejected",
                    error_code="CONSENT_REQUIRED",
                    message="Active patient consent is required before syncing this item.",
                ))
                continue

            # 1. Referrals
            if item.entity == "referral":
                # Idempotency check: check if already exists for this encounter
                enc_id = payload.get("encounter_id")
                if enc_id:
                    ref_existing = db.query(Referral).filter(Referral.encounter_id == enc_id).first()
                    if ref_existing:
                        if ref_existing.patient_id != patient.id:
                            raise HTTPException(status_code=409, detail="Sync operation conflicts with an existing referral.")
                        results.append(SyncItemResult(
                            op_id=item.op_id,
                            status="duplicate",
                            server_id=ref_existing.id
                        ))
                        continue

                ref_create = ReferralCreate(
                    patient_id=payload["patient_id"],
                    encounter_id=payload.get("encounter_id"),
                    receiving_facility_id=payload["receiving_facility_id"],
                    urgency=payload.get("urgency", "ROUTINE"),
                    reason=payload["reason"],
                    history_packet=payload.get("history_packet")
                )
                created_ref = create_referral(db, ref_create, actor_id)
                results.append(SyncItemResult(
                    op_id=item.op_id,
                    status="accepted",
                    server_id=created_ref.id
                ))

            # 2. Appointments
            elif item.entity == "appointment":
                # Check if already booked with this client_uuid
                app_existing = db.query(Appointment).filter(Appointment.client_uuid == item.op_id).first()
                if app_existing:
                    if app_existing.patient_id != patient.id:
                        raise HTTPException(status_code=409, detail="Sync operation conflicts with an existing appointment.")
                    results.append(SyncItemResult(
                        op_id=item.op_id,
                        status="duplicate",
                        server_id=app_existing.id
                    ))
                    continue

                app_create = AppointmentCreate(
                    client_uuid=item.op_id,
                    patient_id=payload["patient_id"],
                    doctor_id=payload["doctor_id"],
                    facility_id=payload["facility_id"],
                    slot_id=payload["slot_id"],
                    referral_id=payload.get("referral_id"),
                    reason_code=payload.get("reason_code", "General OPD"),
                    notes=payload.get("notes")
                )
                appt = book_appointment(db, app_create, actor_id)
                results.append(SyncItemResult(
                    op_id=item.op_id,
                    status="accepted",
                    server_id=appt.id
                ))

            # 3. Patient Encounters & Vitals
            elif item.entity == "encounter":
                existing_enc = db.query(Encounter).filter(Encounter.client_uuid == item.op_id).first()
                if existing_enc:
                    if existing_enc.patient_id != patient.id:
                        raise HTTPException(status_code=409, detail="Sync operation conflicts with an existing encounter.")
                    results.append(SyncItemResult(op_id=item.op_id, status="duplicate", server_id=existing_enc.id))
                    continue

                enc = Encounter(
                    client_uuid=item.op_id,
                    patient_id=payload["patient_id"],
                    actor_id=actor_id,
                    facility_id=payload.get("facility_id"),
                    source=payload.get("source", "MANUAL"),
                    status="COMPLETED"
                )
                db.add(enc)
                db.flush()

                # Vitals observation if present
                v = payload.get("vitals")
                if v:
                    obs = Observation(
                        encounter_id=enc.id,
                        patient_id=payload["patient_id"],
                        observation_type="VITALS",
                        systolic_bp=v.get("systolic_bp"),
                        diastolic_bp=v.get("diastolic_bp"),
                        blood_glucose=v.get("blood_glucose"),
                        glucose_context=v.get("glucose_context"),
                        temperature=v.get("temperature"),
                        spo2=v.get("spo2"),
                        recorded_by_id=actor_id
                    )
                    db.add(obs)
                db.commit()

                results.append(SyncItemResult(op_id=item.op_id, status="accepted", server_id=enc.id))

        except HTTPException as error:
            db.rollback()
            detail = error.detail
            error_code = detail.get("code") if isinstance(detail, dict) else f"HTTP_{error.status_code}"
            message = detail.get("message") if isinstance(detail, dict) else str(detail)
            results.append(SyncItemResult(
                op_id=item.op_id,
                status="rejected",
                error_code=error_code,
                message=message,
                alternatives=detail.get("alternatives") if isinstance(detail, dict) else None,
            ))
        except IntegrityError:
            db.rollback()
            results.append(SyncItemResult(
                op_id=item.op_id,
                status="rejected",
                error_code="CONFLICT",
                message="The sync item conflicts with existing server data.",
            ))
        except (KeyError, TypeError, ValueError):
            db.rollback()
            results.append(SyncItemResult(
                op_id=item.op_id,
                status="rejected",
                error_code="VALIDATION_ERROR",
                message="The sync item payload is invalid.",
            ))

    return SyncPushResponse(results=results, server_time=datetime.now(timezone.utc))

def process_sync_pull(db: Session, cursor: Optional[str], current_user: User) -> SyncPullResponse:
    """Return user-scoped records changed since the provided cursor."""
    now = datetime.now(timezone.utc)
    since = _sync_cursor(cursor)
    village_ids = _accessible_village_ids(current_user, db)

    patients_query = db.query(Patient).filter(
        Patient.is_active.is_(True),
        Patient.village_id.in_(village_ids),
    )
    if since:
        patients_query = patients_query.filter(Patient.updated_at >= since)
    patients = patients_query.order_by(Patient.updated_at.desc()).limit(500).all()

    referrals_query = db.query(Referral).join(
        Patient, Referral.patient_id == Patient.id,
    ).filter(Patient.village_id.in_(village_ids))
    if current_user.role in {"DOCTOR", "PHC_STAFF"} and current_user.scope and current_user.scope.facility_id:
        referrals_query = referrals_query.filter(
            Referral.receiving_facility_id == current_user.scope.facility_id,
        )
    if since:
        referrals_query = referrals_query.filter(Referral.updated_at >= since)
    referrals = referrals_query.order_by(Referral.updated_at.desc()).limit(500).all()

    appointments_query = db.query(Appointment).join(
        Patient, Appointment.patient_id == Patient.id,
    ).filter(Patient.village_id.in_(village_ids))
    if current_user.role == "DOCTOR":
        doctor_profile = db.query(DoctorProfile).filter(
            DoctorProfile.user_id == current_user.id,
        ).first()
        if not doctor_profile:
            appointments_query = appointments_query.filter(False)
        else:
            appointments_query = appointments_query.filter(
                Appointment.doctor_id == doctor_profile.id,
            )
    elif current_user.role == "PHC_STAFF" and current_user.scope and current_user.scope.facility_id:
        appointments_query = appointments_query.filter(
            Appointment.facility_id == current_user.scope.facility_id,
        )
    if since:
        appointments_query = appointments_query.filter(Appointment.updated_at >= since)
    appointments = appointments_query.order_by(Appointment.updated_at.desc()).limit(500).all()

    tasks_query = db.query(FollowUpTask).filter(
        FollowUpTask.assigned_user_id == current_user.id,
    )
    if since:
        tasks_query = tasks_query.filter(
            (FollowUpTask.created_at >= since)
            | (FollowUpTask.completed_at >= since)
        )
    tasks = tasks_query.order_by(FollowUpTask.due_date.asc()).limit(500).all()

    slots_query = db.query(DoctorSlot).join(
        DoctorProfile, DoctorSlot.doctor_id == DoctorProfile.id,
    ).filter(DoctorSlot.status == "AVAILABLE")
    if current_user.scope and current_user.scope.facility_id:
        slots_query = slots_query.filter(
            DoctorProfile.facility_id == current_user.scope.facility_id,
        )
    else:
        facility_ids = db.query(Village.assigned_facility_id).filter(
            Village.id.in_(village_ids),
            Village.assigned_facility_id.isnot(None),
        )
        slots_query = slots_query.filter(DoctorProfile.facility_id.in_(facility_ids))
    slots = slots_query.order_by(
        DoctorSlot.slot_date.asc(),
        DoctorSlot.start_time.asc(),
    ).limit(500).all()

    alerts_query = db.query(CandidateAlert)
    scope = current_user.scope
    has_alert_scope = False
    if scope:
        if scope.district:
            alerts_query = alerts_query.filter(CandidateAlert.district == scope.district)
            has_alert_scope = True
        if scope.block:
            alerts_query = alerts_query.filter(CandidateAlert.block == scope.block)
            has_alert_scope = True
        if scope.village:
            alert_villages = db.query(Village.id).filter(Village.name == scope.village)
            alerts_query = alerts_query.filter(CandidateAlert.village_id.in_(alert_villages))
            has_alert_scope = True
        if scope.facility_id:
            alert_villages = db.query(Village.id).filter(
                Village.assigned_facility_id == scope.facility_id,
            )
            alerts_query = alerts_query.filter(CandidateAlert.village_id.in_(alert_villages))
            has_alert_scope = True
    if not has_alert_scope:
        alerts_query = alerts_query.filter(False)
    alerts_query = alerts_query.filter(
        CandidateAlert.status.in_(["NEW", "UNDER_REVIEW", "ACKNOWLEDGED"]),
    )
    if since:
        alerts_query = alerts_query.filter(CandidateAlert.updated_at >= since)
    alerts = alerts_query.order_by(CandidateAlert.updated_at.desc()).limit(500).all()

    return SyncPullResponse(
        next_cursor=now.isoformat(),
        server_time=now,
        patients=[{
            "id": p.id,
            "internal_id": p.internal_id,
            "name": p.name,
            "age": p.age,
            "gender": p.gender,
            "phone": f"******{p.phone[-4:]}" if p.phone and len(p.phone) >= 4 else None,
            "village_id": p.village_id,
        } for p in patients],
        referrals=[{
            "id": r.id,
            "referral_code": r.referral_code,
            "patient_id": r.patient_id,
            "urgency": r.urgency,
            "reason": r.reason,
            "status": r.status,
        } for r in referrals],
        appointments=[{
            "id": a.id,
            "booking_ref": a.booking_ref,
            "client_uuid": a.client_uuid,
            "patient_id": a.patient_id,
            "doctor_id": a.doctor_id,
            "slot_id": a.slot_id,
            "status": a.status,
        } for a in appointments],
        tasks=[{
            "id": t.id,
            "patient_id": t.patient_id,
            "task_type": t.task_type,
            "due_date": t.due_date.isoformat(),
            "status": t.status,
            "priority": t.priority,
            "notes": t.notes,
        } for t in tasks],
        slots=[{
            "id": s.id,
            "doctor_id": s.doctor_id,
            "slot_date": s.slot_date,
            "start_time": s.start_time,
            "end_time": s.end_time,
            "status": s.status,
        } for s in slots],
        alerts=[{
            "id": alert.id,
            "alert_code": alert.alert_code,
            "title": alert.title,
            "disease_category": alert.disease_category,
            "severity": alert.severity,
            "status": alert.status,
            "case_count": alert.case_count,
        } for alert in alerts],
    )
