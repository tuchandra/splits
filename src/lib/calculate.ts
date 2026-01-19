// Types - all money values are integer cents

export interface LineItem {
  id: string;
  name: string;
  amountCents: number;
  assignedTo: string[]; // person IDs, empty = unassigned
}

export interface BillInput {
  items: LineItem[];
  taxCents: number;
  tipCents: number;
  feesCents: number;
  participants: string[]; // all people involved
}

export interface PersonShare {
  personId: string;
  items: { itemId: string; itemName: string; shareCents: number }[];
  subtotalCents: number; // sum of item shares
  taxCents: number; // proportional tax
  tipCents: number; // proportional tip
  feesCents: number; // proportional fees
  totalCents: number; // subtotal + tax + tip + fees
}

export interface BillResult {
  shares: PersonShare[];
  unassignedItems: LineItem[];
  totalCents: number; // sum of all shares (should match bill total)
}

/**
 * Split an amount evenly among people, distributing remainder pennies round-robin.
 */
export function splitEvenly(
  amountCents: number,
  personIds: string[]
): Map<string, number> {
  const result = new Map<string, number>();

  if (personIds.length === 0) {
    return result;
  }

  const baseAmount = Math.floor(amountCents / personIds.length);
  const remainder = amountCents % personIds.length;

  for (let i = 0; i < personIds.length; i++) {
    const personId = personIds[i]!;
    // First `remainder` people get an extra penny
    const share = baseAmount + (i < remainder ? 1 : 0);
    result.set(personId, share);
  }

  return result;
}

/**
 * Allocate an amount proportionally based on weights.
 * Uses largest remainder method for fair penny distribution.
 */
export function allocateProportionally(
  totalCents: number,
  shares: { id: string; weight: number }[]
): Map<string, number> {
  const result = new Map<string, number>();

  if (shares.length === 0) {
    return result;
  }

  const totalWeight = shares.reduce((sum, s) => sum + s.weight, 0);

  // If all weights are zero, everyone gets zero
  if (totalWeight === 0) {
    for (const share of shares) {
      result.set(share.id, 0);
    }
    return result;
  }

  // Calculate initial allocations and track remainders
  const allocations: { id: string; base: number; remainder: number }[] = [];
  let allocated = 0;

  for (const share of shares) {
    const exactShare = (totalCents * share.weight) / totalWeight;
    const base = Math.floor(exactShare);
    const remainder = exactShare - base;
    allocations.push({ id: share.id, base, remainder });
    allocated += base;
  }

  // Distribute remaining cents to those with largest fractional parts
  let remaining = totalCents - allocated;

  // Sort by remainder descending (largest first)
  const sortedByRemainder = [...allocations].sort(
    (a, b) => b.remainder - a.remainder
  );

  for (const allocation of sortedByRemainder) {
    if (remaining <= 0) break;
    allocation.base += 1;
    remaining -= 1;
  }

  // Set results
  for (const allocation of allocations) {
    result.set(allocation.id, allocation.base);
  }

  return result;
}

/**
 * Allocate an extra amount (tax/tip/fees) to person shares.
 * Uses proportional allocation when there are subtotals, otherwise splits evenly.
 */
function allocateExtra(
  amountCents: number,
  sharesMap: Map<string, PersonShare>,
  participants: string[],
  weights: { id: string; weight: number }[],
  useEvenSplit: boolean,
  field: "taxCents" | "tipCents" | "feesCents"
): void {
  if (amountCents <= 0) return;

  const allocation = useEvenSplit
    ? splitEvenly(amountCents, participants)
    : allocateProportionally(amountCents, weights);

  for (const [personId, amount] of allocation) {
    const share = sharesMap.get(personId);
    if (share) share[field] = amount;
  }
}

/**
 * Calculate bill shares for all participants.
 */
export function calculateBill(input: BillInput): BillResult {
  const { items, taxCents, tipCents, feesCents, participants } = input;

  // Initialize PersonShare for each participant
  const sharesMap = new Map<string, PersonShare>();
  for (const personId of participants) {
    sharesMap.set(personId, {
      personId,
      items: [],
      subtotalCents: 0,
      taxCents: 0,
      tipCents: 0,
      feesCents: 0,
      totalCents: 0,
    });
  }

  // Track unassigned items
  const unassignedItems: LineItem[] = [];

  // Step 1: Split each item among assigned people
  for (const item of items) {
    if (item.assignedTo.length === 0) {
      unassignedItems.push(item);
      continue;
    }

    const splits = splitEvenly(item.amountCents, item.assignedTo);

    for (const [personId, shareCents] of splits) {
      const personShare = sharesMap.get(personId);
      if (personShare) {
        personShare.items.push({
          itemId: item.id,
          itemName: item.name,
          shareCents,
        });
        personShare.subtotalCents += shareCents;
      }
    }
  }

  // Step 2: Calculate total subtotal for proportional allocation
  const totalSubtotal = [...sharesMap.values()].reduce(
    (sum, s) => sum + s.subtotalCents,
    0
  );

  // Build weights for proportional allocation
  const weights = [...sharesMap.entries()].map(([id, share]) => ({
    id,
    weight: share.subtotalCents,
  }));

  // If all subtotals are zero but we have participants, split evenly
  const useEvenSplit = totalSubtotal === 0 && participants.length > 0;

  // Step 3-5: Allocate tax, tip, and fees
  allocateExtra(taxCents, sharesMap, participants, weights, useEvenSplit, "taxCents");
  allocateExtra(tipCents, sharesMap, participants, weights, useEvenSplit, "tipCents");
  allocateExtra(feesCents, sharesMap, participants, weights, useEvenSplit, "feesCents");

  // Step 6: Calculate totals for each person
  for (const share of sharesMap.values()) {
    share.totalCents =
      share.subtotalCents + share.taxCents + share.tipCents + share.feesCents;
  }

  // Step 7: Build result
  const shares = [...sharesMap.values()];
  const totalCents = shares.reduce((sum, s) => sum + s.totalCents, 0);

  return {
    shares,
    unassignedItems,
    totalCents,
  };
}
