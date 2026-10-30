import type { Metadata } from "next";
import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { requireAdmin } from "@/lib/auth";
import { buildCategoryTree } from "@/lib/catalog";
import { readDatabase } from "@/lib/db";
import type { Category } from "@/lib/types";
import { deleteCategory } from "../../actions";
import { DeleteButton } from "../../_components/DeleteButton";
import { Notice, PageHeader, primaryButton } from "../../_components/ui";

export const metadata: Metadata = { title: "Kategori" };

export default async function CategoriesPage({ searchParams }: PageProps<"/admin/categories">) {
  await requireAdmin();
  const params = await searchParams;
  const db = await readDatabase();
  const tree = buildCategoryTree(db.categories);
  const productCount = (id: string) => db.products.filter((p) => p.categoryId === id).length;

  const row = (c: Category, isChild: boolean) => (
    <tr key={c.id} className="border-t border-line">
      <td className="py-3 pl-5 pr-3">
        <div className={`flex items-center gap-3 ${isChild ? "pl-8" : ""}`}>
          {!isChild && (
            <span className="relative size-10 shrink-0 overflow-hidden bg-tile">
              <ProductImage src={c.image} alt="" sizes="40px" />
            </span>
          )}
          <span className={isChild ? "" : "font-semibold"}>
            {isChild && <span className="mr-2 text-muted">↳</span>}
            {c.name}
          </span>
        </div>
      </td>
      <td className="px-3 py-3 text-muted">/c/{c.slug}</td>
      <td className="px-3 py-3">{productCount(c.id)}</td>
      <td className="px-3 py-3">{c.order}</td>
      <td className="py-3 pl-3 pr-5 text-right">
        <div className="flex items-start justify-end gap-4">
          <Link href={`/admin/categories/${c.id}`} className="text-[14px] underline">
            Edit
          </Link>
          <DeleteButton id={c.id} action={deleteCategory} confirmText={`Hapus kategori "${c.name}"?`} />
        </div>
      </td>
    </tr>
  );

  return (
    <>
      <PageHeader
        title="Kategori"
        action={
          <Link href="/admin/categories/new" className={primaryButton}>
            Tambah kategori
          </Link>
        }
      />
      {params.saved && <Notice>Kategori berhasil disimpan.</Notice>}
      {params.deleted && <Notice>Kategori berhasil dihapus.</Notice>}

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
            {tree.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-muted">
                  Belum ada kategori.
                </td>
              </tr>
            )}
            {tree.flatMap((c) => [row(c, false), ...c.children.map((child) => row(child, true))])}
          </tbody>
        </table>
      </div>
    </>
  );
}
