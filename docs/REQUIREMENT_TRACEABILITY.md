# ArogyaSaathi — Requirement Traceability Matrix
**Document ID:** DOC-REQ-001  
**Baseline:** PRD v1.1 Development-Ready Draft  
**Status:** Phase 1 & 2 Completed Verification  

---

## 1. Traceability Table

| PRD Section / ID | Requirement Description | Implementation Location | Verification Evidence | Current Status |
| :--- | :--- | :--- | :--- | :--- |
| **WEB-01** | Header navigation (Home, Features, How It Works, About, Resources, Contact, Language Selector, Login, Sign Up) | `apps/web/src/components/navigation/SiteHeader.tsx` | Visual check, responsive mobile menu, keyboard navigation | **Implemented** |
| **WEB-02** | Memorable hero section with product purpose, CTAs, and trust chips | `apps/web/src/components/marketing/HeroSection.tsx` | Visual check, responsive layout, clear CTAs | **Implemented** |
| **WEB-03** | Product visuals showing health worker workflows and interface previews | `apps/web/src/components/marketing/ProductPreview.tsx` | Interactive tabbed preview with synthetic data labels | **Implemented** |
| **WEB-04** | Nine core feature cards with honest availability status | `apps/web/src/components/marketing/FeatureGrid.tsx` | Navigation to `/features` sections, status badges | **Implemented** |
| **WEB-05** | Honest impact band with explicit target labels | `apps/web/src/components/marketing/ImpactBand.tsx` | Explicit target markers (Target Impact, Deployment Goals) | **Implemented** |
| **WEB-06** | 5-step workflow (Register, Capture, Safety Check, Action, Monitor) | `apps/web/src/components/marketing/WorkflowSteps.tsx` | Interactive step navigator with deterministic safety callouts | **Implemented** |
| **WEB-07** | Footer with sitemap, draft policies, language selector, copyright | `apps/web/src/components/navigation/SiteFooter.tsx` | All links resolve cleanly to valid routes or clear notices | **Implemented** |
| **WEB-08** | Dedicated Features page with in-depth module breakdowns | `apps/web/src/app/(public)/features/page.tsx` | Category filters, detailed user roles, status badges | **Implemented** |
| **WEB-09** | Language selector supporting evaluated languages (English & Hindi) | `apps/web/src/context/LanguageContext.tsx` | Functional bilingual toggle across header, footer, hero | **Implemented** |
| **WEB-10** | Responsive, accessible, mobile-first design | All web components | Responsive test matrix (360px, 768px, 1024px, 1440px) | **Implemented** |
| **PAGE-HIW** | Dedicated How It Works page with detailed handoffs | `apps/web/src/app/(public)/how-it-works/page.tsx` | Role perspectives, triage handoff diagram, audit trails | **Implemented** |
| **PAGE-ABT** | Dedicated About page with problem statement & AI principles | `apps/web/src/app/(public)/about/page.tsx` | Rural challenge narrative, responsible AI charter | **Implemented** |
| **PAGE-RES** | Dedicated Resources page with guides & FAQ accordions | `apps/web/src/app/(public)/resources/page.tsx` | Accessible FAQ accordion toggles, pilot guides outline | **Implemented** |
| **PAGE-CNT** | Dedicated Contact page with accessible form validation | `apps/web/src/app/(public)/contact/page.tsx` | Accessible form fields, development preview notice | **Implemented** |
| **PAGE-LOG** | Login page with role-selection & controlled access notice | `apps/web/src/app/(auth)/login/page.tsx` | Accessible inputs, password visibility toggle, preview banner | **Implemented** |
| **PAGE-REQ** | Request Access onboarding page for health authorities | `apps/web/src/app/(auth)/request-access/page.tsx` | Form validation, role & jurisdiction inputs, preview notice | **Implemented** |
| **ARCH-01** | Scaffolding for future FastAPI backend & deterministic engine | `backend/app/`, `backend/app/safety/rules.py` | Python module structure & core configuration files | **Implemented** |

