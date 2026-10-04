import { isKnownCategory } from '../../data/categories';
import { receiptImageUri } from '../receipts/receiptFiles';
import { formatAmountInput, parseAmountInput } from './money';
import { parseReceiptText } from './parseReceiptText';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function isIsoDate(value) {
  if (!ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function emptyToNull(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function validateExpenseDraft(draft, currentCategory) {
  const errors = {};
  const amountResult = parseAmountInput(draft?.amountText ?? '');
  if (!amountResult.ok) errors.amount = amountResult.error;

  const dateText = draft?.dateText?.trim() ?? '';
  if (dateText && !isIsoDate(dateText)) {
    errors.date = 'Use a data no formato AAAA-MM-DD.';
  }

  if (!isKnownCategory(draft?.category, currentCategory)) {
    errors.category = 'Escolha uma categoria válida.';
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    fields: {
      amount: amountResult.ok ? amountResult.amount : null,
      description: emptyToNull(draft?.description ?? ''),
      date: dateText || null,
      category: draft?.category || null,
      ocrText: emptyToNull(draft?.ocrText ?? ''),
    },
  };
}

export function createExpense(fields, now = new Date(), id = createId()) {
  return {
    id,
    amount: fields.amount,
    description: fields.description,
    date: fields.date,
    category: fields.category,
    ocrText: fields.ocrText,
    receiptImage: null,
    createdAt: now.toISOString(),
  };
}

export function applyExpenseEdits(existing, fields) {
  return {
    ...existing,
    amount: fields.amount,
    description: fields.description,
    date: fields.date,
    category: fields.category,
    ocrText: existing.ocrText ?? null,
  };
}

export function draftFromRecognition({ text, imageUri, imageTempId, contentId, notice }) {
  const parsed = parseReceiptText(text || '');
  const trimmed = typeof text === 'string' ? text.trim() : '';

  return {
    description: parsed.description || '',
    amountText: formatAmountInput(parsed.amount),
    dateText: parsed.date || '',
    category: '',
    ocrText: trimmed || null,
    imageUri: imageUri || null,
    imageTempId: imageTempId || null,
    contentId: contentId || null,
    notice:
      notice ??
      (trimmed ? null : 'Nenhum texto foi reconhecido. Preencha os dados manualmente.'),
  };
}

export function draftFromExpense(expense) {
  return {
    description: expense.description || '',
    amountText: formatAmountInput(expense.amount),
    dateText: expense.date || '',
    category: expense.category,
    ocrText: expense.ocrText,
    imageUri: receiptImageUri(expense.receiptImage),
    notice: null,
  };
}
