import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { site } from "@/config/site";
import { listBrands, listCategories, listProducts, readSettings } from "./db";
import { whatsappLink } from "./whatsapp";
import type { Brand, Category, CategoryNode, Product, Settings } from "./types";

export const CATALOG_TAG = "catalog";

export type Catalog = { brands: Brand[]; categories: Category[]; products: Product[] };

/** Public catalog (active products only). Cached until an admin change calls updateTag(CATALOG_TAG). */
export async function getCatalog(): Promise<Catalog> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("max");
  const [brands, categories, products] = await Promise.all([listBrands(), listCategories(), listProducts()]);
  return {
    brands: brands.sort(byOrder),
    categories: categories.sort(byOrder),
    products: products.filter((p) => p.isActive),
  };
}

const DEFAULT_SETTINGS: Settings = {
  homeFeatured: { title: "Cold snaps, rainy days, windy runs. There’s outerwear for it all.", categoryIds: [] },
  header: { categoryIds: null },
  heroLinks: site.heroLinks.map((l) => ({ ...l })),
  shopByCategory: { title: "Shop by category", categoryIds: null },
  shopByBrand: { title: "Shop by brand", brandIds: null },
  homeWhatsNew: { title: "Just dropped: what’s new.", categoryIds: [] },
  bestsellers: { title: "Bestsellers you keep coming back to.", productIds: null },
  footerColumns: defaultFooterColumns(),
};

function defaultFooterColumns(): Settings["footerColumns"] {
  const help = whatsappLink(`Halo ${site.brandName}, saya butuh bantuan.`);
  return [
    {
      title: "Help",
      links: [
        { label: "Chat on WhatsApp", href: help },
        { label: "Track Order & Return", href: help },
        { label: "Shopping Bag", href: "/cart" },
        { label: "Wish List", href: "/wishlist" },
      ],
    },
    {
      title: "About Us",
      links: [
        { label: "Our Brands", href: "/brands" },
        { label: "What's New", href: "/whats-new" },
        { label: "Bestsellers", href: "/bestsellers" },
        { label: "We Made Too Much", href: "/sale" },
      ],
    },
    {
      title: "Follow Us",
      links: Object.entries(site.social).map(([name, href]) => ({
        label: name === "tiktok" ? "TikTok" : name === "youtube" ? "YouTube" : name[0].toUpperCase() + name.slice(1),
        href,
      })),
    },
  ];
}

/** Storefront settings edited in Admin → Beranda. Shares the catalog cache tag. */
export async function getSettings(): Promise<Settings> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("max");
  return { ...DEFAULT_SETTINGS, ...(await readSettings()) };
}

function byOrder(a: { order: number; name: string }, b: { order: number; name: string }) {
  return a.order - b.order || a.name.localeCompare(b.name);
}

export function buildCategoryTree(categories: Category[], parentId: string | null = null): CategoryNode[] {
  return categories
    .filter((c) => c.parentId === parentId)
    .sort(byOrder)
    .map((c) => ({ ...c, children: buildCategoryTree(categories, c.id) }));
}

/** Every node of the tree, parents before their children. */
export function flattenTree(tree: CategoryNode[]): CategoryNode[] {
  return tree.flatMap((c) => [c, ...flattenTree(c.children)]);
}

/** The categories picked in Admin → Beranda (header menu, Shop by category), or every department by default. */
export function pickedCategories(tree: CategoryNode[], categoryIds: string[] | null): CategoryNode[] {
  if (!categoryIds) return tree;
  const picked = new Set(categoryIds);
  return flattenTree(tree).filter((c) => picked.has(c.id));
}

/** The Bestsellers products: picked in Admin → Beranda, or those badged "Bestseller" until that was saved. */
export function bestsellerProducts(products: Product[], productIds: string[] | null): Product[] {
  if (!productIds) return products.filter((p) => p.badge === "Bestseller");
  const picked = new Set(productIds);
  return products.filter((p) => picked.has(p.id));
}

/** The category plus all its descendant ids. */
export function categoryScope(categories: Category[], categoryId: string): Set<string> {
  const scope = new Set([categoryId]);
  for (const id of scope) {
    for (const c of categories) if (c.parentId === id) scope.add(c.id);
  }
  return scope;
}

/** Ancestors from the department down to the category itself. */
export function categoryPath(categories: Category[], categoryId: string): Category[] {
  const path: Category[] = [];
  let category = categories.find((c) => c.id === categoryId);
  while (category && !path.includes(category)) {
    path.unshift(category);
    category = categories.find((c) => c.id === category!.parentId);
  }
  return path;
}

/** Top-level category ("department") a category belongs to. */
export function departmentOf(categories: Category[], categoryId: string): Category | undefined {
  return categoryPath(categories, categoryId)[0];
}

/** Number of levels below a category: 0 for a leaf, 1 if it only has children, and so on. */
export function subtreeHeight(categories: Category[], categoryId: string): number {
  const children = categories.filter((c) => c.parentId === categoryId);
  return children.length ? 1 + Math.max(...children.map((c) => subtreeHeight(categories, c.id))) : 0;
}

export type SortKey = "featured" | "newest" | "price-asc" | "price-desc";
export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "New Arrivals" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

export type ListingFilters = {
  sort: SortKey;
  categories: string[];
  brands: string[];
  sizes: string[];
  colors: string[];
  activities: string[];
};

type RawSearchParams = Record<string, string | string[] | undefined>;

function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return (Array.isArray(value) ? value : [value]).filter(Boolean);
}

export function parseFilters(params: RawSearchParams): ListingFilters {
  const sort = toArray(params.sort)[0];
  return {
    sort: SORT_OPTIONS.some((o) => o.value === sort) ? (sort as SortKey) : "featured",
    categories: toArray(params.category),
    brands: toArray(params.brand),
    sizes: toArray(params.size),
    colors: toArray(params.color).map((c) => c.toLowerCase()),
    activities: toArray(params.activity),
  };
}

export function effectivePrice(p: Product): number {
  return p.salePrice ?? p.price;
}

export function applyFilters(catalog: Catalog, products: Product[], filters: ListingFilters): Product[] {
  const categoryIds = new Set(
    catalog.categories.filter((c) => filters.categories.includes(c.slug)).map((c) => c.id),
  );
  const brandIds = new Set(catalog.brands.filter((b) => filters.brands.includes(b.slug)).map((b) => b.id));
  const result = products.filter(
    (p) =>
      (filters.categories.length === 0 || categoryIds.has(p.categoryId)) &&
      (filters.brands.length === 0 || brandIds.has(p.brandId)) &&
      (filters.sizes.length === 0 || p.sizes.some((s) => filters.sizes.includes(s))) &&
      (filters.colors.length === 0 || p.colors.some((c) => filters.colors.includes(c.name.toLowerCase()))) &&
      (filters.activities.length === 0 || p.activities.some((a) => filters.activities.includes(a))),
  );
  if (filters.sort === "featured") result.sort((a, b) => Number(!!b.badge) - Number(!!a.badge));
  if (filters.sort === "price-asc") result.sort((a, b) => effectivePrice(a) - effectivePrice(b));
  if (filters.sort === "price-desc") result.sort((a, b) => effectivePrice(b) - effectivePrice(a));
  return result;
}

export type FilterOption = { value: string; label: string; count: number; hex?: string };
export type FilterGroup = { key: string; label: string; options: FilterOption[] };

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "One Size"];
const sizeRank = (s: string) => (SIZE_ORDER.includes(s) ? SIZE_ORDER.indexOf(s) : 100);

function countBy<T>(products: Product[], keys: (p: Product) => T[], id: (k: T) => string) {
  const counts = new Map<string, { item: T; count: number }>();
  for (const p of products) {
    for (const key of new Map(keys(p).map((k) => [id(k), k])).values()) {
      const entry = counts.get(id(key));
      if (entry) entry.count += 1;
      else counts.set(id(key), { item: key, count: 1 });
    }
  }
  return [...counts.values()];
}

/** Filter groups for the sidebar, built from the products on the page. */
export function filterGroups(catalog: Catalog, products: Product[]): FilterGroup[] {
  const categoryById = new Map(catalog.categories.map((c) => [c.id, c]));
  const brandById = new Map(catalog.brands.map((b) => [b.id, b]));

  const groups: FilterGroup[] = [
    {
      key: "category",
      label: "Category",
      options: countBy(products, (p) => [p.categoryId], (id) => id)
        .map(({ item, count }) => categoryById.get(item) && { category: categoryById.get(item)!, count })
        .filter((x) => !!x)
        .sort((a, b) => a.category.order - b.category.order)
        .map(({ category, count }) => ({ value: category.slug, label: category.name, count })),
    },
    {
      key: "brand",
      label: "Brand",
      options: countBy(products, (p) => [p.brandId], (id) => id)
        .map(({ item, count }) => brandById.get(item) && { brand: brandById.get(item)!, count })
        .filter((x) => !!x)
        .sort((a, b) => a.brand.order - b.brand.order)
        .map(({ brand, count }) => ({ value: brand.slug, label: brand.name, count })),
    },
    {
      key: "size",
      label: "Size",
      options: countBy(products, (p) => p.sizes, (s) => s)
        .sort((a, b) => sizeRank(a.item) - sizeRank(b.item) || a.item.localeCompare(b.item, undefined, { numeric: true }))
        .map(({ item, count }) => ({ value: item, label: item, count })),
    },
    {
      key: "color",
      label: "Colour",
      options: countBy(products, (p) => p.colors, (c) => c.name.toLowerCase())
        .sort((a, b) => a.item.name.localeCompare(b.item.name))
        .map(({ item, count }) => ({ value: item.name.toLowerCase(), label: item.name, count, hex: item.hex })),
    },
    {
      key: "activity",
      label: "Activity",
      options: countBy(products, (p) => p.activities, (a) => a)
        .sort((a, b) => a.item.localeCompare(b.item))
        .map(({ item, count }) => ({ value: item, label: item, count })),
    },
  ];
  return groups.filter((g) => g.options.length > 0);
}

export function searchProducts(catalog: Catalog, query: string) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  const categoryName = new Map(catalog.categories.map((c) => [c.id, c.name]));
  const brandName = new Map(catalog.brands.map((b) => [b.id, b.name]));
  return catalog.products.filter((p) => {
    const haystack = [
      p.name,
      p.description,
      categoryName.get(p.categoryId) ?? "",
      brandName.get(p.brandId) ?? "",
      ...p.activities,
      ...p.colors.map((c) => c.name),
    ]
      .join(" ")
      .toLowerCase();
    return terms.every((t) => haystack.includes(t));
  });
}
