"use client";

import { useEffect } from "react";
import { useStore } from "@/components/StoreProvider";

/** Empties the bag once an order has been paid or is waiting for payment. */
export function ClearCart() {
  const { clear } = useStore();
  useEffect(() => clear(), [clear]);
  return null;
}
