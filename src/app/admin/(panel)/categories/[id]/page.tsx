import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { readDatabase } from "@/lib/db";
import { parentOptions } from "../../products/category-options";
import { CategoryForm } from "../../../_components/CategoryForm";
import { PageHeader } from "../../../_components/ui";

export const metadata: Metadata = { title: "Edit kategori" };

export default async function EditCategoryPage({ params }: PageProps<"/admin/categories/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const { categories } = await readDatabase();
  const category = categories.find((c) => c.id === id);
  if (!category) notFound();
  return (
    <>
      <PageHeader title={`Edit kategori: ${category.name}`} />
      <CategoryForm category={category} parents={parentOptions(categories, category.id)} />
    </>
  );
}
