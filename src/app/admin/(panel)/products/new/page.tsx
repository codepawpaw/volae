import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { readDatabase } from "@/lib/db";
import { ProductForm } from "../../../_components/ProductForm";
import { PageHeader } from "../../../_components/ui";
import { brandOptions, categoryOptions } from "../category-options";

export const metadata: Metadata = { title: "Tambah produk" };

export default async function NewProductPage() {
  await requireAdmin();
  const { brands, categories } = await readDatabase();
  return (
    <>
      <PageHeader title="Tambah produk" />
      {categories.length === 0 || brands.length === 0 ? (
        <p className="bg-white p-6 text-[15px]">
          Buat kategori dan brand dulu sebelum menambah produk.{" "}
          <Link href={categories.length === 0 ? "/admin/categories/new" : "/admin/brands/new"} className="underline">
            {categories.length === 0 ? "Tambah kategori" : "Tambah brand"}
          </Link>
        </p>
      ) : (
        <ProductForm categories={categoryOptions(categories)} brands={brandOptions(brands)} />
      )}
    </>
  );
}
