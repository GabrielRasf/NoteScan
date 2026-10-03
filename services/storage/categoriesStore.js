import { LEGACY_STORAGE_KEYS, STORAGE_KEYS } from './keys';
import { readJson, writeJson } from './jsonStore';

function normalizeSelection(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return Object.fromEntries(
    Object.entries(value).filter(
      ([name, selected]) => typeof name === 'string' && selected === true
    )
  );
}

export async function listCategories() {
  const current = await readJson(STORAGE_KEYS.categories, null);

  if (!current.ok) return { ok: false, value: {} };
  if (!current.empty) {
    const value = normalizeSelection(current.value);
    if (!value) return { ok: false, value: {} };
    return { ok: true, value };
  }

  const legacy = await readJson(LEGACY_STORAGE_KEYS.categories, null);
  if (legacy.empty) return { ok: true, value: {} };
  if (!legacy.ok) return { ok: false, value: {} };

  const value = normalizeSelection(legacy.value);
  if (!value) return { ok: false, value: {} };

  const written = await writeJson(STORAGE_KEYS.categories, value);
  if (!written.ok) return { ok: false, value };
  return { ok: true, value };
}

export async function saveCategories(selection) {
  const value = normalizeSelection(selection);
  if (!value) return { ok: false, value: {} };
  const written = await writeJson(STORAGE_KEYS.categories, value);
  if (!written.ok) return { ok: false, value };
  return { ok: true, value };
}
