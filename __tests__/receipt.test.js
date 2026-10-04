import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import App from '../App';
import {
  deleteReceiptImage,
  isReceiptPath,
  receiptImageUri,
  storeReceiptImage,
} from '../services/receipts/receiptFiles';
import { listExpenses, saveExpense } from '../services/storage/expensesStore';

const pickerUri = 'file:///cache/ImagePicker/0f8fad5b-d9cb-469f-a165-70867728950e.jpg';

beforeEach(async () => {
  await AsyncStorage.clear();
  FileSystem.__reset();
  ImagePicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true, status: 'granted' });
  ImagePicker.launchCameraAsync.mockReset();
});

describe('arquivo da nota', () => {
  test('copia a foto para a pasta do app com caminho relativo', () => {
    FileSystem.__files.set(pickerUri, 'imagem');

    const stored = storeReceiptImage(pickerUri, 'abc-123');
    expect(stored).toEqual({ ok: true, path: 'receipts/abc-123.jpg' });
    expect(FileSystem.__files.get('file:///documents/receipts/abc-123.jpg')).toBe('imagem');
    expect(receiptImageUri(stored.path)).toBe('file:///documents/receipts/abc-123.jpg');

    deleteReceiptImage(stored.path);
    expect(FileSystem.__files.has('file:///documents/receipts/abc-123.jpg')).toBe(false);
  });

  test('foto inexistente não vira caminho gravado', () => {
    expect(storeReceiptImage('file:///cache/sumiu.jpg', 'abc-123')).toEqual({
      ok: false,
      reason: 'failed',
    });
  });

  test('sem sistema de arquivos não grava foto', () => {
    expect(storeReceiptImage(pickerUri, 'abc-123', null)).toEqual({
      ok: false,
      reason: 'unsupported',
    });
  });

  test('só aceita caminhos dentro da pasta de notas', () => {
    expect(isReceiptPath('receipts/abc-123.jpg')).toBe(true);
    expect(isReceiptPath('../receipts/abc.jpg')).toBe(false);
    expect(isReceiptPath('receipts/../../x.jpg')).toBe(false);
    expect(isReceiptPath(null)).toBe(false);
  });

  test('gasto antigo sem foto continua válido', async () => {
    const saved = await saveExpense({
      id: 'antigo',
      amount: 5,
      description: null,
      date: null,
      category: 'Supermercado',
      ocrText: null,
      createdAt: '2026-01-01T12:00:00.000Z',
    });
    expect(saved.ok).toBe(true);
  });
});

describe('foto da nota em Meus gastos', () => {
  test('a foto tirada fica no gasto, abre em Meus gastos e sai ao excluir', async () => {
    FileSystem.__files.set(pickerUri, 'imagem');
    ImagePicker.launchCameraAsync.mockResolvedValue({ canceled: false, assets: [{ uri: pickerUri }] });

    render(<App />);
    fireEvent.press(screen.getByText('Continuar'));
    fireEvent.press(await screen.findByText('Adicionar gasto'));
    fireEvent.press(await screen.findByLabelText('Tirar foto'));

    expect(await screen.findByText('Revisar informações')).toBeTruthy();
    expect(screen.getByLabelText('Nota selecionada')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('Valor'), '87,45');
    fireEvent.changeText(screen.getByLabelText('Estabelecimento'), 'Supermercado do bairro');
    fireEvent.press(screen.getByTestId('category-Supermercado'));
    fireEvent.press(screen.getByText('Salvar gasto'));
    expect(await screen.findByLabelText('Tirar foto')).toBeTruthy();

    const stored = await listExpenses();
    const saved = stored.value[0];
    expect(saved.receiptImage).toBe(`receipts/${saved.id}.jpg`);
    const fileUri = `file:///documents/receipts/${saved.id}.jpg`;
    expect(FileSystem.__files.get(fileUri)).toBe('imagem');

    fireEvent.press(screen.getByLabelText('Fechar'));
    fireEvent.press(await screen.findByTestId('tab-expenses'));
    expect(await screen.findByText('Supermercado do bairro')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Ver nota'));
    expect(await screen.findByLabelText('Foto da nota')).toBeTruthy();
    expect(screen.getByText('R$ 87,45 · Sem data')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Fechar'));
    expect(await screen.findByText('Meus gastos')).toBeTruthy();

    const alert = jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
      buttons.find((button) => button.text === 'Excluir').onPress();
    });
    fireEvent.press(screen.getByLabelText('Excluir'));

    await waitFor(() => expect(FileSystem.__files.has(fileUri)).toBe(false));
    expect((await listExpenses()).value).toEqual([]);
    expect(screen.queryByText('Supermercado do bairro')).toBeNull();
    alert.mockRestore();
  });

  test('se a foto não puder ser guardada, o gasto não é salvo pela metade', async () => {
    ImagePicker.launchCameraAsync.mockResolvedValue({ canceled: false, assets: [{ uri: pickerUri }] });
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    render(<App />);
    fireEvent.press(screen.getByText('Continuar'));
    fireEvent.press(await screen.findByText('Adicionar gasto'));
    fireEvent.press(await screen.findByLabelText('Tirar foto'));

    expect(await screen.findByText('Revisar informações')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('Valor'), '12,00');
    fireEvent.press(screen.getByTestId('category-Supermercado'));
    fireEvent.press(screen.getByText('Salvar gasto'));

    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith('Erro', 'Não foi possível guardar a foto da nota.')
    );
    expect(screen.getByText('Revisar informações')).toBeTruthy();
    expect((await listExpenses()).value).toEqual([]);
    alert.mockRestore();
  });
});
