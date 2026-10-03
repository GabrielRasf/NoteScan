import AsyncStorage from '@react-native-async-storage/async-storage';

export async function readJson(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return { ok: true, empty: true, value: fallback };
    return { ok: true, empty: false, value: JSON.parse(raw) };
  } catch (error) {
    return { ok: false, empty: false, value: fallback };
  }
}

export async function writeJson(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return { ok: true };
  } catch (error) {
    return { ok: false };
  }
}
