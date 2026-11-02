"""
ArogyaSaathi SQLAlchemy Relational Data Models
Complies with PRD Section 14 (Core Data Model & Scheduling Entities)
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime,
    ForeignKey, Text, Enum, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from app.db.session import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

# ==========================================
# 1. ORGANISATION, GEOGRAPHY & ACCESS
# ==========================================

class Facility(Base):
    __tablename__ = "facilities"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(120), nullable=False)
    type = Column(String(30), nullable=False, default="PHC")  # PHC, CHC, DH, SUB_CENTRE
    district = Column(String(60), nullable=False)
    block = Column(String(60), nullable=False)
    address = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    villages = relationship("Village", back_populates="facility")
    doctors = relationship("DoctorProfile", back_populates="facility")
    referrals = relationship("Referral", back_populates="receiving_facility")


class Village(Base):
    __tablename__ = "villages"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    block = Column(String(60), nullable=False)
    district = Column(String(60), nullable=False)
    population = Column(Integer, default=1500)
    assigned_facility_id = Column(String, ForeignKey("facilities.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    facility = relationship("Facility", back_populates="villages")
    patients = relationship("Patient", back_populates="village")


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    employee_id = Column(String(50), unique=True, index=True, nullable=True)
    mobile = Column(String(20), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=True)
    google_sub = Column(String(255), unique=True, index=True, nullable=True)
    full_name = Column(String(100), nullable=False)
    role = Column(String(30), nullable=False)  # PATIENT, ASHA, ANM, DOCTOR, PHC_STAFF, PUBLIC_HEALTH_OFFICER, ADMIN
    hashed_password = Column(String(255), nullable=False)
    hashed_pin = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    first_login_done = Column(Boolean, default=False, nullable=False)
    mobile_verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    scope = relationship("UserScope", back_populates="user", uselist=False, cascade="all, delete-orphan")
    devices = relationship("Device", back_populates="user", cascade="all, delete-orphan")
    doctor_profile = relationship("DoctorProfile", back_populates="user", uselist=False)
    patient_profile = relationship(
        "Patient",
        back_populates="user",
        uselist=False,
        foreign_keys="Patient.user_id",
    )
    tasks = relationship("FollowUpTask", back_populates="assigned_user")
    notifications = relationship("Notification", back_populates="user")


class MobileOtpChallenge(Base):
    __tablename__ = "mobile_otp_challenges"

    id = Column(String, primary_key=True, default=generate_uuid)
    mobile = Column(String(20), nullable=False, index=True)
    purpose = Column(String(30), nullable=False)
    code_hash = Column(String(64), nullable=False)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=False)
    attempts = Column(Integer, nullable=False, default=0)
    consumed_at = Column(DateTime, nullable=True)


class UserScope(Base):
    __tablename__ = "user_scopes"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True)
    district = Column(String(60), nullable=True)
    block = Column(String(60), nullable=True)
    village = Column(String(100), nullable=True)
    facility_id = Column(String, ForeignKey("facilities.id"), nullable=True)

    user = relationship("User", back_populates="scope")


class Device(Base):
    __tablename__ = "devices"

    id = Column(String, primary_key=True, default=generate_uuid)
    device_id = Column(String(100), unique=True, index=True, nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    device_model = Column(String(100), nullable=True)
    os_version = Column(String(50), nullable=True)
    app_version = Column(String(30), nullable=True)
    is_revoked = Column(Boolean, default=False, nullable=False)
    registered_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_seen_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="devices")


# ==========================================
# 2. PATIENTS & CONSENT
# ==========================================

class Patient(Base):
    __tablename__ = "patients"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=True, index=True)
    internal_id = Column(String(30), unique=True, index=True, nullable=False)  # AS-0001245
    name = Column(String(120), nullable=False, index=True)
    age = Column(Integer, nullable=False)
    gender = Column(String(10), nullable=False)  # Male, Female, Other
    phone = Column(String(20), nullable=True, index=True)
    village_id = Column(String, ForeignKey("villages.id"), nullable=True)
    address = Column(String(255), nullable=True)
    emergency_contact = Column(String(100), nullable=True)
    chronic_conditions = Column(String(255), nullable=True)  # e.g., "Hypertension,Diabetes"
    created_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    village = relationship("Village", back_populates="patients")
    user = relationship("User", back_populates="patient_profile", foreign_keys=[user_id])
    consents = relationship("Consent", back_populates="patient", cascade="all, delete-orphan")
    encounters = relationship("Encounter", back_populates="patient")
    referrals = relationship("Referral", back_populates="patient")
    appointments = relationship("Appointment", back_populates="patient")
    tasks = relationship("FollowUpTask", back_populates="patient")


class Consent(Base):
    __tablename__ = "consents"

    id = Column(String, primary_key=True, default=generate_uuid)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False, index=True)
    purpose = Column(String(100), nullable=False, default="GENERAL_HEALTHCARE_COORDINATION")
    scope = Column(String(100), nullable=False, default="FACILITY_AND_WORKER_ACCESS")
    text_version = Column(String(30), nullable=False, default="v1.0")
    language = Column(String(10), nullable=False, default="hi")  # hi, en
    status = Column(String(20), nullable=False, default="ACTIVE")  # ACTIVE, WITHDRAWN
    capture_method = Column(String(30), nullable=False, default="TICK_ACK")  # DIGITAL_SIGNATURE, TICK_ACK, VERBAL
    captured_by_id = Column(String, ForeignKey("users.id"), nullable=False)
    granted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    withdrawn_at = Column(DateTime, nullable=True)

    patient = relationship("Patient", back_populates="consents")


# ==========================================
# 3. CLINICAL ENCOUNTERS, VITALS & TRIAGE
# ==========================================

class Encounter(Base):
    __tablename__ = "encounters"

    id = Column(String, primary_key=True, default=generate_uuid)
    client_uuid = Column(String(100), unique=True, index=True, nullable=False)  # Idempotency
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False, index=True)
    actor_id = Column(String, ForeignKey("users.id"), nullable=False)
    facility_id = Column(String, ForeignKey("facilities.id"), nullable=True)
    source = Column(String(20), default="VOICE", nullable=False)  # VOICE, MANUAL
    status = Column(String(20), default="COMPLETED", nullable=False)
    encounter_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    patient = relationship("Patient", back_populates="encounters")
    observations = relationship("Observation", back_populates="encounter", cascade="all, delete-orphan")
    triage_session = relationship("TriageSession", back_populates="encounter", uselist=False, cascade="all, delete-orphan")


class Observation(Base):
    __tablename__ = "observations"

    id = Column(String, primary_key=True, default=generate_uuid)
    encounter_id = Column(String, ForeignKey("encounters.id"), nullable=True, index=True)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False, index=True)
    observation_type = Column(String(30), nullable=False)  # BP, GLUCOSE, TEMPERATURE, SPO2
    systolic_bp = Column(Integer, nullable=True)
    diastolic_bp = Column(Integer, nullable=True)
    blood_glucose = Column(Float, nullable=True)
    glucose_context = Column(String(30), nullable=True)  # FASTING, RANDOM, POSTPRANDIAL
    temperature = Column(Float, nullable=True)
    spo2 = Column(Float, nullable=True)
    recorded_by_id = Column(String, ForeignKey("users.id"), nullable=False)
    recorded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    encounter = relationship("Encounter", back_populates="observations")


class TriageSession(Base):
    __tablename__ = "triage_sessions"

    id = Column(String, primary_key=True, default=generate_uuid)
    encounter_id = Column(String, ForeignKey("encounters.id"), nullable=True, unique=True)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    audio_ref = Column(String(255), nullable=True)
    transcript_raw = Column(Text, nullable=True)
    transcript_edited = Column(Text, nullable=True)
    confidence_score = Column(Float, default=1.0)
    structured_symptoms = Column(Text, nullable=True)  # JSON-encoded array
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    encounter = relationship("Encounter", back_populates="triage_session")
    decision = relationship("TriageDecision", back_populates="session", uselist=False, cascade="all, delete-orphan")


class TriageDecision(Base):
    __tablename__ = "triage_decisions"

    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("triage_sessions.id"), nullable=False, unique=True)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    rule_ids = Column(String(255), nullable=True)  # Comma-separated rule IDs
    protocol_version = Column(String(50), nullable=False)
    escalation_level = Column(String(30), nullable=False)  # ROUTINE, PRIORITY, EMERGENCY
    clinical_explanation = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    missing_required_inputs = Column(String(255), nullable=True)
    evaluated_by_id = Column(String, ForeignKey("users.id"), nullable=False)
    is_override = Column(Boolean, default=False)
    override_reason = Column(String(255), nullable=True)
    evaluated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    session = relationship("TriageSession", back_populates="decision")


# ==========================================
# 4. REFERRALS & COORDINATION
# ==========================================

class Referral(Base):
    __tablename__ = "referrals"

    id = Column(String, primary_key=True, default=generate_uuid)
    referral_code = Column(String(30), unique=True, index=True, nullable=False)  # REF-2210
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False, index=True)
    encounter_id = Column(String, ForeignKey("encounters.id"), nullable=True)
    referring_user_id = Column(String, ForeignKey("users.id"), nullable=False)
    receiving_facility_id = Column(String, ForeignKey("facilities.id"), nullable=False)
    urgency = Column(String(20), nullable=False, default="ROUTINE")  # ROUTINE, URGENT
    reason = Column(String(255), nullable=False)
    history_packet = Column(Text, nullable=True)  # JSON-encoded summary
    status = Column(String(30), nullable=False, default="PENDING")  # PENDING, ACCEPTED, SCHEDULED, ARRIVED, COMPLETED, REJECTED
    rejection_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    patient = relationship("Patient", back_populates="referrals")
    receiving_facility = relationship("Facility", back_populates="referrals")
    events = relationship("ReferralEvent", back_populates="referral", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="referral")


class ReferralEvent(Base):
    __tablename__ = "referral_events"

    id = Column(String, primary_key=True, default=generate_uuid)
    referral_id = Column(String, ForeignKey("referrals.id"), nullable=False, index=True)
    from_status = Column(String(30), nullable=False)
    to_status = Column(String(30), nullable=False)
    actor_id = Column(String, ForeignKey("users.id"), nullable=False)
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    referral = relationship("Referral", back_populates="events")


# ==========================================
# 5. DOCTOR DIRECTORY, SLOTS & APPOINTMENTS (MediSlot Integration)
# ==========================================

class Department(Base):
    __tablename__ = "departments"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(30), unique=True, nullable=False)
    description = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    doctors = relationship("DoctorProfile", back_populates="department")


class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    facility_id = Column(String, ForeignKey("facilities.id"), nullable=False)
    department_id = Column(String, ForeignKey("departments.id"), nullable=False)
    specialization = Column(String(100), nullable=False)
    qualification = Column(String(100), nullable=False)  # MBBS, MD, DCH
    registration_number = Column(String(80), unique=True, index=True, nullable=True)
    experience_years = Column(Integer, default=5)
    opd_days = Column(String(100), default="Mon,Tue,Wed,Thu,Fri,Sat")
    opd_timings = Column(String(50), default="09:00 AM - 02:00 PM")
    is_active = Column(Boolean, default=True, nullable=False)

    user = relationship("User", back_populates="doctor_profile")
    facility = relationship("Facility", back_populates="doctors")
    department = relationship("Department", back_populates="doctors")
    slots = relationship("DoctorSlot", back_populates="doctor", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="doctor")


class DoctorSlot(Base):
    __tablename__ = "doctor_slots"

    id = Column(String, primary_key=True, default=generate_uuid)
    doctor_id = Column(String, ForeignKey("doctor_profiles.id"), nullable=False, index=True)
    slot_date = Column(String(20), nullable=False, index=True)  # YYYY-MM-DD
    start_time = Column(String(20), nullable=False)  # HH:MM e.g. "09:00 AM"
    end_time = Column(String(20), nullable=False)    # HH:MM e.g. "09:15 AM"
    status = Column(String(20), nullable=False, default="AVAILABLE")  # AVAILABLE, BOOKED, BLOCKED

    doctor = relationship("DoctorProfile", back_populates="slots")
    appointment = relationship("Appointment", back_populates="slot", uselist=False)

    __table_args__ = (
        UniqueConstraint("doctor_id", "slot_date", "start_time", name="uq_doctor_slot_time"),
    )


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String, primary_key=True, default=generate_uuid)
    booking_ref = Column(String(30), unique=True, index=True, nullable=False)  # AP-100234
    client_uuid = Column(String(100), unique=True, index=True, nullable=False)  # Idempotency
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id = Column(String, ForeignKey("doctor_profiles.id"), nullable=False, index=True)
    facility_id = Column(String, ForeignKey("facilities.id"), nullable=False)
    slot_id = Column(String, ForeignKey("doctor_slots.id"), nullable=False)
    referral_id = Column(String, ForeignKey("referrals.id"), nullable=True)
    reason_code = Column(String(100), nullable=False, default="General OPD")
    notes = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default="CONFIRMED")  # PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW
    booked_by_id = Column(String, ForeignKey("users.id"), nullable=False)
    cancellation_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("DoctorProfile", back_populates="appointments")
    slot = relationship("DoctorSlot", back_populates="appointment")
    referral = relationship("Referral", back_populates="appointments")
    events = relationship("AppointmentEvent", back_populates="appointment", cascade="all, delete-orphan")


class AppointmentEvent(Base):
    __tablename__ = "appointment_events"

    id = Column(String, primary_key=True, default=generate_uuid)
    appointment_id = Column(String, ForeignKey("appointments.id"), nullable=False, index=True)
    from_status = Column(String(30), nullable=False)
    to_status = Column(String(30), nullable=False)
    actor_id = Column(String, ForeignKey("users.id"), nullable=False)
    reason = Column(String(255), nullable=True)
    event_time = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    appointment = relationship("Appointment", back_populates="events")


# ==========================================
# 6. TASKS, NOTIFICATIONS & AUDIT
# ==========================================

class FollowUpTask(Base):
    __tablename__ = "follow_up_tasks"

    id = Column(String, primary_key=True, default=generate_uuid)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False, index=True)
    assigned_user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    task_type = Column(String(50), nullable=False)  # HYPERTENSION, DIABETES, REFERRAL_FOLLOWUP, NO_SHOW_FOLLOWUP, GENERAL
    due_date = Column(DateTime, nullable=False)
    status = Column(String(30), nullable=False, default="PENDING")  # PENDING, COMPLETED, OVERDUE, MISSED
    priority = Column(String(20), nullable=False, default="ROUTINE")  # ROUTINE, URGENT
    notes = Column(Text, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    completion_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    patient = relationship("Patient", back_populates="tasks")
    assigned_user = relationship("User", back_populates="tasks")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(120), nullable=False)
    message = Column(Text, nullable=False)  # Generic message, NO PHI in payload
    category = Column(String(30), nullable=False, default="GENERAL")  # TASK, REFERRAL, APPOINTMENT, SYSTEM
    priority = Column(String(20), nullable=False, default="ROUTINE")  # ROUTINE, URGENT
    is_read = Column(Boolean, default=False, nullable=False)
    related_entity_type = Column(String(50), nullable=True)
    related_entity_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="notifications")


class CandidateAlert(Base):
    __tablename__ = "candidate_alerts"

    id = Column(String, primary_key=True, default=generate_uuid)
    alert_code = Column(String(30), unique=True, index=True, nullable=False)
    title = Column(String(150), nullable=False)
    disease_category = Column(String(50), nullable=False)  # FEVER, DIARRHOEA, MALNUTRITION, RESPIRATORY
    district = Column(String(60), nullable=False)
    block = Column(String(60), nullable=False)
    village_id = Column(String, ForeignKey("villages.id"), nullable=True)
    severity = Column(String(20), nullable=False, default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(30), nullable=False, default="NEW")  # NEW, UNDER_REVIEW, ACKNOWLEDGED, INVESTIGATED, CLOSED
    case_count = Column(Integer, default=1)
    supporting_data = Column(Text, nullable=True)  # JSON-encoded summary
    data_quality = Column(String(30), default="Good")  # Good, Moderate, Incomplete
    review_notes = Column(Text, nullable=True)
    reviewed_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    detected_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String, primary_key=True, default=generate_uuid)
    actor_id = Column(String, nullable=True, index=True)
    action = Column(String(60), nullable=False)  # LOGIN, VIEW_PATIENT, CREATE_REFERRAL, BOOK_APPOINTMENT, etc.
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String, nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    device_id = Column(String(100), nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    hash_signature = Column(String(128), nullable=True)
