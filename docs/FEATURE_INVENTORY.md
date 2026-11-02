# ArogyaSaathi — Feature Inventory & Traceability Matrix
**Document ID:** DOC-FEAT-001  
**Product:** ArogyaSaathi Platform  
**Version:** 1.1 Development Baseline  
**Status:** Phase 1 & 2 Approved Scope  

---

## 1. Public Website & Foundation Features (Phase 1 & 2 Active)

| Requirement ID | Module / Feature Name | Priority | Current Implementation Location | Current Status | Description & Guardrails |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **WEB-01** | Header Navigation & Language Selector | P0 | `apps/web/src/components/navigation/SiteHeader.tsx` | **Implemented** | Responsive navigation with Home, Features, How It Works, About, Resources, Contact, Login, Request Access; English/Hindi toggle. |
| **WEB-02** | Master Hero Section & Value Prop | P0 | `apps/web/src/components/marketing/HeroSection.tsx` | **Implemented** | Tagline "Har Gaon, Har Ghar, Swasth Bharat", clear CTAs, trust chips; no unsubstantiated claims. |
| **WEB-03** | Product Preview & Visual Showcase | P1 | `apps/web/src/components/marketing/ProductPreview.tsx` | **Implemented** | Interactive preview of ASHA field screen, doctor referral packet, and village health overview. Labelled as illustrative. |
| **WEB-04** | Nine Core Feature Cards | P0 | `apps/web/src/components/marketing/FeatureGrid.tsx` | **Implemented** | Nine feature cards linking to `/features` detail sections; planned features clearly labelled. |
| **WEB-05** | Honest Impact & Ecosystem Targets | P0 | `apps/web/src/components/marketing/ImpactBand.tsx` | **Implemented** | Explicitly labelled target goals (10k+ workers, 2.5k+ facilities, 15k+ villages, 1 Cr+ target impact). No fake counters. |
| **WEB-06** | 5-Step How It Works Sequence | P0 | `apps/web/src/components/marketing/WorkflowSteps.tsx` | **Implemented** | Register -> Capture -> Safety Check -> Action -> Monitor. Highlights deterministic rule engine and human review checkpoints. |
| **WEB-07** | Trust & Product Principles Section | P0 | `apps/web/src/components/marketing/TrustPrinciples.tsx` | **Implemented** | Highlights safety before automation, privacy by design, scoped access, and auditable care trails. |
| **WEB-08** | Roles & Audience Matrix | P0 | `apps/web/src/components/marketing/AudienceSection.tsx` | **Implemented** | Clear breakdown of ASHA, ANM, Doctor, PHC staff, and Public Health Officer roles and data boundaries. |
| **WEB-09** | Privacy & Safety Guardrails | P0 | `apps/web/src/components/marketing/SafetySection.tsx` | **Implemented** | Explains absence of autonomous diagnosis/prescription, DPDP Act alignment, and clinician oversight. |
| **WEB-10** | Global Footer & Resource Links | P0 | `apps/web/src/components/navigation/SiteFooter.tsx` | **Implemented** | Wordmark, sitemap links, draft policy links, language selector, copyright. |
| **PAGE-FEAT** | Dedicated Features Page | P0 | `apps/web/src/app/(public)/features/page.tsx` | **Implemented** | Deep-dive into all 9 modules with category filters, intended user roles, and current implementation statuses. |
| **PAGE-HIW** | Dedicated How It Works Page | P0 | `apps/web/src/app/(public)/how-it-works/page.tsx` | **Implemented** | Detailed breakdown of care handoff, triage escalation, facility acknowledgement, and follow-up loops. |
| **PAGE-ABT** | Dedicated About Page | P0 | `apps/web/src/app/(public)/about/page.tsx` | **Implemented** | Mission, rural problem statement, responsible AI principles, and supervised pilot methodology. |
| **PAGE-RES** | Dedicated Resources Page | P0 | `apps/web/src/app/(public)/resources/page.tsx` | **Implemented** | Guides structure, clinical FAQs, technical documentation outlines; no fake download links. |
| **PAGE-CNT** | Dedicated Contact Page | P0 | `apps/web/src/app/(public)/contact/page.tsx` | **Implemented** | Accessible form with field validation; non-submitting development preview banner. |
| **PAGE-LOG** | Login Entry Point | P0 | `apps/web/src/app/(auth)/login/page.tsx` | **Implemented** | Role-selectable authentication portal with show/hide password, field validation, and development notices. |
| **PAGE-REQ** | Request Access Entry Point | P0 | `apps/web/src/app/(auth)/request-access/page.tsx` | **Implemented** | Structured onboarding request form for health authorities and NGOs. |
| **PAGE-SAATHI** | Sehat Saathi AI Chat | P1 | `apps/web/src/app/saathi/page.tsx`, `backend/app/api/v1/saathi.py` | **Provider configuration required** | Authenticated Hindi/English OpenAI chat with streamed answers, image input, and AI-generated spoken replies. API key remains server-side; explicit consent is required before sending messages/images to OpenAI. General health information only; not a diagnosis or prescription service. |

---

## 2. Core Healthcare Operations Modules (Phase 3+; implementation status varies)

| Module Code | Module Name | PRD Priority | Target Implementation Path | Target Release | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AUTH** | Authentication, RBAC & Scopes | P0 | `backend/app/api/v1/auth.py`, `apps/web/src/features/auth` | Release 1 (Phase 3) | Planned / Scaffolding ready |
| **PAT** | Patient Registry & Digital Consent | P0 | `backend/app/api/v1/patients.py`, `apps/web/src/features/patients` | Release 1 (Phase 3) | Planned / Scaffolding ready |
| **ENC** | Clinical Encounters | P0 | `backend/app/api/v1/encounters.py`, `apps/web/src/features/encounters` | Release 1 (Phase 3) | Planned / Scaffolding ready |
| **VT** | Voice Triage & Deterministic Engine | P0 | `backend/app/safety/rules.py`, `apps/web/src/features/voice-triage` | Release 1 (Phase 3-4) | Planned / Scaffolding ready |
| **CC** | Chronic Care (BP / Blood Glucose) | P0 | `backend/app/api/v1/chronic_care.py`, `apps/web/src/features/chronic-care` | Release 1 (Phase 4) | Planned / Scaffolding ready |
| **REF** | Closed-Loop Referral Management | P0 | `backend/app/api/v1/referrals.py`, `apps/web/src/features/referrals` | Release 1 (Phase 3) | Planned / Scaffolding ready |
| **RAD** | Health Radar & Village Surveillance | P1 | `backend/app/api/v1/surveillance.py`, `apps/web/src/features/health-radar` | Release 2 (Phase 5) | Planned / Scaffolding ready |
| **REP** | Operational Reports & Analytics | P1 | `backend/app/api/v1/reports.py`, `apps/web/src/features/reports` | Release 2 (Phase 5) | Planned / Scaffolding ready |
| **NOTIF**| Notifications & Follow-up Tasks | P1 | `backend/app/api/v1/notifications.py`, `apps/web/src/features/notifications`| Release 2 (Phase 4) | Planned / Scaffolding ready |
| **ADM** | Administration, Protocols & Audit | P0 | `backend/app/api/v1/admin.py`, `apps/admin/src` | Release 1 (Phase 3) | **Admin console implemented** — live overview, user/role access, patient consent summary, workers, doctors/OPD, facilities/villages, referrals, appointments, health radar review, follow-up tasks, devices, audit, protocol status, account settings. Reuses existing database tables; no new migration required. |
| **LANG**| Multilingual Localization Engine | P1 | `apps/web/src/config/i18n.ts`, `apps/web/src/lib/i18n` | Phase 2 (En/Hi) / P2 (Regional) | **Active (En/Hi)** |
