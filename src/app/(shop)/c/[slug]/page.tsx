import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListingSkeleton, ListingView } from "@/components/ListingView";
import { categoryPath, categoryScope, getCatalog, parseFilters } from "@/lib/catalog";
import type { Category } from "@/lib/types";

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

  const path = categoryPath(categories, category.id);
  const ancestors = path.slice(0, -1);
  const parent = ancestors.at(-1);
  const scope = categoryScope(categories, category.id);
  const department = path[0];
  const possessive = department.slug === "women" ? "Women's" : department.slug === "men" ? "Men's" : null;
  const parentLabel = parent === department ? (possessive ?? parent.name) : parent?.name;
  const title = parent ? `${parentLabel} ${category.name}` : possessive ? `${possessive} Clothes` : category.name;
  const hasChildren = categories.some((c) => c.parentId === category.id);

  // Chips: a group shows its sub-categories, a sub-category shows its siblings.
  const group = hasChildren ? category : parent;
  const chips =
    group && group.parentId
      ? [
          { label: `All ${group.name}`, href: `/c/${group.slug}`, active: group.id === category.id },
          ...childLinks(categories, group.id, category.id),
        ]
      : parent
        ? childLinks(categories, parent.id, category.id)
        : undefined;

  return (
    <ListingView
      catalog={catalog}
      title={title}
      description={category.description}
      breadcrumbs={[
        { label: "Home", href: "/" },
        ...ancestors.map((c) => ({ label: c.name, href: `/c/${c.slug}` })),
        { label: category.name },
      ]}
      products={products.filter((p) => scope.has(p.categoryId))}
      filters={parseFilters(await searchParams)}
      hideGroups={hasChildren ? [] : ["category"]}
      links={chips}
    />
  );
}

function childLinks(categories: Category[], parentId: string, activeId: string) {
  return categories
    .filter((c) => c.parentId === parentId)
    .map((c) => ({ label: c.name, href: `/c/${c.slug}`, active: c.id === activeId }));
}
