"use client";

import { createContext, use, useCallback, useMemo, useState, useSyncExternalStore } from "react";
import * as cartStore from "@/lib/cart-store";
import { MAX_QTY, itemKey, type CartItem } from "@/lib/cart-store";
import * as wishlistStore from "@/lib/wishlist-store";

type StoreContextValue = {
  items: CartItem[];
  count: number;
  add: (item: CartItem) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  /** The item just added, shown in the "added to your bag" dialog. */
  justAdded: CartItem | null;
  dismissAdded: () => void;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

/** Shopping bag and wish list, both kept in the browser. */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getServerSnapshot);
  const wishlist = useSyncExternalStore(
    wishlistStore.subscribe,
    wishlistStore.getSnapshot,
    wishlistStore.getServerSnapshot,
  );
  const [justAdded, setJustAdded] = useState<CartItem | null>(null);

  const add = useCallback((item: CartItem) => {
    const current = cartStore.getSnapshot();
    const key = itemKey(item);
    const existing = current.find((i) => itemKey(i) === key);
    cartStore.setItems(
      existing
        ? current.map((i) => (itemKey(i) === key ? { ...item, qty: Math.min(MAX_QTY, i.qty + item.qty) } : i))
        : [...current, { ...item, qty: Math.min(MAX_QTY, item.qty) }],
    );
    setJustAdded(item);
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    const clamped = Math.max(1, Math.min(MAX_QTY, Math.floor(qty)));
    cartStore.setItems(cartStore.getSnapshot().map((i) => (itemKey(i) === key ? { ...i, qty: clamped } : i)));
  }, []);

  const remove = useCallback((key: string) => {
    cartStore.setItems(cartStore.getSnapshot().filter((i) => itemKey(i) !== key));
  }, []);

  const clear = useCallback(() => cartStore.setItems([]), []);
  const dismissAdded = useCallback(() => setJustAdded(null), []);

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((sum, i) => sum + i.qty, 0),
      add,
      setQty,
      remove,
      clear,
      justAdded,
      dismissAdded,
      wishlist,
      toggleWishlist: wishlistStore.toggle,
    }),
    [items, add, setQty, remove, clear, justAdded, dismissAdded, wishlist],
  );

  return <StoreContext value={value}>{children}</StoreContext>;
}

export function useStore() {
  const ctx = use(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
