import { ListingView } from "@/components/ListingView";
import { bestsellerProducts, categoryScope, getCatalog, getSettings, parseFilters } from "@/lib/catalog";
import type { Product, Settings } from "@/lib/types";

export const COLLECTIONS = {
  "whats-new": {
    title: "What's New",
    description: "The latest drops from every brand we carry.",
    select: (products: Product[]) => products.filter((p) => p.isNew),
  },
  bestsellers: {
    title: "Bestsellers",
    description: "The styles everyone keeps coming back to.",
    select: (products: Product[], settings: Settings) => bestsellerProducts(products, settings.bestsellers.productIds),
  },
  sale: {
    title: "We Made Too Much",
    description: "Limited sizes and colours at lower prices. Get them before they're gone.",
    select: (products: Product[]) => products.filter((p) => p.salePrice !== null),
  },
} as const;

type Props = {
  kind: keyof typeof COLLECTIONS;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Shared listing for What's New, Bestsellers and Sale. `?dept=men` narrows to one department. */
export async function CollectionListing({ kind, searchParams }: Props) {
  const { title, description, select } = COLLECTIONS[kind];
  const params = await searchParams;
  const [catalog, settings] = await Promise.all([getCatalog(), getSettings()]);
  const departments = catalog.categories.filter((c) => c.parentId === null);
  const dept = departments.find((d) => d.slug === params.dept);
  const scope = dept ? categoryScope(catalog.categories, dept.id) : null;
  const products = select(catalog.products, settings).filter((p) => !scope || scope.has(p.categoryId));
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
