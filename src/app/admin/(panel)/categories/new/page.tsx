import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { readDatabase } from "@/lib/db";
import { CategoryForm } from "../../../_components/CategoryForm";
import { PageHeader } from "../../../_components/ui";

export const metadata: Metadata = { title: "Tambah kategori" };

export default async function NewCategoryPage() {
  await requireAdmin();
  const { categories } = await readDatabase();
  const parents = categories.filter((c) => c.parentId === null).sort((a, b) => a.order - b.order);
  return (
    <>
      <PageHeader title="Tambah kategori" />
      <CategoryForm parents={parents} hasChildren={false} />
    </>
  );
}
