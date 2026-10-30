// Cart stored in localStorage, exposed as an external store for useSyncExternalStore.

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  image: string | null;
  color: string;
  size: string;
  qty: number;
  unitPrice: number; // price when added; the cart page re-checks current prices
};

export const MAX_QTY = 10;
const KEY = "volae-cart-v1";
const EMPTY: CartItem[] = [];

let cache: CartItem[] = EMPTY;
let cacheRaw: string | null = null;
let storageWorks = true;
const listeners = new Set<() => void>();

export const itemKey = (i: Pick<CartItem, "productId" | "color" | "size">) =>
  `${i.productId}|${i.color}|${i.size}`;

function isCartItem(v: unknown): v is CartItem {
  const i = v as CartItem;
  return (
    !!i &&
    typeof i.productId === "string" &&
    typeof i.slug === "string" &&
    typeof i.name === "string" &&
    typeof i.brand === "string" &&
    typeof i.color === "string" &&
    typeof i.size === "string" &&
    Number.isInteger(i.qty) &&
    i.qty > 0 &&
    typeof i.unitPrice === "number"
  );
}

function parse(raw: string | null): CartItem[] {
  if (!raw) return EMPTY;
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value.filter(isCartItem) : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function getSnapshot(): CartItem[] {
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

export function getServerSnapshot(): CartItem[] {
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

export function setItems(items: CartItem[]) {
  cache = items;
  cacheRaw = JSON.stringify(items);
  try {
    window.localStorage.setItem(KEY, cacheRaw);
  } catch {
    storageWorks = false; // keep the cart in memory for this visit
  }
  listeners.forEach((l) => l());
}
