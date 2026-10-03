export class OcrError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'OcrError';
    this.code = code;
  }
}

const MESSAGES = {
  'invalid-image': 'A imagem selecionada é inválida.',
  unsupported: 'A leitura de texto não está disponível neste ambiente. Use um development build no Android ou iOS, ou preencha os dados manualmente.',
  failed: 'Não foi possível ler o texto desta imagem.',
  timeout: 'A leitura demorou demais. Preencha os dados manualmente ou tente outra foto.',
};

export function ocrError(code) {
  return new OcrError(code, MESSAGES[code] || MESSAGES.failed);
}
