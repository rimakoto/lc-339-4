export interface Participant {
  id: string;
  name: string;
}

export type ShareType = "equal" | "weighted";

export interface ShareWeight {
  participantId: string;
  weight: number;
}

export interface Expense {
  id: string;
  amount: number;
  payerId: string;
  participantIds: string[];
  note: string;
  shareType: ShareType;
  shareWeights: ShareWeight[];
  createdAt: string;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export interface Balance {
  participantId: string;
  name: string;
  balance: number;
  paid: number;
  share: number;
}

export interface ExpensePreset {
  id: string;
  name: string;
  defaultAmount: number | null;
  payerName: string;
  participantNames: string[];
  shareType: ShareType;
  shareWeights: { participantName: string; weight: number }[];
  note: string;
}

export interface ActivityTemplate {
  id: string;
  name: string;
  participants: string[];
  expensePresets: ExpensePreset[];
  createdAt: string;
}

export type RecurrenceType = "monthly" | "weekly" | "daily";

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  recurrence: RecurrenceType;
  payerName: string;
  participantNames: string[];
  note: string;
  lastAppliedAt: string | null;
  createdAt: string;
}

export interface AppState {
  participants: Participant[];
  expenses: Expense[];
  templates: ActivityTemplate[];
  recurringExpenses: RecurringExpense[];
  addParticipant: (name: string) => void;
  removeParticipant: (id: string) => void;
  addExpense: (expense: Omit<Expense, "id" | "createdAt">) => void;
  removeExpense: (id: string) => void;
  addTemplate: (name: string, participantNames: string[]) => void;
  removeTemplate: (id: string) => void;
  addExpensePreset: (templateId: string, preset: Omit<ExpensePreset, "id">) => void;
  removeExpensePreset: (templateId: string, presetId: string) => void;
  applyTemplate: (id: string) => { addedParticipants: number; addedExpenses: number };
  addRecurringExpense: (expense: Omit<RecurringExpense, "id" | "createdAt" | "lastAppliedAt">) => void;
  removeRecurringExpense: (id: string) => void;
  applyRecurringExpenses: () => void;
  resetAll: () => void;
  loadState: () => void;
}
