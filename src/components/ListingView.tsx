import Link from "next/link";
import type { Catalog, ListingFilters } from "@/lib/catalog";
import { SORT_OPTIONS, applyFilters, filterGroups } from "@/lib/catalog";
import { cardBrands } from "@/lib/card-brands";
import type { Product } from "@/lib/types";
import { FilterSidebar, MobileFilters, SortSelect } from "./FilterSidebar";
import { ProductCard } from "./ProductCard";

type Crumb = { label: string; href?: string };

type Props = {
  catalog: Catalog;
  title: string;
  description?: string;
  breadcrumbs: Crumb[];
  products: Product[];
  filters: ListingFilters;
  /** Filter groups to leave out, e.g. "brand" on a brand page. */
  hideGroups?: string[];
  links?: { label: string; href: string; active?: boolean }[];
};

export function ListingView({ catalog, title, description, breadcrumbs, products, filters, hideGroups = [], links }: Props) {
  const groups = filterGroups(catalog, products).filter((g) => !hideGroups.includes(g.key));
  const shown = applyFilters(catalog, products, filters);
  const brands = cardBrands(catalog.brands);
  const appliedCount =
    filters.categories.length + filters.brands.length + filters.sizes.length + filters.colors.length + filters.activities.length;

  return (
    <div className="bg-page">
      <div className="px-5 pb-8 pt-6 sm:px-8 lg:px-14 lg:pb-10">
        <nav aria-label="Breadcrumb" className="text-[13px] text-muted">
          <ol className="flex flex-wrap gap-1.5">
            {breadcrumbs.map((c, i) => (
              <li key={c.label} className="flex gap-1.5">
                {i > 0 && <span aria-hidden>/</span>}
                {c.href ? (
                  <Link href={c.href} className="hover:underline">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-ink">{c.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="mt-5 text-center text-[32px] font-bold tracking-[-0.02em] lg:text-[44px]">{title}</h1>
        {description && <p className="mx-auto mt-3 max-w-[720px] text-center text-[16px] leading-relaxed text-muted">{description}</p>}
        {links && links.length > 0 && (
          <ul className="no-scrollbar mx-auto mt-6 flex max-w-fit gap-2 overflow-x-auto">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`block whitespace-nowrap border px-4 py-2 text-[14px] ${
                    l.active ? "border-black bg-black text-white" : "border-line bg-white hover:border-black"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-6 px-5 pb-20 sm:px-8 lg:px-14">
        <aside className="hidden w-[330px] shrink-0 lg:block">
          <div className="sticky top-[92px] max-h-[calc(100vh-110px)] overflow-y-auto">
            <FilterSidebar groups={groups} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-4 pb-6 lg:justify-end">
            <MobileFilters groups={groups} count={appliedCount} />
            <div className="flex items-center gap-5">
              <p className="text-[15px] font-bold">
                {shown.length} {shown.length === 1 ? "product" : "products"}
              </p>
              <span className="hidden h-6 w-px bg-line sm:block" />
              <SortSelect options={SORT_OPTIONS} value={filters.sort} />
            </div>
          </div>

          {shown.length === 0 ? (
            <div className="bg-white px-6 py-20 text-center">
              <p className="text-[18px] font-semibold">No products match your filters.</p>
              <p className="mt-2 text-muted">Try removing a filter or two.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-12 lg:gap-x-6 xl:grid-cols-3">
              {shown.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  brand={brands[p.brandId] ?? null}
                  preload={i < 3}
                  sizes="(min-width: 1280px) 30vw, 50vw"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ListingSkeleton() {
  return (
    <div className="animate-pulse bg-page px-5 pb-20 pt-6 sm:px-8 lg:px-14">
      <div className="mx-auto mt-10 h-10 w-64 bg-tile" />
      <div className="mt-12 flex gap-6">
        <div className="hidden h-[600px] w-[330px] bg-white lg:block" />
        <div className="grid flex-1 grid-cols-2 gap-6 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="aspect-[5/6] bg-tile" />
          ))}
        </div>
      </div>
    </div>
  );
}
