import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { BrandForm } from "../../../_components/BrandForm";
import { PageHeader } from "../../../_components/ui";

export const metadata: Metadata = { title: "Tambah brand" };

export default async function NewBrandPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Tambah brand" />
      <BrandForm />
    </>
  );
}
