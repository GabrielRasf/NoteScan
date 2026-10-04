import { readJson, writeJson } from '../storage/jsonStore';
import { STORAGE_KEYS } from '../storage/keys';
import { deleteExpenseAndFiles } from '../expenses/expenseRemoval';
import { listCategories, saveCategories } from '../storage/categoriesStore';
import { listExpenses, saveExpense } from '../storage/expensesStore';
import { demoPurgeToken, purgeDemoOnLaunch, seedDemoOnLaunch } from './demoSession';

export const DEMO_ID_PREFIX = 'demo-';

const DAY_MS = 24 * 60 * 60 * 1000;

// [dias atrás, categoria, descrição, valor]. Só subcategorias de data/categories.js.
const DEMO_ENTRIES = [
  [0, 'Lanches e Café', 'Padaria Pão Quente', 14.9],
  [1, 'Supermercado', 'Mercado Central', 187.43],
  [2, 'Transporte Público', 'Recarga do bilhete', 52.4],
  [3, 'Restaurantes e Delivery', 'Almoço no centro', 42.9],
  [4, 'Combustível', 'Posto Avenida', 238.67],
  [6, 'Medicamentos', 'Farmácia Bem Estar', 37.85],
  [7, 'Aluguel ou Financiamento', 'Aluguel do apartamento', 1450],
  [8, 'Internet e Telefonia', 'Conta de internet', 119.9],
  [9, 'Streaming e Assinaturas', 'Assinatura de streaming', 39.9],
  [11, 'Supermercado', 'Hortifruti da Praça', 63.28],
  [12, 'Cinema, Shows e Eventos', 'Cinema', 61.8],
  [14, 'Energia', 'Conta de luz', 176.54],
  [15, 'Restaurantes e Delivery', 'Pizza delivery', 78.5],
  [17, 'Academia', 'Mensalidade da academia', 109.9],
  [19, 'Lanches e Café', 'Café da manhã', 23.7],
  [21, 'Livros e Materiais', 'Material de estudo', 89.9],
  [23, 'Supermercado', 'Supermercado Bom Preço', 245.12],
  [25, 'Pets', 'Ração', 74.5],
  [28, 'Transporte Público', 'Passagens de metrô', 27.35],
  [31, 'Medicamentos', 'Farmácia Bem Estar', 19.9],
  [33, 'Restaurantes e Delivery', 'Restaurante japonês', 136.4],
  [37, 'Aluguel ou Financiamento', 'Aluguel do apartamento', 1450],
  [38, 'Internet e Telefonia', 'Conta de internet', 119.9],
  [39, 'Streaming e Assinaturas', 'Assinatura de streaming', 39.9],
  [41, 'Supermercado', 'Mercado Central', 312.76],
  [44, 'Energia', 'Conta de luz', 163.21],
  [47, 'Academia', 'Mensalidade da academia', 109.9],
  [50, 'Combustível', 'Posto Avenida', 221.3],
  [53, 'Lanches e Café', 'Lanche da tarde', 8.5],
  [57, 'Cinema, Shows e Eventos', 'Show no parque', 120],
  [61, 'Supermercado', 'Hortifruti da Praça', 58.47],
  [67, 'Aluguel ou Financiamento', 'Aluguel do apartamento', 1450],
  [70, 'Energia', 'Conta de luz', 158.09],
  [74, 'Livros e Materiais', 'Livros da faculdade', 189.9],
  [80, 'Pets', 'Consulta veterinária', 245],
  [86, 'Combustível', 'Posto Avenida', 204.15],
];

export const DEMO_CATEGORIES = [...new Set(DEMO_ENTRIES.map(([, category]) => category))];

function pad(value) {
  return String(value).padStart(2, '0');
}

function localDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Datas relativas ao dia do seed, no fuso do aparelho e nunca depois de `now`.
export function buildDemoExpenses(now = new Date()) {
  return DEMO_ENTRIES.map(([daysAgo, category, description, amount], index) => {
    const moment = new Date(now.getTime());
    moment.setDate(moment.getDate() - daysAgo);
    moment.setHours(8 + (index % 12), (index * 17) % 60, 0, 0);
    if (moment.getTime() > now.getTime()) moment.setTime(now.getTime() - (index + 1) * 60 * 1000);
    return {
      id: `${DEMO_ID_PREFIX}${pad(index + 1)}`,
      amount,
      description,
      date: localDate(moment),
      category,
      ocrText: null,
      receiptImage: null,
      createdAt: moment.toISOString(),
    };
  });
}

export const DEMO_EXPENSE_COUNT = DEMO_ENTRIES.length;

export function isDemoExpense(expense) {
  return typeof expense?.id === 'string' && expense.id.startsWith(DEMO_ID_PREFIX);
}

// A sessão guarda quais preferências o seed marcou, para o reset desmarcar só essas.
async function readSession() {
  const stored = await readJson(STORAGE_KEYS.devDemoSession, null);
  if (!stored.ok) return { ok: false, status: null, addedCategories: [] };
  const value = stored.value;
  if (typeof value === 'string') return { ok: true, status: value, addedCategories: [] };
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return {
      ok: true,
      status: typeof value.status === 'string' ? value.status : null,
      addedCategories: Array.isArray(value.addedCategories)
        ? value.addedCategories.filter((name) => typeof name === 'string')
        : [],
    };
  }
  return { ok: true, status: null, addedCategories: [] };
}

let seedInFlight = null;

export function seedDemoData(options) {
  if (!__DEV__) return Promise.resolve({ ok: false, added: 0, reason: 'unavailable' });
  if (seedInFlight) return seedInFlight;
  seedInFlight = seedDemoDataOnce(options).finally(() => {
    seedInFlight = null;
  });
  return seedInFlight;
}

async function seedDemoDataOnce({ now = new Date() } = {}) {
  const current = await listExpenses();
  if (!current.ok) return { ok: false, added: 0, value: current.value };
  const categories = await listCategories();
  if (!categories.ok) return { ok: false, added: 0, value: current.value };

  if (current.value.some(isDemoExpense)) {
    return { ok: true, added: 0, alreadySeeded: true, value: current.value, categories: categories.value };
  }

  const session = await readSession();
  if (!session.ok) return { ok: false, added: 0, value: current.value };

  const newlySelected = DEMO_CATEGORIES.filter((name) => categories.value[name] !== true);
  const selection = { ...categories.value };
  DEMO_CATEGORIES.forEach((name) => {
    selection[name] = true;
  });
  const savedCategories = await saveCategories(selection);
  if (!savedCategories.ok) return { ok: false, added: 0, value: current.value };
  const addedCategories = [...new Set([...session.addedCategories, ...newlySelected])];
  await writeJson(STORAGE_KEYS.devDemoSession, { status: 'active', addedCategories });

  let latest = current;
  let added = 0;
  for (const expense of buildDemoExpenses(now)) {
    latest = await saveExpense(expense);
    if (!latest.ok) return { ok: false, added, value: latest.value, categories: savedCategories.value };
    added += 1;
  }
  return { ok: true, added, alreadySeeded: false, value: latest.value, categories: savedCategories.value };
}

let resetInFlight = null;

export function resetDemoData() {
  if (resetInFlight) return resetInFlight;
  resetInFlight = resetDemoDataOnce().finally(() => {
    resetInFlight = null;
  });
  return resetInFlight;
}

async function resetDemoDataOnce() {
  const current = await listExpenses();
  if (!current.ok) return { ok: false, removed: 0, value: current.value };

  const demo = current.value.filter(isDemoExpense);
  let latest = current;
  for (const expense of demo) {
    latest = await deleteExpenseAndFiles(expense.id);
    if (!latest.ok) return { ok: false, removed: 0, value: latest.value };
  }

  const session = await readSession();
  const categories = await listCategories();
  let categoryValue = categories.value;
  if (session.ok && categories.ok && session.addedCategories.length > 0) {
    const selection = { ...categories.value };
    session.addedCategories.forEach((name) => {
      delete selection[name];
    });
    const saved = await saveCategories(selection);
    if (!saved.ok) return { ok: false, removed: demo.length, value: latest.value };
    categoryValue = saved.value;
  }

  await writeJson(STORAGE_KEYS.devDemoSession, { status: 'cleared', addedCategories: [] });
  return { ok: true, removed: demo.length, value: latest.value, categories: categoryValue };
}

export const demoExpenses = buildDemoExpenses();
export const seedDemoExpenses = seedDemoData;
export const deleteDemoExpenses = resetDemoData;

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

  const removed = await resetDemoData();
  if (!removed.ok) return { ok: false, purged: false };

  await writeJson(STORAGE_KEYS.devDemoPurge, token);
  return {
    ok: true,
    purged: true,
    removed: removed.removed,
    value: removed.value,
    categories: removed.categories,
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
  const session = await readSession();
  if (!session.ok) return { ok: false, applied: false };
  if (session.status === 'active' || session.status === 'cleared') return { ok: true, applied: false };

  const seeded = await seedDemoData();
  return {
    ok: seeded.ok,
    applied: seeded.ok && seeded.added > 0,
    added: seeded.added,
    value: seeded.value,
    categories: seeded.categories,
  };
}
