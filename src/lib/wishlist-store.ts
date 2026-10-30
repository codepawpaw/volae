// Wish list (product ids) stored in localStorage, exposed as an external store for useSyncExternalStore.

const KEY = "volae-wishlist-v1";
const EMPTY: string[] = [];

let cache: string[] = EMPTY;
let cacheRaw: string | null = null;
let storageWorks = true;
const listeners = new Set<() => void>();

function parse(raw: string | null): string[] {
  if (!raw) return EMPTY;
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function getSnapshot(): string[] {
  if (!storageWorks) return cache;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    storageWorks = false;
    return cache;
  }
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    cache = parse(raw);
  }
  return cache;
}

export function getServerSnapshot(): string[] {
  return EMPTY;
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function toggle(productId: string) {
  const current = getSnapshot();
  const next = current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId];
  cache = next;
  cacheRaw = JSON.stringify(next);
  try {
    window.localStorage.setItem(KEY, cacheRaw);
  } catch {
    storageWorks = false; // keep the list in memory for this visit
  }
  listeners.forEach((l) => l());
}
