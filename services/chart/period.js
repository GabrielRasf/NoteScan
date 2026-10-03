const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const ISO_MONTH = /^(\d{4})-(\d{2})-\d{2}$/;

function monthLabel(iso) {
  const match = ISO_MONTH.exec(iso);
  if (!match) return null;
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return `${MONTHS[month - 1]} ${match[1]}`;
}

export function periodLabel(expenses) {
  const dates = (expenses || [])
    .map((expense) => {
      if (typeof expense?.date !== 'string' || !ISO_MONTH.test(expense.date)) return null;
      return monthLabel(expense.date) ? expense.date : null;
    })
    .filter(Boolean)
    .sort();

  if (dates.length === 0) return 'Todos os gastos';
  const first = monthLabel(dates[0]);
  const last = monthLabel(dates[dates.length - 1]);
  return first === last ? first : `${first} – ${last}`;
}
