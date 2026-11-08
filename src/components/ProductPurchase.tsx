"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, MessageCircle, Truck } from "lucide-react";
import type { Product } from "@/lib/types";
import { Price } from "./Price";
import { useStore } from "./StoreProvider";
import { Swatches } from "./Swatches";

type Props = {
  product: Product;
  brand: { name: string; slug: string } | null;
  colorIndex: number;
  onColorChange: (index: number) => void;
  compact?: boolean;
};

export function ProductPurchase({ product, brand, colorIndex, onColorChange, compact = false }: Props) {
  const { add, wishlist, toggleWishlist } = useStore();
  const [size, setSize] = useState<string | null>(product.sizes.length === 1 ? product.sizes[0] : null);
  const [error, setError] = useState<string | null>(null);
  const color = product.colors[colorIndex];
  const saved = wishlist.includes(product.id);

  const addToBag = () => {
    if (!size) {
      setError("Please select a size.");
      return;
    }
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      brand: brand?.name ?? "",
      image: color?.image ?? product.images[0] ?? null,
      color: color?.name ?? "-",
      size,
      qty: 1,
      unitPrice: product.salePrice ?? product.price,
    });
    setError(null);
  };

  return (
    <div>
      {brand && (
        <Link href={`/brands/${brand.slug}`} className="text-[13px] font-bold uppercase tracking-[0.14em] text-subtle hover:underline">
          {brand.name}
        </Link>
      )}
      <h1 className={`mt-1.5 font-semibold leading-tight ${compact ? "text-[22px]" : "text-[26px] lg:text-[30px]"}`}>
        {product.name}
      </h1>
      <Price product={product} className="mt-3 text-[20px]" />

      {product.colors.length > 0 && (
        <div className="mt-7">
          <p className="text-[15px]">
            <span className="font-semibold">Colour</span> {color?.name}
          </p>
          <div className="mt-3">
            <Swatches colors={product.colors} selected={colorIndex} onSelect={onColorChange} size="lg" />
          </div>
        </div>
      )}

      <div className="mt-7">
        <div className="flex items-baseline justify-between">
          <p className="text-[15px]">
            <span className="font-semibold">Select Size</span> {size && <span>{size}</span>}
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Size">
          {product.sizes.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={size === s}
              onClick={() => {
                setSize(s);
                setError(null);
              }}
              className={`h-[46px] min-w-[60px] border px-3 text-[15px] ${
                size === s ? "border-black bg-black text-white" : "border-line bg-white hover:border-black"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        {error && (
          <p role="alert" className="mt-3 text-[14px] text-brand">
            {error}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={addToBag}
        className="mt-7 h-[56px] w-full bg-brand text-[14px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-brand-dark"
      >
        Add to Bag
      </button>
      <button
        type="button"
        onClick={() => toggleWishlist(product.id)}
        aria-pressed={saved}
        className="mt-4 flex items-center gap-2 text-[15px] underline-offset-4 hover:underline"
      >
        <Heart className={`size-5 ${saved ? "fill-brand text-brand" : ""}`} strokeWidth={1.5} />
        {saved ? "Saved to Wish List" : "Add to Wish List"}
      </button>

      {!compact && (
        <ul className="mt-8 space-y-4 border-t border-line pt-6 text-[15px]">
          <li className="flex gap-3">
            <Truck className="size-5 shrink-0" strokeWidth={1.4} />
            <span>
              <span className="font-semibold">Ships across Indonesia.</span> Choose your courier and see the cost at checkout.
            </span>
          </li>
          <li className="flex gap-3">
            <MessageCircle className="size-5 shrink-0" strokeWidth={1.4} />
            <span>
              <span className="font-semibold">Checkout via WhatsApp.</span> Confirm stock and pay with our team.
            </span>
          </li>
        </ul>
      )}
    </div>
  );
}
