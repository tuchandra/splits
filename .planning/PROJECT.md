# Splits

## What This Is

A bill splitter web app for settling restaurant bills after the fact. When Tushar pays the full bill, this tool helps calculate what each friend owes by assigning line items to people and proportionally dividing tax, tip, and fees.

## Core Value

Quickly and accurately split a restaurant bill so everyone pays their fair share, with no mental math and no missed items.

## Requirements

### Validated

- ✓ Enter line items manually (name + amount) — v1.0
- ✓ Assign each item to one or more people — v1.0
- ✓ Tax, tip, and fees divided proportionally — v1.0
- ✓ Track which items are unassigned — v1.0
- ✓ Show final amount each person owes — v1.0
- ✓ Exportable summary for notes — v1.0
- ✓ Preset list of friends in localStorage — v1.0
- ✓ Add new friends on the fly — v1.0
- ✓ Mobile-friendly UI — v1.0
- ✓ Keyboard navigation for desktop — v1.0

### Active

(None yet — run /gsd:new-milestone to define next goals)

### Out of Scope

- Payment integration (Venmo, etc.) — just show amounts, user settles manually
- Receipt history / saved bills — ephemeral, use it and done
- Account system / login — pure client-side app
- Multi-currency support — USD only
- Complex group entities (couples as units) — just assign to individual people

## Context

- Used at home after a meal, not at the restaurant
- Receipt image available on phone/computer for reference while entering
- ~10 regular friends in the group, occasional additions
- Common patterns: items eaten by 1 person, split by 2, or shared by entire table
- OCR receipt upload is desired for v2, not v1
- **Shipped v1.0:** 1,219 LOC TypeScript, 26 tests passing

## Constraints

- **Deployment**: Static site at tusharc.dev/split (GitHub deployments)
- **Stack**: TypeScript + Bun only (no npm, no plain JavaScript)
- **Architecture**: Core split logic as pure functions with unit tests
- **UX**: Mobile-first, but with keyboard shortcuts for desktop efficiency

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Static site (no backend) | Simple deployment, no auth needed, ephemeral use case | ✓ Good |
| LocalStorage for friends | Persistence without backend, ~10 items is fine | ✓ Good |
| Proportional fee distribution | Fairest approach — fees scale with what you ordered | ✓ Good |
| No runtime dependencies for logic | Inline all utils/math; keeps bundle tiny, no supply chain risk | ✓ Good |
| Integer cents for money | Avoid floating point errors in currency calculations | ✓ Good |
| Largest remainder method | Fair distribution of remainder pennies | ✓ Good |
| Full re-render pattern | Simple architecture, fast enough for this scale | ✓ Good |
| Deferred render in change handlers | Allows Tab navigation to complete before DOM rebuild | ✓ Good |

---
*Last updated: 2026-01-18 after v1.0 milestone*
