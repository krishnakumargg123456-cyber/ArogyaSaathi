"""
ArogyaSaathi Backend Comprehensive Test Suite
Tests: Auth/RBAC, Clinical Safety Golden Vectors, Referral Lifecycle,
MediSlot 50-Parallel Concurrency & Conflict Protection, and Offline Sync Engine.
"""
import pytest
import concurrent.futures
import uuid
from datetime import date, datetime, timedelta, timezone
from unittest.mock import patch
from fastapi import HTTPException
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.core.config import settings
from app.models.entities import DoctorSlot, Appointment, User, UserScope, Patient, Facility, FollowUpTask
from app.models.entities import Consent, Department, DoctorProfile, MobileOtpChallenge, CandidateAlert, Village
from app.safety.rules import evaluate_deterministic_safety
from app.safety.golden_vectors import GOLDEN_RULE_VECTORS

client = TestClient(app)

# ==========================================
# 1. AUTH & RBAC TESTS
# ==========================================
def test_health_probe_checks_database():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["database"] == "connected"

def test_login_success():
    response = client.post("/api/v1/auth/login", json={
        "identifier": "9876543210",
        "password": "Asha@123",
        "device_id": "dev_test_01"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "ASHA"
    assert data["full_name"] == "Sunita Devi"

def test_admin_can_read_current_safety_protocol_without_triage_access():
    unauthenticated = client.get("/api/v1/triage/protocols/current")
    assert unauthenticated.status_code == 401

    admin_login = client.post("/api/v1/auth/admin/login", json={
        "identifier": "9876543215",
        "password": "Admin@123",
    })
    assert admin_login.status_code == 200
    admin_headers = {
        "Authorization": f"Bearer {admin_login.json()['access_token']}",
    }

    protocol = client.get(
        "/api/v1/triage/protocols/current",
        headers=admin_headers,
    )
    assert protocol.status_code == 200
    assert protocol.json()["protocol_version"]
    assert protocol.json()["golden_vectors"]

    voice_simulation = client.post(
        "/api/v1/triage/voice/simulate",
        headers=admin_headers,
        json={"text": "fever"},
    )
    assert voice_simulation.status_code == 403

def test_patient_village_directory_requires_worker_session():
    unauthorized = client.get("/api/v1/patients/villages")
    assert unauthorized.status_code == 401

    login = client.post("/api/v1/auth/login", json={
        "identifier": "9876543210",
        "password": "Asha@123",
    })
    assert login.status_code == 200
    response = client.get(
        "/api/v1/patients/villages",
        headers={"Authorization": f"Bearer {login.json()['access_token']}"},
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    if response.json():
        assert {"id", "name", "block", "district"} <= response.json()[0].keys()
    village_ids = {village["id"] for village in response.json()}
    patients = client.get(
        "/api/v1/patients",
        headers={"Authorization": f"Bearer {login.json()['access_token']}"},
    )
    assert patients.status_code == 200
    assert all(patient["village_id"] in village_ids for patient in patients.json())
    out_of_scope_registration = client.post(
        "/api/v1/patients",
        headers={"Authorization": f"Bearer {login.json()['access_token']}"},
        json={"name": "Scope Test", "age": 20, "gender": "Other", "village_id": "not-assigned"},
    )
    assert out_of_scope_registration.status_code == 403

    if not response.json():
        pytest.skip("No village is assigned to the seeded health-worker account.")
    patient_name = f"Live Registry Test {uuid.uuid4().hex[:8]}"
    created = client.post(
        "/api/v1/patients",
        headers={"Authorization": f"Bearer {login.json()['access_token']}"},
        json={
            "name": patient_name,
            "age": 36,
            "gender": "Female",
            "village_id": response.json()[0]["id"],
            "consent_purpose": "GENERAL_HEALTHCARE_COORDINATION",
            "consent_method": "TICK_ACK",
        },
    )
    assert created.status_code == 200
    patient_id = created.json()["patient"]["id"]
    try:
        persisted = client.get(
            f"/api/v1/patients?query={created.json()['patient']['internal_id']}",
            headers={"Authorization": f"Bearer {login.json()['access_token']}"},
        )
        assert persisted.status_code == 200
        assert len(persisted.json()) == 1
        assert persisted.json()[0]["id"] == patient_id
        assert persisted.json()[0]["has_active_consent"] is True
        revoked = client.post(
            f"/api/v1/patients/{patient_id}/consent/revoke",
            headers={"Authorization": f"Bearer {login.json()['access_token']}"},
        )
        assert revoked.status_code == 200
        assert revoked.json()["withdrawn_count"] == 1
    finally:
        db = SessionLocal()
        db.query(Consent).filter(Consent.patient_id == patient_id).delete()
        db.query(Patient).filter(Patient.id == patient_id).delete()
        db.commit()
        db.close()

def test_patient_profile_scope_and_admin_role_are_enforced():
    asha_token = client.post("/api/v1/auth/login", json={
        "identifier": "9876543210",
        "password": "Asha@123",
    }).json()["access_token"]
    admin_token = client.post("/api/v1/auth/admin/login", json={
        "identifier": "9876543215",
        "password": "Admin@123",
    }).json()["access_token"]

    db = SessionLocal()
    in_scope = db.query(Patient).join(Village).filter(
        Village.name == "Rampur",
        Patient.is_active.is_(True),
    ).first()
    if not in_scope:
        db.close()
        pytest.skip("Seeded in-scope patient record is unavailable.")
    isolated_village = Village(
        name=f"Scope Test {uuid.uuid4().hex[:8]}",
        block="Other Block",
        district="Other District",
    )
    db.add(isolated_village)
    db.flush()
    out_of_scope = Patient(
        internal_id=f"AS-TEST-{uuid.uuid4().hex[:8]}",
        name="Out of scope test patient",
        age=35,
        gender="Female",
        village_id=isolated_village.id,
    )
    db.add(out_of_scope)
    db.commit()
    in_scope_id = in_scope.id
    out_of_scope_id = out_of_scope.id
    isolated_village_id = isolated_village.id
    db.close()

    try:
        in_scope_profile = client.get(
            f"/api/v1/patients/{in_scope_id}",
            headers={"Authorization": f"Bearer {asha_token}"},
        )
        assert in_scope_profile.status_code == 200
        forbidden_phone_reveal = client.get(
            f"/api/v1/patients/{in_scope_id}?reveal_phone=true",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert forbidden_phone_reveal.status_code == 403
        out_of_scope_profile = client.get(
            f"/api/v1/patients/{out_of_scope_id}",
            headers={"Authorization": f"Bearer {asha_token}"},
        )
        assert out_of_scope_profile.status_code == 404
        admin_patient_list = client.get(
            "/api/v1/patients",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert admin_patient_list.status_code == 403
    finally:
        db = SessionLocal()
        db.query(Patient).filter(Patient.id == out_of_scope_id).delete()
        db.query(Village).filter(Village.id == isolated_village_id).delete()
        db.commit()
        db.close()

def test_follow_up_tasks_are_limited_to_assigned_worker():
    asha_token = client.post("/api/v1/auth/login", json={
        "identifier": "9876543210",
        "password": "Asha@123",
    }).json()["access_token"]
    db = SessionLocal()
    patient = db.query(Patient).first()
    asha = db.query(User).filter(User.mobile == "9876543210").first()
    phc_staff = db.query(User).filter(User.mobile == "9876543213").first()
    if not patient or not asha or not phc_staff:
        db.close()
        pytest.skip("Seeded worker and patient records are unavailable.")
    task = FollowUpTask(
        patient_id=patient.id,
        assigned_user_id=phc_staff.id,
        task_type="GENERAL",
        due_date=datetime.now(timezone.utc) + timedelta(days=1),
        status="PENDING",
        priority="ROUTINE",
    )
    db.add(task)
    db.commit()
    task_id = task.id
    db.close()

    try:
        response = client.get(
            "/api/v1/tasks",
            headers={"Authorization": f"Bearer {asha_token}"},
        )
        assert response.status_code == 200
        assert task_id not in {item["id"] for item in response.json()}
        complete = client.patch(
            f"/api/v1/tasks/{task_id}/complete",
            headers={"Authorization": f"Bearer {asha_token}"},
        )
        assert complete.status_code == 404
    finally:
        db = SessionLocal()
        db.query(FollowUpTask).filter(FollowUpTask.id == task_id).delete()
        db.commit()
        db.close()

def test_login_invalid_credentials():
    response = client.post("/api/v1/auth/login", json={
        "identifier": "9876543210",
        "password": "WrongPassword!"
    })
    assert response.status_code == 401

def test_registration_credentials_work_after_admin_approval():
    mobile = f"+44770{uuid.uuid4().int % 10_000_000:07d}"
    password = "Registration@123"

    try:
        response = client.post("/api/v1/auth/register", json={
            "full_name": "Registration Test User",
            "mobile": mobile,
            "password": password,
            "district": "Test District",
            "block": "Test Block",
            "accepted_terms": True,
        })
        assert response.status_code == 201
        assert response.json()["status"] == "pending_approval"
        assert response.json()["mobile"] == mobile

        pending_login = client.post("/api/v1/auth/login", json={
            "identifier": f"{mobile[:6]}-{mobile[6:]}",
            "password": password,
        })
        assert pending_login.status_code == 403
        assert "administrator must approve" in pending_login.json()["detail"]

        db = SessionLocal()
        user = db.query(User).filter(User.mobile == mobile).first()
        assert user is not None
        registered_user_id = user.id
        assert user.hashed_password != password
        db.close()

        admin_login = client.post("/api/v1/auth/login", json={
            "identifier": "9876543215",
            "password": "Admin@123",
        })
        assert admin_login.status_code == 200
        approval = client.patch(
            f"/api/v1/admin/users/{registered_user_id}/status",
            params={"is_active": True},
            headers={"Authorization": f"Bearer {admin_login.json()['access_token']}"},
        )
        assert approval.status_code == 200
        assert approval.json()["is_active"] is True

        approved_login = client.post("/api/v1/auth/login", json={
            "identifier": f"{mobile[:6]}-{mobile[6:]}",
            "password": password,
        })
        assert approved_login.status_code == 200
        assert approved_login.json()["role"] == "ASHA"
    finally:
        db = SessionLocal()
        user = db.query(User).filter(User.mobile == mobile).first()
        if user:
            db.query(UserScope).filter(UserScope.user_id == user.id).delete()
            db.delete(user)
            db.commit()
        db.close()

def test_google_registration_requires_approval_before_google_login():
    mobile = f"+44770{uuid.uuid4().int % 10_000_000:07d}"
    email = f"google-{uuid.uuid4().hex}@example.test"
    claims = {
        "sub": uuid.uuid4().hex,
        "email": email,
        "email_verified": True,
        "name": "Google Registration Test",
        "iss": "https://accounts.google.com",
    }

    try:
        with patch("app.api.v1.auth.verify_google_credential", return_value=claims):
            response = client.post("/api/v1/auth/google/register", json={
                "credential": "test-google-id-token",
                "mobile": mobile,
                "district": "Test District",
                "block": "Test Block",
                "accepted_terms": True,
            })
        assert response.status_code == 201
        assert response.json()["mobile"] == mobile

        with patch("app.api.v1.auth.verify_google_credential", return_value=claims):
            pending_login = client.post("/api/v1/auth/google/login", json={
                "credential": "test-google-id-token",
            })
        assert pending_login.status_code == 403
        assert "administrator must approve" in pending_login.json()["detail"]

        db = SessionLocal()
        user = db.query(User).filter(User.google_sub == claims["sub"]).first()
        assert user is not None
        assert user.email == email
        assert user.hashed_password != "test-google-id-token"
        user.is_active = True
        db.commit()
        db.close()

        with patch("app.api.v1.auth.verify_google_credential", return_value=claims):
            approved_login = client.post("/api/v1/auth/google/login", json={
                "credential": "test-google-id-token",
            })
        assert approved_login.status_code == 200
        assert approved_login.json()["role"] == "ASHA"
    finally:
        db = SessionLocal()
        user = db.query(User).filter(User.mobile == mobile).first()
        if user:
            db.query(UserScope).filter(UserScope.user_id == user.id).delete()
            db.delete(user)
            db.commit()
        db.close()

def test_patient_self_registration_is_active_immediately():
    mobile = f"+44770{uuid.uuid4().int % 10_000_000:07d}"
    password = "Patient@123"

    try:
        otp_code = _request_patient_otp(mobile, "patient_register")
        response = client.post("/api/v1/auth/patient/register", json={
            "full_name": "Patient Self Registration",
            "mobile": mobile,
            "password": password,
            "otp_code": otp_code,
            "age": 34,
            "gender": "Other",
            "accepted_terms": True,
        })
        assert response.status_code == 201
        assert response.json()["status"] == "active"

        patient_login = client.post("/api/v1/auth/patient/login", json={
            "identifier": mobile,
            "password": password,
        })
        assert patient_login.status_code == 200
        assert patient_login.json()["role"] == "PATIENT"
        patient_token = patient_login.json()["access_token"]
        login_otp = _request_patient_otp(mobile, "patient_login")
        otp_login = client.post("/api/v1/auth/patient/otp/login", json={
            "mobile": mobile,
            "otp_code": login_otp,
        })
        assert otp_login.status_code == 200
        assert otp_login.json()["role"] == "PATIENT"
        assert client.get(
            "/api/v1/patients",
            headers={"Authorization": f"Bearer {patient_token}"},
        ).status_code == 403
        assert client.post("/api/v1/auth/admin/login", json={
            "identifier": mobile,
            "password": password,
        }).status_code == 403

        db = SessionLocal()
        user = db.query(User).filter(User.mobile == mobile).first()
        db.query(MobileOtpChallenge).filter(MobileOtpChallenge.mobile == mobile).delete()
        assert user is not None and user.is_active
        profile = db.query(Patient).filter(Patient.user_id == user.id).first()
        assert profile is not None and profile.name == "Patient Self Registration"
        assert db.query(Consent).filter(Consent.patient_id == profile.id, Consent.status == "ACTIVE").first()
        db.close()
    finally:
        db = SessionLocal()
        user = db.query(User).filter(User.mobile == mobile).first()
        db.query(MobileOtpChallenge).filter(MobileOtpChallenge.mobile == mobile).delete()
        if user:
            profile = db.query(Patient).filter(Patient.user_id == user.id).first()
            if profile:
                db.query(Consent).filter(Consent.patient_id == profile.id).delete()
                db.delete(profile)
            db.delete(user)
            db.commit()
        db.close()

def test_patient_google_registration_uses_verified_identity():
    mobile = f"+44770{uuid.uuid4().int % 10_000_000:07d}"
    claims = {
        "sub": uuid.uuid4().hex,
        "email": f"patient-{uuid.uuid4().hex}@example.test",
        "email_verified": True,
        "name": "Google Patient Test",
        "iss": "https://accounts.google.com",
    }

    try:
        otp_code = _request_patient_otp(mobile, "patient_register")
        with patch("app.api.v1.auth.verify_google_credential", return_value=claims):
            response = client.post("/api/v1/auth/patient/register", json={
                "credential": "test-google-id-token",
                "mobile": mobile,
                "otp_code": otp_code,
                "age": 28,
                "gender": "Female",
                "accepted_terms": True,
            })
        assert response.status_code == 201
        assert response.json()["status"] == "active"

        with patch("app.api.v1.auth.verify_google_credential", return_value=claims):
            google_login = client.post("/api/v1/auth/google/patient/login", json={
                "credential": "test-google-id-token",
            })
        assert google_login.status_code == 200
        assert google_login.json()["role"] == "PATIENT"

        db = SessionLocal()
        user = db.query(User).filter(User.google_sub == claims["sub"]).first()
        assert user is not None
        assert user.full_name == claims["name"]
        assert user.email == claims["email"]
        db.close()
    finally:
        db = SessionLocal()
        user = db.query(User).filter(User.mobile == mobile).first()
        db.query(MobileOtpChallenge).filter(MobileOtpChallenge.mobile == mobile).delete()
        if user:
            profile = db.query(Patient).filter(Patient.user_id == user.id).first()
            if profile:
                db.query(Consent).filter(Consent.patient_id == profile.id).delete()
                db.delete(profile)
            db.delete(user)
            db.commit()
        db.close()

def _request_patient_otp(mobile: str, purpose: str) -> str:
    sent = {}
    with patch(
        "app.api.v1.auth.send_mobile_otp",
        side_effect=lambda _mobile, code: sent.update(code=code),
    ):
        response = client.post("/api/v1/auth/patient/otp/start", json={
            "mobile": mobile,
            "purpose": purpose,
        })
    assert response.status_code == 200
    assert "code" in sent
    return sent["code"]


def test_patient_otp_is_limited_and_cannot_be_reused():
    mobile = f"+44770{uuid.uuid4().int % 10_000_000:07d}"
    try:
        code = _request_patient_otp(mobile, "patient_register")
        resend = client.post("/api/v1/auth/patient/otp/start", json={
            "mobile": mobile,
            "purpose": "patient_register",
        })
        assert resend.status_code == 429
        wrong_code = "000000" if code != "000000" else "000001"
        for _ in range(5):
            response = client.post("/api/v1/auth/patient/register", json={
                "full_name": "OTP Abuse Test",
                "mobile": mobile,
                "password": "Patient@123",
                "otp_code": wrong_code,
                "age": 34,
                "gender": "Other",
                "accepted_terms": True,
            })
            assert response.status_code == 400

        db = SessionLocal()
        challenge = db.query(MobileOtpChallenge).filter(MobileOtpChallenge.mobile == mobile).first()
        assert challenge is not None and challenge.attempts == 5 and challenge.consumed_at is not None
        assert db.query(User).filter(User.mobile == mobile).first() is None
        db.close()
    finally:
        db = SessionLocal()
        db.query(MobileOtpChallenge).filter(MobileOtpChallenge.mobile == mobile).delete()
        db.commit()
        db.close()

def test_sms_setup_error_does_not_leave_a_verification_challenge():
    mobile = f"+44770{uuid.uuid4().int % 10_000_000:07d}"
    with patch(
        "app.api.v1.auth.send_mobile_otp",
        side_effect=HTTPException(
            status_code=503,
            detail="SMS verification is not configured.",
        ),
    ):
        response = client.post("/api/v1/auth/patient/otp/start", json={
            "mobile": mobile,
            "purpose": "patient_register",
        })
    assert response.status_code == 503
    db = SessionLocal()
    assert db.query(MobileOtpChallenge).filter(MobileOtpChallenge.mobile == mobile).first() is None
    db.close()

def test_local_demo_otp_registration_is_available_only_when_explicitly_enabled():
    mobile = f"+44770{uuid.uuid4().int % 10_000_000:07d}"
    with patch.object(settings, "APP_ENV", "development"), patch.object(settings, "DEMO_OTP_MODE", True):
        response = client.post("/api/v1/auth/patient/otp/start", json={
            "mobile": mobile,
            "purpose": "patient_register",
        })
    assert response.status_code == 200
    data = response.json()
    assert data["demo_mode"] is True
    assert data["demo_code"].isdigit() and len(data["demo_code"]) == 6
    assert "No SMS was sent" in data["message"]
    try:
        registration = client.post("/api/v1/auth/patient/register", json={
            "full_name": "Local Demo Patient",
            "mobile": mobile,
            "password": "Patient@123",
            "otp_code": data["demo_code"],
            "age": 34,
            "gender": "Other",
            "accepted_terms": True,
        })
        assert registration.status_code == 201
    finally:
        db = SessionLocal()
        user = db.query(User).filter(User.mobile == mobile).first()
        db.query(MobileOtpChallenge).filter(MobileOtpChallenge.mobile == mobile).delete()
        if user:
            profile = db.query(Patient).filter(Patient.user_id == user.id).first()
            if profile:
                db.query(Consent).filter(Consent.patient_id == profile.id).delete()
                db.delete(profile)
            db.delete(user)
        db.commit()
        db.close()

def test_admin_can_change_email_and_sign_in_with_it():
    new_email = f"admin-{uuid.uuid4().hex}@example.test"
    login = client.post("/api/v1/auth/admin/login", json={
        "identifier": "9876543215",
        "password": "Admin@123",
    })
    assert login.status_code == 200
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    original = client.get("/api/v1/auth/admin/settings", headers=headers)
    assert original.status_code == 200
    original_email = original.json()["email"]
    try:
        updated = client.patch("/api/v1/auth/admin/settings", headers=headers, json={
            "current_password": "Admin@123",
            "email": new_email,
        })
        assert updated.status_code == 200
        assert updated.json()["email"] == new_email
        assert client.post("/api/v1/auth/admin/login", json={
            "identifier": new_email,
            "password": "Admin@123",
        }).status_code == 200
    finally:
        db = SessionLocal()
        admin = db.query(User).filter(User.mobile == "9876543215", User.role == "ADMIN").first()
        assert admin is not None
        admin.email = original_email
        db.commit()
        db.close()

def test_doctor_registration_waits_for_admin_approval():
    mobile = f"+44770{uuid.uuid4().int % 10_000_000:07d}"
    registration_number = f"TEST-{uuid.uuid4().hex[:16]}"
    password = "Doctor@123"
    db = SessionLocal()
    facility = db.query(Facility).filter(Facility.is_active == True).first()
    department = db.query(Department).filter(Department.is_active == True).first()
    assert facility is not None and department is not None
    facility_id, department_id = facility.id, department.id
    db.close()

    try:
        response = client.post("/api/v1/auth/doctor/register", json={
            "full_name": "Doctor Registration Test",
            "mobile": mobile,
            "password": password,
            "facility_id": facility_id,
            "department_id": department_id,
            "specialization": "General Medicine",
            "qualification": "MBBS",
            "registration_number": registration_number,
            "accepted_terms": True,
        })
        assert response.status_code == 201
        assert response.json()["status"] == "pending_approval"
        assert client.post("/api/v1/auth/doctor/login", json={
            "identifier": mobile,
            "password": password,
        }).status_code == 403

        admin_login = client.post("/api/v1/auth/admin/login", json={
            "identifier": "9876543215",
            "password": "Admin@123",
        })
        assert admin_login.status_code == 200
        assert client.post("/api/v1/auth/doctor/login", json={
            "identifier": "9876543215",
            "password": "Admin@123",
        }).status_code == 403
        db = SessionLocal()
        user = db.query(User).filter(User.mobile == mobile).first()
        assert user is not None and not user.is_active
        user_id = user.id
        db.close()

        approval = client.patch(
            f"/api/v1/admin/users/{user_id}/status",
            params={"is_active": True},
            headers={"Authorization": f"Bearer {admin_login.json()['access_token']}"},
        )
        assert approval.status_code == 200
        assert approval.json()["is_active"] is True
        doctor_login = client.post("/api/v1/auth/doctor/login", json={
            "identifier": mobile,
            "password": password,
        })
        assert doctor_login.status_code == 200
        assert doctor_login.json()["role"] == "DOCTOR"

        reviewed_users = client.get(
            "/api/v1/admin/users?role=DOCTOR",
            headers={"Authorization": f"Bearer {admin_login.json()['access_token']}"},
        )
        assert reviewed_users.status_code == 200
        review_entry = next(item for item in reviewed_users.json() if item["id"] == user_id)
        assert review_entry["doctor_details"]["registration_number"] == registration_number
        assert review_entry["doctor_details"]["qualification"] == "MBBS"

        db = SessionLocal()
        profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == user_id).first()
        assert profile is not None and profile.is_active
        db.close()
    finally:
        db = SessionLocal()
        user = db.query(User).filter(User.mobile == mobile).first()
        if user:
            db.query(DoctorProfile).filter(DoctorProfile.user_id == user.id).delete()
            db.delete(user)
            db.commit()
        db.close()

def test_pin_login():
    response = client.post("/api/v1/auth/pin-login", json={
        "pin": "1234",
        "device_id": "dev_asha_01"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "ASHA"

def test_rbac_admin_endpoint_denied_for_asha():
    # Login as ASHA
    asha_login = client.post("/api/v1/auth/login", json={
        "identifier": "9876543210",
        "password": "Asha@123"
    }).json()
    token = asha_login["access_token"]

    # Attempt to access admin overview
    res = client.get("/api/v1/admin/overview", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403

def test_rbac_admin_endpoint_allowed_for_admin():
    # Login as ADMIN
    admin_login = client.post("/api/v1/auth/login", json={
        "identifier": "9876543215",
        "password": "Admin@123"
    }).json()
    token = admin_login["access_token"]

    res = client.get("/api/v1/admin/overview", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert "kpis" in data
    assert data["kpis"]["total_registered_patients"] >= 6


def test_admin_console_module_endpoints_and_facility_controls():
    admin_login = client.post("/api/v1/auth/admin/login", json={
        "identifier": "9876543215",
        "password": "Admin@123",
    })
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    asha_login = client.post("/api/v1/auth/login", json={
        "identifier": "9876543210",
        "password": "Asha@123",
    })
    assert asha_login.status_code == 200
    asha_headers = {"Authorization": f"Bearer {asha_login.json()['access_token']}"}

    for endpoint in (
        "/admin/patients",
        "/admin/facilities",
        "/admin/villages",
        "/admin/doctors",
        "/admin/appointments",
        "/admin/referrals",
        "/admin/tasks",
    ):
        response = client.get(f"/api/v1{endpoint}", headers=admin_headers)
        assert response.status_code == 200, (endpoint, response.text)
        if endpoint == "/admin/villages":
            assert {"villages", "facilities"} <= response.json().keys()
        else:
            assert isinstance(response.json(), list)

        forbidden = client.get(f"/api/v1{endpoint}", headers=asha_headers)
        assert forbidden.status_code == 403, endpoint

    patients = client.get("/api/v1/admin/patients", headers=admin_headers)
    if patients.json():
        assert {"id", "internal_id", "name", "consent_status"} <= patients.json()[0].keys()
        assert "phone" not in patients.json()[0]

    created = client.post(
        "/api/v1/admin/facilities",
        headers=admin_headers,
        json={
            "name": f"Admin API Test {uuid.uuid4().hex[:8]}",
            "type": "PHC",
            "district": "Test District",
            "block": "Test Block",
        },
    )
    assert created.status_code == 201
    facility_id = created.json()["id"]
    village = client.post(
        "/api/v1/admin/villages",
        headers=admin_headers,
        json={
            "name": f"Admin API Test {uuid.uuid4().hex[:8]}",
            "block": "Test Block",
            "district": "Test District",
            "population": 1250,
            "assigned_facility_id": facility_id,
        },
    )
    assert village.status_code == 201
    village_id = village.json()["id"]

    try:
        unassigned = client.patch(
            f"/api/v1/admin/villages/{village_id}/facility",
            headers=admin_headers,
            json={"facility_id": None},
        )
        assert unassigned.status_code == 200
        assert unassigned.json()["assigned_facility_id"] is None

        deactivated = client.patch(
            f"/api/v1/admin/facilities/{facility_id}/status?is_active=false",
            headers=admin_headers,
        )
        assert deactivated.status_code == 200
        assert deactivated.json()["is_active"] is False
    finally:
        db = SessionLocal()
        db.query(Village).filter(Village.id == village_id).delete()
        facility = db.query(Facility).filter(Facility.id == facility_id).first()
        if facility:
            db.delete(facility)
            db.commit()
        db.close()


def test_health_radar_alerts_are_scoped_and_review_requires_authorized_role():
    db = SessionLocal()
    village = db.query(Village).filter(Village.name == "Rampur").first()
    if not village:
        db.close()
        pytest.skip("Seeded Rampur village is unavailable.")
    local_alert = CandidateAlert(
        alert_code=f"TEST-{uuid.uuid4().hex[:12]}",
        title="Scoped test alert",
        disease_category="FEVER",
        district="Sitapur",
        block="Sitapur",
        village_id=village.id,
        case_count=2,
        data_quality="Good",
    )
    external_alert = CandidateAlert(
        alert_code=f"TEST-{uuid.uuid4().hex[:12]}",
        title="Out-of-scope test alert",
        disease_category="FEVER",
        district="Other District",
        block="Other Block",
        case_count=3,
        data_quality="Good",
    )
    db.add_all([local_alert, external_alert])
    db.commit()
    local_alert_id = local_alert.id
    external_alert_id = external_alert.id
    db.close()

    asha_token = client.post("/api/v1/auth/login", json={
        "identifier": "9876543210",
        "password": "Asha@123",
    }).json()["access_token"]
    admin_token = client.post("/api/v1/auth/login", json={
        "identifier": "9876543215",
        "password": "Admin@123",
    }).json()["access_token"]

    try:
        asha_alerts = client.get(
            "/api/v1/surveillance/alerts",
            headers={"Authorization": f"Bearer {asha_token}"},
        )
        assert asha_alerts.status_code == 200
        asha_alert_ids = {item["id"] for item in asha_alerts.json()}
        assert local_alert_id in asha_alert_ids
        assert external_alert_id not in asha_alert_ids

        denied_review = client.patch(
            f"/api/v1/surveillance/alerts/{local_alert_id}/review",
            headers={"Authorization": f"Bearer {asha_token}"},
            json={"status": "ACKNOWLEDGED", "review_notes": "Not authorized"},
        )
        assert denied_review.status_code == 403

        admin_alerts = client.get(
            "/api/v1/surveillance/alerts",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert admin_alerts.status_code == 200
        admin_alert_ids = {item["id"] for item in admin_alerts.json()}
        assert {local_alert_id, external_alert_id} <= admin_alert_ids
    finally:
        db = SessionLocal()
        db.query(CandidateAlert).filter(
            CandidateAlert.id.in_([local_alert_id, external_alert_id])
        ).delete(synchronize_session=False)
        db.commit()
        db.close()

# ==========================================
# 2. DETERMINISTIC CLINICAL SAFETY TESTS
# ==========================================
def test_golden_vectors_reproducibility():
    """
    PRD APP-TRI-06: Golden vectors must evaluate with 100% exact match
    """
    for gv in GOLDEN_RULE_VECTORS:
        decision = evaluate_deterministic_safety(
            symptoms=gv["symptoms"],
            vitals=gv["vitals"]
        )
        if "expected_level" in gv:
            assert decision.escalation_level.value == gv["expected_level"], f"Failed for {gv['id']}"
        if "expected_urgent" in gv:
            assert decision.is_urgent == gv["expected_urgent"], f"Failed urgency for {gv['id']}"
        if "expected_rule" in gv:
            assert gv["expected_rule"] in decision.triggered_rules, f"Rule not triggered in {gv['id']}"
        if "expected_missing" in gv:
            assert gv["expected_missing"] in decision.missing_required_inputs, f"Missing input not flagged in {gv['id']}"

def test_triage_api_endpoint():
    admin_login = client.post("/api/v1/auth/login", json={
        "identifier": "9876543210",
        "password": "Asha@123"
    }).json()
    token = admin_login["access_token"]

    db = SessionLocal()
    patient = db.query(Patient).first()
    db.close()

    res = client.post(
        "/api/v1/triage/evaluate",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "patient_id": patient.id,
            "symptoms": [{"name": "headache", "duration_days": 2, "severity": "SEVERE"}],
            "vitals": {"systolic_bp": 184, "diastolic_bp": 118}
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert data["is_urgent"] == True
    assert data["escalation_level"] == "EMERGENCY"
    assert "RULE_BP_002_HYPERTENSIVE_CRISIS" in data["triggered_rules"]

def test_unconfigured_voice_transcription_is_not_reported_as_success():
    token = client.post("/api/v1/auth/login", json={
        "identifier": "9876543210",
        "password": "Asha@123",
    }).json()["access_token"]
    response = client.post(
        "/api/v1/triage/voice/simulate",
        headers={"Authorization": f"Bearer {token}"},
        json={"text": "fever", "language": "en"},
    )
    assert response.status_code == 501
    assert "not configured" in response.json()["detail"].lower()

# ==========================================
# 3. REFERRAL LIFECYCLE TESTS
# ==========================================
def test_referral_lifecycle():
    asha_login = client.post("/api/v1/auth/login", json={
        "identifier": "9876543210",
        "password": "Asha@123"
    }).json()
    asha_token = asha_login["access_token"]
    token = asha_token
    phc_login = client.post("/api/v1/auth/login", json={
        "identifier": "9876543213",
        "password": "Phc@123"
    }).json()
    phc_token = phc_login["access_token"]
    doctor_login = client.post("/api/v1/auth/doctor/login", json={
        "identifier": "9876543212",
        "password": "Doc@123"
    }).json()
    doctor_token = doctor_login["access_token"]

    db = SessionLocal()
    patient = db.query(Patient).join(Village).filter(Village.name == "Rampur").first()
    facility = patient.village.facility if patient and patient.village else db.query(Facility).first()
    db.close()

    # 1. Create Referral (PENDING)
    create_res = client.post(
        "/api/v1/referrals",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "patient_id": patient.id,
            "receiving_facility_id": facility.id,
            "urgency": "URGENT",
            "reason": "Test Urgent Referral"
        }
    )
    assert create_res.status_code == 200
    ref_id = create_res.json()["id"]

    # 2. Transition: PENDING -> ACCEPTED
    token = phc_token
    trans_res1 = client.patch(
        f"/api/v1/referrals/{ref_id}/transition",
        headers={"Authorization": f"Bearer {token}"},
        json={"target_status": "ACCEPTED", "notes": "PHC accepted patient"}
    )
    assert trans_res1.status_code == 200
    assert trans_res1.json()["new_status"] == "ACCEPTED"

    # 3. Transition: ACCEPTED -> ARRIVED
    trans_res2 = client.patch(
        f"/api/v1/referrals/{ref_id}/transition",
        headers={"Authorization": f"Bearer {token}"},
        json={"target_status": "ARRIVED", "notes": "Patient physically arrived"}
    )
    assert trans_res2.status_code == 200
    assert trans_res2.json()["new_status"] == "ARRIVED"

    # 4. Transition: ARRIVED -> COMPLETED
    token = doctor_token
    trans_res3 = client.patch(
        f"/api/v1/referrals/{ref_id}/transition",
        headers={"Authorization": f"Bearer {token}"},
        json={"target_status": "COMPLETED", "notes": "Doctor completed consultation"}
    )
    assert trans_res3.status_code == 200
    assert trans_res3.json()["new_status"] == "COMPLETED"

    # 5. Invalid transition: COMPLETED -> PENDING should fail
    invalid_res = client.patch(
        f"/api/v1/referrals/{ref_id}/transition",
        headers={"Authorization": f"Bearer {token}"},
        json={"target_status": "PENDING"}
    )
    assert invalid_res.status_code == 400

# ==========================================
# 4. MEDISLOT CONCURRENCY & CONFLICT PROTECTION (50 Parallel Requests)
# ==========================================
def test_doctor_queue_is_role_scoped_and_contains_only_todays_appointments():
    admin_login = client.post("/api/v1/auth/admin/login", json={
        "identifier": "9876543215",
        "password": "Admin@123",
    })
    assert admin_login.status_code == 200
    admin_queue = client.get(
        "/api/v1/doctor/queue",
        headers={"Authorization": f"Bearer {admin_login.json()['access_token']}"},
    )
    assert admin_queue.status_code == 403

    doctor_login = client.post("/api/v1/auth/doctor/login", json={
        "identifier": "9876543212",
        "password": "Doc@123",
    })
    assert doctor_login.status_code == 200
    doctor_token = doctor_login.json()["access_token"]
    response = client.get(
        "/api/v1/doctor/queue",
        headers={"Authorization": f"Bearer {doctor_token}"},
    )
    assert response.status_code == 200
    queue = response.json()

    db = SessionLocal()
    doctor_user = db.query(User).filter(User.mobile == "9876543212").first()
    assert doctor_user is not None
    doctor = db.query(DoctorProfile).filter(DoctorProfile.user_id == doctor_user.id).first()
    assert doctor is not None
    today_appointments = db.query(Appointment).join(
        DoctorSlot, Appointment.slot_id == DoctorSlot.id,
    ).filter(
        Appointment.doctor_id == doctor.id,
        Appointment.status.in_(["CONFIRMED", "PENDING", "ARRIVED"]),
        DoctorSlot.slot_date == date.today().isoformat(),
    ).all()
    expected_ids = {appointment.id for appointment in today_appointments}
    expected_urgent = sum(
        1 for appointment in today_appointments
        if appointment.referral and appointment.referral.urgency == "URGENT"
    )
    db.close()

    returned_ids = {item["appointment_id"] for item in queue["queue"]}
    assert returned_ids == expected_ids
    assert queue["total_scheduled_today"] == len(expected_ids)
    assert queue["urgent_count"] == expected_urgent
    assert queue["urgent_count"] == sum(1 for item in queue["queue"] if item["is_urgent"])
    assert [item["is_urgent"] for item in queue["queue"]] == sorted(
        [item["is_urgent"] for item in queue["queue"]],
        reverse=True,
    )


def test_50_parallel_concurrent_bookings():
    """
    PRD 19.4 Test Case 3:
    50 parallel requests for one slot: exactly 1 succeeds; the others receive HTTP 409 SLOT_TAKEN!
    """
    login_res = client.post("/api/v1/auth/login", json={
        "identifier": "9876543210",
        "password": "Asha@123"
    }).json()
    token = login_res["access_token"]

    db = SessionLocal()
    # Find a free slot
    slot = db.query(DoctorSlot).filter(DoctorSlot.status == "AVAILABLE").first()
    assert slot is not None, "A free slot must exist"
    slot_id = slot.id
    doctor_id = slot.doctor_id
    patient = db.query(Patient).first()
    facility_id = slot.doctor.facility_id
    db.close()

    def attempt_booking(worker_idx):
        local_client = TestClient(app)
        return local_client.post(
            "/api/v1/appointments",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "client_uuid": f"concurrent_worker_uuid_{worker_idx}_{slot_id}",
                "patient_id": patient.id,
                "doctor_id": doctor_id,
                "facility_id": facility_id,
                "slot_id": slot_id,
                "reason_code": "Concurrency Stress Test"
            }
        )

    # Fire 50 parallel requests concurrently using ThreadPoolExecutor
    with concurrent.futures.ThreadPoolExecutor(max_workers=50) as executor:
        futures = [executor.submit(attempt_booking, i) for i in range(50)]
        results = [f.result() for f in futures]

    successes = [r for r in results if r.status_code in [200, 201]]
    conflicts = [r for r in results if r.status_code == 409]

    # Verification: EXACTLY ONE SUCCESS, 49 CONFLICTS
    assert len(successes) == 1, f"Expected exactly 1 success, got {len(successes)}"
    assert len(conflicts) == 49, f"Expected 49 conflicts, got {len(conflicts)}"

    # Check 409 response payload format contains alternatives
    conflict_json = conflicts[0].json()["detail"]
    assert conflict_json["code"] == "SLOT_TAKEN"
    assert "alternatives" in conflict_json

    # Check database state: exactly 1 active appointment for this slot
    db = SessionLocal()
    active_count = db.query(Appointment).filter(Appointment.slot_id == slot_id).count()
    slot_db = db.query(DoctorSlot).filter(DoctorSlot.id == slot_id).first()
    assert active_count == 1
    assert slot_db.status == "BOOKED"
    db.close()

# ==========================================
# 5. OFFLINE SYNC ENGINE TESTS
# ==========================================
def test_sync_push_and_pull():
    login_res = client.post("/api/v1/auth/login", json={
        "identifier": "9876543210",
        "password": "Asha@123"
    }).json()
    token = login_res["access_token"]

    db = SessionLocal()
    patient = db.query(Patient).join(Village).filter(Village.name == "Rampur").first()
    facility = patient.village.facility if patient and patient.village else db.query(Facility).first()
    db.close()

    # Push batch with urgent referral and encounter
    import time
    unique_suffix = int(time.time() * 1000)
    push_res = client.post(
        "/api/v1/sync/push",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "device_id": "dev_asha_01",
            "items": [
                {
                    "op_id": f"sync_offline_ref_uuid_{unique_suffix}",
                    "entity": "referral",
                    "action": "create",
                    "priority": "urgent",
                    "client_time": "2026-10-30T10:45:00Z",
                    "payload": {
                        "patient_id": patient.id,
                        "receiving_facility_id": facility.id,
                        "urgency": "URGENT",
                        "reason": "Offline Synced Urgent Case"
                    }
                },
                {
                    "op_id": f"sync_offline_enc_uuid_{unique_suffix}",
                    "entity": "encounter",
                    "action": "create",
                    "priority": "routine",
                    "client_time": "2026-10-30T10:45:00Z",
                    "payload": {
                        "patient_id": patient.id,
                        "source": "MANUAL",
                        "vitals": {"systolic_bp": 130, "diastolic_bp": 82}
                    }
                },
                {
                    "op_id": f"sync_offline_unsupported_{unique_suffix}",
                    "entity": "consent",
                    "action": "create",
                    "client_time": "2026-10-30T10:45:00Z",
                    "payload": {"patient_id": patient.id}
                }
            ]
        }
    )
    assert push_res.status_code == 200
    push_data = push_res.json()
    assert len(push_data["results"]) == 3
    result_by_op = {item["op_id"]: item for item in push_data["results"]}
    assert result_by_op[f"sync_offline_ref_uuid_{unique_suffix}"]["status"] == "accepted"
    assert result_by_op[f"sync_offline_enc_uuid_{unique_suffix}"]["status"] == "accepted"
    assert result_by_op[f"sync_offline_unsupported_{unique_suffix}"]["status"] == "rejected"

    unregistered_device = client.post(
        "/api/v1/sync/push",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "device_id": "dev_doc_01",
            "items": [{
                "op_id": "invalid-device-test",
                "entity": "task",
                "action": "create",
                "client_time": "2026-10-30T10:45:00Z",
                "payload": {},
            }],
        },
    )
    assert unregistered_device.status_code == 403

    # Test Pull
    pull_res = client.get(
        "/api/v1/sync/pull?cursor=0",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert pull_res.status_code == 200
    pull_data = pull_res.json()
    assert len(pull_data["patients"]) > 0
    assert len(pull_data["slots"]) > 0
    assert "next_cursor" in pull_data

    invalid_cursor = client.get(
        "/api/v1/sync/pull?cursor=not-a-timestamp",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert invalid_cursor.status_code == 422
    future_cursor = client.get(
        "/api/v1/sync/pull?cursor=2999-01-01T00:00:00Z",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert future_cursor.status_code == 200
    assert future_cursor.json()["patients"] == []
