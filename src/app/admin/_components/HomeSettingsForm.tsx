"use client";

import { startTransition, useActionState } from "react";
import type { CategoryNode, HomeFeatured } from "@/lib/types";
import { saveHomeSettings } from "../actions";
import { Field, FormError, inputClass, primaryButton } from "./ui";

type Props = { featured: HomeFeatured | undefined; tree: CategoryNode[] };

export function HomeSettingsForm({ featured, tree }: Props) {
  const [state, formAction, pending] = useActionState(saveHomeSettings, null);
  const errors = state?.fieldErrors ?? {};
  const selected = new Set(featured?.categoryIds ?? []);

  const checkbox = (id: string, name: string, bold: boolean) => (
    <label className={`flex items-center gap-2 text-[14px] ${bold ? "font-semibold" : ""}`}>
      <input type="checkbox" name="categoryIds" value={id} defaultChecked={selected.has(id)} className="size-4 accent-ink" />
      {name}
    </label>
  );

  return (
    <form
      // Submitting manually keeps the entered values if the server returns an error.
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="max-w-2xl space-y-6 bg-white p-6 sm:p-8"
    >
      <div>
        <h2 className="text-[18px] font-semibold">Carousel produk pertama</h2>
        <p className="mt-1 text-[14px] text-muted">Tampil tepat di bawah banner beranda.</p>
      </div>
      <FormError message={state?.error} />

      <Field label="Judul" htmlFor="title" error={errors.title}>
        <input
          id="title"
          name="title"
          required
          maxLength={140}
          defaultValue={featured?.title}
          className={inputClass}
        />
      </Field>

      <Field
        label="Kategori produk"
        error={errors.categoryIds}
        hint="Memilih kategori utama ikut menampilkan semua sub-kategorinya. Jika tidak ada yang dipilih (atau kategorinya kosong), tampil 8 produk terbaru."
      >
        <div className="grid gap-6 rounded-2xl border border-line p-5 sm:grid-cols-2">
          {tree.map((dept) => (
            <div key={dept.id} className="space-y-2">
              {checkbox(dept.id, dept.name, true)}
              <div className="space-y-2 pl-6">{dept.children.map((c) => <div key={c.id}>{checkbox(c.id, c.name, false)}</div>)}</div>
            </div>
          ))}
        </div>
      </Field>

      <div className="pt-2">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Menyimpan…" : "Simpan"}
        </button>
      </div>
    </form>
  );
}
