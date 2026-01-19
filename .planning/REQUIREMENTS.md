# Requirements: Splits

**Defined:** 2025-01-18
**Core Value:** Quickly and accurately split a restaurant bill so everyone pays their fair share

## v1 Requirements

### Entry

- [ ] **ENTRY-01**: User can add line items with name and amount
- [ ] **ENTRY-02**: User can edit existing line items
- [ ] **ENTRY-03**: User can delete line items
- [ ] **ENTRY-04**: User can enter tax, tip, and fees as separate amounts

### Assignment

- [ ] **ASSIGN-01**: User can assign each item to one or more people
- [ ] **ASSIGN-02**: User can assign item to "everyone" with one action
- [ ] **ASSIGN-03**: User can see which items are unassigned
- [ ] **ASSIGN-04**: User can see running total vs expected total (sanity check)

### Calculation

- [ ] **CALC-01**: Tax/tip/fees divided proportionally by each person's subtotal
- [ ] **CALC-02**: Shared items split evenly among assigned people
- [ ] **CALC-03**: Final amount per person calculated correctly

### Output

- [ ] **OUT-01**: User can see final amount each person owes
- [ ] **OUT-02**: User can export/copy a summary (items, who had them, amounts)

### Friends

- [ ] **FRIEND-01**: Preset list of friends stored in localStorage
- [ ] **FRIEND-02**: User can add new friends on the fly
- [ ] **FRIEND-03**: User can select friends participating in this bill

### UX

- [ ] **UX-01**: Mobile-friendly responsive design
- [ ] **UX-02**: Keyboard shortcuts for common actions on desktop

## v2 Requirements

### OCR

- **OCR-01**: Upload receipt image and extract line items via OCR
- **OCR-02**: Recognize and exclude subtotal/total lines automatically

## Out of Scope

| Feature | Reason |
|---------|--------|
| Payment integration (Venmo, etc.) | Just show amounts, settle manually |
| Bill history / saved bills | Ephemeral use case |
| Account system / login | Pure client-side app |
| Multi-currency | USD only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ENTRY-01 | Phase 2 | Pending |
| ENTRY-02 | Phase 2 | Pending |
| ENTRY-03 | Phase 2 | Pending |
| ENTRY-04 | Phase 2 | Pending |
| ASSIGN-01 | Phase 2 | Pending |
| ASSIGN-02 | Phase 2 | Pending |
| ASSIGN-03 | Phase 2 | Pending |
| ASSIGN-04 | Phase 2 | Pending |
| CALC-01 | Phase 1 | Pending |
| CALC-02 | Phase 1 | Pending |
| CALC-03 | Phase 1 | Pending |
| OUT-01 | Phase 3 | Pending |
| OUT-02 | Phase 3 | Pending |
| FRIEND-01 | Phase 2 | Pending |
| FRIEND-02 | Phase 2 | Pending |
| FRIEND-03 | Phase 2 | Pending |
| UX-01 | Phase 2 | Pending |
| UX-02 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0

---
*Requirements defined: 2025-01-18*
*Last updated: 2025-01-18 after roadmap creation*
