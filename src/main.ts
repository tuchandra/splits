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

// Initial render
render();
