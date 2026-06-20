import { create } from "zustand";
import type { Participant, Expense, AppState, ActivityTemplate, RecurringExpense, RecurrenceType } from "@/types";
import { saveToStorage, loadFromStorage, clearStorage } from "@/utils/storage";

function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

function isSamePeriod(date1: Date, date2: Date, recurrence: RecurrenceType): boolean {
  if (recurrence === "daily") {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }
  if (recurrence === "weekly") {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const day1 = d1.getDay() || 7;
    d1.setDate(d1.getDate() - day1 + 1);
    const day2 = d2.getDay() || 7;
    d2.setDate(d2.getDate() - day2 + 1);
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
}

export const useAppStore = create<AppState>((set, get) => ({
  participants: [],
  expenses: [],
  templates: [],
  recurringExpenses: [],

  addParticipant: (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const exists = get().participants.some(
      (p) => p.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) return;

    const newParticipant: Participant = {
      id: generateId(),
      name: trimmed,
    };

    set((state) => {
      const participants = [...state.participants, newParticipant];
      saveToStorage(participants, state.expenses, state.templates, state.recurringExpenses);
      return { participants };
    });
  },

  removeParticipant: (id: string) => {
    set((state) => {
      const participants = state.participants.filter((p) => p.id !== id);
      const expenses = state.expenses
        .map((e) => ({
          ...e,
          participantIds: e.participantIds.filter((pid) => pid !== id),
        }))
        .filter((e) => e.payerId !== id && e.participantIds.length > 0);

      saveToStorage(participants, expenses, state.templates, state.recurringExpenses);
      return { participants, expenses };
    });
  },

  addExpense: (expense) => {
    if (expense.amount <= 0 || !expense.payerId || expense.participantIds.length === 0) {
      return;
    }

    const newExpense: Expense = {
      ...expense,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };

    set((state) => {
      const expenses = [newExpense, ...state.expenses];
      saveToStorage(state.participants, expenses, state.templates, state.recurringExpenses);
      return { expenses };
    });
  },

  removeExpense: (id: string) => {
    set((state) => {
      const expenses = state.expenses.filter((e) => e.id !== id);
      saveToStorage(state.participants, expenses, state.templates, state.recurringExpenses);
      return { expenses };
    });
  },

  addTemplate: (name: string, participantNames: string[]) => {
    const trimmed = name.trim();
    if (!trimmed || participantNames.length === 0) return;

    const newTemplate: ActivityTemplate = {
      id: generateId(),
      name: trimmed,
      participants: [...participantNames],
      createdAt: new Date().toISOString(),
    };

    set((state) => {
      const templates = [newTemplate, ...state.templates];
      saveToStorage(state.participants, state.expenses, templates, state.recurringExpenses);
      return { templates };
    });
  },

  removeTemplate: (id: string) => {
    set((state) => {
      const templates = state.templates.filter((t) => t.id !== id);
      saveToStorage(state.participants, state.expenses, templates, state.recurringExpenses);
      return { templates };
    });
  },

  applyTemplate: (id: string) => {
    const template = get().templates.find((t) => t.id === id);
    if (!template) return;

    set((state) => {
      let updatedParticipants = [...state.participants];

      template.participants.forEach((name) => {
        const exists = updatedParticipants.some(
          (p) => p.name.toLowerCase() === name.toLowerCase()
        );
        if (!exists) {
          updatedParticipants.push({
            id: generateId(),
            name,
          });
        }
      });

      saveToStorage(updatedParticipants, state.expenses, state.templates, state.recurringExpenses);
      return { participants: updatedParticipants };
    });
  },

  addRecurringExpense: (expense) => {
    if (
      expense.amount <= 0 ||
      !expense.name.trim() ||
      !expense.payerName.trim() ||
      expense.participantNames.length === 0
    ) {
      return;
    }

    const newRecurring: RecurringExpense = {
      ...expense,
      name: expense.name.trim(),
      payerName: expense.payerName.trim(),
      note: expense.note.trim(),
      id: generateId(),
      createdAt: new Date().toISOString(),
      lastAppliedAt: null,
    };

    set((state) => {
      const recurringExpenses = [newRecurring, ...state.recurringExpenses];
      saveToStorage(state.participants, state.expenses, state.templates, recurringExpenses);
      return { recurringExpenses };
    });
  },

  removeRecurringExpense: (id: string) => {
    set((state) => {
      const recurringExpenses = state.recurringExpenses.filter((r) => r.id !== id);
      saveToStorage(state.participants, state.expenses, state.templates, recurringExpenses);
      return { recurringExpenses };
    });
  },

  applyRecurringExpenses: () => {
    const now = new Date();
    const state = get();
    let newExpenses = [...state.expenses];
    let updatedParticipants = [...state.participants];
    let updatedRecurring = [...state.recurringExpenses];
    let hasChanges = false;

    const ensureParticipant = (name: string): string => {
      const existing = updatedParticipants.find(
        (p) => p.name.toLowerCase() === name.toLowerCase()
      );
      if (existing) return existing.id;
      const newP: Participant = {
        id: generateId(),
        name,
      };
      updatedParticipants.push(newP);
      hasChanges = true;
      return newP.id;
    };

    updatedRecurring = updatedRecurring.map((re) => {
      const lastApplied = re.lastAppliedAt ? new Date(re.lastAppliedAt) : null;

      if (lastApplied && isSamePeriod(lastApplied, now, re.recurrence)) {
        return re;
      }

      const payerId = ensureParticipant(re.payerName);
      const participantIds = re.participantNames.map((n) => ensureParticipant(n));

      const expenseNote = re.note
        ? `${re.note} (${re.recurrence === "monthly" ? "每月" : re.recurrence === "weekly" ? "每周" : "每日"}重复)`
        : `${re.name} (${re.recurrence === "monthly" ? "每月" : re.recurrence === "weekly" ? "每周" : "每日"}重复)`;

      const newExpense: Expense = {
        id: generateId(),
        amount: re.amount,
        payerId,
        participantIds,
        note: expenseNote,
        createdAt: new Date().toISOString(),
      };

      newExpenses = [newExpense, ...newExpenses];
      hasChanges = true;

      return {
        ...re,
        lastAppliedAt: now.toISOString(),
      };
    });

    if (hasChanges) {
      set({
        participants: updatedParticipants,
        expenses: newExpenses,
        recurringExpenses: updatedRecurring,
      });
      saveToStorage(updatedParticipants, newExpenses, state.templates, updatedRecurring);
    }
  },

  resetAll: () => {
    clearStorage();
    set({ participants: [], expenses: [], templates: [], recurringExpenses: [] });
  },

  loadState: () => {
    const data = loadFromStorage();
    if (data) {
      set({
        participants: data.participants,
        expenses: data.expenses,
        templates: data.templates,
        recurringExpenses: data.recurringExpenses,
      });
    }
  },
}));
