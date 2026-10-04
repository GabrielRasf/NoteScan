import { Platform } from 'react-native';

const TEMP_DIR = 'notescan-tmp';
const EXTENSIONS = ['jpg', 'jpeg', 'png', 'heic', 'webp', 'txt', 'json', 'bin'];
const OWNER = /^[A-Za-z0-9-]{1,64}$/;
// <dono>__<único>.<extensão>. Sem barra, sem "%", sem ".." e com um único ponto.
const NAME = /^([A-Za-z0-9-]{1,64})__([a-z0-9]{8,40})\.(jpg|jpeg|png|heic|webp|txt|json|bin)$/;
// expo-image-picker grava cada foto como <UUID>.<ext> em <cache>/ImagePicker (Android e iOS).
// No iOS, com cache terminado em "/" (Expo Go), o nome vai direto para a raiz do cache.
const PICKER_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]{1,5}$/i;
const PICKER_DIR = 'ImagePicker';
// Links simbólicos do sistema: /var -> /private/var (iOS) e /data/data -> /data/user/0 (Android).
const PATH_ALIASES = [
  [/^\/private\/var\//, '/var/'],
  [/^\/data\/data\//, '/data/user/0/'],
];
const STATE_KEY = '__notescanTemporaryFilesState';

function loadFileSystem() {
  if (Platform.OS === 'web') return null;
  try {
    return require('expo-file-system');
  } catch (error) {
    return null;
  }
}

function decodedFilePath(uri) {
  if (typeof uri !== 'string' || !uri) return null;
  let raw;
  if (/^file:/i.test(uri)) {
    const match = /^file:\/\/(?:localhost)?(\/.*)$/i.exec(uri);
    if (!match) return null;
    raw = match[1];
  } else if (uri.startsWith('/') && !uri.startsWith('//')) {
    raw = uri;
  } else {
    return null;
  }
  if (/[?#\\\0]/.test(raw)) return null;

  const segments = [];
  for (const part of raw.split('/')) {
    if (!part) continue;
    let segment;
    try {
      segment = decodeURIComponent(part);
    } catch (error) {
      return null;
    }
    if (segment === '.' || segment === '..' || /[/\\\0]/.test(segment)) return null;
    segments.push(segment);
  }
  return `/${segments.join('/')}`;
}

// Caminho absoluto, decodificado e sem atalhos, para comparar formas diferentes do mesmo arquivo.
// Devolve null para tudo que não for arquivo local (content://, ph://, data:, ...) ou tiver travessia.
export function canonicalFilePath(uri) {
  const path = decodedFilePath(uri);
  if (path === null) return null;
  const alias = PATH_ALIASES.find(([pattern]) => pattern.test(path));
  return alias ? path.replace(alias[0], alias[1]) : path;
}

function splitPath(path) {
  const index = path.lastIndexOf('/');
  return { parent: path.slice(0, index), name: path.slice(index + 1) };
}

function toFileUri(path) {
  return `file://${path.split('/').map(encodeURIComponent).join('/')}`;
}

function createState() {
  return { registry: new Map(), leases: new Map(), pendingDelete: new Set(), retry: new Set(), counter: 0 };
}

// Sobrevive à recarga do módulo (Fast Refresh) dentro da mesma execução; some quando o app fecha.
function runtimeState() {
  if (!globalThis[STATE_KEY]) globalThis[STATE_KEY] = createState();
  return globalThis[STATE_KEY];
}

function extensionOf(uri) {
  const match = /\.([A-Za-z0-9]+)(?:\?.*)?$/.exec(uri || '');
  const extension = match ? match[1].toLowerCase() : '';
  return EXTENSIONS.includes(extension) ? extension : 'bin';
}

export function ownerOfTemporaryFile(id) {
  const match = typeof id === 'string' ? NAME.exec(id) : null;
  return match ? match[1] : null;
}

export function createTemporaryFileManager({
  getFileSystem = loadFileSystem,
  now = () => Date.now(),
  random = () => Math.random().toString(36).slice(2, 10),
  state = createState(),
} = {}) {
  const { registry, leases, pendingDelete, retry } = state;

  const fs = () => getFileSystem();

  function directory(files) {
    return new files.Directory(files.Paths.cache, TEMP_DIR);
  }

  function ensureDirectory(files) {
    const dir = directory(files);
    dir.create({ intermediates: true, idempotent: true });
    return dir;
  }

  function newId(ownerId, extension) {
    state.counter += 1;
    const unique = `${now().toString(36)}${state.counter.toString(36)}${random()}`
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 40)
      .padEnd(8, '0');
    return `${ownerId}__${unique}.${extension}`;
  }

  function isManagedId(id) {
    return typeof id === 'string' && NAME.test(id);
  }

  // Id do arquivo quando o caminho, já canônico, é filho direto da pasta temporária.
  function managedIdOf(files, uri) {
    const path = canonicalFilePath(uri);
    const base = canonicalFilePath(directory(files).uri);
    if (!path || !base) return null;
    const { parent, name } = splitPath(path);
    return parent === base && isManagedId(name) ? name : null;
  }

  function isManagedPath(uri) {
    const files = fs();
    return Boolean(files) && managedIdOf(files, uri) !== null;
  }

  function fileFor(files, id) {
    if (!isManagedId(id)) return null;
    const file = new files.File(directory(files), id);
    return managedIdOf(files, file.uri) === id ? file : null;
  }

  function isDirectoryAt(files, uri) {
    try {
      return files.Paths.info?.(uri)?.isDirectory === true;
    } catch (error) {
      return false;
    }
  }

  function isPickerOutput(files, sourceUri) {
    const path = canonicalFilePath(sourceUri);
    const cache = canonicalFilePath(files.Paths.cache.uri);
    if (!path || !cache) return false;
    const { parent, name } = splitPath(path);
    return PICKER_NAME.test(name) && (parent === `${cache}/${PICKER_DIR}` || parent === cache);
  }

  function sizeOf(file) {
    try {
      const size = file.size;
      return typeof size === 'number' && size >= 0 ? size : null;
    } catch (error) {
      return null;
    }
  }

  function isComplete(file, expectedSize) {
    try {
      return file.exists && (expectedSize === null || sizeOf(file) === expectedSize);
    } catch (error) {
      return false;
    }
  }

  function isInUse(id) {
    return (leases.get(id) || 0) > 0;
  }

  function uriFor(id) {
    const files = fs();
    if (!files) return null;
    return fileFor(files, id)?.uri ?? null;
  }

  function register(id, ownerId) {
    registry.set(id, { ownerId, createdAt: now() });
  }

  function create({ ownerId, extension = 'bin' }) {
    const files = fs();
    if (!files) return { ok: false, reason: 'unsupported' };
    if (!OWNER.test(ownerId || '')) return { ok: false, reason: 'blocked' };
    const id = newId(ownerId, EXTENSIONS.includes(extension) ? extension : 'bin');
    register(id, ownerId);
    try {
      ensureDirectory(files);
      const file = fileFor(files, id);
      if (!file) throw new Error('Caminho fora da pasta temporária.');
      file.create();
      return { ok: true, id, uri: file.uri };
    } catch (error) {
      registry.delete(id);
      return { ok: false, reason: 'failed' };
    }
  }

  // Apaga o destino incompleto. Se o sistema recusar, fica registrado para nova tentativa.
  function discard(files, id) {
    try {
      const target = fileFor(files, id);
      if (target?.exists) target.delete();
      registry.delete(id);
    } catch (error) {
      retry.add(id);
    }
  }

  // Só a foto recém-gerada pelo seletor é movida. Qualquer outra origem é copiada e fica intacta.
  // O original só sai depois que o destino existe com o mesmo tamanho.
  function adopt(sourceUri, { ownerId }) {
    const files = fs();
    if (!files) return { ok: false, reason: 'unsupported' };
    if (!OWNER.test(ownerId || '') || typeof sourceUri !== 'string' || !sourceUri) {
      return { ok: false, reason: 'blocked' };
    }
    const sourcePath = decodedFilePath(sourceUri);
    if (!sourcePath) return { ok: false, reason: 'unsupported-source' };
    const sourceFileUri = /^file:/i.test(sourceUri) ? sourceUri : toFileUri(sourcePath);
    const source = () => new files.File(sourceFileUri);

    const id = newId(ownerId, extensionOf(sourceUri));
    register(id, ownerId);
    let expectedSize;
    try {
      if (!source().exists) throw new Error('Origem inexistente.');
      expectedSize = sizeOf(source());
      ensureDirectory(files);
      if (!fileFor(files, id)) throw new Error('Caminho fora da pasta temporária.');
    } catch (error) {
      registry.delete(id);
      return { ok: false, reason: 'failed' };
    }
    const target = () => fileFor(files, id);
    const fromPicker = isPickerOutput(files, sourceUri);

    if (fromPicker) {
      try {
        source().move(target());
      } catch (error) {
        // Conferido abaixo: o sistema pode ter movido parte, tudo ou nada.
      }
      const sourceLeft = source().exists;
      if (!sourceLeft && isComplete(target(), expectedSize)) {
        return { ok: true, id, uri: target().uri, sourceRemoved: true };
      }
      if (!sourceLeft) {
        discard(files, id);
        return { ok: false, reason: 'failed' };
      }
      if (target().exists) {
        discard(files, id);
        if (retry.has(id)) return { ok: false, reason: 'failed' };
        register(id, ownerId);
      }
    }

    try {
      source().copy(target());
    } catch (error) {
      // Conferido abaixo.
    }
    if (!isComplete(target(), expectedSize)) {
      discard(files, id);
      return { ok: false, reason: 'failed' };
    }

    let sourceRemoved = false;
    if (fromPicker) {
      try {
        source().delete();
        sourceRemoved = true;
      } catch (error) {
        // A cópia já está completa; o original fica no cache do seletor.
      }
    }
    return { ok: true, id, uri: target().uri, sourceRemoved };
  }

  function write(id, content) {
    const files = fs();
    if (!files) return { ok: false, reason: 'unsupported' };
    const file = registry.has(id) ? fileFor(files, id) : null;
    if (!file) return { ok: false, reason: 'blocked' };
    try {
      file.write(content);
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: 'failed' };
    }
  }

  function read(id) {
    const files = fs();
    if (!files) return { ok: false, reason: 'unsupported' };
    const file = fileFor(files, id);
    if (!file) return { ok: false, reason: 'blocked' };
    try {
      if (!file.exists) return { ok: false, reason: 'missing' };
      return { ok: true, value: file.textSync() };
    } catch (error) {
      return { ok: false, reason: 'failed' };
    }
  }

  function remove(id) {
    const files = fs();
    if (!isManagedId(id)) return { ok: false, reason: 'blocked' };
    if (!files) return { ok: false, reason: 'unsupported' };
    const file = fileFor(files, id);
    if (!file || isDirectoryAt(files, file.uri)) return { ok: false, reason: 'blocked' };
    if (isInUse(id)) {
      pendingDelete.add(id);
      return { ok: false, reason: 'in-use', deferred: true };
    }
    try {
      if (file.exists) file.delete();
    } catch (error) {
      retry.add(id);
      return { ok: false, reason: 'failed', deferred: true };
    }
    registry.delete(id);
    pendingDelete.delete(id);
    retry.delete(id);
    return { ok: true };
  }

  function deleteByUri(uri) {
    const files = fs();
    const id = files ? managedIdOf(files, uri) : null;
    if (!id) return { ok: false, reason: 'blocked' };
    return remove(id);
  }

  function listStoredIds(files) {
    try {
      const dir = directory(files);
      if (!dir.exists) return [];
      return dir
        .list()
        .filter((entry) => entry instanceof files.File && isManagedId(entry.name))
        .map((entry) => entry.name);
    } catch (error) {
      return [];
    }
  }

  function idsForContent(ownerId) {
    const files = fs();
    const ids = new Set();
    registry.forEach((entry, id) => {
      if (entry.ownerId === ownerId) ids.add(id);
    });
    if (files) {
      listStoredIds(files).forEach((id) => {
        if (ownerOfTemporaryFile(id) === ownerId) ids.add(id);
      });
    }
    return [...ids];
  }

  function deleteForContent(ownerId) {
    if (!OWNER.test(ownerId || '')) return { ok: false, reason: 'blocked', removed: 0, deferred: 0 };
    const results = idsForContent(ownerId).map(remove);
    return {
      ok: results.every((result) => result.ok),
      removed: results.filter((result) => result.ok).length,
      deferred: results.filter((result) => result.deferred).length,
    };
  }

  async function use(id, operation) {
    if (!isManagedId(id) || !registry.has(id)) throw new Error('Arquivo temporário indisponível.');
    leases.set(id, (leases.get(id) || 0) + 1);
    try {
      return await operation(uriFor(id));
    } finally {
      const left = (leases.get(id) || 1) - 1;
      if (left > 0) leases.set(id, left);
      else leases.delete(id);
      if (left <= 0 && pendingDelete.has(id)) remove(id);
    }
  }

  function cleanup() {
    const results = [...new Set([...retry, ...pendingDelete])]
      .filter((id) => !isInUse(id))
      .map(remove);
    return {
      removed: results.filter((result) => result.ok).length,
      deferred: results.filter((result) => result.deferred).length,
    };
  }

  // Órfão: arquivo da pasta temporária que não foi criado por esta execução do app.
  function cleanupOrphans() {
    const files = fs();
    if (!files) return { removed: 0, failed: 0 };
    let removed = 0;
    let failed = 0;
    listStoredIds(files).forEach((id) => {
      if (registry.has(id) || isInUse(id)) return;
      const file = fileFor(files, id);
      if (!file || isDirectoryAt(files, file.uri)) return;
      try {
        if (file.exists) file.delete();
        removed += 1;
      } catch (error) {
        failed += 1;
      }
    });
    return { removed, failed };
  }

  return {
    isSupported: () => Boolean(fs()),
    isManagedId,
    isManagedPath,
    isInUse,
    uriFor,
    create,
    adopt,
    write,
    read,
    delete: remove,
    deleteByUri,
    deleteForContent,
    idsForContent,
    use,
    cleanup,
    cleanupOrphans,
  };
}

export const temporaryFiles = createTemporaryFileManager({ state: runtimeState() });
