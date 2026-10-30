import { ListingView } from "@/components/ListingView";
import { categoryScope, getCatalog, parseFilters } from "@/lib/catalog";
import type { Product } from "@/lib/types";

export const COLLECTIONS = {
  "whats-new": {
    title: "What's New",
    description: "The latest drops from every brand we carry.",
    match: (p: Product) => p.isNew,
  },
  bestsellers: {
    title: "Bestsellers",
    description: "The styles everyone keeps coming back to.",
    match: (p: Product) => p.badge === "Bestseller",
  },
  sale: {
    title: "We Made Too Much",
    description: "Limited sizes and colours at lower prices. Get them before they're gone.",
    match: (p: Product) => p.salePrice !== null,
  },
} as const;

type Props = {
  kind: keyof typeof COLLECTIONS;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Shared listing for What's New, Bestsellers and Sale. `?dept=men` narrows to one department. */
export async function CollectionListing({ kind, searchParams }: Props) {
  const { title, description, match } = COLLECTIONS[kind];
  const params = await searchParams;
  const catalog = await getCatalog();
  const departments = catalog.categories.filter((c) => c.parentId === null);
  const dept = departments.find((d) => d.slug === params.dept);
  const scope = dept ? categoryScope(catalog.categories, dept.id) : null;
  const products = catalog.products.filter((p) => match(p) && (!scope || scope.has(p.categoryId)));
  const prefix = dept?.slug === "women" ? "Women's " : dept?.slug === "men" ? "Men's " : dept ? `${dept.name} ` : "";

  return (
    <ListingView
      catalog={catalog}
      title={`${prefix}${title}`}
      description={description}
      breadcrumbs={[{ label: "Home", href: "/" }, { label: title }]}
      products={products}
      filters={parseFilters(params)}
      links={[
        { label: "All", href: `/${kind}`, active: !dept },
        ...departments.map((d) => ({ label: d.name, href: `/${kind}?dept=${d.slug}`, active: d.id === dept?.id })),
      ]}
    />
  );
}
