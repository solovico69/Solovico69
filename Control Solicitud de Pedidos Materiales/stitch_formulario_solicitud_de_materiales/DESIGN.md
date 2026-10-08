---
name: Industrial Precision
colors:
  surface: '#f8f9ff'
  surface-dim: '#ccdbf4'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dde9ff'
  surface-container-highest: '#d5e3fd'
  on-surface: '#0d1c2f'
  on-surface-variant: '#43474d'
  inverse-surface: '#233144'
  inverse-on-surface: '#ebf1ff'
  outline: '#74777e'
  outline-variant: '#c3c6ce'
  surface-tint: '#49607c'
  primary: '#001428'
  on-primary: '#ffffff'
  primary-container: '#0f2942'
  on-primary-container: '#7991af'
  inverse-primary: '#b0c9e8'
  secondary: '#855300'
  on-secondary: '#ffffff'
  secondary-container: '#fea619'
  on-secondary-container: '#684000'
  tertiary: '#00170d'
  on-tertiary: '#ffffff'
  tertiary-container: '#002e1d'
  on-tertiary-container: '#21a173'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d1e4ff'
  primary-fixed-dim: '#b0c9e8'
  on-primary-fixed: '#011d35'
  on-primary-fixed-variant: '#314863'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#85f8c4'
  tertiary-fixed-dim: '#68dba9'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#f8f9ff'
  on-background: '#0d1c2f'
  surface-variant: '#d5e3fd'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system targets civil engineers, project supervisors, procurement officers, and site managers operating in high-demand construction environments. The interface conveys structural stability, precision, operational clarity, and industrial efficiency. It balances corporate discipline with field usability—usable on outdoor mobile tablets under bright sunlight or desktop procurement workstations.

The aesthetic fuses **Corporate Modern** with **Technical Precision**:
- Crisp planar structure grounded in architectural grid logic.
- High-contrast visual cues designed to prevent data entry mistakes during fast-paced field requisitions.
- Industrial utility: status indicators, live data sync indicators, unit measurement badges, and high-density material item tables.
- An engineered presence that feels sturdy, calibrated, and reliable.

## Colors

The color palette reflects industrial architecture: deep structural steel, high-visibility safety amber, reinforced concrete neutrals, and verified emerald status signals.

### Palette Architecture
- **Primary (`#0F2942`)**: Deep Marine Navy / Structural Steel. Represents authority, heavy engineering, and core corporate brand identity. Used for primary navigation, critical buttons, high-priority interactive states, and prominent headers.
- **Secondary (`#F59E0B` / `#D97706`)**: Safety Amber / Construction Yellow. Applied purposefully for alert highlights, pending approvals, critical material tags, active focus accents, and callouts requiring caution.
- **Tertiary (`#059669`)**: Emerald Signal. Used strictly for success verification, live Google Sheets synchronization states, completed dispatches, and inventory confirmations.
- **Neutrals (`#0F172A`, `#334155`, `#E2E8F0`, `#F8FAFC`)**: Concrete & Alloy.
  - `#0F172A` (Charcoal Slate): Primary typography and high-emphasis labels.
  - `#334155` (Mid Slate): Body text, supporting descriptors, and icons.
  - `#E2E8F0` (Reinforced Rim): Borders, dividers, input outlines, and card perimeters.
  - `#F1F5F9` (Light Concrete): Subordinate container fills and table headers.
  - `#F8FAFC` (Canvas Surface): Root application background providing glare-resistant clarity.

## Typography

The type scale combines **Plus Jakarta Sans** for structural headlines with **Inter** for dense transactional UI data, forms, and technical tables.

- Headlines leverage **Plus Jakarta Sans** to introduce clean, contemporary architectural presence without compromising institutional gravitas.
- Form controls, tables, numerical units (e.g., `m³`, `kg`, `tn`), and SKU codes use **Inter** to ensure maximum legibility at compact sizes and on varied screens.
- Monospaced numerical rendering (`tabular-nums`) must be enabled on all numerical inputs, material quantity counts, unit price fields, and synchronization timestamps to maintain vertical alignment in tables and material rosters.

## Layout & Spacing

A disciplined 12-column fluid grid system governs wide displays, condensing into 6 columns on tablet devices and 4 columns on mobile viewports.

### Breakpoints & Flow
- **Desktop (1200px+)**: 12 columns, 24px gutters, max layout container of 1440px. Two-pane layout for complex requests: Left pane for project parameters and item catalog entry; right pane for line item consolidation and real-time synchronization ledger.
- **Tablet (768px - 1199px)**: 6 columns, 20px gutters. Stacked modular blocks with full-width sticky footer controls for form submission and validation status.
- **Mobile (< 768px)**: 4 columns, 16px gutters, 16px canvas margins. Vertical linear flow where individual material entries are structured as repeatable, self-contained cards rather than wide horizontal tables.

All component spacing respects an 8pt baseline rhythm, using 4px increments strictly for compact field labels and inline badges.

## Elevation & Depth

Visual depth is achieved through **tonal surface stacking** combined with **low-contrast structural outlines**, deliberately rejecting exaggerated blurs to retain sharp, CAD-like legibility.

- **Ground Plane (Level 0)**: Background `#F8FAFC`. Neutral, low-fatigue industrial canvas.
- **Surface Level 1 (Panels & Cards)**: Pure white `#FFFFFF` surface bounded by a continuous 1px solid border `#E2E8F0`. Shadow: `0 1px 3px 0 rgba(15, 41, 66, 0.05), 0 1px 2px -1px rgba(15, 41, 66, 0.05)`.
- **Surface Level 2 (Interactive Flyouts & Dropdowns)**: `#FFFFFF` bounded by `#CBD5E1`. Shadow: `0 4px 6px -1px rgba(15, 41, 66, 0.08), 0 2px 4px -2px rgba(15, 41, 66, 0.06)`.
- **Surface Level 3 (Modals & Confirmation Drawers)**: `#FFFFFF` bounded by `#94A3B8`. Shadow: `0 20px 25px -5px rgba(15, 41, 66, 0.12), 0 8px 10px -6px rgba(15, 41, 66, 0.08)`.
- **State Highlighting**: Focused form elements break elevation boundaries using a crisp 2px dual-ring: 2px offset in `#FFFFFF` plus 2px solid ring in `#0F2942` or `#F59E0B`.

## Shapes

The design uses a **Soft (`1`)** shape language (4px - 8px base radius). This reflects modern industrial tooling and metal fabrication: engineered, precise, avoiding overly playful circular bubbles while preventing harsh unworked edges.

- Form fields, primary buttons, and status tags: `4px` radius (`rounded`).
- Cards, summary panels, and structured requisition blocks: `8px` radius (`rounded-lg`).
- Modal windows, bottom sheets, and major screen divisions: `12px` radius (`rounded-xl`).
- Status dots and badge counters: `9999px` (pill-shape) strictly for numerical tallies and live connection pulses.

## Components

### Buttons
- **Primary Button**: Background `#0F2942`, text `#FFFFFF`, border none, 4px corner radius. Min-height 48px on touch devices (40px desktop). States: hover `#1E3A8A`, active `#0B1E30`, focus ring 2px safety amber `#F59E0B`.
- **Secondary Button**: Background `#FFFFFF`, text `#0F2942`, 1px solid border `#CBD5E1`. States: hover `#F8FAFC`, active `#F1F5F9`.
- **Amber Warning / Expedite Action**: Background `#F59E0B`, text `#0F172A`, font-weight 600. For emergency requisitions or high-priority flags.
- **Tertiary Sync Button**: Text `#059669`, background `#ECFDF5`, border 1px solid `#A7F3D0`.

### Form Fields & Inputs
- **Base Style**: Minimum 44px height for field touch reliability. Background `#FFFFFF`, border 1px solid `#CBD5E1`, text `#0F172A`, placeholder `#94A3B8`.
- **Focus State**: Border color `#0F2942` with 3px halo `rgba(15, 41, 66, 0.15)`.
- **Unit Measurement Addon**: Fixed right-aligned segment in `#F1F5F9` with border-left `#CBD5E1`, rendering monospace units (e.g., `Bolsas`, `m³`, `Varillas`, `Pulgadas`).

### Cards & Repeatable Material Items
- Container `#FFFFFF` with 1px outline `#E2E8F0`. On mobile devices, each material item row transforms into an independent card with an amber/navy accent stripe on the left border (3px solid) indicating item category or urgency.
- Delete/duplicate row actions are always accessible with touch targets of at least 44x44px.

### Status Indicators & Sync Pill
- **Google Sheets Live Sync Pill**: An inline badge showing integration health.
  - *Connected/Synced*: Dot `#059669` with background `#ECFDF5`, text "Sincronizado con Sheets" (`#065F46`).
  - *Syncing*: Animated pulsing dot `#F59E0B`, background `#FFFBEB`, text "Guardando cambios...".
  - *Offline/Error*: Dot `#DC2626`, background `#FEF2F2`, text "Error de conexión".

### Selection Controls (Checkboxes & Radios)
- Heavy 2px border `#94A3B8` on unselected state. Checked state displays solid `#0F2942` fill with white indicator icon. Accessible touch target padded to 40x40px minimum.