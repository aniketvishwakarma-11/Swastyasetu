# SwasthyaSetu Project Rules & Directives for AI Agents

Welcome to the SwasthyaSetu repository. All AI agents and developers modifying code in this repository MUST read [AI_AGENT_CONTEXT.md](./AI_AGENT_CONTEXT.md) for full context on the problem, solutions, tech stack, architecture, and features, and MUST adhere to these rules:

## 1. UI/UX Design System & Theme Directives
- **Zero "Vibe-Coding"**: Do NOT introduce neon glows, unnecessary gradients, dark-mode gaming aesthetics, or playful chatbot decorations. This is a mission-critical healthcare operations tool for frontline doctors and district clinicians.
- **Reference Document**: Always follow [UI_UX_DESIGN_SYSTEM.md](./UI_UX_DESIGN_SYSTEM.md) and the `.agents/skills/healthcare-ui-theme/SKILL.md` skill.
- **Color Rules**:
  - Primary Brand Anchor: Clinical Teal (`bg-teal-600`, `hover:bg-teal-700`, `bg-teal-50`)
  - Neutral Base: `bg-slate-50`, `bg-white`, `border-slate-200`, `text-slate-900`
  - Semantic Statuses:
    - `ONLINE` / `SYNCED`: `emerald` (`bg-emerald-50 text-emerald-700 border-emerald-200`)
    - `OFFLINE` / `QUEUED`: `amber` (`bg-amber-50 text-amber-800 border-amber-200`)
    - `EMERGENCY`: `rose` (`bg-rose-50 text-rose-700 border-rose-300 font-semibold`)
    - `NEEDS_REVIEW` ($< 90\%$ confidence): `amber` (`bg-amber-50 text-amber-800 border-amber-300`)
- **Always Provide Explicit Feedback**: Empty states with medical icons, offline banners, and validation messages on all forms.

## 2. Hard Clinical Safety Rules
- **Rule 1 (No Silent Guessing)**: If an AI extraction or abbreviation is uncertain, mark it `NEEDS_REVIEW` with its confidence score. Never save a low-confidence guess as clinical fact.
- **Rule 2 (No Silent Merging)**: Even a 99% fuzzy match must require explicit clinician review and confirmation (`IDENTITY_CONFIRMED`). Never merge patient records automatically.
- **Rule 3 (No Clinical Decisions)**: AI extracts and normalizes document text; it never diagnoses or prescribes treatments.
- **Rule 4 (Auditability)**: Every state change generates an immutable `AuditEvent`.
- **Rule 5 (Idempotent Sync)**: All offline sync events must use `eventId` to prevent duplicate record creation.
