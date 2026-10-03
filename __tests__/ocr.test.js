import { imageFromPickerResult } from '../services/capture/imageResult';
import { recognizeText } from '../services/ocr/recognizeText';

describe('captura', () => {
  test('cancelamento não produz imagem', () => {
    expect(imageFromPickerResult({ canceled: true, assets: [] })).toEqual({ status: 'canceled' });
    expect(imageFromPickerResult(null)).toEqual({ status: 'canceled' });
  });

  test('rejeita resultado sem endereço de imagem', () => {
    expect(imageFromPickerResult({ canceled: false, assets: [{}] })).toEqual({ status: 'invalid' });
  });

  test('aceita a imagem escolhida', () => {
    expect(imageFromPickerResult({ canceled: false, assets: [{ uri: 'file://nota.jpg' }] })).toEqual({
      status: 'selected',
      uri: 'file://nota.jpg',
    });
  });
});

describe('OCR', () => {
  const uri = 'file://nota.jpg';

  test('devolve o texto reconhecido', async () => {
    await expect(
      recognizeText(uri, {
        deps: {
          isSupported: true,
          extractTextFromImage: async () => ['PADARIA', 'TOTAL R$ 10,00'],
        },
      })
    ).resolves.toEqual({ text: 'PADARIA\nTOTAL R$ 10,00' });
  });

  test('trata texto vazio', async () => {
    await expect(
      recognizeText(uri, {
        deps: { isSupported: true, extractTextFromImage: async () => ['  ', ''] },
      })
    ).resolves.toEqual({ text: '' });
  });

  test('trata erro do leitor', async () => {
    await expect(
      recognizeText(uri, {
        deps: {
          isSupported: true,
          extractTextFromImage: async () => {
            throw new Error('native stack file:///data/user/0/secret');
          },
        },
      })
    ).rejects.toMatchObject({
      code: 'failed',
      message: 'Não foi possível ler o texto desta imagem.',
    });
  });

  test('trata imagem inválida e ambiente sem OCR', async () => {
    await expect(recognizeText('  ')).rejects.toMatchObject({ code: 'invalid-image' });
    await expect(
      recognizeText(uri, { deps: { isSupported: false, extractTextFromImage: async () => ['x'] } })
    ).rejects.toMatchObject({ code: 'unsupported' });
  });

  test('trata tempo esgotado', async () => {
    jest.useFakeTimers();
    const pending = recognizeText(uri, {
      timeoutMs: 1000,
      deps: { isSupported: true, extractTextFromImage: () => new Promise(() => {}) },
    });
    const assertion = expect(pending).rejects.toMatchObject({ code: 'timeout' });
    jest.advanceTimersByTime(1000);
    await assertion;
    jest.useRealTimers();
  });
});
