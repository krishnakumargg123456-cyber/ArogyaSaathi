"""
ArogyaSaathi Pydantic Request & Response Schemas
"""
from datetime import datetime
from typing import List, Optional, Any, Dict, Literal
from pydantic import BaseModel, Field, field_validator
import re

# -----------------
# Auth & User
# -----------------
class LoginRequest(BaseModel):
    identifier: str  # Mobile number or Employee ID
    password: str
    device_id: Optional[str] = None
    device_model: Optional[str] = None

class RegistrationRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    mobile: str = Field(..., min_length=10, max_length=20)
    password: str = Field(..., min_length=8, max_length=72)
    district: Optional[str] = Field(None, max_length=60)
    block: Optional[str] = Field(None, max_length=60)
    accepted_terms: bool

    @field_validator("mobile")
    @classmethod
    def normalize_mobile(cls, value: str) -> str:
        normalized = re.sub(r"[\s()-]", "", value)
        if not (
            re.fullmatch(r"\+\d{7,15}", normalized)
            or re.fullmatch(r"\d{10,15}", normalized)
        ):
            raise ValueError("Enter a valid mobile number with a country code or 10 to 15 local digits.")
        return normalized

    @field_validator("password")
    @classmethod
    def validate_password_length(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password must be 72 bytes or fewer.")
        return value

class GoogleRegistrationRequest(BaseModel):
    credential: str = Field(..., min_length=1)
    mobile: str = Field(..., min_length=8, max_length=20)
    district: Optional[str] = Field(None, max_length=60)
    block: Optional[str] = Field(None, max_length=60)
    accepted_terms: bool

    @field_validator("mobile")
    @classmethod
    def normalize_mobile(cls, value: str) -> str:
        normalized = re.sub(r"[\s()-]", "", value)
        if not (
            re.fullmatch(r"\+\d{7,15}", normalized)
            or re.fullmatch(r"\d{10,15}", normalized)
        ):
            raise ValueError("Enter a valid mobile number with a country code or 10 to 15 local digits.")
        return normalized

class GoogleLoginRequest(BaseModel):
    credential: str = Field(..., min_length=1)
    device_id: Optional[str] = None
    device_model: Optional[str] = None

class PatientAccountRegistrationRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    mobile: str = Field(..., min_length=8, max_length=20)
    password: Optional[str] = Field(None, min_length=8, max_length=72)
    credential: Optional[str] = Field(None, min_length=1)
    otp_code: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")
    age: int = Field(..., ge=0, le=125)
    gender: str
    accepted_terms: bool

    @field_validator("mobile")
    @classmethod
    def normalize_mobile(cls, value: str) -> str:
        normalized = re.sub(r"[\s()-]", "", value)
        if not (re.fullmatch(r"\+\d{7,15}", normalized) or re.fullmatch(r"\d{10,15}", normalized)):
            raise ValueError("Enter a valid mobile number with a country code or 10 to 15 local digits.")
        return normalized

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, value: str) -> str:
        normalized = value.strip().title()
        if normalized not in {"Male", "Female", "Other"}:
            raise ValueError("Choose Male, Female, or Other.")
        return normalized

    @field_validator("password")
    @classmethod
    def validate_password_length(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and len(value.encode("utf-8")) > 72:
            raise ValueError("Password must be 72 bytes or fewer.")
        return value

class DoctorRegistrationRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    mobile: str = Field(..., min_length=8, max_length=20)
    password: Optional[str] = Field(None, min_length=8, max_length=72)
    credential: Optional[str] = Field(None, min_length=1)
    facility_id: str = Field(..., min_length=1)
    department_id: str = Field(..., min_length=1)
    specialization: str = Field(..., min_length=2, max_length=100)
    qualification: str = Field(..., min_length=2, max_length=100)
    registration_number: str = Field(..., min_length=3, max_length=80)
    accepted_terms: bool

    @field_validator("mobile")
    @classmethod
    def normalize_mobile(cls, value: str) -> str:
        normalized = re.sub(r"[\s()-]", "", value)
        if not (re.fullmatch(r"\+\d{7,15}", normalized) or re.fullmatch(r"\d{10,15}", normalized)):
            raise ValueError("Enter a valid mobile number with a country code or 10 to 15 local digits.")
        return normalized

    @field_validator("password")
    @classmethod
    def validate_password_length(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and len(value.encode("utf-8")) > 72:
            raise ValueError("Password must be 72 bytes or fewer.")
        return value

class RegistrationResponse(BaseModel):
    status: str
    message: str
    mobile: str

class MobileOtpStartRequest(BaseModel):
    mobile: str = Field(..., min_length=8, max_length=20)
    purpose: Literal["patient_register", "patient_login"]

    @field_validator("mobile")
    @classmethod
    def normalize_mobile(cls, value: str) -> str:
        normalized = re.sub(r"[\s()-]", "", value)
        if not re.fullmatch(r"\+\d{7,15}", normalized):
            raise ValueError("Enter a valid mobile number in international format, including its country code.")
        return normalized

class PatientOtpLoginRequest(BaseModel):
    mobile: str = Field(..., min_length=8, max_length=20)
    otp_code: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")

    @field_validator("mobile")
    @classmethod
    def normalize_mobile(cls, value: str) -> str:
        normalized = re.sub(r"[\s()-]", "", value)
        if not re.fullmatch(r"\+\d{7,15}", normalized):
            raise ValueError("Enter a valid mobile number in international format, including its country code.")
        return normalized

class AdminAccountSettingsRequest(BaseModel):
    current_password: str = Field(..., min_length=1, max_length=72)
    email: Optional[str] = Field(None, max_length=255)
    new_password: Optional[str] = Field(None, min_length=8, max_length=72)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        normalized = value.strip().lower()
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", normalized):
            raise ValueError("Enter a valid email address.")
        return normalized

    @field_validator("new_password")
    @classmethod
    def validate_password_length(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and len(value.encode("utf-8")) > 72:
            raise ValueError("Password must be 72 bytes or fewer.")
        return value

class PinSetupRequest(BaseModel):
    pin: str = Field(..., min_length=4, max_length=6)

class PinLoginRequest(BaseModel):
    pin: str
    device_id: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    full_name: str
    first_login_done: bool
    scope: Optional[Dict[str, Any]] = None

class UserOut(BaseModel):
    id: str
    employee_id: Optional[str]
    mobile: str
    full_name: str
    role: str
    is_active: bool
    first_login_done: bool
    created_at: datetime
    scope: Optional[Dict[str, Any]] = None
    doctor_details: Optional[Dict[str, Optional[str]]] = None

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    mobile: str
    employee_id: Optional[str] = None
    full_name: str
    role: str
    password: str
    district: Optional[str] = None
    block: Optional[str] = None
    village: Optional[str] = None
    facility_id: Optional[str] = None

# -----------------
# Patient & Consent
# -----------------
class PatientCreate(BaseModel):
    name: str
    age: int
    gender: str
    phone: Optional[str] = None
    village_id: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    chronic_conditions: Optional[str] = None
    consent_purpose: Optional[str] = "GENERAL_HEALTHCARE_COORDINATION"
    consent_method: Optional[str] = "TICK_ACK"

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    chronic_conditions: Optional[str] = None

class PatientOut(BaseModel):
    id: str
    internal_id: str
    name: str
    age: int
    gender: str
    phone: Optional[str] = None
    village_id: Optional[str] = None
    village_name: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    chronic_conditions: Optional[str] = None
    has_active_consent: bool = True
    created_at: datetime

    class Config:
        from_attributes = True

class ConsentCreate(BaseModel):
    purpose: str = "GENERAL_HEALTHCARE_COORDINATION"
    scope: str = "FACILITY_AND_WORKER_ACCESS"
    language: str = "hi"
    capture_method: str = "TICK_ACK"

class ConsentOut(BaseModel):
    id: str
    patient_id: str
    purpose: str
    scope: str
    status: str
    text_version: str
    language: str
    capture_method: str
    granted_at: datetime

    class Config:
        from_attributes = True

# -----------------
# Vitals & Encounter
# -----------------
class VitalsCreate(BaseModel):
    systolic_bp: Optional[int] = None
    diastolic_bp: Optional[int] = None
    blood_glucose: Optional[float] = None
    glucose_context: Optional[str] = None  # FASTING, RANDOM, POSTPRANDIAL
    temperature: Optional[float] = None
    spo2: Optional[float] = None

class VitalsObservationCreate(BaseModel):
    systolic_bp: Optional[int] = Field(None, ge=40, le=300)
    diastolic_bp: Optional[int] = Field(None, ge=20, le=200)
    blood_glucose: Optional[float] = Field(None, gt=0, le=100)
    glucose_context: Optional[Literal["FASTING", "RANDOM", "POSTPRANDIAL"]] = None
    temperature: Optional[float] = Field(None, ge=25, le=45)
    spo2: Optional[float] = Field(None, ge=0, le=100)

class EncounterCreate(BaseModel):
    client_uuid: str
    patient_id: str
    source: str = "VOICE"  # VOICE, MANUAL
    vitals: Optional[VitalsCreate] = None
    symptoms_text: Optional[str] = None
    structured_symptoms: Optional[List[Dict[str, Any]]] = None

# -----------------
# Triage & Safety Engine
# -----------------
class SymptomInput(BaseModel):
    name: str
    duration_days: Optional[int] = 1
    severity: Optional[str] = "MODERATE"  # MILD, MODERATE, SEVERE
    confidence: Optional[float] = 1.0

class TriageEvaluateRequest(BaseModel):
    patient_id: str
    symptoms: List[SymptomInput]
    vitals: Optional[VitalsCreate] = None
    is_pregnant: Optional[bool] = False

class TriageResultOut(BaseModel):
    decision_id: str
    protocol_version: str
    escalation_level: str  # ROUTINE, PRIORITY, EMERGENCY
    is_urgent: bool
    triggered_rules: List[str]
    clinical_explanation: str
    recommended_action: str
    missing_required_inputs: List[str]
    evaluated_at: datetime

# -----------------
# Referrals
# -----------------
class ReferralCreate(BaseModel):
    patient_id: str
    encounter_id: Optional[str] = None
    receiving_facility_id: str
    urgency: str = "ROUTINE"  # ROUTINE, URGENT
    reason: str
    history_packet: Optional[Dict[str, Any]] = None

class ReferralTransitionRequest(BaseModel):
    target_status: str  # ACCEPTED, SCHEDULED, ARRIVED, COMPLETED, REJECTED
    notes: Optional[str] = None
    rejection_reason: Optional[str] = None

class ReferralOut(BaseModel):
    id: str
    referral_code: str
    patient_id: str
    patient_name: Optional[str] = None
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    referring_user_name: Optional[str] = None
    receiving_facility_name: Optional[str] = None
    urgency: str
    reason: str
    status: str
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# -----------------
# MediSlot: Directory, Slots & Appointments
# -----------------
class DoctorSlotOut(BaseModel):
    id: str
    doctor_id: str
    slot_date: str
    start_time: str
    end_time: str
    status: str  # AVAILABLE, BOOKED, BLOCKED

    class Config:
        from_attributes = True

class DoctorProfileOut(BaseModel):
    id: str
    user_id: str
    facility_id: str
    full_name: str
    department_name: str
    facility_name: str
    specialization: str
    qualification: str
    experience_years: int
    opd_days: str
    opd_timings: str
    is_active: bool

    class Config:
        from_attributes = True

class AppointmentCreate(BaseModel):
    client_uuid: str
    patient_id: str
    doctor_id: str
    facility_id: str
    slot_id: str
    referral_id: Optional[str] = None
    reason_code: str = "General OPD"
    notes: Optional[str] = None

class AppointmentCancelRequest(BaseModel):
    cancellation_reason: str

class AppointmentStatusRequest(BaseModel):
    status: str  # CONFIRMED, COMPLETED, NO_SHOW, CANCELLED
    notes: Optional[str] = None

class AppointmentOut(BaseModel):
    id: str
    booking_ref: str
    client_uuid: str
    patient_id: str
    patient_name: Optional[str] = None
    doctor_id: str
    doctor_name: Optional[str] = None
    facility_id: str
    facility_name: Optional[str] = None
    slot_id: str
    slot_date: Optional[str] = None
    slot_time: Optional[str] = None
    referral_id: Optional[str] = None
    reason_code: str
    notes: Optional[str] = None
    status: str
    cancellation_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# -----------------
# Tasks & Notifications
# -----------------
class FollowUpTaskOut(BaseModel):
    id: str
    patient_id: str
    patient_name: Optional[str] = None
    assigned_user_id: str
    task_type: str
    due_date: datetime
    status: str
    priority: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationOut(BaseModel):
    id: str
    title: str
    message: str
    category: str
    priority: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# -----------------
# Offline Sync Models (PRD Section 11)
# -----------------
class SyncPushItem(BaseModel):
    op_id: str = Field(..., min_length=1, max_length=100)  # client idempotency key
    entity: str = Field(..., min_length=1, max_length=30)
    action: str = Field(..., min_length=1, max_length=30)
    priority: Optional[str] = "routine"
    client_time: datetime
    payload: Dict[str, Any]

class SyncPushRequest(BaseModel):
    device_id: str = Field(..., min_length=1, max_length=100)
    app_version: str = "2.1.0"
    protocol_version: str = "IN_RURAL_ACUTE_CARE_V2.1"
    items: List[SyncPushItem] = Field(..., min_length=1, max_length=100)

class SyncItemResult(BaseModel):
    op_id: str
    status: str  # accepted, duplicate, rejected
    server_id: Optional[str] = None
    error_code: Optional[str] = None
    message: Optional[str] = None
    alternatives: Optional[List[Dict[str, Any]]] = None

class SyncPushResponse(BaseModel):
    results: List[SyncItemResult]
    server_time: datetime = Field(default_factory=datetime.utcnow)

class SyncPullResponse(BaseModel):
    next_cursor: str
    server_time: datetime = Field(default_factory=datetime.utcnow)
    patients: List[Dict[str, Any]] = []
    referrals: List[Dict[str, Any]] = []
    appointments: List[Dict[str, Any]] = []
    tasks: List[Dict[str, Any]] = []
    slots: List[Dict[str, Any]] = []
    alerts: List[Dict[str, Any]] = []

# -----------------
# Surveillance & Admin
# -----------------
class CandidateAlertOut(BaseModel):
    id: str
    alert_code: str
    title: str
    disease_category: str
    district: str
    block: str
    village_name: Optional[str] = None
    severity: str
    status: str
    case_count: int
    data_quality: str
    detected_at: datetime
    review_notes: Optional[str] = None

    class Config:
        from_attributes = True

class AlertReviewRequest(BaseModel):
    status: str  # UNDER_REVIEW, ACKNOWLEDGED, INVESTIGATED, CLOSED
    review_notes: str
