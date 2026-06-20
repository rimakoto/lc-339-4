import type { Participant, Expense, Settlement, Balance } from "@/types";

const EPSILON = 0.01;

export function round2(num: number): number {
  return Math.round(num * 100) / 100;
}

export function calculateBalances(
  participants: Participant[],
  expenses: Expense[]
): Balance[] {
  const balanceMap = new Map<string, { paid: number; share: number }>();

  participants.forEach((p) => {
    balanceMap.set(p.id, { paid: 0, share: 0 });
  });

  expenses.forEach((expense) => {
    const payerData = balanceMap.get(expense.payerId);
    if (payerData) {
      payerData.paid += expense.amount;
    }

    const shareAmount = expense.amount / expense.participantIds.length;
    expense.participantIds.forEach((pid) => {
      const pData = balanceMap.get(pid);
      if (pData) {
        pData.share += shareAmount;
      }
    });
  });

  return participants.map((p) => {
    const data = balanceMap.get(p.id) || { paid: 0, share: 0 };
    return {
      participantId: p.id,
      name: p.name,
      paid: round2(data.paid),
      share: round2(data.share),
      balance: round2(data.paid - data.share),
    };
  });
}

export function calculateSettlements(
  participants: Participant[],
  expenses: Expense[]
): Settlement[] {
  const balances = calculateBalances(participants, expenses);

  const creditors: { id: string; name: string; amount: number }[] = [];
  const debtors: { id: string; name: string; amount: number }[] = [];

  balances.forEach((b) => {
    if (b.balance > EPSILON) {
      creditors.push({ id: b.participantId, name: b.name, amount: b.balance });
    } else if (b.balance < -EPSILON) {
      debtors.push({ id: b.participantId, name: b.name, amount: Math.abs(b.balance) });
    }
  });

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > EPSILON) {
      settlements.push({
        from: debtor.name,
        to: creditor.name,
        amount: round2(amount),
      });
    }

    debtor.amount = round2(debtor.amount - amount);
    creditor.amount = round2(creditor.amount - amount);

    if (debtor.amount <= EPSILON) i++;
    if (creditor.amount <= EPSILON) j++;
  }

  return settlements;
}

export function getTotalExpense(expenses: Expense[]): number {
  return round2(expenses.reduce((sum, e) => sum + e.amount, 0));
}
