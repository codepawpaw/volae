"use client";

import Link from "next/link";
import { ProductCard, type CardBrand } from "@/components/ProductCard";
import { useStore } from "@/components/StoreProvider";
import type { Product } from "@/lib/types";

export function WishlistView({ products, brands }: { products: Product[]; brands: Record<string, CardBrand> }) {
  const { wishlist } = useStore();
  const saved = products.filter((p) => wishlist.includes(p.id));

  if (saved.length === 0) {
    return (
      <div className="mx-auto mt-10 max-w-[560px] bg-white px-6 py-14 text-center">
        <p className="text-[18px] font-semibold">Your wish list is empty.</p>
        <p className="mt-2 text-muted">Tap the heart on any product to save it here.</p>
        <Link
          href="/whats-new"
          className="mx-auto mt-8 flex h-[56px] max-w-[300px] items-center justify-center bg-black text-[13px] font-bold uppercase tracking-[0.14em] text-white"
        >
          Shop What&apos;s New
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-4 lg:gap-x-6">
      {saved.map((p) => (
        <ProductCard key={p.id} product={p} brand={brands[p.brandId] ?? null} />
      ))}
    </div>
  );
}
