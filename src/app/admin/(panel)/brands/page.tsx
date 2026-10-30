import type { Metadata } from "next";
import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { requireAdmin } from "@/lib/auth";
import { readDatabase } from "@/lib/db";
import { deleteBrand } from "../../actions";
import { DeleteButton } from "../../_components/DeleteButton";
import { Notice, PageHeader, primaryButton } from "../../_components/ui";
import { brandOptions } from "../products/category-options";

export const metadata: Metadata = { title: "Brand" };

export default async function BrandsPage({ searchParams }: PageProps<"/admin/brands">) {
  await requireAdmin();
  const params = await searchParams;
  const db = await readDatabase();
  const order = brandOptions(db.brands).map((o) => o.id);
  const brands = [...db.brands].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  const productCount = (id: string) => db.products.filter((p) => p.brandId === id).length;

  return (
    <>
      <PageHeader
        title="Brand"
        action={
          <Link href="/admin/brands/new" className={primaryButton}>
            Tambah brand
          </Link>
        }
      />
      {params.saved && <Notice>Brand berhasil disimpan.</Notice>}
      {params.deleted && <Notice>Brand berhasil dihapus.</Notice>}

      <div className="overflow-x-auto bg-white">
        <table className="w-full min-w-[720px] text-left text-[14px]">
          <thead className="text-[12px] uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="py-3 pl-5 pr-3 font-semibold">Nama</th>
              <th className="px-3 py-3 font-semibold">URL</th>
              <th className="px-3 py-3 font-semibold">Produk</th>
              <th className="px-3 py-3 font-semibold">Urutan</th>
              <th className="py-3 pl-3 pr-5" />
            </tr>
          </thead>
          <tbody>
            {brands.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-muted">
                  Belum ada brand.
                </td>
              </tr>
            )}
            {brands.map((b) => (
              <tr key={b.id} className="border-t border-line">
                <td className="py-3 pl-5 pr-3">
                  <div className="flex items-center gap-3">
                    <span className="relative size-10 shrink-0 overflow-hidden bg-tile">
                      <ProductImage src={b.logo ?? b.image} alt="" sizes="40px" />
                    </span>
                    <span className="font-semibold">{b.name}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-muted">/brands/{b.slug}</td>
                <td className="px-3 py-3">
                  <Link href={`/admin/products?brand=${b.id}`} className="underline">
                    {productCount(b.id)}
                  </Link>
                </td>
                <td className="px-3 py-3">{b.order}</td>
                <td className="py-3 pl-3 pr-5 text-right">
                  <div className="flex items-start justify-end gap-4">
                    <Link href={`/admin/brands/${b.id}`} className="text-[14px] underline">
                      Edit
                    </Link>
                    <DeleteButton id={b.id} action={deleteBrand} confirmText={`Hapus brand "${b.name}"?`} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
