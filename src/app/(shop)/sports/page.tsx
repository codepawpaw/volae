import type { Metadata } from "next";
import { Suspense } from "react";
import { ListingSkeleton, ListingView } from "@/components/ListingView";
import { site } from "@/config/site";
import { getCatalog, parseFilters } from "@/lib/catalog";

export const metadata: Metadata = { title: "Sports" };

export default function SportsPage(props: PageProps<"/sports">) {
  return (
    <Suspense fallback={<ListingSkeleton />}>
      <SportsListing {...props} />
    </Suspense>
  );
}

/** Every product made for an activity. `?activity=Running` narrows to one sport. */
async function SportsListing({ searchParams }: PageProps<"/sports">) {
  const params = await searchParams;
  const catalog = await getCatalog();
  const filters = parseFilters(params);
  const active = filters.activities.length === 1 ? filters.activities[0] : null;
  return (
    <ListingView
      catalog={catalog}
      title={active ?? "Sports"}
      description="Gear for every activity, from running and training to tennis, golf and yoga."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Sports" }]}
      products={catalog.products.filter((p) => p.activities.length > 0)}
      filters={filters}
      links={[
        { label: "All", href: "/sports", active: filters.activities.length === 0 },
        ...site.activities.map((a) => ({ label: a, href: `/sports?activity=${encodeURIComponent(a)}`, active: a === active })),
      ]}
    />
  );
}
