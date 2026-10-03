export function roundMoney(amount) {
  return Math.round(amount * 100) / 100;
}

export function formatAmountInput(amount) {
  if (amount == null || !Number.isFinite(amount)) return '';
  return amount.toFixed(2).replace('.', ',');
}

export function formatBrl(amount) {
  const negative = amount < 0;
  const [whole, frac] = Math.abs(amount).toFixed(2).split('.');
  const withDots = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negative ? '-' : ''}R$ ${withDots},${frac}`;
}

// Vírgula é o separador decimal. Ponto em grupos de três é milhar:
// `1.234` = 1234 e `1.234,56` = 1234.56. Um ponto com uma ou duas casas
// continua decimal, como já acontecia em `10.50`.
const BR_DECIMAL = /^\d{1,3}(\.\d{3})*,\d{1,2}$|^\d+,\d{1,2}$/;
const BR_THOUSANDS = /^\d{1,3}(\.\d{3})+$/;
const DOT_DECIMAL = /^\d+\.\d{1,2}$/;
const INTEGER = /^\d+$/;

export function parseAmountInput(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return { ok: false, error: 'Informe o valor.' };
  }

  const cleaned = value.trim().replace(/\s/g, '').replace(/^R\$/i, '');
  let normalized = null;

  if (BR_DECIMAL.test(cleaned)) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (BR_THOUSANDS.test(cleaned)) {
    normalized = cleaned.replace(/\./g, '');
  } else if (DOT_DECIMAL.test(cleaned) || INTEGER.test(cleaned)) {
    normalized = cleaned;
  }

  if (normalized == null) {
    return { ok: false, error: 'Informe um valor numérico maior que zero.' };
  }

  const amount = roundMoney(Number(normalized));

  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: 'Informe um valor numérico maior que zero.' };
  }

  return { ok: true, amount };
}

export function extractMoneyFromLine(line) {
  if (typeof line !== 'string') return null;

  const prefixed = line.match(/R\$\s*(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2}|\d+\.\d{2})/i);
  if (prefixed) {
    const parsed = parseAmountInput(prefixed[1]);
    return parsed.ok ? parsed.amount : null;
  }

  const plain = line.match(/(?:^|[^\d.])(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})(?!\d)/);
  if (!plain) return null;
  const parsed = parseAmountInput(plain[1]);
  return parsed.ok ? parsed.amount : null;
}
