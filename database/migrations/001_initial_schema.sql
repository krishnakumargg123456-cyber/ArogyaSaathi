-- Migration 001: Initial Schema Definition
-- Creates users, facilities, patients, encounters, referrals, appointments

CREATE TABLE IF NOT EXISTS facilities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    facility_code TEXT UNIQUE NOT NULL,
    facility_type TEXT NOT NULL,
    district TEXT NOT NULL,
    block TEXT NOT NULL,
    address TEXT,
    contact_phone TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    employee_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    pin_hash TEXT,
    is_active INTEGER DEFAULT 1,
    first_login_done INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

