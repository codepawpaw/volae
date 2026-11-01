"use client";

import { ArrowDown, ArrowUp, X } from "lucide-react";
import { startTransition, useActionState, useState } from "react";
import { MAX_FOOTER_COLUMNS, type Brand, type CategoryNode, type HomeFeatured, type LinkSetting, type Settings } from "@/lib/types";
import { saveHomeSettings } from "../actions";
import { iconButton, LinkListEditor, moveItem } from "./LinkListEditor";
import { Field, FormError, inputClass, primaryButton, secondaryButton } from "./ui";

export type ProductOption = { id: string; name: string; brand: string; isActive: boolean };

type Props = {
  featured: HomeFeatured | undefined;
  /** Saved settings with defaults filled in. A `null` id list means "all" (the default before it was ever saved). */
  settings: Settings;
  tree: CategoryNode[];
  brands: Brand[];
  products: ProductOption[];
  /** Products currently shown as Bestsellers (the badge fallback included). */
  bestsellerIds: string[];
  /** Suggestions for the link URL fields. */
  linkOptions: LinkSetting[];
};

export function HomeSettingsForm({ featured, settings, tree, brands, products, bestsellerIds, linkOptions }: Props) {
  const [state, formAction, pending] = useActionState(saveHomeSettings, null);
  const errors = state?.fieldErrors ?? {};
  const { header, heroLinks, shopByCategory, shopByBrand, homeWhatsNew, bestsellers, footerColumns } = settings;
  const topLevel = tree.map((c) => c.id);
  // Keys keep columns stable while they are added, removed and reordered.
  const [columns, setColumns] = useState(() => footerColumns.map((c, i) => ({ ...c, key: i })));
  const [nextKey, setNextKey] = useState(footerColumns.length);
  const [productQuery, setProductQuery] = useState("");
  const query = productQuery.trim().toLowerCase();

  const categoryTree = (name: string, selected: Iterable<string>) => {
    const picked = new Set(selected);
    const checkbox = (c: CategoryNode, bold: boolean) => (
      <label className={`flex items-center gap-2 text-[14px] ${bold ? "font-semibold" : ""}`}>
        <input type="checkbox" name={name} value={c.id} defaultChecked={picked.has(c.id)} className="size-4 accent-ink" />
        {c.name}
      </label>
    );
    const subtree = (nodes: CategoryNode[]): React.ReactNode =>
      nodes.length > 0 && (
        <div className="space-y-2 pl-6">
          {nodes.map((c) => (
            <div key={c.id} className="space-y-2">
              {checkbox(c, false)}
              {subtree(c.children)}
            </div>
          ))}
        </div>
      );
    return (
      <div className="grid gap-6 rounded-2xl border border-line p-5 sm:grid-cols-2">
        {tree.map((dept) => (
          <div key={dept.id} className="space-y-2">
            {checkbox(dept, true)}
            {subtree(dept.children)}
          </div>
        ))}
      </div>
    );
  };

  const brandsPicked = new Set(shopByBrand.brandIds ?? brands.map((b) => b.id));

  return (
    <form
      // Submitting manually keeps the entered values if the server returns an error.
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="max-w-2xl space-y-10 bg-white p-6 sm:p-8"
    >
      <FormError message={state?.error} />

      <section className="space-y-6">
        <div>
          <h2 className="text-[18px] font-semibold">Menu header</h2>
          <p className="mt-1 text-[14px] text-muted">
            Kategori yang tampil di menu atas, setelah logo. Urutannya mengikuti kolom Urutan di halaman Kategori. Brands
            dan What&apos;s New selalu tampil.
          </p>
        </div>
        <Field
          label="Kategori di header"
          error={errors.headerCategoryIds}
          hint="Kategori yang punya sub-kategori tampil dengan dropdown; yang tidak punya tampil sebagai link biasa."
        >
          {categoryTree("headerCategoryIds", header.categoryIds ?? topLevel)}
        </Field>
      </section>

      <section className="space-y-6 border-t border-line pt-10">
        <div>
          <h2 className="text-[18px] font-semibold">Link di samping banner</h2>
          <p className="mt-1 text-[14px] text-muted">Daftar link di kiri banner beranda, di bawah nama toko.</p>
        </div>
        <Field
          label="Link"
          error={errors.heroLinks}
          hint="Link diawali / untuk halaman toko (mis. /c/women atau /sports), atau https:// untuk situs lain."
        >
          <LinkListEditor links={heroLinks} labelName="heroLabel" hrefName="heroHref" listId="link-options" />
        </Field>
      </section>

      <section className="space-y-6 border-t border-line pt-10">
        <div>
          <h2 className="text-[18px] font-semibold">Carousel produk pertama</h2>
          <p className="mt-1 text-[14px] text-muted">Tampil tepat di bawah banner beranda.</p>
        </div>

        <Field label="Judul" htmlFor="title" error={errors.title}>
          <input id="title" name="title" required maxLength={140} defaultValue={featured?.title} className={inputClass} />
        </Field>

        <Field
          label="Kategori produk"
          error={errors.categoryIds}
          hint="Memilih sebuah kategori ikut menampilkan semua sub-kategorinya. Jika tidak ada yang dipilih (atau kategorinya kosong), tampil 8 produk terbaru."
        >
          {categoryTree("categoryIds", featured?.categoryIds ?? [])}
        </Field>
      </section>

      <section className="space-y-6 border-t border-line pt-10">
        <div>
          <h2 className="text-[18px] font-semibold">Shop by category</h2>
          <p className="mt-1 text-[14px] text-muted">
            Kotak kategori bergambar di beranda. Gambarnya diambil dari gambar kategori, dan urutannya mengikuti kolom
            Urutan di halaman Kategori.
          </p>
        </div>

        <Field label="Judul" htmlFor="shopTitle" error={errors.shopTitle}>
          <input
            id="shopTitle"
            name="shopTitle"
            required
            maxLength={140}
            defaultValue={shopByCategory.title}
            className={inputClass}
          />
        </Field>

        <Field
          label="Kategori"
          error={errors.shopCategoryIds}
          hint="Jika tidak ada yang dipilih, bagian ini disembunyikan dari beranda."
        >
          {categoryTree("shopCategoryIds", shopByCategory.categoryIds ?? topLevel)}
        </Field>
      </section>

      <section className="space-y-6 border-t border-line pt-10">
        <div>
          <h2 className="text-[18px] font-semibold">Shop by brand</h2>
          <p className="mt-1 text-[14px] text-muted">
            Carousel brand bergambar di beranda. Gambarnya diambil dari gambar brand, dan urutannya mengikuti kolom Urutan
            di halaman Brand.
          </p>
        </div>

        <Field label="Judul" htmlFor="brandTitle" error={errors.brandTitle}>
          <input
            id="brandTitle"
            name="brandTitle"
            required
            maxLength={140}
            defaultValue={shopByBrand.title}
            className={inputClass}
          />
        </Field>

        <Field
          label="Brand"
          error={errors.brandIds}
          hint="Jika tidak ada yang dipilih, bagian ini disembunyikan dari beranda."
        >
          <div className="grid gap-2 rounded-2xl border border-line p-5 sm:grid-cols-2">
            {brands.map((b) => (
              <label key={b.id} className="flex items-center gap-2 text-[14px]">
                <input
                  type="checkbox"
                  name="brandIds"
                  value={b.id}
                  defaultChecked={brandsPicked.has(b.id)}
                  className="size-4 accent-ink"
                />
                {b.name}
              </label>
            ))}
            {brands.length === 0 && <p className="text-[14px] text-muted">Belum ada brand.</p>}
          </div>
        </Field>
      </section>

      <section className="space-y-6 border-t border-line pt-10">
        <div>
          <h2 className="text-[18px] font-semibold">Bestsellers</h2>
          <p className="mt-1 text-[14px] text-muted">
            Produk di halaman Bestsellers dan carousel Bestsellers di beranda.
          </p>
        </div>

        <Field label="Judul carousel di beranda" htmlFor="bestsellersTitle" error={errors.bestsellersTitle}>
          <input
            id="bestsellersTitle"
            name="bestsellersTitle"
            required
            maxLength={140}
            defaultValue={bestsellers.title}
            className={inputClass}
          />
        </Field>

        <Field
          label="Produk"
          error={errors.bestsellerIds}
          hint="Jika tidak ada yang dipilih, carousel di beranda disembunyikan dan halaman Bestsellers kosong."
        >
          <div className="space-y-3 rounded-2xl border border-line p-5">
            <input
              type="search"
              aria-label="Cari produk"
              placeholder="Cari produk atau brand…"
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              className={inputClass}
            />
            <div className="max-h-[360px] space-y-2 overflow-y-auto">
              {products.map((p) => (
                <label
                  key={p.id}
                  // Hidden rather than unmounted, so filtered-out picks are still submitted.
                  className={`flex items-center gap-2 text-[14px] ${
                    query && !`${p.name} ${p.brand}`.toLowerCase().includes(query) ? "hidden" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    name="bestsellerIds"
                    value={p.id}
                    defaultChecked={bestsellerIds.includes(p.id)}
                    className="size-4 accent-ink"
                  />
                  <span>
                    {p.name} <span className="text-muted">· {p.brand}</span>
                    {!p.isActive && <span className="text-muted"> (nonaktif)</span>}
                  </span>
                </label>
              ))}
              {products.length === 0 && <p className="text-[14px] text-muted">Belum ada produk.</p>}
            </div>
          </div>
        </Field>
      </section>

      <section className="space-y-6 border-t border-line pt-10">
        <div>
          <h2 className="text-[18px] font-semibold">Carousel What&apos;s New</h2>
          <p className="mt-1 text-[14px] text-muted">
            Carousel terakhir di beranda, berisi produk yang ditandai &quot;New&quot;.
          </p>
        </div>

        <Field label="Judul" htmlFor="whatsNewTitle" error={errors.whatsNewTitle}>
          <input
            id="whatsNewTitle"
            name="whatsNewTitle"
            required
            maxLength={140}
            defaultValue={homeWhatsNew.title}
            className={inputClass}
          />
        </Field>

        <Field
          label="Kategori produk"
          error={errors.whatsNewCategoryIds}
          hint="Memilih sebuah kategori ikut menampilkan semua sub-kategorinya. Jika tidak ada yang dipilih, tampil semua produk baru."
        >
          {categoryTree("whatsNewCategoryIds", homeWhatsNew.categoryIds)}
        </Field>
      </section>

      <section className="space-y-6 border-t border-line pt-10">
        <div>
          <h2 className="text-[18px] font-semibold">Footer</h2>
          <p className="mt-1 text-[14px] text-muted">
            Kolom link di bagian bawah semua halaman toko. Kolom Shop (isinya sama dengan menu header) dan Email Signup
            selalu tampil.
          </p>
        </div>
        <Field
          label="Kolom"
          error={errors.footerColumns}
          hint="Link diawali / untuk halaman toko, atau https:// untuk situs lain (mis. https://wa.me/62… untuk WhatsApp)."
        >
          <div className="space-y-4">
            {columns.map((col, i) => (
              <div key={col.key} className="space-y-4 rounded-2xl border border-line p-5">
                <div className="flex items-center gap-2">
                  <input
                    name="footerTitle"
                    aria-label={`Judul kolom ${i + 1}`}
                    placeholder="Judul kolom"
                    required
                    maxLength={40}
                    defaultValue={col.title}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    aria-label="Naikkan kolom"
                    disabled={i === 0}
                    onClick={() => setColumns((rows) => moveItem(rows, i, i - 1))}
                    className={iconButton}
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Turunkan kolom"
                    disabled={i === columns.length - 1}
                    onClick={() => setColumns((rows) => moveItem(rows, i, i + 1))}
                    className={iconButton}
                  >
                    <ArrowDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Hapus kolom"
                    onClick={() => setColumns((rows) => rows.filter((r) => r.key !== col.key))}
                    className={iconButton}
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <LinkListEditor
                  links={col.links}
                  labelName="footerLabel"
                  hrefName="footerHref"
                  // The column's current position, so links stay with their column after reordering.
                  group={{ name: "footerLinkColumn", value: String(i) }}
                  listId="link-options"
                />
              </div>
            ))}
            {columns.length === 0 && <p className="text-[14px] text-muted">Belum ada kolom.</p>}
            {columns.length < MAX_FOOTER_COLUMNS && (
              <button
                type="button"
                onClick={() => {
                  setColumns((rows) => [...rows, { title: "", links: [], key: nextKey }]);
                  setNextKey((k) => k + 1);
                }}
                className={secondaryButton}
              >
                Tambah kolom
              </button>
            )}
          </div>
        </Field>
      </section>

      <datalist id="link-options">
        {linkOptions.map((o) => (
          <option key={o.href} value={o.href}>
            {o.label}
          </option>
        ))}
      </datalist>

      <div className="pt-2">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Menyimpan…" : "Simpan"}
        </button>
      </div>
    </form>
  );
}
