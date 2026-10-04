import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as TextExtractor from 'expo-text-extractor';
import App from '../App';
import { deleteExpenseAndFiles } from '../services/expenses/expenseRemoval';
import {
  createTemporaryFileManager,
  ownerOfTemporaryFile,
} from '../services/files/temporaryFiles';
import { listExpenses, saveExpense } from '../services/storage/expensesStore';

const TEMP = 'file:///cache/notescan-tmp/';
const pickerUri = 'file:///cache/ImagePicker/0f8fad5b-d9cb-469f-a165-70867728950e.jpg';

function storedUris(prefix) {
  return [...FileSystem.__files.keys()].filter((uri) => uri.startsWith(prefix));
}

function manager() {
  return createTemporaryFileManager({ getFileSystem: () => FileSystem });
}

beforeEach(async () => {
  await AsyncStorage.clear();
  FileSystem.__reset();
  ImagePicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true, status: 'granted' });
  ImagePicker.launchCameraAsync.mockReset();
  TextExtractor.extractTextFromImage.mockReset();
  TextExtractor.extractTextFromImage.mockResolvedValue([]);
});

describe('gerenciador de temporários', () => {
  test('criar, escrever e ler um temporário', () => {
    const temp = manager();
    const created = temp.create({ ownerId: 'gasto-1', extension: 'txt' });

    expect(created.ok).toBe(true);
    expect(created.uri.startsWith(TEMP)).toBe(true);
    expect(FileSystem.__files.has(created.uri)).toBe(true);
    expect(ownerOfTemporaryFile(created.id)).toBe('gasto-1');

    expect(temp.write(created.id, 'TOTAL R$ 12,50')).toEqual({ ok: true });
    expect(FileSystem.__files.get(created.uri)).toBe('TOTAL R$ 12,50');
    expect(temp.read(created.id)).toEqual({ ok: true, value: 'TOTAL R$ 12,50' });
  });

  test('excluir o conteúdo remove todos os temporários dele e preserva os de outro conteúdo', () => {
    const temp = manager();
    const a1 = temp.create({ ownerId: 'gasto-a', extension: 'txt' });
    const a2 = temp.create({ ownerId: 'gasto-a', extension: 'jpg' });
    const b1 = temp.create({ ownerId: 'gasto-b', extension: 'txt' });

    const result = temp.deleteForContent('gasto-a');

    expect(result).toEqual({ ok: true, removed: 2, deferred: 0 });
    expect(FileSystem.__files.has(a1.uri)).toBe(false);
    expect(FileSystem.__files.has(a2.uri)).toBe(false);
    expect(FileSystem.__files.has(b1.uri)).toBe(true);
    expect(temp.idsForContent('gasto-a')).toEqual([]);
  });

  test('dois conteúdos e operações seguidas não colidem', () => {
    const temp = manager();
    const ids = new Set();
    for (let i = 0; i < 50; i += 1) {
      ids.add(temp.create({ ownerId: i % 2 ? 'gasto-a' : 'gasto-b', extension: 'txt' }).id);
    }
    expect(ids.size).toBe(50);

    const a = temp.create({ ownerId: 'gasto-a', extension: 'txt' });
    const b = temp.create({ ownerId: 'gasto-b', extension: 'txt' });
    temp.write(a.id, 'A');
    temp.write(b.id, 'B');
    expect(temp.read(a.id).value).toBe('A');
    expect(temp.read(b.id).value).toBe('B');
  });

  test('bloqueia exclusão fora da pasta temporária e caminhos com travessia', () => {
    const temp = manager();
    FileSystem.__files.set('file:///documents/receipts/abc.jpg', 'nota');
    FileSystem.__files.set(pickerUri, 'foto');

    expect(temp.deleteByUri('file:///documents/receipts/abc.jpg')).toEqual({ ok: false, reason: 'blocked' });
    expect(temp.deleteByUri(`${TEMP}../../documents/receipts/abc.jpg`)).toEqual({ ok: false, reason: 'blocked' });
    expect(temp.deleteByUri(`${TEMP}x__abcdefgh.jpg/../../../documents/receipts/abc.jpg`)).toEqual({
      ok: false,
      reason: 'blocked',
    });
    expect(temp.deleteByUri(pickerUri)).toEqual({ ok: false, reason: 'blocked' });
    expect(temp.delete('../receipts/abc.jpg')).toEqual({ ok: false, reason: 'blocked' });
    expect(temp.deleteForContent('../documents')).toMatchObject({ ok: false, reason: 'blocked' });
    expect(temp.isManagedPath('/etc/passwd')).toBe(false);

    expect(FileSystem.__files.get('file:///documents/receipts/abc.jpg')).toBe('nota');
    expect(FileSystem.__files.get(pickerUri)).toBe('foto');
  });

  test('aceita excluir pelo caminho quando ele é da pasta controlada', () => {
    const temp = manager();
    const created = temp.create({ ownerId: 'gasto-1', extension: 'txt' });
    expect(temp.isManagedPath(created.uri)).toBe(true);
    expect(temp.deleteByUri(created.uri)).toEqual({ ok: true });
    expect(FileSystem.__files.has(created.uri)).toBe(false);
  });

  test('foto do cache do seletor é movida, sem deixar cópia para trás', () => {
    const temp = manager();
    FileSystem.__files.set(pickerUri, 'foto');

    const adopted = temp.adopt(pickerUri, { ownerId: 'gasto-1' });

    expect(adopted.ok).toBe(true);
    expect(adopted.uri.startsWith(TEMP)).toBe(true);
    expect(adopted.id.endsWith('.jpg')).toBe(true);
    expect(FileSystem.__files.has(pickerUri)).toBe(false);
    expect(FileSystem.__files.get(adopted.uri)).toBe('foto');
  });

  test('falha ao adotar a foto não deixa arquivo nem registro', () => {
    const temp = manager();
    const adopted = temp.adopt('file:///cache/ImagePicker/sumiu.jpg', { ownerId: 'gasto-1' });

    expect(adopted).toEqual({ ok: false, reason: 'failed' });
    expect(storedUris(TEMP)).toEqual([]);
    expect(temp.idsForContent('gasto-1')).toEqual([]);
  });

  test('arquivo em uso não é apagado no meio da operação e sai quando ela termina', async () => {
    const temp = manager();
    const created = temp.create({ ownerId: 'gasto-1', extension: 'txt' });
    let finish;
    const running = temp.use(created.id, () => new Promise((resolve) => { finish = resolve; }));

    expect(temp.isInUse(created.id)).toBe(true);
    expect(() => temp.deleteForContent('gasto-1')).not.toThrow();
    expect(temp.delete(created.id)).toEqual({ ok: false, reason: 'in-use', deferred: true });
    expect(temp.cleanupOrphans()).toEqual({ removed: 0, failed: 0 });
    expect(FileSystem.__files.has(created.uri)).toBe(true);

    finish('ok');
    await expect(running).resolves.toBe('ok');
    expect(FileSystem.__files.has(created.uri)).toBe(false);
  });

  test('exclusão recusada pelo sistema não derruba o app e é tentada de novo', () => {
    const temp = manager();
    const created = temp.create({ ownerId: 'gasto-1', extension: 'txt' });
    FileSystem.__locked.add(created.uri);

    expect(() => temp.deleteForContent('gasto-1')).not.toThrow();
    expect(temp.deleteForContent('gasto-1')).toEqual({ ok: false, removed: 0, deferred: 1 });
    expect(FileSystem.__files.has(created.uri)).toBe(true);

    FileSystem.__locked.delete(created.uri);
    expect(temp.cleanup()).toEqual({ removed: 1, deferred: 0 });
    expect(FileSystem.__files.has(created.uri)).toBe(false);
  });

  test('ao reiniciar, temporários de execuções anteriores são removidos e o resto fica', () => {
    const firstRun = manager();
    const old = firstRun.create({ ownerId: 'gasto-1', extension: 'jpg' });
    FileSystem.__files.set(`${TEMP}leia-me.txt`, 'não é do NoteScan');
    FileSystem.__files.set('file:///documents/receipts/gasto-1.jpg', 'nota');
    FileSystem.__files.set(pickerUri, 'foto');

    const secondRun = manager();
    const current = secondRun.create({ ownerId: 'gasto-2', extension: 'jpg' });

    expect(secondRun.cleanupOrphans()).toEqual({ removed: 1, failed: 0 });
    expect(FileSystem.__files.has(old.uri)).toBe(false);
    expect(FileSystem.__files.has(current.uri)).toBe(true);
    expect(FileSystem.__files.has(`${TEMP}leia-me.txt`)).toBe(true);
    expect(FileSystem.__files.has('file:///documents/receipts/gasto-1.jpg')).toBe(true);
    expect(FileSystem.__files.has(pickerUri)).toBe(true);
  });

  test('sem sistema de arquivos tudo responde sem quebrar', () => {
    const temp = createTemporaryFileManager({ getFileSystem: () => null });
    expect(temp.create({ ownerId: 'gasto-1' })).toEqual({ ok: false, reason: 'unsupported' });
    expect(temp.adopt(pickerUri, { ownerId: 'gasto-1' })).toEqual({ ok: false, reason: 'unsupported' });
    expect(temp.deleteForContent('gasto-1')).toEqual({ ok: true, removed: 0, deferred: 0 });
    expect(temp.cleanupOrphans()).toEqual({ removed: 0, failed: 0 });
  });
});

describe('remoção interna de gasto', () => {
  test('apaga o gasto, a foto da nota e os temporários ligados a ele', async () => {
    const temp = manager();
    const leftover = temp.create({ ownerId: 'gasto-x', extension: 'jpg' });
    const other = temp.create({ ownerId: 'gasto-y', extension: 'jpg' });
    FileSystem.__files.set('file:///documents/receipts/gasto-x.jpg', 'nota');
    await saveExpense({
      id: 'gasto-x',
      amount: 30,
      description: 'Mercado',
      date: null,
      category: 'Supermercado',
      ocrText: null,
      receiptImage: 'receipts/gasto-x.jpg',
      createdAt: '2026-05-01T12:00:00.000Z',
    });

    const result = await deleteExpenseAndFiles('gasto-x', { temporary: temp });

    expect(result.ok).toBe(true);
    expect(result.receiptDeleted).toBe(true);
    expect(result.temporary).toEqual({ ok: true, removed: 1, deferred: 0 });
    expect((await listExpenses()).value).toEqual([]);
    expect(FileSystem.__files.has(leftover.uri)).toBe(false);
    expect(FileSystem.__files.has('file:///documents/receipts/gasto-x.jpg')).toBe(false);
    expect(FileSystem.__files.has(other.uri)).toBe(true);
  });
});

describe('fluxo da foto no app', () => {
  async function takePhoto() {
    FileSystem.__files.set(pickerUri, 'foto');
    ImagePicker.launchCameraAsync.mockResolvedValue({ canceled: false, assets: [{ uri: pickerUri }] });
    fireEvent.press(screen.getByText('Continuar'));
    fireEvent.press(await screen.findByText('Adicionar gasto'));
    fireEvent.press(await screen.findByLabelText('Tirar foto'));
  }

  test('abrir o app remove temporários deixados por uma execução interrompida', async () => {
    const orphan = `${TEMP}gasto-antigo__abcdefgh12.jpg`;
    FileSystem.__files.set(orphan, 'foto esquecida');
    new FileSystem.Directory(TEMP.slice(0, -1)).create();
    FileSystem.__files.set('file:///documents/receipts/gasto-antigo.jpg', 'nota');

    render(<App />);
    fireEvent.press(screen.getByText('Continuar'));
    expect(await screen.findByText('Adicionar gasto')).toBeTruthy();

    expect(FileSystem.__files.has(orphan)).toBe(false);
    expect(FileSystem.__files.get('file:///documents/receipts/gasto-antigo.jpg')).toBe('nota');
  });

  test('salvar transforma o temporário na foto do gasto e não deixa resto', async () => {
    render(<App />);
    await takePhoto();
    expect(await screen.findByText('Revisar informações')).toBeTruthy();
    expect(storedUris(TEMP)).toHaveLength(1);
    expect(FileSystem.__files.has(pickerUri)).toBe(false);

    fireEvent.changeText(screen.getByLabelText('Valor'), '19,90');
    fireEvent.press(screen.getByTestId('category-Supermercado'));
    fireEvent.press(screen.getByText('Salvar gasto'));
    expect(await screen.findByLabelText('Tirar foto')).toBeTruthy();

    const saved = (await listExpenses()).value[0];
    expect(FileSystem.__files.get(`file:///documents/receipts/${saved.id}.jpg`)).toBe('foto');
    expect(storedUris('file:///cache/')).toEqual([]);
  });

  test('cancelar a revisão apaga o temporário', async () => {
    render(<App />);
    await takePhoto();
    expect(await screen.findByText('Revisar informações')).toBeTruthy();
    expect(storedUris(TEMP)).toHaveLength(1);

    fireEvent.press(screen.getByText('Cancelar'));
    expect(await screen.findByLabelText('Tirar foto')).toBeTruthy();

    await waitFor(() => expect(storedUris('file:///cache/')).toEqual([]));
    expect((await listExpenses()).value).toEqual([]);
  });

  test('OCR com erro e revisão cancelada não abandonam o temporário', async () => {
    TextExtractor.extractTextFromImage.mockRejectedValueOnce(new Error('falha nativa'));
    render(<App />);
    await takePhoto();
    expect(await screen.findByText('Revisar informações')).toBeTruthy();
    expect(storedUris(TEMP)).toHaveLength(1);

    fireEvent.press(screen.getByText('Cancelar'));
    await waitFor(() => expect(storedUris('file:///cache/')).toEqual([]));
  });

  test('sair da captura durante a leitura apaga o temporário quando a leitura termina', async () => {
    let finishOcr;
    TextExtractor.extractTextFromImage.mockImplementationOnce(
      () => new Promise((resolve) => { finishOcr = resolve; })
    );
    const view = render(<App />);
    await takePhoto();
    expect(await screen.findByText('Lendo a nota...')).toBeTruthy();
    expect(storedUris(TEMP)).toHaveLength(1);

    view.unmount();
    expect(storedUris(TEMP)).toHaveLength(1);

    await act(async () => {
      finishOcr(['MERCADO', 'TOTAL R$ 10,00']);
    });
    await waitFor(() => expect(storedUris('file:///cache/')).toEqual([]));
  });

  test('falha ao gravar o gasto mantém o temporário para nova tentativa e não deixa foto órfã', async () => {
    render(<App />);
    await takePhoto();
    expect(await screen.findByText('Revisar informações')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('Valor'), '19,90');
    fireEvent.press(screen.getByTestId('category-Supermercado'));

    const alert = jest.spyOn(require('react-native').Alert, 'alert').mockImplementation(() => {});
    AsyncStorage.setItem.mockRejectedValueOnce(new Error('falha transitória'));
    fireEvent.press(screen.getByText('Salvar gasto'));

    await waitFor(() => expect(alert).toHaveBeenCalledWith('Erro', 'Não foi possível salvar o gasto.'));
    expect(storedUris(TEMP)).toHaveLength(1);
    expect(storedUris('file:///documents/receipts/')).toEqual([]);

    fireEvent.press(screen.getByText('Salvar gasto'));
    expect(await screen.findByLabelText('Tirar foto')).toBeTruthy();
    expect(storedUris('file:///documents/receipts/')).toHaveLength(1);
    expect(storedUris('file:///cache/')).toEqual([]);
    alert.mockRestore();
  });
});
