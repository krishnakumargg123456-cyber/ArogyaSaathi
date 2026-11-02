-- ArogyaSaathi Relational Database Schema
-- Version 2.1 (Mobile App + MediSlot Appointment Module)

-- 1. Facilities
CREATE TABLE IF NOT EXISTS facilities (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'PHC',
    district VARCHAR(60) NOT NULL,
    block VARCHAR(60) NOT NULL,
    address VARCHAR(255),
    phone VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Villages
CREATE TABLE IF NOT EXISTS villages (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    block VARCHAR(60) NOT NULL,
    district VARCHAR(60) NOT NULL,
    population INTEGER DEFAULT 1500,
    assigned_facility_id VARCHAR(36) REFERENCES facilities(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Users
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE,
    mobile VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    google_sub VARCHAR(255) UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    hashed_pin VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    first_login_done BOOLEAN NOT NULL DEFAULT FALSE,
    mobile_verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mobile_otp_challenges (
    id VARCHAR(36) PRIMARY KEY,
    mobile VARCHAR(20) NOT NULL,
    purpose VARCHAR(30) NOT NULL,
    code_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    consumed_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_mobile_otp_challenges_mobile
    ON mobile_otp_challenges (mobile);

-- 4. User Scopes
CREATE TABLE IF NOT EXISTS user_scopes (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    district VARCHAR(60),
    block VARCHAR(60),
    village VARCHAR(100),
    facility_id VARCHAR(36) REFERENCES facilities(id)
);

-- 5. Devices (Binding & Revocation)
CREATE TABLE IF NOT EXISTS devices (
    id VARCHAR(36) PRIMARY KEY,
    device_id VARCHAR(100) UNIQUE NOT NULL,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_model VARCHAR(100),
    os_version VARCHAR(50),
    app_version VARCHAR(30),
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Patients
CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE REFERENCES users(id),
    internal_id VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    age INTEGER NOT NULL,
    gender VARCHAR(10) NOT NULL,
    phone VARCHAR(20),
    village_id VARCHAR(36) REFERENCES villages(id),
    address VARCHAR(255),
    emergency_contact VARCHAR(100),
    chronic_conditions VARCHAR(255),
    created_by_id VARCHAR(36) REFERENCES users(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Consents
CREATE TABLE IF NOT EXISTS consents (
    id VARCHAR(36) PRIMARY KEY,
    patient_id VARCHAR(36) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    purpose VARCHAR(100) NOT NULL,
    scope VARCHAR(100) NOT NULL,
    text_version VARCHAR(30) NOT NULL DEFAULT 'v2.1',
    language VARCHAR(10) NOT NULL DEFAULT 'hi',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    capture_method VARCHAR(30) NOT NULL DEFAULT 'TICK_ACK',
    captured_by_id VARCHAR(36) NOT NULL REFERENCES users(id),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    withdrawn_at TIMESTAMP
);

-- 8. Encounters & Observations
CREATE TABLE IF NOT EXISTS encounters (
    id VARCHAR(36) PRIMARY KEY,
    client_uuid VARCHAR(100) UNIQUE NOT NULL,
    patient_id VARCHAR(36) NOT NULL REFERENCES patients(id),
    actor_id VARCHAR(36) NOT NULL REFERENCES users(id),
    facility_id VARCHAR(36) REFERENCES facilities(id),
    source VARCHAR(20) NOT NULL DEFAULT 'VOICE',
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    encounter_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS observations (
    id VARCHAR(36) PRIMARY KEY,
    encounter_id VARCHAR(36) REFERENCES encounters(id) ON DELETE CASCADE,
    patient_id VARCHAR(36) NOT NULL REFERENCES patients(id),
    observation_type VARCHAR(30) NOT NULL,
    systolic_bp INTEGER,
    diastolic_bp INTEGER,
    blood_glucose FLOAT,
    glucose_context VARCHAR(30),
    temperature FLOAT,
    spo2 FLOAT,
    recorded_by_id VARCHAR(36) NOT NULL REFERENCES users(id),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Referrals & Closed Loop Events
CREATE TABLE IF NOT EXISTS referrals (
    id VARCHAR(36) PRIMARY KEY,
    referral_code VARCHAR(30) UNIQUE NOT NULL,
    patient_id VARCHAR(36) NOT NULL REFERENCES patients(id),
    encounter_id VARCHAR(36) REFERENCES encounters(id),
    referring_user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    receiving_facility_id VARCHAR(36) NOT NULL REFERENCES facilities(id),
    urgency VARCHAR(20) NOT NULL DEFAULT 'ROUTINE',
    reason VARCHAR(255) NOT NULL,
    history_packet TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    rejection_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Doctor Profiles & Slots (MediSlot Integration)
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(30) UNIQUE NOT NULL,
    description VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS doctor_profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL REFERENCES users(id),
    facility_id VARCHAR(36) NOT NULL REFERENCES facilities(id),
    department_id VARCHAR(36) NOT NULL REFERENCES departments(id),
    specialization VARCHAR(100) NOT NULL,
    qualification VARCHAR(100) NOT NULL,
    registration_number VARCHAR(80) UNIQUE,
    experience_years INTEGER DEFAULT 5,
    opd_days VARCHAR(100) DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat',
    opd_timings VARCHAR(50) DEFAULT '09:00 AM - 02:00 PM',
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS doctor_slots (
    id VARCHAR(36) PRIMARY KEY,
    doctor_id VARCHAR(36) NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
    slot_date VARCHAR(20) NOT NULL,
    start_time VARCHAR(20) NOT NULL,
    end_time VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    CONSTRAINT uq_doctor_slot_time UNIQUE (doctor_id, slot_date, start_time)
);

-- 11. Appointments
CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(36) PRIMARY KEY,
    booking_ref VARCHAR(30) UNIQUE NOT NULL,
    client_uuid VARCHAR(100) UNIQUE NOT NULL,
    patient_id VARCHAR(36) NOT NULL REFERENCES patients(id),
    doctor_id VARCHAR(36) NOT NULL REFERENCES doctor_profiles(id),
    facility_id VARCHAR(36) NOT NULL REFERENCES facilities(id),
    slot_id VARCHAR(36) NOT NULL REFERENCES doctor_slots(id),
    referral_id VARCHAR(36) REFERENCES referrals(id),
    reason_code VARCHAR(100) NOT NULL DEFAULT 'General OPD',
    notes TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED',
    booked_by_id VARCHAR(36) NOT NULL REFERENCES users(id),
    cancellation_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PRD Section 14.5 Partial Unique Index on Active Appointments
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_appointment_slot 
ON appointments(slot_id) 
WHERE status IN ('CONFIRMED', 'PENDING');

-- 12. Surveillance & Audit
CREATE TABLE IF NOT EXISTS candidate_alerts (
    id VARCHAR(36) PRIMARY KEY,
    alert_code VARCHAR(30) UNIQUE NOT NULL,
    title VARCHAR(150) NOT NULL,
    disease_category VARCHAR(50) NOT NULL,
    district VARCHAR(60) NOT NULL,
    block VARCHAR(60) NOT NULL,
    village_id VARCHAR(36) REFERENCES villages(id),
    severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(30) NOT NULL DEFAULT 'NEW',
    case_count INTEGER DEFAULT 1,
    supporting_data TEXT,
    data_quality VARCHAR(30) DEFAULT 'Good',
    review_notes TEXT,
    reviewed_by_id VARCHAR(36) REFERENCES users(id),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_events (
    id VARCHAR(36) PRIMARY KEY,
    actor_id VARCHAR(36),
    action VARCHAR(60) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(36),
    details TEXT,
    ip_address VARCHAR(45),
    device_id VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hash_signature VARCHAR(128)
);
