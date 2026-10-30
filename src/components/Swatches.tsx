"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductColor } from "@/lib/types";

type Props = {
  colors: ProductColor[];
  selected: number;
  onSelect: (index: number) => void;
  onPreview?: (index: number | null) => void;
  size?: "sm" | "lg";
};

/** Round colour swatches; scrolls with arrows when there are more than fit. */
export function Swatches({ colors, selected, onSelect, onPreview, size = "sm" }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => track.current?.scrollBy({ left: dir * 120, behavior: "smooth" });
  const many = size === "sm" && colors.length > 7;
  const dot = size === "sm" ? "size-[26px]" : "size-[34px]";
  const ring = size === "sm" ? "size-[32px]" : "size-[42px]";

  return (
    <div className="flex items-center" onMouseLeave={() => onPreview?.(null)}>
      {many && (
        <button type="button" onClick={() => scroll(-1)} aria-label="Previous colours" className="-ml-1 shrink-0 text-subtle">
          <ChevronLeft className="size-5" strokeWidth={1.25} />
        </button>
      )}
      <div ref={track} className="no-scrollbar flex min-w-0 gap-[10px] overflow-x-auto py-0.5" role="radiogroup">
        {colors.map((c, i) => (
          <button
            key={c.name + i}
            type="button"
            role="radio"
            aria-checked={i === selected}
            aria-label={c.name}
            title={c.name}
            onClick={() => onSelect(i)}
            onMouseEnter={() => onPreview?.(i)}
            onFocus={() => onPreview?.(i)}
            className={`flex ${ring} shrink-0 items-center justify-center rounded-full border-2 ${
              i === selected ? "border-black" : "border-transparent hover:border-subtle"
            }`}
          >
            <span className={`${dot} rounded-full border border-black/15`} style={{ background: c.hex }} />
          </button>
        ))}
      </div>
      {many && (
        <button type="button" onClick={() => scroll(1)} aria-label="More colours" className="-mr-1 shrink-0">
          <ChevronRight className="size-5" strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}
