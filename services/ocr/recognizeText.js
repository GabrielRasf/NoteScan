import { ocrError } from './errors';

function loadNativeExtractor() {
  try {
    const native = require('expo-text-extractor');
    if (!native || typeof native.extractTextFromImage !== 'function') {
      return { isSupported: false, extractTextFromImage: async () => [] };
    }
    return {
      isSupported: Boolean(native.isSupported),
      extractTextFromImage: native.extractTextFromImage,
    };
  } catch (error) {
    return { isSupported: false, extractTextFromImage: async () => [] };
  }
}

function withTimeout(promise, timeoutMs) {
  const observed = promise.catch((error) => {
    throw error;
  });
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(ocrError('timeout')), timeoutMs);
    observed.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

export async function recognizeText(uri, options = {}) {
  if (typeof uri !== 'string' || uri.trim() === '') {
    throw ocrError('invalid-image');
  }

  const deps = options.deps || loadNativeExtractor();
  if (!deps.isSupported || typeof deps.extractTextFromImage !== 'function') {
    throw ocrError('unsupported');
  }

  let lines;
  try {
    lines = await withTimeout(
      Promise.resolve(deps.extractTextFromImage(uri)),
      options.timeoutMs ?? 30000
    );
  } catch (error) {
    if (error?.name === 'OcrError') throw error;
    throw ocrError('failed');
  }

  if (!Array.isArray(lines)) throw ocrError('failed');

  const text = lines
    .filter((line) => typeof line === 'string')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');

  return { text };
}
