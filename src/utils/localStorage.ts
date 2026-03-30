const LEGACY_PREFIX = 'homepanel_';
const CURRENT_PREFIX = 'aipanel_';

function safelyRead(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safelyWrite(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export function getStorageKey(name: string) {
  return `${CURRENT_PREFIX}${name}`;
}

export function getLegacyStorageKey(name: string) {
  return `${LEGACY_PREFIX}${name}`;
}

export function readMigratedStorageItem(name: string) {
  if (typeof window === 'undefined') return null;

  const currentKey = getStorageKey(name);
  const legacyKey = getLegacyStorageKey(name);
  const currentValue = safelyRead(currentKey);

  if (currentValue !== null) {
    return currentValue;
  }

  const legacyValue = safelyRead(legacyKey);

  if (legacyValue !== null) {
    safelyWrite(currentKey, legacyValue);
  }

  return legacyValue;
}

export function writeStorageItem(name: string, value: string) {
  if (typeof window === 'undefined') return;
  safelyWrite(getStorageKey(name), value);
}

export function removeStorageItem(name: string) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(getStorageKey(name));
    localStorage.removeItem(getLegacyStorageKey(name));
  } catch {
    // ignore
  }
}
