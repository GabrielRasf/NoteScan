import { STORAGE_KEYS } from './keys';
import { readJson, writeJson } from './jsonStore';

function isExpense(value) {
  return Boolean(
    value &&
      typeof value.id === 'string' &&
      typeof value.amount === 'number' &&
      Number.isFinite(value.amount) &&
      (value.description === null || typeof value.description === 'string') &&
      (value.date === null || typeof value.date === 'string') &&
      typeof value.category === 'string' &&
      (value.ocrText === null || typeof value.ocrText === 'string') &&
      (value.receiptImage === undefined ||
        value.receiptImage === null ||
        typeof value.receiptImage === 'string') &&
      typeof value.createdAt === 'string'
  );
}

function sortExpenses(expenses) {
  return expenses.slice().sort((a, b) => {
    if (a.createdAt === b.createdAt) return a.id < b.id ? 1 : -1;
    return a.createdAt < b.createdAt ? 1 : -1;
  });
}

async function readExpenses() {
  const result = await readJson(STORAGE_KEYS.expenses, []);
  if (!result.ok) return { ok: false, value: [] };
  if (result.empty) return { ok: true, value: [] };
  if (!Array.isArray(result.value) || !result.value.every(isExpense)) {
    return { ok: false, value: [] };
  }
  return { ok: true, value: sortExpenses(result.value) };
}

export async function listExpenses() {
  return readExpenses();
}

export async function saveExpense(expense) {
  if (!isExpense(expense)) return { ok: false, value: [] };
  const current = await readExpenses();
  if (!current.ok) return current;
  const next = sortExpenses([
    ...current.value.filter((item) => item.id !== expense.id),
    expense,
  ]);
  const written = await writeJson(STORAGE_KEYS.expenses, next);
  if (!written.ok) return { ok: false, value: current.value };
  return { ok: true, value: next };
}

export async function updateExpense(id, expense) {
  if (!isExpense(expense) || expense.id !== id) return { ok: false, value: [] };
  const current = await readExpenses();
  if (!current.ok) return current;
  if (!current.value.some((item) => item.id === id)) return { ok: false, value: current.value };
  const next = sortExpenses(current.value.map((item) => (item.id === id ? expense : item)));
  const written = await writeJson(STORAGE_KEYS.expenses, next);
  if (!written.ok) return { ok: false, value: current.value };
  return { ok: true, value: next };
}

export async function removeExpense(id) {
  const current = await readExpenses();
  if (!current.ok) return current;
  const next = current.value.filter((item) => item.id !== id);
  const written = await writeJson(STORAGE_KEYS.expenses, next);
  if (!written.ok) return { ok: false, value: current.value };
  return { ok: true, value: next };
}
