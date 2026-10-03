import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import App from '../App';
import ExpenseChart from '../components/ExpenseChart';
import { listExpenses } from '../services/storage/expensesStore';

async function continueToHome() {
  fireEvent.press(screen.getByText('Continuar'));
  expect(await screen.findByText('Adicionar gasto')).toBeTruthy();
}

async function continueToCamera() {
  await continueToHome();
  fireEvent.press(screen.getByText('Adicionar gasto'));
  expect(await screen.findByLabelText('Tirar foto')).toBeTruthy();
}

async function openTab(testID, readyText) {
  fireEvent.press(screen.getByTestId(testID));
  expect(await screen.findByText(readyText)).toBeTruthy();
}

async function saveManualExpense({ amount, description, category }) {
  fireEvent.press(screen.getByText('Preencher manualmente'));
  fireEvent.changeText(await screen.findByLabelText('Valor'), amount);
  if (description) {
    fireEvent.changeText(screen.getByLabelText('Estabelecimento'), description);
  }
  fireEvent.press(screen.getByTestId(`category-${category}`));
  fireEvent.press(screen.getByText('Salvar gasto'));
  expect(await screen.findByLabelText('Tirar foto')).toBeTruthy();
}

describe('app', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    ImagePicker.requestCameraPermissionsAsync.mockReset();
    ImagePicker.launchCameraAsync.mockReset();
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValue({
      granted: true,
      status: 'granted',
    });
    ImagePicker.launchCameraAsync.mockResolvedValue({ canceled: true, assets: [] });
  });

  test('inicia e continua para a captura', async () => {
    render(<App />);
    expect(screen.getByText('Continuar')).toBeTruthy();
    expect(screen.queryByText('Sign in')).toBeNull();

    await continueToCamera();
    expect(screen.queryByText('Home')).toBeNull();
  });

  test('cancelar a câmera não abre a revisão', async () => {
    render(<App />);
    await continueToCamera();
    fireEvent.press(await screen.findByLabelText('Tirar foto'));

    await waitFor(() => expect(ImagePicker.launchCameraAsync).toHaveBeenCalled());
    expect(screen.queryByText('Revisar gasto')).toBeNull();
  });

  test('sem permissão a câmera não abre', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: false });

    render(<App />);
    await continueToCamera();
    fireEvent.press(await screen.findByLabelText('Tirar foto'));

    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith(
        'Permissão necessária',
        'Permita o uso da câmera para fotografar a nota.'
      )
    );
    expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled();
    alert.mockRestore();
  });

  test('gasto manual aparece na lista e no gráfico', async () => {
    render(<App />);
    await continueToCamera();
    await saveManualExpense({
      amount: '10,00',
      description: 'Padaria',
      category: 'Supermercado',
    });

    const stored = await listExpenses();
    expect(stored.ok).toBe(true);
    expect(stored.value[0]).toMatchObject({
      amount: 10,
      description: 'Padaria',
      category: 'Supermercado',
      date: null,
      ocrText: null,
    });

    expect(await screen.findByLabelText('Tirar foto')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Fechar'));

    await openTab('tab-expenses', 'Meus gastos');
    expect(screen.getByText('Padaria')).toBeTruthy();
    expect(screen.getByText('R$ 10,00')).toBeTruthy();
    expect(screen.getAllByText('Supermercado').length).toBeGreaterThan(0);

    await openTab('tab-chart', 'Total R$ 10,00');
    expect(screen.getAllByText('R$ 10,00').length).toBeGreaterThan(0);
  });

  test('falha ao salvar permite nova tentativa sem apagar o que já existe', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    render(<App />);
    await continueToCamera();
    await saveManualExpense({
      amount: '8,00',
      description: 'Feira',
      category: 'Supermercado',
    });

    fireEvent.press(screen.getByText('Preencher manualmente'));
    fireEvent.changeText(await screen.findByLabelText('Valor'), '15,00');
    fireEvent.changeText(screen.getByLabelText('Estabelecimento'), 'Padaria');
    fireEvent.press(screen.getByTestId('category-Supermercado'));

    AsyncStorage.setItem.mockRejectedValueOnce(new Error('falha transitória'));
    fireEvent.press(screen.getByText('Salvar gasto'));

    await waitFor(() => {
      expect(alert).toHaveBeenCalledWith('Erro', 'Não foi possível salvar o gasto.');
    });
    expect(screen.getByText('Novo gasto')).toBeTruthy();

    const afterFailure = await listExpenses();
    expect(afterFailure.ok).toBe(true);
    expect(afterFailure.value.map((item) => item.description)).toEqual(['Feira']);

    fireEvent.press(screen.getByLabelText('Salvar gasto'));
    expect(await screen.findByLabelText('Tirar foto')).toBeTruthy();

    const stored = await listExpenses();
    expect(stored.ok).toBe(true);
    expect(stored.value.map((item) => item.description).sort()).toEqual(['Feira', 'Padaria']);
    expect(stored.value.find((item) => item.description === 'Feira').amount).toBe(8);
    expect(stored.value.find((item) => item.description === 'Padaria').amount).toBe(15);
    alert.mockRestore();
  });

  // Monta o app de novo no mesmo processo. Não reinicia o sistema operacional.
  test('novo carregamento lê o gasto já gravado', async () => {
    const first = render(<App />);
    await continueToCamera();
    await saveManualExpense({
      amount: '10,00',
      description: 'Padaria',
      category: 'Supermercado',
    });
    first.unmount();

    render(<App />);
    await continueToHome();
    await openTab('tab-expenses', 'Padaria');
    expect(screen.getByText('R$ 10,00')).toBeTruthy();
  });
});

describe('estado vazio do gráfico', () => {
  test('não mostra valores fixos', () => {
    render(<ExpenseChart summary={[]} ready error={null} />);
    expect(
      screen.getByText(
        'Ainda não há gastos salvos. Fotografe uma nota ou lance um gasto manualmente.'
      )
    ).toBeTruthy();
    expect(screen.queryByText('Moradia e Utilidades')).toBeNull();
  });
});
