"""
Authentication and Device Binding API Routes
"""
import re
import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from app.db.session import get_db
from app.models.entities import User, Device, UserScope, Patient, Consent, DoctorProfile, Facility, Department, MobileOtpChallenge
from app.schemas.schemas import AdminAccountSettingsRequest, DoctorRegistrationRequest, GoogleLoginRequest, GoogleRegistrationRequest, LoginRequest, MobileOtpStartRequest, PatientAccountRegistrationRequest, PatientOtpLoginRequest, PinSetupRequest, PinLoginRequest, RegistrationRequest, RegistrationResponse, TokenResponse, UserOut
from app.core.security import verify_password, verify_pin, get_password_hash, create_access_token
from app.core.config import settings
from app.api.deps import get_current_user
from app.services.audit_service import log_audit_event
from app.services.otp_service import hash_otp, send_mobile_otp, verify_otp_hash
from app.services.patient_service import generate_internal_id

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _create_mobile_otp(db: Session, mobile: str, purpose: str) -> None:
    now = _utcnow()
    recent_challenges = db.query(MobileOtpChallenge).filter(
        MobileOtpChallenge.mobile == mobile,
        MobileOtpChallenge.purpose == purpose,
        MobileOtpChallenge.created_at >= now - timedelta(hours=1),
    ).order_by(MobileOtpChallenge.created_at.desc()).all()
    if recent_challenges and (now - recent_challenges[0].created_at).total_seconds() < 60:
        raise HTTPException(status_code=429, detail="Wait one minute before requesting another verification code.")
    if len(recent_challenges) >= 5:
        raise HTTPException(status_code=429, detail="Too many verification codes requested. Try again in an hour.")

    for challenge in recent_challenges:
        if challenge.consumed_at is None:
            challenge.consumed_at = now

    code = f"{secrets.randbelow(1_000_000):06d}"
    challenge = MobileOtpChallenge(
        mobile=mobile,
        purpose=purpose,
        code_hash=hash_otp(mobile, purpose, code),
        created_at=now,
        expires_at=now + timedelta(minutes=5),
        attempts=0,
    )
    db.add(challenge)
    db.flush()
    try:
        demo_mode = send_mobile_otp(mobile, code)
    except HTTPException:
        db.rollback()
        raise
    db.commit()
    return code if demo_mode else None


def _consume_mobile_otp(db: Session, mobile: str, purpose: str, code: str) -> None:
    now = _utcnow()
    challenge = db.query(MobileOtpChallenge).filter(
        MobileOtpChallenge.mobile == mobile,
        MobileOtpChallenge.purpose == purpose,
        MobileOtpChallenge.consumed_at.is_(None),
    ).order_by(MobileOtpChallenge.created_at.desc()).first()
    if not challenge:
        raise HTTPException(status_code=400, detail="Request a verification code before continuing.")
    if challenge.expires_at <= now:
        challenge.consumed_at = now
        db.commit()
        raise HTTPException(status_code=400, detail="The verification code expired. Request a new one.")
    if challenge.attempts >= 5:
        challenge.consumed_at = now
        db.commit()
        raise HTTPException(status_code=429, detail="Too many incorrect codes. Request a new verification code.")
    if not verify_otp_hash(mobile, purpose, code, challenge.code_hash):
        challenge.attempts += 1
        if challenge.attempts >= 5:
            challenge.consumed_at = now
        db.commit()
        raise HTTPException(status_code=400, detail="The verification code is incorrect.")
    challenge.consumed_at = now
    db.commit()


def verify_google_credential(credential: str) -> dict:
    if not settings.GOOGLE_OAUTH_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google sign-in is not configured. Set GOOGLE_OAUTH_CLIENT_ID on the backend.")
    try:
        claims = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            settings.GOOGLE_OAUTH_CLIENT_ID,
        )
    except ValueError as error:
        raise HTTPException(status_code=401, detail="Google sign-in could not verify this account. Try again.") from error

    if claims.get("iss") not in {"accounts.google.com", "https://accounts.google.com"}:
        raise HTTPException(status_code=401, detail="Google sign-in returned an invalid identity.")
    if claims.get("email_verified") is not True:
        raise HTTPException(status_code=401, detail="Verify your Google email address before continuing.")
    if not claims.get("sub") or not claims.get("email") or not claims.get("name"):
        raise HTTPException(status_code=401, detail="Google did not provide the required verified account details.")
    return claims

def _issue_session(
    db: Session,
    user: User,
    device_id: str | None = None,
    device_model: str | None = None,
) -> TokenResponse:
    if device_id:
        device = db.query(Device).filter(Device.device_id == device_id, Device.user_id == user.id).first()
        if not device:
            db.add(Device(
                device_id=device_id,
                user_id=user.id,
                device_model=device_model or "Android Mobile",
            ))
            db.commit()
        elif device.is_revoked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This device has been revoked by the system administrator."
            )

    scope_data = {}
    if user.scope:
        scope_data = {
            "district": user.scope.district,
            "block": user.scope.block,
            "village": user.scope.village,
            "facility_id": user.scope.facility_id
        }

    token = create_access_token(subject=user.id, role=user.role)
    log_audit_event(db=db, actor_id=user.id, action="LOGIN", entity_type="user", entity_id=user.id, details="User login successful")
    return TokenResponse(
        access_token=token,
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
        first_login_done=user.first_login_done,
        scope=scope_data,
    )

def _authenticate(data: LoginRequest, db: Session, expected_role: str | None = None) -> TokenResponse:
    identifier = data.identifier.strip()
    mobile_identifier = re.sub(r"[\s()-]", "", identifier)
    user = db.query(User).filter(
        (User.mobile == mobile_identifier)
        | (User.employee_id == identifier)
        | (User.email == identifier.lower())
    ).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid employee ID / mobile number or password."
        )
    if expected_role and user.role != expected_role:
        raise HTTPException(status_code=403, detail=f"This account cannot sign in through the {expected_role.lower()} portal.")
    if not user.is_active:
        if user.role == "DOCTOR":
            detail = "Your doctor registration is awaiting administrator approval."
        else:
            detail = "Your account is not active yet. If you recently registered, an administrator must approve your access before you can sign in. Contact your health administrator if this is unexpected."
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)
    if expected_role == "PATIENT" and not user.mobile_verified_at:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Verify your mobile number with an SMS code before signing in.")
    return _issue_session(db, user, data.device_id, data.device_model)

@router.post("/register", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
def register(data: RegistrationRequest, db: Session = Depends(get_db)):
    if not data.accepted_terms:
        raise HTTPException(status_code=400, detail="Confirm the access and privacy notice to continue.")

    if db.query(User).filter(User.mobile == data.mobile).first():
        raise HTTPException(status_code=409, detail="An account or request already exists for this mobile number.")

    user = User(
        mobile=data.mobile,
        full_name=data.full_name.strip(),
        role="ASHA",
        hashed_password=get_password_hash(data.password),
        is_active=False,
        first_login_done=False,
    )
    try:
        db.add(user)
        db.flush()
        db.add(UserScope(user_id=user.id, district=data.district, block=data.block))
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="An account or request already exists for this mobile number.")

    return RegistrationResponse(
        status="pending_approval",
        message="Registration received. An administrator must approve your account before you can sign in.",
        mobile=user.mobile,
    )

@router.post("/patient/register", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
def register_patient_account(data: PatientAccountRegistrationRequest, db: Session = Depends(get_db)):
    if not data.accepted_terms:
        raise HTTPException(status_code=400, detail="Accept the privacy notice and patient consent to continue.")
    claims = verify_google_credential(data.credential) if data.credential else None
    if not claims and (not data.full_name or not data.password):
        raise HTTPException(status_code=400, detail="Enter your name and password or continue with Google.")
    email = str(claims["email"]).strip().lower() if claims else None
    google_sub = str(claims["sub"]) if claims else None
    duplicate = db.query(User).filter(
        (User.mobile == data.mobile)
        | (User.google_sub == google_sub if google_sub else False)
        | (User.email == email if email else False)
    ).first()
    if duplicate:
        raise HTTPException(status_code=409, detail="An account already exists for this mobile number.")

    _consume_mobile_otp(db, data.mobile, "patient_register", data.otp_code)
    user = User(
        mobile=data.mobile,
        email=email,
        google_sub=google_sub,
        full_name=str(claims["name"]).strip()[:100] if claims else data.full_name.strip(),
        role="PATIENT",
        hashed_password=get_password_hash(data.password or secrets.token_urlsafe(32)),
        is_active=True,
        first_login_done=True,
        mobile_verified_at=_utcnow(),
    )
    try:
        db.add(user)
        db.flush()
        patient = Patient(
            user_id=user.id,
            internal_id=generate_internal_id(),
            name=user.full_name,
            age=data.age,
            gender=data.gender,
            phone=data.mobile,
            created_by_id=user.id,
        )
        db.add(patient)
        db.flush()
        db.add(Consent(
            patient_id=patient.id,
            purpose="GENERAL_HEALTHCARE_COORDINATION",
            scope="FACILITY_AND_WORKER_ACCESS",
            text_version="v2.1",
            language="hi",
            status="ACTIVE",
            capture_method="SELF_REGISTRATION",
            captured_by_id=user.id,
        ))
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="An account already exists for this mobile number.")

    log_audit_event(
        db=db,
        actor_id=user.id,
        action="SELF_REGISTER_PATIENT",
        entity_type="patient",
        entity_id=patient.id,
        details=f"Patient self-registration completed for {patient.internal_id}",
    )
    return RegistrationResponse(
        status="active",
        message="Patient registration is complete. You can sign in now.",
        mobile=user.mobile,
    )


@router.post("/patient/otp/start")
def start_patient_otp(data: MobileOtpStartRequest, db: Session = Depends(get_db)):
    existing_patient = db.query(User).filter(User.mobile == data.mobile, User.role == "PATIENT").first()
    if data.purpose == "patient_register":
        if db.query(User.id).filter(User.mobile == data.mobile).first():
            raise HTTPException(status_code=409, detail="An account already exists for this mobile number.")
    elif not existing_patient or not existing_patient.is_active:
        raise HTTPException(status_code=404, detail="No active patient account was found for this mobile number.")

    demo_code = _create_mobile_otp(db, data.mobile, data.purpose)
    response = {
        "status": "sent",
        "message": "A local test code was generated. No SMS was sent." if demo_code else "A verification code was sent to your mobile number.",
        "expires_in_seconds": 300,
        "demo_mode": demo_code is not None,
    }
    if demo_code is not None:
        response["demo_code"] = demo_code
    return response


@router.post("/patient/otp/login", response_model=TokenResponse)
def patient_otp_login(data: PatientOtpLoginRequest, db: Session = Depends(get_db)):
    _consume_mobile_otp(db, data.mobile, "patient_login", data.otp_code)
    user = db.query(User).filter(
        User.mobile == data.mobile,
        User.role == "PATIENT",
        User.is_active == True,
    ).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Mobile verification could not sign you in.")
    if not user.mobile_verified_at:
        user.mobile_verified_at = _utcnow()
        db.commit()
    return _issue_session(db, user)

@router.post("/doctor/register", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
def register_doctor_account(data: DoctorRegistrationRequest, db: Session = Depends(get_db)):
    if not data.accepted_terms:
        raise HTTPException(status_code=400, detail="Confirm the access and privacy notice to continue.")
    claims = verify_google_credential(data.credential) if data.credential else None
    if not claims and (not data.full_name or not data.password):
        raise HTTPException(status_code=400, detail="Enter your name and password or continue with Google.")
    email = str(claims["email"]).strip().lower() if claims else None
    google_sub = str(claims["sub"]) if claims else None
    duplicate = db.query(User).filter(
        (User.mobile == data.mobile)
        | (User.google_sub == google_sub if google_sub else False)
        | (User.email == email if email else False)
    ).first()
    if duplicate:
        raise HTTPException(status_code=409, detail="An account or request already exists for this mobile number.")
    facility = db.query(Facility).filter(Facility.id == data.facility_id, Facility.is_active == True).first()
    department = db.query(Department).filter(Department.id == data.department_id, Department.is_active == True).first()
    if not facility or not department:
        raise HTTPException(status_code=422, detail="Choose a valid active facility and department.")

    user = User(
        mobile=data.mobile,
        email=email,
        google_sub=google_sub,
        full_name=str(claims["name"]).strip()[:100] if claims else data.full_name.strip(),
        role="DOCTOR",
        hashed_password=get_password_hash(data.password or secrets.token_urlsafe(32)),
        is_active=False,
        first_login_done=False,
    )
    try:
        db.add(user)
        db.flush()
        db.add(DoctorProfile(
            user_id=user.id,
            facility_id=facility.id,
            department_id=department.id,
            specialization=data.specialization.strip(),
            qualification=data.qualification.strip(),
            registration_number=data.registration_number.strip(),
            is_active=False,
        ))
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="This mobile number or medical registration number is already in use.")

    return RegistrationResponse(
        status="pending_approval",
        message="Doctor registration received. An administrator must approve your account before you can sign in.",
        mobile=user.mobile,
    )

@router.post("/google/register", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
def register_with_google(data: GoogleRegistrationRequest, db: Session = Depends(get_db)):
    if not data.accepted_terms:
        raise HTTPException(status_code=400, detail="Confirm the access and privacy notice to continue.")

    claims = verify_google_credential(data.credential)
    google_sub = str(claims["sub"])
    email = str(claims["email"]).strip().lower()
    existing = db.query(User).filter(
        (User.mobile == data.mobile)
        | (User.google_sub == google_sub)
        | (User.email == email)
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="An account or request already exists for this mobile number or Google account.")

    user = User(
        mobile=data.mobile,
        email=email,
        google_sub=google_sub,
        full_name=str(claims["name"]).strip()[:100],
        role="ASHA",
        hashed_password=get_password_hash(secrets.token_urlsafe(32)),
        is_active=False,
        first_login_done=False,
    )
    try:
        db.add(user)
        db.flush()
        db.add(UserScope(user_id=user.id, district=data.district, block=data.block))
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="An account or request already exists for this mobile number or Google account.")

    return RegistrationResponse(
        status="pending_approval",
        message="Google registration received. An administrator must approve your account before you can sign in.",
        mobile=user.mobile,
    )

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    return _authenticate(data, db)

@router.post("/patient/login", response_model=TokenResponse)
def patient_login(data: LoginRequest, db: Session = Depends(get_db)):
    return _authenticate(data, db, "PATIENT")

@router.post("/doctor/login", response_model=TokenResponse)
def doctor_login(data: LoginRequest, db: Session = Depends(get_db)):
    return _authenticate(data, db, "DOCTOR")

@router.post("/admin/login", response_model=TokenResponse)
def admin_login(data: LoginRequest, db: Session = Depends(get_db)):
    return _authenticate(data, db, "ADMIN")


@router.get("/admin/settings")
def get_admin_account_settings(current_user: User = Depends(get_current_user)):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Administrator access is required.")
    return {"email": current_user.email, "full_name": current_user.full_name}


@router.patch("/admin/settings")
def update_admin_account_settings(
    data: AdminAccountSettingsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Administrator access is required.")
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    if data.email is None and data.new_password is None:
        raise HTTPException(status_code=400, detail="Provide a new email address or password.")
    if data.email is not None and data.email != current_user.email:
        duplicate = db.query(User.id).filter(User.email == data.email, User.id != current_user.id).first()
        if duplicate:
            raise HTTPException(status_code=409, detail="That email address is already associated with another account.")
        current_user.email = data.email
    if data.new_password is not None:
        current_user.hashed_password = get_password_hash(data.new_password)
    db.add(current_user)
    db.commit()
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        action="UPDATE_ADMIN_ACCOUNT",
        entity_type="user",
        entity_id=current_user.id,
        details="Administrator updated account email or password",
    )
    return {"status": "updated", "email": current_user.email, "full_name": current_user.full_name}

@router.post("/google/login", response_model=TokenResponse)
def login_with_google(data: GoogleLoginRequest, db: Session = Depends(get_db)):
    claims = verify_google_credential(data.credential)
    user = db.query(User).filter(User.google_sub == str(claims["sub"])).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account is linked to this Google account. Register first.")
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is not active yet. An administrator must approve your registration before you can sign in.",
        )
    return _issue_session(db, user, data.device_id, data.device_model)

def _google_login_for_role(data: GoogleLoginRequest, db: Session, expected_role: str) -> TokenResponse:
    claims = verify_google_credential(data.credential)
    user = db.query(User).filter(User.google_sub == str(claims["sub"])).first()
    if not user or user.role != expected_role:
        raise HTTPException(status_code=403, detail=f"No {expected_role.lower()} account is linked to this Google account.")
    if not user.is_active:
        detail = "Your doctor registration is awaiting administrator approval." if expected_role == "DOCTOR" else "Your patient account is inactive. Contact support."
        raise HTTPException(status_code=403, detail=detail)
    if expected_role == "PATIENT" and not user.mobile_verified_at:
        raise HTTPException(status_code=403, detail="Verify your mobile number with an SMS code before signing in.")
    return _issue_session(db, user, data.device_id, data.device_model)

@router.post("/google/patient/login", response_model=TokenResponse)
def patient_google_login(data: GoogleLoginRequest, db: Session = Depends(get_db)):
    return _google_login_for_role(data, db, "PATIENT")

@router.post("/google/doctor/login", response_model=TokenResponse)
def doctor_google_login(data: GoogleLoginRequest, db: Session = Depends(get_db)):
    return _google_login_for_role(data, db, "DOCTOR")

@router.post("/set-pin")
def set_pin(data: PinSetupRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.hashed_pin = get_password_hash(data.pin)
    current_user.first_login_done = True
    db.add(current_user)
    db.commit()

    log_audit_event(db=db, actor_id=current_user.id, action="SET_PIN", entity_type="user", entity_id=current_user.id, details="User PIN configured")
    return {"status": "success", "message": "PIN setup successfully."}

@router.post("/pin-login", response_model=TokenResponse)
def pin_login(data: PinLoginRequest, db: Session = Depends(get_db)):
    # Check device binding
    device = db.query(Device).filter(Device.device_id == data.device_id).first()
    if not device:
        raise HTTPException(status_code=400, detail="Device not registered. Please log in with password.")
    if device.is_revoked:
        raise HTTPException(status_code=403, detail="Device has been revoked.")

    user = device.user
    if not user or not user.is_active or not verify_pin(data.pin, user.hashed_pin):
        raise HTTPException(status_code=401, detail="Invalid PIN.")

    token = create_access_token(subject=user.id, role=user.role)
    scope_data = {}
    if user.scope:
        scope_data = {
            "district": user.scope.district,
            "block": user.scope.block,
            "village": user.scope.village,
            "facility_id": user.scope.facility_id
        }

    return TokenResponse(
        access_token=token,
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
        first_login_done=user.first_login_done,
        scope=scope_data
    )

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    scope_dict = None
    if current_user.scope:
        scope_dict = {
            "district": current_user.scope.district,
            "block": current_user.scope.block,
            "village": current_user.scope.village,
            "facility_id": current_user.scope.facility_id
        }
    return UserOut(
        id=current_user.id,
        employee_id=current_user.employee_id,
        mobile=current_user.mobile,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        first_login_done=current_user.first_login_done,
        created_at=current_user.created_at,
        scope=scope_dict
    )
