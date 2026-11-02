# ArogyaSaathi — Architectural Decisions & Open Questions
**Document ID:** DOC-DEC-001  
**Status:** Living Governance Document  

---

## 1. Architectural Decision Records (ADRs)

### ADR-01: Modular Monolith vs. Microservices Architecture
- **Decision:** Build ArogyaSaathi as a modular monolith (Next.js frontend + FastAPI backend) sharing a single PostgreSQL relational database with Redis queues.
- **Context:** Rural deployment pilots will initially serve single districts (50 to 500 healthcare workers). Distributed microservices introduce significant operational complexity, distributed transaction failure modes, and increased hosting overhead without performance justification.
- **Status:** **Accepted**.

### ADR-02: Strict Isolation of Deterministic Clinical Safety from Generative AI
- **Decision:** Generative AI / Large Language Models are strictly prohibited from evaluating patient triage severity, deciding red-flag escalations, or generating medication prescriptions.
- **Context:** Hallucinations or probabilistic shifts in clinical safety are intolerable in remote primary care settings. Triage rules must be deterministic, auditable, versioned, and signed off by qualified medical practitioners.
- **Status:** **Accepted**.

### ADR-03: Honest Presentation of Public Metrics & Capabilities
- **Decision:** All metrics displayed on the public website are explicitly labelled as "Deployment Target Goals" or "Initial Release Goals" rather than fabricated live achievements. Features not implemented in the current release are explicitly labelled as "Planned" or "Under Development".
- **Context:** Healthcare platforms require absolute trust and scientific honesty. Fabricated patient counts or testimonials violate ethical standards and PRD v1.1 mandates.
- **Status:** **Accepted**.

---

## 2. Open Governance Questions Requiring Stakeholder Resolution

| Question ID | Domain | Description | Decision Owner | Current Status |
| :--- | :--- | :--- | :--- | :--- |
| **Q-01** | Clinical Governance | Which medical board or institutional body will review and approve the versioned deterministic red-flag protocols for maternal and pediatric care? | Chief Medical Officer / Clinical Lead | **Open** — Awaiting clinical committee nomination |
| **Q-02** | Speech AI Selection | Which Speech-to-Text provider (e.g. Bhashini, Whisper Fine-Tuned, Google Cloud Speech) satisfies the latency, local dialect accuracy (Bhojpuri/Maithili/Awadhi), and data residency requirements for Phase 4? | Technical Lead & Privacy Officer | **Open** — Evaluation lab benchmarks required |
| **Q-03** | Legal & DPDP Act | What is the legally approved consent notice language for illiterate or semi-literate rural patients (audio consent vs. thumbprint vs. OTP)? | Legal Counsel | **Open** — Draft audio consent protocol prepared |
| **Q-04** | Pilot Geography | Which specific district and block will host the supervised non-clinical synthetic dry-run during Phase 5? | Product Sponsor / Government Liaison | **Open** — Sitapur District under consideration |

