"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/lib/types";
import { ProductCard, type CardBrand } from "./ProductCard";

type Props = { products: Product[]; brands: Record<string, CardBrand> };

// Arrows sit at the middle of the 5:6 images: (width - 3 gaps) / 4 cards * 1.2 / 2.
/** Horizontally scrolling row of product cards with square arrow buttons, as on lululemon.com. */
export function ProductCarousel({ products, brands }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  return (
    <div className="relative @container">
      <div ref={track} className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth">
        {products.map((p) => (
          <div key={p.id} className="w-[72%] shrink-0 snap-start sm:w-[44%] lg:w-[calc((100%-60px)/4)]">
            <ProductCard product={p} brand={brands[p.brandId] ?? null} sizes="(min-width: 1024px) 25vw, 70vw" />
          </div>
        ))}
      </div>
      {products.length > 4 && (
        <>
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Previous products"
            className="absolute left-4 top-[calc((100cqw-60px)*0.15)] hidden size-[48px] -translate-y-1/2 items-center justify-center bg-white shadow-sm lg:flex"
          >
            <ChevronLeft className="size-6" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Next products"
            className="absolute right-4 top-[calc((100cqw-60px)*0.15)] hidden size-[48px] -translate-y-1/2 items-center justify-center bg-white shadow-sm lg:flex"
          >
            <ChevronRight className="size-6" strokeWidth={1.5} />
          </button>
        </>
      )}
    </div>
  );
}
