# ArogyaSaathi API Contracts

**Document ID:** DOC-API-001  
**Base URL:** `/api/v1`  
**Status:** Live route map; the roadmap section below is explicitly not implemented.

The running FastAPI OpenAPI document at `/api/v1/docs` is authoritative. Routes not listed as live here must not be assumed to exist. Authenticated requests use a bearer token. Role permissions and health-worker geography are enforced by the API; errors use FastAPI's standard JSON `detail` response, not RFC 7807.

## 1. Live API

### Health and documentation

- `GET /health` — checks database connectivity.
- `GET /api/v1/status` — reports API status.
- `GET /api/v1/docs` — interactive OpenAPI documentation.

### Authentication (`/api/v1/auth`)

- `POST /register`, `/google/register` — create a health-worker account pending administrator approval.
- `POST /patient/register` — create an active patient account and linked patient profile after OTP verification and consent.
- `POST /doctor/register` — submit a doctor account for administrator approval.
- `POST /login`, `/patient/login`, `/doctor/login`, `/admin/login` — role-specific password login.
- `POST /patient/otp/start`, `/patient/otp/login` — start patient OTP verification and log in with the code.
- `POST /google/login`, `/google/patient/login`, `/google/doctor/login` — Google sign-in for the corresponding account type.
- `GET /me` — return the authenticated user.
- `GET/PATCH /admin/settings` — read/update the authenticated administrator's settings.
- `POST /set-pin`, `/pin-login` — configure a PIN and authenticate with it.

There is no logout/revocation endpoint for bearer tokens. Admin accounts cannot self-register. Patient APIs do not grant access to staff-only clinical records.

### Patient registry and consent

- `GET /patients/villages`, `GET /patients` — list assigned villages and search/paginate in-scope patients.
- `POST /patients` — create a patient with consent.
- `GET /patients/{patient_id}` — retrieve an in-scope patient profile; phone reveal requires active consent and is audited.
- `POST /patients/{patient_id}/consent/revoke` — withdraw consent for the patient or an authorized in-scope worker.

Patient phone numbers are masked by default. Patient registration by a patient account is through `/auth/patient/register`, not this worker registry route.

### Triage (`/api/v1/triage`)

- `POST /evaluate` — evaluate submitted symptoms/vitals using deterministic safety rules.
- `GET /protocols/current` — return the active protocol bundle and test vectors.
- `POST /voice/simulate` — returns `501` while speech transcription is unconfigured; use manual symptom entry.

Triage is assistive and does not provide autonomous diagnosis or treatment.

### Referrals (`/api/v1/referrals`)

- `GET /`, `GET /{referral_id}` — list in-scope or facility referrals and retrieve an authorized referral.
- `POST /` — create a referral for an in-scope patient with active consent.
- `PATCH /{referral_id}/transition` — apply an allowed referral workflow transition.

### Appointments and directory

- `GET /departments`, `/facilities`, `/doctors`, `/doctors/{doctor_id}/slots`
- `POST /appointments`, `GET /appointments`
- `PATCH /appointments/{appointment_id}/cancel`
- `PATCH /appointments/{appointment_id}/status`
- `GET /doctor/queue` — the authenticated doctor's own appointments for the current day, with urgent referrals first.

Booking validates patient scope/ownership, active consent, doctor/facility/slot consistency, and active-slot uniqueness.

### Tasks, notifications, and public-health review

- `GET /tasks`, `PATCH /tasks/{task_id}/complete` — assigned tasks only; repeat completion is rejected.
- `GET /notifications` — notifications for the authenticated user.
- `GET /surveillance/alerts`, `PATCH /surveillance/alerts/{alert_id}/review` — scoped candidate alerts and authorized human review; these do not declare an outbreak.

### Administration (`/api/v1/admin`)

- `GET /overview` — database-derived operational KPIs (ADMIN and PUBLIC_HEALTH_OFFICER).
- `GET/POST /users`, `PATCH /users/{user_id}/status` — ADMIN-only user management and doctor approval/status.
- `GET /devices`, `POST /devices/{device_id}/revoke` — ADMIN-only device management.
- `GET /audit-logs` — ADMIN-only audit log access.

### Offline sync (`/api/v1/sync`)

- `POST /push` — requires a registered, non-revoked device belonging to the caller. Currently supports create operations for referrals, appointments, and encounters; unsupported operations are explicitly rejected.
- `GET /pull` — cursor-based pull of scoped data.

Sync is not yet a complete offline protocol: it has no general update/delete support or client paging token for batches exceeding the endpoint's limits. Clients must not treat a rejected operation as successful.

## 2. External service configuration

Configure a private random `SECRET_KEY` and Exotel credentials on the backend only: `EXOTEL_ACCOUNT_SID`, `EXOTEL_API_KEY`, `EXOTEL_API_TOKEN`, `EXOTEL_SMS_FROM`, and optionally `EXOTEL_API_BASE_URL` (Mumbai default: `https://api.in.exotel.com`). For Indian numbers, configure the registered `EXOTEL_DLT_ENTITY_ID` and `EXOTEL_DLT_TEMPLATE_ID`. Set `EXOTEL_OTP_SMS_TEMPLATE` to the registered template using `{otp}` as its six-digit placeholder. Store credentials in an ignored backend environment file or deployment secret store; never expose them to the web app.

OTP codes expire after five minutes, are stored as keyed hashes, allow at most five guesses, and are limited to one send per minute and five sends per hour per mobile/purpose. Missing provider configuration is an error; the API does not claim that SMS was sent.

For local UI testing only, set `APP_ENV=development` and `DEMO_OTP_MODE=true` while leaving Exotel credentials empty. The endpoint returns a demo code and sends no SMS. Demo mode is disabled by default and must never be enabled in production.

Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in the web app and `GOOGLE_OAUTH_CLIENT_ID` on the backend to the same OAuth client. Google identity does not replace OTP verification for patient registration.

## 3. Database deployment

Apply database changes with `python -m alembic upgrade head` from the backend directory before deploying. The backend launcher applies migrations before starting the API.

## 4. Planned, not implemented

The following items from the earlier target contract are not live endpoints: `/auth/logout`; `/encounters` CRUD and override routes; aggregated `/surveillance/signals`; and a complete paginated offline-sync protocol. Clinical encounters can currently be created through the supported sync push operation, and triage evaluation is exposed at `/triage/evaluate`. Do not build clients against the unimplemented paths until they appear in the live OpenAPI document.
