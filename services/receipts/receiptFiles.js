import { Platform } from 'react-native';

const RECEIPTS_DIR = 'receipts';
const EXTENSIONS = ['jpg', 'jpeg', 'png', 'heic', 'webp'];
const RECEIPT_PATH = /^receipts\/[A-Za-z0-9-]+\.(jpg|jpeg|png|heic|webp)$/;

function loadFileSystem() {
  if (Platform.OS === 'web') return null;
  try {
    return require('expo-file-system');
  } catch (error) {
    return null;
  }
}

function extensionOf(uri) {
  const match = /\.([A-Za-z0-9]+)(?:\?.*)?$/.exec(uri);
  const extension = match ? match[1].toLowerCase() : '';
  return EXTENSIONS.includes(extension) ? extension : 'jpg';
}

export function isReceiptPath(path) {
  return typeof path === 'string' && RECEIPT_PATH.test(path);
}

// O caminho gravado é relativo: no iOS a pasta de documentos muda de endereço entre atualizações.
export function storeReceiptImage(sourceUri, expenseId, fs = loadFileSystem()) {
  if (!fs) return { ok: false, reason: 'unsupported' };
  if (typeof sourceUri !== 'string' || !/^[A-Za-z0-9-]+$/.test(expenseId || '')) {
    return { ok: false, reason: 'failed' };
  }

  const path = `${RECEIPTS_DIR}/${expenseId}.${extensionOf(sourceUri)}`;
  let copying = false;
  try {
    const directory = new fs.Directory(fs.Paths.document, RECEIPTS_DIR);
    directory.create({ intermediates: true, idempotent: true });
    const target = new fs.File(fs.Paths.document, path);
    if (target.exists) target.delete();
    copying = true;
    new fs.File(sourceUri).copy(target);
    if (!target.exists) throw new Error('Cópia não encontrada.');
    return { ok: true, path };
  } catch (error) {
    if (copying) deleteReceiptImage(path, fs);
    return { ok: false, reason: 'failed' };
  }
}

export function receiptImageUri(path, fs = loadFileSystem()) {
  if (!fs || !isReceiptPath(path)) return null;
  try {
    return new fs.File(fs.Paths.document, path).uri;
  } catch (error) {
    return null;
  }
}

export function deleteReceiptImage(path, fs = loadFileSystem()) {
  if (!isReceiptPath(path)) return { ok: true };
  if (!fs) return { ok: false };
  try {
    const file = new fs.File(fs.Paths.document, path);
    if (file.exists) file.delete();
    return { ok: true };
  } catch (error) {
    return { ok: false };
  }
}
