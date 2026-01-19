import { loadDiners, saveDiners } from "./lib/storage.ts";

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
      state.diners.splice(idx, 1);
      saveDiners(state.diners);
      render();
    });

    dinerItem.appendChild(input);
    dinerItem.appendChild(deleteBtn);
    dinerList.appendChild(dinerItem);
  });

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
    dishCard.className = "dish-card";

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
    qtyInput.min = "1";
    qtyInput.dataset.index = String(index);

    qtyInput.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      const idx = Number(target.dataset.index);
      const val = parseInt(target.value, 10);
      state.dishes[idx]!.quantity = isNaN(val) || val < 1 ? 1 : val;
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

    // Assemble dish card
    dishCard.appendChild(nameInput);
    dishCard.appendChild(qtyInput);
    dishCard.appendChild(priceInput);
    dishCard.appendChild(lineTotal);
    dishCard.appendChild(deleteBtn);
    dishList.appendChild(dishCard);
  });

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

// Initial render
render();
