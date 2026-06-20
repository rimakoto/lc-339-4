import type { Participant, Expense, ActivityTemplate, RecurringExpense } from "@/types";

const STORAGE_KEY = "bill-splitter-data-v1";

interface StoredData {
  participants: Participant[];
  expenses: Expense[];
  templates: ActivityTemplate[];
  recurringExpenses: RecurringExpense[];
}

export function saveToStorage(
  participants: Participant[],
  expenses: Expense[],
  templates: ActivityTemplate[] = [],
  recurringExpenses: RecurringExpense[] = []
): void {
  try {
    const data: StoredData = { participants, expenses, templates, recurringExpenses };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save to localStorage:", e);
  }
}

export function loadFromStorage(): StoredData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as StoredData;
    if (!Array.isArray(data.participants) || !Array.isArray(data.expenses)) {
      return null;
    }
    return {
      participants: data.participants,
      expenses: data.expenses,
      templates: Array.isArray(data.templates) ? data.templates : [],
      recurringExpenses: Array.isArray(data.recurringExpenses) ? data.recurringExpenses : [],
    };
  } catch (e) {
    console.error("Failed to load from localStorage:", e);
    return null;
  }
}

export function clearStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear localStorage:", e);
  }
}
