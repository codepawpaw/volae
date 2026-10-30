import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListingSkeleton, ListingView } from "@/components/ListingView";
import { getCatalog, parseFilters } from "@/lib/catalog";

export async function generateMetadata({ params }: PageProps<"/brands/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { brands } = await getCatalog();
  const brand = brands.find((b) => b.slug === slug);
  return brand ? { title: brand.name, description: brand.description } : {};
}

export default function BrandPage(props: PageProps<"/brands/[slug]">) {
  return (
    <Suspense fallback={<ListingSkeleton />}>
      <BrandListing {...props} />
    </Suspense>
  );
}

async function BrandListing({ params, searchParams }: PageProps<"/brands/[slug]">) {
  const { slug } = await params;
  const catalog = await getCatalog();
  const brand = catalog.brands.find((b) => b.slug === slug);
  if (!brand) notFound();

  return (
    <ListingView
      catalog={catalog}
      title={brand.name}
      description={brand.description}
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Brands", href: "/brands" }, { label: brand.name }]}
      products={catalog.products.filter((p) => p.brandId === brand.id)}
      filters={parseFilters(await searchParams)}
      hideGroups={["brand"]}
    />
  );
}
