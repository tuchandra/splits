---
phase: 01-foundation
plan: 02
subsystem: calculation
tags: [typescript, tdd, integer-cents, bill-splitting]

# Dependency graph
requires:
  - phase: 01-01
    provides: Bun project with build/test infrastructure
provides:
  - Pure bill calculation functions (splitEvenly, allocateProportionally, calculateBill)
  - Type definitions for bill data structures (LineItem, BillInput, PersonShare, BillResult)
  - Comprehensive test suite for calculation logic (26 tests)
affects: [02-01, 02-02, 02-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - integer-cents-for-money (no floating point)
    - largest-remainder-method for proportional allocation
    - pure-functions (no side effects)
    - tdd-red-green-refactor

key-files:
  created:
    - tests/calculate.test.ts
  modified:
    - src/lib/calculate.ts
    - src/main.ts

key-decisions:
  - "Integer cents for all money values (no floating point)"
  - "Largest remainder method for fair penny distribution in proportional allocation"
  - "Round-robin distribution for even splits with remainders"
  - "Zero subtotal edge case: split tax/tip/fees evenly among participants"

patterns-established:
  - "All money values as integer cents throughout codebase"
  - "Pure calculation functions with no side effects"
  - "Map<string, number> for person -> amount mappings"
  - "BillInput/BillResult types for calculation interface"

# Metrics
duration: 3min
completed: 2026-01-19
---

# Phase 1 Plan 2: Bill Calculation Engine Summary

**TDD-built bill splitting logic with proportional tax/tip/fee allocation using largest remainder method for penny-perfect accuracy**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-19T04:08:36Z
- **Completed:** 2026-01-19T04:11:37Z
- **Tasks:** 3 (RED -> GREEN -> REFACTOR)
- **Files modified:** 3

## Accomplishments

- Implemented `splitEvenly` function for dividing amounts with round-robin remainder distribution
- Implemented `allocateProportionally` function using largest remainder method for fair allocation
- Implemented `calculateBill` main function integrating item splitting and tax/tip/fees allocation
- Created comprehensive test suite with 26 test cases covering all requirements
- Refactored to extract `allocateExtra` helper, reducing code duplication

## Task Commits

Each task was committed atomically (TDD cycle):

1. **RED: Write failing tests** - `cbf82d2` (test)
2. **GREEN: Implement to pass** - `5599d6a` (feat)
3. **REFACTOR: Clean up** - `45610de` (refactor)

## Files Created/Modified

- `src/lib/calculate.ts` (222 lines) - Core calculation functions and types
- `tests/calculate.test.ts` (378 lines) - Comprehensive test suite
- `src/main.ts` - Updated placeholder to use new calculateBill signature

## Decisions Made

1. **Integer cents everywhere** - All money values stored as integer cents to avoid floating point errors. This is a constraint from PROJECT.md.

2. **Largest remainder method for proportional allocation** - Rather than simple rounding which can lose pennies, we calculate exact proportions, floor them, then distribute remaining cents to those with the largest fractional parts. This ensures no lost pennies.

3. **Round-robin for even splits** - When splitting evenly with a remainder, extra pennies go to people in order (first N people get +1 cent). Simple and predictable.

4. **Zero subtotal fallback** - When all item subtotals are $0 but there's tax/tip/fees, split evenly among participants rather than proportionally (which would be undefined).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated main.ts placeholder**
- **Found during:** Task 2 (Implementation)
- **Issue:** main.ts called `calculateBill()` with no arguments, but new signature requires BillInput
- **Fix:** Updated main.ts with a demo BillInput to verify module loads
- **Files modified:** src/main.ts
- **Verification:** TypeScript compiles, build succeeds
- **Committed in:** 5599d6a (part of GREEN commit)

**2. [Rule 1 - Bug] Fixed TypeScript strict mode errors**
- **Found during:** Task 2 verification
- **Issue:** TypeScript strict mode flagged `personIds[i]` as potentially undefined, test file had optional chaining issue
- **Fix:** Added non-null assertion (`!`) where index is guaranteed valid, added `?.` in test
- **Files modified:** src/lib/calculate.ts, tests/calculate.test.ts
- **Verification:** `bunx tsc --noEmit` passes with no errors
- **Committed in:** 5599d6a (part of GREEN commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug fix)
**Impact on plan:** Both necessary for TypeScript compliance. No scope creep.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Calculation engine complete and tested
- All CALC-01, CALC-02, CALC-03 requirements satisfied
- Ready for Phase 2: Core UI components can import and use calculateBill
- Types are exported for use in React components

---
*Phase: 01-foundation*
*Completed: 2026-01-19*
