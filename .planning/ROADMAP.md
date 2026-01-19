# Roadmap: Splits

## Overview

Build a bill splitter that takes manual line item entry, assigns items to friends, and calculates each person's share with proportional tax/tip/fees. Phase 1 establishes the foundation with tested calculation logic, Phase 2 delivers the core UI for entry and assignment, and Phase 3 adds output polish and keyboard shortcuts.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Foundation** - Project setup and core split calculation logic with tests
- [ ] **Phase 2: Core UI** - Friends management, item entry, and assignment interface
- [ ] **Phase 3: Polish** - Output display, export, and keyboard shortcuts

## Phase Details

### Phase 1: Foundation
**Goal**: Establish project structure, deployment pipeline, and validate core splitting logic through pure functions with comprehensive tests
**Depends on**: Nothing (first phase)
**Requirements**: CALC-01, CALC-02, CALC-03
**Success Criteria** (what must be TRUE):
  1. Project builds and runs with Bun (no npm)
  2. Static site builds and deploys to tusharc.dev/split via GitHub
  3. Pure function correctly calculates proportional tax/tip/fees based on each person's subtotal
  4. Pure function correctly splits shared items evenly among assigned people
  5. Pure function correctly computes final amount per person
  6. All calculation functions have passing unit tests
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md - Project scaffolding (TypeScript, Bun, build config, GitHub deployment)
- [x] 01-02-PLAN.md - Core split calculation functions with TDD

### Phase 2: Core UI
**Goal**: Users can enter a bill, manage friends, and assign items to people
**Depends on**: Phase 1
**Requirements**: ENTRY-01, ENTRY-02, ENTRY-03, ENTRY-04, ASSIGN-01, ASSIGN-02, ASSIGN-03, ASSIGN-04, FRIEND-01, FRIEND-02, FRIEND-03, UX-01
**Success Criteria** (what must be TRUE):
  1. User can add, edit, and delete line items with name and amount
  2. User can enter tax, tip, and fees as separate amounts
  3. User can manage a preset list of friends (stored in localStorage) and add new ones
  4. User can select which friends are participating in this bill
  5. User can assign each item to one or more people, including an "everyone" shortcut
  6. User can see which items are unassigned (visual indicator)
  7. User can see running total vs expected total for sanity checking
  8. UI works well on mobile devices (responsive layout)
**Plans**: TBD

Plans:
- [ ] 02-01: Friends management (localStorage, add/select participants)
- [ ] 02-02: Item entry (add/edit/delete items, tax/tip/fees)
- [ ] 02-03: Item assignment (assign to people, "everyone", unassigned indicator, totals)

### Phase 3: Polish
**Goal**: Users can see final results and efficiently use keyboard shortcuts
**Depends on**: Phase 2
**Requirements**: OUT-01, OUT-02, UX-02
**Success Criteria** (what must be TRUE):
  1. User can see final amount each person owes (clear display)
  2. User can export/copy a summary with items, who had them, and amounts
  3. Keyboard shortcuts work for common actions on desktop
**Plans**: TBD

Plans:
- [ ] 03-01: Output display and export summary
- [ ] 03-02: Keyboard shortcuts for desktop

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete | 2026-01-18 |
| 2. Core UI | 0/3 | Not started | - |
| 3. Polish | 0/2 | Not started | - |

---
*Roadmap created: 2025-01-18*
*Depth: quick (3 phases)*
*Requirements coverage: 18/18 mapped*
