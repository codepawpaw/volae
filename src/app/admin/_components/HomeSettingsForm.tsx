"use client";

import { ArrowDown, ArrowUp, X } from "lucide-react";
import { startTransition, useActionState, useState } from "react";
import type { CategoryNode, HomeFeatured, LinkSetting } from "@/lib/types";
import { saveHomeSettings } from "../actions";
import { Field, FormError, inputClass, primaryButton, secondaryButton } from "./ui";

type Props = {
  featured: HomeFeatured | undefined;
  /** `null` means every top-level category (the default before the header was ever saved). */
  headerIds: string[] | null;
  heroLinks: LinkSetting[];
  tree: CategoryNode[];
  /** Suggestions for the hero link URL field. */
  linkOptions: LinkSetting[];
};

export function HomeSettingsForm({ featured, headerIds, heroLinks, tree, linkOptions }: Props) {
  const [state, formAction, pending] = useActionState(saveHomeSettings, null);
  const errors = state?.fieldErrors ?? {};
  const featuredSelected = new Set(featured?.categoryIds ?? []);
  const headerSelected = new Set(headerIds ?? tree.map((c) => c.id));
  // Keys keep inputs stable while rows are added, removed and reordered.
  const [links, setLinks] = useState(() => heroLinks.map((l, i) => ({ ...l, key: i })));
  const [nextKey, setNextKey] = useState(heroLinks.length);

  const move = (from: number, to: number) =>
    setLinks((rows) => {
      const next = [...rows];
      next.splice(to, 0, ...next.splice(from, 1));
      return next;
    });

  const categoryTree = (name: string, selected: Set<string>) => {
    const checkbox = (c: CategoryNode, bold: boolean) => (
      <label className={`flex items-center gap-2 text-[14px] ${bold ? "font-semibold" : ""}`}>
        <input type="checkbox" name={name} value={c.id} defaultChecked={selected.has(c.id)} className="size-4 accent-ink" />
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

  const iconButton = "grid size-9 shrink-0 place-items-center rounded-full border border-line hover:border-black disabled:opacity-30";

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
          {categoryTree("headerCategoryIds", headerSelected)}
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
          <div className="space-y-3">
            {links.map((l, i) => (
              <div key={l.key} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                <input
                  name="heroLabel"
                  aria-label={`Label link ${i + 1}`}
                  placeholder="Label"
                  required
                  maxLength={40}
                  defaultValue={l.label}
                  className={`${inputClass} sm:max-w-[200px]`}
                />
                <input
                  name="heroHref"
                  aria-label={`URL link ${i + 1}`}
                  placeholder="/c/women"
                  required
                  maxLength={300}
                  list="hero-link-options"
                  defaultValue={l.href}
                  className={inputClass}
                />
                <button type="button" aria-label="Naikkan" disabled={i === 0} onClick={() => move(i, i - 1)} className={iconButton}>
                  <ArrowUp className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Turunkan"
                  disabled={i === links.length - 1}
                  onClick={() => move(i, i + 1)}
                  className={iconButton}
                >
                  <ArrowDown className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Hapus link"
                  onClick={() => setLinks((rows) => rows.filter((r) => r.key !== l.key))}
                  className={iconButton}
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
            {links.length === 0 && <p className="text-[14px] text-muted">Belum ada link.</p>}
            {links.length < 10 && (
              <button
                type="button"
                onClick={() => {
                  setLinks((rows) => [...rows, { label: "", href: "", key: nextKey }]);
                  setNextKey((k) => k + 1);
                }}
                className={secondaryButton}
              >
                Tambah link
              </button>
            )}
            <datalist id="hero-link-options">
              {linkOptions.map((o) => (
                <option key={o.href} value={o.href}>
                  {o.label}
                </option>
              ))}
            </datalist>
          </div>
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
          {categoryTree("categoryIds", featuredSelected)}
        </Field>
      </section>

      <div className="pt-2">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Menyimpan…" : "Simpan"}
        </button>
      </div>
    </form>
  );
}
