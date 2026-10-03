import { extractMoneyFromLine } from './money';

const DATE_PATTERN = /\b(\d{2})\/(\d{2})\/(\d{4})\b/;
const SUBTOTAL_PATTERN = /sub\s*-?\s*total/i;
const FINAL_TOTAL_PATTERN = /total|valor a pagar|amount due/i;
const SKIPPED_DESCRIPTION = [
  /cupom\s+fiscal/i,
  /documento\s+auxiliar/i,
  /\bnf-?e\b/i,
  /\bdanfe\b/i,
  /\bcnpj\b/i,
  /\bcpf\b/i,
  /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/,
  /\d{3}\.\d{3}\.\d{3}-\d{2}/,
  /\brua\b/i,
  /\bavenida\b/i,
  /\bav\.?\b/i,
  /\bcep\b/i,
  /\btelefone\b/i,
  /\btel\b/i,
  /\(\d{2}\)\s*\d{4,5}/,
  /\bpix\b/i,
  /cart[aã]o/i,
  /cr[eé]dito/i,
  /d[eé]bito/i,
  /\bdinheiro\b/i,
  /\bvisa\b/i,
  /\bmastercard\b/i,
  /\belo\b/i,
  /pagamento/i,
  /obrigad[oa]/i,
  /volte sempre/i,
];

function isoDateFromMatch(day, month, year) {
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

function findDate(lines) {
  for (const line of lines) {
    const match = line.match(DATE_PATTERN);
    if (!match) continue;
    const iso = isoDateFromMatch(match[1], match[2], match[3]);
    if (iso) return iso;
  }
  return null;
}

function isSubtotalLine(line) {
  return SUBTOTAL_PATTERN.test(line);
}

function isFinalTotalLine(line) {
  if (isSubtotalLine(line)) return false;
  return FINAL_TOTAL_PATTERN.test(line);
}

function findAmount(lines) {
  const totalLines = lines.filter(isFinalTotalLine);
  for (let index = totalLines.length - 1; index >= 0; index -= 1) {
    const amount = extractMoneyFromLine(totalLines[index]);
    if (amount != null) return amount;
  }

  const found = lines
    .map((line) => extractMoneyFromLine(line))
    .filter((amount) => amount != null);

  return found.length === 1 ? found[0] : null;
}

function isMerchantCandidate(line) {
  if (line.length > 60) return false;
  if (!/[A-Za-zÀ-ÿ]{3,}/.test(line)) return false;
  if (DATE_PATTERN.test(line)) return false;
  if (extractMoneyFromLine(line) != null) return false;
  if (isSubtotalLine(line) || isFinalTotalLine(line)) return false;
  if (SKIPPED_DESCRIPTION.some((pattern) => pattern.test(line))) return false;
  if (line.replace(/\D/g, '').length >= 8) return false;
  return true;
}

function findDescription(lines) {
  for (const line of lines) {
    if (isSubtotalLine(line) || isFinalTotalLine(line)) break;
    if (extractMoneyFromLine(line) != null) break;
    if (isMerchantCandidate(line)) return line;
  }
  return null;
}

export function parseReceiptText(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { description: null, amount: null, date: null };
  }

  return {
    description: findDescription(lines),
    amount: findAmount(lines),
    date: findDate(lines),
  };
}
