---
name: healthcare-ui-theme
description: Standardized UI/UX design system and minimal healthcare color theme for SwasthyaSetu (MediVault). Use whenever designing or implementing user interfaces, components, forms, badges, modals, timelines, or review screens to ensure consistent, clinical, professional, and non-vibe-coded styling across the platform.
---

# SwasthyaSetu Healthcare UI/UX Skill & Theme Reference

This skill guides any AI agent or developer building frontend UI components for the SwasthyaSetu / MediVault project.

## Core Directives
1. **Never "Vibe-Code"**: No neon glow effects, no gradients for gradients' sake, no dark-mode gamer aesthetics, no playful chatbot decorations.
2. **Clinical Utility First**: High information density, scannable tables, clear status contrast, accessible typography.
3. **Strict Color Semantics**: Every color represents a specific clinical or operational state.

---

## 1. Color Palette

```
Canvas / Neutral Backgrounds:
  - Page Background:      bg-slate-50 (#F8FAFC)
  - Card Surface:         bg-white (#FFFFFF)
  - Header / Muted Area:  bg-slate-100 (#F1F5F9)
  - Borders:              border-slate-200 (#E2E8F0)
  - Input Borders:        border-slate-300 (#CBD5E1)

Text:
  - Heading & Values:     text-slate-900 (#0F172A)
  - Labels & Secondary:   text-slate-600 (#475569)
  - Muted Placeholders:   text-slate-400 (#94A3B8)

Brand Anchor (Clinical Teal):
  - Subtle Accent:        bg-teal-50 text-teal-800 border-teal-200
  - Primary Buttons:      bg-teal-600 hover:bg-teal-700 text-white
  - Active Nav Indicator: text-teal-600 border-teal-600
```

---

## 2. Semantic Status Tokens (Use Strictly)

### A. Network & Sync State
- **`ONLINE` / `SYNCED`**:
  `bg-emerald-50 text-emerald-700 border-emerald-200` + dot `bg-emerald-500`
- **`OFFLINE` / `QUEUED`**:
  `bg-amber-50 text-amber-800 border-amber-200` + dot `bg-amber-500`
- **`SYNCING`**:
  `bg-sky-50 text-sky-700 border-sky-200` + `animate-spin`
- **`FAILED` / `CONFLICT`**:
  `bg-rose-50 text-rose-700 border-rose-200` + dot `bg-rose-500`

### B. Urgency Levels
- **`ROUTINE`**: `bg-slate-100 text-slate-700 border-slate-200`
- **`URGENT`**: `bg-amber-50 text-amber-800 border-amber-300 font-medium`
- **`EMERGENCY`**: `bg-rose-50 text-rose-700 border-rose-300 font-semibold`

### C. Clinical AI Confidence
- **`High Confidence` ($\ge 90\%$)**: `bg-emerald-50 text-emerald-700 border-emerald-200`
- **`Needs Review` ($< 90\%$)**: `bg-amber-50 text-amber-800 border-amber-300`
- **`Rejected / Overridden`**: `bg-slate-100 text-slate-500 line-through border-slate-200`

---

## 3. UI Patterns & Snippets

### Standard Card Container
```tsx
<div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-slate-300 transition-colors">
  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    {badge}
  </div>
  {children}
</div>
```

### Primary Button
```tsx
<button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:opacity-50">
  {icon}
  <span>{label}</span>
</button>
```

### Secondary / Outline Button
```tsx
<button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-sm font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50">
  {icon}
  <span>{label}</span>
</button>
```

### Standard Input Field
```tsx
<div>
  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
    {label} {required && <span className="text-rose-500">*</span>}
  </label>
  <input
    type={type}
    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
    placeholder={placeholder}
  />
</div>
```

---

## 4. Key Review Screens
- **Side-by-Side Identity**: Always present Incoming Patient vs Candidate Patient in balanced 50/50 columns with explicit match pills (`Match (100%)`, `Partial (70%)`, `Mismatch`). Never silently merge.
- **Split-Screen Document Review**: Left: Document image with zoom/pan. Right: Extracted fields with confidence badges and instant inline edit inputs for fields $<90\%$.
- **Care Timeline**: Vertical continuous track (`border-l-2 border-slate-200`) with circular event badges, relative timestamps, and actor tags.
