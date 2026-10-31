import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { buildCategoryTree, getSettings } from "@/lib/catalog";
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
        headerIds={settings.header.categoryIds}
        heroLinks={settings.heroLinks}
        tree={buildCategoryTree(db.categories)}
        linkOptions={linkOptions}
      />
    </>
  );
}
