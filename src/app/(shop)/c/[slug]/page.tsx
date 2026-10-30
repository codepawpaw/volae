import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListingSkeleton, ListingView } from "@/components/ListingView";
import { categoryScope, getCatalog, parseFilters } from "@/lib/catalog";

export async function generateMetadata({ params }: PageProps<"/c/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { categories } = await getCatalog();
  const category = categories.find((c) => c.slug === slug);
  return category ? { title: category.name, description: category.description } : {};
}

export default function CategoryPage(props: PageProps<"/c/[slug]">) {
  return (
    <Suspense fallback={<ListingSkeleton />}>
      <CategoryListing {...props} />
    </Suspense>
  );
}

async function CategoryListing({ params, searchParams }: PageProps<"/c/[slug]">) {
  const { slug } = await params;
  const catalog = await getCatalog();
  const { categories, products } = catalog;
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const parent = category.parentId ? categories.find((c) => c.id === category.parentId) : undefined;
  const scope = categoryScope(categories, category.id);
  const department = parent ?? category;
  const possessive = department.slug === "women" ? "Women's" : department.slug === "men" ? "Men's" : null;
  const title = parent ? `${possessive ?? parent.name} ${category.name}` : possessive ? `${possessive} Clothes` : category.name;

  return (
    <ListingView
      catalog={catalog}
      title={title}
      description={category.description}
      breadcrumbs={[
        { label: "Home", href: "/" },
        ...(parent ? [{ label: parent.name, href: `/c/${parent.slug}` }] : []),
        { label: category.name },
      ]}
      products={products.filter((p) => scope.has(p.categoryId))}
      filters={parseFilters(await searchParams)}
      hideGroups={parent ? ["category"] : []}
      links={parent ? categories
        .filter((c) => c.parentId === parent.id)
        .map((c) => ({ label: c.name, href: `/c/${c.slug}`, active: c.id === category.id })) : undefined}
    />
  );
}
