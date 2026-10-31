import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { readDatabase } from "@/lib/db";
import { parentOptions } from "../../products/category-options";
import { CategoryForm } from "../../../_components/CategoryForm";
import { PageHeader } from "../../../_components/ui";

export const metadata: Metadata = { title: "Tambah kategori" };

export default async function NewCategoryPage() {
  await requireAdmin();
  const { categories } = await readDatabase();
  return (
    <>
      <PageHeader title="Tambah kategori" />
      <CategoryForm parents={parentOptions(categories)} />
    </>
  );
}
