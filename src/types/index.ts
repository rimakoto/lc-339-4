export interface Participant {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  amount: number;
  payerId: string;
  participantIds: string[];
  note: string;
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

export interface ActivityTemplate {
  id: string;
  name: string;
  participants: string[];
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
  applyTemplate: (id: string) => void;
  addRecurringExpense: (expense: Omit<RecurringExpense, "id" | "createdAt" | "lastAppliedAt">) => void;
  removeRecurringExpense: (id: string) => void;
  applyRecurringExpenses: () => void;
  resetAll: () => void;
  loadState: () => void;
}
