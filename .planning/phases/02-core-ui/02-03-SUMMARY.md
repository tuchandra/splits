---
phase: 02-core-ui
plan: 03
subsystem: ui
tags: [vanilla-js, dom, assignment-chips, calculate-bill, responsive]

# Dependency graph
requires:
  - phase: 02-01
    provides: Diner management UI with localStorage persistence
  - phase: 02-02
    provides: Dish entry and Bill Totals sections
  - phase: 01-02
    provides: calculateBill function for proportional share calculation
provides:
  - Assignment chips per dish for diner selection
  - "All" quick-toggle button for assign/unassign everyone
  - Unassigned dish warning indicator (amber border + label)
  - Live Individual Shares section with calculated totals
  - Empty state hints for Diners and Dishes
affects: [03-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Chip toggle pattern (filled=assigned, outlined=not)"
    - "Live calculation on every render"
    - "Warning indicator pattern (amber border + label)"

key-files:
  created: []
  modified:
    - src/main.ts
    - src/index.html

key-decisions:
  - "Chips show only named diners (empty diner inputs excluded)"
  - "All button toggles between assign-everyone and unassign-everyone"
  - "Unassigned indicator only shows for named dishes"
  - "Shares section shows empty state when no diners or no dishes"
  - "Allow qty=0 for comped/removed items"

patterns-established:
  - "Chip toggle: filled/blue when assigned, outlined when not"
  - "Warning pattern: amber/orange border (#d97706) with light amber background"
  - "Empty hint pattern: italic gray text for guidance"

# Metrics
duration: 4min
completed: 2026-01-19
---

# Phase 2 Plan 3: Assignment and Individual Shares Summary

**Toggleable diner chips per dish with "All" button, unassigned warnings, and live Individual Shares display using calculateBill**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-19T04:37:51Z
- **Completed:** 2026-01-19T04:41:08Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments
- Assignment chips render per dish showing named diners
- "All" button assigns/unassigns everyone with single click
- Unassigned dishes show amber warning border and "Unassigned" label
- Individual Shares section calculates and displays each person's total live
- Clean up assignedTo arrays when diner is deleted
- Empty state hints guide users when no diners or dishes exist

## Task Commits

Each task was committed atomically:

1. **Task 1: Add assignment chips to dish rows** - `70f08e4` (feat)
2. **Task 2: Add unassigned indicator and live Individual Shares** - `aa5183e` (feat)
3. **Task 3: Final polish and responsive testing** - `b0084a2` (style)

## Files Created/Modified
- `src/main.ts` - Added assignment chip rendering, unassigned detection, renderSharesSection function
- `src/index.html` - Added CSS for chips, unassigned warning, shares section, empty hints

## Decisions Made
- Chips use filled/outlined visual pattern (filled blue = assigned, outlined = not)
- Only named diners appear as chips (empty diner inputs filtered out)
- Unassigned indicator only appears for dishes with names (empty dish rows don't show warning)
- Individual Shares uses calculateBill from lib/calculate.ts for accurate proportional splitting
- Allow qty=0 for comped or removed items (edge case support)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All Phase 2 requirements complete
- Core interaction loop working: diners -> dishes -> assignments -> live shares
- Ready for Phase 3 polish (keyboard shortcuts, output formatting, deployment)

---
*Phase: 02-core-ui*
*Completed: 2026-01-19*
