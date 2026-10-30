import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

export function Price({ product, className = "" }: { product: Pick<Product, "price" | "salePrice">; className?: string }) {
  if (product.salePrice === null) return <p className={className}>{formatPrice(product.price)}</p>;
  return (
    <p className={`flex flex-wrap items-baseline gap-x-2 ${className}`}>
      <span className="text-brand">{formatPrice(product.salePrice)}</span>
      <span className="text-[0.85em] text-subtle line-through">{formatPrice(product.price)}</span>
    </p>
  );
}
