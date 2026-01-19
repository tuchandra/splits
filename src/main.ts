import { calculateBill } from "./lib/calculate.ts";

// Simple demo to verify the module loads correctly
const result = calculateBill({
  items: [
    { id: "1", name: "Demo Item", amountCents: 1000, assignedTo: ["alice", "bob"] },
  ],
  taxCents: 100,
  tipCents: 200,
  feesCents: 50,
  participants: ["alice", "bob"],
});

console.log("Split app loaded. Demo calculation:", result.totalCents, "cents total");
