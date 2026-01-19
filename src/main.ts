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

    // Tab flow: if last row and has name, create new dish on Tab
    priceInput.addEventListener("keydown", (e) => {
      if (e.key === "Tab" && !e.shiftKey) {
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
        }
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
    const shareRow = document.createElement("div");
    shareRow.className = "share-row";

    const nameSpan = document.createElement("span");
    nameSpan.className = "share-name";
    nameSpan.textContent = share.personId;

    const amountSpan = document.createElement("span");
    amountSpan.className = "share-amount";
    amountSpan.textContent = formatCents(share.totalCents);

    shareRow.appendChild(nameSpan);
    shareRow.appendChild(amountSpan);
    sharesList.appendChild(shareRow);
  }

  section.appendChild(sharesList);

  // Total row (sum of all shares)
  const totalRow = document.createElement("div");
  totalRow.className = "shares-total";
  totalRow.innerHTML = `<span>Total:</span> <span>${formatCents(result.totalCents)}</span>`;
  section.appendChild(totalRow);

  return section;
}

// Initial render
render();
