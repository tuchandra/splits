const STORAGE_KEY = "splits-diners";

/**
 * Load diner names from localStorage.
 * Returns empty array if not found or invalid.
 */
export function loadDiners(): string[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return [];
  }
  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Save diner names to localStorage.
 */
export function saveDiners(diners: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(diners));
}
