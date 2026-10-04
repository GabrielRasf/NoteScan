import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { render } from '@testing-library/react-native';
import DistributionChart from '../components/DistributionChart';
import { filterCatalog, isKnownCategory } from '../data/categories';
import { summarizeExpenses } from '../services/chart/summarize';
import {
  DEMO_CATEGORIES,
  DEMO_EXPENSE_COUNT,
  buildDemoExpenses,
  isDemoExpense,
  resetDemoData,
  seedDemoData,
} from '../services/dev/demoExpenses';
import { createId } from '../services/expenses/expense';
import { formatBrl, roundMoney } from '../services/expenses/money';
import { listCategories, saveCategories } from '../services/storage/categoriesStore';
import { listExpenses, saveExpense, updateExpense } from '../services/storage/expensesStore';
import { STORAGE_KEYS } from '../services/storage/keys';

const NOW = new Date(2026, 9, 4, 9, 30);
const DAY_MS = 24 * 60 * 60 * 1000;

function realExpense(id, overrides = {}) {
  return {
    id,
    amount: 32.5,
    description: 'Feira do bairro',
    date: '2026-09-20',
    category: 'Supermercado',
    ocrText: null,
    receiptImage: null,
    createdAt: '2026-09-20T15:00:00.000Z',
    ...overrides,
  };
}

function localDate(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('seed de demonstração', () => {
  test('grava de 25 a 40 gastos fictícios na mesma chave do AsyncStorage usada pelo app', async () => {
    const result = await seedDemoData({ now: NOW });

    expect(result).toMatchObject({ ok: true, added: DEMO_EXPENSE_COUNT, alreadySeeded: false });
    expect(DEMO_EXPENSE_COUNT).toBeGreaterThanOrEqual(25);
    expect(DEMO_EXPENSE_COUNT).toBeLessThanOrEqual(40);

    const raw = JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.expenses));
    expect(raw).toHaveLength(DEMO_EXPENSE_COUNT);
    raw.forEach((expense) => {
      expect(isDemoExpense(expense)).toBe(true);
      expect(expense.receiptImage).toBeNull();
      expect(expense.ocrText).toBeNull();
    });
    const listed = await listExpenses();
    expect(listed.ok).toBe(true);
    expect(listed.value).toHaveLength(DEMO_EXPENSE_COUNT);
  });

  test('repetir o seed, inclusive com dois toques ao mesmo tempo, não duplica nem desfaz edições', async () => {
    const [first, second] = await Promise.all([seedDemoData({ now: NOW }), seedDemoData({ now: NOW })]);
    expect(second).toBe(first);
    expect(first.added).toBe(DEMO_EXPENSE_COUNT);

    const edited = { ...(await listExpenses()).value[0], description: 'Padaria editada' };
    await updateExpense(edited.id, edited);

    const again = await seedDemoData({ now: new Date(NOW.getTime() + DAY_MS) });
    expect(again).toMatchObject({ ok: true, added: 0, alreadySeeded: true });

    const stored = (await listExpenses()).value;
    expect(stored).toHaveLength(DEMO_EXPENSE_COUNT);
    expect(new Set(stored.map((expense) => expense.id)).size).toBe(DEMO_EXPENSE_COUNT);
    expect(stored.find((expense) => expense.id === edited.id).description).toBe('Padaria editada');
  });

  test('um novo carregamento do app lê os mesmos gastos e preferências do armazenamento', async () => {
    await seedDemoData({ now: NOW });

    let reloaded;
    await new Promise((resolve, reject) => {
      jest.isolateModules(() => {
        jest.doMock('@react-native-async-storage/async-storage', () => AsyncStorage);
        const expensesStore = require('../services/storage/expensesStore');
        const categoriesStore = require('../services/storage/categoriesStore');
        Promise.all([expensesStore.listExpenses(), categoriesStore.listCategories()])
          .then((value) => {
            reloaded = value;
            resolve();
          })
          .catch(reject);
      });
    });

    const [expenses, categories] = reloaded;
    expect(expenses.ok).toBe(true);
    expect(expenses.value.map((expense) => expense.id)).toEqual(
      buildDemoExpenses(NOW)
        .slice()
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .map((expense) => expense.id)
    );
    DEMO_CATEGORIES.forEach((name) => expect(categories.value[name]).toBe(true));
  });

  test('o reset remove só os fictícios e só as preferências que o seed marcou', async () => {
    await saveExpense(realExpense('real-feira'));
    await saveCategories({ Supermercado: true, 'Plano de Saúde': true });

    await seedDemoData({ now: NOW });
    const seededCategories = (await listCategories()).value;
    expect(seededCategories['Plano de Saúde']).toBe(true);
    DEMO_CATEGORIES.forEach((name) => expect(seededCategories[name]).toBe(true));

    const demoToEdit = (await listExpenses()).value.find(isDemoExpense);
    await updateExpense(demoToEdit.id, { ...demoToEdit, amount: 99.99 });
    await saveExpense(realExpense('real-cinema', { category: 'Viagens', description: 'Passagem', createdAt: '2026-10-03T12:00:00.000Z' }));
    await saveCategories({ ...seededCategories, Viagens: true });

    const reset = await resetDemoData();

    expect(reset).toMatchObject({ ok: true, removed: DEMO_EXPENSE_COUNT });
    expect((await listExpenses()).value.map((expense) => expense.id)).toEqual(['real-cinema', 'real-feira']);
    expect((await listCategories()).value).toEqual({ Supermercado: true, 'Plano de Saúde': true, Viagens: true });

    const reseeded = await seedDemoData({ now: NOW });
    expect(reseeded.added).toBe(DEMO_EXPENSE_COUNT);
  });

  test('gastos reais nunca são confundidos com os fictícios', async () => {
    for (let index = 0; index < 200; index += 1) expect(isDemoExpense({ id: createId() })).toBe(false);

    const real = realExpense(createId(), { description: 'demo- no texto não importa' });
    await saveExpense(real);
    await seedDemoData({ now: NOW });
    await resetDemoData();

    expect((await listExpenses()).value).toEqual([real]);
  });
});

describe('conteúdo da demonstração', () => {
  const expenses = buildDemoExpenses(NOW);

  test('valores variados, com centavos, de pequenos a grandes', () => {
    const amounts = expenses.map((expense) => expense.amount);
    amounts.forEach((amount) => {
      expect(amount).toBeGreaterThan(0);
      expect(roundMoney(amount)).toBe(amount);
    });
    expect(amounts.filter(Number.isInteger).length / amounts.length).toBeLessThan(0.25);
    expect(amounts.some((amount) => amount < 20)).toBe(true);
    expect(amounts.filter((amount) => amount >= 20 && amount < 300).length).toBeGreaterThan(15);
    expect(amounts.some((amount) => amount >= 1000)).toBe(true);
    expect(new Set(amounts).size).toBeGreaterThanOrEqual(25);
  });

  test('o gráfico real mostra o total em BRL e percentuais que somam 100%', () => {
    const summary = summarizeExpenses(expenses);
    const total = roundMoney(expenses.reduce((sum, expense) => sum + expense.amount, 0));
    const screen = render(<DistributionChart summary={summary} />);

    expect(screen.getByText(formatBrl(total))).toBeTruthy();
    const shares = screen.getAllByText(/^\d+%$/).map((node) => Number(node.props.children.join('').replace('%', '')));
    expect(shares).toHaveLength(DEMO_CATEGORIES.length);
    expect(shares.reduce((sum, share) => sum + share, 0)).toBe(100);
  });

  test('só categorias existentes, com pesos bem diferentes, todas visíveis no formulário', async () => {
    DEMO_CATEGORIES.forEach((name) => expect(isKnownCategory(name)).toBe(true));
    expect(DEMO_CATEGORIES.length).toBeGreaterThanOrEqual(8);

    const counts = DEMO_CATEGORIES.map((name) => expenses.filter((expense) => expense.category === name).length);
    expect(Math.max(...counts)).toBeGreaterThanOrEqual(2 * Math.min(...counts));
    const summary = summarizeExpenses(expenses);
    expect(summary[0].total).toBeGreaterThan(3 * summary[summary.length - 1].total);

    await seedDemoData({ now: NOW });
    const visible = filterCatalog((await listCategories()).value).flatMap((group) => group.subcategories);
    DEMO_CATEGORIES.forEach((name) => expect(visible).toContain(name));
  });

  test.each([
    ['de manhã', NOW],
    ['logo depois da meia-noite', new Date(2026, 9, 4, 0, 5)],
  ])('datas coerentes no formato do app, sem futuro, espalhadas pelos últimos meses (%s)', (label, now) => {
    const built = buildDemoExpenses(now);
    const today = localDate(now);
    built.forEach((expense) => {
      expect(expense.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(expense.date <= today).toBe(true);
      expect(new Date(expense.createdAt).getTime()).toBeLessThanOrEqual(now.getTime());
      expect(localDate(new Date(expense.createdAt))).toBe(expense.date);
    });
    const dates = built.map((expense) => expense.date);
    expect(new Set(dates).size).toBeGreaterThanOrEqual(30);
    expect(new Set(dates.map((date) => date.slice(0, 7))).size).toBeGreaterThanOrEqual(3);
    const weekAgo = localDate(new Date(now.getTime() - 7 * DAY_MS));
    expect(dates.filter((date) => date >= weekAgo).length).toBeGreaterThanOrEqual(3);
    expect(dates.slice().sort()[0] >= localDate(new Date(now.getTime() - 100 * DAY_MS))).toBe(true);
  });
});
