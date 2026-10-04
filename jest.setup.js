jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-text-extractor', () => ({
  isSupported: true,
  extractTextFromImage: jest.fn(async () => []),
}));

jest.mock('expo-file-system', () => {
  const files = new Map();
  const directories = new Set();
  const locked = new Set();
  const failMoveFrom = new Set();
  const failCopyTo = new Set();
  const join = (parts) =>
    parts
      .map((part) => (typeof part === 'string' ? part : part.uri))
      .join('/')
      .replace(/([^:/])\/{2,}/g, '$1/');

  class Directory {
    constructor(...parts) {
      this.uri = join(parts);
    }
    get exists() {
      return directories.has(this.uri);
    }
    create() {
      directories.add(this.uri);
    }
    list() {
      if (!directories.has(this.uri)) throw new Error('pasta inexistente');
      const prefix = `${this.uri}/`;
      return [...files.keys()]
        .filter((uri) => uri.startsWith(prefix) && !uri.slice(prefix.length).includes('/'))
        .map((uri) => new File(uri));
    }
  }

  class File {
    constructor(...parts) {
      this.uri = join(parts);
    }
    get name() {
      return this.uri.slice(this.uri.lastIndexOf('/') + 1);
    }
    get exists() {
      return files.has(this.uri);
    }
    get size() {
      return files.has(this.uri) ? String(files.get(this.uri)).length : 0;
    }
    create() {
      if (files.has(this.uri)) throw new Error('arquivo já existe');
      files.set(this.uri, '');
    }
    write(content) {
      files.set(this.uri, content);
    }
    textSync() {
      if (!files.has(this.uri)) throw new Error('arquivo inexistente');
      return files.get(this.uri);
    }
    copy(target) {
      if (!files.has(this.uri)) throw new Error('arquivo inexistente');
      if ([...failCopyTo].some((prefix) => target.uri.startsWith(prefix))) {
        files.set(target.uri, String(files.get(this.uri)).slice(0, 1));
        throw new Error('cópia interrompida');
      }
      files.set(target.uri, files.get(this.uri));
    }
    move(target) {
      if (!files.has(this.uri)) throw new Error('arquivo inexistente');
      if (failMoveFrom.has(this.uri)) throw new Error('mover recusado');
      files.set(target.uri, files.get(this.uri));
      files.delete(this.uri);
      this.uri = target.uri;
    }
    delete() {
      if (locked.has(this.uri)) throw new Error('arquivo em uso pelo sistema');
      files.delete(this.uri);
    }
  }

  return {
    Directory,
    File,
    Paths: {
      document: new Directory('file:///documents'),
      cache: new Directory('file:///cache'),
      info: (uri) => {
        if (files.has(uri)) return { exists: true, isDirectory: false };
        if (directories.has(uri.replace(/\/+$/, ''))) return { exists: true, isDirectory: true };
        return { exists: false, isDirectory: null };
      },
    },
    __files: files,
    __locked: locked,
    __failMoveFrom: failMoveFrom,
    __failCopyTo: failCopyTo,
    __reset: () => {
      files.clear();
      directories.clear();
      locked.clear();
      failMoveFrom.clear();
      failCopyTo.clear();
    },
  };
});

jest.mock('./services/dev/demoSession', () => ({
  seedDemoOnLaunch: false,
  purgeDemoOnLaunch: false,
  demoPurgeToken: 'delete',
}));

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true, status: 'granted' })),
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true, status: 'granted' })),
  launchCameraAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
}));
