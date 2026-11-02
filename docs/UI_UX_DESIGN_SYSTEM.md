# ArogyaSaathi — UI/UX Design System Specification
**Document ID:** DOC-DS-001  
**Product:** ArogyaSaathi  
**Design Philosophy:** "Human-Centred Healthcare for Rural Resilience"  
**Status:** Approved Specification  

---

## 1. Visual Brand Identity & Color Tokens

The visual identity is deliberately tuned for the Indian rural healthcare context: professional, serene, trustworthy, and high-clarity. It balances clinical authority with grassroots warmth.

### Primary Healthcare Green Palette
- **Primary Brand 900:** `#062E23` — Dark forest green for extreme contrast headers, hero accents, and brand badges.
- **Primary Brand 800:** `#0A4333` — Authoritative brand primary for main navigation, primary buttons, and active states.
- **Primary Brand 700:** `#0F5B47` — Standard brand primary for card borders, icons, and interactive elements.
- **Primary Brand 600:** `#167D62` — Hover states and supportive accents.
- **Primary Brand 500:** `#1F9E7D` — Secondary accents and interactive highlights.
- **Mint Surface 100:** `#E8F5F0` — Subtle background tint for cards, input focuses, and feature highlights.
- **Mint Surface 50:** `#F4FBF8` — Page background supporting neutral white.

### Functional & Semantic Colors
- **Alert / Red Flag (Urgent):**
  - Light: `#FEF2F2` (bg), `#DC2626` (border/text), `#991B1B` (dark text)
  - Meaning: Critical red-flag symptom detected, urgent emergency referral, severe BP breach (>180/120 mmHg).
- **Warning / Attention (Medium):**
  - Light: `#FFFBEB` (bg), `#D97706` (border/text), `#92400E` (dark text)
  - Meaning: Follow-up overdue, pending facility acknowledgement, intermediate risk cluster.
- **Success / Active (Routine/Safe):**
  - Light: `#F0FDF4` (bg), `#16A34A` (border/text), `#166534` (dark text)
  - Meaning: Normal BP/glucose reading, completed referral, active patient profile.
- **Info / Coordination (Operational):**
  - Light: `#F0F9FF` (bg), `#0284C7` (border/text), `#075985` (dark text)
  - Meaning: Assigned community task, scheduled check-up, informational tip.

### Neutral Surface & Typography Tokens
- **Canvas Neutral:** `#FFFFFF` (Pure White) and `#F8FAFC` (Slate 50)
- **Primary Text:** `#0F172A` (Slate 900) — High contrast for readability under outdoor glare.
- **Secondary Text:** `#475569` (Slate 600) — Explanatory labels and subtitles.
- **Muted Border:** `#E2E8F0` (Slate 200) — Soft dividers and card borders.

---

## 2. Typography Hierarchy

The typography employs modern sans-serif fonts with fallbacks to system fonts (`Inter`, `system-ui`, `-apple-system`, `sans-serif`) ensuring zero layout shifting when rendering Devanagari (Hindi) scripts.

| Token | Desktop Size | Mobile Size | Weight | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Title** | 3.5rem (56px) | 2.25rem (36px) | Bold (700) | 1.15 | Main landing hero |
| **Section Heading** | 2.25rem (36px) | 1.75rem (28px) | Semi-Bold (600) | 1.25 | Page section titles |
| **Subsection Heading** | 1.5rem (24px) | 1.25rem (20px) | Semi-Bold (600) | 1.3 | Card headings, feature titles |
| **Body Large** | 1.125rem (18px) | 1.0rem (16px) | Regular (400) | 1.6 | Hero leads, intros |
| **Body Standard** | 1.0rem (16px) | 0.9375rem (15px) | Regular (400) | 1.5 | Descriptions, articles |
| **Caption / Meta** | 0.875rem (14px) | 0.8125rem (13px) | Medium (500) | 1.4 | Badges, timestamps, helper text |

---

## 3. Responsive Breakpoints & Container Standards

- **Max Container Width:** `max-w-7xl` (1280px) for standard content sections; `max-w-5xl` for readable narratives.
- **Breakpoints (Tailwind standard):**
  - `sm`: 640px (large mobile / phablet)
  - `md`: 768px (tablet portrait)
  - `lg`: 1024px (tablet landscape / laptop)
  - `xl`: 1280px (standard desktop)
  - `2xl`: 1536px (large desktop)
- **Touch Target Standard:** Minimum 44px x 44px for all clickable buttons, toggles, and inputs to accommodate one-handed mobile field operation.

---

## 4. Component Design Patterns

1. **Buttons**:
   - `Primary`: Deep forest green `#0A4333` background with white text, soft rounded corners (`rounded-xl`), subtle elevation shadow on hover, and clear keyboard focus ring (`ring-2 ring-emerald-600 ring-offset-2`).
   - `Secondary`: Mint tint `#E8F5F0` background with `#0A4333` text; for secondary discovery actions.
   - `Outline`: 1.5px `#0F5B47` border with hover background fill.
   - `Ghost`: Transparent background, hover color transition.

2. **Status Badges (`StatusBadge`)**:
   - Subtle tinted background (`px-2.5 py-1 text-xs font-semibold rounded-full border`).
   - Accompanied by distinct iconography and text (never relying solely on color).

3. **Form Fields**:
   - Explicit `<label>` elements with accessible `id`/`htmlFor` pairings.
   - Clear red asterisk for required fields.
   - Descriptive helper text and accessible error containers (`aria-invalid`, `aria-describedby`).

4. **Accessibility (WCAG 2.1 AA Compliant)**:
   - High contrast ratios (exceeding 4.5:1 for normal body text, 7:1 for headers).
   - Visible keyboard focus rings on all interactive elements.
   - Respect for `prefers-reduced-motion` across all transitions.
   - Semantic HTML5 structure (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`).

