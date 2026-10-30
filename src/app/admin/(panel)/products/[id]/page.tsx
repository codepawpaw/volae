import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { readDatabase } from "@/lib/db";
import { ProductForm } from "../../../_components/ProductForm";
import { PageHeader, secondaryButton } from "../../../_components/ui";
import { brandOptions, categoryOptions } from "../category-options";

export const metadata: Metadata = { title: "Edit produk" };

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const { brands, categories, products } = await readDatabase();
  const product = products.find((p) => p.id === id);
  if (!product) notFound();
  return (
    <>
      <PageHeader
        title={`Edit produk`}
        action={
          product.isActive ? (
            <Link href={`/p/${product.slug}`} target="_blank" className={secondaryButton}>
              Lihat di toko
            </Link>
          ) : undefined
        }
      />
      <ProductForm product={product} categories={categoryOptions(categories)} brands={brandOptions(brands)} />
    </>
  );
}
