"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { ProductImage } from "./ProductImage";
import { ProductPurchase } from "./ProductPurchase";
import { WishlistButton } from "./WishlistButton";

type Props = { product: Product; brand: { name: string; slug: string } | null; initialColor: number };

/** Gallery and purchase panel share the selected colour. */
export function ProductDetail({ product, brand, initialColor }: Props) {
  const [colorIndex, setColorIndex] = useState(initialColor);
  const colorImage = product.colors[colorIndex]?.image ?? null;
  const [picked, setPicked] = useState<string | null>(null);
  const main = picked ?? colorImage ?? product.images[0] ?? null;

  const changeColor = (index: number) => {
    setColorIndex(index);
    setPicked(null);
    // Keep the URL shareable without adding history entries.
    const url = new URL(window.location.href);
    url.searchParams.set("color", product.colors[index]?.name ?? "");
    window.history.replaceState(null, "", url);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-14 xl:grid-cols-[minmax(0,1fr)_480px]">
      <div className="flex flex-col-reverse gap-3 lg:flex-row">
        {product.images.length > 1 && (
          <ul className="no-scrollbar flex gap-3 overflow-x-auto lg:max-h-[760px] lg:w-[84px] lg:shrink-0 lg:flex-col lg:overflow-y-auto">
            {product.images.map((src) => (
              <li key={src} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setPicked(src)}
                  aria-label="Show image"
                  aria-pressed={src === main}
                  className={`relative block aspect-[5/6] w-[72px] bg-tile lg:w-[84px] ${
                    src === main ? "outline outline-2 -outline-offset-2 outline-black" : ""
                  }`}
                >
                  <ProductImage src={src} alt="" sizes="84px" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="relative aspect-[5/6] flex-1 bg-tile lg:max-h-[860px]">
          <ProductImage src={main} alt={product.name} sizes="(min-width: 1024px) 55vw, 100vw" preload />
          <WishlistButton productId={product.id} name={product.name} className="absolute right-4 top-4 size-[40px] shadow-sm" />
          {product.badge && (
            <span className="absolute bottom-4 left-4 rounded-[2px] bg-white px-2.5 py-1 text-[13px] font-medium">
              {product.badge}
            </span>
          )}
        </div>
      </div>
      <div className="lg:sticky lg:top-[96px] lg:self-start">
        <ProductPurchase product={product} brand={brand} colorIndex={colorIndex} onColorChange={changeColor} />
      </div>
    </div>
  );
}
