"""
Web Admin Console API Routes
PRD Section 6 Compliance:
- Overview dashboard KPIs calculated strictly from database queries
- User & role management
- Facility and doctor configuration
- Audit logs with hash chains
- Device revocation
"""
from typing import List, Optional
from datetime import datetime, date, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.db.session import get_db
from app.models.entities import (
    User, UserScope, Device, Facility, Patient, Consent, Village, Referral,
    Appointment, DoctorSlot, FollowUpTask, DoctorProfile, Department, AuditEvent, CandidateAlert
)
from app.schemas.schemas import UserCreate, UserOut
from app.core.security import get_password_hash
from app.api.deps import get_current_user, require_role
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/admin", tags=["Web Admin Console"])


class FacilityCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    type: str = Field("PHC", min_length=2, max_length=30)
    district: str = Field(..., min_length=2, max_length=60)
    block: str = Field(..., min_length=2, max_length=60)
    address: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)


class VillageCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    block: str = Field(..., min_length=2, max_length=60)
    district: str = Field(..., min_length=2, max_length=60)
    population: int = Field(1500, ge=0)
    assigned_facility_id: Optional[str] = None


class VillageFacilityRequest(BaseModel):
    facility_id: Optional[str] = None


@router.get("/overview")
def get_admin_overview_kpis(
    current_user: User = Depends(require_role(["ADMIN", "PUBLIC_HEALTH_OFFICER"])),
    db: Session = Depends(get_db)
):
    """
    Computes all administrative KPIs directly from live database tables.
    PRD 6.1: 'All KPIs must be calculated from actual database records... Do not use fake live statistics.'
    """
    total_patients = db.query(Patient).filter(Patient.is_active == True).count()
    active_ashas = db.query(User).filter(User.role == "ASHA", User.is_active == True).count()
    active_anms = db.query(User).filter(User.role == "ANM", User.is_active == True).count()
    registered_doctors = db.query(DoctorProfile).filter(DoctorProfile.is_active == True).count()
    total_facilities = db.query(Facility).filter(Facility.is_active == True).count()

    pending_referrals = db.query(Referral).filter(Referral.status == "PENDING").count()
    completed_referrals = db.query(Referral).filter(Referral.status == "COMPLETED").count()
    urgent_referrals = db.query(Referral).filter(Referral.urgency == "URGENT", Referral.status.in_(["PENDING", "ACCEPTED"])).count()

    today_str = date.today().isoformat()
    today_appointments = db.query(Appointment).join(
        DoctorSlot, Appointment.slot_id == DoctorSlot.id
    ).filter(
        Appointment.status.in_(["CONFIRMED", "ARRIVED"]),
        DoctorSlot.slot_date == today_str,
    ).count()
    upcoming_appointments = db.query(Appointment).filter(Appointment.status == "CONFIRMED").count()

    overdue_followups = db.query(FollowUpTask).filter(FollowUpTask.status.in_(["OVERDUE", "PENDING"])).count()
    active_alerts = db.query(CandidateAlert).filter(CandidateAlert.status.in_(["NEW", "UNDER_REVIEW"])).count()

    active_devices = db.query(Device).filter(Device.is_revoked == False).count()
    revoked_devices = db.query(Device).filter(Device.is_revoked == True).count()

    # Recent Audit Activity
    recent_audits = db.query(AuditEvent).order_by(AuditEvent.timestamp.desc()).limit(10).all()

    return {
        "reporting_period": f"Live as of {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
        "kpis": {
            "total_registered_patients": total_patients,
            "active_asha_workers": active_ashas,
            "active_anms": active_anms,
            "registered_doctors": registered_doctors,
            "total_facilities": total_facilities,
            "pending_referrals": pending_referrals,
            "completed_referrals": completed_referrals,
            "urgent_referrals": urgent_referrals,
            "today_appointments": today_appointments,
            "upcoming_appointments": upcoming_appointments,
            "overdue_followups": overdue_followups,
            "health_radar_active_alerts": active_alerts,
            "registered_active_devices": active_devices,
            "revoked_devices": revoked_devices
        },
        "system_health": {
            "status": "HEALTHY",
            "database": "CONNECTED",
            "deterministic_safety_engine": "ACTIVE",
            "sync_gateway": "NOT_CONFIGURED"
        },
        "recent_activity": [
            {
                "id": a.id,
                "action": a.action,
                "entity_type": a.entity_type,
                "entity_id": a.entity_id,
                "details": a.details,
                "timestamp": a.timestamp,
                "hash": a.hash_signature[:16] + "..." if a.hash_signature else None
            }
            for a in recent_audits
        ]
    }


@router.get("/patients")
def list_admin_patients(
    search: Optional[str] = Query(None, max_length=120),
    limit: int = Query(100, ge=1, le=200),
    current_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    query = db.query(Patient)
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(or_(Patient.name.ilike(term), Patient.internal_id.ilike(term)))

    patients = query.order_by(Patient.created_at.desc()).limit(limit).all()
    patient_ids = [patient.id for patient in patients]
    consent_statuses: dict[str, set[str]] = {}
    if patient_ids:
        for patient_id, consent_status in db.query(Consent.patient_id, Consent.status).filter(
            Consent.patient_id.in_(patient_ids)
        ).all():
            consent_statuses.setdefault(patient_id, set()).add(consent_status.upper())

    return [
        {
            "id": patient.id,
            "internal_id": patient.internal_id,
            "name": patient.name,
            "age": patient.age,
            "gender": patient.gender,
            "village_name": patient.village.name if patient.village else None,
            "is_active": patient.is_active,
            "consent_status": (
                "ACTIVE" if "ACTIVE" in consent_statuses.get(patient.id, set())
                else "WITHDRAWN" if "WITHDRAWN" in consent_statuses.get(patient.id, set())
                else "MISSING"
            ),
            "created_at": patient.created_at,
        }
        for patient in patients
    ]


@router.get("/facilities")
def list_admin_facilities(
    current_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    facilities = db.query(Facility).order_by(Facility.district, Facility.block, Facility.name).all()
    return [
        {
            "id": facility.id,
            "name": facility.name,
            "type": facility.type,
            "district": facility.district,
            "block": facility.block,
            "address": facility.address,
            "phone": facility.phone,
            "is_active": facility.is_active,
            "village_count": db.query(Village.id).filter(Village.assigned_facility_id == facility.id).count(),
            "doctor_count": db.query(DoctorProfile.id).filter(
                DoctorProfile.facility_id == facility.id,
                DoctorProfile.is_active.is_(True),
            ).count(),
        }
        for facility in facilities
    ]


@router.get("/villages")
def list_admin_villages(
    current_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    villages = db.query(Village).order_by(Village.district, Village.block, Village.name).all()
    facilities = db.query(Facility).filter(Facility.is_active.is_(True)).order_by(Facility.name).all()
    return {
        "villages": [
            {
                "id": village.id,
                "name": village.name,
                "block": village.block,
                "district": village.district,
                "population": village.population,
                "assigned_facility_id": village.assigned_facility_id,
                "assigned_facility_name": village.facility.name if village.facility else None,
            }
            for village in villages
        ],
        "facilities": [
            {"id": facility.id, "name": facility.name}
            for facility in facilities
        ],
    }


@router.post("/villages", status_code=status.HTTP_201_CREATED)
def create_admin_village(
    data: VillageCreateRequest,
    current_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    duplicate = db.query(Village.id).filter(
        Village.name == data.name.strip(),
        Village.block == data.block.strip(),
        Village.district == data.district.strip(),
    ).first()
    if duplicate:
        raise HTTPException(status_code=409, detail="A village with that name already exists in this block.")
    if data.assigned_facility_id:
        facility = db.query(Facility).filter(
            Facility.id == data.assigned_facility_id,
            Facility.is_active.is_(True),
        ).first()
        if not facility:
            raise HTTPException(status_code=404, detail="Active facility not found")

    village = Village(
        name=data.name.strip(),
        block=data.block.strip(),
        district=data.district.strip(),
        population=data.population,
        assigned_facility_id=data.assigned_facility_id,
    )
    db.add(village)
    db.commit()
    db.refresh(village)
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        action="CREATE_VILLAGE",
        entity_type="village",
        entity_id=village.id,
        details=f"Created village {village.name}, {village.block}, {village.district}",
    )
    return {
        "id": village.id,
        "name": village.name,
        "block": village.block,
        "district": village.district,
        "population": village.population,
        "assigned_facility_id": village.assigned_facility_id,
        "assigned_facility_name": village.facility.name if village.facility else None,
    }


@router.patch("/villages/{village_id}/facility")
def update_admin_village_facility(
    village_id: str,
    data: VillageFacilityRequest,
    current_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    village = db.query(Village).filter(Village.id == village_id).first()
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")
    if data.facility_id:
        facility = db.query(Facility).filter(
            Facility.id == data.facility_id,
            Facility.is_active.is_(True),
        ).first()
        if not facility:
            raise HTTPException(status_code=404, detail="Active facility not found")
    village.assigned_facility_id = data.facility_id
    db.add(village)
    db.commit()
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        action="ASSIGN_VILLAGE_FACILITY",
        entity_type="village",
        entity_id=village.id,
        details=f"Updated facility assignment for village {village.name}",
    )
    return {
        "status": "success",
        "village_id": village.id,
        "assigned_facility_id": village.assigned_facility_id,
    }


@router.post("/facilities", status_code=status.HTTP_201_CREATED)
def create_admin_facility(
    data: FacilityCreateRequest,
    current_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    facility = Facility(
        name=data.name.strip(),
        type=data.type.strip().upper(),
        district=data.district.strip(),
        block=data.block.strip(),
        address=data.address.strip() if data.address else None,
        phone=data.phone.strip() if data.phone else None,
    )
    db.add(facility)
    db.commit()
    db.refresh(facility)
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        action="CREATE_FACILITY",
        entity_type="facility",
        entity_id=facility.id,
        details=f"Created facility {facility.name}",
    )
    return {
        "id": facility.id,
        "name": facility.name,
        "type": facility.type,
        "district": facility.district,
        "block": facility.block,
        "address": facility.address,
        "phone": facility.phone,
        "is_active": facility.is_active,
        "village_count": 0,
        "doctor_count": 0,
    }


@router.patch("/facilities/{facility_id}/status")
def update_admin_facility_status(
    facility_id: str,
    is_active: bool,
    current_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    facility = db.query(Facility).filter(Facility.id == facility_id).first()
    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found")
    facility.is_active = is_active
    db.add(facility)
    db.commit()
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        action="UPDATE_FACILITY_STATUS",
        entity_type="facility",
        entity_id=facility.id,
        details=f"Facility {facility.name} status set to is_active={is_active}",
    )
    return {"status": "success", "facility_id": facility.id, "is_active": facility.is_active}


@router.get("/doctors")
def list_admin_doctors(
    current_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    doctors = db.query(DoctorProfile).join(User).order_by(User.full_name).all()
    return [
        {
            "id": doctor.id,
            "user_id": doctor.user_id,
            "full_name": doctor.user.full_name,
            "mobile": doctor.user.mobile,
            "department_name": doctor.department.name if doctor.department else None,
            "facility_name": doctor.facility.name if doctor.facility else None,
            "facility_id": doctor.facility_id,
            "specialization": doctor.specialization,
            "qualification": doctor.qualification,
            "registration_number": doctor.registration_number,
            "experience_years": doctor.experience_years,
            "opd_days": doctor.opd_days,
            "opd_timings": doctor.opd_timings,
            "is_active": doctor.is_active and doctor.user.is_active,
        }
        for doctor in doctors
    ]


@router.get("/appointments")
def list_admin_appointments(
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(100, ge=1, le=200),
    current_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    query = db.query(Appointment)
    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(Appointment.status == status_filter.upper())
    appointments = query.order_by(Appointment.created_at.desc()).limit(limit).all()
    return [
        {
            "id": appointment.id,
            "booking_ref": appointment.booking_ref,
            "patient_name": appointment.patient.name if appointment.patient else None,
            "doctor_name": (
                appointment.doctor.user.full_name
                if appointment.doctor and appointment.doctor.user
                else None
            ),
            "facility_name": appointment.doctor.facility.name if appointment.doctor and appointment.doctor.facility else None,
            "slot_date": appointment.slot.slot_date if appointment.slot else None,
            "slot_time": (
                f"{appointment.slot.start_time} - {appointment.slot.end_time}"
                if appointment.slot
                else None
            ),
            "reason_code": appointment.reason_code,
            "status": appointment.status,
            "created_at": appointment.created_at,
        }
        for appointment in appointments
    ]


@router.get("/referrals")
def list_admin_referrals(
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(100, ge=1, le=200),
    current_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    query = db.query(Referral)
    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(Referral.status == status_filter.upper())
    referrals = query.order_by(Referral.created_at.desc()).limit(limit).all()
    return [
        {
            "id": referral.id,
            "referral_code": referral.referral_code,
            "patient_name": referral.patient.name if referral.patient else None,
            "receiving_facility_name": (
                referral.receiving_facility.name if referral.receiving_facility else None
            ),
            "urgency": referral.urgency,
            "reason": referral.reason,
            "status": referral.status,
            "created_at": referral.created_at,
            "updated_at": referral.updated_at,
        }
        for referral in referrals
    ]


@router.get("/tasks")
def list_admin_follow_up_tasks(
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(100, ge=1, le=200),
    current_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    query = db.query(FollowUpTask)
    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(FollowUpTask.status == status_filter.upper())
    tasks = query.order_by(FollowUpTask.due_date.asc()).limit(limit).all()
    return [
        {
            "id": task.id,
            "patient_name": task.patient.name if task.patient else None,
            "assigned_user_name": task.assigned_user.full_name if task.assigned_user else None,
            "task_type": task.task_type,
            "due_date": task.due_date,
            "status": task.status,
            "priority": task.priority,
            "notes": task.notes,
        }
        for task in tasks
    ]


@router.get("/users", response_model=List[UserOut])
def list_users(
    role: Optional[str] = None,
    current_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    q = db.query(User)
    if role:
        q = q.filter(User.role == role.upper())
    users = q.order_by(User.created_at.desc()).all()

    results = []
    for u in users:
        scope_data = {}
        if u.scope:
            scope_data = {
                "district": u.scope.district,
                "block": u.scope.block,
                "village": u.scope.village,
                "facility_id": u.scope.facility_id
            }
        results.append(UserOut(
            id=u.id,
            employee_id=u.employee_id,
            mobile=u.mobile,
            full_name=u.full_name,
            role=u.role,
            is_active=u.is_active,
            first_login_done=u.first_login_done,
            created_at=u.created_at,
            scope=scope_data,
            doctor_details={
                "qualification": u.doctor_profile.qualification,
                "specialization": u.doctor_profile.specialization,
                "registration_number": u.doctor_profile.registration_number,
                "facility": u.doctor_profile.facility.name if u.doctor_profile.facility else None,
                "department": u.doctor_profile.department.name if u.doctor_profile.department else None,
            } if u.doctor_profile else None,
        ))
    return results

@router.post("/users", response_model=UserOut)
def create_new_user(
    data: UserCreate,
    current_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    # Check uniqueness
    if db.query(User).filter(User.mobile == data.mobile).first():
        raise HTTPException(status_code=400, detail="A user with this mobile number already exists.")

    hashed_pw = get_password_hash(data.password)
    user = User(
        employee_id=data.employee_id,
        mobile=data.mobile,
        full_name=data.full_name,
        role=data.role.upper(),
        hashed_password=hashed_pw,
        is_active=True,
        first_login_done=False
    )
    db.add(user)
    db.flush()

    # Create scope
    scope = UserScope(
        user_id=user.id,
        district=data.district,
        block=data.block,
        village=data.village,
        facility_id=data.facility_id
    )
    db.add(scope)
    db.commit()
    db.refresh(user)

    log_audit_event(
        db=db,
        actor_id=current_user.id,
        action="CREATE_USER",
        entity_type="user",
        entity_id=user.id,
        details=f"Created user {user.full_name} with role {user.role}"
    )

    return UserOut(
        id=user.id,
        employee_id=user.employee_id,
        mobile=user.mobile,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        first_login_done=user.first_login_done,
        created_at=user.created_at,
        scope={
            "district": scope.district,
            "block": scope.block,
            "village": scope.village,
            "facility_id": scope.facility_id
        },
        doctor_details=None,
    )

@router.patch("/users/{user_id}/status")
def toggle_user_status(
    user_id: str,
    is_active: bool,
    current_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = is_active
    if user.doctor_profile:
        user.doctor_profile.is_active = is_active
    db.add(user)
    db.commit()

    log_audit_event(
        db=db,
        actor_id=current_user.id,
        action="UPDATE_USER_STATUS",
        entity_type="user",
        entity_id=user.id,
        details=f"User {user.full_name} status set to is_active={is_active}"
    )
    return {"status": "success", "user_id": user.id, "is_active": user.is_active}

@router.get("/devices")
def list_devices(
    current_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    devices = db.query(Device).order_by(Device.last_seen_at.desc()).all()
    return [
        {
            "id": d.id,
            "device_id": d.device_id,
            "user_name": d.user.full_name if d.user else "Unknown",
            "role": d.user.role if d.user else "",
            "device_model": d.device_model,
            "is_revoked": d.is_revoked,
            "registered_at": d.registered_at,
            "last_seen_at": d.last_seen_at
        }
        for d in devices
    ]

@router.post("/devices/{device_id}/revoke")
def revoke_device(
    device_id: str,
    current_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    dev = db.query(Device).filter(Device.device_id == device_id).first()
    if not dev:
        raise HTTPException(status_code=404, detail="Device not found")

    dev.is_revoked = True
    db.add(dev)
    db.commit()

    log_audit_event(
        db=db,
        actor_id=current_user.id,
        action="REVOKE_DEVICE",
        entity_type="device",
        entity_id=dev.id,
        details=f"Revoked device {dev.device_id} assigned to {dev.user.full_name if dev.user else ''}"
    )
    return {"status": "success", "message": f"Device {device_id} revoked."}

@router.get("/audit-logs")
def get_audit_logs(
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(require_role(["ADMIN", "AUDITOR"])),
    db: Session = Depends(get_db)
):
    audits = db.query(AuditEvent).order_by(AuditEvent.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": a.id,
            "actor_id": a.actor_id,
            "action": a.action,
            "entity_type": a.entity_type,
            "entity_id": a.entity_id,
            "details": a.details,
            "timestamp": a.timestamp,
            "hash_signature": a.hash_signature
        }
        for a in audits
    ]
