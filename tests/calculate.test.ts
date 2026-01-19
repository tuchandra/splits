import { describe, test, expect } from "vitest";
import {
  calculateBill,
  splitEvenly,
  allocateProportionally,
  type LineItem,
  type BillInput,
  type PersonShare,
  type BillResult,
} from "../src/lib/calculate";

describe("splitEvenly", () => {
  test("splits evenly when divisible", () => {
    const result = splitEvenly(1000, ["alice", "bob"]);
    expect(result.get("alice")).toBe(500);
    expect(result.get("bob")).toBe(500);
  });

  test("distributes remainder penny to first person", () => {
    const result = splitEvenly(1001, ["alice", "bob"]);
    const total = (result.get("alice") ?? 0) + (result.get("bob") ?? 0);
    expect(total).toBe(1001);
    // One person gets 501, other gets 500
    expect(result.get("alice")).toBe(501);
    expect(result.get("bob")).toBe(500);
  });

  test("distributes multiple remainder pennies round-robin", () => {
    const result = splitEvenly(1003, ["alice", "bob", "charlie"]);
    const total =
      (result.get("alice") ?? 0) +
      (result.get("bob") ?? 0) +
      (result.get("charlie") ?? 0);
    expect(total).toBe(1003);
    // 1003 / 3 = 334 remainder 1 -> alice: 335, bob: 334, charlie: 334
    // Wait: 334 * 3 = 1002, remainder = 1
    expect(result.get("alice")).toBe(335);
    expect(result.get("bob")).toBe(334);
    expect(result.get("charlie")).toBe(334);
  });

  test("handles single person", () => {
    const result = splitEvenly(1000, ["alice"]);
    expect(result.get("alice")).toBe(1000);
  });

  test("handles empty array", () => {
    const result = splitEvenly(1000, []);
    expect(result.size).toBe(0);
  });

  test("handles zero amount", () => {
    const result = splitEvenly(0, ["alice", "bob"]);
    expect(result.get("alice")).toBe(0);
    expect(result.get("bob")).toBe(0);
  });
});

describe("allocateProportionally", () => {
  test("allocates by weight ratio", () => {
    const result = allocateProportionally(500, [
      { id: "alice", weight: 30 },
      { id: "bob", weight: 20 },
    ]);
    expect(result.get("alice")).toBe(300); // 60%
    expect(result.get("bob")).toBe(200); // 40%
  });

  test("handles remainder distribution", () => {
    const result = allocateProportionally(100, [
      { id: "alice", weight: 1 },
      { id: "bob", weight: 1 },
      { id: "charlie", weight: 1 },
    ]);
    const total = [...result.values()].reduce((a, b) => a + b, 0);
    expect(total).toBe(100); // No lost pennies
    // 100 / 3 = 33 remainder 1
    // One person gets the extra penny
  });

  test("handles zero total weight - returns zero for all", () => {
    const result = allocateProportionally(500, [
      { id: "alice", weight: 0 },
      { id: "bob", weight: 0 },
    ]);
    // When all weights are zero, no one gets anything
    expect(result.get("alice")).toBe(0);
    expect(result.get("bob")).toBe(0);
  });

  test("handles empty shares array", () => {
    const result = allocateProportionally(500, []);
    expect(result.size).toBe(0);
  });

  test("handles single person with all weight", () => {
    const result = allocateProportionally(500, [{ id: "alice", weight: 100 }]);
    expect(result.get("alice")).toBe(500);
  });

  test("handles very uneven weights", () => {
    const result = allocateProportionally(100, [
      { id: "alice", weight: 99 },
      { id: "bob", weight: 1 },
    ]);
    expect(result.get("alice")).toBe(99);
    expect(result.get("bob")).toBe(1);
  });
});

describe("calculateBill", () => {
  test("splits shared item evenly", () => {
    const result = calculateBill({
      items: [
        { id: "1", name: "Pizza", amountCents: 2000, assignedTo: ["alice", "bob"] },
      ],
      taxCents: 0,
      tipCents: 0,
      feesCents: 0,
      participants: ["alice", "bob"],
    });

    const alice = result.shares.find((s) => s.personId === "alice");
    const bob = result.shares.find((s) => s.personId === "bob");
    expect(alice?.subtotalCents).toBe(1000);
    expect(bob?.subtotalCents).toBe(1000);
  });

  test("splits item with remainder penny", () => {
    const result = calculateBill({
      items: [
        { id: "1", name: "Item", amountCents: 1001, assignedTo: ["alice", "bob"] },
      ],
      taxCents: 0,
      tipCents: 0,
      feesCents: 0,
      participants: ["alice", "bob"],
    });

    const alice = result.shares.find((s) => s.personId === "alice");
    const bob = result.shares.find((s) => s.personId === "bob");
    expect((alice?.subtotalCents ?? 0) + (bob?.subtotalCents ?? 0)).toBe(1001);
  });

  test("allocates tax proportionally", () => {
    const result = calculateBill({
      items: [
        { id: "1", name: "Steak", amountCents: 3000, assignedTo: ["alice"] },
        { id: "2", name: "Salad", amountCents: 2000, assignedTo: ["bob"] },
      ],
      taxCents: 500,
      tipCents: 0,
      feesCents: 0,
      participants: ["alice", "bob"],
    });

    const alice = result.shares.find((s) => s.personId === "alice");
    const bob = result.shares.find((s) => s.personId === "bob");
    expect(alice?.taxCents).toBe(300); // 60% of $5
    expect(bob?.taxCents).toBe(200); // 40% of $5
  });

  test("allocates tip proportionally", () => {
    const result = calculateBill({
      items: [
        { id: "1", name: "Steak", amountCents: 3000, assignedTo: ["alice"] },
        { id: "2", name: "Salad", amountCents: 2000, assignedTo: ["bob"] },
      ],
      taxCents: 0,
      tipCents: 1000,
      feesCents: 0,
      participants: ["alice", "bob"],
    });

    const alice = result.shares.find((s) => s.personId === "alice");
    const bob = result.shares.find((s) => s.personId === "bob");
    expect(alice?.tipCents).toBe(600); // 60% of $10
    expect(bob?.tipCents).toBe(400); // 40% of $10
  });

  test("allocates fees proportionally", () => {
    const result = calculateBill({
      items: [
        { id: "1", name: "Steak", amountCents: 3000, assignedTo: ["alice"] },
        { id: "2", name: "Salad", amountCents: 2000, assignedTo: ["bob"] },
      ],
      taxCents: 0,
      tipCents: 0,
      feesCents: 200,
      participants: ["alice", "bob"],
    });

    const alice = result.shares.find((s) => s.personId === "alice");
    const bob = result.shares.find((s) => s.personId === "bob");
    expect(alice?.feesCents).toBe(120); // 60% of $2
    expect(bob?.feesCents).toBe(80); // 40% of $2
  });

  test("handles multiple items with mixed assignment", () => {
    // Burger ($15) -> Alice, Fries ($5) -> Alice+Bob, Drink ($4) -> Bob
    // Alice subtotal = $15 + $2.50 = $17.50 (1750 cents)
    // Bob subtotal = $2.50 + $4 = $6.50 (650 cents)
    const result = calculateBill({
      items: [
        { id: "1", name: "Burger", amountCents: 1500, assignedTo: ["alice"] },
        { id: "2", name: "Fries", amountCents: 500, assignedTo: ["alice", "bob"] },
        { id: "3", name: "Drink", amountCents: 400, assignedTo: ["bob"] },
      ],
      taxCents: 0,
      tipCents: 0,
      feesCents: 0,
      participants: ["alice", "bob"],
    });

    const alice = result.shares.find((s) => s.personId === "alice");
    const bob = result.shares.find((s) => s.personId === "bob");
    expect(alice?.subtotalCents).toBe(1750);
    expect(bob?.subtotalCents).toBe(650);
  });

  test("tracks unassigned items", () => {
    const result = calculateBill({
      items: [
        { id: "1", name: "Burger", amountCents: 1500, assignedTo: ["alice"] },
        { id: "2", name: "Mystery Item", amountCents: 500, assignedTo: [] },
      ],
      taxCents: 0,
      tipCents: 0,
      feesCents: 0,
      participants: ["alice"],
    });

    expect(result.unassignedItems).toHaveLength(1);
    expect(result.unassignedItems[0]?.id).toBe("2");
  });

  test("total equals sum of shares (no lost pennies)", () => {
    const result = calculateBill({
      items: [
        { id: "1", name: "Item 1", amountCents: 1500, assignedTo: ["alice"] },
        { id: "2", name: "Item 2", amountCents: 2500, assignedTo: ["bob"] },
        { id: "3", name: "Shared", amountCents: 1000, assignedTo: ["alice", "bob"] },
      ],
      taxCents: 500,
      tipCents: 1000,
      feesCents: 200,
      participants: ["alice", "bob"],
    });

    const sumOfTotals = result.shares.reduce((sum, s) => sum + s.totalCents, 0);
    expect(sumOfTotals).toBe(result.totalCents);
    // Items: 1500 + 2500 + 1000 = 5000
    // Extra: 500 + 1000 + 200 = 1700
    // Total: 6700
    expect(result.totalCents).toBe(6700);
  });

  test("handles zero subtotal - tax/tip/fees allocated evenly", () => {
    // Edge case: items are $0, but there's tax/tip/fees
    const result = calculateBill({
      items: [
        { id: "1", name: "Free Item", amountCents: 0, assignedTo: ["alice", "bob"] },
      ],
      taxCents: 100,
      tipCents: 100,
      feesCents: 100,
      participants: ["alice", "bob"],
    });

    // When subtotals are zero, tax/tip/fees should be split evenly
    const alice = result.shares.find((s) => s.personId === "alice");
    const bob = result.shares.find((s) => s.personId === "bob");

    // Each person should get 50 of tax, tip, and fees
    expect(alice?.taxCents).toBe(50);
    expect(alice?.tipCents).toBe(50);
    expect(alice?.feesCents).toBe(50);
    expect(bob?.taxCents).toBe(50);
    expect(bob?.tipCents).toBe(50);
    expect(bob?.feesCents).toBe(50);
  });

  test("handles single person - pays 100% of everything", () => {
    const result = calculateBill({
      items: [
        { id: "1", name: "Meal", amountCents: 2000, assignedTo: ["alice"] },
      ],
      taxCents: 200,
      tipCents: 400,
      feesCents: 100,
      participants: ["alice"],
    });

    const alice = result.shares.find((s) => s.personId === "alice");
    expect(alice?.subtotalCents).toBe(2000);
    expect(alice?.taxCents).toBe(200);
    expect(alice?.tipCents).toBe(400);
    expect(alice?.feesCents).toBe(100);
    expect(alice?.totalCents).toBe(2700);
    expect(result.totalCents).toBe(2700);
  });

  test("includes item breakdown in PersonShare", () => {
    const result = calculateBill({
      items: [
        { id: "1", name: "Burger", amountCents: 1500, assignedTo: ["alice"] },
        { id: "2", name: "Fries", amountCents: 500, assignedTo: ["alice", "bob"] },
      ],
      taxCents: 0,
      tipCents: 0,
      feesCents: 0,
      participants: ["alice", "bob"],
    });

    const alice = result.shares.find((s) => s.personId === "alice");
    expect(alice?.items).toHaveLength(2);
    expect(alice?.items.find((i) => i.itemId === "1")?.shareCents).toBe(1500);
    expect(alice?.items.find((i) => i.itemId === "2")?.shareCents).toBe(250);
  });

  test("handles participant who ordered nothing", () => {
    const result = calculateBill({
      items: [
        { id: "1", name: "Meal", amountCents: 2000, assignedTo: ["alice"] },
      ],
      taxCents: 0,
      tipCents: 0,
      feesCents: 0,
      participants: ["alice", "bob"],
    });

    // Bob is a participant but has no items assigned
    const bob = result.shares.find((s) => s.personId === "bob");
    expect(bob?.subtotalCents).toBe(0);
    expect(bob?.totalCents).toBe(0);
  });

  test("handles complex full bill calculation", () => {
    // Real-world scenario:
    // Alice: Steak ($30), shared appetizer ($10 / 3)
    // Bob: Pasta ($20), shared appetizer ($10 / 3)
    // Charlie: Salad ($15), shared appetizer ($10 / 3)
    // Tax: $6, Tip: $12, Fees: $3
    const result = calculateBill({
      items: [
        { id: "1", name: "Steak", amountCents: 3000, assignedTo: ["alice"] },
        { id: "2", name: "Pasta", amountCents: 2000, assignedTo: ["bob"] },
        { id: "3", name: "Salad", amountCents: 1500, assignedTo: ["charlie"] },
        {
          id: "4",
          name: "Appetizer",
          amountCents: 1000,
          assignedTo: ["alice", "bob", "charlie"],
        },
      ],
      taxCents: 600,
      tipCents: 1200,
      feesCents: 300,
      participants: ["alice", "bob", "charlie"],
    });

    // Subtotals:
    // Alice: 3000 + 334 = 3334 (appetizer: 1000/3 = 333 r1, first gets extra)
    // Bob: 2000 + 333 = 2333
    // Charlie: 1500 + 333 = 1833
    // Total subtotal: 7500

    // Tax allocation (total 600):
    // Alice: 600 * 3334/7500 = 266.72 -> 267 (proportional)
    // Bob: 600 * 2333/7500 = 186.64 -> 186
    // Charlie: 600 * 1833/7500 = 146.64 -> 147
    // Note: exact values depend on remainder distribution

    const totalCents = result.shares.reduce((sum, s) => sum + s.totalCents, 0);
    expect(totalCents).toBe(result.totalCents);
    expect(result.totalCents).toBe(3000 + 2000 + 1500 + 1000 + 600 + 1200 + 300);
  });
});
