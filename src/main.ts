import { loadDiners, saveDiners } from "./lib/storage.ts";
import { calculateBill, type BillInput } from "./lib/calculate.ts";

// Types

export interface Dish {
  id: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  assignedTo: string[];
}

export interface AppState {
  diners: string[];
  dishes: Dish[];
  taxCents: number;
  tipCents: number;
  enteredTotalCents: number | null;
}

// App state - initialized from localStorage
let state: AppState = {
  diners: loadDiners(),
  dishes: [],
  taxCents: 0,
  tipCents: 0,
  enteredTotalCents: null,
};

/**
 * Get diners that have non-empty names (for assignment chips).
 */
export function getNamedDiners(): string[] {
  return state.diners.filter((d) => d.trim() !== "");
}

/**
 * Format cents as dollars (e.g., 1234 -> "$12.34").
 */
function formatCents(cents: number): string {
  return "$" + (cents / 100).toFixed(2);
}

/**
 * Get total cents for a dish (quantity x unit price).
 */
function getDishTotalCents(dish: Dish): number {
  return dish.quantity * dish.unitPriceCents;
}

/**
 * Get subtotal of all dishes in cents.
 */
function getSubtotalCents(): number {
  return state.dishes.reduce((sum, dish) => sum + getDishTotalCents(dish), 0);
}

/**
 * Get calculated total (subtotal + tax + tip) in cents.
 */
function getCalculatedTotalCents(): number {
  return getSubtotalCents() + state.taxCents + state.tipCents;
}

/**
 * Render the entire app.
 */
function render(): void {
  const app = document.getElementById("app");
  if (!app) return;

  // Track focused element before clearing DOM
  const activeEl = document.activeElement as HTMLInputElement | null;
  let focusData: { type: string; index: string | undefined } | null = null;

  if (activeEl) {
    // Identify by class and data-index
    if (activeEl.classList.contains("diner-input")) {
      focusData = { type: "diner", index: activeEl.dataset.index };
    } else if (activeEl.classList.contains("dish-name-input")) {
      focusData = { type: "dish-name", index: activeEl.dataset.index };
    } else if (activeEl.classList.contains("dish-qty-input")) {
      focusData = { type: "dish-qty", index: activeEl.dataset.index };
    } else if (activeEl.classList.contains("dish-price-input")) {
      focusData = { type: "dish-price", index: activeEl.dataset.index };
    } else if (activeEl.classList.contains("totals-input")) {
      // For totals inputs, identify by label (tax, tip, total)
      const label = activeEl.closest(".input-group")?.querySelector("label")?.textContent?.toLowerCase();
      focusData = { type: "totals-" + (label || "unknown"), index: undefined };
    }
  }

  // Clear existing content
  app.innerHTML = "";

  // Render Diners section
  const dinersSection = renderDinersSection();
  app.appendChild(dinersSection);

  // Render Dishes section
  const dishesSection = renderDishesSection();
  app.appendChild(dishesSection);

  // Render Bill Totals section
  const billTotalsSection = renderBillTotalsSection();
  app.appendChild(billTotalsSection);

  // Render Individual Shares section
  const sharesSection = renderSharesSection();
  app.appendChild(sharesSection);

  // Restore focus after render
  if (focusData) {
    setTimeout(() => {
      let selector: string | null = null;
      if (focusData!.type === "diner") {
        selector = `.diner-input[data-index="${focusData!.index}"]`;
      } else if (focusData!.type === "dish-name") {
        selector = `.dish-name-input[data-index="${focusData!.index}"]`;
      } else if (focusData!.type === "dish-qty") {
        selector = `.dish-qty-input[data-index="${focusData!.index}"]`;
      } else if (focusData!.type === "dish-price") {
        selector = `.dish-price-input[data-index="${focusData!.index}"]`;
      } else if (focusData!.type.startsWith("totals-")) {
        const labelText = focusData!.type.replace("totals-", "");
        // Find input group with matching label
        const groups = document.querySelectorAll(".input-group");
        for (const group of groups) {
          const label = group.querySelector("label")?.textContent?.toLowerCase();
          if (label === labelText) {
            const input = group.querySelector<HTMLInputElement>(".totals-input");
            input?.focus();
            return;
          }
        }
      }

      if (selector) {
        const element = document.querySelector<HTMLInputElement>(selector);
        element?.focus();
      }
    }, 0);
  }
}

/**
 * Render the Diners section with add/edit/delete functionality.
 */
function renderDinersSection(): HTMLElement {
  const section = document.createElement("section");
  section.className = "diners-section";

  // Header
  const header = document.createElement("h2");
  header.textContent = "Diners";
  section.appendChild(header);

  // Diner list container
  const dinerList = document.createElement("div");
  dinerList.className = "diner-list";

  // Render each diner
  state.diners.forEach((dinerName, index) => {
    const dinerItem = document.createElement("div");
    dinerItem.className = "diner-item";

    // Name input
    const input = document.createElement("input");
    input.type = "text";
    input.className = "diner-input";
    input.value = dinerName;
    input.placeholder = "Name";
    input.dataset.index = String(index);

    input.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      const idx = Number(target.dataset.index);
      state.diners[idx] = target.value;
      saveDiners(state.diners);
      render();
    });

    // Enter key adds new diner
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        state.diners.push("");
        saveDiners(state.diners);
        render();
        // Focus new input after render
        setTimeout(() => {
          const inputs = document.querySelectorAll<HTMLInputElement>(".diner-input");
          const lastInput = inputs[inputs.length - 1];
          lastInput?.focus();
        }, 0);
      }
    });

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "X";
    deleteBtn.dataset.index = String(index);

    deleteBtn.addEventListener("click", (e) => {
      const target = e.target as HTMLButtonElement;
      const idx = Number(target.dataset.index);
      const deletedDiner = state.diners[idx];
      state.diners.splice(idx, 1);
      saveDiners(state.diners);

      // Clean up assignedTo arrays - remove deleted diner from all dishes
      if (deletedDiner) {
        for (const dish of state.dishes) {
          const assignedIdx = dish.assignedTo.indexOf(deletedDiner);
          if (assignedIdx >= 0) {
            dish.assignedTo.splice(assignedIdx, 1);
          }
        }
      }

      render();
    });

    dinerItem.appendChild(input);
    dinerItem.appendChild(deleteBtn);
    dinerList.appendChild(dinerItem);
  });

  // Empty state hint
  if (state.diners.length === 0) {
    const emptyHint = document.createElement("div");
    emptyHint.className = "empty-hint";
    emptyHint.textContent = "Add diners to get started";
    dinerList.appendChild(emptyHint);
  }

  section.appendChild(dinerList);

  // Add Diner button
  const addBtn = document.createElement("button");
  addBtn.className = "add-btn";
  addBtn.textContent = "+ Add Diner";

  addBtn.addEventListener("click", () => {
    state.diners.push("");
    saveDiners(state.diners);
    render();

    // Focus the new input after DOM updates
    setTimeout(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>(".diner-input");
      const lastInput = inputs[inputs.length - 1];
      if (lastInput) {
        lastInput.focus();
      }
    }, 0);
  });

  section.appendChild(addBtn);

  return section;
}

/**
 * Render the Dishes section with add/edit/delete and tab-through flow.
 */
function renderDishesSection(): HTMLElement {
  const section = document.createElement("section");
  section.className = "dishes-section";

  // Header
  const header = document.createElement("h2");
  header.textContent = "Dishes";
  section.appendChild(header);

  // Dish list container
  const dishList = document.createElement("div");
  dishList.className = "dish-list";

  // Render each dish
  state.dishes.forEach((dish, index) => {
    const dishCard = document.createElement("div");
    // Check if dish is unassigned (no named diners assigned)
    const namedDinersForDish = getNamedDiners();
    const hasAssignment = dish.assignedTo.some((d) => namedDinersForDish.includes(d));
    const isUnassigned = !hasAssignment && dish.name.trim() !== "";
    dishCard.className = isUnassigned ? "dish-card dish-unassigned" : "dish-card";

    // Name input
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "dish-name-input";
    nameInput.value = dish.name;
    nameInput.placeholder = "Item name";
    nameInput.dataset.index = String(index);

    nameInput.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      const idx = Number(target.dataset.index);
      state.dishes[idx]!.name = target.value;
      render();
    });

    // Enter key moves to qty input
    nameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const row = (e.target as HTMLElement).closest(".dish-card");
        const qtyInput = row?.querySelector<HTMLInputElement>(".dish-qty-input");
        qtyInput?.focus();
      }
    });

    // Quantity input
    const qtyInput = document.createElement("input");
    qtyInput.type = "number";
    qtyInput.className = "dish-qty-input";
    qtyInput.value = String(dish.quantity);
    qtyInput.min = "0";
    qtyInput.dataset.index = String(index);

    qtyInput.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      const idx = Number(target.dataset.index);
      const val = parseInt(target.value, 10);
      // Allow qty=0 (comped/removed items) but default NaN to 1
      state.dishes[idx]!.quantity = isNaN(val) ? 1 : Math.max(0, val);
      render();
    });

    // Enter key moves to price input
    qtyInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const row = (e.target as HTMLElement).closest(".dish-card");
        const priceInput = row?.querySelector<HTMLInputElement>(".dish-price-input");
        priceInput?.focus();
      }
    });

    // Price input (dollars for UX, stored as cents)
    const priceInput = document.createElement("input");
    priceInput.type = "number";
    priceInput.className = "dish-price-input";
    priceInput.value = dish.unitPriceCents > 0 ? (dish.unitPriceCents / 100).toFixed(2) : "";
    priceInput.placeholder = "0.00";
    priceInput.step = "0.01";
    priceInput.min = "0";
    priceInput.dataset.index = String(index);

    priceInput.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      const idx = Number(target.dataset.index);
      const val = parseFloat(target.value);
      state.dishes[idx]!.unitPriceCents = isNaN(val) ? 0 : Math.round(val * 100);
      render();
    });

    // Tab/Enter flow: if last row and has name, create new dish; else move to next row
    priceInput.addEventListener("keydown", (e) => {
      const isTab = e.key === "Tab" && !e.shiftKey;
      const isEnter = e.key === "Enter";

      if (isTab || isEnter) {
        const idx = Number((e.target as HTMLInputElement).dataset.index);
        const isLastRow = idx === state.dishes.length - 1;
        const currentDish = state.dishes[idx];

        if (isLastRow && currentDish && currentDish.name.trim() !== "") {
          e.preventDefault();
          // Add new dish
          state.dishes.push({
            id: crypto.randomUUID(),
            name: "",
            quantity: 1,
            unitPriceCents: 0,
            assignedTo: [],
          });
          render();

          // Focus the new name input after render
          setTimeout(() => {
            const nameInputs = document.querySelectorAll<HTMLInputElement>(".dish-name-input");
            const lastNameInput = nameInputs[nameInputs.length - 1];
            if (lastNameInput) {
              lastNameInput.focus();
            }
          }, 0);
        } else if (isEnter && !isLastRow) {
          // Enter on non-last row moves to next dish's name input
          e.preventDefault();
          const nextNameInput = document.querySelectorAll<HTMLInputElement>(".dish-name-input")[idx + 1];
          nextNameInput?.focus();
        }
        // Tab on non-last row follows natural tab order
      }
    });

    // Line total display
    const lineTotal = document.createElement("span");
    lineTotal.className = "dish-line-total";
    lineTotal.textContent = formatCents(getDishTotalCents(dish));

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "X";
    deleteBtn.dataset.index = String(index);

    deleteBtn.addEventListener("click", (e) => {
      const target = e.target as HTMLButtonElement;
      const idx = Number(target.dataset.index);
      state.dishes.splice(idx, 1);
      render();
    });

    // Assignment chips container
    const chipsContainer = document.createElement("div");
    chipsContainer.className = "assignment-chips";

    const namedDiners = getNamedDiners();
    if (namedDiners.length > 0) {
      // "All" toggle button
      const allBtn = document.createElement("button");
      allBtn.type = "button";
      const allAssigned = namedDiners.every((d) => dish.assignedTo.includes(d));
      allBtn.className = allAssigned ? "chip chip-all chip-assigned" : "chip chip-all";
      allBtn.textContent = "All";
      allBtn.dataset.index = String(index);

      allBtn.addEventListener("click", (e) => {
        const idx = Number((e.target as HTMLButtonElement).dataset.index);
        const currentDish = state.dishes[idx]!;
        const allDiners = getNamedDiners();
        const currentlyAllAssigned = allDiners.every((d) => currentDish.assignedTo.includes(d));

        if (currentlyAllAssigned) {
          // Unassign everyone
          currentDish.assignedTo = [];
        } else {
          // Assign everyone
          currentDish.assignedTo = [...allDiners];
        }
        render();
      });

      chipsContainer.appendChild(allBtn);

      // Individual diner chips
      for (const dinerName of namedDiners) {
        const chip = document.createElement("button");
        chip.type = "button";
        const isAssigned = dish.assignedTo.includes(dinerName);
        chip.className = isAssigned ? "chip chip-assigned" : "chip";
        chip.textContent = dinerName;
        chip.dataset.index = String(index);
        chip.dataset.diner = dinerName;

        chip.addEventListener("click", (e) => {
          const target = e.target as HTMLButtonElement;
          const idx = Number(target.dataset.index);
          const diner = target.dataset.diner!;
          const currentDish = state.dishes[idx]!;

          const dinerIndex = currentDish.assignedTo.indexOf(diner);
          if (dinerIndex >= 0) {
            // Remove assignment
            currentDish.assignedTo.splice(dinerIndex, 1);
          } else {
            // Add assignment
            currentDish.assignedTo.push(diner);
          }
          render();
        });

        chipsContainer.appendChild(chip);
      }
    } else if (state.dishes.length > 0 && state.diners.length === 0) {
      // Hint when no diners
      const hint = document.createElement("span");
      hint.className = "chips-hint";
      hint.textContent = "Add diners above";
      chipsContainer.appendChild(hint);
    }

    // Add "Unassigned" label if dish has name but no valid assignments
    if (isUnassigned && namedDiners.length > 0) {
      const unassignedLabel = document.createElement("span");
      unassignedLabel.className = "unassigned-label";
      unassignedLabel.textContent = "Unassigned";
      chipsContainer.appendChild(unassignedLabel);
    }

    // Assemble dish card
    const dishInputsRow = document.createElement("div");
    dishInputsRow.className = "dish-inputs-row";
    dishInputsRow.appendChild(nameInput);
    dishInputsRow.appendChild(qtyInput);
    dishInputsRow.appendChild(priceInput);
    dishInputsRow.appendChild(lineTotal);
    dishInputsRow.appendChild(deleteBtn);

    dishCard.appendChild(dishInputsRow);
    dishCard.appendChild(chipsContainer);
    dishList.appendChild(dishCard);
  });

  // Empty state hint
  if (state.dishes.length === 0) {
    const emptyHint = document.createElement("div");
    emptyHint.className = "empty-hint";
    emptyHint.textContent = "Add dishes to split";
    dishList.appendChild(emptyHint);
  }

  section.appendChild(dishList);

  // Add Dish button
  const addBtn = document.createElement("button");
  addBtn.className = "add-btn";
  addBtn.textContent = "+ Add Dish";

  addBtn.addEventListener("click", () => {
    state.dishes.push({
      id: crypto.randomUUID(),
      name: "",
      quantity: 1,
      unitPriceCents: 0,
      assignedTo: [],
    });
    render();

    // Focus the new name input after DOM updates
    setTimeout(() => {
      const nameInputs = document.querySelectorAll<HTMLInputElement>(".dish-name-input");
      const lastNameInput = nameInputs[nameInputs.length - 1];
      if (lastNameInput) {
        lastNameInput.focus();
      }
    }, 0);
  });

  section.appendChild(addBtn);

  return section;
}

/**
 * Render the Bill Totals section with tax, tip, total inputs and validation.
 */
function renderBillTotalsSection(): HTMLElement {
  const section = document.createElement("section");
  section.className = "bill-totals-section";

  // Header
  const header = document.createElement("h2");
  header.textContent = "Bill Totals";
  section.appendChild(header);

  // Calculated values
  const subtotalCents = getSubtotalCents();
  const calculatedTotalCents = getCalculatedTotalCents();

  // Display row for subtotal and calculated total
  const displayRow = document.createElement("div");
  displayRow.className = "totals-display";

  const subtotalDisplay = document.createElement("div");
  subtotalDisplay.className = "total-display-item";
  subtotalDisplay.innerHTML = `<span class="total-label">Subtotal:</span> <span class="total-value">${formatCents(subtotalCents)}</span>`;
  displayRow.appendChild(subtotalDisplay);

  const calcTotalDisplay = document.createElement("div");
  calcTotalDisplay.className = "total-display-item";
  calcTotalDisplay.innerHTML = `<span class="total-label">Calculated Total:</span> <span class="total-value">${formatCents(calculatedTotalCents)}</span>`;
  displayRow.appendChild(calcTotalDisplay);

  section.appendChild(displayRow);

  // Input row for tax, tip, total
  const inputRow = document.createElement("div");
  inputRow.className = "totals-inputs";

  // Tax input
  const taxGroup = document.createElement("div");
  taxGroup.className = "input-group";
  const taxLabel = document.createElement("label");
  taxLabel.textContent = "Tax";
  const taxInput = document.createElement("input");
  taxInput.type = "number";
  taxInput.className = "totals-input";
  taxInput.value = state.taxCents > 0 ? (state.taxCents / 100).toFixed(2) : "";
  taxInput.placeholder = "0.00";
  taxInput.step = "0.01";
  taxInput.min = "0";
  taxInput.addEventListener("change", (e) => {
    const val = parseFloat((e.target as HTMLInputElement).value);
    state.taxCents = isNaN(val) ? 0 : Math.round(val * 100);
    render();
  });
  taxGroup.appendChild(taxLabel);
  taxGroup.appendChild(taxInput);
  inputRow.appendChild(taxGroup);

  // Tip input
  const tipGroup = document.createElement("div");
  tipGroup.className = "input-group";
  const tipLabel = document.createElement("label");
  tipLabel.textContent = "Tip";
  const tipInput = document.createElement("input");
  tipInput.type = "number";
  tipInput.className = "totals-input";
  tipInput.value = state.tipCents > 0 ? (state.tipCents / 100).toFixed(2) : "";
  tipInput.placeholder = "0.00";
  tipInput.step = "0.01";
  tipInput.min = "0";
  tipInput.addEventListener("change", (e) => {
    const val = parseFloat((e.target as HTMLInputElement).value);
    state.tipCents = isNaN(val) ? 0 : Math.round(val * 100);
    render();
  });
  tipGroup.appendChild(tipLabel);
  tipGroup.appendChild(tipInput);
  inputRow.appendChild(tipGroup);

  // Total input (for validation)
  const totalGroup = document.createElement("div");
  totalGroup.className = "input-group";
  const totalLabel = document.createElement("label");
  totalLabel.textContent = "Total (from receipt)";
  const totalInput = document.createElement("input");
  totalInput.type = "number";
  totalInput.className = "totals-input";
  totalInput.value = state.enteredTotalCents !== null ? (state.enteredTotalCents / 100).toFixed(2) : "";
  totalInput.placeholder = "0.00";
  totalInput.step = "0.01";
  totalInput.min = "0";

  // Check for mismatch
  const hasMismatch = state.enteredTotalCents !== null && state.enteredTotalCents !== calculatedTotalCents;
  if (hasMismatch) {
    totalInput.classList.add("warning");
  }

  totalInput.addEventListener("change", (e) => {
    const target = e.target as HTMLInputElement;
    if (target.value === "") {
      state.enteredTotalCents = null;
    } else {
      const val = parseFloat(target.value);
      state.enteredTotalCents = isNaN(val) ? null : Math.round(val * 100);
    }
    render();
  });

  totalGroup.appendChild(totalLabel);
  totalGroup.appendChild(totalInput);

  // Warning message
  if (hasMismatch && state.enteredTotalCents !== null) {
    const diff = Math.abs(state.enteredTotalCents - calculatedTotalCents);
    const warningMsg = document.createElement("div");
    warningMsg.className = "warning-message";
    warningMsg.textContent = `Off by ${formatCents(diff)}`;
    totalGroup.appendChild(warningMsg);
  }

  inputRow.appendChild(totalGroup);

  section.appendChild(inputRow);

  return section;
}

/**
 * Get the number of diners assigned to an item (for split annotation).
 */
function getItemSplitCount(itemId: string): number {
  const dish = state.dishes.find((d) => d.id === itemId);
  if (!dish) return 1;
  const namedDiners = getNamedDiners();
  return dish.assignedTo.filter((name) => namedDiners.includes(name)).length;
}

/**
 * Build BillInput from current state (shared by renderSharesSection and generateSummary).
 */
function buildBillInput(): BillInput | null {
  const namedDiners = getNamedDiners();
  const namedDishes = state.dishes.filter((d) => d.name.trim() !== "");

  if (namedDiners.length === 0 || namedDishes.length === 0) {
    return null;
  }

  return {
    items: namedDishes.map((d) => ({
      id: d.id,
      name: d.name,
      amountCents: d.quantity * d.unitPriceCents,
      assignedTo: d.assignedTo.filter((name) => namedDiners.includes(name)),
    })),
    taxCents: state.taxCents,
    tipCents: state.tipCents,
    feesCents: 0,
    participants: namedDiners,
  };
}

/**
 * Generate a plain text summary of the bill split.
 */
function generateSummary(): string {
  const billInput = buildBillInput();
  if (!billInput) {
    return "No bill to summarize";
  }

  const result = calculateBill(billInput);
  const lines: string[] = [];

  lines.push("Bill Split Summary");
  lines.push("==================");
  lines.push("");

  for (const share of result.shares) {
    lines.push(`${share.personId}: ${formatCents(share.totalCents)}`);
    for (const item of share.items) {
      const splitCount = getItemSplitCount(item.itemId);
      const splitNote = splitCount > 1 ? ` (split ${splitCount} ways)` : "";
      lines.push(`  - ${item.itemName}${splitNote}: ${formatCents(item.shareCents)}`);
    }
    if (share.taxCents > 0) {
      lines.push(`  Tax: ${formatCents(share.taxCents)}`);
    }
    if (share.tipCents > 0) {
      lines.push(`  Tip: ${formatCents(share.tipCents)}`);
    }
    lines.push("");
  }

  lines.push(`Total: ${formatCents(result.totalCents)}`);
  return lines.join("\n");
}

/**
 * Render the Individual Shares section showing each person's calculated total.
 */
function renderSharesSection(): HTMLElement {
  const section = document.createElement("section");
  section.className = "shares-section";

  // Header
  const header = document.createElement("h2");
  header.textContent = "Individual Shares";
  section.appendChild(header);

  const namedDiners = getNamedDiners();
  const namedDishes = state.dishes.filter((d) => d.name.trim() !== "");

  // Empty state handling
  if (namedDiners.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.className = "shares-empty";
    emptyMsg.textContent = "Add diners to see shares";
    section.appendChild(emptyMsg);
    return section;
  }

  if (namedDishes.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.className = "shares-empty";
    emptyMsg.textContent = "Add dishes to see shares";
    section.appendChild(emptyMsg);
    return section;
  }

  // Build BillInput from current state
  const billInput: BillInput = {
    items: namedDishes.map((d) => ({
      id: d.id,
      name: d.name,
      amountCents: d.quantity * d.unitPriceCents,
      assignedTo: d.assignedTo.filter((name) => namedDiners.includes(name)),
    })),
    taxCents: state.taxCents,
    tipCents: state.tipCents,
    feesCents: 0, // Not using fees in this app per CONTEXT.md
    participants: namedDiners,
  };

  const result = calculateBill(billInput);

  // Shares list
  const sharesList = document.createElement("div");
  sharesList.className = "shares-list";

  for (const share of result.shares) {
    // Create expandable details element
    const details = document.createElement("details");
    details.className = "share-details";

    // Summary shows name and total
    const summary = document.createElement("summary");
    summary.className = "share-row";

    const nameSpan = document.createElement("span");
    nameSpan.className = "share-name";
    nameSpan.textContent = share.personId;

    const amountSpan = document.createElement("span");
    amountSpan.className = "share-amount";
    amountSpan.textContent = formatCents(share.totalCents);

    summary.appendChild(nameSpan);
    summary.appendChild(amountSpan);
    details.appendChild(summary);

    // Breakdown content (shown when expanded)
    const breakdown = document.createElement("div");
    breakdown.className = "share-breakdown";

    // List of items
    for (const item of share.items) {
      const itemRow = document.createElement("div");
      itemRow.className = "breakdown-item";

      const splitCount = getItemSplitCount(item.itemId);
      const itemLabel = document.createElement("span");
      itemLabel.textContent =
        splitCount > 1 ? `${item.itemName} (split ${splitCount} ways)` : item.itemName;

      const itemAmount = document.createElement("span");
      itemAmount.textContent = formatCents(item.shareCents);

      itemRow.appendChild(itemLabel);
      itemRow.appendChild(itemAmount);
      breakdown.appendChild(itemRow);
    }

    // Tax/tip totals
    const totalsDiv = document.createElement("div");
    totalsDiv.className = "breakdown-totals";

    const subtotalRow = document.createElement("div");
    subtotalRow.textContent = `Subtotal: ${formatCents(share.subtotalCents)}`;
    totalsDiv.appendChild(subtotalRow);

    if (share.taxCents > 0) {
      const taxRow = document.createElement("div");
      taxRow.textContent = `Tax: ${formatCents(share.taxCents)}`;
      totalsDiv.appendChild(taxRow);
    }

    if (share.tipCents > 0) {
      const tipRow = document.createElement("div");
      tipRow.textContent = `Tip: ${formatCents(share.tipCents)}`;
      totalsDiv.appendChild(tipRow);
    }

    breakdown.appendChild(totalsDiv);
    details.appendChild(breakdown);
    sharesList.appendChild(details);
  }

  section.appendChild(sharesList);

  // Total row (sum of all shares)
  const totalRow = document.createElement("div");
  totalRow.className = "shares-total";
  totalRow.innerHTML = `<span>Total:</span> <span>${formatCents(result.totalCents)}</span>`;
  section.appendChild(totalRow);

  // Copy Summary button
  const copyContainer = document.createElement("div");
  copyContainer.className = "copy-container";

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "copy-btn";
  copyBtn.textContent = "Copy Summary";

  // Screen reader live region for copy status
  const copyFeedback = document.createElement("span");
  copyFeedback.className = "copy-feedback";
  copyFeedback.setAttribute("aria-live", "polite");
  copyFeedback.setAttribute("role", "status");

  copyBtn.addEventListener("click", () => {
    const summary = generateSummary();
    navigator.clipboard.writeText(summary).then(() => {
      copyBtn.textContent = "Copied!";
      copyBtn.classList.add("copy-success");
      copyFeedback.textContent = "Summary copied to clipboard";

      setTimeout(() => {
        copyBtn.textContent = "Copy Summary";
        copyBtn.classList.remove("copy-success");
        copyFeedback.textContent = "";
      }, 2000);
    });
  });

  copyContainer.appendChild(copyBtn);
  copyContainer.appendChild(copyFeedback);
  section.appendChild(copyContainer);

  return section;
}

// Initial render
render();
