"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import type { Product } from "@/lib/types";
import { Price } from "./Price";
import { ProductImage } from "./ProductImage";
import { QuickShop } from "./QuickShop";
import { Swatches } from "./Swatches";
import { WishlistButton } from "./WishlistButton";

export type CardBrand = { name: string; slug: string } | null;

type Props = { product: Product; brand: CardBrand; sizes?: string; preload?: boolean };

export function ProductCard({ product, brand, sizes = "(min-width: 1024px) 25vw, 50vw", preload }: Props) {
  const [selected, setSelected] = useState(0);
  const [preview, setPreview] = useState<number | null>(null);
  const [quickShop, setQuickShop] = useState(false);
  const closeQuickShop = useCallback(() => setQuickShop(false), []);

  const shown = product.colors[preview ?? selected];
  const image = shown?.image ?? product.images[0];
  const colorName = product.colors[selected]?.name;
  const href = `/p/${product.slug}${colorName ? `?color=${encodeURIComponent(colorName)}` : ""}`;

  return (
    <article className="flex flex-col">
      <div className="relative aspect-[5/6] overflow-hidden bg-tile">
        <Link href={href} aria-label={product.name} className="absolute inset-0">
          <ProductImage src={image} alt={product.name} sizes={sizes} preload={preload} />
        </Link>
        <WishlistButton productId={product.id} name={product.name} className="absolute right-3 top-3 size-[34px] shadow-sm" />
        {product.badge && (
          <span className="pointer-events-none absolute bottom-3 left-3 rounded-[2px] bg-white px-2 py-1 text-[13px] font-medium">
            {product.badge}
          </span>
        )}
      </div>

      {product.colors.length > 0 && (
        <div className="mt-4">
          <Swatches colors={product.colors} selected={selected} onSelect={setSelected} onPreview={setPreview} />
        </div>
      )}

      {brand && <p className="mt-4 text-[12px] font-bold uppercase tracking-[0.14em] text-subtle">{brand.name}</p>}
      <Link href={href} className={`${brand ? "mt-1" : "mt-4"} text-[16px] font-semibold leading-snug hover:underline lg:text-[17px]`}>
        {product.name}
      </Link>
      <Price product={product} className="mt-3 text-[16px] lg:text-[17px]" />
      <button
        type="button"
        onClick={() => setQuickShop(true)}
        className="mt-2.5 flex w-fit items-center gap-2 border-b border-black pb-0.5 text-[16px]"
      >
        <svg viewBox="0 0 24 28" aria-hidden className="h-[18px] w-[16px]">
          <path d="M8 8V6a4 4 0 0 1 8 0v2" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <rect x="2.8" y="8" width="18.4" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
        Quick Shop
      </button>

      {quickShop && <QuickShop product={product} brand={brand} initialColor={selected} onClose={closeQuickShop} />}
    </article>
  );
}
