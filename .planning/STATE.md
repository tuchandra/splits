# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2025-01-18)

**Core value:** Quickly and accurately split a restaurant bill so everyone pays their fair share
**Current focus:** Phase 2 - Core UI

## Current Position

Phase: 2 of 3 (Core UI)
Plan: 1 of 3 in current phase
Status: In progress
Last activity: 2026-01-18 - Completed 02-01-PLAN.md (App State and Diner Entry)

Progress: [███░░░░░░░] 43% (3/7 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 3
- Average duration: 3 min
- Total execution time: 9 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 2/2 | 5 min | 2.5 min |
| 2. Core UI | 1/3 | 4 min | 4 min |
| 3. Polish | 0/2 | - | - |

**Recent Trend:**
- Last 5 plans: 01-01 (2 min), 01-02 (3 min), 02-01 (4 min)
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

### Pending Todos

- Enable GitHub Pages in repository settings (Settings > Pages > gh-pages branch)

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-01-18
Stopped at: Completed 02-01-PLAN.md (App State and Diner Entry)
Resume file: None
