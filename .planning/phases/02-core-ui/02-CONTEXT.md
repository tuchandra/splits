# Phase 2: Core UI - Context

**Gathered:** 2026-01-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can enter a bill, manage friends, and assign items to people. This phase delivers the complete data entry and assignment interface — the core interaction loop. Output display polish and keyboard shortcuts are Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Layout Structure
- Single page with sections: Diners, Dishes, Bill Totals, Individual Shares
- Card-based dish entries with toggleable name chips for assignment
- Responsive: chips below dish row on mobile, columns on desktop
- Individual Shares updates live on every change (no Calculate button)

### Diner Entry
- Compact layout (not full-width)
- Editable name fields with delete button
- Auto-populate from localStorage presets on load
- "+ Add Diner" to add new
- Empty/unnamed diners omitted from assignment chips entirely

### Dish Entry
- Fields: description, quantity, price (qty × unit price = line total)
- Tab flow: dish → qty → price → auto-creates new row → dish... continuous entry
- "+ Add Dish" button also available
- Delete button per dish

### Assignment Interaction
- Toggleable name chips per dish (filled/blue = assigned, outlined = not)
- "All" quick-toggle button per dish to assign/unassign everyone
- Only named diners appear as chips

### Bill Totals
- Three labeled fields: Tax, Tip, Total
- Total is for validation — compare entered total vs calculated subtotal + tax + tip
- When mismatch: show "Off by $X.XX" AND highlight field with warning color

### Unassigned Indication
- Dishes with no one assigned get warning border AND "Unassigned" text label

### Mobile
- Same structure, just responsive stacking
- Diner chips below dish row instead of columns

### Claude's Discretion
- Exact styling (colors, spacing, typography)
- Warning color choices
- Add Diner/Add Dish button styling
- Input field styling details

</decisions>

<specifics>
## Specific Ideas

Reference mockup provided showing:
- Vertical diner list at top
- Dish cards with name/qty/price and chip row below
- Bill totals section with three inputs
- Individual shares as name + amount rows

User preferences:
- Continuous tab-through entry flow is important
- Compact diner entry, not sprawling full-width fields
- Clean omission of empty diners (no "Diner 5" placeholders)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-core-ui*
*Context gathered: 2026-01-18*
