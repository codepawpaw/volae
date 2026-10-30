"use client";

import Link from "next/link";
import { useEffect } from "react";
import { X } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "./ProductImage";
import { useStore } from "./StoreProvider";

/** lululemon-style confirmation shown after adding to the bag. */
export function AddedToBag() {
  const { justAdded: item, dismissAdded, count, items } = useStore();

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismissAdded();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, dismissAdded]);

  if (!item) return null;
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal aria-labelledby="added-title">
      <div className="absolute inset-0 bg-black/50" onClick={dismissAdded} aria-hidden />
      <div className="relative w-full max-w-[720px] bg-white p-6 sm:p-10">
        <button type="button" onClick={dismissAdded} aria-label="Close" className="absolute right-4 top-4 p-1">
          <X className="size-6" strokeWidth={1.5} />
        </button>
        <h2 id="added-title" className="pr-10 text-[24px] font-semibold sm:text-[28px]">
          Nice pick! You&apos;ve added this to your bag.
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_240px]">
          <div className="flex gap-4">
            <div className="relative aspect-[5/6] w-[110px] shrink-0 bg-tile">
              <ProductImage src={item.image} alt={item.name} sizes="110px" />
            </div>
            <div className="text-[15px] leading-relaxed">
              {item.brand && <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-subtle">{item.brand}</p>}
              <p className="font-semibold">{item.name}</p>
              <p>Colour: {item.color}</p>
              <p>Size: {item.size}</p>
              <p className="mt-1">{formatPrice(item.unitPrice)}</p>
            </div>
          </div>
          <div className="border-line sm:border-l sm:pl-6">
            <p className="flex justify-between text-[15px]">
              <span>Bag ({count} {count === 1 ? "item" : "items"})</span>
            </p>
            <p className="mt-2 flex justify-between text-[15px]">
              <span>Subtotal</span>
              <span className="font-semibold">{formatPrice(subtotal)}</span>
            </p>
            <Link
              href="/cart"
              onClick={dismissAdded}
              className="mt-5 flex h-[52px] items-center justify-center bg-brand text-[13px] font-bold uppercase tracking-[0.14em] text-white hover:bg-brand-dark"
            >
              View Bag &amp; Checkout
            </Link>
            <button type="button" onClick={dismissAdded} className="mt-3 w-full text-center text-[15px] underline underline-offset-4">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
