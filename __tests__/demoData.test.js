import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen } from '@testing-library/react-native';
import App from '../App';
import { applyDemoLaunch, applyDemoPurge, deleteDemoExpenses, demoExpenses } from '../services/dev/demoExpenses';
import { formatBrl, roundMoney } from '../services/expenses/money';
import { saveCategories } from '../services/storage/categoriesStore';
import { listExpenses, saveExpense } from '../services/storage/expensesStore';
import { STORAGE_KEYS } from '../services/storage/keys';

const demoTotal = demoExpenses.reduce((sum, expense) => roundMoney(sum + expense.amount), 0);

function realExpense() {
  return {
    id: 'real-padaria',
    amount: 10,
    description: 'Padaria',
    date: null,
    category: 'Supermercado',
    ocrText: null,
    createdAt: '2026-05-01T12:00:00.000Z',
  };
}

async function openTab(testID, readyText) {
  fireEvent.press(screen.getByTestId(testID));
  expect(await screen.findByText(readyText)).toBeTruthy();
}

describe('dados de demonstração', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test('a abertura grava os fictícios uma vez e o delete não deixa voltar', async () => {
    await saveExpense(realExpense());

    const first = await applyDemoLaunch(true);
    expect(first.applied).toBe(true);
    expect(first.added).toBe(demoExpenses.length);

    const second = await applyDemoLaunch(true);
    expect(second.applied).toBe(false);

    const stored = await listExpenses();
    expect(stored.value.filter((item) => item.id.startsWith('demo-'))).toHaveLength(demoExpenses.length);
    expect(stored.value.some((item) => item.id === 'real-padaria')).toBe(true);

    const removed = await deleteDemoExpenses();
    expect(removed.removed).toBe(demoExpenses.length);
    expect(removed.value).toEqual([realExpense()]);

    const after = await applyDemoLaunch(true);
    expect(after.applied).toBe(false);
    expect((await listExpenses()).value).toEqual([realExpense()]);
  });

  test('delete apaga os fictícios e preserva o gasto real', async () => {
    await saveExpense(realExpense());
    await applyDemoLaunch(true);

    const purged = await applyDemoPurge(true, 'delete');
    expect(purged.purged).toBe(true);
    expect(purged.removed).toBe(demoExpenses.length);
    expect(purged.value).toEqual([realExpense()]);

    const again = await applyDemoPurge(true, 'delete');
    expect(again.purged).toBe(false);
    expect((await listExpenses()).value).toEqual([realExpense()]);
  });

  test('delete remove só a simulação e o dashboard usa esses gastos', async () => {
    await saveCategories({ Supermercado: true });
    await saveExpense(realExpense());
    const categoriesBefore = await AsyncStorage.getItem(STORAGE_KEYS.categories);

    render(<App />);
    fireEvent.press(screen.getByText('Continuar'));
    expect(await screen.findByText('Adicionar gasto')).toBeTruthy();

    await openTab('tab-more', 'Desenvolvimento');
    fireEvent.press(screen.getByText('Gerar dados de demonstração'));
    expect(await screen.findByText(`${demoExpenses.length} gastos de demonstração gravados.`)).toBeTruthy();

    const withDemo = await listExpenses();
    expect(withDemo.value.filter((item) => item.id.startsWith('demo-'))).toHaveLength(demoExpenses.length);
    expect(withDemo.value.some((item) => item.id === 'real-padaria')).toBe(true);

    await openTab('tab-home', 'Olá');
    expect(screen.getAllByText(formatBrl(roundMoney(demoTotal + 10))).length).toBeGreaterThan(0);
    expect(screen.getByText('jan 2026 – abr 2026')).toBeTruthy();
    expect(screen.getByText('Ração')).toBeTruthy();

    await openTab('tab-expenses', 'Meus gastos');
    expect(screen.getByText('Padaria')).toBeTruthy();
    expect(screen.getByText('Mercado Central')).toBeTruthy();

    await openTab('tab-chart', `Total ${formatBrl(roundMoney(demoTotal + 10))}`);

    await openTab('tab-more', 'Desenvolvimento');
    fireEvent.press(screen.getByText('delete'));
    expect(await screen.findByText(`${demoExpenses.length} gastos de demonstração removidos.`)).toBeTruthy();

    const afterDelete = await listExpenses();
    expect(afterDelete.ok).toBe(true);
    expect(afterDelete.value).toEqual([realExpense()]);
    expect(await AsyncStorage.getItem(STORAGE_KEYS.categories)).toBe(categoriesBefore);

    await openTab('tab-home', 'Olá');
    expect(screen.getByText('Padaria')).toBeTruthy();
    expect(screen.queryByText('Mercado Central')).toBeNull();
    expect(screen.getAllByText(formatBrl(10)).length).toBeGreaterThan(0);

    await openTab('tab-chart', 'Total R$ 10,00');
    expect(screen.queryByText('Ração')).toBeNull();
  });
});
