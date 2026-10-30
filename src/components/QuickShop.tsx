"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Product } from "@/lib/types";
import { ProductImage } from "./ProductImage";
import { ProductPurchase } from "./ProductPurchase";
import { useStore } from "./StoreProvider";

type Props = {
  product: Product;
  brand: { name: string; slug: string } | null;
  initialColor: number;
  onClose: () => void;
};

export function QuickShop({ product, brand, initialColor, onClose }: Props) {
  const [colorIndex, setColorIndex] = useState(initialColor);
  const { justAdded } = useStore();
  const image = product.colors[colorIndex]?.image ?? product.images[0];

  // The "added to bag" dialog takes over once something is added.
  useEffect(() => {
    if (justAdded) onClose();
  }, [justAdded, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal aria-label={product.name}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative grid max-h-[92vh] w-full max-w-[960px] overflow-y-auto bg-white sm:grid-cols-2">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 z-10 bg-white p-2">
          <X className="size-6" strokeWidth={1.5} />
        </button>
        <div className="relative aspect-[5/6] bg-tile">
          <ProductImage src={image} alt={product.name} sizes="480px" />
        </div>
        <div className="p-6 sm:p-8">
          <ProductPurchase
            product={product}
            brand={brand}
            colorIndex={colorIndex}
            onColorChange={setColorIndex}
            compact
          />
          <Link
            href={`/p/${product.slug}?color=${encodeURIComponent(product.colors[colorIndex]?.name ?? "")}`}
            className="mt-6 inline-block text-[15px] font-semibold underline underline-offset-4"
          >
            View product details
          </Link>
        </div>
      </div>
    </div>
  );
}
