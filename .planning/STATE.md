# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2025-01-18)

**Core value:** Quickly and accurately split a restaurant bill so everyone pays their fair share
**Current focus:** Phase 2 - Core UI

## Current Position

Phase: 2 of 3 (Core UI)
Plan: 2 of 3 in current phase
Status: In progress
Last activity: 2026-01-19 - Completed 02-02-PLAN.md (Dish Entry and Bill Totals)

Progress: [█████░░░░░] 57% (4/7 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: 2.75 min
- Total execution time: 11 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 2/2 | 5 min | 2.5 min |
| 2. Core UI | 2/3 | 6 min | 3 min |
| 3. Polish | 0/2 | - | - |

**Recent Trend:**
- Last 5 plans: 01-01 (2 min), 01-02 (3 min), 02-01 (4 min), 02-02 (2 min)
- Trend: Stable (~3 min per plan)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Used Bun's native tooling exclusively (no Vite, no Jest)
- Used relative paths in HTML for subdirectory deployment compatibility
- Configured tsconfig with DOM lib for browser API support
- Integer cents for all money values (no floating point)
- Largest remainder method for proportional allocation
- Round-robin distribution for even splits with remainders
- No runtime dependencies for logic (inline all utils/math)
- Simple full re-render pattern instead of granular DOM updates
- localStorage key 'splits-diners' for diner preset persistence
- Empty diners kept in array, filtered via getNamedDiners for display
- Tab-through only creates new row if current dish has a name
- Amber/yellow warning color for validation mismatch

### Pending Todos

- Enable GitHub Pages in repository settings (Settings > Pages > gh-pages branch)

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-01-19
Stopped at: Completed 02-02-PLAN.md (Dish Entry and Bill Totals)
Resume file: None
