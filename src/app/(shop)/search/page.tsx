import type { Metadata } from "next";
import { Suspense } from "react";
import { ListingSkeleton, ListingView } from "@/components/ListingView";
import { getCatalog, parseFilters, searchProducts } from "@/lib/catalog";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage(props: PageProps<"/search">) {
  return (
    <Suspense fallback={<ListingSkeleton />}>
      <SearchResults {...props} />
    </Suspense>
  );
}

async function SearchResults({ searchParams }: PageProps<"/search">) {
  const params = await searchParams;
  const q = (typeof params.q === "string" ? params.q : "").trim().slice(0, 100);
  const catalog = await getCatalog();
  return (
    <ListingView
      catalog={catalog}
      title={q ? `Results for “${q}”` : "Search"}
      description={q ? undefined : "Search for gear, activities and brands."}
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Search" }]}
      products={searchProducts(catalog, q)}
      filters={parseFilters(params)}
    />
  );
}
