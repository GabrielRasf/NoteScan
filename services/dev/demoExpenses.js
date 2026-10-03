import { readJson, writeJson } from '../storage/jsonStore';
import { STORAGE_KEYS } from '../storage/keys';
import { listExpenses, removeExpense, saveExpense } from '../storage/expensesStore';
import { demoPurgeToken, purgeDemoOnLaunch, seedDemoOnLaunch } from './demoSession';

export const DEMO_ID_PREFIX = 'demo-';

function demoExpense({ id, amount, description, date, category }) {
  return {
    id: `${DEMO_ID_PREFIX}${id}`,
    amount,
    description,
    date,
    category,
    ocrText: null,
    createdAt: `${date}T12:00:00.000Z`,
  };
}

export const demoExpenses = [
  demoExpense({ id: '01', amount: 1450, description: 'Aluguel do apartamento', date: '2026-01-05', category: 'Aluguel ou Financiamento' }),
  demoExpense({ id: '02', amount: 186.4, description: 'Mercado Central', date: '2026-01-08', category: 'Supermercado' }),
  demoExpense({ id: '03', amount: 220, description: 'Posto da avenida', date: '2026-01-15', category: 'Combustível' }),
  demoExpense({ id: '04', amount: 119.9, description: 'Internet residencial', date: '2026-02-05', category: 'Internet e Telefonia' }),
  demoExpense({ id: '05', amount: 92.15, description: 'Hortifruti da Praça', date: '2026-02-12', category: 'Supermercado' }),
  demoExpense({ id: '06', amount: 48.9, description: 'Almoço no centro', date: '2026-02-19', category: 'Restaurantes e Delivery' }),
  demoExpense({ id: '07', amount: 26, description: 'Pedágio', date: '2026-02-28', category: 'Estacionamento e Pedágio' }),
  demoExpense({ id: '08', amount: 151.2, description: 'Bilhete mensal', date: '2026-03-02', category: 'Transporte Público' }),
  demoExpense({ id: '09', amount: 189.73, description: 'Conta de luz', date: '2026-03-11', category: 'Energia' }),
  demoExpense({ id: '10', amount: 63.4, description: 'Farmácia', date: '2026-03-18', category: 'Medicamentos' }),
  demoExpense({ id: '11', amount: 18.5, description: 'Café', date: '2026-03-22', category: 'Lanches e Café' }),
  demoExpense({ id: '12', amount: 99, description: 'Mensalidade da academia', date: '2026-04-01', category: 'Academia' }),
  demoExpense({ id: '13', amount: 39.9, description: 'Assinatura de streaming', date: '2026-04-03', category: 'Streaming e Assinaturas' }),
  demoExpense({ id: '14', amount: 74.5, description: 'Ração', date: '2026-04-09', category: 'Pets' }),
];

export function isDemoExpense(expense) {
  return typeof expense?.id === 'string' && expense.id.startsWith(DEMO_ID_PREFIX);
}

export async function seedDemoExpenses() {
  let latest = await listExpenses();
  if (!latest.ok) return { ok: false, added: 0, value: latest.value };

  for (const expense of demoExpenses) {
    latest = await saveExpense(expense);
    if (!latest.ok) return { ok: false, added: 0, value: latest.value };
  }

  await writeJson(STORAGE_KEYS.devDemoSession, 'active');
  return { ok: true, added: demoExpenses.length, value: latest.value };
}

export async function deleteDemoExpenses() {
  const current = await listExpenses();
  if (!current.ok) return { ok: false, removed: 0, value: current.value };

  const demo = current.value.filter(isDemoExpense);
  let latest = current;
  for (const expense of demo) {
    latest = await removeExpense(expense.id);
    if (!latest.ok) return { ok: false, removed: 0, value: latest.value };
  }

  await writeJson(STORAGE_KEYS.devDemoSession, 'cleared');
  return { ok: true, removed: demo.length, value: latest.value };
}

let purgeInFlight = null;

export async function applyDemoPurge(enabled = purgeDemoOnLaunch, token = demoPurgeToken) {
  if (!__DEV__ || !enabled) return { ok: true, purged: false };
  if (purgeInFlight) return purgeInFlight;

  purgeInFlight = applyDemoPurgeOnce(token).finally(() => {
    purgeInFlight = null;
  });
  return purgeInFlight;
}

async function applyDemoPurgeOnce(token) {
  const done = await readJson(STORAGE_KEYS.devDemoPurge, null);
  if (!done.ok) return { ok: false, purged: false };
  if (done.value === token) return { ok: true, purged: false };

  const removed = await deleteDemoExpenses();
  if (!removed.ok) return { ok: false, purged: false };

  await writeJson(STORAGE_KEYS.devDemoPurge, token);
  return {
    ok: true,
    purged: true,
    removed: removed.removed,
    value: removed.value,
  };
}

let launchInFlight = null;

export async function applyDemoLaunch(enabled = seedDemoOnLaunch) {
  if (!__DEV__ || !enabled) return { ok: true, applied: false };
  if (launchInFlight) return launchInFlight;

  launchInFlight = applyDemoLaunchOnce().finally(() => {
    launchInFlight = null;
  });
  return launchInFlight;
}

async function applyDemoLaunchOnce() {
  const mark = await readJson(STORAGE_KEYS.devDemoSession, null);
  if (!mark.ok) return { ok: false, applied: false };
  if (mark.value === 'active' || mark.value === 'cleared') return { ok: true, applied: false };

  const seeded = await seedDemoExpenses();
  return {
    ok: seeded.ok,
    applied: seeded.ok,
    added: seeded.added,
    value: seeded.value,
  };
}
