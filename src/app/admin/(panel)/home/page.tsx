import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { bestsellerProducts, buildCategoryTree, getSettings } from "@/lib/catalog";
import { readDatabase } from "@/lib/db";
import { categoryOptions } from "../products/category-options";
import { HomeSettingsForm } from "../../_components/HomeSettingsForm";
import { Notice, PageHeader } from "../../_components/ui";

export const metadata: Metadata = { title: "Beranda" };

const PAGE_LINKS = [
  { label: "What's New", href: "/whats-new" },
  { label: "Bestsellers", href: "/bestsellers" },
  { label: "We Made Too Much", href: "/sale" },
  { label: "Sports (per aktivitas)", href: "/sports" },
  { label: "Brands", href: "/brands" },
];

export default async function HomeSettingsPage({ searchParams }: PageProps<"/admin/home">) {
  await requireAdmin();
  const params = await searchParams;
  // getSettings fills in the defaults for settings that were never saved.
  const [db, settings] = await Promise.all([readDatabase(), getSettings()]);
  const slugs = new Map(db.categories.map((c) => [c.id, c.slug]));
  const brandNames = new Map(db.brands.map((b) => [b.id, b.name]));
  const linkOptions = [
    ...categoryOptions(db.categories).map((o) => ({ label: o.label, href: `/c/${slugs.get(o.id)}` })),
    ...PAGE_LINKS,
  ];
  return (
    <>
      <PageHeader title="Beranda" />
      {params.saved && <Notice>Pengaturan beranda berhasil disimpan.</Notice>}
      <HomeSettingsForm
        featured={db.settings.homeFeatured}
        settings={settings}
        tree={buildCategoryTree(db.categories)}
        brands={db.brands}
        products={db.products.map((p) => ({
          id: p.id,
          name: p.name,
          brand: brandNames.get(p.brandId) ?? "",
          isActive: p.isActive,
        }))}
        bestsellerIds={bestsellerProducts(db.products, settings.bestsellers.productIds).map((p) => p.id)}
        linkOptions={linkOptions}
      />
    </>
  );
}
