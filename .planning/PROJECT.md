# Splits

## What This Is

A bill splitter web app for settling restaurant bills after the fact. When Tushar pays the full bill, this tool helps calculate what each friend owes by assigning line items to people and proportionally dividing tax, tip, and fees.

## Core Value

Quickly and accurately split a restaurant bill so everyone pays their fair share, with no mental math and no missed items.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Enter line items manually (name + amount)
- [ ] Assign each item to one or more people
- [ ] Tax, tip, and fees entered as amounts and divided proportionally by what each person ordered
- [ ] Track which items are unassigned (nothing falls through the cracks)
- [ ] Show final amount each person owes
- [ ] Exportable summary for notes (items + who had them + amounts)
- [ ] Preset list of ~10 friends stored in localStorage
- [ ] Add new friends on the fly
- [ ] Smart enough to recognize subtotal/total as non-items (for future OCR)
- [ ] Mobile-friendly UI
- [ ] Keyboard shortcuts for desktop power users

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

## Constraints

- **Deployment**: Static site at tusharc.dev/split (GitHub deployments)
- **Stack**: TypeScript + Bun only (no npm, no plain JavaScript)
- **Architecture**: Core split logic as pure functions with unit tests
- **UX**: Mobile-first, but with keyboard shortcuts for desktop efficiency

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Static site (no backend) | Simple deployment, no auth needed, ephemeral use case | — Pending |
| LocalStorage for friends | Persistence without backend, ~10 items is fine | — Pending |
| Proportional fee distribution | Fairest approach — fees scale with what you ordered | — Pending |
| No runtime dependencies for logic | Inline all utils/math; keeps bundle tiny, no supply chain risk | Phase 1 |

---
*Last updated: 2025-01-18 after initialization*
