import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { buildCategoryTree } from "@/lib/catalog";
import { readDatabase } from "@/lib/db";
import { HomeSettingsForm } from "../../_components/HomeSettingsForm";
import { Notice, PageHeader } from "../../_components/ui";

export const metadata: Metadata = { title: "Beranda" };

export default async function HomeSettingsPage({ searchParams }: PageProps<"/admin/home">) {
  await requireAdmin();
  const params = await searchParams;
  const db = await readDatabase();
  return (
    <>
      <PageHeader title="Beranda" />
      {params.saved && <Notice>Pengaturan beranda berhasil disimpan.</Notice>}
      <HomeSettingsForm featured={db.settings.homeFeatured} tree={buildCategoryTree(db.categories)} />
    </>
  );
}
