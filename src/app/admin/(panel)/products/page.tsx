import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { requireAdmin } from "@/lib/auth";
import { readDatabase } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { deleteProduct } from "../../actions";
import { DeleteButton } from "../../_components/DeleteButton";
import { Notice, PageHeader, inputClass, primaryButton, secondaryButton } from "../../_components/ui";
import { brandOptions, categoryOptions } from "./category-options";

export const metadata: Metadata = { title: "Produk" };

export default async function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  await requireAdmin();
  const params = await searchParams;
  const q = (typeof params.q === "string" ? params.q : "").trim().toLowerCase();
  const brandFilter = typeof params.brand === "string" ? params.brand : "";
  const db = await readDatabase();
  const labels = new Map(categoryOptions(db.categories).map((c) => [c.id, c.label]));
  const brandName = new Map(db.brands.map((b) => [b.id, b.name]));
  const products = [...db.products]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .filter((p) => (!q || p.name.toLowerCase().includes(q)) && (!brandFilter || p.brandId === brandFilter));

  return (
    <>
      <PageHeader
        title="Produk"
        action={
          <Link href="/admin/products/new" className={primaryButton}>
            Tambah produk
          </Link>
        }
      />
      {params.saved && <Notice>Produk berhasil disimpan.</Notice>}
      {params.deleted && <Notice>Produk berhasil dihapus.</Notice>}

      <Form action="/admin/products" className="mb-6 flex max-w-2xl flex-wrap gap-3 sm:flex-nowrap">
        <input name="q" type="search" defaultValue={q} placeholder="Cari nama produk" aria-label="Cari produk" className={inputClass} />
        <select name="brand" defaultValue={brandFilter} aria-label="Filter brand" className={`${inputClass} sm:max-w-[200px]`}>
          <option value="">Semua brand</option>
          {brandOptions(db.brands).map((b) => (
            <option key={b.id} value={b.id}>
              {b.label}
            </option>
          ))}
        </select>
        <button type="submit" className={secondaryButton}>
          Cari
        </button>
      </Form>

      <div className="overflow-x-auto bg-white">
        <table className="w-full min-w-[920px] text-left text-[14px]">
          <thead className="text-[12px] uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="py-3 pl-5 pr-3 font-semibold">Produk</th>
              <th className="px-3 py-3 font-semibold">Brand</th>
              <th className="px-3 py-3 font-semibold">Kategori</th>
              <th className="px-3 py-3 font-semibold">Harga</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="py-3 pl-3 pr-5" />
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-muted">
                  {q ? "Tidak ada produk yang cocok." : "Belum ada produk."}
                </td>
              </tr>
            )}
            {products.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="py-3 pl-5 pr-3">
                  <div className="flex items-center gap-3">
                    <span className="relative size-14 shrink-0 overflow-hidden bg-tile">
                      <ProductImage src={p.images[0]} alt="" sizes="56px" />
                    </span>
                    <span className="max-w-[320px]">{p.name}</span>
                  </div>
                </td>
                <td className="px-3 py-3">{brandName.get(p.brandId) ?? "—"}</td>
                <td className="px-3 py-3 text-muted">{labels.get(p.categoryId) ?? "—"}</td>
                <td className="px-3 py-3">
                  {p.salePrice !== null ? (
                    <>
                      <span className="font-semibold text-brand">{formatPrice(p.salePrice)}</span>
                      <br />
                      <span className="text-[12px] text-muted line-through">{formatPrice(p.price)}</span>
                    </>
                  ) : (
                    formatPrice(p.price)
                  )}
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[12px] ${
                        p.isActive ? "bg-[#e7efec] text-success" : "bg-page text-muted"
                      }`}
                    >
                      {p.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                    {p.isNew && <span className="rounded-full bg-page px-2.5 py-0.5 text-[12px]">What&apos;s New</span>}
                    {p.badge && <span className="rounded-full bg-page px-2.5 py-0.5 text-[12px]">{p.badge}</span>}
                  </div>
                </td>
                <td className="py-3 pl-3 pr-5 text-right">
                  <div className="flex items-start justify-end gap-4">
                    <Link href={`/admin/products/${p.id}`} className="text-[14px] underline">
                      Edit
                    </Link>
                    <DeleteButton id={p.id} action={deleteProduct} confirmText={`Hapus produk "${p.name}"?`} />
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
