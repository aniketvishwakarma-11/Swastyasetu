# SwasthyaSetu (MediVault) UI/UX Design System & Theme Specification

> **Design Directive**: A clean, high-density, professional healthcare operations interface. 
> **Zero "vibe-coded" clutter**: No flashy neon gradients, no extraneous animations, no dark-mode gamer aesthetics, and no chatbot fluff. Every element must serve clarity, clinical trust, and operational speed.

---

## 1. Core Visual Principles

1. **Information-Dense & Scannable**: Doctors and triage coordinators need to see patient vitals, referral urgency, and matching evidence at a glance. Avoid excessive whitespace and oversized cartoon cards.
2. **Subtle Elevation, Crisp Borders**: Use light 1px borders (`border-slate-200`) and subtle shadows (`shadow-sm`) over deep drop shadows.
3. **Strictly Semantic Color Usage**: Colors are NEVER decorative. Colors communicate **Urgency**, **Network State**, **Identity Match Strength**, and **AI Confidence**.
4. **Accessible Contrast (WCAG AA/AAA)**: All text on badges and backgrounds must have high contrast ratios for readability on low-cost tablet screens in rural clinics.

---

## 2. Color Palette & Tokens

### Base Surface & Neutral Hierarchy
| Token | Tailwind Class | Hex Value | Purpose |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `bg-slate-50` | `#F8FAFC` | Page background |
| **Card / Surface** | `bg-white` | `#FFFFFF` | Form containers, modal bodies, table rows |
| **Subtle Card / Inactive** | `bg-slate-100` | `#F1F5F9` | Table headers, muted panels, disabled inputs |
| **Border / Divider** | `border-slate-200`| `#E2E8F0` | Structural 1px separation lines |
| **Strong Border** | `border-slate-300`| `#CBD5E1` | Input field borders, active dividers |
| **Primary Text** | `text-slate-900` | `#0F172A` | Primary headings, values, key labels |
| **Secondary Text** | `text-slate-600` | `#475569` | Descriptions, timestamps, field labels |
| **Muted Text** | `text-slate-400` | `#94A3B8` | Placeholders, inactive breadcrumbs |

---

### Primary Brand & Healthcare Anchor (Clinical Teal)
| Token | Tailwind Class | Hex Value | Purpose |
| :--- | :--- | :--- | :--- |
| **Teal Light** | `bg-teal-50` | `#F0FDFA` | Active nav items, highlighted table rows, soft badges |
| **Teal Border** | `border-teal-200`| `#99F6E4` | Border for active clinical cards |
| **Teal Primary** | `bg-teal-600` | `#0D9488` | Primary CTA buttons, active toggles, icons |
| **Teal Dark / Hover**| `bg-teal-700` | `#0F766E` | Hover state for primary buttons |
| **Teal Deep** | `text-teal-900` | `#134E4A` | Emphasized badge text |

---

### Semantic Functional States

#### A. Network & Sync States
| Status | Badge Classes | Dot / Icon Indicator |
| :--- | :--- | :--- |
| **ONLINE / SYNCED** | `bg-emerald-50 text-emerald-700 border-emerald-200` | Green solid dot (`bg-emerald-500`) |
| **OFFLINE / QUEUED** | `bg-amber-50 text-amber-800 border-amber-200` | Amber solid dot (`bg-amber-500`) |
| **SYNCING** | `bg-sky-50 text-sky-700 border-sky-200` | Spinning icon (`animate-spin`) |
| **SYNC_FAILED / CONFLICT** | `bg-rose-50 text-rose-700 border-rose-200` | Red alert dot (`bg-rose-500`) |

#### B. Referral Urgency Levels
| Urgency | Badge Classes | Visual Rule |
| :--- | :--- | :--- |
| **ROUTINE** | `bg-slate-100 text-slate-700 border-slate-200` | Standard weight, neutral tone |
| **URGENT** | `bg-amber-50 text-amber-800 border-amber-300 font-medium` | Warm amber warning |
| **EMERGENCY** | `bg-rose-50 text-rose-700 border-rose-300 font-semibold` | Rose badge with red pulse dot |

#### C. AI & Clinical Document Confidence
| State | Range | Badge Classes | Clinical Instruction |
| :--- | :--- | :--- | :--- |
| **High Confidence** | $\ge 90\%$ | `bg-emerald-50 text-emerald-700 border-emerald-200` | Verified / Auto-accepted |
| **Needs Review** | $< 90\%$ | `bg-amber-50 text-amber-800 border-amber-300` | Mandatory clinician review |
| **Rejected / Overridden**| Manual | `bg-slate-100 text-slate-500 border-slate-200 line-through` | Replaced by clinician edit |

---

## 3. Typography & Hierarchy

Font Family: System Sans-Serif (`ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`).

| Style | Classes | Use Case |
| :--- | :--- | :--- |
| **Display / Section Header** | `text-lg font-bold text-slate-900 tracking-tight` | Screen headers, modal titles |
| **Card Header** | `text-sm font-semibold text-slate-800` | Card titles, table column headers |
| **Body Primary** | `text-sm text-slate-900` | Form input text, table cell values |
| **Body Secondary** | `text-xs text-slate-600` | Form field helper text, metadata |
| **Badge / Caption** | `text-[11px] font-medium tracking-wide uppercase` | Status badges, urgency tags |
| **Mono / Code** | `font-mono text-xs text-slate-700 bg-slate-100 px-1 py-0.5 rounded` | Referral IDs (`RF-1024`), Event IDs (`EVT-...`) |

---

## 4. Standard Reusable UI Component Specifications

### 1. Operations Header (`Navbar`)
- Fixed sticky top bar (`sticky top-0 z-40 bg-white border-b border-slate-200`).
- Left: Hospital / PHC facility identifier badge + SwasthyaSetu logo.
- Center / Right:
  - **Live Connectivity Status** with active ping dot (`● ONLINE` or `● OFFLINE (X queued)`).
  - **Demo Network Toggle Switch**: `[LIVE ONLINE]` vs. `[SIMULATED OFFLINE]`.
  - User role badge (e.g. `DR. RAJESH SHARMA • PHC_USER`).

### 2. Standard Card (`ClinicalCard`)
```html
<div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-slate-300 transition-colors">
  <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
    <h3 class="text-sm font-semibold text-slate-900">Card Title</h3>
    <!-- Optional Badge -->
  </div>
  <!-- Content -->
</div>
```

### 3. Status Badges (`StatusBadge`)
Small, rounded-full, pill-style with explicit border:
```html
<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
  SYNCED
</span>
```

### 4. Side-by-Side Identity Reconciliation Screen
- Left Column: **Incoming Referral Patient** (e.g., `Ramesh Yadav, 47, Male, Village Khed`).
- Right Column: **Hospital Candidate Record** (e.g., `Ramesh Kumar, 47, Male, Village Khed`).
- Each field row compares values with a match pill:
  - `Match (100%)` $\rightarrow$ Green badge.
  - `Partial (70%)` $\rightarrow$ Amber badge.
  - `Mismatch` $\rightarrow$ Slate/Red badge.
- Overall score header: `94% Similarity (Candidate Match)`.
- Explicit action footer with 3 buttons:
  - `[Confirm Identity Match]` (Primary Teal Button)
  - `[Register as New Patient]` (Secondary Outline Button)
  - `[Search Different Record]` (Tertiary Ghost Button)
- **Hard Rule**: Never hide differences; always highlight differing characters.

### 5. Document Split-Screen Review (`DocViewer`)
- Left Half: Original prescription / discharge document with pan, zoom, and bounding box highlight.
- Right Half: Structured extracted clinical fields table.
  - Row columns: **Field Name**, **Extracted Raw Value**, **Normalized Value**, **Confidence %**, **Actions**.
  - If Confidence $< 90\%$, row has a subtle amber border and a prominent `[Verify / Edit]` button.
  - Clicking `[Edit]` lets the doctor type the correct dosage/drug directly and logs an audit record.

### 6. Chronological Care Timeline (`CareTimeline`)
- Vertical timeline with a subtle 2px vertical slate line (`border-l-2 border-slate-200 ml-4`).
- Circular event nodes with role-specific icons (referral icon, checkmark, document icon).
- Each entry displays:
  - `Timestamp` (Relative + Absolute ISO)
  - `Event Title` (`REFERRAL_CREATED`, `OFFLINE_QUEUED`, `IDENTITY_CONFIRMED`)
  - `Facility & Actor` (`PHC Khed • Dr. Sharma`)
  - `Metadata snippet` (e.g., `"Match confirmed with score 94%"`)

### 7. Form Inputs & Select Controls
```html
<label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
  Patient Full Name <span class="text-rose-500">*</span>
</label>
<input 
  type="text" 
  class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all" 
  placeholder="Enter patient full name"
/>
```

---

## 5. Rules for AI Agents & Developers Writing UI

1. **Stick to the Tailwind Classes in this guide**: Do not invent arbitrary hex values (e.g., avoid `#3498db`, `#2ecc71`, purple gradients, or glowing neon drop-shadows).
2. **Always include loading, empty, and offline error states**: Every list must have an `EmptyState` component with a medical icon and helpful instructions.
3. **Never render raw JSON or unformatted numbers**: Format dates to human readable (`21 Sep 2026, 10:30 AM`), percentages to `94%`, phone numbers to `+91 98230 XXXXX`.
4. **All interactive actions must give feedback**: Toast or inline confirmation on save, queueing, or sync.
5. **Always preserve the Connectivity / Demo Header**: The user and judges must always be able to test offline mode from any screen.
