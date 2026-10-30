import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { readDatabase } from "@/lib/db";
import { BrandForm } from "../../../_components/BrandForm";
import { PageHeader, secondaryButton } from "../../../_components/ui";

export const metadata: Metadata = { title: "Edit brand" };

export default async function EditBrandPage({ params }: PageProps<"/admin/brands/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const { brands } = await readDatabase();
  const brand = brands.find((b) => b.id === id);
  if (!brand) notFound();
  return (
    <>
      <PageHeader
        title="Edit brand"
        action={
          <Link href={`/brands/${brand.slug}`} target="_blank" className={secondaryButton}>
            Lihat di toko
          </Link>
        }
      />
      <BrandForm brand={brand} />
    </>
  );
}
