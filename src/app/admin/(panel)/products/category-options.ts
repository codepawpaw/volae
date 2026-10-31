import { buildCategoryTree, categoryPath, categoryScope, subtreeHeight } from "@/lib/catalog";
import { MAX_CATEGORY_DEPTH, type Brand, type Category, type CategoryNode } from "@/lib/types";

/** Categories in menu order, labelled "Parent › Child › Grandchild" for select inputs. */
export function categoryOptions(categories: Category[]) {
  const walk = (nodes: CategoryNode[], prefix: string): { id: string; label: string }[] =>
    nodes.flatMap((c) => {
      const label = prefix ? `${prefix} › ${c.name}` : c.name;
      return [{ id: c.id, label }, ...walk(c.children, label)];
    });
  return walk(buildCategoryTree(categories), "");
}

/** Categories that `categoryId` can move under without a cycle or going deeper than MAX_CATEGORY_DEPTH. */
export function parentOptions(categories: Category[], categoryId?: string) {
  const own = categoryId ? categoryScope(categories, categoryId) : new Set<string>();
  const height = categoryId ? subtreeHeight(categories, categoryId) : 0;
  return categoryOptions(categories).filter(
    (o) => !own.has(o.id) && categoryPath(categories, o.id).length + 1 + height <= MAX_CATEGORY_DEPTH,
  );
}

export function brandOptions(brands: Brand[]) {
  return [...brands].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)).map((b) => ({ id: b.id, label: b.name }));
}
