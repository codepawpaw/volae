import type { Brand } from "./types";

/** Brand info for product cards, keyed by brand id. */
export function cardBrands(brands: Brand[]): Record<string, { name: string; slug: string }> {
  return Object.fromEntries(brands.map((b) => [b.id, { name: b.name, slug: b.slug }]));
}
