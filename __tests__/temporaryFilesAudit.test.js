import * as FileSystem from 'expo-file-system';
import {
  canonicalFilePath,
  createTemporaryFileManager,
} from '../services/files/temporaryFiles';
import { storeReceiptImage } from '../services/receipts/receiptFiles';

const ANDROID_UUID = '0f8fad5b-d9cb-469f-a165-70867728950e';
const IOS_UUID = '9B2E5F0A-1C3D-4E5F-8A9B-0C1D2E3F4A5B';

function withCache(cacheUri) {
  return {
    ...FileSystem,
    Paths: { ...FileSystem.Paths, cache: new FileSystem.Directory(cacheUri) },
  };
}

function managerFor(cacheUri) {
  const fs = withCache(cacheUri);
  return createTemporaryFileManager({ getFileSystem: () => fs, state: undefined });
}

function keysUnder(prefix) {
  return [...FileSystem.__files.keys()].filter((uri) => uri.startsWith(prefix));
}

beforeEach(() => {
  FileSystem.__reset();
});

describe('caminho canônico', () => {
  test('formas equivalentes do mesmo arquivo chegam ao mesmo caminho', () => {
    expect(canonicalFilePath('file:///data/data/app/cache/a.jpg')).toBe('/data/user/0/app/cache/a.jpg');
    expect(canonicalFilePath('/data/user/0/app/cache/a.jpg')).toBe('/data/user/0/app/cache/a.jpg');
    expect(canonicalFilePath('file:///private/var/mobile/Caches/a.jpg')).toBe('/var/mobile/Caches/a.jpg');
    expect(canonicalFilePath('file://localhost/var/mobile/Caches//a.jpg')).toBe('/var/mobile/Caches/a.jpg');
    expect(canonicalFilePath('file:///Users/Jo%C3%A3o%20Silva/a.jpg')).toBe('/Users/João Silva/a.jpg');
  });

  test('recusa travessia, separador codificado e esquemas que não são arquivo local', () => {
    [
      'file:///cache/notescan-tmp/../documents/a.jpg',
      'file:///cache/notescan-tmp/%2e%2e/documents/a.jpg',
      'file:///cache/notescan-tmp/%2E%2E%2Fdocuments',
      'file:///cache/notescan-tmp/..\\..\\documents',
      'file:///cache/./a.jpg',
      'file:///cache/a.jpg?x=1',
      'file:///cache/%E0%A4%A.jpg',
      'content://media/external/images/media/12',
      'ph://9B2E5F0A-1C3D/L0/001',
      'assets-library://asset/asset.JPG?id=1&ext=JPG',
      'data:image/jpeg;base64,AAAA',
      'blob:http://localhost:8081/abc',
      'https://exemplo.com/a.jpg',
      'notas/a.jpg',
      '',
      null,
    ].forEach((uri) => expect(canonicalFilePath(uri)).toBeNull());
  });
});

describe('foto devolvida pelo seletor', () => {
  test.each([
    [
      'Android, /data/data e /data/user/0',
      'file:///data/user/0/com.notescan.app/cache',
      `file:///data/data/com.notescan.app/cache/ImagePicker/${ANDROID_UUID}.jpeg`,
    ],
    [
      'Android, caminho sem file://',
      'file:///data/user/0/com.notescan.app/cache/',
      `/data/user/0/com.notescan.app/cache/ImagePicker/${ANDROID_UUID}.jpg`,
      `file:///data/user/0/com.notescan.app/cache/ImagePicker/${ANDROID_UUID}.jpg`,
    ],
    [
      'iOS, /private/var e /var',
      'file:///var/mobile/Containers/Data/Application/6F1C/Library/Caches/',
      `file:///private/var/mobile/Containers/Data/Application/6F1C/Library/Caches/ImagePicker/${IOS_UUID}.jpg`,
    ],
    [
      'Simulador iOS, espaço e acento codificados de formas diferentes',
      'file:///Users/Jo%C3%A3o%20Silva/Library/Developer/CoreSimulator/Devices/A1/data/Caches/',
      `file:///Users/João Silva/Library/Developer/CoreSimulator/Devices/A1/data/Caches/ImagePicker/${IOS_UUID}.png`,
    ],
    [
      'iOS com cache terminado em barra: o seletor grava na raiz do cache',
      'file:///var/mobile/Containers/Data/Application/6F1C/Library/Caches/ExponentExperienceData/notescan/',
      `file:///var/mobile/Containers/Data/Application/6F1C/Library/Caches/ExponentExperienceData/notescan/${IOS_UUID}.jpg`,
    ],
  ])('%s: a foto é movida e não fica cópia no cache do seletor', (label, cacheUri, pickerUri, storedAt = pickerUri) => {
    FileSystem.__files.set(storedAt, 'foto');
    const temp = managerFor(cacheUri);

    const adopted = temp.adopt(pickerUri, { ownerId: 'gasto-1' });

    expect(adopted).toMatchObject({ ok: true, sourceRemoved: true });
    expect(FileSystem.__files.has(storedAt)).toBe(false);
    expect(FileSystem.__files.get(adopted.uri)).toBe('foto');
    expect(temp.isManagedPath(adopted.uri)).toBe(true);
  });

  test('arquivo que não é saída do seletor é copiado e o original continua intacto', () => {
    const sources = [
      `file:///cache/outra-funcao/${ANDROID_UUID}.jpg`,
      'file:///cache/ImagePicker/nota-do-usuario.jpg',
      'file:///documents/receipts/gasto-9.jpg',
    ];
    const temp = managerFor('file:///cache');
    sources.forEach((source) => {
      FileSystem.__files.set(source, 'original');
      const adopted = temp.adopt(source, { ownerId: 'gasto-1' });
      expect(adopted).toMatchObject({ ok: true, sourceRemoved: false });
      expect(FileSystem.__files.get(source)).toBe('original');
      expect(FileSystem.__files.get(adopted.uri)).toBe('original');
    });
  });

  test('origem que não é arquivo local não é tocada e não gera temporário', () => {
    const temp = managerFor('file:///cache');
    ['content://media/external/images/media/12', 'ph://ABC/L0/001', 'data:image/jpeg;base64,AAAA'].forEach(
      (source) => {
        FileSystem.__files.set(source, 'original');
        expect(temp.adopt(source, { ownerId: 'gasto-1' })).toEqual({ ok: false, reason: 'unsupported-source' });
        expect(FileSystem.__files.get(source)).toBe('original');
      }
    );
    expect(keysUnder('file:///cache/notescan-tmp/')).toEqual([]);
  });

  test('mover recusado: a cópia é conferida e só então o original do seletor sai', () => {
    const pickerUri = `file:///cache/ImagePicker/${ANDROID_UUID}.jpg`;
    FileSystem.__files.set(pickerUri, 'foto completa');
    FileSystem.__failMoveFrom.add(pickerUri);
    const temp = managerFor('file:///cache');

    const adopted = temp.adopt(pickerUri, { ownerId: 'gasto-1' });

    expect(adopted).toMatchObject({ ok: true, sourceRemoved: true });
    expect(FileSystem.__files.get(adopted.uri)).toBe('foto completa');
    expect(FileSystem.__files.has(pickerUri)).toBe(false);
  });

  test('mover e copiar falham: o original fica inteiro e nada sobra na pasta temporária', () => {
    const pickerUri = `file:///cache/ImagePicker/${ANDROID_UUID}.jpg`;
    FileSystem.__files.set(pickerUri, 'foto completa');
    FileSystem.__failMoveFrom.add(pickerUri);
    FileSystem.__failCopyTo.add('file:///cache/notescan-tmp/');
    const temp = managerFor('file:///cache');

    expect(temp.adopt(pickerUri, { ownerId: 'gasto-1' })).toEqual({ ok: false, reason: 'failed' });
    expect(FileSystem.__files.get(pickerUri)).toBe('foto completa');
    expect(keysUnder('file:///cache/notescan-tmp/')).toEqual([]);
    expect(temp.idsForContent('gasto-1')).toEqual([]);
  });
});

describe('caminho controlado', () => {
  test('aceita a forma sem file:// do próprio temporário e recusa variações perigosas', () => {
    const temp = managerFor('file:///cache');
    const created = temp.create({ ownerId: 'gasto-1', extension: 'txt' });
    const path = created.uri.replace('file://', '');

    expect(temp.isManagedPath(path)).toBe(true);
    expect(temp.isManagedPath(`file:///cache/notescan-tmp/%2e%2e/notescan-tmp/${created.id}`)).toBe(false);
    expect(temp.isManagedPath(`file:///cache/notescan-tmp/..\\${created.id}`)).toBe(false);
    expect(temp.isManagedPath(`file:///cache/NOTESCAN-TMP/${created.id}`)).toBe(false);
    expect(temp.isManagedPath(`file:///cache/notescan-tmp/sub/${created.id}`)).toBe(false);
  });

  test('não apaga pasta com nome de temporário dentro da área controlada', () => {
    const temp = managerFor('file:///cache');
    const fakeDir = 'file:///cache/notescan-tmp/gasto-1__abcdefgh12.jpg';
    new FileSystem.Directory(fakeDir).create();
    FileSystem.__files.set(`${fakeDir}/dentro.txt`, 'conteúdo');

    expect(temp.delete('gasto-1__abcdefgh12.jpg')).toMatchObject({ ok: false, reason: 'blocked' });
    temp.deleteForContent('gasto-1');
    temp.cleanupOrphans();
    expect(FileSystem.__files.get(`${fakeDir}/dentro.txt`)).toBe('conteúdo');
  });
});

describe('cópia para receipts', () => {
  test('cópia interrompida não deixa foto parcial na pasta permanente', () => {
    FileSystem.__files.set('file:///cache/notescan-tmp/gasto-1__abcdefgh12.jpg', 'foto completa');
    FileSystem.__failCopyTo.add('file:///documents/receipts/');

    const stored = storeReceiptImage('file:///cache/notescan-tmp/gasto-1__abcdefgh12.jpg', 'gasto-1');

    expect(stored).toEqual({ ok: false, reason: 'failed' });
    expect(keysUnder('file:///documents/receipts/')).toEqual([]);
  });
});

describe('recarga do módulo na mesma execução', () => {
  beforeEach(() => {
    delete globalThis.__notescanTemporaryFilesState;
  });

  test('o Fast Refresh não faz a limpeza apagar o temporário de uma revisão aberta', () => {
    const shared = FileSystem;
    let created;
    jest.isolateModules(() => {
      jest.doMock('expo-file-system', () => shared);
      const { temporaryFiles } = require('../services/files/temporaryFiles');
      created = temporaryFiles.create({ ownerId: 'gasto-1', extension: 'jpg' });
    });
    jest.isolateModules(() => {
      jest.doMock('expo-file-system', () => shared);
      const { temporaryFiles } = require('../services/files/temporaryFiles');
      temporaryFiles.cleanupOrphans();
    });

    expect(created.ok).toBe(true);
    expect(FileSystem.__files.has(created.uri)).toBe(true);
  });
});
