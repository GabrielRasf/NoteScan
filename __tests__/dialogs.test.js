import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';
import App from '../App';
import { listExpenses, saveExpense } from '../services/storage/expensesStore';
import { confirmAction, showMessage } from '../services/ui/dialogs';

const originalOS = Platform.OS;

function setPlatform(os) {
  Object.defineProperty(Platform, 'OS', { configurable: true, get: () => os });
}

function expense() {
  return {
    id: 'real-mercado',
    amount: 42,
    description: 'Mercado do bairro',
    date: '2026-05-02',
    category: 'Supermercado',
    ocrText: null,
    createdAt: '2026-05-02T12:00:00.000Z',
  };
}

beforeEach(async () => {
  await AsyncStorage.clear();
  global.window.confirm = jest.fn();
  global.window.alert = jest.fn();
});

afterEach(() => {
  setPlatform(originalOS);
});

describe('diálogos', () => {
  test('na web a confirmação usa window.confirm', () => {
    setPlatform('web');
    const onConfirm = jest.fn();

    window.confirm.mockReturnValue(false);
    confirmAction({ title: 'Excluir gasto', message: 'Some.', confirmLabel: 'Excluir', onConfirm });
    expect(window.confirm).toHaveBeenCalledWith('Excluir gasto\n\nSome.');
    expect(onConfirm).not.toHaveBeenCalled();

    window.confirm.mockReturnValue(true);
    confirmAction({ title: 'Excluir gasto', message: 'Some.', confirmLabel: 'Excluir', onConfirm });
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test('na web o aviso usa window.alert', () => {
    setPlatform('web');
    showMessage('Erro', 'Não foi possível salvar o gasto.');
    expect(window.alert).toHaveBeenCalledWith('Erro\n\nNão foi possível salvar o gasto.');
  });

  test('no aparelho continua usando Alert', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    showMessage('Erro', 'Falhou.');
    expect(alert).toHaveBeenCalledWith('Erro', 'Falhou.');
    alert.mockRestore();
  });
});

describe('excluir em Meus gastos', () => {
  test('na web o botão Excluir remove o gasto depois da confirmação', async () => {
    await saveExpense(expense());

    render(<App />);
    fireEvent.press(screen.getByText('Continuar'));
    fireEvent.press(await screen.findByTestId('tab-expenses'));
    expect(await screen.findByText('Mercado do bairro')).toBeTruthy();

    setPlatform('web');
    window.confirm.mockReturnValue(false);
    fireEvent.press(screen.getByLabelText('Excluir'));
    expect(window.confirm).toHaveBeenCalledTimes(1);
    expect((await listExpenses()).value).toEqual([expense()]);

    window.confirm.mockReturnValue(true);
    fireEvent.press(screen.getByLabelText('Excluir'));

    await waitFor(() => expect(screen.queryByText('Mercado do bairro')).toBeNull());
    expect((await listExpenses()).value).toEqual([]);
  });
});
