import { roundMoney } from '../expenses/money';

export function summarizeExpenses(expenses) {
  const totals = new Map();

  for (const expense of expenses || []) {
    if (!expense || typeof expense.category !== 'string') continue;
    if (typeof expense.amount !== 'number' || !Number.isFinite(expense.amount) || expense.amount <= 0) {
      continue;
    }
    totals.set(expense.category, roundMoney((totals.get(expense.category) || 0) + expense.amount));
  }

  return Array.from(totals, ([category, total]) => ({ category, total })).sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    return a.category.localeCompare(b.category, 'pt-BR');
  });
}
