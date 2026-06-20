import { create } from "zustand";
import type {
  Participant,
  Expense,
  AppState,
  ActivityTemplate,
  RecurringExpense,
  RecurrenceType,
  ExpensePreset,
  ShareType,
} from "@/types";
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

function ensureExpenseDefaults(expense: Partial<Expense> & { amount: number; payerId: string; participantIds: string[] }): Omit<Expense, "id" | "createdAt"> {
  return {
    amount: expense.amount,
    payerId: expense.payerId,
    participantIds: expense.participantIds,
    note: expense.note || "",
    shareType: (expense.shareType as ShareType) || "equal",
    shareWeights: expense.shareWeights || [],
  };
}

function sanitizeExpensesAfterRemoveParticipant(expenses: Expense[], removedId: string): Expense[] {
  return expenses
    .map((e) => ({
      ...e,
      participantIds: e.participantIds.filter((pid) => pid !== removedId),
      shareWeights: e.shareWeights.filter((w) => w.participantId !== removedId),
    }))
    .filter((e) => e.payerId !== removedId && e.participantIds.length > 0);
}

function normalizeTemplate(t: any): ActivityTemplate {
  return {
    id: t.id,
    name: t.name,
    participants: t.participants || [],
    expensePresets: Array.isArray(t.expensePresets) ? t.expensePresets : [],
    createdAt: t.createdAt,
  };
}

function normalizeExpense(e: any): Expense {
  return {
    id: e.id,
    amount: e.amount,
    payerId: e.payerId,
    participantIds: e.participantIds,
    note: e.note || "",
    shareType: (e.shareType as ShareType) || "equal",
    shareWeights: Array.isArray(e.shareWeights) ? e.shareWeights : [],
    createdAt: e.createdAt,
  };
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
      const expenses = sanitizeExpensesAfterRemoveParticipant(state.expenses, id);

      saveToStorage(participants, expenses, state.templates, state.recurringExpenses);
      return { participants, expenses };
    });
  },

  addExpense: (expense) => {
    if (expense.amount <= 0 || !expense.payerId || expense.participantIds.length === 0) {
      return;
    }

    const normalized = ensureExpenseDefaults(expense);
    const newExpense: Expense = {
      ...normalized,
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
      expensePresets: [],
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

  addExpensePreset: (templateId: string, preset: Omit<ExpensePreset, "id">) => {
    if (!preset.name.trim() || !preset.payerName || preset.participantNames.length === 0) return;

    const newPreset: ExpensePreset = {
      ...preset,
      id: generateId(),
    };

    set((state) => {
      const templates = state.templates.map((t) => {
        if (t.id === templateId) {
          return {
            ...t,
            expensePresets: [newPreset, ...t.expensePresets],
          };
        }
        return t;
      });
      saveToStorage(state.participants, state.expenses, templates, state.recurringExpenses);
      return { templates };
    });
  },

  removeExpensePreset: (templateId: string, presetId: string) => {
    set((state) => {
      const templates = state.templates.map((t) => {
        if (t.id === templateId) {
          return {
            ...t,
            expensePresets: t.expensePresets.filter((p) => p.id !== presetId),
          };
        }
        return t;
      });
      saveToStorage(state.participants, state.expenses, templates, state.recurringExpenses);
      return { templates };
    });
  },

  applyTemplate: (id: string) => {
    const template = get().templates.find((t) => t.id === id);
    if (!template) return { addedParticipants: 0, addedExpenses: 0 };

    let addedParticipants = 0;
    let addedExpenses = 0;

    set((state) => {
      let updatedParticipants = [...state.participants];
      let updatedExpenses = [...state.expenses];

      template.participants.forEach((name) => {
        const exists = updatedParticipants.some(
          (p) => p.name.toLowerCase() === name.toLowerCase()
        );
        if (!exists) {
          updatedParticipants.push({
            id: generateId(),
            name,
          });
          addedParticipants++;
        }
      });

      const findParticipantId = (name: string): string | undefined => {
        return updatedParticipants.find(
          (p) => p.name.toLowerCase() === name.toLowerCase()
        )?.id;
      };

      template.expensePresets.forEach((preset) => {
        if (preset.defaultAmount == null || preset.defaultAmount <= 0) return;

        const payerId = findParticipantId(preset.payerName);
        if (!payerId) return;

        const participantIds: string[] = [];
        preset.participantNames.forEach((name) => {
          const pid = findParticipantId(name);
          if (pid) participantIds.push(pid);
        });
        if (participantIds.length === 0) return;

        const shareWeights = preset.shareWeights
          .map((w) => {
            const pid = findParticipantId(w.participantName);
            if (!pid) return null;
            return { participantId: pid, weight: w.weight };
          })
          .filter(Boolean) as { participantId: string; weight: number }[];

        const newExpense: Expense = {
          id: generateId(),
          amount: preset.defaultAmount,
          payerId,
          participantIds,
          note: preset.note || preset.name,
          shareType: preset.shareType,
          shareWeights,
          createdAt: new Date().toISOString(),
        };

        updatedExpenses = [newExpense, ...updatedExpenses];
        addedExpenses++;
      });

      saveToStorage(updatedParticipants, updatedExpenses, state.templates, state.recurringExpenses);
      return { participants: updatedParticipants, expenses: updatedExpenses };
    });

    return { addedParticipants, addedExpenses };
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
        shareType: "equal",
        shareWeights: [],
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
      const expenses = Array.isArray(data.expenses)
        ? data.expenses.map(normalizeExpense)
        : [];
      const templates = Array.isArray(data.templates)
        ? data.templates.map(normalizeTemplate)
        : [];

      set({
        participants: data.participants,
        expenses,
        templates,
        recurringExpenses: Array.isArray(data.recurringExpenses) ? data.recurringExpenses : [],
      });
    }
  },
}));
