import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, LEGACY_STORAGE_KEYS } from '../services/storage/keys';
import { listCategories, saveCategories } from '../services/storage/categoriesStore';
import {
  listExpenses,
  removeExpense,
  saveExpense,
  updateExpense,
} from '../services/storage/expensesStore';

function expense(overrides = {}) {
  return {
    id: 'exp-1',
    amount: 10,
    description: 'Padaria',
    date: '2026-03-10',
    category: 'Supermercado',
    ocrText: 'PADARIA',
    createdAt: '2026-03-10T12:00:00.000Z',
    ...overrides,
  };
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('categorias', () => {
  test('salva e lê de novo depois de reabrir o armazenamento', async () => {
    const saved = await saveCategories({ Supermercado: true, Pets: false, Energia: true });
    expect(saved.ok).toBe(true);
    expect(saved.value).toEqual({ Supermercado: true, Energia: true });

    const loaded = await listCategories();
    expect(loaded).toEqual({ ok: true, value: { Supermercado: true, Energia: true } });
  });

  test('aproveita a chave antiga de categorias', async () => {
    await AsyncStorage.setItem(
      LEGACY_STORAGE_KEYS.categories,
      JSON.stringify({ Pets: true })
    );

    await expect(listCategories()).resolves.toEqual({ ok: true, value: { Pets: true } });
    await expect(AsyncStorage.getItem(STORAGE_KEYS.categories)).resolves.toBe(
      JSON.stringify({ Pets: true })
    );
  });

  test('não apaga JSON ilegível', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.categories, '{');
    const loaded = await listCategories();
    expect(loaded.ok).toBe(false);
    await expect(AsyncStorage.getItem(STORAGE_KEYS.categories)).resolves.toBe('{');
  });
});

describe('gastos', () => {
  // Relê o armazenamento no mesmo processo. Não reinicia o sistema operacional.
  test('cria, recupera, atualiza e remove um gasto', async () => {
    const created = await saveExpense(expense());
    expect(created.ok).toBe(true);
    await expect(listExpenses()).resolves.toEqual({ ok: true, value: [expense()] });

    const updated = await updateExpense('exp-1', expense({ amount: 12, description: 'Mercado' }));
    expect(updated.ok).toBe(true);
    const listed = await listExpenses();
    expect(listed.value[0].amount).toBe(12);
    expect(listed.value[0].description).toBe('Mercado');
    expect(listed.value[0].ocrText).toBe('PADARIA');

    const removed = await removeExpense('exp-1');
    expect(removed).toEqual({ ok: true, value: [] });
    await expect(listExpenses()).resolves.toEqual({ ok: true, value: [] });
  });

  test('desativar categoria não apaga gastos antigos', async () => {
    await saveExpense(expense({ category: 'Pets' }));
    await saveCategories({ Supermercado: true });

    const listed = await listExpenses();
    expect(listed.value[0].category).toBe('Pets');
  });

  test('não substitui uma lista de gastos ilegível', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.expenses, '{');
    const saved = await saveExpense(expense());
    expect(saved.ok).toBe(false);
    await expect(AsyncStorage.getItem(STORAGE_KEYS.expenses)).resolves.toBe('{');
  });
});
