# ArogyaSaathi (आरोग्यसाथी) — Release 2.1
### AI-Assisted Rural Healthcare Coordination & Public Health Intelligence Platform
**Tagline:** *“Health for Every Home | हर घर तक स्वास्थ्य”*

[![Platform](https://img.shields.io/badge/platform-Android%20%7C%20Web%20Admin-064E3B.svg)](#)
[![Stack](https://img.shields.io/badge/mobile-Capacitor%20%7C%20React%20%7C%20TypeScript-0B6E4F.svg)](#)
[![Backend](https://img.shields.io/badge/backend-FastAPI%20%7C%20Python%203.12-167D62.svg)](#)
[![Database](https://img.shields.io/badge/database-SQLite%20(WAL)%20%7C%20PostgreSQL-0284C7.svg)](#)
[![Clinical Safety](https://img.shields.io/badge/clinical%20safety-deterministic%20rules-DC2626.svg)](#)

---

## 1. Overview & Purpose (PRD v2.1)

ArogyaSaathi is an **Android-first rural healthcare coordination system** designed for frontline healthcare workers (ASHA, ANM), Medical Officers (Doctors), PHC Facility Staff, and Public Health Officers (PHOs).

### Core Boundaries & Safety Rules
1. **Clinical Safety Boundary**: The opt-in AI assistant provides general health information, conversational symptom intake, and non-diagnostic image observations. It **never** diagnoses, prescribes medication, or determines clinical urgency.
2. **AI Data Consent**: Chat messages and selected images are sent to the configured OpenAI service only after explicit user consent. The API key stays server-side; users are warned not to submit identifying patient information.
3. **Deterministic Governance**: All triage urgencies and red-flag escalations are determined by clinician-approved versioned deterministic rules (`IN_RURAL_ACUTE_CARE_V2.1`).
4. **MediSlot Concurrency Protection**: High-concurrency slot booking protected by partial unique indexing `uq_active_appointment_slot`, ensuring zero double bookings under race conditions with automatic alternative suggestions (`HTTP 409 Conflict`).
5. **Offline-First Resilience**: All registrations, observations, and referrals are saved immediately to local encrypted SQLite storage and synchronized via an outbox priority queue (`CRITICAL` -> `HIGH` -> `ROUTINE`).
6. **No Synthetic Pass-Through**: Test datasets and demo personas are explicitly labelled and isolated.

---

## 2. Monorepo Architecture

```
arogyasaathi/
├── apps/
│   ├── mobile/             # [PRIMARY] ArogyaSaathi Android Native & Hybrid App
│   │   ├── android/        # Native Android Studio Project (Gradle, Manifest, Java)
│   │   └── src/            # Role Dashboards, Voice Triage, Registry, Referrals, Sync
│   ├── admin/              # [DESKTOP] Web Admin Console (Health Radar, Audits, Users)
│   ├── patient/            # [P2 PREVIEW] Patient & Family Portal (Appointments, Consent)
│   └── web/                # [SIMULATOR] Interactive Multi-Interface Developer Portal
├── backend/                # FastAPI Monolith, SQLAlchemy, Safety Engine, Alembic
│   ├── app/                # API v1, Core Config, Models, Safety Rules, Services, Tests
│   └── arogyasaathi.db     # Populated SQLite Database in WAL mode
├── database/               # Canonical DDL Schemas, Alembic Migrations, SQL Seeds
├── shared/                 # Signed Protocol Bundles, Golden Test Vectors, Shared Types
├── scripts/                # Automated PowerShell Run & Build Scripts
└── docs/                   # Implementation Reports & PRD v2.1 Architecture Specs
```

---

## 3. Quick Start & Execution Guide

### Prerequisite Environment
- Python 3.12+
- Node.js v18+ / v20+ / v24+
- PowerShell (Windows)

### Step 1: Start Backend API Server
```powershell
.\scripts\run_backend.ps1
# Or manually:
cd backend
$env:PYTHONPATH="C:\Users\kishw\.gemini\antigravity\scratch\arogyasaathi\backend"
python -m alembic upgrade head
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- Database schema changes are applied through Alembic before the API starts; the server does not silently create or alter tables at runtime.
- Interactive Swagger Docs: `http://127.0.0.1:8000/api/v1/docs`
- Health Probe: `http://127.0.0.1:8000/health`

### Step 2: Start Interactive Simulator & Multi-Role Web App
```powershell
.\scripts\run_simulator.ps1
# Or manually:
cd apps/web
npm run dev
```
- Open the public website at `http://localhost:3000`; open `/workspace` for the interactive **Android Mobile App**, **Web Admin Console**, and **Patient Portal** preview.
- The workspace contains illustrative sample records. Use `/login` to sign in against the configured backend API.
- Switch personas seamlessly: **ASHA** (Sunita Devi), **ANM** (Priya Sharma), **Doctor** (Dr. Arjun Mehta), **PHC Staff** (Rahul Singh), **PHO** (Dr. Neha Verma).

### Step 3: Start the Admin Console
```powershell
cd apps/admin
npm install
$env:NEXT_PUBLIC_API_URL = "http://127.0.0.1:8000/api/v1"
npm run dev -- --port 3001
```
- Open `http://localhost:3001` and sign in with an authorized administrator account.
- The console reads and updates the existing backend database through role-protected API endpoints. Start the backend first.
- The dashboard includes live operational modules for users, patients and consent, frontline workers, doctors/OPD, facilities and village coverage, referrals, appointments, surveillance, follow-up tasks, devices, audit, safety protocols, and administrator settings.

### Step 4: Run Automated Verification Tests
```powershell
.\scripts\run_tests.ps1
# Or manually:
cd backend
$env:PYTHONPATH="C:\Users\kishw\.gemini\antigravity\scratch\arogyasaathi\backend"
python -m pytest app/tests/test_suite.py -v
```
The backend test suite verifies authentication/RBAC, scope controls, clinical safety, referrals, concurrent bookings, and synchronization:
1. Auth Login
2. Invalid Credentials Handling
3. PIN Login
4. RBAC Denied for ASHA on Admin API
5. RBAC Allowed for System Admin
6. Golden Vectors Reproducibility (GV-001 to GV-005)
7. Voice Triage Ingestion API
8. Closed-Loop Referral Lifecycle
9. MediSlot 50-Parallel Concurrent Booking Race Condition Protection
10. Offline Priority Outbox Push & Cursor Pull

---

## 4. Default Demonstration Personas

| Role | Identifier | Default Password | Location Scope |
| :--- | :--- | :--- | :--- |
| **ASHA Worker** | `9876543210` / `ASHA-001` | `Asha@123` | Rampur Village, Sitapur |
| **ANM / Nurse** | `9876543211` / `ANM-001` | `Anm@123` | PHC Sitapur Sub-Centre |
| **Doctor / MO** | `9876543212` / `DOC-001` | `Doc@123` | PHC Sitapur (General Medicine) |
| **PHC Staff** | `9876543213` / `STAFF-001` | `Staff@123` | PHC Sitapur Facility Desk |
| **Public Health Officer** | `9876543214` / `PHO-001` | `Pho@123` | Sitapur District Health Office |
| **System Admin** | `9876543215` / `ADMIN-001` | `Admin@123` | System-wide Administrative Scope |

---

## 5. Security & DPDP Compliance
- **Cryptographic Audit Trail**: All clinical evaluations and referrals are recorded in `audit_events` with SHA-256 hash chaining.
- **Hardware Binding**: Frontline accounts are tied to hardware identifiers with PIN and Biometric unlock.
- **Data Minimization**: Push notifications carry strictly non-PHI payloads.
